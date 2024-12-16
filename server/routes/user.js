const {signup,login, getUserData, updateUserData,createPost,authenticateToken,addToFavourites,removeFromFavourites,getFavouritePosts } = require("../controller/user")
const express = require("express")
const {sendCode,verifyCode,updatePassword} = require("../controller/emailPassword")
const userroute = express.Router()




userroute.post("/signup" , signup)
userroute.post("/login",login)
userroute.post("/send-code",sendCode)
userroute.post("/verify-code",verifyCode)
userroute.post("/update-password",updatePassword)
userroute.get('/:userId', getUserData);
userroute.put('/:userId', updateUserData);
userroute.post("/send-code",sendCode)
userroute.post("/verify-code",verifyCode)
userroute.post("/update-password",updatePassword)
userroute.post('/posts', authenticateToken, createPost);
userroute.post('/favourites',  addToFavourites);
userroute.delete('/favourites',  removeFromFavourites);
userroute.get('/favourites/:userId',  getFavouritePosts);


module.exports = userroute 
