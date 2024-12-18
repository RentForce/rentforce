import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import io from 'socket.io-client';

const UserSelectionScreen = ({ navigation }) => {
    // State variables
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    
    // Refs for socket and network management
    const socketRef = useRef(null);
    const isMountedRef = useRef(true);

    // Initialize socket connection
    useEffect(() => {
        // Create socket connection
        socketRef.current = io('http://192.168.103.4:5000', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        // Cleanup socket on component unmount
        return () => {
            isMountedRef.current = false;
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Effect for socket message handling
    useEffect(() => {
        if (!socketRef.current || !selectedUser) return;

        // Join the specific chat room
        socketRef.current.emit('join chat', selectedUser.chatId);

        // Handle incoming messages
        const handleNewMessage = (message) => {
            console.log('Incoming message:', message);
            
            // Ensure message is for the current chat and component is mounted
            if (isMountedRef.current && message.chatId === selectedUser.chatId) {
                setMessages(prevMessages => {
                    const isDuplicate = prevMessages.some(msg => 
                        msg.id === message.id || 
                        (msg.content === message.content && msg.sentAt === message.sentAt)
                    );
                    return isDuplicate 
                        ? prevMessages 
                        : [...prevMessages, message];
                });
            }
        };

        socketRef.current.on('new message', handleNewMessage);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('new message', handleNewMessage);
            }
        };
    }, [selectedUser]);

    useEffect(() => {
        const fetchUsersAndCurrentUser = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const currentUserId = await AsyncStorage.getItem('userId');
                const currentUserString = await AsyncStorage.getItem('currentUser');
                const currentUserData = JSON.parse(currentUserString);

                const response = await axios.get('http://192.168.103.4:5000/api/chat/users', {
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

    const initiateChat = async (receiver) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('userId');

            const response = await axios.post(
                'http://192.168.103.4:5000/api/chat/create',
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

            // Fetch existing messages for this chat
            const messagesResponse = await axios.get(
                `http://192.168.103.4:5000/api/chat/messages/${newChat.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            // Update state with selected user and messages
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

    // Send message function
    const sendMessage = async () => {
        if (!messageInput.trim() || !selectedUser) return;

        try {
            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('userId');

            const messageData = {
                chatId: selectedUser.chatId.toString(),
                userId: userId,
                content: messageInput,
                type: 'TEXT',
                sender: {
                    id: userId,
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName
                }
            };

            const response = await axios.post('http://192.168.103.4:5000/api/chat/message',
                messageData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        "Content-Type": "application/json",
                    }
                }
            );

            const sentMessage = {
                ...messageData,
                id: response.data.id,
                sentAt: new Date().toISOString(),
            };

            // Emit message via socket to all clients in the chat room
            if (socketRef.current) {
                socketRef.current.emit('send message', {
                    ...sentMessage,
                    chatId: selectedUser.chatId
                });
            }

            // Update local messages
            if (isMountedRef.current) {
                setMessages(prevMessages => [...prevMessages, sentMessage]);
                setMessageInput('');
            }
        } catch (error) {
            console.error('Error sending message', error.response ? error.response.data : error);
            Alert.alert('Error',
                error.response && error.response.data.details
                    ? error.response.data.details
                    : 'Could not send message'
            );
        }
    };

    // Render message item
    const renderMessageItem = ({ item }) => {
        const isCurrentUserMessage =
            item.userId === currentUser?.id ||
            (item.user && item.user.id === currentUser?.id);

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
                    isCurrentUserMessage ? styles.sentMessage : styles.receivedMessage
                ]}>
                    <Text style={[
                        styles.messageText,
                        isCurrentUserMessage ? styles.sentMessageText : {}
                    ]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    // Render user list item
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

    // Loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Loading users...</Text>
            </View>
        );
    }

    // Chat view
    if (selectedUser) {
        return (
            <KeyboardAvoidingView 
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={() => {
                        // Reset state when going back
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

                <FlatList
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={(item, index) => `${item.id || index}`}
                    style={styles.messagesList}
                    inverted={false}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.messageInput}
                        value={messageInput}
                        onChangeText={setMessageInput}
                        placeholder="Type a message..."
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={sendMessage}
                    >
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // User list view
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Start a New Conversation</Text>
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text>No users available to chat with</Text>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
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
    userItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
    },
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
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Chat Screen Styles
    chatContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        fontSize: 24,
        marginRight: 10,
        color: '#007bff',
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    messagesList: {
        flex: 1,
        paddingHorizontal: 10,
        paddingBottom: 10,
    },

    // Message Styles
    messageContainer: {
        marginBottom: 10,
        maxWidth: '80%',
    },
    sentMessageContainer: {
        alignSelf: 'flex-end',
    },
    receivedMessageContainer: {
        alignSelf: 'flex-start',
    },
    senderName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 3,
        paddingHorizontal: 5,
    },
    messageItem: {
        padding: 10,
        borderRadius: 10,
    },
    sentMessage: {
        backgroundColor: '#374957',
        alignSelf: 'flex-end',
    },
    receivedMessage: {
        backgroundColor: '#797C7B',
        alignSelf: 'flex-start',
    },
    messageText: {
        fontSize: 14,
        color: 'white',
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
        backgroundColor: '#007bff',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});


export default UserSelectionScreen;