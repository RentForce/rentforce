const express = require('express')
const { 
  createChat, 
  sendMessage, 
  getUserChats, 
  getChatMessages,
  getAllUsers ,
  authMiddleware,
  createCallLog,
  generateAgoraToken
} = require('../controller/chat')

const router = express.Router()

router.post('/create', createChat)
router.post('/message', sendMessage)
router.get('/user/:userId', getUserChats)
router.get('/messages/:chatId', getChatMessages)
router.get('/users', authMiddleware, getAllUsers);
router.post('/createCall',createCallLog)


router.post('/call/generate-token', authMiddleware,generateAgoraToken);

module.exports = router