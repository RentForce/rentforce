import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Animated,
  Platform,
} from "react-native";
import axios from "axios";
import { io } from "socket.io-client";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Navbar from "../Home/Navbar";
import { useNavigation } from "@react-navigation/native";

const EmptyNotifications = () => {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={80} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No Notifications Yet</Text>
      <Text style={styles.emptyText}>
        When you get notifications, they'll show up here. Stay tuned!
      </Text>
    </View>
  );
};

const NotificationScreen = ({ navigation }) => {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const socket = useRef(null);

  useEffect(() => {
    const initializeScreen = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (storedUserId) {
        setUserId(storedUserId);
        setupSocket(storedUserId);
        fetchNotifications(storedUserId);
      }
    };

    initializeScreen();
  }, []);

  const setupSocket = (currentUserId) => {
    console.log("Setting up socket connection...");
    socket.current = io(apiUrl, {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.current.on("connect", () => {
      console.log("Socket connected, joining room for userId:", currentUserId);
      socket.current.emit("join_notification_room", currentUserId);
    });

    socket.current.on("new_notification", (newNotification) => {
      console.log("Received new notification:", newNotification);
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.current.on("booking_status_update", (updatedBooking) => {
      console.log("Received booking update:", updatedBooking);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.bookingId === updatedBooking.id
            ? { ...notif, booking: updatedBooking, isRead: true }
            : notif
        )
      );
    });

    socket.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  };

  const fetchNotifications = async (currentUserId) => {
    try {
      const response = await axios.get(
        `${apiUrl}/notification/user/${currentUserId}`
      );
      setNotifications(response.data);
      const unreadNotifications = response.data.filter(
        (notif) => !notif.isRead
      );
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    }
  };

  const handleRefresh = () => {
    if (userId) {
      fetchNotifications(userId);
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    try {
      const response = await axios.post(
        `${apiUrl}/notification/booking-action`,
        {
          bookingId,
          status,
          userId,
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => {
          if (notif.bookingId === bookingId) {
            return {
              ...notif,
              booking: response.data.booking,
              isRead: true,
            };
          }
          return notif;
        })
      );

      // Update unread count
      setUnreadCount(response.data.unreadCount);

      Alert.alert("Success", `Booking ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error("Error handling booking action:", error);
      Alert.alert("Error", "Failed to process booking action");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Filter out BOOKING_REQUEST notifications that haven't been acted upon
      const notificationsToUpdate = notifications.filter(
        (notif) =>
          !notif.isRead &&
          (notif.type !== "BOOKING_REQUEST" ||
            (notif.booking &&
              ["CONFIRMED", "REJECTED"].includes(notif.booking.status)))
      );

      if (notificationsToUpdate.length === 0) {
        Alert.alert("Info", "No notifications to mark as read");
        return;
      }

      const notificationIds = notificationsToUpdate.map((notif) => notif.id);

      const response = await axios.post(
        `${apiUrl}/notification/mark-selected-read`,
        {
          notificationIds,
          userId: userId,
        }
      );

      if (response.data.success) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) =>
            notificationIds.includes(notif.id)
              ? { ...notif, isRead: true }
              : notif
          )
        );

        // Update unread count excluding pending booking requests
        const remainingUnread = notifications.filter(
          (notif) =>
            !notif.isRead &&
            notif.type === "BOOKING_REQUEST" &&
            (!notif.booking ||
              !["CONFIRMED", "REJECTED"].includes(notif.booking.status))
        ).length;

        setUnreadCount(remainingUnread);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      Alert.alert("Error", "Failed to mark notifications as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "BOOKING_REQUEST":
        return "calendar-outline";
      case "BOOKING_CONFIRMED":
        return "checkmark-circle-outline";
      case "BOOKING_REJECTED":
        return "close-circle-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "BOOKING_REQUEST":
        return "#3498db";
      case "BOOKING_CONFIRMED":
        return "#2ecc71";
      case "BOOKING_REJECTED":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const handlePaymentNavigation = (booking) => {
    navigation.navigate("payment", {
      amount: booking.totalPrice,
      bookingId: booking.id,
    });
  };

  const renderNotification = ({ item }) => (
    <Animated.View
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadNotification,
        styles.shadowProps,
      ]}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color={getNotificationColor(item.type)}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>{item.message}</Text>
          <Text style={styles.timeText}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      {item.type === "BOOKING_CONFIRMED" && item.booking && (
        <TouchableOpacity
          style={[
            styles.paymentButton,
            item.booking.isPaid ? styles.confirmedButton : styles.pendingButton
          ]}
          onPress={() => !item.booking.isPaid && handlePaymentNavigation(item.booking)}
          disabled={item.booking.isPaid}
        >
          <Ionicons 
            name={item.booking.isPaid ? "checkmark-circle-outline" : "card-outline"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.paymentButtonText}>
            {item.booking.isPaid ? 'Payment Confirmed' : 'Payment Pending - Pay Now'}
          </Text>
        </TouchableOpacity>
      )}

      {item.type === "BOOKING_REQUEST" && !item.isRead && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleBookingAction(item.bookingId, "CONFIRMED")}
          >
            <Ionicons name="checkmark-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleBookingAction(item.bookingId, "REJECTED")}
          >
            <Ionicons name="close-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, styles.shadowProps]}
            onPress={handleMarkAllAsRead}
          >
            <Ionicons name="checkmark-done-outline" size={20} color="#666" />
            <Text style={styles.markAllButtonText}>
              Mark all non-booking requests as read
            </Text>
          </TouchableOpacity>
        )}
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => `notification-${item.id}`}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor="#3498db"
            />
          }
          contentContainerStyle={[
            styles.listContainer,
            notifications.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={<EmptyNotifications />}
        />
      </View>
      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#e0e0e0",
  },
  unreadNotification: {
    borderLeftColor: "#3498db",
    backgroundColor: "#fff",
  },
  shadowProps: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    color: "#2c3e50",
    lineHeight: 20,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#95a5a6",
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    minWidth: 100,
  },
  acceptButton: {
    backgroundColor: "#1A3C40",
  },
  rejectButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    gap: 8,
  },
  markAllButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: "50%",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#475569",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyList: {
    flex: 1,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#082631',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    justifyContent: 'center',
    gap: 8,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingButton: {
    backgroundColor: '#FFA500',
  },
  confirmedButton: {
    backgroundColor: '#2D5A27',
  },
});

export default NotificationScreen;
