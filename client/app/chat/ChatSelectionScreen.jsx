import React, { useEffect, useState, useCallback, memo } from 'react';
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

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const messageDate = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][messageDate.getDay()];
  }
  return messageDate.toLocaleDateString();
};

const useAuth = () => {
  const navigation = useNavigation();
  
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("Login");
        return null;
      }
      return token;
    } catch (error) {
      console.error("Auth error:", error);
      navigation.navigate("Login");
      return null;
    }
  };

  return { getToken };
};

const ConversationItem = memo(({ item, onPress, currentUserId }) => (
  <TouchableOpacity style={styles.conversationItem} onPress={onPress}>
    <Image
      source={{ uri: item.otherUserImage || 'https://via.placeholder.com/50' }}
      style={styles.userImage}
    />
    <View style={styles.conversationInfo}>
      <View style={styles.conversationHeader}>
        <Text style={styles.userName}>
          {`${item.otherUserFirstName} ${item.otherUserLastName}`}
        </Text>
        <Text style={styles.timeStamp}>
          {formatTime(item.lastMessageTime)}
        </Text>
      </View>
      <View style={styles.lastMessageContainer}>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage || 'Start a conversation'}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
));

const EmptyConversations = memo(() => (
  <View style={styles.emptyContainer}>
    <Ionicons name="chatbubble-outline" size={50} color="#999" />
    <Text style={styles.emptyText}>No conversations yet</Text>
  </View>
));

const ChatSelectionScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { markChatAsRead } = useNotifications();
  const { getToken } = useAuth();
  
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
  
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      setCurrentUserId(userId);
  
      const response = await axios.get(
        `${apiUrl}/api/chat/conversations/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      const sortedConversations = response.data
        .map(conv => ({
          ...conv,
          senderId: conv.senderId || conv.userId // Ensure backward compatibility
        }))
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
  
      setConversations(sortedConversations);
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        await AsyncStorage.removeItem("userToken");
        navigation.navigate("Login");
      }
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, navigation, getToken]);

  const handleChatPress = useCallback(async(conversation) => {
    if (conversation.unreadCount > 0) {
      // This will immediately update the unread count in the navbar
      await markChatAsRead(conversation.id, conversation.unreadCount);
      // Refetch conversations to ensure everything is in sync
      await fetchConversations();
    }
    const isCurrentUserSender = conversation.senderId === parseInt(currentUserId);
    const receiverId = isCurrentUserSender ? conversation.receiverId : conversation.senderId;
  
    navigation.navigate("ChatScreen", {
      chatId: conversation.id,
      receiverId: receiverId,
      senderId: conversation.senderId,
      otherUser: {
        id: receiverId,
        firstName: conversation.otherUserFirstName,
        lastName: conversation.otherUserLastName,
        image: conversation.otherUserImage || 'https://via.placeholder.com/50'
      }
    });
  }, [currentUserId, navigation, markChatAsRead, fetchConversations]);
  const renderConversation = useCallback(({ item }) => (
    <ConversationItem
      item={item}
      onPress={() => handleChatPress(item)}
      currentUserId={currentUserId}
    />
  ), [handleChatPress, currentUserId]);

  useEffect(() => {
    if (isFocused) {
      fetchConversations();
    }
  }, [isFocused, fetchConversations]);

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
            onRefresh={() => {
              setRefreshing(true);
              fetchConversations();
            }}
          />
        }
        ListEmptyComponent={EmptyConversations}
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

export default ChatSelectionScreen;