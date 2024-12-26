import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationIcon from "../../components/NotificationIcon";

const Navbar = ({ navigation, userId }) => {
  const [pressedIcon, setPressedIcon] = useState(null);

  const handleConfirmExplore = () => {
    console.log("Navigating to Home");
    navigation.navigate("Home");
  };

  const handleProfileNavigation = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedUserData = JSON.parse(userData);
      navigation.navigate("profile", {
        userId: parsedUserData.id,
        updatedUser: parsedUserData,
      });
    } catch (error) {
      console.error("Error navigating to profile:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <Ionicons name="search-outline" size={24} style={styles.icon} />
        <Text style={styles.text}>Explore</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.iconContainer} 
        onPress={() => navigation.navigate('favourites')}
      >
        <MaterialIcons name="bookmark-outline" size={24} style={styles.icon} />
        <Text style={styles.text}>Saved</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.iconContainer} 
        onPress={() => navigation.navigate("ChatSelectionScreen")}
        onPressIn={() => setPressedIcon("chat")}
        onPressOut={() => setPressedIcon(null)}
      >
        <Ionicons name="chatbubble-outline" size={24} style={styles.icon} />
        <View style={styles.notificationDot} />
        <Text style={styles.text}>Inbox</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.iconContainer,
          pressedIcon === "notifications" && styles.pressedIcon,
        ]}
        onPress={() => navigation.navigate("notifications")}
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
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#082631",
  },
  iconContainer: {
    alignItems: "center",
    transform: [{ scale: 1 }],
  },
  pressedIcon: {
    transform: [{ scale: 1.2 }],
  },
  icon: {
    color: "#fff",
    margin: 5,
  },
  text: {
    fontSize: 12,
    color: "#888",
  },
  textSpacing: {
    marginTop: 8,
  },
});

export default Navbar;
