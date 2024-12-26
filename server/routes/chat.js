const express = require('express');
const router = express.Router();
const {
  createChat,
  sendMessage,
  getUserChats,
  getChatMessages,
  getAllUsers,
//   handleImageUpload,
//   handleVoiceMessage,
  //translateMessage,
//   translationLimiter,
sendPushNotification,
updatePushToken,
markChatAsRead,
  authMiddleware,
  handleFileUpload,
  getUnreadCount,
  getUnreadMessages,
  markMessagesAsRead,
  getAllUsersWithChats
} = require('../controller/chat');

// Remove local upload directories since we're using Cloudinary
// No need for fs and path modules anymore

// Chat routes
router.post('/create', authMiddleware, createChat);
router.post('/message', authMiddleware, sendMessage);
router.get('/user/:userId', authMiddleware, getUserChats);
router.get('/messages/:chatId', authMiddleware, getChatMessages);
router.get('/users', authMiddleware, getAllUsersWithChats);

// File upload routes
// router.post('/upload/image', authMiddleware, handleImageUpload);
// router.post('/upload/voice', authMiddleware, handleVoiceMessage);
router.post('/upload', authMiddleware, handleFileUpload);
router.post('/push-token', authMiddleware, updatePushToken);
//router.put('/chat/:chatId/read/:userId', authMiddleware, markChatAsRead);
//router.get('/unread/:userId', authMiddleware, getUnreadCount);

// Translation route with rate limiting
//router.post('/translate', authMiddleware, translationLimiter, translateMessage);

// Add this new route for unread messages
//router.get('/unread/:userId', authMiddleware, getUnreadMessages);

// Mark messages as read
router.put('/:chatId/read/:userId', markMessagesAsRead);
router.get('/unread/:userId', getUnreadMessages);
router.put('/messages/read/:chatId/:userId', markMessagesAsRead);



module.exports = router;