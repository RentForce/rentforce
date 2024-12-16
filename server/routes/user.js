const express = require('express');
const { getUserData, updateUserData, signup, login, createPost, authenticateToken,addToFavourites,removeFromFavourites,getFavouritePosts} = require('../controller/user');
const {sendCode , verifyCode , updatePassword} = require('../controller/emailPassword')

const router = express.Router();

router.get('/:userId', getUserData);
router.put('/:userId', updateUserData);
router.post("/signup", signup)
router.post("/send-code", sendCode)
router.post("/verify-code", verifyCode)
router.post("/update-password", updatePassword)
router.post("/login", login)
router.post('/posts', authenticateToken, createPost);
router.post("/favourites", addToFavourites)
router.delete("/favourites", removeFromFavourites)
router.get("/favourites/:userId", getFavouritePosts)


module.exports = router;