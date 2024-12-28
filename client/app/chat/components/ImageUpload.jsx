import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
      const token = await AsyncStorage.getItem('userToken');
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

  const uploadImage = async (imageAsset, token) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const imageUri = imageAsset.uri;
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Log the values before appending
      console.log('Preparing upload with values:', {
        chatId,
        filename,
        receiverId,
        senderId,
        type
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
        transformRequest: (data, headers) => {
          // Don't transform FormData
          return data;
        },
        timeout: 30000 // 30 second timeout
      };

      console.log('Sending request to:', `${apiUrl}/api/chat/upload`);

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
      } else {
        throw new Error('Invalid server response - missing URL');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response) {
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Error request:', error.request);
      }
      Alert.alert(
        'Upload Error',
        'Failed to upload image. Please try again.'
      );
    } finally {
      setUploading(false);
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