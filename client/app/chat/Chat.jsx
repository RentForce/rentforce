import React, { useState, useEffect, useRef } from "react";
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
import { io } from "socket.io-client";

import ImageUpload from './components/ImageUpload';
import VoiceUpload from './components/VoiceUpload';
import VoiceMessage from './components/VoiceMessage';

const Chat = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { receiverId, otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatId, setChatId] = useState(route.params.chatId);
  const [isInitialized, setIsInitialized] = useState(false);
  const [readStatus, setReadStatus] = useState({});
  const [lastSentMessageId, setLastSentMessageId] = useState(null);
  const flatListRef = useRef();
  const { markChatAsRead } = useNotifications();

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  useEffect(() => {
    if (!isInitialized || !chatId || !currentUserId) {
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("Missing auth data:", { hasToken: false });
          navigation.navigate("Login");
          return;
        }

        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        const response = await axios.get(
          `${apiUrl}/api/chat/messages/${chatId}`,
          {
            headers: {
              'Authorization': authToken,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          }
        );

        if (isMounted) {
          setMessages(response.data);

          // Update read status from messages
          const newReadStatus = {};
          response.data.forEach(message => {
            if (message.userId === currentUserId) {
              newReadStatus[message.id] = { read: message.isRead || false };
            }
          });
          setReadStatus(newReadStatus);
        }
      } catch (error) {
        console.log("Message fetch error:", {
          status: error.response?.status,
          data: error.response?.data,
          userId: currentUserId,
          chatId
        });

        if (error.response?.status === 403) {
          navigation.navigate("Login");
        }
      }
    };

    fetchMessages();

    // Set up polling for messages
    const pollInterval = setInterval(fetchMessages, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isInitialized, chatId, currentUserId, markChatAsRead, receiverId]);
  // Initialize chat and get user ID
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log("Token format:", {
          token: token ? `${token.substring(0, 20)}...` : null,
          length: token?.length,
          hasBearer: token?.startsWith('Bearer ')
        });

        if (!token) {
          navigation.navigate("Login");
          return;
        }

        // Ensure token has 'Bearer ' prefix
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        await AsyncStorage.setItem("userToken", authToken);

        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const userId = decodedToken.id;
        setCurrentUserId(userId);

        if (!chatId && receiverId) {
          const response = await axios.post(
            `${apiUrl}/api/chat/create`,
            {
              userId: userId,
              receiverId: receiverId,
            },
            {
              headers: { 
                'Authorization': authToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            }
          );
          setChatId(response.data.id);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing chat:", error);
        if (error.response?.status === 403) {
          console.log("Auth error details:", {
            status: error.response.status,
            data: error.response.data
          });
        }
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    // Find the last sent message ID whenever messages update
    if (messages.length > 0) {
      const lastSentMessage = [...messages]
        .reverse()
        .find(msg => msg.userId === currentUserId);
      setLastSentMessageId(lastSentMessage?.id || null);
    }
  }, [messages, currentUserId]);

  useEffect(() => {
    if (!isInitialized || !chatId || !currentUserId) {
      return;
    }

    const markAsRead = async () => {
      try {
        // Check if there are any unread messages from other users
        const unreadMessages = messages.filter(
          msg => !msg.isRead && msg.userId !== currentUserId
        );

        if (unreadMessages.length > 0) {
          console.log('Marking messages as read in chat:', chatId);
          const success = await markChatAsRead(chatId);
          
          if (success) {
            setMessages(prevMessages =>
              prevMessages.map(msg => 
                msg.userId !== currentUserId ? { ...msg, isRead: true } : msg
              )
            );
          } else {
            // If marking as read failed, check if token is expired
            const token = await AsyncStorage.getItem("token");
            if (!token) {
              navigation.navigate("Login");
            }
          }
        }
      } catch (error) {
        if (error.response?.status === 403) {
          navigation.navigate("Login");
        }
      }
    };

    // Mark messages as read when the chat is opened or when new messages arrive
    markAsRead();
  }, [isInitialized, chatId, currentUserId, messages, markChatAsRead]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.navigate("Login");
        return;
      }

      if (!chatId || !currentUserId) {
        console.error("Missing required data:", { chatId, currentUserId });
        Alert.alert('Error', 'Missing chat information. Please try again.');
        return;
      }

      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      console.log('Sending message with:', {
        content: newMessage.trim(),
        chatId: parseInt(chatId),
        userId: parseInt(currentUserId),
        type: 'TEXT'
      });

      const response = await axios.post(
        `${apiUrl}/api/chat/message`,
        {
          content: newMessage.trim(),
          chatId: parseInt(chatId),
          userId: parseInt(currentUserId),
          type: 'TEXT'
        },
        {
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authToken
          },
        }
      );

      if (response.data) {
        const newMessageObj = {
          ...response.data,
          type: 'TEXT'
        };
        setMessages(prev => [...prev, newMessageObj]);
        setNewMessage("");
        flatListRef.current?.scrollToEnd();
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (error.response?.status === 403) {
        navigation.navigate("Login");
      } else {
        Alert.alert('Error', error.response?.data?.error || 'Failed to send message. Please try again.');
      }
    }
  };

  const renderMessage = ({ item }) => {
    if (!item) return null;
  
    const formatTime = (date) => {
      const d = new Date(date);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };
  
    const messageTime = formatTime(item.sentAt);
    const isCurrentUser = item?.userId === currentUserId;
    const messageContainerStyle = [
      styles.messageContainer,
      isCurrentUser ? styles.sentMessage : styles.receivedMessage
    ];
    const timeStyle = [
      styles.messageTime,
      isCurrentUser ? styles.sentMessageTime : styles.receivedMessageTime
    ];
  
    const isRead = item.isRead || false;
    const isLastSentMessage = item.id === lastSentMessageId;
    const showSeen = isCurrentUser && isRead && isLastSentMessage && item.userId !== receiverId;
  
    const renderMessageStatus = () => (
      <View style={styles.messageStatusContainer}>
        <Text style={timeStyle}>{messageTime}</Text>
        {showSeen && <Text style={styles.seenText}>Seen</Text>}
      </View>
    );
  
    const renderAvatar = () => {
      if (isCurrentUser) return null;
      return (
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: otherUser?.image }}
            style={styles.avatar}
          />
        </View>
      );
    };
  
    const messageContent = () => {
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
              {item.content || ''}
            </Text>
          );
      }
    };
  
    return (
      <View style={messageContainerStyle}>
        <View style={styles.messageRow}>
          {!isCurrentUser && renderAvatar()}
          <View style={[
            styles.messageContentContainer,
            isCurrentUser ? styles.sentContentContainer : styles.receivedContentContainer
          ]}>
            {messageContent()}
            {renderMessageStatus()}
          </View>
        </View>
      </View>
    );
  };



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
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        inverted={false}
      />
      <View style={styles.inputContainer}>
        <View style={styles.mediaButtons}>
        {chatId && currentUserId && receiverId ? (
  <ImageUpload
    chatId={chatId}
    senderId={currentUserId}
    receiverId={receiverId}
    onImageSent={(message) => {
      setMessages(prev => [...prev, message]);
      console.log('New message added:', message);
    }}
  />
) : (
  console.log('Missing required values:', {
    chatId,
    currentUserId,
    receiverId
  })
)}
          <VoiceUpload
            chatId={chatId}
            senderId={currentUserId}
            receiverId={receiverId}
            onVoiceSent={(message) => {
              setMessages(prev => [...prev, message]);
            }}
          />
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
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          disabled={!newMessage.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={newMessage.trim() ? "#007AFF" : "#A8A8A8"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
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
