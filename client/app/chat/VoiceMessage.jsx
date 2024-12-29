import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VoiceMessage = ({ chatId, onVoiceSent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const recordingRef = useRef(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    // Set up audio mode when component mounts
    setupAudio();
    
    // Cleanup when component unmounts
    return () => {
      cleanupRecording();
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const cleanupRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up recording:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Clean up any existing recording
      await cleanupRecording();

      // Request permissions
      const permissionResult = await Audio.requestPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please allow access to your microphone');
        return;
      }

      // Create and prepare new recording
      const newRecording = new Audio.Recording();
      try {
        await newRecording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        });
        
        await newRecording.startAsync();
        recordingRef.current = newRecording;
        setIsRecording(true);
      } catch (error) {
        console.error('Error preparing recording:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Could not start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || !isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (uri) {
        await sendVoiceMessage(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Could not stop recording');
    } finally {
      recordingRef.current = null;
    }
  };

  const sendVoiceMessage = async (audioUri) => {
    if (!audioUri || !selectedUser?.chatId || !currentUser?.id) {
        console.error('Missing required data:', { audioUri, selectedUser, currentUser });
        Alert.alert('Error', 'Missing required information for upload');
        return;
    }

    try {
        setIsUploading(true);
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
            throw new Error('Authentication token not found');
        }

        // Check if file exists and is accessible
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists) {
            throw new Error('Audio file not found');
        }

        // Verify file size
        if (fileInfo.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('File size exceeds 10MB limit');
        }
        
        const formData = new FormData();
        
        // Prepare the audio file
        const filename = `recording-${Date.now()}.m4a`;
        const normalizedUri = Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri;
        
        formData.append('file', {
            uri: normalizedUri,
            type: 'audio/m4a',
            name: filename,
            size: fileInfo.size
        });
        
        formData.append('chatId', selectedUser.chatId.toString());
        formData.append('senderId', currentUser.id.toString());
        formData.append('receiverId', selectedUser.id.toString());
        formData.append('messageType', 'AUDIO');

        console.log('Starting upload with data:', {
            filename,
            size: fileInfo.size,
            chatId: selectedUser.chatId,
            senderId: currentUser.id
        });

        const response = await axios({
            method: 'POST',
            url: `${process.env.EXPO_PUBLIC_API_URL}/api/chat/upload`,
            data: formData,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload progress: ${percentCompleted}%`);
            },
            timeout: 30000, // 30 second timeout
            validateStatus: (status) => {
                return status >= 200 && status < 300;
            }
        });

        if (response.data?.url) {
            const messageData = {
                content: response.data.url,
                type: 'AUDIO',
                chatId: selectedUser.chatId,
                userId: currentUser.id,
                id: response.data.messageId
            };

            // Update local state first
            setMessages(prev => [...prev, messageData]);

            // Import the socket using the getSocket function
            const socket = getSocket();
            if (socket?.connected) {
                socket.emit('new message', messageData, (ack) => {
                    if (!ack?.success) {
                        console.warn('Socket message not acknowledged');
                    }
                });
            } else {
                console.warn('Socket not connected, message will sync on reconnection');
            }

            console.log('Audio message processed successfully');
        } else {
            throw new Error('No URL received in response');
        }

    } catch (error) {
        console.error('Voice upload error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });

        let errorMessage = 'Failed to send voice message.';
        
        if (error.message.includes('File not found')) {
            errorMessage = 'Recording file not found. Please try again.';
        } else if (error.message.includes('size exceeds')) {
            errorMessage = 'Recording is too large. Please record a shorter message.';
        } else if (error.response?.status === 500) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Upload timed out. Please check your connection.';
        }

        Alert.alert('Upload Failed', errorMessage);
    } finally {
        setIsUploading(false);
        
        // Clean up the temporary file
        try {
            await FileSystem.deleteAsync(audioUri, { idempotent: true });
        } catch (cleanupError) {
            console.warn('Failed to clean up audio file:', cleanupError);
        }
    }
};
  return (
    <TouchableOpacity 
      style={styles.container}
      onPressIn={startRecording}
      onPressOut={stopRecording}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Ionicons 
          name={isRecording ? "radio-button-on" : "mic"} 
          size={24} 
          color={isRecording ? "#FF0000" : "#007AFF"} 
        />
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

export default VoiceMessage;