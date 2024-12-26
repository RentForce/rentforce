import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotifications } from '../chat/Notifications.jsx';
import { NotificationBadge } from "../chat/NotificationBadge.jsx";

const Navbar = ({ navigation }) => {
  const { unreadCount } = useNotifications();
  console.log('Navbar rendering with unread count:', unreadCount);

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

  useEffect(() => {
    console.log('Navbar unread count:', unreadCount);
  }, [unreadCount]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={handleConfirmExplore}
      >
        <Ionicons name="search-outline" size={24} style={styles.icon} />
        <Text style={styles.text}>Explore</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('favourites')}>
        <Ionicons name="heart-outline" size={24} style={styles.icon} />
        <Text style={styles.text}>Favourites</Text>
        
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.iconContainer} 
        onPress={() => navigation.navigate("ChatSelectionScreen")}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="chatbubble-outline" size={24} style={styles.icon} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.text}>Inbox</Text>
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
  iconWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
 
});

export default Navbar;
