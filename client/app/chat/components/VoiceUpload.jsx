import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Text,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const VoiceUpload = ({ chatId, senderId, receiverId, onVoiceSent }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  // Cleanup function to ensure recording is properly stopped
  const cleanupRecording = async () => {
    try {
      if (recording) {
        console.log('Cleaning up previous recording');
        try {
          const recordingStatus = await recording.getStatusAsync();
          if (recordingStatus.isRecording) {
            await recording.stopAndUnloadAsync();
          } else {
            await recording.unloadAsync();
          }
        } catch (err) {
          console.log('Status check error:', err);
          // Try unloading anyway
          try {
            await recording.unloadAsync();
          } catch (unloadErr) {
            console.log('Unload error:', unloadErr);
          }
        }
      }

      // Reset audio mode regardless of recording state
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch (err) {
        console.log('Audio mode error:', err);
      }

      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error cleaning up recording:', error);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!chatId || !senderId || !receiverId) {
        Alert.alert('Error', 'Chat information is missing');
        return;
      }

      // Clean up any existing recording first
      await cleanupRecording();

      // Make sure we're fully cleaned up before proceeding
      await new Promise(resolve => setTimeout(resolve, 300));

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your microphone');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);

      // Start the timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      await cleanupRecording();
    }
  };

  const stopRecording = async () => {
    if (!recording || uploading) return;

    console.log('Stopping recording...');
    try {
      // Stop the timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      setIsRecording(false);

      let uri = null;
      try {
        uri = recording.getURI();
        console.log('Recording URI:', uri);

        const recordingStatus = await recording.getStatusAsync();
        if (recordingStatus.isRecording) {
          await recording.stopAndUnloadAsync();
        }

        if (!uri) {
          throw new Error('No recording URI available');
        }

        // Verify file exists
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error('Recording file not found');
        }

        console.log('File info:', fileInfo);
      } catch (error) {
        console.error('Error stopping recording:', error);
        Alert.alert('Error', 'Failed to save recording');
        await cleanupRecording();
        return;
      }

      // Clean up recording object before upload
      setRecording(null);

      // Upload the file
      if (uri) {
        await uploadVoice(uri);
      }
    } catch (error) {
      console.error('Error in stopRecording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    } finally {
      await cleanupRecording();
    }
  };

  const uploadVoice = async (uri) => {
    if (uploading) return;

    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      // Create form data
      const formData = new FormData();
      
      // Get file extension and name
      const uriParts = uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      
      // Add the audio file
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: `audio/${fileExtension}`,
        name: `voice-message-${Date.now()}.${fileExtension}`
      });
      
      // Add chat information
      formData.append('chatId', chatId.toString());
      formData.append('senderId', senderId.toString());
      formData.append('receiverId', receiverId.toString());
      formData.append('messageType', 'AUDIO');

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('Upload progress:', percentCompleted + '%');
        }
      };

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
            onVoiceSent({
              id: response.data.messageId,
              type: 'AUDIO',
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
          'Failed to upload voice message. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error uploading voice:', error);
      if (error.response) {
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      }
    } finally {
      setUploading(false);
      setRecordingDuration(0);
      // Ensure we're ready for a new recording
      await cleanupRecording();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.button}>
      {uploading ? (
        <ActivityIndicator color="#082631" />
      ) : (
        <Ionicons
          name={isRecording ? "stop-circle" : "mic"}
          size={24}
          color="#082631"
        />
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