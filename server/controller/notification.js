const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createNotification = async (req, type, message, userId, bookingId) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        message,
        userId,
        bookingId,
        isRead: false,
      },
    });

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    if (req.io) {
      req.io.to(`user_${userId}`).emit("new_notification", notification);
      req.io
        .to(`user_${userId}`)
        .emit("unread_count_update", { count: unreadCount });
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

const getNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: "desc" },
      include: { booking: true },
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const handleBookingAction = async (req, res) => {
  const { bookingId, status, userId } = req.body;

  try {
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      include: { post: { include: { user: true } }, user: true },
      data: { status },
    });

    // Mark the original booking request notification as read
    await prisma.notification.updateMany({
      where: {
        bookingId,
        type: "BOOKING_REQUEST",
        userId: updatedBooking.post.userId,
      },
      data: {
        isRead: true,
      },
    });

    // Create notification for the booking requester
    const notification = await prisma.notification.create({
      data: {
        type: `BOOKING_${status}`,
        message: `Your booking request has been ${status.toLowerCase()}`,
        userId: updatedBooking.userId,
        bookingId,
      },
    });

    // Get updated unread count for the host
    const hostUnreadCount = await prisma.notification.count({
      where: {
        userId: updatedBooking.post.userId,
        isRead: false,
      },
    });

    if (req.io) {
      // Emit new notification to the requester
      req.io
        .to(`notification-${updatedBooking.userId}`)
        .emit("new_notification", notification);

      // Emit booking update to the requester
      req.io
        .to(`booking-update-${updatedBooking.userId}`)
        .emit("booking_status_update", updatedBooking);

      // Emit updated unread count to the host
      req.io
        .to(`notification-${updatedBooking.post.userId}`)
        .emit("unread_count_update", { count: hostUnreadCount });
    }

    res.json({
      notification,
      booking: updatedBooking,
      unreadCount: hostUnreadCount,
    });
  } catch (error) {
    console.error("Error handling booking action:", error);
    res.status(500).json({ error: "Failed to process booking action" });
  }
};

const getUnreadCount = async (req, res) => {
  const { userId } = req.params;

  try {
    const count = await prisma.notification.count({
      where: {
        userId: parseInt(userId),
        isRead: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

const markSelectedAsRead = async (req, res) => {
  const { notificationIds, userId } = req.body;

  try {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: parseInt(userId),
      },
      data: {
        isRead: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: parseInt(userId),
        isRead: false,
      },
    });

    if (req.io) {
      req.io.to(`notification-${userId}`).emit("unread_count_update", {
        count: unreadCount,
      });
    }

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Error marking selected notifications as read:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  handleBookingAction,
  getUnreadCount,
  markSelectedAsRead,
};