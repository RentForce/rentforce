require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user");
const postsRouter = require("./routes/posts");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const http = require("http");
const { Server } = require("socket.io");
const chatRoutes = require("./routes/chat");
const stripe = require("stripe")(
  "sk_test_51QWZjFIMfjBRRWpm6iHBv9hhM8aJjzg436fkGQIat8OLzaV4U5524lynVZp7OhkDYZ1Bne5RxWzl3fOu0LIsmWsa00GEIswlHy"
);
const bodyParser = require("body-parser");
const { sendBookingRequestEmail } = require("./services/emailService");
const notificationRoutes = require("./routes/notification");

const prisma = new PrismaClient();
const app = express();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "mejrisaif2020@gmail.com",
    pass: "hxqk duxl gtwz jyrw",
  },
});
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/user", userRoutes);
app.use("/posts", postsRouter);

// Stripe Payment Intent Route
app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send(error.message);
  }
});

app.post("/confirm-booking", async (req, res) => {
  const { guestEmail, hostEmail, houseDetails, price } = req.body;

  try {
    await sendBookingRequestEmail(guestEmail, hostEmail, houseDetails, price);
    res.status(200).json({
      message: "Booking request sent and emails delivered successfully.",
    });
  } catch (error) {
    console.error("Error processing booking confirmation:", error);
    res.status(500).json({
      message: "Error sending booking confirmation emails",
      error: error.message,
    });
  }
});

app.use("/api/chat", chatRoutes);
app.use("/user", userRoutes);
app.use("/notification", notificationRoutes);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join chat", (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on("send message", (messageData) => {
    // Emit the 'new message' event to all clients in the chat room
    io.to(`chat:${messageData.chatId}`).emit("new message", messageData);
    console.log("Message sent to chat:", messageData.chatId, messageData);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  socket.on("video call invite", (data) => {
    socket.to(data.to).emit("incoming call", {
      from: data.from,
      channelName: data.channelName,
    });
  });

  socket.on("join_user_room", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  socket.on("join_notification_room", (userId) => {
    socket.join(`notification-${userId}`);
    socket.join(`booking-update-${userId}`);
    console.log(`User ${userId} joined notification rooms`);
  });

  socket.on("booking_request", (data) => {
    io.to(`notification-${data.hostId}`).emit("new_booking_request", data);
  });

  socket.on("booking_response", (data) => {
    io.to(`notification-${data.userId}`).emit("booking_status_update", data);
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV !== "production" ? err.message : {},
  });
});

const PORT = process.env.PORT || 5000;
const serverInstance = server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  serverInstance.close(() => {
    console.log("HTTP server closed");
    prisma.$disconnect();
    process.exit(0);
  });
});

module.exports = { app, server: serverInstance, io };
