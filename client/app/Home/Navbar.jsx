import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Navbar = ({ navigation, userId }) => {
  const handleConfirmExplore = () => {
    console.log("Navigating to Home");
    navigation.navigate("Home");

  };

  const handleProfileNavigation = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedUserData = JSON.parse(userData);
      navigation.navigate('profile', { 
        userId: parsedUserData.id,
        updatedUser: parsedUserData
      });
    } catch (error) {
      console.error("Error navigating to profile:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={  ()=>  navigation.navigate("Home")}>
        <Ionicons name="search-outline" size={24} style={styles.icon} />
        <Text style={styles.text}>Explore</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('favourites')}>
        <Ionicons name="heart-outline" size={24} style={styles.icon} />
        <Text style={styles.text}>Favourites</Text>
        
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconContainer} onPress={  ()=>  navigation.navigate("ChatSelectionScreen")}>
        <Ionicons name="chatbubble-outline" size={24} style={styles.icon} />
        <View style={styles.notificationDot} />
        <Text style={styles.text}  >Inbox</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.iconContainer} 
        onPress={handleProfileNavigation}
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
    padding: 10,
    backgroundColor: "#082631",
  },
  iconContainer: {
    alignItems: "center",
  },
  icon: {
    color: "#fff",
  },
  text: {
    fontSize: 12,
    color: "#888",
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default Navbar;
