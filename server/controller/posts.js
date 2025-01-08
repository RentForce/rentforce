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
require('dotenv').config();
const createBooking = async (req, res) => {
  try {
    const { 
      userId, 
      postId, 
      startDate, 
      endDate, 
      numberOfGuests, 
      totalPrice,
      guestName,
      guestCountry,
      propertyDetails 
    } = req.body;

    console.log('Received booking request:', {
      userId,
      postId,
      startDate,
      endDate,
      numberOfGuests,
      totalPrice
    });

    // Validate required fields
    if (!userId || !postId || !startDate || !endDate || !numberOfGuests || !totalPrice) {
      return res.status(400).json({
        message: "Missing required fields",
        received: { userId, postId, startDate, endDate, numberOfGuests, totalPrice }
      });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
      include: { user: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check for existing bookings
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
        guestName,
        guestCountry,
        propertyDetails: propertyDetails ? JSON.stringify(propertyDetails) : null
      },
      include: {
        user: true,
        post: true,
      },
    });

    // Check if booking.user is defined
    if (!booking.user) {
      throw new Error("Booking user information is missing");
    }

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
    console.error("Detailed booking error:", error);
    res.status(500).json({ 
      message: "Error creating booking",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
  try {
    const { category, search, price, location, title } = req.query;
    
    // Add logging to debug the query parameters
    console.log("Query parameters:", { category, search, price, location, title });

    // Validate and parse price if provided
    let parsedPrice = null;
    if (price) {
      parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ message: "Invalid price parameter" });
      }
    }

    const whereClause = {
      status: 'APPROVED',
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(parsedPrice && { price: { lte: parsedPrice } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(title && { title: { contains: title, mode: 'insensitive' } }),
    };

    // Log the where clause for debugging
    console.log("Where clause:", whereClause);

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        images: true,
        map: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${posts.length} posts`);
    res.json(posts);
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).json({
      message: "Error fetching posts",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Save images for a post
const saveImage = async (req, res) => {
  const { postId, url } = req.body;
  try {
    const image = await prisma.image.create({
      data: {
        url,
        postId: Number(postId),
      },
    });
    res.status(201).json(image);
  } catch (error) {
    console.error("Error saving image:", error);
    res.status(500).json({ message: "Error saving image" });
  }
};

// Save location for a post
const saveLocation = async (req, res) => {
  const { postId, latitude, longitude } = req.body;
  try {
    const map = await prisma.map.create({
      data: {
        postId: Number(postId),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });
    res.status(201).json(map);
  } catch (error) {
    console.error("Error saving location:", error);
    res.status(500).json({ message: "Error saving location" });
  }}
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

  getBookedDates,
  checkDateAvailability,
  saveImage,
  saveLocation,
  checkUserBooking,
  getBookedDates,
  checkDateAvailability,
  getPostComments,
  addComment,
  authenticateToken,
};
