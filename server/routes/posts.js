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
} = require("../controller/posts");
const { createNotification } = require("../controller/notification");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

router.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

router.get("/all", async (req, res, next) => {
  try {
    await getPostsByCategory(req, res);
  } catch (error) {
    next(error);
  }
});

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

router.get("/:postId/comments", getPostComments);
router.get("/posts/:id", authenticateToken, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        images: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error: error.message });
  }
});

router.put("/booking/:bookingId/payment-status", authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { isPaid } = req.body;

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { 
        id: parseInt(bookingId) 
      },
      data: { 
        isPaid: Boolean(isPaid),
        status: isPaid ? 'CONFIRMED' : 'PENDING',
        updatedAt: new Date()
      },
      include: {
        post: {
          include: {
            user: true
          }
        },
        user: true
      }
    });

    // Update history entry
    await prisma.history.updateMany({
      where: {
        postId: updatedBooking.postId,
        userId: updatedBooking.userId,
        checkInDate: updatedBooking.startDate,
        checkOutDate: updatedBooking.endDate
      },
      data: {
        status: isPaid ? 'CONFIRMED' : 'PENDING',
        totalPrice: updatedBooking.totalPrice
      }
    });

    // Create notification for payment status
    if (updatedBooking) {
      const notificationMessage = isPaid 
        ? `Payment confirmed for booking #${bookingId}`
        : `Payment pending for booking #${bookingId}`;
        
      const notification = await prisma.notification.create({
        data: {
          type: isPaid ? "PAYMENT_CONFIRMED" : "PAYMENT_PENDING",
          message: notificationMessage,
          userId: updatedBooking.post.user.id,
          bookingId: updatedBooking.id,
          isRead: false
        }
      });

      // Emit notification if socket is available
      if (req.io) {
        req.io.to(`user_${updatedBooking.post.user.id}`).emit("new_notification", notification);
      }
    }

    res.json({
      success: true,
      booking: updatedBooking
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating payment status",
      error: error.message
    });
  }
});

// Add this route to handle post updates
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const updatedData = req.body;

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        title: updatedData.title,
        description: updatedData.description,
        price: parseFloat(updatedData.price),
        location: updatedData.location,
        category: updatedData.category,
        cancellationPolicy: updatedData.cancellationPolicy,
        roomConfiguration: updatedData.roomConfiguration,
        houseRules: updatedData.houseRules,
        safetyProperty: updatedData.safetyProperty
      },
      include: {
        images: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ 
      message: "Error updating post", 
      error: error.message 
    });
  }
});

module.exports = router;