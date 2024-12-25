const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
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
      where: { id: Number(postId) }
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
    });

    console.log('Booking created successfully:', booking);
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
};
