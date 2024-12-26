import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import SweetAlert from '../../components/SweetAlert';

const CLOUDINARY_CLOUD_NAME = "dfbrjaxu7";
const CLOUDINARY_UPLOAD_PRESET = "ignmh24s";
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// const API_BASE_URL = 'http://${apiUrl}:5000';

const DEFAULT_PROFILE_IMAGE =
  "https://www.shutterstock.com/image-vector/user-icon-vector-trendy-flat-600nw-1720665448.jpg";

const ProfileScreen = ({ navigation, route }) => {
  const userId = route.params?.userId;
  console.log(userId, "slame");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUserData, setUpdatedUserData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [bio, setBio] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError("No user ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/user/${userId}`, {
          timeout: 10000,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (response.data) {
          setUserData(response.data);
          // Set initial profile image if exists
          if (response.data.image) {
            setProfileImage(response.data.image);
          }

          setUpdatedUserData({
            firstName: response.data.firstName || "",
            lastName: response.data.lastName || "",
            email: response.data.email || "",
            image: response.data.image || "",
          });
        } else {
          throw new Error("No data received");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message || "Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const pickImage = async () => {
    // Request permission to access camera roll
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;

      try {
        // Create form data for Cloudinary upload
        const formData = new FormData();
        formData.append("file", {
          uri: localUri,
          type: `image/${localUri.split(".").pop()}`,
          name: `upload.${localUri.split(".").pop()}`,
        });
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

        // Upload to Cloudinary
        const cloudinaryResponse = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Get the uploaded image URL
        const uploadedImageUrl = cloudinaryResponse.data.secure_url;

        // Update local state
        setProfileImage(uploadedImageUrl);

        // Update user data and backend
        await handleUpdateUserData({ image: uploadedImageUrl });
      } catch (error) {
        console.error("Image upload error:", error);
        Alert.alert(
          "Upload Failed",
          "Could not upload image. Please try again."
        );
      }
    }
  };

  const handleUpdateUserData = async (additionalData = {}) => {
    if (!userId) return;

    try {
      const dataToUpdate = {
        ...updatedUserData,
        ...additionalData,
        bio: bio,
      };

      const response = await axios.put(`${apiUrl}/user/${userId}`, dataToUpdate, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data) {
        setUserData(response.data);
        setIsEditing(false);
        setShowAlert(true);
        
        // Navigate after alert is dismissed
        navigation.navigate("profile", {
          updatedUser: response.data,
          image: response.data.image
        });
      }
    } catch (err) {
      console.error("Error updating user data:", err);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

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

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Loading your profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <SweetAlert
        visible={showAlert}
        title="Success"
        message="Profile updated successfully"
        type="success"
        onConfirm={() => setShowAlert(false)}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#F1EFEF" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: profileImage || DEFAULT_PROFILE_IMAGE,
              }}
              style={styles.profileImage}
              onError={(e) =>
                console.log("Image load error", e.nativeEvent.error)
              }
            />
            <TouchableOpacity style={styles.editImageIcon} onPress={pickImage}>
              <Ionicons name="camera" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                placeholder="First Name"
                value={updatedUserData.firstName}
                onChangeText={(text) =>
                  setUpdatedUserData({ ...updatedUserData, firstName: text })
                }
              />
              <TextInput
                style={styles.editInput}
                placeholder="Last Name"
                value={updatedUserData.lastName}
                onChangeText={(text) =>
                  setUpdatedUserData({ ...updatedUserData, lastName: text })
                }
              />
              <TextInput
                style={styles.editInput}
                placeholder="Email"
                value={updatedUserData.email}
                onChangeText={(text) =>
                  setUpdatedUserData({ ...updatedUserData, email: text })
                }
                keyboardType="email-address"
              />
              <TextInput
                style={styles.editInput}
                placeholder="Bio"
                value={bio}
                onChangeText={setBio}
                multiline
              />
              <View style={styles.editButtonContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => handleUpdateUserData()}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>
                {userData?.firstName} {userData?.lastName}
              </Text>
              <Text style={styles.profileEmail}>{userData?.email}</Text>
              <Text style={styles.profileBio}>{userData?.bio}</Text>
            </>
          )}
        </View>

        <View style={styles.actionContainer}>
          {!isEditing && (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={20} color="white" />
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1EFEF',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1EFEF',
  },
  errorText: {
    color: '#082631',
    marginBottom: 20,
    fontSize: 16,
  },
  retryText: {
    color: '#082631',
    fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F1EFEF',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#082631',
  },
  editImageIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#082631',
    borderRadius: 20,
    padding: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#082631',
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 16,
    color: '#082631',
  },
  editForm: {
    width: '100%',
    paddingHorizontal: 20,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#082631',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    backgroundColor: '#F1EFEF',
    color: '#082631',
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  editProfileButton: {
    backgroundColor: '#082631',
    padding: 15,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  editProfileButtonText: {
    color: '#F1EFEF',
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: '#F1EFEF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#082631',
  },
  logoutButtonText: {
    color: '#082631',
    fontWeight: 'bold',
  },
  editButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  saveButton: {
    backgroundColor: '#082631',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  saveButtonText: {
    color: '#F1EFEF',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1EFEF',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    borderWidth: 1,
    borderColor: '#082631',
  },
  cancelButtonText: {
    color: '#082631',
    textAlign: 'center',
  },
  bioInput: {
    borderColor: '#082631',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    height: 100,
    backgroundColor: '#F1EFEF',
    color: '#082631',
  },
  profileBio: {
    fontSize: 16,
    color: '#082631',
    marginVertical: 5,
  },
  headerContainer: {
    paddingTop: 35,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  backButton: {
    backgroundColor: '#082631',
    borderRadius: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
});

export default ProfileScreen;
