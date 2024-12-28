import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

const VoiceUpload = ({ chatId, senderId, receiverId, onVoiceSent }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    // Cleanup function
    return () => {
      stopRecording();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []); // Empty dependency array for cleanup only

  const startRecording = async () => {
    try {
      if (!chatId || !senderId || !receiverId) {
        Alert.alert('Error', 'Chat information is missing');
        return;
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your microphone');
        return;
      }

      // Reset timer and clear any existing interval
      setRecordingDuration(0);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);

      // Start the timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          console.log('Updating duration:', prev + 1); // Debug log
          return prev + 1;
        });
      }, 1000);

      console.log('Recording started'); // Debug log
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording...'); // Debug log
    try {
      if (!recording || uploading) return;

      // Clear the timer first
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      setIsRecording(false);
      
      try {
        await recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }

      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await uploadVoice(uri);
      }
    } catch (error) {
      console.error('Error in stopRecording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    } finally {
      // Make sure timer is cleared and state is reset
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const uploadVoice = async (uri) => {
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // Create form data
      const formData = new FormData();
      
      // Get file extension from uri
      const extension = uri.split('.').pop();
      
      // Add the audio file
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: `audio/${extension}`,
        name: `voice-message-${Date.now()}.${extension}`
      });
      
      // Add chat information
      formData.append('chatId', chatId.toString());
      formData.append('senderId', senderId.toString());
      formData.append('receiverId', receiverId.toString());
      formData.append('messageType', 'VOICE');

      console.log('Uploading voice message:', {
        uri,
        type: `audio/${extension}`,
        chatId: chatId.toString(),
        senderId: senderId.toString(),
        receiverId: receiverId.toString()
      });

      const config = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        transformRequest: (data, headers) => {
          // Don't transform the FormData
          return data;
        },
        timeout: 30000 // 30 second timeout
      };

      const response = await axios.post(
        `${apiUrl}/api/chat/upload`,
        formData,
        config
      );

      console.log('Voice upload response:', response.data);

      if (response.data?.url) {
        onVoiceSent({
          id: response.data.messageId,
          type: 'VOICE',
          content: response.data.url,
          userId: senderId,
          sentAt: new Date().toISOString()
        });
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.error('Error uploading voice:', error);
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
        'Failed to upload voice message. Please try again.'
      );
    } finally {
      setUploading(false);
      setRecordingDuration(0);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity 
      style={[styles.button, isRecording && styles.recording]}
      onPressIn={startRecording}
      onPressOut={stopRecording}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons 
            name={isRecording ? "radio-button-on" : "mic"} 
            size={24} 
            color={isRecording ? "#FF0000" : "#007AFF"} 
          />
          {isRecording && (
            <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  recording: {
    backgroundColor: '#ffebeb',
  },
  buttonContent: {
    alignItems: 'center',
  },
  duration: {
    fontSize: 10,
    color: '#FF0000',
    marginTop: 2,
  },
});

export default VoiceUpload;