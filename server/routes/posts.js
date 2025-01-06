const express = require("express");
const {
  getPostsByCategory,
  getImagesByPostId,
  createBooking,
  addComment,
  getPostBookings,
  getBookedDates,
  checkDateAvailability,
  saveImage,
  saveLocation,
  getPostComments,
  authenticateToken,
  checkUserBooking,
  getPostDetails,
} = require("../controller/posts");
const router = express.Router();
// Add this new route
router.get("/all", getPostsByCategory);
router.get("/posts/:category", getPostsByCategory);
// router.get("/:category", getPostsByCategory);
router.get("/images/:postId", getImagesByPostId);
router.get(
  "/:postId/check-booking/:userId",
  authenticateToken,
  checkUserBooking
);
router.post("/booking", createBooking);

router.get("/bookings/:postId", getPostBookings);
// Add this route
router.post("/:postId/comments", authenticateToken, addComment);

router.get("/:postId/booked-dates", getBookedDates);
router.get("/check-availability", checkDateAvailability);

router.post("/posts/images", saveImage);
router.post("/posts/location", saveLocation);

router.get('/:postId/comments', getPostComments);

router.get("/:postId", getPostDetails);

module.exports = router;
