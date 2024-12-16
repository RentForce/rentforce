require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user");
const postsRouter = require("./routes/posts");
const morgan =require("morgan")
const { PrismaClient } = require("@prisma/client");

const app = express();

// Create Prisma client
const prisma = new PrismaClient();

// Enhanced CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:19000",
      "http://localhost:19001",
      "http://localhost:19002",
      "exp://192.168.11.118:19000", // Expo specific
      "exp://192.168.11.118:19001",
      "exp://192.168.11.118:19002",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan())
const PORT = process.env.PORT || 5000;

// Mount user routes
app.use("/user", userRoutes);
app.use("/posts", postsRouter);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

const server = app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);

  // Verify database connection
  try {
    await prisma.$connect();
    console.log("Database connection verified");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = app;
