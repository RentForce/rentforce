const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');

const prisma = new PrismaClient();

const app = express();


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