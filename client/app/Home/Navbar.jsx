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
        style={[styles.iconContainer, styles.exploreIcon]}
        onPress={() => navigation.navigate("Home")}
        activeOpacity={0.7}
      >
        <View style={styles.exploreCircle}>
          <Ionicons
            name="search"
            size={30}
            style={[styles.icon, { color: '#082631'}]}
          />
        </View>
        <Text style={styles.text}></Text>
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
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 10,
    paddingBottom: 15,
    backgroundColor: "#082631",
    position: 'relative',
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: '18%',
    marginBottom: 0,
    padding: 5,
  },
  pressedIcon: {
    transform: [{ scale: 1.2 }],
  },
  icon: {
    marginLeft: 0,
    marginRight: 0,
    color: "#fff",
    marginBottom: 4,
    transform: [{ scale: 1 }],
  },
  text: {
    fontSize: 12,
    color: "#fff",
    textAlign: 'center',
    marginTop: 2,
  },
  spacedIcon: {
    marginLeft: 10,
  },
  badge: {
    backgroundColor: "#ff0000",
    borderRadius: 10,
    padding: 2,
    position: "absolute",
    top: -5,
    right: -5,
  },
  badgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  textSpacing: {
    marginTop: 5,
  },
  exploreIcon: {
    marginTop: -30,
    marginRight: -16,
  },
  exploreCircle: {
    backgroundColor: '#fff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginRight: 6,
  },
});

export default Navbar;
