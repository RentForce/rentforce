const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

dotenv.config();

const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');

// Add this to debug imports
console.log('Loaded routes:', {
    chat: Object.keys(chatRoutes),
    user: Object.keys(userRoutes)
});

const prisma = new PrismaClient();

const app = express();


const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
 
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const fs = require('fs');
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
if (!fs.existsSync('./uploads/audio')) {
    fs.mkdirSync('./uploads/audio');
}
if (!fs.existsSync('./uploads/images')) {
    fs.mkdirSync('./uploads/images');
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  transports: ['websocket', 'polling']
});

app.use((req, res, next) => {
    req.io = io;
    console.log(`${req.method} ${req.path}`, {
        body: req.body,
        query: req.query,
        headers: req.headers
    });
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
  socket.on('voice-call', (callData) => {
    // Broadcast incoming call to the receiver
    socket.to(callData.receiver.id.toString()).emit('incoming-voice-call', callData);
    console.log('Voice call initiated:', callData);
})
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
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Server error',
        details: err.message
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