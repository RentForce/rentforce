import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

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

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      // Upload images to Cloudinary
      const imagesArray = formData.images ? JSON.parse(formData.images) : [];
      const uploadPromises = imagesArray.map(async (image) => {
        const formData = new FormData();
        formData.append("file", {
          uri: image,
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
          return { url: response.data.secure_url };
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError.response?.data || uploadError);
          throw new Error("Image upload failed. Please try again.");
        }
      });

      const uploadedImages = await Promise.all(uploadPromises);
      console.log("Uploaded images:", uploadedImages);

      // Create the post with proper structure
      const postData = {
        title: formData.title,
        description: formData.description,
        location: formData.location || '',
        price: parseFloat(formData.price),
        category: formData.category,
        images: uploadedImages
      };

      console.log("Sending post data:", postData);
      console.log("API URL:", `${apiUrl}/user/posts`);
      console.log("Token:", token);

      // Create the post
      const postResponse = await axios.post(
        `${apiUrl}/user/posts`,
        postData,
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
      console.error("Error creating post:", error);
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
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      selectionLimit: 4, // Limit to 4 images
    });

    if (!result.canceled) {
      handleChange("images", JSON.stringify(result.assets.map(asset => asset.uri))); // Update images state
    }
  };

  const handleLocationPick = () => {
    // Implement location picking logic here
  };

  return (
    <LinearGradient
      colors={["#F1EFEF", "#FFFFFF"]} // Gradient for background
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Create a New Post</Text>
      <TextInput
        placeholder="Title"
        onChangeText={(value) => handleChange("title", value)}
        value={formData.title}
        style={styles.input}
      />
      <TextInput
        placeholder="Images (JSON format)"
        onChangeText={(value) => handleChange("images", value)}
        value={formData.images}
        style={styles.input}
        editable={false}
      />
      <TouchableOpacity onPress={handleImagePick} style={styles.imagePickerButton}>
        <Text style={styles.buttonText}>Pick Images</Text>
      </TouchableOpacity>
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
        <Picker.Item label="House" value="house" />
        <Picker.Item label="Apartment" value="apartment" />
        <Picker.Item label="Villa" value="villa" />
        <Picker.Item label="Hotel" value="hotel" />
      </Picker>
      <LinearGradient
        colors={["#333333", "#000000"]} // Gradient for button
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.buttonContainer}
      >
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Create Post</Text>
        </TouchableOpacity>
      </LinearGradient>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F1EFEF", // Soft ash gray for background
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333", // Charcoal black for title
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#A9A9A9", // Soft ash gray border
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF", // White background for inputs
    fontSize: 16,
    color: "#333333", // Charcoal black text
  },
  picker: {
    height: 50,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#FFFFFF", // White background for picker
    color: "#333333", // Charcoal black text
  },
  buttonContainer: {
    marginTop: 20,
    borderRadius: 8,
    overflow: "hidden", // Ensures the gradient follows the button shape
  },
  button: {
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#FFFFFF", 
    fontWeight: "bold",
  },
  imagePickerButton: {
    backgroundColor: "#333333",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
});

export default CreatePost;