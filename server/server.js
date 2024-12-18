require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/user");
const postsRouter = require("./routes/posts");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require('nodemailer');

const app = express();

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // Use 465 for SSL
  secure: false, // Set to true if using port 465
  auth: {
      user: 'mejrisaif2020@gmail.com',
      pass: 'hxqk duxl gtwz jyrw', // Consider using an app password instead
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.use("/user", userRoutes);
app.use("/posts", postsRouter);

const sendBookingEmails = async (guestEmail, hostEmail, houseDetails, price) => {
    const guestMailOptions = {
        from: 'mejrisaif2020@gmail.com',
        to: "rtimim2003@gmail.com",
        subject: 'Booking Confirmation',
        text: `Your booking for the house is confirmed. Details: ${houseDetails}, Price: ${price}`,
    };

    const hostMailOptions = {
        from: 'mejrisaif2020@gmail.com',
        to: "rtimim2003@gmail.com",
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
});

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

const server = app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);

  try {
    await prisma.$connect();
    console.log("Database connection verified");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = app;
