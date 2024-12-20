import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Navbar from "../Home/Navbar";

const DEFAULT_PROFILE_IMAGE =
  "https://www.shutterstock.com/image-vector/user-icon-vector-trendy-flat-600nw-1720665448.jpg";

const ProfileScreen = ({ navigation, route }) => {
  const { userId: routeUserId, refresh, setRefresh, image } = route.params;
  const [userData, setUserData] = useState(route.params?.updatedUser || {});
  const [profileImage, setProfileImage] = useState(
    route.params?.updatedUser?.image || DEFAULT_PROFILE_IMAGE
  );
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  console.log(route.params, "sss");
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (route.params?.updatedUser) {
          setUserData(route.params.updatedUser);
          setProfileImage(route.params.updatedUser.image || DEFAULT_PROFILE_IMAGE);
          await AsyncStorage.setItem('userData', JSON.stringify(route.params.updatedUser));
          return;
        }

        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
          setProfileImage(parsedUserData.image || DEFAULT_PROFILE_IMAGE);
          return;
        }

        if (route.params?.userId) {
          const response = await axios.get(`${apiUrl}/user/${route.params.userId}`);
          setUserData(response.data);
          setProfileImage(response.data.image || DEFAULT_PROFILE_IMAGE);
        }
      } catch (err) {
        console.error("Error fetching user data:", err.message);
      }
    };

    fetchUserData();
  }, [route.params]);

  const handleLogout = async () => {
      try {
        // Clear AsyncStorage
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("userId");
        await AsyncStorage.removeItem("currentUser");
        console.log("cleared")
        
        // Navigate back to the sign-up page
        navigation.reset({
          index: 0,
          routes: [{ name: "signup" }], // Change to "signup"
        });
      } catch (error) {
        console.error("Error during logout:", error);
        Alert.alert("Logout Failed", "Could not log out. Please try again.");
      }
    };

  const handleNavigateToPersonalScreen = () => {
    navigation.navigate("personal", { userId: userData.id });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.mainContent}>
        <View style={styles.profileHeader}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          </View>
          <Text
            style={styles.profileName}
            onPress={() =>
              navigation.navigate("showprofile", { userId: userData.id })
            }
          >{`${userData.firstName} ${userData.lastName}`}</Text>
          <Text style={styles.profileEmail}>{userData.email}</Text>
        </View>

        <View style={styles.accountSettings}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleNavigateToPersonalScreen}
          >
            <View style={styles.settingContent}>
              <Ionicons name="person" size={20} color="#333" />
              <Text style={styles.settingText}>Personal information</Text>
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="card" size={20} color="#333" />
              <Text style={styles.settingText}>Payments and payouts</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="notifications" size={20} color="#333" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="lock-closed" size={20} color="#333" />
              <Text style={styles.settingText}>Privacy and sharing</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="briefcase" size={20} color="#333" />
              <Text style={styles.settingText}>Travel for work</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("CreatePost")} // Navigate to CreatePost
          >
            <View style={styles.settingContent}>
              <Ionicons name="create" size={20} color="#333" />
              <Text style={styles.settingText}>Create Post</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingContent}>
              <Ionicons name="exit" size={20} color="#333" />
              <Text style={styles.settingText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#fff",
    marginTop: 50,
  },
  imageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: "center",
    marginBottom: 20,
  },
  editIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 15,
    padding: 5,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  accountSettings: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingItem: {
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#f7f7f7",
    marginVertical: 3,
  },
  settingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginLeft: 10,
  },
});

export default ProfileScreen;
