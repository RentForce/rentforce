import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Text, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
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
    style={styles.sendButton} 
    onPress={handleSendText}
  >
    <FontAwesome 
      name="send" 
      size={24} 
      color="black" 
    />
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
  container: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadingContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 248, 248, 0.95)',
    borderRadius: 12,
    margin: 8,
  },
  uploadingText: {
    marginTop: 8,
    color: '#666',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  imageButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    backgroundColor: '#f0f2f5',
    color: '#1c1e21',
  },
  selectedImageContainer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedImagePreview: {
    height: 200,
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedImageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#ff4d4f',
    padding: 12,
    borderRadius: 25,
    width: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sendImageButton: {
    backgroundColor: '#0084ff',
    padding: 12,
    borderRadius: 25,
    width: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1e21',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  languageItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedLanguageItem: {
    backgroundColor: '#e7f3ff',
  },
  languageItemText: {
    fontSize: 16,
    color: '#1c1e21',
  },
  selectedLanguageItemText: {
    fontWeight: 'bold',
    color: '#0084ff',
  },
});

export default ChatInput;