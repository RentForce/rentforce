const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

// SMSAPI Configuration
const SMSAPI_KEY =
  "App daa6aec38feddaf03cb3b0f318706f0d-5770c954-04d6-46cd-a3f7-9fd4abdd4e29"; // Replace with your API key from SMSAPI

// In-memory store for codes (for demonstration purposes)
const recoveryCodes = {};

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "ahmedboukottaya@zohomail.com",
    pass: "53nDUtDC4CKF",
  },
});
// Send recovery code via email or SMS
const sendCode = async (req, res) => {
  const { email, sms, method } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit code

  try {
    if (method === "sms") {
      // Verify phone number exists in database
      const user = await prisma.user.findFirst({
        where: { phoneNumber: sms },
      });

      if (!user) {
        return res.status(404).json({ message: "Phone number not found" });
      }

      // Store the code with the phone number as key
      recoveryCodes[sms] = code;

      // Send SMS using SMSAPI
      try {
        const response = await axios.post(
          "https://9kzxvd.api.infobip.com/sms/2/text/advanced",
          {
            messages: [
              {
                destinations: [
                  {
                    to: sms,
                  },
                ],
                from: "447491163443", // Your sender ID
                text: `Your password recovery code is: ${code}`,
              },
            ],
          },
          {
            headers: {
              "User-Agent":"Thunder Client (https://www.thunderclient.com)",
              "Content-Type": "application/json",
              "Authorization":"App daa6aec38feddaf03cb3b0f318706f0d-5770c954-04d6-46cd-a3f7-9fd4abdd4e29",
            },
          }
        );
        res.send(response.data);
      } catch (error) {
        console.log(error);
      }

      // if (response.data.status === 'success') {
      //     res.status(200).json({ message: 'Code sent via SMS successfully' });
      // } else {
      //     res.status(500).json({ message: 'Failed to send SMS', error: response.data });
      // }
    } else if (method === "email") {
      // Store the code with the email as key
      recoveryCodes[email] = code;

      const mailOptions = {
        from: "ahmedboukottaya@zohomail.com",
        to: email,
        subject: "Password Recovery Code",
        text: `Your password recovery code is: ${code}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res
            .status(500)
            .json({ message: "Error sending email", error });
        }
        res.status(200).json({ message: "Email sent successfully" });
      });
    } else {
      res.status(400).json({ message: "Invalid method specified" });
    }
  } catch (error) {
    console.error("Error sending code:", error);
    res.status(500).json({ message: "Failed to send code" });
  }
};

// Verify the recovery code
const verifyCode = async (req, res) => {
  try {
    const { email, phoneNumber, code, method } = req.body;
    
    // Determine the key based on the method
    const key = method === "sms" ? phoneNumber : email;
    
    console.log("Verifying code:", {
      method,
      key,
      receivedCode: code,
      storedCode: recoveryCodes[key],
      allCodes: recoveryCodes
    });

    if (recoveryCodes[key] === parseInt(code)) {
      // Code is valid
      delete recoveryCodes[key]; // Remove the code after successful verification
      res.status(200).json({ message: "Code verified successfully" });
    } else {
      // Code is invalid
      res.status(400).json({ 
        message: "Invalid recovery code",
        debug: {
          receivedCode: code,
          storedCode: recoveryCodes[key],
          method: method,
          key: key
        }
      });
    }
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update password
const updatePassword = async (req, res) => {
  try {
    const { email, phoneNumber, newPassword, method } = req.body;

    console.log("Received update password request:", req.body);

    // First find the user
    const user = await prisma.user.findFirst({
      where: method === "sms" ? { phoneNumber } : { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password using the user's id
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "Failed to update password" });
    }

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
};

// Export all functions
module.exports = {
  sendCode,
  verifyCode,
  updatePassword,
};