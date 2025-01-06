const express = require('express');
const { getUserData, updateUserData, signup, login, createPost, authenticateToken,addToFavourites,removeFromFavourites,getFavouritePosts, getUserHistory, createHistory} = require('../controller/user');
const {sendCode , verifyCode , updatePassword} = require('../controller/emailPassword')
const jwt = require('jsonwebtoken');

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
router.get('/:userId/history', getUserHistory)
router.post('/history', createHistory);
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Generate new tokens
    const newToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const newRefreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;