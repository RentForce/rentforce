const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Received Authorization Header:', authHeader);
    console.log('Extracted Token:', token);

    if (token == null) {
        return res.status(401).json({ 
            message: 'No token provided', 
            details: 'Authorization header is missing or incorrectly formatted' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token Verification Error:', err);
            return res.status(403).json({ 
                message: 'Invalid or expired token', 
                error: err.message 
            });
        }
        req.user = user; 
        next();
    });
};
const { createNotification } = require("./notification");

const createBooking = async (req, res) => {
  try {
    const { userId, postId, startDate, endDate, numberOfGuests, totalPrice } =
      req.body;

    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
      include: { user: true },
    });

    const existingBookings = await prisma.booking.findMany({
      where: {
        postId: Number(postId),
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } },
            ],
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } },
            ],
          },
        ],
      },
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({
        message: "Selected dates are not available",
        conflictingBookings: existingBookings,
      });
    }

    // Create new booking
    const booking = await prisma.booking.create({
      data: {
        userId: Number(userId),
        postId: Number(postId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        numberOfGuests: Number(numberOfGuests),
        totalPrice: Number(totalPrice),
        status: "PENDING",
      },
      include: {
        user: true,
        post: true,
      },
    });

    // Create notification for the host
    const notification = await createNotification(
      req,
      "BOOKING_REQUEST",
      `New booking request from ${booking.user.firstName} for ${post.title}`,
      post.user.id,
      booking.id
    );

    // Emit real-time notification using socket.io
    if (req.io) {
      console.log("Emitting notification to host:", post.user.id); // Debug log
      req.io.to(`notification-${post.user.id}`).emit("new_notification", {
        type: "BOOKING_REQUEST",
        message: `New booking request from ${booking.user.firstName} for ${post.title}`,
        userId: post.user.id,
        bookingId: booking.id,
        booking: booking,
        id: notification.id,
        isRead: false,
        createdAt: new Date(),
      });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Error creating booking" });
  }
};

// Get bookings for a specific post
const getPostBookings = async (req, res) => {
  try {
    const { postId } = req.params;

    const bookings = await prisma.booking.findMany({
      where: {
        postId: parseInt(postId),
        NOT: {
          status: "CANCELLED",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching post bookings:", error);
    res.status(500).json({
      message: "Error retrieving bookings",
      error: error.message,
    });
  }
};

const getPostsByCategory = async (req, res) => {
  const { category } = req.params;
  const { search, price, location, title } = req.query;

  try {
    console.log("Category:", category);
    console.log("Search query:", search);

    const posts = await prisma.post.findMany({
      where: {
        ...(category !== "all" && { category: category }),
        ...(search && {
          OR: [
            { title: { contains: search } },
            { location: { contains: search } },
            { description: { contains: search } },
          ],
        }),
        ...(price && { price: { lte: parseFloat(price) } }),
        ...(location && { location: { contains: location } }),
        ...(title && { title: { contains: title } }),
      },
      include: {
        images: true,
        map: true,
      },
    });

    console.log("Found posts:", posts.length);

    res.json(posts);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

const getImagesByPostId = async (req, res) => {
  try {
    const { postId } = req.params;

    const images = await prisma.image.findMany({
      where: {
        postId: parseInt(postId),
      },
    });

    if (!images || images.length === 0) {
      return res.status(404).json({ message: "No images found for this post" });
    }

    res.status(200).json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res
      .status(500)
      .json({ message: "Error fetching images", error: error.message });
  }
};

// get booked dates for a post
const getBookedDates = async (req, res) => {
  const { postId } = req.params;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        postId: Number(postId),
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
      select: {
        startDate: true,
        endDate: true,
        status: true,
        postId: true, // Add postId to verify the filtering
      },
    });

    // Return the bookings array directly
    res.status(200).json(bookings);
  } catch (error) {
    console.error(`Error fetching booked dates for post ${postId}:`, error);
    res.status(500).json({
      message: "Error fetching booked dates",
      error: error.message,
    });
  }
};

const checkDateAvailability = async (req, res) => {
  const { postId, startDate, endDate } = req.query;

  try {
    const existingBookings = await prisma.booking.findMany({
      where: {
        postId: Number(postId),
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } },
            ],
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } },
            ],
          },
        ],
      },
    });

    const isAvailable = existingBookings.length === 0;

    res.status(200).json({
      available: isAvailable,
      conflictingBookings: isAvailable ? [] : existingBookings,
    });
  } catch (error) {
    console.error("Error checking date availability:", error);
    res.status(500).json({ message: "Error checking date availability" });
  }
};

const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const comments = await prisma.comment.findMany({
      where: {
        postId: parseInt(postId),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

const addComment = async (req, res) => {
  try {
    const { content, rating } = req.body;
    const { postId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const comment = await prisma.comment.create({
      data: {
        content,
        rating,
        userId: parseInt(userId),
        postId: parseInt(postId),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      message: 'Failed to add comment', 
      error: error.message 
    });
  }
};
const checkUserBooking = async (req, res) => {
  try {
    const { postId, userId } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        postId: parseInt(postId),
        userId: parseInt(userId),
        status: 'CONFIRMED', // Only consider confirmed bookings

      }
    });

    res.json({
      hasBooked: !!booking
    });
  } catch (error) {
    console.error('Error checking user booking:', error);
    res.status(500).json({ 
      message: 'Failed to check booking status', 
      error: error.message 
    });
  }
};

module.exports = {
  getPostsByCategory,
  getImagesByPostId,
  createBooking,
  getPostBookings,
  checkUserBooking,
  getBookedDates,
  checkDateAvailability,
  getPostComments,
  addComment,
  authenticateToken,
};
