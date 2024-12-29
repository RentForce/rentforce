require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user");
const postsRouter = require("./routes/posts");
const nodemailer = require('nodemailer');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const socketHandler = require('./socket');
const reportsRouter = require("./routes/report");

const { Server } = require("socket.io");

dotenv.config();

const chatRoutes = require("./routes/chat");
const stripe = require("stripe")(
  "sk_test_51QWZjFIMfjBRRWpm6iHBv9hhM8aJjzg436fkGQIat8OLzaV4U5524lynVZp7OhkDYZ1Bne5RxWzl3fOu0LIsmWsa00GEIswlHy"
);
const bodyParser = require("body-parser");
const { sendBookingRequestEmail } = require("./services/emailService");
const notificationRoutes = require("./routes/notification");

// Add this to debug imports
console.log("Loaded routes:", {
  chat: Object.keys(chatRoutes),
  user: Object.keys(userRoutes),
});

const prisma = new PrismaClient();
const app = express();

// Create HTTP server
const server = http.createServer(app);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "mejrisaif2020@gmail.com",
    pass: "hxqk duxl gtwz jyrw",
  },
});

// Configure CORS for both Express and Socket.IO
const corsOptions = {
  origin: '*', // In production, replace with your actual domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));

// Initialize Socket.IO with CORS options
const io = socketIO(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket'],
  allowEIO3: true
});

// Make io accessible to routes
app.set('io', io);

// Initialize socket handler
socketHandler(io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const fs = require("fs");
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}
if (!fs.existsSync("./uploads/audio")) {
  fs.mkdirSync("./uploads/audio");
}
if (!fs.existsSync("./uploads/images")) {
  fs.mkdirSync("./uploads/images");
}
app.use(bodyParser.json());

app.use("/user", userRoutes);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   },
// });

// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// app.use("/user", userRoutes);
app.use("/posts", postsRouter);
app.use("/reports", reportsRouter);

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

app.use((req, res, next) => {
  req.io = io;
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers,
  });
  next();
});

app.use("/api/chat", chatRoutes);
app.use("/user", userRoutes);
app.use("/notification", notificationRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.handshake.query.userId);

  socket.on('join chat', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on('send message', (messageData) => {
    io.to(`chat:${messageData.chatId}`).emit('new message', messageData);
    console.log('Message sent to chat:', messageData.chatId, messageData);
  });

  socket.on('voice-call', (callData) => {
    socket.to(callData.receiver.id.toString()).emit('incoming-voice-call', callData);
    console.log('Voice call initiated:', callData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('video call invite', (data) => {
    socket.to(data.to).emit('incoming call', {
      from: data.from,
      channelName: data.channelName
    });
  });
});

app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        prisma.$disconnect();
        process.exit(0);
    });
});

module.exports = { app, server, io };
