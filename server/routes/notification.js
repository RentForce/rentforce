const express = require("express");
const router = express.Router();
const {
  getNotifications,
  handleBookingAction,
  getUnreadCount,
  markSelectedAsRead,
} = require("../controller/notification");

router.get("/user/:userId", getNotifications);
router.get("/unread/:userId", getUnreadCount);
router.post("/booking-action", handleBookingAction);
router.post("/mark-selected-read", markSelectedAsRead);

module.exports = router;