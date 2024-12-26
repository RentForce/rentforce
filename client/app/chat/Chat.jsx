import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';

const ChatScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const [chatDetails, setChatDetails] = useState({
    chatId: null,
    userId: null,
    receiverId: null,
  });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [gradientAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchChatDetails = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const currentUserId = await AsyncStorage.getItem("userId");

        if (route.params) {
          const { chatId, userId, receiverId } = route.params;

          if (chatId && userId && receiverId) {
            setChatDetails({ chatId, userId, receiverId });

            // Fetch chat messages with token
            const response = await axios.get(
              `${apiUrl}api/chats/messages/${chatId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            setMessages(response.data);
          } else if (receiverId) {
            await createNewChat(currentUserId, receiverId);
          } else {
            Alert.alert("Error", "Missing chat details");
          }
        } else {
          Alert.alert("Error", "No chat selected");
        }
      } catch (error) {
        console.error("Error fetching chat details", error);
        Alert.alert("Error", "Could not fetch chat details");
      }
    };

    fetchChatDetails();
  }, [route.params]);

  useEffect(() => {
    // Create smooth gradient animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const createNewChat = async (currentUserId, receiverId) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await axios.post(
        `${apiUrl}api/chats/create`,
        {
          userId: currentUserId,
          receiverId: receiverId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newChat = response.data;

      setChatDetails({
        chatId: newChat.id,
        userId: currentUserId,
        receiverId: receiverId,
      });

      navigation.setParams({
        chatId: newChat.id,
        userId: currentUserId,
        receiverId: receiverId,
      });
    } catch (error) {
      console.error("Error creating new chat", error);
      Alert.alert("Error", "Could not create new chat");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = await AsyncStorage.getItem("token");

      if (!chatDetails.chatId || !chatDetails.userId) {
        Alert.alert("Error", "Chat details are missing");
        return;
      }

      const response = await axios.post(
        `${apiUrl}api/chats/message`,
        {
          chatId: chatDetails.chatId,
          userId: chatDetails.userId,
          content: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages([...messages, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message", error);
      Alert.alert("Error", "Could not send message");
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.userId === chatDetails.userId ? styles.sentMessage : styles.receivedMessage
    ]}>
      <Text style={[
        styles.messageContent,
        item.userId === chatDetails.userId ? styles.sentMessageText : styles.receivedMessageText
      ]}>{item.content}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.sentAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.container}
    >
      {chatDetails.chatId ? (
        <>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesListContent}
          />
          <View style={styles.inputContainer}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message"
              placeholderTextColor="#rgba(255,255,255,0.7)"
              style={styles.input}
              multiline
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No chat selected</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: 15,
  },
  messageContainer: {
    maxWidth: '80%',
    borderRadius: 20,
    padding: 12,
    marginVertical: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0084ff',
    borderTopRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 4,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#ffffff',
  },
  receivedMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    backgroundColor: '#00ff9d',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
  },
  sendButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
  },
});

export default ChatScreen;