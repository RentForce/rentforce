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
  authMiddleware,
  handleFileUpload
} = require('../controller/chat');

// Remove local upload directories since we're using Cloudinary
// No need for fs and path modules anymore

// Chat routes
router.post('/create', authMiddleware, createChat);
router.post('/message', authMiddleware, sendMessage);
router.get('/user/:userId', authMiddleware, getUserChats);
router.get('/messages/:chatId', authMiddleware, getChatMessages);
router.get('/users', authMiddleware, getAllUsers);

// File upload routes
// router.post('/upload/image', authMiddleware, handleImageUpload);
// router.post('/upload/voice', authMiddleware, handleVoiceMessage);
router.post('/upload', authMiddleware, handleFileUpload);

// Translation route with rate limiting
//router.post('/translate', authMiddleware, translationLimiter, translateMessage);

module.exports = router;