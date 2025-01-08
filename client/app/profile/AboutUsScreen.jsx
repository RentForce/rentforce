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

  const [formData, setFormData] = useState({
    title: "",
    images: "",
    description: "",
    location: "",
    price: "",
    category: "",
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
      const token = await AsyncStorage.getItem("userToken");
      
      // Upload images to Cloudinary and get URLs
      const uploadedImages = await Promise.all(
        selectedImages.map(async (imageUri) => {
          const formData = new FormData();
          formData.append("file", {
            uri: imageUri,
            type: 'image/jpeg',
            name: `upload_${Date.now()}.jpg`,
          });
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);
  
          const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          return response.data.secure_url;
        })
      );
  
      // Create post with image URLs
      const postData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        price: parseFloat(formData.price),
        category: formData.category,
        images: uploadedImages.map(url => ({ url })),
        status: 'pending'
      };
  
      await axios.post(
        `${apiUrl}/user/posts`,
        postData,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          },
        }
      );
  
      // Save images separately
      await Promise.all(
        uploadedImages.map(url => 
          axios.post(`${apiUrl}/user/posts/images`, {
            postId: response.data.id,
            url
          })
        )
      );
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to create post");
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

  const handleLocationPick = async () => {
    if (selectedLocation) {
      const { latitude, longitude } = selectedLocation;
      try {
        // Fetch address using OpenCage Geocoder
        const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
          params: {
            q: `${latitude},${longitude}`,
            key: "7fee1ce6642a492882b50778ff348d56", // Replace with your OpenCage API key
          },
        });
        const address = response.data.results[0].formatted; // Get the formatted address
        handleChange("location", address); // Set the address in the location input
      } catch (error) {
        console.error("Error getting location name:", error);
      }
    }
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
        
        <View style={styles.imagePreviewContainer}>
          {selectedImages.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.imagePreview} />
          ))}
        </View>

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
          style={{ height: 200, width: '100%', marginVertical: 10 }}
          initialRegion={{
            latitude: 36.8065,
            longitude: 10.1815,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={(e) => {
            setSelectedLocation(e.nativeEvent.coordinate);
            handleLocationPick();
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
});

export default CreatePost;
