import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Text, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import VoiceRecorder from './VoiceRecorder.jsx';
import axios from 'axios';

const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
];

const ChatInput = ({ onSendMessage, selectedLanguage, onLanguageChange, selectedUser, currentUser }) => {
    const [message, setMessage] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const handleImageSelect = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };

  const handleSendImage = async () => {
    if (!selectedImage) return;

    try {
        setIsUploading(true);
        const token = await AsyncStorage.getItem('token');

        const formData = new FormData();
        
        formData.append('file', {
            uri: selectedImage.uri,
            type: 'image/jpeg',
            name: `image-${Date.now()}.jpg`
        });
        
        formData.append('chatId', selectedUser.chatId.toString());
        formData.append('senderId', currentUser.id.toString());
        formData.append('receiverId', selectedUser.id.toString());
        formData.append('messageType', 'IMAGE');

        const response = await fetch(`${apiUrl}/api/chat/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
            body: formData
        });

        const data = await response.json();

        if (data.url) {
            await onSendMessage({
                content: data.url,
                type: 'IMAGE',
                chatId: selectedUser.chatId,
                userId: currentUser.id,
            });
            setSelectedImage(null);
        }
    } catch (error) {
        console.error('Image upload error:', error);
        Alert.alert('Upload Failed', 'Failed to upload image');
    } finally {
        setIsUploading(false);
    }
  };
 
  const handleSendText = () => {
    if (message.trim()) {
      onSendMessage({
        content: message,
        type: 'TEXT',
        chatId: selectedUser.chatId,
        userId: currentUser.id,
      });
      setMessage('');
    }
  };

  const handleLanguageSelect = (code) => {
    onLanguageChange(code);
    setShowLanguageModal(false);
  };

  return (
    <View style={styles.container}>
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} />
          <View style={styles.selectedImageActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendImageButton} onPress={handleSendImage}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.imageButton} onPress={handleImageSelect}>
          <Ionicons name="camera" size={24} color="#666" />
        </TouchableOpacity>

        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />

        <VoiceRecorder 
            onRecordComplete={handleVoiceMessage}
            currentUser={currentUser}
            selectedUser={selectedUser}
        />

{message.trim() && (
  <TouchableOpacity 
    style={[styles.sendButton, styles.sendButtonActive]} 
    onPress={handleSendText}
  >
    <Ionicons name="send" size={18} color="#FFFFFF" />
  </TouchableOpacity>
)}
      </View>

   
  

      <Modal visible={showLanguageModal} transparent animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowLanguageModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage === item.code && styles.selectedLanguageItem,
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      selectedLanguage === item.code && styles.selectedLanguageItemText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
    selectedImageContainer: {
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      },
      selectedImagePreview: {
        height: 200,
        width: '100%',
        borderRadius: 8,
        marginBottom: 10,

      },
      selectedImageActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,

      },
      audioMessageContainer: {
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      },
      audioMessageText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
      },
      audioMessageActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
      },
      cancelButton: {
        backgroundColor: '#dc3545',
        padding: 10,
        borderRadius: 5,
        width: '45%',
        alignItems: 'center',
      },
      sendImageButton: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        width: '45%',
        alignItems: 'center',
      },
      sendAudioButton: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        width: '45%',
        alignItems: 'center',
      },
      cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
      },
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  uploadingContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  uploadingText: {
    marginTop: 8,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
  },
  imageButton: {
    padding: 8,
    marginRight: 8,
  },
  imageButtonText: {
    fontSize: 24,
  },
//   languageButton: {
//     padding: 4,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 4,
//     marginRight: 8,
//   },
//   languageButtonText: {
//     fontSize: 12,
//     color: '#666',
//   },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#0084ff', // Messenger blue
    transform: [{ scale: 1 }],
  },
  sendButtonTextActive: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  sendImageButton: {
    backgroundColor: '#0084ff', 
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  languageItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedLanguageItem: {
    backgroundColor: '#f0f0f0',
  },
  languageItemText: {
    fontSize: 16,
  },
  selectedLanguageItemText: {
    fontWeight: 'bold',
    color: '#007bff',
  },
});

export default ChatInput;