import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ImageUpload = ({ chatId, senderId, receiverId, onImageSent }) => {
  const [uploading, setUploading] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  // Add useEffect to log props when they change
  useEffect(() => {
    console.log('ImageUpload props:', { chatId, senderId, receiverId });
  }, [chatId, senderId, receiverId]);

  const validateProps = () => {
    console.log('Validating props with values:', {
      chatId: chatId || 'missing',
      senderId: senderId || 'missing',
      receiverId: receiverId || 'missing'
    });

    if (!chatId) {
      console.error('Missing chatId');
      return false;
    }
    if (!senderId) {
      console.error('Missing senderId');
      return false;
    }
    if (!receiverId) {
      console.error('Missing receiverId');
      return false;
    }

    return true;
  };

  const uploadImage = async (imageAsset, token) => {
    if (uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      const imageUri = imageAsset.uri;
      
      // Verify the image file exists and is accessible
      try {
        const { exists, size } = await FileSystem.getInfoAsync(imageUri);
        if (!exists) {
          throw new Error('Image file not found');
        }
        if (size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error('Image file is too large (max 10MB)');
        }
        console.log('Image file verified, size:', size);
      } catch (error) {
        console.error('Error verifying image:', error);
        throw new Error('Could not access image file');
      }

      // Get proper filename and type
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      console.log('Preparing upload with values:', {
        chatId,
        filename,
        receiverId,
        senderId,
        type,
        uri: imageUri
      });

      // Append file with proper structure
      formData.append('file', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        type: type,
        name: filename || `image-${Date.now()}.jpg`
      });
      
      // Add other required fields
      formData.append('chatId', chatId.toString());
      formData.append('senderId', senderId.toString());
      formData.append('receiverId', receiverId.toString());
      formData.append('messageType', 'IMAGE');

      const config = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000, // Increased to 60 seconds
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('Upload progress:', percentCompleted + '%');
        }
      };

      console.log('Sending request to:', `${apiUrl}/api/chat/upload`);

      let retries = 3;
      let lastError = null;

      while (retries > 0) {
        try {
          console.log('Attempting upload with token:', `Bearer ${token.substring(0, 10)}...`);
          const response = await axios.post(
            `${apiUrl}/api/chat/upload`,
            formData,
            config
          );

          console.log('Upload response:', response.data);

          if (response.data?.url) {
            onImageSent({
              id: response.data.messageId,
              type: 'IMAGE',
              content: response.data.url,
              userId: senderId,
              sentAt: new Date().toISOString()
            });
            return; // Success, exit the retry loop
          } else {
            throw new Error('Invalid server response - missing URL');
          }
        } catch (error) {
          lastError = error;
          console.error(`Upload attempt ${4 - retries} failed:`, error);

          if (error.response?.status === 401) {
            // Try to get a fresh token
            const freshToken = await AsyncStorage.getItem('token');
            if (freshToken && freshToken !== token) {
              console.log('Got fresh token, retrying...');
              config.headers.Authorization = `Bearer ${freshToken}`;
              token = freshToken; // Update token for next retry
            }
          }

          retries--;
          if (retries > 0) {
            console.log(`Retrying upload... ${retries} attempts remaining`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          }
        }
      }

      // If we get here, all retries failed
      if (lastError?.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please log in again to continue.');
      } else {
        Alert.alert(
          'Upload Error',
          'Failed to upload image. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response) {
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleImagePick = async () => {
    if (uploading) return;

    try {
      // Detailed validation with logging
      if (!validateProps()) {
        Alert.alert('Error', `Chat information missing. Please check values:
          chatId: ${chatId || 'missing'}
          senderId: ${senderId || 'missing'}
          receiverId: ${receiverId || 'missing'}`
        );
        return;
      }

      // Get auth token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0], token);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handleImagePick}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Ionicons name="image" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ImageUpload;