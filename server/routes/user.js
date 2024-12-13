const express = require('express');
const { getUserData, updateUserData, signup, login, createPost, authenticateToken} = require('../controller/user');

const router = express.Router();

router.get('/:userId', getUserData);
router.put('/:userId', updateUserData);
router.post("/signup", signup)
router.post("/login", login)

router.post('/posts', authenticateToken, createPost);

module.exports = router;