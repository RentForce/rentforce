const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

const prisma = new PrismaClient({});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Received Authorization Header:", authHeader);
  console.log("Extracted Token:", token);

  if (token == null) {
    return res.status(401).json({
      message: "No token provided",
      details: "Authorization header is missing or incorrectly formatted",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token Verification Error:", err);
      return res.status(403).json({
        message: "Invalid or expired token",
        error: err.message,
      });
    }
    req.user = user;
    next();
  });
};

const validatePassword = (password) => {
  const errors = [];
  const passwordChecking =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

  if (password.length < 8) {
    errors.push("Password must contain at least 8 characters.");
  }
  if (!passwordChecking.test(password)) {
    errors.push(
      "Password must contain at least one upper case, one lower case, and one symbol"
    );
  }
  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, image, password, phoneNumber } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return res.status(400).send("Missing required fields");
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: "Password is too weak",
        errors: passwordValidation.errors,
      });
    }

    const getUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (getUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const defaultAvatarUrl =
      "https://www.pngkey.com/png/full/72-729716_user-avatar-png-graphic-free-download-icon.png";
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        image: defaultAvatarUrl,
      },
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      message: "Error creating user",
      error: error.message,
    });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
console.log(isMatch , "math");

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Generated Token:", token);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        type: user.type,
        image: user.image,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};


const getUserData = async (req, res) => {
  console.log("Received request for userId:", req.params.userId);

  const { userId } = req.params;
  try {
    if (!userId || isNaN(Number(userId))) {
      console.log("Invalid user ID received");
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address: true,
        image: true,
        bio: true,
      },
    });

    if (!user) {
      console.log(`User with ID ${userId} not found`);
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user);
    res.json(user);
  } catch (error) {
    console.error("Detailed User Retrieval Error:", error);
    res.status(500).json({
      message: "Error retrieving user data",
      error: error.message || "Unknown error",
      details: error,
    });
  }
};

const updateUserData = async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, email, image, phoneNumber, address, bio } =
    req.body;

  try {
    console.log(
      "Update request received for userId:",
      userId,
      "with data:",
      req.body
    );

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(phoneNumber !== null && { phoneNumber: Number(phoneNumber) }),
      ...(address && { address }),
      ...(image && { image }),
      ...(bio && { bio }),
    };

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address: true,
        image: true,
        bio: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Detailed User Update Error:", error);
    res.status(500).json({
      message: "Error updating user data",
      error: error.message || "Unknown error",
      details: error.code ? { code: error.code } : {},
    });
  }
};

const createPost = async (req, res) => {
  const { title, images, description, location, price, category } = req.body;

  try {
    if (!title || !description || !price || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // First create the post
    const post = await prisma.post.create({
      data: {
        title,
        description,
        location: location || "",
        price: parseFloat(price),
        category,
        userId: req.user.id,
      }
    });

    // Create all images if they exist
    if (images && Array.isArray(images) && images.length > 0) {
      // Use createMany for better performance with multiple images
      await prisma.image.createMany({
        data: images.map(img => ({
          url: img.url,
          postId: post.id
        }))
      });
    }

    // Fetch the complete post with all images
    const postWithImages = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        images: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    res.status(201).json(postWithImages);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: "Error creating post",
      error: error.message,
    });
  }
};

const addToFavourites = async (req, res) => {
  const { userId, postId } = req.body;

  try {
    console.log(
      `Attempting to add to favourites: userId=${userId}, postId=${postId}`
    );
    if (!userId && !postId) {
      return res.status(403).send("userId is required");
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return res.status(404).json({ message: "User not found" });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      console.error(`Post with ID ${postId} not found`);
      return res.status(404).json({ message: "Post not found" });
    }

    const favourite = await prisma.favourite.create({
      data: {
        userId,
        postId,
      },
    });

    console.log("Successfully added to favourites:", favourite);
    res.status(201).json({ message: "Added to favourites", favourite });
  } catch (error) {
    console.error("Error adding to favourites:", error);
    res
      .status(500)
      .json({ message: "Error adding to favourites", error: error.message });
  }
};

const removeFromFavourites = async (req, res) => {
  const { userId, postId } = req.body;

  try {
    const favourite = await prisma.favourite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!favourite) {
      return res.status(404).json({ message: "Favourite not found" });
    }

    await prisma.favourite.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    res.status(200).json({ message: "Removed from favourites" });
  } catch (error) {
    console.error("Error removing from favourites:", error);
    res
      .status(500)
      .json({
        message: "Error removing from favourites",
        error: error.message,
      });
  }
};

const getFavouritePosts = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favouritePosts = await prisma.favourite.findMany({
      where: { userId: Number(userId) },
      include: {
        post: {
          include: {
            images: true,
          },
        },
      },
    });

    const posts = favouritePosts.map((fav) => ({
      ...fav.post,
      image: fav.post.images.length > 0 ? fav.post.images[0].url : null,
    }));

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error retrieving favourite posts:", error);
    res
      .status(500)
      .json({
        message: "Error retrieving favourite posts",
        error: error.message,
      });
  }
};

const getUserHistory = async (req, res) => {
    const { userId } = req.params;

    try {
        const history = await prisma.history.findMany({
            where: { userId: Number(userId) },
            include: {
                post: true
            },
            orderBy: { bookingDate: 'desc' }
        });

        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching user history:', error);
        res.status(500).json({ 
            message: 'Error retrieving user history', 
            error: error.message 
        });
    }
};

const createHistory = async (req, res) => {
    try {
        const {
            userId,
            postId,
            bookingDate,
            checkInDate,
            checkOutDate,
            totalPrice,
            status,
            numberOfGuests
        } = req.body;

        // Log the incoming request body for debugging
        console.log("Request Body for Creating History:", req.body);

        const history = await prisma.history.create({
            data: {
                userId: parseInt(userId),
                postId: parseInt(postId),
                bookingDate: new Date(bookingDate),
                checkInDate: new Date(checkInDate),
                checkOutDate: new Date(checkOutDate),
                totalPrice: parseFloat(totalPrice),
                status,
                numberOfGuests: parseInt(numberOfGuests)
            }
        });

        res.status(201).json(history);
    } catch (error) {
        console.error('Error creating history record:', error);
        res.status(500).json({ 
            message: 'Error creating history record', 
            error: error.message 
        });
    }
};

const getUserPaymentHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await prisma.booking.findMany({
      where: { 
        userId: parseInt(userId),
        NOT: {
          status: 'CANCELLED'
        }
      },
      include: {
        post: {
          select: {
            title: true,
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to include property details
    const paymentHistory = bookings.map(booking => ({
      id: booking.id,
      bookingDate: booking.createdAt,
      checkInDate: booking.startDate,
      checkOutDate: booking.endDate,
      totalPrice: booking.totalPrice,
      status: booking.status,
      numberOfGuests: booking.numberOfGuests,
      propertyDetails: {
        title: booking.post.title,
        location: booking.post.location
      }
    }));

    res.status(200).json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ 
      message: 'Error retrieving payment history', 
      error: error.message 
    });
  }
};

module.exports = {
    getUserData,
    updateUserData,
    createPost,
    authenticateToken, 
    prisma,
    signup,
    login,
    getFavouritePosts,
    removeFromFavourites,
    addToFavourites,
    getUserHistory,
    createHistory,
    getUserPaymentHistory,
};
