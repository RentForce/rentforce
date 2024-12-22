import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'
import AudioMessage from './AudioMessagePlayer.jsx';
import * as FileSystem from 'expo-file-system';
import { initSocket,getSocket } from './Socket.js';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import io from 'socket.io-client';
import VoiceRecorder from './VoiceRecorder.jsx';
import ChatInput from './ChatInput.jsx';
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// Create axios instance with default config
const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor to add token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            console.log('API Request:', {
                url: config.url,
                method: config.method,
                headers: config.headers
            });
            return config;
        } catch (error) {
            console.error('API Request Error:', error);
            return Promise.reject(error);
        }
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Response Error:', {
            message: error.message,
            code: error.code,
            config: error.config
        });
        return Promise.reject(error);
    }
);

const UserSelectionScreen = ({ navigation ,onSendMessage, onLanguageChange }) => {
    // Make sure these state declarations are at the top of the component
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [translations, setTranslations] = useState({});
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [isUploading, setIsUploading] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedModalImage, setSelectedModalImage] = useState(null);

    const socketRef = useRef(null);
    const isMountedRef = useRef(true);
    const uploadUrl = `${apiUrl}/api/chat/upload`;

    const handleSendImage = async () => {
        if (!selectedImage) return;
    
        try {
            setIsUploading(true);
            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('userId');
            
            const formData = new FormData();
            
            formData.append('file', {
                uri: selectedImage.uri,
                type: 'image/jpeg',
                name: 'image.jpg'
            });
            
            formData.append('userId', userId);
            formData.append('chatId', selectedUser.chatId);
            formData.append('senderId', userId);
            formData.append('receiverId', selectedUser.id);
            formData.append('messageType', 'IMAGE');

            const response = await axios.post(
                uploadUrl,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000,
                }
            );

            if (response.data && response.data.url) {
                await sendMessage({
                    content: response.data.url,
                    type: 'IMAGE',
                    userId: userId
                });
                
                setSelectedImage(null);
                setShowImagePreview(false);
            }
        } catch (error) {
            console.error('Image upload error:', error);
            Alert.alert(
                'Upload Failed',
                'Failed to upload image. Please try again.'
            );
        } finally {
            setIsUploading(false);
        }
    };
    const renderInputContainer = () => {
        return (
            <View>
                {showImagePreview && selectedImage && (
                    <View style={styles.selectedImageContainer}>
                        <Image
                            source={{ uri: selectedImage.uri }}
                            style={styles.selectedImagePreview}
                            resizeMode="contain"
                        />
                        <View style={styles.selectedImageActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setSelectedImage(null);
                                    setShowImagePreview(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sendImageButton}
                                onPress={handleSendImage}
                                disabled={isUploading}
                            >
                                <Text style={styles.sendButtonText}>
                                    {isUploading ? 'Sending...' : 'Send Image'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                <View style={styles.inputContainer}>
                    <VoiceRecorder onRecordComplete={(uri) => handleVoiceMessage(uri)} chatId={selectedUser.chatId} senderId={currentUser.id}/>
                    <TextInput
                        style={styles.messageInput}
                        value={messageInput}
                        onChangeText={setMessageInput}
                        placeholder="Type a message..."
                        multiline
                    />
                  <TouchableOpacity onPress={handleImageUpload} style={styles.imageButton}>
    <MaterialCommunityIcons 
        name="camera" 
        size={24} 
        color="#666666" 
    />
</TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sendButton, messageInput.trim() ? styles.sendButtonActive : null]}
                        onPress={async () => {
                            const userId = await AsyncStorage.getItem('userId');
                            sendMessage({ 
                                content: messageInput, 
                                type: 'TEXT',
                                userId: userId
                            });
                        }}
                    >
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };
const handleImageUpload = async () => {
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

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
            setShowImagePreview(true);
        }
    } catch (error) {
        console.error('Error selecting image:', error);
        Alert.alert('Error', 'Failed to select image');
    }
};


const handleVoiceMessage = async (audioUri) => {
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
    // Image modal
    const ImageModal = ({ visible, image, onClose }) => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <Image
                    source={{ uri: image }}
                    style={styles.modalImage}
                    resizeMode="contain"
                />
            </TouchableOpacity>
        </Modal>
    );

    // Language selector
    // const LanguageSelector = () => (
    //     <View style={styles.languageSelector}>
    //         <TouchableOpacity 
    //             style={[styles.languageButton, selectedLanguage === 'en' && styles.selectedLanguage]}
    //             onPress={() => setSelectedLanguage('en')}
    //         >
    //             <Text style={[styles.languageButtonText, selectedLanguage === 'en' && styles.selectedLanguageText]}>English</Text>
    //         </TouchableOpacity>
    //         <TouchableOpacity 
    //             style={[styles.languageButton, selectedLanguage === 'es' && styles.selectedLanguage]}
    //             onPress={() => setSelectedLanguage('es')}
    //         >
    //             <Text style={[styles.languageButtonText, selectedLanguage === 'es' && styles.selectedLanguageText]}>Spanish</Text>
    //         </TouchableOpacity>
    //         <TouchableOpacity 
    //             style={[styles.languageButton, selectedLanguage === 'fr' && styles.selectedLanguage]}
    //             onPress={() => setSelectedLanguage('fr')}
    //         >
    //             <Text style={[styles.languageButtonText, selectedLanguage === 'fr' && styles.selectedLanguageText]}>French</Text>
    //         </TouchableOpacity>
    //     </View>
    // );

    // Fetch users and current user
    useEffect(() => {
        const fetchUsersAndCurrentUser = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const currentUserId = await AsyncStorage.getItem('userId');
                const currentUserString = await AsyncStorage.getItem('currentUser');
                const currentUserData = JSON.parse(currentUserString);

                const response = await axios.get(`${apiUrl}/api/chat/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const filteredUsers = response.data.filter(
                    user => user.id.toString() !== currentUserId
                );

                if (isMountedRef.current) {
                    setUsers(filteredUsers);
                    setCurrentUser(currentUserData);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching users', error);
                Alert.alert('Error', 'Could not fetch user list');
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchUsersAndCurrentUser();
    }, []);

    // Initialize chat
    const initiateChat = async (receiver) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('userId');

            const response = await axios.post(
                `${apiUrl}/api/chat/create`,
                {
                    userId: userId,
                    receiverId: receiver.id
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        "Content-Type": "application/json",
                    }
                }
            );

            const newChat = response.data;

            const messagesResponse = await axios.get(
                `${apiUrl}/api/chat/messages/${newChat.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (isMountedRef.current) {
                setSelectedUser({
                    ...receiver,
                    chatId: newChat.id
                });

                setMessages(messagesResponse.data.map(msg => ({
                    ...msg,
                    sender: msg.user
                })));
            }

        } catch (error) {
            console.error('Detailed Error creating chat', error.response ? error.response.data : error);
            Alert.alert(
                'Error',
                error.response && error.response.data.details
                    ? error.response.data.details
                    : 'Could not start conversation'
            );
        }
    };

    // Send message
    const sendMessage = async (messageData) => {
        if (!messageData.content.trim() || !selectedUser) return;

        try {
            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('userId');

            // Create the proper message structure
            const message = {
                chatId: selectedUser.chatId,
                userId: userId,
                senderId: userId,
                content: messageData.content,
                type: messageData.type || 'TEXT',
                receiverId: selectedUser.id
            };

            const response = await axios.post(
                `${apiUrl}/api/chat/message`,
                message,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            const sentMessage = {
                ...response.data,
                userId: userId,
                sender: currentUser
            };

            if (socketRef.current) {
                socketRef.current.emit('send message', sentMessage);
            }

            if (isMountedRef.current) {
                setMessages(prevMessages => [...prevMessages, sentMessage]);
                setMessageInput('');
            }
        } catch (error) {
            console.error('Error sending message:', error.response?.data || error);
            Alert.alert('Error', 'Could not send message');
        }
    };

    // Render message item
    const renderMessageItem = ({ item }) => {
        const isCurrentUserMessage = item.userId === currentUser?.id;
    
        const renderMessageContent = () => {
            switch (item.type) {
                case 'AUDIO':
                    return (
                        <AudioMessage 
                            audioUrl={item.content}
                            isOwnMessage={isCurrentUserMessage}
                        />
                    );
                case 'IMAGE':
                    return (
                        <TouchableOpacity 
                            onPress={() => {
                                setSelectedModalImage(item.content);
                                setImageModalVisible(true);
                            }}
                        >
                            <Image
                                source={{ uri: item.content }}
                                style={styles.messageImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    );
                default:
                    return (
                        <Text style={[
                            styles.messageText,
                            isCurrentUserMessage ? styles.sentMessageText : styles.receivedMessageText
                        ]}>
                            {item.content}
                        </Text>
                    );
            }
        };
    
        return (
            <View style={[
                styles.messageContainer,
                isCurrentUserMessage ? styles.sentMessageContainer : styles.receivedMessageContainer
            ]}>
                {!isCurrentUserMessage && (
                    <Text style={styles.senderName}>
                        {item.sender?.firstName || item.user?.firstName} {item.sender?.lastName || item.user?.lastName}
                    </Text>
                )}
                <View style={[
                    styles.messageItem,
                    isCurrentUserMessage ? styles.sentMessage : styles.receivedMessage,
                    item.type === 'AUDIO' && styles.audioMessageContainer
                ]}>
                    {renderMessageContent()}
                </View>
            </View>
        );
    };
    
    // Update your existing styles
  
    // Render user item
    const renderUserItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => initiateChat(item)}
        >
            <View>
                <Text style={styles.userName}>
                    {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
        </TouchableOpacity>
    );

    // Loading indicator
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Loading users...</Text>
            </View>
        );
    }

    if (selectedUser) {
        return (
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={() => {
                        if (socketRef.current) {
                            socketRef.current.emit('leave chat', selectedUser.chatId);
                        }
                        setSelectedUser(null);
                        setMessages([]);
                    }}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.chatTitle}>
                        {selectedUser.firstName} {selectedUser.lastName}
                    </Text>
                </View>

                {/* <LanguageSelector /> */}
                <FlatList
    data={[...messages].reverse()}
    renderItem={renderMessageItem}
    keyExtractor={(item, index) => `${item.id || index}`}
    style={styles.messagesList}
    inverted={true}
/>
                {renderInputContainer()}
                <ImageModal
                    visible={imageModalVisible}
                    image={selectedModalImage}
                    onClose={() => {
                        setImageModalVisible(false);
                        setSelectedModalImage(null);
                    }}
                />
            </KeyboardAvoidingView>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Start a New Conversation</Text>
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item, index) => `${item.id || index}`}
                style={styles.userList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DBE4E3', // Updated background color
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#DBE4E3', // Updated background color
    },
    
    // Message Container Styles

    messageContainer: {
        marginVertical: 5,
        maxWidth: '80%',
        paddingHorizontal: 10,
    },
   
  
    messageItem: {
        borderRadius: 15, // Added consistent border radius
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },

        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    sentMessageContainer: {
        alignSelf: 'flex-end',
    },
    receivedMessageContainer: {
        alignSelf: 'flex-start',
    },
    modalImage: {
        width: '100%',
        height: undefined,
        aspectRatio: 1,
        borderRadius: 0,
        borderWidth: 0,
    },
    // Message Colors and Text
    sentMessage: {
        backgroundColor: '#A0BFC7', // New sent message color
    },
    receivedMessage: {
        backgroundColor: '#E1E6E4', // New received message color
    },
    messageText: {
        fontSize: 16,
        color: '#000000', // Black text for all messages
    },
    sentMessageText: {
        color: '#000000',
    },
    receivedMessageText: {
        color: '#000000',
    },
    audioMessageContainer: {
        padding: 10,
        borderRadius: 15,
    },
    audioMessageInner: {
        backgroundColor: 'transparent',
    },
    // Audio Message Styles
    audioMessageContainer: {
       // backgroundColor: '#E1E6E4', // Light grey background
        backgroundColor: '#DFE7E4', // Outer color for voice messages
        padding: 10,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    audioMessageInner: {
        backgroundColor: '#93BECA', // Inner color for voice messages
        padding: 10,
        borderRadius: 8,
    },
    
    // Image Message Styles
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 15,
    },
    
    // User List Styles
    userItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
        backgroundColor: '#DFE7E4',
        marginHorizontal: 10,
        marginVertical: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    
    // Input Container Styles
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    messageInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
        backgroundColor: '#f9f9f9',
        fontSize: 14,
    },
    
    // Selected Image Styles
    selectedImageContainer: {
        width: '100%',
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    selectedImagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 0, // Removed border radius
    },
    
    senderName: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 2,
        marginLeft: 12,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 0, // No border radius
        borderWidth: 0, // No border
    },
    audioMessageContainer: {
        padding: 0,
        backgroundColor: '#DFE7E4',
    },
    audioMessageInner: {
        backgroundColor: '#93BECA',
        padding: 10,
        borderRadius: 8,
    },
    
    uploadingContainer: {
        width: '100%',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    uploadingText: {
        marginTop: 10,
        color: '#007bff',
        fontSize: 16,
    },
    selectedImageContainer: {
        width: '100%',
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    selectedImagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 0, // No border radius
        borderWidth: 0, // No border
    },
    selectedImageActions: {
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
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    imageUploadProgress: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        height: '100%',
    },
    progressText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
   
    imageButtonText: {
        fontSize: 24,
    },
    imageButton: {
        padding: 10,
        marginHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#DBE4E3',
    },
        messageContainer: {
            marginVertical: 5,
            maxWidth: '80%',
        },
        sentMessageContainer: {
            alignSelf: 'flex-start',
        },
        receivedMessageContainer: {
            alignSelf: 'flex-end',
        },
        messageItem: {
            borderRadius: 0,
            padding: 0,
        },
        sentMessage: {
            backgroundColor: '#007AFF',
        },
        receivedMessage: {
            backgroundColor: '#E8E8E8',
        },
        messageText: {
            fontSize: 16,
        },
        sentMessageText: {
            color: '#FFFFFF',
        },
        receivedMessageText: {
            color: '#ffffff',
        },
        senderName: {
            fontSize: 12,
            color: '#666666',
            marginBottom: 2,
            marginLeft: 12,
        },
        messageImage: {
            width: 200,
            height: 200,
            borderRadius: 10,
        },
        audioMessageContainer: {
            padding: 0, 
            backgroundColor: 'transparent', 
        },
    
    uploadingContainer: {
        width: '100%',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    uploadingText: {
        marginTop: 10,
        color: '#007bff',
        fontSize: 16,
    },
    selectedImageContainer: {
        width: '100%',
        padding: 0, // Removed padding to eliminate any space
        backgroundColor: 'transparent', // Made background transparent
        borderTopWidth: 0, // Removed top border
        borderTopColor: 'transparent',
    },
    selectedImagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    selectedImageActions: {
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
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    sendImageButton: {
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    imageUploadProgress: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        height: '100%',
    },
    progressText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 10,
    },
    imageButton: {
        padding: 10,
        marginHorizontal: 5,
    },
    imageButtonText: {
        fontSize: 24,
    },

    // languageSelector: {
    //     flexDirection: 'row',
    //     padding: 10,
    //     backgroundColor: '#f0f0f0',
    //     justifyContent: 'center',
    //     borderBottomWidth: 1,
    //     borderBottomColor: '#e0e0e0',
    // },
    translatedText: {
        fontSize: 12,
        color: '#e0e0e0',
        fontStyle: 'italic',
        marginTop: 5,
    },
    translateButton: {
        marginTop: 5,
        padding: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 5,
    },
    translateButtonText: {
        color: '#fff',
        fontSize: 10,
    },
    // languageSelector: {
    //     flexDirection: 'row',
    //     padding: 10,
    //     backgroundColor: '#f0f0f0',
    //     justifyContent: 'center',
    // },
    languageButton: {
        padding: 8,
        marginHorizontal: 5,
        backgroundColor: '#fff',
        borderRadius: 5,
    },
    selectedLanguage: {
        backgroundColor: '#007bff',
    },
    container: {
        flex: 1,
        backgroundColor: '#DBE4E3', // Background color of the conversation
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
        backgroundColor: '#DFE7E4', // Sent message color
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        
    }},
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#f9f9f9',
    },

    // User List Styles
    // userItem: {
    //     padding: 15,
    //     borderBottomWidth: 1,
    //     borderBottomColor: '#e0e0e0',
    //     flexDirection: 'row',
    //     alignItems: 'center',
    // },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        color: '#666',
        marginTop: 2,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Chat Screen Styles
  chatContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    fontSize: 24,
    marginRight: 10,
    color: "#007bff",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  // Message Styles
  messageContainer: {
    marginBottom: 10,
    maxWidth: "80%",
  },
  sentMessageContainer: {
    alignSelf: "flex-end",
  },
  receivedMessageContainer: {
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
    paddingHorizontal: 5,
  },
  messageItem: {
    padding: 10,
    borderRadius: 10,
  },
  sentMessage: {
    backgroundColor: "#374957",
    alignSelf: "flex-end",
  },
  receivedMessage: {
    backgroundColor: "#797C7B",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 14,
    color: "white",
  },

    // Input Styles
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    messageInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
        backgroundColor: '#f9f9f9',
        fontSize: 14,
    },
    sendButton: {
        backgroundColor: '#000000',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    container: {
        padding: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 24,
        paddingHorizontal: 8,
      },
      input: {
        flex: 1,
        padding: 8,
        maxHeight: 100,
        fontSize: 16,
      },
      iconButton: {
        padding: 8,
      },
      sendButton: {
        padding: 8,
        borderRadius: 20,
      },
      sendButtonActive: {
        backgroundColor: '#e8f3ff',
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: '50%',
      },
      languageItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      },
    
});

export default UserSelectionScreen;
