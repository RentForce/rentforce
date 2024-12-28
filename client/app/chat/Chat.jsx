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
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "./Notifications.jsx";

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
  const flatListRef = useRef();
  const { markChatAsRead } = useNotifications();

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  // Initialize chat and get user ID
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          navigation.navigate("Login");
          return;
        }

        // Store token in userToken for consistency
        await AsyncStorage.setItem("userToken", token);

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
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setChatId(response.data.id);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Fetch messages only after initialization
  useEffect(() => {
    if (isInitialized && chatId && currentUserId) {
      const fetchMessages = async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          const response = await axios.get(`${apiUrl}/api/chat/messages/${chatId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          setMessages(response.data);

          // Mark messages as read
          await axios.put(
            `${apiUrl}/api/chat/${chatId}/read/${currentUserId}`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (markChatAsRead) {
            markChatAsRead(chatId);
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

      fetchMessages();
    }
  }, [chatId, currentUserId, isInitialized]);
  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(`${apiUrl}/api/chat/messages/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setMessages(response.data);

      await axios.put(
        `${apiUrl}/api/chat/${chatId}/read/${currentUserId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      markChatAsRead(chatId);
    }
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.post(
        `${apiUrl}/api/chat/message`,
        {
          chatId,
          userId: currentUserId,
          content: newMessage.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }) => {
    if (!item) return null;

    const messageTime = new Date(item.sentAt).toLocaleTimeString();
    const isCurrentUser = item?.userId === currentUserId;
    const messageContainer = [
      styles.messageContainer,
      isCurrentUser ? styles.sentMessage : styles.receivedMessage
    ];

    switch (item.type) {
      case "IMAGE":
        return (
          <View style={messageContainer}>
            <Image
              source={{ uri: item.content }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            <Text style={styles.messageTime}>{messageTime}</Text>
          </View>
        );

      case "VOICE":
        return (
          <View style={messageContainer}>
            <VoiceMessage audioUrl={item.content} />
            <Text style={styles.messageTime}>{messageTime}</Text>
          </View>
        );

      default:
        return (
          <View style={messageContainer}>
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.sentMessageText : styles.receivedMessageText
            ]}>
              {item.content || ''}
            </Text>
            <Text style={styles.messageTime}>{messageTime}</Text>
          </View>
        );
    }
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
    flexDirection: 'row',
    marginVertical: 5,
    maxWidth: '80%',
  },
  messageContent: {
    borderRadius: 20,
    padding: 12,
    maxWidth: '100%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
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
  },
  sentMessageTime: {
    color: '#8E8E93',
    alignSelf: 'flex-end',
  },
  receivedMessageTime: {
    color: '#8E8E93',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    alignSelf: 'flex-end',
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
    borderRadius: 20,
  },
  
  voiceMessageText: {
    marginLeft: 10,
    color: '#007AFF',
  },
  
  mediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 20,
  },
  
  voiceMessageText: {
    marginLeft: 10,
    color: '#007AFF',
  },
  
  mediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Chat;
