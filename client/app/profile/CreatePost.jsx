import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

const categories = [
  "house",
  "apartment",
  "villa",
  "hotel",
  "historical",
  "lake",
  "beachfront",
  "countryside",
  "castles",
  "experiences",
  "camping",
  "desert",
  "luxe",
  "islands",
];

const CreatePost = () => {
  const navigation = useNavigation();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const CLOUDINARY_CLOUD_NAME = "dfbrjaxu7";
  const CLOUDINARY_UPLOAD_PRESET = "ignmh24s";

  if (!apiUrl) {
    console.error("API URL is not defined in environment variables");
    Alert.alert("Configuration Error", "Please check your environment configuration.");
    return null;
  }

  const [formData, setFormData] = useState({
    title: "",
    images: "",
    description: "",
    location: "",
    price: "",
    category: "",
    cancellationPolicy: "",
    roomConfiguration: "",
    houseRules: "",
    safetyProperty: ""
  });

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.price || !formData.category) {
        Alert.alert(
          "Missing Information",
          "Please fill in all required fields (title, price, and category)"
        );
        return;
      }

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Authentication Error", "Please log in again");
        navigation.navigate("login");
        return;
      }

      // First, upload all images to Cloudinary
      const uploadedImageUrls = await Promise.all(
        selectedImages.map(async (imageUri) => {
          const formData = new FormData();
          formData.append("file", {
            uri: imageUri,
            type: 'image/jpeg',
            name: `upload_${Date.now()}.jpg`,
          });
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

          try {
            const response = await axios.post(
              `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            return response.data.secure_url;
          } catch (error) {
            console.error("Image upload error:", error);
            throw new Error("Failed to upload image");
          }
        })
      );

      // Create post with uploaded images
      const postResponse = await axios.post(
        `${apiUrl}/user/posts`,
        {
          ...formData,
          images: uploadedImageUrls,
          location: selectedLocation ? {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude
          } : null
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        }
      );

      console.log("Post created successfully:", postResponse.data);
      Alert.alert(
        "Success", 
        "Post created successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Home")
          }
        ]
      );
    } catch (error) {
      console.error("Detailed error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create post. Please try again."
      );
    }
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Enable multiple selection
      selectionLimit: 4, // Limit to 4 images
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Store the array of image URIs
      setSelectedImages(result.assets.map(asset => asset.uri));
    }
  };

  const handleLocationPick = async (coordinate) => {
    try {
      // Input validation
      if (!coordinate || !coordinate.latitude || !coordinate.longitude) {
        console.error("Invalid coordinates:", coordinate);
        Alert.alert("Error", "Invalid location selected. Please try again.");
        return;
      }

      const { latitude, longitude } = coordinate;
      console.log("Selected coordinates:", { latitude, longitude });

      // Show loading state
      setFormData(prev => ({
        ...prev,
        location: "Loading address..."
      }));

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const fetchPromise = axios.get("https://api.opencagedata.com/geocode/v1/json", {
        params: {
          q: `${latitude},${longitude}`,
          key: "7fee1ce6642a492882b50778ff348d56",
          language: "en", // Ensure English results
          pretty: 1,
          no_annotations: 1
        }
      });

      // Race between timeout and actual request
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log("API Response:", response.data);

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const address = result.formatted;
        
        console.log("Found address:", address);
        
        handleChange("location", address);
        
        // Also store the coordinates for later use
        setSelectedLocation({
          latitude,
          longitude
        });
      } else {
        throw new Error("No results found");
      }
    } catch (error) {
      console.error("Location pick error:", error);
      
      // Clear loading state
      setFormData(prev => ({
        ...prev,
        location: ""
      }));

      // Show specific error message
      Alert.alert(
        "Location Error",
        error.message === "Request timeout"
          ? "Request timed out. Please check your internet connection and try again."
          : "Could not get address for this location. Please try another spot."
      );
    }
  };

  const handleDeleteImage = (indexToDelete) => {
    setSelectedImages(prevImages => 
      prevImages.filter((_, index) => index !== indexToDelete)
    );
  };

  return (
    <LinearGradient
      colors={["#F1EFEF", "#F1EFEF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#F1EFEF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Create a New Post</Text>
        <TextInput
          placeholder="Title"
          onChangeText={(value) => handleChange("title", value)}
          value={formData.title}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleImagePick} style={styles.imagePickerButton}>
          <Text style={styles.buttonText}>Pick Images</Text>
        </TouchableOpacity>
        
        {selectedImages.length > 0 && (
          <View style={styles.selectedImagesContainer}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF0000" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TextInput
          placeholder="Description"
          onChangeText={(value) => handleChange("description", value)}
          value={formData.description}
          style={styles.input}
        />
        <TextInput
          placeholder="Location"
          onChangeText={(value) => handleChange("location", value)}
          value={formData.location}
          style={styles.input}
        />
        <MapView
          style={{ width: '100%', height: 200, marginBottom: 15 }}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={(e) => {
            console.log("Map pressed:", e.nativeEvent);
            if (e.nativeEvent && e.nativeEvent.coordinate) {
              handleLocationPick(e.nativeEvent.coordinate);
            }
          }}
        >
          {selectedLocation && (
            <Marker 
              coordinate={selectedLocation}
              title="Selected Location"
            />
          )}
        </MapView>

        <TextInput
          placeholder="Price"
          keyboardType="numeric"
          onChangeText={(value) => handleChange("price", value)}
          value={formData.price}
          style={styles.input}
        />
        <Picker
          selectedValue={formData.category}
          onValueChange={(itemValue) => handleChange("category", itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Category" value="" />
          {categories.map((category) => (
            <Picker.Item
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              value={category}
            />
          ))}
        </Picker>
        <TextInput
          placeholder="Cancellation Policy"
          multiline
          onChangeText={(value) => handleChange("cancellationPolicy", value)}
          value={formData.cancellationPolicy}
          style={styles.input}
        />
        <TextInput
          placeholder="Room Configuration (e.g., 2 beds, 1 bath)"
          multiline
          onChangeText={(value) => handleChange("roomConfiguration", value)}
          value={formData.roomConfiguration}
          style={styles.input}
        />
        <TextInput
          placeholder="House Rules"
          multiline
          onChangeText={(value) => handleChange("houseRules", value)}
          value={formData.houseRules}
          style={styles.input}
        />
        <TextInput
          placeholder="Safety Property Information"
          multiline
          onChangeText={(value) => handleChange("safetyProperty", value)}
          value={formData.safetyProperty}
          style={styles.input}
        />
        <LinearGradient
          colors={["#082631", "#082631"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonContainer}
        >
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Create Post</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F1EFEF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#082631",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#082631",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#F1EFEF",
    fontSize: 16,
    color: "#082631",
  },
  picker: {
    height: 50,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#F1EFEF",
    color: "#082631",
  },
  buttonContainer: {
    marginTop: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  button: {
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#F1EFEF",
    fontWeight: "bold",
  },
  imagePickerButton: {
    backgroundColor: "#082631",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  headerContainer: {
    paddingTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 0,
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#082631',
    borderRadius: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
  },
  scrollView: {
    flexGrow: 1,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 10,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
  },
});

export default CreatePost;