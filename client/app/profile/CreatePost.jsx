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
  "house", "apartment", "villa", "hotel", "historical",
  "lake", "beachfront", "countryside", "castles",
  "experiences", "camping", "desert", "luxe", "islands",
];

const CreatePost = () => {
  const navigation = useNavigation();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const CLOUDINARY_CLOUD_NAME = "dfbrjaxu7";
  const CLOUDINARY_UPLOAD_PRESET = "ignmh24s";

  const [currentStep, setCurrentStep] = useState(1);
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
    safetyProperty: "",
    latitude: "",
    longitude: ""
  });

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [mapReady, setMapReady] = useState(false);

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNext = () => {
    if (!formData.title || !formData.description || selectedImages.length === 0) {
      Alert.alert("Required Fields", "Please fill in all required fields (Title, Description, and Images)");
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImages(result.assets.map(asset => asset.uri));
    }
  };

  const handleLocationPick = async (coordinate) => {
    if (!mapReady) return;

    try {
      const lat = Number(coordinate.latitude.toFixed(6));
      const lng = Number(coordinate.longitude.toFixed(6));

      setFormData(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString()
      }));

      setSelectedLocation({
        latitude: lat,
        longitude: lng
      });

      try {
        const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
          params: {
            q: `${lat},${lng}`,
            key: "7fee1ce6642a492882b50778ff348d56",
            language: "en",
            pretty: 1,
            no_annotations: 1
          }
        });

        if (response.data.results && response.data.results.length > 0) {
          const address = response.data.results[0].formatted;
          setFormData(prev => ({
            ...prev,
            location: address
          }));
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        Alert.alert("Error", "Could not get address for selected location.");
      }
    } catch (error) {
      console.error("Location pick error:", error);
      Alert.alert("Error", "Could not set location. Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) {
        Alert.alert("Error", "You must be logged in to create a post");
        return;
      }

      // Upload images to Cloudinary
      const uploadPromises = selectedImages.map(async (imageUri) => {
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
        return response.data.secure_url;
      });

      const imageUrls = await Promise.all(uploadPromises);

      const postData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        price: parseFloat(formData.price),
        category: formData.category,
        images: imageUrls.map(url => ({ url })),
        cancellationPolicy: formData.cancellationPolicy,
        roomConfiguration: formData.roomConfiguration,
        houseRules: formData.houseRules,
        safetyProperty: formData.safetyProperty,
        map: selectedLocation ? {
          create: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude
          }
        } : undefined
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
        "Failed to create post. Please try again."
      );
    }
  };

  const renderStepOne = () => (
    <View>
      <Text style={styles.stepTitle}>Step 1: Basic Information</Text>
      <TextInput
        placeholder="Title *"
        onChangeText={(value) => handleChange("title", value)}
        value={formData.title}
        style={styles.input}
      />
      
      <TouchableOpacity onPress={handleImagePick} style={styles.imagePickerButton}>
        <Text style={styles.buttonText}>Pick Images *</Text>
      </TouchableOpacity>
      
      <View style={styles.imagePreviewContainer}>
        {selectedImages.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.imagePreview} />
        ))}
      </View>

      <TextInput
        placeholder="Description *"
        onChangeText={(value) => handleChange("description", value)}
        value={formData.description}
        style={[styles.input, styles.multilineInput]}
        multiline
      />

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.buttonText}>Next Step</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepTwo = () => (
    <View>
      <Text style={styles.stepTitle}>Step 2: Additional Details</Text>
      
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
        placeholder="Location"
        value={formData.location}
        style={styles.input}
        editable={false}
      />

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 36.8065,
          longitude: 10.1815,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
        onMapReady={() => setMapReady(true)}
        onPress={(e) => handleLocationPick(e.nativeEvent.coordinate)}
      >
        {selectedLocation && mapReady && (
          <Marker
            coordinate={selectedLocation}
            draggable={true}
            onDragEnd={(e) => handleLocationPick(e.nativeEvent.coordinate)}
          />
        )}
      </MapView>

      <TextInput
        placeholder="Room Configuration"
        onChangeText={(value) => handleChange("roomConfiguration", value)}
        value={formData.roomConfiguration}
        style={styles.input}
      />

      <TextInput
        placeholder="House Rules"
        multiline
        onChangeText={(value) => handleChange("houseRules", value)}
        value={formData.houseRules}
        style={[styles.input, styles.multilineInput]}
      />

      <TextInput
        placeholder="Safety Property Information"
        multiline
        onChangeText={(value) => handleChange("safetyProperty", value)}
        value={formData.safetyProperty}
        style={[styles.input, styles.multilineInput]}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Create Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#F1EFEF", "#F1EFEF"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backNavButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#F1EFEF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Create a New Post</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: currentStep === 1 ? '50%' : '100%' }]} />
          </View>
          <View style={styles.stepIndicator}>
            <Text style={[styles.stepText, currentStep === 1 && styles.activeStep]}>Basic Info</Text>
            <Text style={[styles.stepText, currentStep === 2 && styles.activeStep]}>Details</Text>
          </View>
        </View>

        {currentStep === 1 ? renderStepOne() : renderStepTwo()}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1EFEF",
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 20,
    marginBottom: 10,
  },
  backNavButton: {
    backgroundColor: '#082631',
    borderRadius: 50,
    padding: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#082631",
    marginBottom: 25,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#082631",
    marginBottom: 20,
    marginTop: 10,
  },
  progressContainer: {
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#082631',
    borderRadius: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 5,
  },
  stepText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeStep: {
    color: '#082631',
    fontWeight: '600',
  },
  input: {
    height: 55,
    borderColor: "#E0E0E0",
    borderWidth: 1.5,
    marginBottom: 18,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#333333",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  imagePickerButton: {
    backgroundColor: "#082631",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 15,
    justifyContent: 'space-between',
  },
  imagePreview: {
    width: '48%',
    height: 120,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  picker: {
    height: 55,
    marginBottom: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    color: "#333333",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  map: {
    width: '100%',
    height: 200,
    marginBottom: 18,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: "#082631",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  backButton: {
    backgroundColor: "#666666",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  submitButton: {
    backgroundColor: "#082631",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  requiredField: {
    color: '#FF3B30',
    fontSize: 16,
  },
  locationContainer: {
    marginBottom: 18,
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  coordinateInput: {
    width: '48%',
    backgroundColor: '#F5F5F5',
  }
});

export default CreatePost;