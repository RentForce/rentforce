import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import axios from "axios";
import * as Haptics from "expo-haptics";

const NotificationIcon = ({ color = "black", size = 24 }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();
  const socket = useRef(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const setupNotifications = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        console.log("Setting up notifications for user:", userId);
        socket.current = io(apiUrl, {
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.current.on("connect", () => {
          console.log("NotificationIcon socket connected for user:", userId);
          socket.current.emit("join_notification_room", userId);
        });

        socket.current.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
        });

        socket.current.on("reconnect", (attemptNumber) => {
          console.log("Socket reconnected after", attemptNumber, "attempts");
        });

        socket.current.on("new_notification", async (notification) => {
          console.log("Received new notification in icon:", notification);
          setUnreadCount((prev) => prev + 1);
          // Vibrate on new notification
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        });

        // Listen for unread count updates
        socket.current.on("unread_count_update", (data) => {
          console.log("Received unread count update:", data);
          setUnreadCount(data.count);
        });

        // Fetch initial unread count
        try {
          const response = await axios.get(
            `${apiUrl}/notification/unread/${userId}`
          );
          setUnreadCount(response.data.count);
        } catch (error) {
          console.error("Error fetching unread count:", error);
        }
      }
    };

    setupNotifications();

    return () => {
      if (socket.current) {
        console.log("Disconnecting notification icon socket");
        socket.current.disconnect();
      }
    };
  }, []);

  const handlePress = async () => {
    try {
      navigation.navigate("notifications");
    } catch (error) {
      console.error("Error navigating to notifications:", error);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View>
        <Ionicons name="notifications-outline" size={size} color={color} />
        {unreadCount > 0 && (
          <View style={[styles.badge, { right: -size / 3, top: -size / 4 }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default NotificationIcon;

const styles = {
  badge: {
    position: "absolute",
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#082631", // Match navbar background color
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
};
