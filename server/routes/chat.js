const express = require('express');
const router = express.Router();
const { 
  getMessages, 
  sendMessage, 
  markMessagesAsRead, 
  handleFileUpload,
  createChat,
  getUserChats,
  getAllUsers,
  uploadImage,
  uploadVoice,
  sendPushNotification,
  updatePushToken,
  markChatAsRead,
  authMiddleware,
  getUnreadCount,
  getUnreadMessages,
  getAllUsersWithChats,
  getConversations,
  getChatMessages,
} = require('../controller/chat');

router.post('/create', authMiddleware, createChat);
router.post('/message', authMiddleware, sendMessage);
router.get('/user/:userId', authMiddleware, getUserChats);
router.get('/messages/:chatId', authMiddleware, getChatMessages);
router.get('/users', authMiddleware, getAllUsersWithChats);
router.get('/conversations/:userId', getConversations);
router.post('/upload', authMiddleware, handleFileUpload);
router.post('/push-token', authMiddleware, updatePushToken);
router.put('/:chatId/read/:userId', authMiddleware,markMessagesAsRead);
router.get('/unread/:userId', getUnreadMessages);
router.use('/uploads', express.static('uploads'));

// Add this new route for unread messages
//router.get('/unread/:userId', authMiddleware, getUnreadMessages);

// Mark messages as read
router.get('/unread/:userId', getUnreadMessages);



module.exports = router;