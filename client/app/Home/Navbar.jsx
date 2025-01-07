import React, { useState,useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationIcon from "../../components/NotificationIcon";
import { useNotifications } from "../chat/Notifications.jsx";
import { NotificationBadge } from "../chat/NotificationBadge.jsx";

const Navbar = ({ navigation, userId }) => {
  const { unreadCount } = useNotifications();
  const [pressedIcon, setPressedIcon] = useState(null);
  const token = AsyncStorage.getItem("userToken");

  const handleConfirmExplore = () => {
    console.log("Navigating to Home");
    navigation.navigate("Home");
  };
  useEffect(() => {
    console.log("Navbar unread count:", unreadCount);
  }, [unreadCount]);
  const handleProfileNavigation = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        navigation.navigate("signup");
      } else {
        const parsedUserData = JSON.parse(userData);
        navigation.navigate("profile", {
          userId: parsedUserData.id,
          updatedUser: parsedUserData,
        });
      }
    } catch (error) {
      console.error("Error navigating to profile:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => navigation.navigate("ChatSelectionScreen")}
        onPressIn={() => setPressedIcon("chat")}
        onPressOut={() => setPressedIcon(null)}
      >
        <View style={styles.iconWrapper}>
          <Ionicons 
            name="chatbubble-outline" 
            size={24} 
            style={styles.icon} 
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.text}>Inbox</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.iconContainer, styles.spacedIcon]}
        onPress={() => {
          if (token) {
            navigation.navigate("favourites");
          } else {
            navigation.navigate("signup");
          }
        }}
      >
        <MaterialIcons name="bookmark-outline" size={24} style={styles.icon} />
        <Text style={styles.text}>Saved</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.exploreContainer}
        onPress={() => navigation.navigate("Home")}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="search-outline"
          size={24}
          style={styles.exploreIcon}
        />
        <Text style={styles.exploreText}>Explore</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconContainer, styles.spacedIcon]}
        onPress={() => {
          if (token) {
            navigation.navigate("notifications");
          } else {
            navigation.navigate("signup");
          }
        }}
        onPressIn={() => setPressedIcon("notifications")}
        onPressOut={() => setPressedIcon(null)}
      >
        <NotificationIcon size={24} color="#fff" />
        <Text style={[styles.text, styles.textSpacing]}>Ping</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.iconContainer,
          pressedIcon === "profile" && styles.pressedIcon,
        ]}
        onPress={handleProfileNavigation}
        onPressIn={() => setPressedIcon("profile")}
        onPressOut={() => setPressedIcon(null)}
      >
        <Ionicons name="person-outline" size={24} style={styles.icon} />
        <Text style={styles.text}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    backgroundColor: "#082631",
  },
  iconContainer: {
    alignItems: "baseline",
    marginBottom: 6,
    transform: [{ scale: 1 }],
    padding: 3,
  },
  pressedIcon: {
    transform: [{ scale: 1.2 }],
  },
  icon: {
    marginLeft: 5,
    marginRight: 4,
    color: "#fff",
    margin: 5,
    transform: [{ scale: 1 }],
  },
  text: {
    fontSize: 13,
    color: "#888",
    marginLeft: 2,
    marginRight: 4,
    alignItems: "baseline",
  },
  textSpacing: {
    marginBottom: -6,
    marginTop: 5,
    marginLeft: 4,
    marginRight: 4,
  },
  exploreContainer: {
    position: "absolute",
    top: -55,
    left: "51%",
    transform: [{ translateX: -25 }],
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#082631",
    borderRadius: 50,
    width: 51,
    height: 51,
    marginTop: 32,
  },
  exploreIcon: {
    color: "#fff",
    transform: [{ scale: 1.3 }],
    marginTop: 16,
    marginBottom: 15,
  },
  exploreText: {
    fontSize: 12,
    color: "#fff",
  },
});

export default Navbar;
