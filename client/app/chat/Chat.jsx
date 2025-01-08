import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "./Notifications.jsx";
import { initSocket, getSocket, disconnectSocket } from './Socket';

import ImageUpload from './components/ImageUpload';
import VoiceUpload from './components/VoiceUpload';
import VoiceMessage from './components/VoiceMessage';
import AudioCall from './components/AudioCall';

// Utility functions
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
};

const useAuthToken = () => {
  const [token, setToken] = useState(null);
  const navigation = useNavigation();

  const getToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("userToken");
      if (!storedToken) {
        navigation.navigate("Login");
        return null;
      }
      const authToken = storedToken.startsWith('Bearer ') ? storedToken : `Bearer ${storedToken}`;
      await AsyncStorage.setItem("userToken", authToken);
      return authToken;
    } catch (error) {
      console.error("Token retrieval error:", error);
      navigation.navigate("Login");
      return null;
    }
  };

  return { token, getToken };
};

const Chat = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { receiverId, otherUser: initialOtherUser, chatId: initialChatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);
  const [otherUser, setOtherUser] = useState(initialOtherUser || null);
  const [chatId, setChatId] = useState(initialChatId);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSentMessageId, setLastSentMessageId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const flatListRef = useRef();
  const { markChatAsRead } = useNotifications();
  const { getToken } = useAuthToken();
  
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  // Debug IDs
  useEffect(() => {
    console.log('User IDs:', {
      currentUserId,
      receiverId,
      otherUserId: otherUser?.id,
      initialOtherUserId: initialOtherUser?.id
    });
  }, [currentUserId, receiverId, otherUser, initialOtherUser]);

  // Load current user data first
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const [userId, userName, userEmail, userToken] = await Promise.all([
          AsyncStorage.getItem('userId'),
          AsyncStorage.getItem('userName'),
          AsyncStorage.getItem('userEmail'),
          AsyncStorage.getItem('userToken')
        ]);

        console.log('Loaded current user data:', { userId, userName, userEmail });

        if (!userId) {
          console.error('Missing current user ID');
          return;
        }

        // Store the current user ID
        const currentId = userId.toString();
        setCurrentUserId(currentId);

        // If we don't have the userName, try to fetch it
        if (!userName && userToken) {
          try {
            const response = await axios.get(`${apiUrl}/api/users/me`, {
              headers: { Authorization: userToken }
            });

            const userData = response.data;
            const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ');
            
            console.log('Fetched current user data:', userData);
            
            await AsyncStorage.setItem('userName', fullName);
            setCurrentUserName(fullName);
          } catch (error) {
            console.error('Error fetching current user data:', error);
            // Use a fallback name if fetch fails
            const fallbackName = `User ${currentId}`;
            await AsyncStorage.setItem('userName', fallbackName);
            setCurrentUserName(fallbackName);
          }
        } else {
          setCurrentUserName(userName || `User ${currentId}`);
        }

      } catch (error) {
        console.error('Error loading current user data:', error);
      }
    };

    loadCurrentUser();
  }, [apiUrl]);

  // Load other user data after current user is loaded
  useEffect(() => {
    const loadOtherUser = async () => {
      try {
        if (!currentUserId) {
          console.log('Waiting for current user ID');
          return;
        }

        const otherUserId = receiverId.toString();

        // Ensure receiverId is different from currentUserId
        if (otherUserId === currentUserId) {
          console.error('Receiver ID matches current user ID');
          return;
        }

        // Set other user data from route params if available
        if (initialOtherUser?.id && initialOtherUser.id.toString() === otherUserId) {
          const fullName = [initialOtherUser.firstName, initialOtherUser.lastName]
            .filter(Boolean)
            .join(' ');
            
          const otherUserData = {
            ...initialOtherUser,
            id: otherUserId,
            name: fullName || `User ${otherUserId}`
          };

          console.log('Using initial other user data:', otherUserData);
          setOtherUser(otherUserData);
          await AsyncStorage.setItem('otherUserData', JSON.stringify(otherUserData));
        } else {
          // Try to get from storage as fallback
          try {
            const storedOtherUser = await AsyncStorage.getItem('otherUserData');
            if (storedOtherUser) {
              const parsedUser = JSON.parse(storedOtherUser);
              if (parsedUser.id.toString() === otherUserId) {
                console.log('Using stored other user data:', parsedUser);
                setOtherUser(parsedUser);
              } else {
                console.log('Using minimal receiver data (ID mismatch)');
                setOtherUser({
                  id: otherUserId,
                  name: `User ${otherUserId}`
                });
              }
            } else {
              console.log('Using minimal receiver data (no stored data)');
              setOtherUser({
                id: otherUserId,
                name: `User ${otherUserId}`
              });
            }
          } catch (error) {
            console.error('Error reading stored user data:', error);
            setOtherUser({
              id: otherUserId,
              name: `User ${otherUserId}`
            });
          }
        }
      } catch (error) {
        console.error('Error loading other user data:', error);
      }
    };

    loadOtherUser();
  }, [currentUserId, receiverId, initialOtherUser]);

  // Debug current state
  useEffect(() => {
    console.log('Current chat state:', {
      currentUserId,
      currentUserName,
      receiverId,
      otherUser,
      chatId,
      socketConnected,
      apiUrl
    });
  }, [currentUserId, currentUserName, receiverId, otherUser, chatId, socketConnected]);

  // Initialize socket connection
  useEffect(() => {
    let socketInitialized = false;

    const setupSocket = async () => {
      try {
        if (!currentUserId || !currentUserName || !otherUser?.id || !otherUser?.name) {
          console.error('Missing user data:', {
            currentUserId,
            currentUserName,
            otherUserId: otherUser?.id,
            otherUserName: otherUser?.name
          });
          return;
        }

        if (!apiUrl) {
          console.error('Missing API URL');
          return;
        }

        console.log('Initializing socket with data:', {
          currentUser: {
            id: currentUserId,
            name: currentUserName
          },
          otherUser: {
            id: otherUser.id,
            name: otherUser.name
          },
          apiUrl
        });

        // Initialize socket with retry logic
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries && !socketInitialized) {
          try {
            console.log(`Attempting to initialize socket (attempt ${retryCount + 1}/${maxRetries})`);
            const socket = await initSocket(apiUrl, currentUserId);
            
            if (socket) {
              socketInitialized = true;
              setSocketConnected(true);
              console.log('Socket successfully initialized');

              // Test socket connection
              socket.emit('test', {
                userId: currentUserId,
                userName: currentUserName,
                receiverId: otherUser.id,
                receiverName: otherUser.name,
                chatId,
                message: 'Testing connection'
              });

              break;
            }
          } catch (error) {
            console.error(`Socket initialization attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        if (!socketInitialized) {
          console.error('Failed to initialize socket after multiple attempts');
          Alert.alert(
            'Connection Error',
            'Failed to establish call connection. Please try again.'
          );
        }
      } catch (error) {
        console.error('Error in socket setup:', error);
      }
    };

    if (currentUserId && currentUserName && otherUser?.id && otherUser?.name) {
      setupSocket();
    }

    return () => {
      if (socketInitialized) {
        console.log('Cleaning up socket connection');
        disconnectSocket();
        setSocketConnected(false);
      }
    };
  }, [currentUserId, currentUserName, otherUser, apiUrl]);

  // Message fetching logic
  const fetchMessages = useCallback(async () => {
    if (!isInitialized || !chatId || !currentUserId) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await axios.get(
        `${apiUrl}/api/chat/messages/${chatId}`,
        {
          headers: {
            'Authorization': token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        }
      );

      setMessages(response.data);
      updateLastSentMessage(response.data);
    } catch (error) {
      handleApiError(error);
    }
  }, [isInitialized, chatId, currentUserId]);

  // Message sending logic
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    try {
      const token = await getToken();
      if (!token) return;

      if (!chatId || !currentUserId || !receiverId) {
        Alert.alert('Error', 'Missing chat information. Please try again.');
        return;
      }

      const messageData = {
        content: newMessage.trim(),
        chatId: parseInt(chatId),
        userId: parseInt(currentUserId),
        receiverId: parseInt(receiverId),
        type: 'TEXT',
        read: false,
        sentAt: new Date().toISOString()
      };

      const response = await axios.post(
        `${apiUrl}/api/chat/message`,
        messageData,
        {
          headers: { 
            'Authorization': token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        }
      );

      handleNewMessage(response.data);
    } catch (error) {
      handleApiError(error);
    }
  };

  // Message rendering
  const renderMessage = useCallback(({ item }) => {
    if (!item) return null;

    const isCurrentUser = item?.userId === currentUserId;
    const messageTime = formatTime(item.sentAt);
    const isRead = item.isRead || false;
    const isLastSentMessage = item.id === lastSentMessageId;
    const showSeen = isCurrentUser && isRead && isLastSentMessage;

    return (
      <MessageItem
        item={item}
        isCurrentUser={isCurrentUser}
        messageTime={messageTime}
        showSeen={showSeen}
        otherUser={otherUser}
      />
    );
  }, [currentUserId, lastSentMessageId, otherUser]);

  // Helper functions
  const handleApiError = (error) => {
    if (error.response?.status === 403) {
      navigation.navigate("Login");
    } else {
      Alert.alert('Error', error.response?.data?.error || 'An error occurred');
    }
  };

  const updateLastSentMessage = (messageList) => {
    const lastSentMessage = [...messageList]
      .reverse()
      .find(msg => msg.userId === currentUserId);
    setLastSentMessageId(lastSentMessage?.id || null);
  };

  const handleNewMessage = (messageData) => {
    const newMessageObj = {
      ...messageData,
      userId: currentUserId,
      receiverId: receiverId,
      isRead: false
    };
    setMessages(prev => [...prev, newMessageObj]);
    setNewMessage("");
    flatListRef.current?.scrollToEnd();
  };

  // Effects
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(decodedToken.id);

        if (!chatId && receiverId) {
          const response = await axios.post(
            `${apiUrl}/api/chat/create`,
            {
              userId: decodedToken.id,
              receiverId: receiverId,
            },
            {
              headers: { 
                'Authorization': token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            }
          );
          setChatId(response.data.id);
        }

        setIsInitialized(true);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const pollInterval = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollInterval);
  }, [isInitialized, fetchMessages]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <AudioCall
        chatId={chatId}
        receiverId={receiverId.toString()}
        onEndCall={() => console.log('Call ended')}
        otherUser={otherUser || {
          id: receiverId.toString(),
          name: `User ${receiverId}`
        }}
        currentUser={{
          id: currentUserId?.toString(),
          name: currentUserName || `User ${currentUserId}`
        }}
      />
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
        chatId={chatId}
        currentUserId={currentUserId}
        receiverId={receiverId}
        setMessages={setMessages}
      />
    </KeyboardAvoidingView>
  );
};

// Separated components
const MessageItem = React.memo(({ item, isCurrentUser, messageTime, showSeen, otherUser }) => {
  const messageContainerStyle = [
    styles.messageContainer,
    isCurrentUser ? styles.sentMessage : styles.receivedMessage
  ];

  const renderContent = () => {
    switch (item.type) {
      case "IMAGE":
        return (
          <Image
            source={{ uri: item.content }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        );
      case "AUDIO":
        return <VoiceMessage audioUrl={item.content} />;
      default:
        return (
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.sentMessageText : styles.receivedMessageText
          ]}>
            {item.content}
          </Text>
        );
    }
  };

  return (
    <View style={messageContainerStyle}>
      <View style={styles.messageRow}>
        {!isCurrentUser && (
          <View style={styles.avatarContainer}>
            <Image source={{ uri: otherUser?.image }} style={styles.avatar} />
          </View>
        )}
        <View style={styles.messageContent}>
          {renderContent()}
          <View style={styles.messageStatusContainer}>
            <Text style={styles.messageTime}>{messageTime}</Text>
            {showSeen && <Text style={styles.seenText}>Seen</Text>}
          </View>
        </View>
      </View>
    </View>
  );
});

const ChatInput = React.memo(({ 
  newMessage, 
  setNewMessage, 
  sendMessage, 
  chatId, 
  currentUserId, 
  receiverId, 
  setMessages 
}) => {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.mediaButtons}>
        {chatId && currentUserId && receiverId && (
          <>
            <ImageUpload
              chatId={chatId}
              userId={currentUserId}
              receiverId={receiverId}
              senderId={currentUserId}
              onImageSent={(message) => {
                setMessages(prev => [...prev, {
                  ...message,
                  userId: currentUserId,
                  receiverId: receiverId,
                  senderId: currentUserId,
                  read: false
                }]);
              }}
            />
            <VoiceUpload
              chatId={chatId}
              userId={currentUserId}
              receiverId={receiverId}
              senderId={currentUserId}
              onVoiceSent={(message) => {
                setMessages(prev => [...prev, {
                  ...message,
                  userId: currentUserId,
                  receiverId: receiverId,
                  senderId: currentUserId,
                  read: false
                }]);
              }}
            />
          </>
        )}
      </View>
      <TextInput
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder="Type a message..."
        style={styles.input}
        multiline
        maxLength={1000}
      />
      <TouchableOpacity
        onPress={sendMessage}
        style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
        disabled={!newMessage.trim()}
      >
        <Ionicons
          name="send"
          size={24}
          color={newMessage.trim() ? "#007AFF" : "#A8A8A8"}
        />
      </TouchableOpacity>
    </View>
  );
});
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 15,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
 
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed from flex-end to flex-start
  },
  avatarContainer: {
    paddingTop: 4, // Add slight padding to align with message
    marginRight: 8,
  },
  messageContent: {
    borderRadius: 20,
    padding: 12,
    maxWidth: '100%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#FFFFFF',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 12,
  },
  receivedMessageText: {
    color: '#000000',
    backgroundColor: '#E8E8E8',
    borderRadius: 20,
    padding: 12,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    color: '#8E8E93',
  },
  sentMessageTime: {
    alignSelf: 'flex-end',
  },
  receivedMessageTime: {
    alignSelf: 'flex-start',
  },

  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 20
  },
  
  voiceMessageText: {
    marginLeft: 10,
    color: '#007AFF',
  },
  
  mediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  seenText: {
    fontSize: 12,
    color: '#007AFF',
  },
 avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});

export default Chat;