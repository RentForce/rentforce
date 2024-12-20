require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user");
const postsRouter = require("./routes/posts");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');
const chatRoutes = require('./routes/chat');
const prisma = new PrismaClient();
const app = express();



const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
      user: 'mejrisaif2020@gmail.com',
      pass: 'hxqk duxl gtwz jyrw', 
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:19000",
      "http://localhost:19001",
      "http://localhost:19002",
      "exp://192.168.11.118:19000", 
      "exp://192.168.11.118:19001",
      "exp://192.168.11.118:19002",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
const corsOptions = {
  origin: [
      'http://localhost:19000',
      'http://localhost:19001',
      'http://localhost:19002',
     
      'http://localhost:8081',
      'exp://localhost:19000',  // Add this
      'exp://localhost:19001',  // Add this
      'exp://localhost:19002',  // Add this
      'http://192.168.11.118:19000', // Add your actual IP address variations
      'http://192.168.11.118:19001',
      'http://192.168.11.118:19002'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

app.use("/user", userRoutes);
app.use("/posts", postsRouter);

const sendBookingEmails = async (guestEmail, hostEmail, houseDetails, price) => {
    const guestMailOptions = {
        from: 'mejrisaif2020@gmail.com',
        to: "yassine2904@gmail.com",
        subject: 'Booking Confirmation',
        text: `Your booking for the house is confirmed. Details: ${houseDetails}, Price: ${price}`,
    };

    const hostMailOptions = {
        from: 'mejrisaif2020@gmail.com',
        to: "yassine2904@gmail.com",
        subject: 'New Booking Request',
        text: `A guest has requested to book your house. Details: ${houseDetails}, Price: ${price}. Please accept or reject the booking.`,
    };

    try {
        await transporter.sendMail(guestMailOptions);
        await transporter.sendMail(hostMailOptions);
        console.log('Booking confirmation emails sent successfully.');
    } catch (error) {
        console.error('Error sending emails:', error);
    }
};

app.post('/confirm-booking', async (req, res) => {
    const { guestEmail, hostEmail, houseDetails, price } = req.body; 

    try {
        await sendBookingEmails(guestEmail, hostEmail, houseDetails, price);
        res.status(200).json({ message: 'Booking confirmed and emails sent.' });
    } catch (error) {
        res.status(500).json({ message: 'Error confirming booking and sending emails.' });
    }
  })
const io = new Server(server, {
  cors: {
      origin: corsOptions.origin,
      methods: corsOptions.methods,
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
  },
  transports: ['websocket', 'polling'] // Explicitly set transports
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/chat', chatRoutes);
app.use("/user", userRoutes);

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join chat', (chatId) => {
  
      
        socket.join(`chat:${chatId}`);
        console.log(`User joined chat: ${chatId}`);
    });

    socket.on('send message', (messageData) => {
      // Emit the 'new message' event to all clients in the chat room
      io.to(`chat:${messageData.chatId}`).emit('new message', messageData);
      console.log('Message sent to chat:', messageData.chatId, messageData);
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
    console.error('Unhandled Error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV !== 'production' ? err.message : {}
    });
});

const PORT = process.env.PORT || 5000;
const serverInstance = server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    serverInstance.close(() => {
        console.log('HTTP server closed');
        prisma.$disconnect();
        process.exit(0);
    });
});

module.exports = { app, server: serverInstance, io };