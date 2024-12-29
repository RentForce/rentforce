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
import { Ionicons } from '@expo/vector-icons';

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

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      // Parse the stored images array
      const imagesArray = formData.images ? JSON.parse(formData.images) : [];
      
      // Upload all images to Cloudinary
      const uploadPromises = imagesArray.map(async (imageUri) => {
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
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return { url: response.data.secure_url };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // Create the post with all images
      const postData = {
        title: formData.title,
        description: formData.description,
        location: formData.location || '',
        price: parseFloat(formData.price),
        category: formData.category,
        images: uploadedImages
      };

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
      allowsMultipleSelection: true, // Enable multiple selection
      selectionLimit: 4, // Limit to 4 images
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Store the array of image URIs
      handleChange("images", JSON.stringify(result.assets.map(asset => asset.uri)));
    }
  };

  const handleLocationPick = () => {
    // Implement location picking logic here
  };

  return (
    <LinearGradient
      colors={["#F1EFEF", "#F1EFEF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
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
});

export default CreatePost;