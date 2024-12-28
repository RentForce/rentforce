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

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', expired: true });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const getAllUsersWithChats = async (req, res) => {
  try {
    console.log('Request user:', req.user);

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find all chats where the current user is either sender or receiver
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Extract unique users from chats
    const usersMap = new Map();

    chats.forEach(chat => {
      // If current user is the sender, add receiver to map
      if (chat.userId === req.user.id && chat.receiver) {
        usersMap.set(chat.receiver.id, chat.receiver);
      }
      // If current user is the receiver, add sender to map
      if (chat.receiverId === req.user.id && chat.user) {
        usersMap.set(chat.user.id, chat.user);
      }
    });

    // Convert map to array
    const users = Array.from(usersMap.values());
    
    console.log('Fetched Users with chats:', users);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const createChat = async (req, res) => {
  try {
    const { userId, receiverId } = req.body;

    if (!userId || !receiverId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Both userId and receiverId are required'
      });
    }

    // Check for existing chat
    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          {
            AND: [
              { userId: parseInt(userId) },
              { receiverId: parseInt(receiverId) }
            ]
          },
          {
            AND: [
              { userId: parseInt(receiverId) },
              { receiverId: parseInt(userId) }
            ]
          }
        ]
      },
      include: {
        user: true,
        receiver: true,
        messages: {
          orderBy: {
            sentAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    // Create new chat if none exists
    const newChat = await prisma.chat.create({
      data: {
        userId: parseInt(userId),
        receiverId: parseInt(receiverId),
        unreadCount: 0
      },
      include: {
        user: true,
        receiver: true
      }
    });
    return res.status(201).json(newChat);
  } catch (error) {
    console.error('Error in createChat:', error);
    return res.status(500).json({
      error: 'Failed to create chat',
      details: error.message
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await prisma.chat.findMany({
      where: {
        OR: [
          { userId: parseInt(userId) },
          { receiverId: parseInt(userId) }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true
          }
        },
        messages: {
          orderBy: {
            sentAt: 'desc'
          },
          take: 1
        }
      }
    });

    const formattedConversations = conversations.map(chat => {
      const isReceiver = chat.receiverId === parseInt(userId);
      const otherUser = isReceiver ? chat.user : chat.receiver;

      return {
        id: chat.id,
        otherUserId: otherUser.id,
        otherUserFirstName: otherUser.firstName || 'User',
        otherUserLastName: otherUser.lastName || '',
        otherUserImage: otherUser.image || 'default-image-url',
        lastMessage: chat.messages[0]?.content || '',
        unreadCount: chat.unreadCount || 0,
        createdAt: chat.createdAt
      };
    });

    return res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('Error in getConversations:', error);
    return res.status(500).json({
      error: 'Failed to get conversations',
      details: error.message
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content, chatId, userId } = req.body;
    console.log('Creating new message:', { content, chatId, userId });

    // Get the chat first
    const chat = await prisma.chat.findUnique({
      where: { id: parseInt(chatId) },
      include: {
        user: true,
        receiver: true
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        chatId: parseInt(chatId),
        userId: parseInt(userId),
        isRead: false,
        type: 'TEXT'
      },
      include: {
        chat: true,
        user:  { 
          select: {
          id: true,
          firstName: true,
          lastName: true,
          image: true
        }}
      }
    });

    // Get the receiver's ID
    const receiverId = chat.userId === parseInt(userId) ? chat.receiverId : chat.userId;

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting new message to:', receiverId);
      io.to(`user_${receiverId}`).emit('new message', {
        ...message,
        receiverId
      });
    }
    await prisma.chat.update({
      where: { id: parseInt(chatId) },
      data: {
        lastMessageAt: new Date(),
        unreadCount: {
          increment: 1
        }
      }
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      error: 'Failed to send message',
      success: false
    });
  }
};

const markChatAsRead = async (req, res) => {
  const { chatId, userId } = req.params;

  try {
    await prisma.message.updateMany({
      where: {
        chatId: parseInt(chatId),
        userId: {
          not: parseInt(userId)
        },
        read: false
      },
      data: {
        read: true
      }
    });

    await prisma.chat.update({
      where: { id: parseInt(chatId) },
      data: { unreadCount: 0 }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Could not mark messages as read' });
  }
};

const updatePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    const userId = req.user.id;

    if (!expoPushToken) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
      select: { id: true, expoPushToken: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Push token update error:', error);
    res.status(500).json({ 
      error: 'Failed to update push token',
      details: error.message 
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.params.userId;
    const count = await Message.count({
      where: {
        receiverId: userId,
        read: false
      }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
  try {
    const chatId = parseInt(req.params.chatId);

    if (isNaN(chatId)) {
      return res.status(400).json({
        error: 'Invalid chat ID',
        details: 'Chat ID must be a number'
      });
    }

    // Verify chat exists and user has access
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user: true,
        receiver: true
      }
    });

    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found'
      });
    }

    // Verify user has access to this chat
    if (chat.userId !== req.user.id && chat.receiverId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        details: 'You do not have permission to view these messages'
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: chatId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true
          }
        }
      },
      orderBy: {
        sentAt: 'asc'
      }
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    return res.status(500).json({
      error: 'Failed to get messages',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isAudio = file.mimetype.startsWith('audio/');
    const isImage = file.mimetype.startsWith('image/');
    
    if (!isAudio && !isImage) {
      throw new Error('Invalid file type. Only images and audio files are allowed.');
    }

    const baseParams = {
      allowed_formats: isAudio ? ['m4a', 'mp3', 'wav', 'ogg', 'mp4'] : ['jpg', 'jpeg', 'png', 'gif'],
      format: isAudio ? 'm4a' : 'auto',
      transformation: isImage ? [{ quality: 'auto:good', fetch_format: 'auto' }] : [],
    };

    if (isAudio) {
      return {
        ...baseParams,
        folder: 'chat-audio',
        resource_type: 'video',
      };
    } else {
      return {
        ...baseParams,
        folder: 'chat-images',
        resource_type: 'image',
      };
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const mimeType = file.mimetype.toLowerCase();
    
    if (mimeType.startsWith('audio/') || 
        mimeType.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and audio files are allowed.'));
    }
  }
}).single('file');

const handleFileUpload = async (req, res) => {
  try {
    console.log('Starting file upload...');
    
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.error('Multer upload error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({
        error: 'No file provided',
        details: 'File upload is required'
      });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    const chatId = parseInt(req.body.chatId);
    const senderId = parseInt(req.body.senderId);
    const receiverId = parseInt(req.body.receiverId);
    const messageType = req.body.messageType || 
      (req.file.mimetype.startsWith('audio/') ? 'VOICE' : 'IMAGE');

    console.log('Request data:', { chatId, senderId, receiverId, messageType });

    if (!chatId || !senderId || !receiverId) {
      console.error('Invalid IDs provided:', { chatId, senderId, receiverId });
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
      }
      return res.status(400).json({
        error: 'Invalid data',
        details: 'Valid chatId, senderId, and receiverId are required'
      });
    }

    let uploadResult;
    try {
      console.log('Uploading to Cloudinary...');
      const uploadOptions = {
        resource_type: messageType === 'VOICE' ? 'video' : 'auto',
        folder: messageType === 'VOICE' ? 'voice-messages' : 'chat-images',
        format: messageType === 'VOICE' ? 'm4a' : null,
        quality: 'auto:good'
      };
      console.log('Upload options:', uploadOptions);

      uploadResult = await cloudinary.uploader.upload(req.file.path, uploadOptions);
      console.log('Cloudinary upload successful:', uploadResult);

      // Clean up the temporary file
      if (req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Error deleting temp file after successful upload:', err);
        }
      }
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Error deleting temp file after failed upload:', err);
        }
      }
      throw new Error(`Failed to upload file to cloud storage: ${uploadError.message}`);
    }

    console.log('Creating message in database...');
    const message = await prisma.message.create({
      data: {
        chatId,
        userId: senderId,
        content: uploadResult.secure_url,
        type: messageType,
        isRead: false
      }
    });
    console.log('Message created:', message);

    await prisma.chat.update({
      where: { id: chatId },
      data: { 
        lastMessageAt: new Date(),
        unreadCount: {
          increment: 1
        }
      }
    });

    return res.status(200).json({
      message: 'File uploaded successfully',
      url: uploadResult.secure_url,
      messageId: message.id
    });

  } catch (error) {
    console.error('File upload error:', error);
    console.error('Error stack:', error.stack);
    
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }

    return res.status(500).json({
      error: 'File upload failed',
      details: error.message
    });
  }
};

const sendPushNotification = async (expoPushToken, messageData) => {
  if (!expoPushToken) {
    console.log('No push token found for user');
    return;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: `New message from ${messageData.senderName}`,
    body: messageData.type === 'IMAGE' ? '📷 Image' : 
          messageData.type === 'AUDIO' ? '🎵 Voice message' : 
          messageData.type === 'VIDEO_CALL' ? '📱 Video Call' :
          messageData.content,
    data: { 
      messageData,
      type: 'CHAT_MESSAGE',
      chatId: messageData.chatId,
    },
    priority: 'high',
  };

  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    await prisma.chat.update({
      where: { id: parseInt(messageData.chatId) },
      data: {
        unreadCount: {
          increment: 1
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

const getUnreadMessages = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    console.log('Getting unread messages for user:', userId);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        success: false
      });
    }

    const unreadMessages = await prisma.message.count({
      where: {
        chat: {
          OR: [
            { receiverId: userId },
            { userId: userId }
          ]
        },
        isRead: false,
        userId: { not: userId } 
      }
    });

    console.log(`Found ${unreadMessages} unread messages for user ${userId}`);

    return res.status(200).json({
      count: unreadMessages,
      success: true
    });

  } catch (error) {
    console.error('Error in getUnreadMessages:', error);
    return res.status(500).json({
      error: 'Failed to get unread messages',
      success: false
    });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    console.log('Marking messages as read:', { chatId, userId });

    const chat = await prisma.chat.findUnique({
      where: { id: parseInt(chatId) },
      select: {
        userId: true,
        receiverId: true
      }
    });

    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found'
      });
    }

    if (chat.userId !== parseInt(userId) && chat.receiverId !== parseInt(userId)) {
      return res.status(403).json({
        error: 'User is not part of this chat'
      });
    }

    const messagesToMarkRead = await prisma.message.count({
      where: {
        chatId: parseInt(chatId),
        userId: chat.userId === parseInt(userId) ? chat.receiverId : chat.userId, 
        isRead: false
      }
    });

    await prisma.message.updateMany({
      where: {
        chatId: parseInt(chatId),
        userId: chat.userId === parseInt(userId) ? chat.receiverId : chat.userId, 
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    await prisma.chat.update({
      where: {
        id: parseInt(chatId)
      },
      data: {
        unreadCount: {
          decrement: messagesToMarkRead
        }
      }
    });

    if (req.io) {
      req.io.to(`chat:${chatId}`).emit('messagesRead', {
        chatId: parseInt(chatId),
        readBy: parseInt(userId),
        count: messagesToMarkRead
      });
    }

    return res.status(200).json({
      success: true,
      readCount: messagesToMarkRead
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({
      error: 'Failed to mark messages as read',
      details: error.message
    });
  }
};

module.exports = {
  createChat,
  sendMessage,
  getUserChats,
  getChatMessages,
  getAllUsersWithChats,
  authMiddleware,
  markChatAsRead,
  updatePushToken,
  getUnreadCount,
  getUnreadMessages,
  markMessagesAsRead,
  getConversations,
  upload,
  handleFileUpload,
  sendPushNotification
}