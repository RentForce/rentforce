const {signup,login } = require("../controller/user")
const express = require("express")
const {sendCode,verifyCode,updatePassword} = require("../controller/emailPassword")
const userroute = express.Router()


userroute.post("/signup" , signup)
userroute.post("/login",login)
userroute.post("/send-code",sendCode)
userroute.post("/verify-code",verifyCode)
userroute.post("/update-password",updatePassword)
module.exports = userroute 