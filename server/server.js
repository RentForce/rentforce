require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user");
const postsRouter = require("./routes/posts");
const adminRoutes = require("./routes/admin");
const nodemailer = require('nodemailer');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const socketHandler = require('./socket');
const reportsRouter = require("./routes/report");
const { Server } = require("socket.io");
const productData = require('./data/chatbotData');

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
app.use("/posts", postsRouter);
app.use("/admin", adminRoutes);
app.use("/reports", reportsRouter);


// Simple response generator function
function generateResponse(userMessage) {
  try {
    const message = userMessage.toLowerCase();
    console.log('Processing message:', message);
    
    // Check FAQs first
    const faqMatch = productData.faqs.find(faq => 
      faq.question.toLowerCase().includes(message) || 
      message.includes(faq.question.toLowerCase())
    );
    if (faqMatch) return faqMatch.answer;

    // Check for feature-related questions
    if (message.includes('feature') || message.includes('what can') || message.includes('how to')) {
      return "Here are RentForce's main features:\n" + productData.features.slice(0, 3).join("\n");
    }

    // Check for property types
    if (message.includes('property') || message.includes('type') || message.includes('accommodation')) {
      const types = productData.propertyTypes.map(t => `${t.type}: ${t.description}`).join('\n');
      return "We offer these types of properties:\n" + types;
    }

    // Check for payment/pricing questions
    if (message.includes('pay') || message.includes('price') || message.includes('cost')) {
      return productData.policies.payment;
    }

    // Check for booking questions
    if (message.includes('book') || message.includes('reserve')) {
      return productData.policies.booking;
    }

    // Check for support questions
    if (message.includes('help') || message.includes('support') || message.includes('contact')) {
      return `Our support team is available ${productData.support.availableHours}. Response time: ${productData.support.responseTime}. We speak ${productData.support.languages.join(', ')}.`;
    }

    // Check for greetings
    if (message.includes('hi') || message.includes('hello') || message.includes('hey')) {
      return "Hello! Welcome to RentForce. I'm your virtual assistant, here to help you with property rentals. How can I assist you today?";
    }

    // Default response
    return "I'm here to help you with RentForce! You can ask me about:\n" +
           "- How to book properties\n" +
           "- Available property types\n" +
           "- Payment and pricing\n" +
           "- Features and services\n" +
           "- Support and contact information";
  } catch (error) {
    console.error('Error in generateResponse:', error);
    return "I'm sorry, I encountered an error. Please try asking your question in a different way.";
  }
}

app.post('/api/chatbot', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('Received chat message:', message);
    
    if (!message) {
      console.log('No message received in request');
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = generateResponse(message);
    console.log('Generated response:', response);
    
    res.json({ response });
  } catch (error) {
    console.error('Error in chatbot endpoint:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

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