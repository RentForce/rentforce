import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Navbar from "../Home/Navbar";
import Animated, { FadeInDown } from 'react-native-reanimated';

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
          setProfileImage(
            route.params.updatedUser.image || DEFAULT_PROFILE_IMAGE
          );
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(route.params.updatedUser)
          );
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
          const response = await axios.get(
            `${apiUrl}/user/${route.params.userId}`
          );
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
      console.log("cleared");

      // Navigate to the login page
      navigation.reset({
        index: 0,
        routes: [{ name: "login" }],
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
            <View style={styles.statusIndicator} />
          </View>
          <View style={styles.userInfoContainer}>
            <Text
              style={styles.profileName}
              onPress={() =>
                navigation.navigate("showprofile", { userId: userData.id })
              }
            >{`${userData.firstName} ${userData.lastName}`}</Text>
            <Text style={styles.profileEmail}>{userData.email}</Text>
          </View>
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

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('PaymentHistory')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="card" size={20} color="#333" />
              <Text style={styles.settingText}>Payments and payouts</Text>
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('AboutUs')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="information-circle" size={20} color="#333" />
              <Text style={styles.settingText}>About Us</Text>
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              navigation.navigate("CreatePost", {
                userId: userData.id,
                refresh: refresh,
                setRefresh: setRefresh
              });
            }}
          >
            <View style={styles.settingContent}>
              <Ionicons name="create" size={20} color="#333" />
              <Text style={styles.settingText}>List your space</Text>
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("PostsHistory")}
          >
            <View style={styles.settingContent}>
              <Ionicons name="document-text" size={20} color="#333" />
              <Text style={styles.settingText}>My Posts</Text>
              <Ionicons name="chevron-forward" size={20} color="#333" />
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
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#fff',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  profileName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 15,
    height: 15,
    borderRadius: 10,
    backgroundColor: '#95D1CC',
    borderWidth: 2,
    borderColor: '#fff',
  },
  accountSettings: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  settingItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginVertical: 8,
    shadowColor: '#082631',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#082631',
    flex: 1,
    marginLeft: 15,
    fontWeight: '500',
  },
});

export default ProfileScreen;
