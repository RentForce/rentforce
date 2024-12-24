const { PrismaClient } = require('@prisma/client')
const express = require('express')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(req.headers)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    console.log('Received token:', token);
    console.log('Secret used for verification:', process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    console.log('Request user:', req.user)

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: req.user.id
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    console.log('Fetched Users:', users);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const createChat = async (req, res) => {
  const { userId, receiverId } = req.body


  console.log('Create Chat Request Body:', req.body);
  console.log('User ID Type:', typeof userId);
  console.log('Receiver ID Type:', typeof receiverId);

  try {

    if (userId === undefined || userId === null) {
      return res.status(400).json({
        error: 'userId is required',
        details: 'User ID cannot be null or undefined'
      });
    }

    if (receiverId === undefined || receiverId === null) {
      return res.status(400).json({
        error: 'receiverId is required',
        details: 'Receiver ID cannot be null or undefined'
      });
    }

    const parsedUserId = parseInt(userId);
    const parsedReceiverId = parseInt(receiverId);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        details: 'User ID must be a valid number'
      });
    }

    if (isNaN(parsedReceiverId)) {
      return res.status(400).json({
        error: 'Invalid receiverId',
        details: 'Receiver ID must be a valid number'
      });
    }

    if (parsedUserId === parsedReceiverId) {
      return res.status(400).json({
        error: 'Invalid chat creation',
        details: 'Cannot create a chat with yourself'
      });
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          {
            userId: parsedUserId,
            receiverId: parsedReceiverId
          },
          {
            userId: parsedReceiverId,
            receiverId: parsedUserId
          }
        ]
      }
    })

    if (existingChat) {
      return res.status(200).json(existingChat)
    }

    const newChat = await prisma.chat.create({
      data: {
        userId: parsedUserId,
        receiverId: parsedReceiverId
      }
    })

    res.status(201).json(newChat)
  } catch (error) {
    console.error('Detailed Error creating chat:', error)
    res.status(500).json({
      error: 'Could not create chat',
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    })
  }
}

const sendMessage = async (req, res) => {
  const { chatId, userId, content, type = 'TEXT' } = req.body

  try {

    console.log('Received message data:', {
      chatId,
      userId,
      content,
      type,
      rawBody: req.body
    });
    if (!chatId || !userId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    console.log('Received message data:', {
      chatId,
      userId,
      content,
      type
    });



    const message = await prisma.message.create({
      data: {
        chatId: parseInt(chatId),
        userId: parseInt(userId),
        content,
        type
      },
      include: {
        user: true,
        chat: true
      }
    })

    res.status(201).json(message)
  } catch (error) {
    console.error('Detailed Error sending message:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Could not send message',
      details: error.message
    });
  }
}
const getUserChats = async (req, res) => {
  const userId = parseInt(req.params.userId)

  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { userId },
          { receiverId: userId }
        ]
      },
      include: {
        user: true,
        receiver: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      }
    })

    res.status(200).json(chats)
  } catch (error) {
    console.error('Error fetching user chats:', error)
    res.status(500).json({ error: 'Could not fetch chats' })
  }
}

const getChatMessages = async (req, res) => {
  const chatId = parseInt(req.params.chatId)

  try {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { sentAt: 'asc' },
      include: {
        user: true
      }
    })

    res.status(200).json(messages)
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    res.status(500).json({ error: 'Could not fetch messages' })
  }
}
const createCallLog = async (req, res) => {
  const { callerId, receiverId, status, duration } = req.body;
  try {
    const callLog = await prisma.callLog.create({
      data: {
        callerId: parseInt(callerId),
        receiverId: parseInt(receiverId),
        status,
        duration,
        startTime: new Date(),
        endTime: duration ? new Date(Date.now() + duration) : null
      }
    });
    res.json(callLog);
  } catch (error) {
    res.status(500).json({ error: 'Could not create call log' });
  }
}

const generateCallToken = async (req, res) => {
  try {
    const { userId } = req.body;
    const jwt = vonage.generateJwt({
      application_id: process.env.VONAGE_APPLICATION_ID,
      sub: userId.toString(),
      exp: Math.round(new Date().getTime() / 1000) + 86400,
      acl: {
        paths: {
          "/*/users/**": {},
          "/*/conversations/**": {},
          "/*/sessions/**": {},
          "/*/devices/**": {},
          "/*/image/**": {},
          "/*/media/**": {},
          "/*/applications/**": {},
          "/*/push/**": {},
          "/*/knocking/**": {},
          "/*/legs/**": {}
        }
      }
    });
    res.json({ token: jwt });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Could not generate token' });
  }
};

const translateMessage = async (req, res) => {
  const { text, targetLanguage } = req.body;

  try {
    const response = await axios.get(
      `https://api.mymemory.translated.net/get`, {
      params: {
        q: text,
        langpair: `en|${targetLanguage}` // Assumes source is English
      }
    }
    );

    if (response.data.responseStatus === 200) {
      res.json({
        translatedText: response.data.responseData.translatedText
      });
    } else {
      throw new Error('Translation failed');
    }
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
};

const translationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Daily translation limit reached'
});



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine the type of file being uploaded
    const isAudio = file.mimetype.startsWith('audio/') || 
                   file.originalname.toLowerCase().endsWith('.m4a');

    // Default configuration for images
    let uploadParams = {
      folder: 'chat-images',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [{ quality: 'auto' }]
    };

    // Override configuration for audio files
    if (isAudio) {
      uploadParams = {
        folder: 'chat-audio',
        resource_type: 'raw', // Use raw instead of video for audio files
        allowed_formats: ['m4a', 'mp3', 'wav', 'ogg', 'mp4'],
      };
    }

    return uploadParams;
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const mimeType = file.mimetype.toLowerCase();
    const fileName = file.originalname.toLowerCase();
    
    // Check if it's an audio file
    if (mimeType.startsWith('audio/') || fileName.endsWith('.m4a')) {
      cb(null, true);
      return;
    }
    
    // Check if it's an image file
    if (mimeType.startsWith('image/') && 
        fileName.match(/\.(jpg|jpeg|png|gif)$/i)) {
      cb(null, true);
      return;
    }

    cb(new Error('Invalid file type. Expected audio or image file.'));
  }
}).single('file');

const handleFileUpload = async (req, res) => {
  try {
    // Handle the file upload using Promise
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.error('Upload error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        details: 'File upload is required'
      });
    }

    const { chatId, senderId, receiverId } = req.body;
    
    // Determine message type based on the file
    const messageType = req.file.mimetype.startsWith('audio/') || 
                       req.file.originalname.toLowerCase().endsWith('.m4a') 
                       ? 'AUDIO' 
                       : 'IMAGE';

    // Validate required fields
    if (!chatId || !senderId) {
      // Delete the uploaded file if validation fails
      if (req.file?.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id, { resource_type: 'raw' });
      }
      return res.status(400).json({
        error: 'Missing required data',
        details: 'chatId and senderId are required'
      });
    }

    // Create message in database
    const message = await prisma.message.create({
      data: {
        chatId: parseInt(chatId),
        userId: parseInt(senderId),
        content: req.file.path, // Cloudinary URL
        type: messageType
      }
    });

    // Return success response with Cloudinary URL
    return res.status(200).json({
      message: 'File uploaded successfully',
      url: req.file.path,
      messageId: message.id
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up any uploaded file if there's an error
    if (req.file?.public_id) {
      try {
        await cloudinary.uploader.destroy(req.file.public_id, { 
          resource_type: 'raw'
        });
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    return res.status(error.status || 500).json({
      error: 'File upload failed',
      details: error.message
    });
  }
};
const sendPushNotification = async (expoPushToken, messageData) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: `New message from ${messageData.senderName}`,
    body: messageData.type === 'IMAGE' ? '📷 Image' : 
          messageData.type === 'AUDIO' ? '🎵 Voice message' : 
          messageData.content,
    data: { messageData },
  };

  try {
    await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = {
  handleFileUpload,
  //handleVoiceMessage,
  translateMessage,
  createChat,
  sendMessage,
  getUserChats,
  getChatMessages,
  getAllUsers,
  authMiddleware,


  //uploadImage


}