require('dotenv').config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user");
const { PrismaClient } = require('@prisma/client');

const app = express();

// Create Prisma client
const prisma = new PrismaClient();

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:19006'], // Add your frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.use("/api/users", userRoutes);

const server = app.listen(PORT, async () => {
    console.log(`Listening on port ${PORT}`);
    
    // Verify database connection
    try {
        await prisma.$connect();
        console.log('Database connection verified');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;