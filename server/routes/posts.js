const express = require("express");
const {
  getPostsByCategory,
  getImagesByPostId,
  createBooking,
  getPostBookings,
  getBookedDates,
  checkDateAvailability,
} = require("../controller/posts");
const router = express.Router();

router.get("/all", getPostsByCategory);
router.get("/posts/:category", getPostsByCategory);
// router.get("/:category", getPostsByCategory);
router.get("/images/:postId", getImagesByPostId);
router.post("/booking", createBooking);

router.get("/bookings/:postId", getPostBookings);

router.get("/:postId/booked-dates", getBookedDates);
router.get("/check-availability", checkDateAvailability);
module.exports = router;
