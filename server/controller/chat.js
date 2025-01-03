const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')
const axios = require('axios')
const cloudinary = require('cloudinary').v2
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'No authentication token' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', expired: true })
    }
    res.status(401).json({ error: 'Please authenticate' })
  }
}

const getAllUsersWithChats = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })

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
            email: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true
          }
        }
      }
    })

    const usersMap = new Map()
    chats.forEach(chat => {
      if (chat.userId === req.user.id && chat.receiver) {
        usersMap.set(chat.receiver.id, chat.receiver)
      }
      if (chat.receiverId === req.user.id && chat.user) {
        usersMap.set(chat.user.id, chat.user)
      }
    })

    res.json(Array.from(usersMap.values()))
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' })
  }
}

const createChat = async (req, res) => {
  try {
    const { userId, receiverId } = req.body

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
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      }
    })

    if (existingChat) return res.status(200).json(existingChat)

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
    })
    res.status(201).json(newChat)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat' })
  }
}

const sendMessage = async (req, res) => {
  try {
    const { content, chatId, userId, receiverId, type } = req.body

    const message = await prisma.message.create({
      data: {
        content,
        type: type || 'TEXT',
        chatId: parseInt(chatId),
        userId: parseInt(userId),
        receiverId: parseInt(receiverId),
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
    })

    await prisma.chat.update({
      where: { id: parseInt(chatId) },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 }
      }
    })

    if (req.io && receiverId) {
      req.io.to(`user_${receiverId}`).emit('new_message', message)
      req.io.to(`user_${receiverId}`).emit('update_unread_count', {
        chatId: parseInt(chatId),
        unreadCount: 1
      })
    }

    res.status(201).json(message)
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' })
  }
}

const getConversations = async (req, res) => {
  try {
    const { userId } = req.params
    const parsedUserId = parseInt(userId)

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
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      }
    })

    const formattedConversations = conversations.map(chat => {
      const isReceiver = chat.receiverId === parsedUserId
      const otherUser = isReceiver ? chat.user : chat.receiver
      
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
      }
    })

    res.status(200).json(formattedConversations)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get conversations' })
  }
}

const getChatMessages = async (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId)
    const messages = await prisma.message.findMany({
      where: { chatId },
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
      orderBy: { sentAt: 'asc' }
    })
    res.status(200).json(messages)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get messages' })
  }
}

const getUnreadMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get total unread messages where user is the receiver
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: parseInt(userId),
        read: false
      }
    });

    res.status(200).json({ 
      success: true, 
      count: unreadCount 
    });
  } catch (error) {
    console.error('Error getting unread messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get unread messages' 
    });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    // Mark messages as read where user is the receiver
    const updatedMessages = await prisma.message.updateMany({
      where: {
        chatId: parseInt(chatId),
        receiverId: parseInt(userId),
        read: false
      },
      data: { read: true }
    });

    // Get remaining unread count for this user
    const remainingUnread = await prisma.message.count({
      where: {
        receiverId: parseInt(userId),
        read: false
      }
    });

    // Emit socket event with updated count
    if (req.io) {
      req.io.to(`user_${userId}`).emit('messages_read', {
        chatId: parseInt(chatId),
        userId: parseInt(userId),
        unreadCount: remainingUnread
      });
    }

    res.status(200).json({ 
      success: true, 
      updatedCount: updatedMessages.count,
      unreadCount: remainingUnread
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark messages as read' 
    });
  }
};

const handleFileUpload = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, err => err ? reject(err) : resolve())
    })

    if (!req.file) return res.status(400).json({ error: 'No file provided' })

    const { chatId, senderId, receiverId } = req.body
    console.log("type", req.file.mimetype)
    const messageType = req.file.mimetype.startsWith('audio/') || 
    req.file.originalname.toLowerCase().endsWith('.m4a') 
    ? 'AUDIO' 
    : 'IMAGE'
    const message = await prisma.message.create({
      data: {
        chatId: parseInt(chatId),
        userId: parseInt(senderId),
        receiverId: parseInt(receiverId),
        content: req.file.path,
        type: messageType
      }
    })

    res.status(200).json({
      message: 'File uploaded successfully',
      url: req.file.path,
      messageId: message.id
    })
  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({ error: 'File upload failed' })
  }
}

const sendPushNotification = async (expoPushToken, messageData) => {
  if (!expoPushToken) return

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: `New message from ${messageData.senderName}`,
    body: messageData.type === 'IMAGE' ? '📷 Image' : 
          messageData.type === 'AUDIO' ? '🎵 Voice message' : 
          messageData.content,
    data: { messageData, type: 'CHAT_MESSAGE', chatId: messageData.chatId },
  }

  try {
    await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    console.error('Push notification error:', error)
  }
}
const updatePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body
    const userId = req.user.id

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
      select: { id: true, expoPushToken: true }
    })

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update push token' })
  }
}

const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params
    const count = await prisma.message.count({
      where: {
        receiverId: parseInt(userId),
        read: false
      }
    })
    res.json({ count })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getUserChats = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
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
    res.status(500).json({ error: 'Could not fetch chats' })
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isAudio = file.mimetype.startsWith('audio/')
    const isImage = file.mimetype.startsWith('image/')
    
    return {
      folder: isAudio ? 'chat-audio' : 'chat-images',
      resource_type: isAudio ? 'video' : 'image',
      allowed_formats: isAudio ? ['m4a', 'mp3', 'wav','mp4'] : ['jpg', 'jpeg', 'png'],
      transformation: isImage ? [{ quality: 'auto:good' }] : []
    }
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mimeType = file.mimetype.toLowerCase()
    if (mimeType.startsWith('audio/') || mimeType.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
}).single('file')

module.exports = {
  authMiddleware,
  getAllUsersWithChats,
  createChat,
  sendMessage,
  getConversations,
  getChatMessages,
  markMessagesAsRead,
  handleFileUpload,
  sendPushNotification,
  updatePushToken,
  getUnreadCount,
  getUserChats,
  getUnreadMessages
}