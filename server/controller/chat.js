const { PrismaClient } = require('@prisma/client')
const express = require('express')
const prisma = new PrismaClient()
const jwt=require ('jsonwebtoken')
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

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
const createCallLog= async  (req, res)=> {
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

const generateAgoraToken= (req, res) => {
  const { channelName, userId } = req.body;
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  const role = RtcRole.PUBLISHER;
  const expirationTime = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
      appId, 
      appCertificate, 
      channelName, 
      userId, 
      role, 
      privilegeExpiredTs
  );

  res.json({ token });
}
module.exports = {
  createChat,
  sendMessage,
  getUserChats,
  getChatMessages,
  getAllUsers,
  authMiddleware,
  createCallLog,
generateAgoraToken
}