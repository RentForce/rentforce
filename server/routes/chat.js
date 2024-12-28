const express = require('express');
const router = express.Router();
const {
  handleFileUpload,
  createChat,
  sendMessage,
  getUserChats,
  getAllUsers,
uploadImage,
uploadVoice,
sendPushNotification,
updatePushToken,
markChatAsRead,
  authMiddleware,
  //handleFileUpload,
  getUnreadCount,
  getUnreadMessages,
  markMessagesAsRead,
  getAllUsersWithChats,
  getConversations,
  getChatMessages,
  upload
} = require('../controller/chat');


router.post('/create', authMiddleware, createChat);
router.post('/message', authMiddleware, sendMessage);
router.get('/user/:userId', authMiddleware, getUserChats);
router.get('/messages/:chatId', authMiddleware, getChatMessages);
router.get('/users', authMiddleware, getAllUsersWithChats);
router.get('/conversations/:userId', getConversations);

//router.post('/upload', authMiddleware, handleFileUpload);
router.post('/push-token', authMiddleware, updatePushToken);
router.put('/:chatId/read/:userId', authMiddleware,markMessagesAsRead);
router.get('/unread/:userId', getUnreadMessages);
//router.post('/upload-image', authMiddleware, upload.single('image'), uploadImage);

router.post('/upload', authMiddleware, handleFileUpload);

// router.post(
//   '/upload-voice',authMiddleware,
  
//   upload.single('audio'),
//   uploadVoice
// );
router.use('/uploads', express.static('uploads'));



module.exports = router;