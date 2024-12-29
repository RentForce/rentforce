import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Navbar from '../Home/Navbar';
import { useNotifications } from './Notifications.jsx';

const ChatSelectionScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { markChatAsRead } = useNotifications(); // Move this to component level

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const fetchConversations = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("No token found in ChatSelectionScreen, navigating to login");
        navigation.navigate("Login");
        return;
      }

      try {
        const userId = JSON.parse(atob(token.split('.')[1])).id;
        setCurrentUserId(userId); // Set currentUserId from token
        console.log("Fetching conversations for user:", userId);

        const response = await axios.get(
          `${apiUrl}/api/chat/conversations/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Sort conversations by latest message
        const sortedConversations = response.data.sort((a, b) => 
          new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );

        setConversations(sortedConversations);
      } catch (error) {
        console.error("Token decode or fetch error:", error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          console.log("Auth error in ChatSelectionScreen, clearing token");
          await AsyncStorage.removeItem("userToken");
          navigation.navigate("Login");
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][messageDate.getDay()];
    } else {
      return messageDate.toLocaleDateString();
    }
  };
  useEffect(() => {
    if (isFocused) {
      fetchConversations();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleChatPress = (conversation) => {
    const isCurrentUserSender = conversation.userId === parseInt(currentUserId);
    const receiverId = isCurrentUserSender ? conversation.receiverId : conversation.userId;

    navigation.navigate("ChatScreen", {
      chatId: conversation.id,
      receiverId: receiverId,
      otherUser: {
        id: receiverId,
        firstName: conversation.otherUserFirstName,
        lastName: conversation.otherUserLastName,
        image: conversation.otherUserImage || 'https://via.placeholder.com/50'
      }
    });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][messageDate.getDay()];
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleChatPress(item)}
    >
      <Image
        source={{ 
          uri: item.otherUserImage || 'https://via.placeholder.com/50'
        }}
        style={styles.userImage}
      />
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>
            {`${item.otherUserFirstName} ${item.otherUserLastName}`}
          </Text>
          <Text style={styles.timeStamp}>
            {formatLastMessageTime(item.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.lastMessageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'Start a conversation'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={50} color="#999" />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timeStamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
});

export default ChatSelectionScreen