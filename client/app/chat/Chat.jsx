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
    <View style={styles.messageContainer}>
      <Text style={styles.messageContent}>{item.content}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.sentAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {chatDetails.chatId ? (
        <>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) =>
              item.id?.toString() || Math.random().toString()
            }
            style={styles.messagesList}
          />
          <View style={styles.inputContainer}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message"
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
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#888",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messagesList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
  },
  messageContent: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007bff",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ChatScreen;
