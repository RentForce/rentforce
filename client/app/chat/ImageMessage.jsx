import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const ImageMessage = ({ chatId, onImageSent }) => {
  const [uploading, setUploading] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        sendImageWithSilentRetry(result.assets[0]);
      }
    } catch (error) {
      setUploading(false);
    }
  };

  const sendImageWithSilentRetry = async (imageAsset, attempt = 1) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const formData = new FormData();
      
      const imageUri = imageAsset.uri;
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename || 'image.jpg',
        type
      });
      formData.append('chatId', chatId.toString());

      const response = await axios.post(
        `${apiUrl}/api/chat/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
          },
          timeout: 60000
        }
      );

      if (response.data) {
        onImageSent(response.data);
        setUploading(false);
      }
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        setTimeout(() => {
          sendImageWithSilentRetry(imageAsset, attempt + 1);
        }, RETRY_DELAY);
      } else {
        setUploading(false);
      }
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={pickImage}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Ionicons name="image" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ImageMessage;