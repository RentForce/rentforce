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
    const parsedUserId = parseInt(userId);

    const conversations = await prisma.chat.findMany({
      where: {
        OR: [
          { userId: parsedUserId },
          { receiverId: parsedUserId }
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
      const isReceiver = chat.receiverId === parsedUserId;
      const otherUser = isReceiver ? chat.user : chat.receiver;

      return {
        id: chat.id,
        userId: chat.userId,
        receiverId: chat.receiverId,
        otherUserId: otherUser.id,
        otherUserFirstName: otherUser.firstName || 'User',
        otherUserLastName: otherUser.lastName || '',
        otherUserImage: otherUser.image || 'default-image-url',
        lastMessage: chat.messages[0]?.content || '',
        lastMessageTime: chat.messages[0]?.sentAt || chat.createdAt,
        unreadCount: chat.unreadCount || 0
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
    const { content, chatId, userId, receiverId, type } = req.body;

    console.log('Received message request:', {
      content,
      chatId: parseInt(chatId),
      userId: parseInt(userId),
      type
    });

    // Validate required fields
    if (!content || !chatId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        received: { content, chatId, userId }
      });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        type: type || 'TEXT',
        chatId: parseInt(chatId),
        userId: parseInt(userId),
        read: false,
        sentAt: new Date()
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
      }
    });

    // Update chat's lastMessageAt
    await prisma.chat.update({
      where: { id: parseInt(chatId) },
      data: {
        lastMessageAt: new Date(),
        unreadCount: {
          increment: 1
        }
      }
    });

    // Format the response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      type: message.type,
      chatId: message.chatId,
      userId: message.userId,
      read: message.read,
      sentAt: message.sentAt,
      sender: message.user
    };

    // Emit socket events if receiverId is provided
    if (req.io && receiverId) {
      req.io.to(`user_${receiverId}`).emit('new_message', formattedMessage);
      req.io.to(`user_${receiverId}`).emit('update_unread_count', {
        chatId: parseInt(chatId),
        unreadCount: 1
      });
    }

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
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

    // Get the updated unread count for the user
    const unreadCount = await prisma.message.count({
      where: {
        chat: {
          OR: [
            { userId: parseInt(userId) },
            { receiverId: parseInt(userId) }
          ]
        },
        userId: {
          not: parseInt(userId)
        },
        read: false
      }
    });

    // Update the chat's unread count
    await prisma.chat.update({
      where: { id: parseInt(chatId) },
      data: { unreadCount: 0 }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
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

const handleImageUpload = async (req, res) => {
  const cleanupTempFile = (path) => {
    if (path) {
      try {
        fs.unlinkSync(path);
        console.log('Temporary file cleaned up:', path);
      } catch (err) {
        console.error('Error cleaning up temporary file:', err);
      }
    }
  };

  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { chatId, senderId, receiverId } = req.body;

    if (!chatId || !senderId || !receiverId) {
      return res.status(400).json({
        error: 'Missing required fields',
        received: { chatId, senderId, receiverId },
      });
    }

    console.log('Processing image upload:', {
      chatId,
      senderId,
      receiverId,
      fileSize: req.files.image.size,
    });

    // Upload image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.files.image.path, {
      folder: 'chat_images',
    });

    console.log('Image uploaded successfully:', uploadResult.secure_url);

    // Clean up the temporary file
    cleanupTempFile(req.files.image.path);

    // Create a new message in the database
    const message = await prisma.message.create({
      data: {
        content: uploadResult.secure_url,
        type: 'IMAGE',
        chatId: parseInt(chatId, 10),
        userId: parseInt(senderId, 10),
        receiverId: parseInt(receiverId, 10),
        read: false,
        sentAt: new Date(),
      },
    });
    console.log('Message created in the database:', message);

    // Update the chat's metadata
    await prisma.chat.update({
      where: { id: parseInt(chatId, 10) },
      data: {
        lastMessageAt: new Date(),
        unreadCount: {
          increment: 1,
        },
      },
    });

    return res.status(200).json({
      message: 'File uploaded successfully',
      url: uploadResult.secure_url,
      messageId: message.id,
    });

  } catch (error) {
    console.error('File upload error:', error);

    // Clean up the temporary file in case of an error
    cleanupTempFile(req.files?.image?.path);

    return res.status(500).json({
      error: 'File upload failed',
      details: error.message,
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

    // Find the chat to get the participants
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

    // Ensure the user is part of this chat
    if (chat.userId !== parseInt(userId) && chat.receiverId !== parseInt(userId)) {
      return res.status(403).json({
        error: 'User is not part of this chat'
      });
    }

    // Count unread messages sent by the other user
    const messagesToMarkRead = await prisma.message.count({
      where: {
        chatId: parseInt(chatId),
        userId: chat.userId === parseInt(userId) ? chat.receiverId : chat.userId, // Messages from the other user
        isRead: false
      }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        chatId: parseInt(chatId),
        userId: chat.userId === parseInt(userId) ? chat.receiverId : chat.userId, // Messages from the other user
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    // Update chat's unread count
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

    // Emit socket event for real-time updates to the receiver
    if (req.io) {
      req.io.to(`user:${chat.userId}`).emit('messagesRead', {
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


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage


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
  handleFileUpload,
  sendPushNotification
}   
