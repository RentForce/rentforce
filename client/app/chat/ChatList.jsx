import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatListScreen = () => {
  const navigation = useNavigation();
  const [chats, setChats] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchCurrentUserAndChats = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('token');
        
        if (storedUserId && token) {
          setCurrentUserId(storedUserId);
          
          const response = await axios.get(`http://192.168.103.15:5000/api/chats/user/${storedUserId}`, {
            headers: { 
              'Authorization': `Bearer ${token}` 
            }
          });
          setChats(response.data);
        }
      } catch (error) {
        console.error('Error fetching user or chats', error);
        Alert.alert('Error', 'Could not fetch chats');
      }
    };

    fetchCurrentUserAndChats();
  }, []);

  const createNewChat = async (otherUserId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!currentUserId || !otherUserId) {
        Alert.alert('Error', 'Missing user details');
        return;
      }

      const response = await axios.post('http://192.168.103.4:5000/api/chats/create', 
        {
          userId: currentUserId,
          receiverId: otherUserId
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        }
      );

      const newChat = response.data;
      
      setChats(prevChats => {
        const existingChatIndex = prevChats.findIndex(
          chat => chat.id === newChat.id
        );
        
        if (existingChatIndex !== -1) {
          return prevChats;
        }
        
        return [...prevChats, newChat];
      });

      navigation.navigate('chat/Chat', {
        chatId: newChat.id,
        userId: currentUserId,
        receiverId: otherUserId
      });
    } catch (error) {
      console.error('Error creating chat', error);
      Alert.alert('Error', 'Could not create chat');
    }
  };

  const navigateToNewChat = () => {

    navigation.navigate('chat/ChatSelectionScreen', { 
      onSelectUser: createNewChat 
    });
  };

  const navigateToChat = (chat) => {
    const otherUserId = chat.userId === currentUserId
      ? chat.receiverId
      : chat.userId;

    navigation.navigate('Chat', {
      chatId: chat.id,
      userId: currentUserId,
      receiverId: otherUserId
    });
  };

  const renderChatItem = ({ item }) => {
    const otherUser = item.userId === currentUserId
      ? item.receiver
      : item.user;

    const lastMessage = item.messages && item.messages.length > 0
      ? item.messages[0]
      : null;

    return (
      <TouchableOpacity 
        onPress={() => navigateToChat(item)}
        style={styles.chatItem}
      >
        <View>
          <Text style={styles.userName}>
            {otherUser?.firstName} {otherUser?.lastName}
          </Text>
          {lastMessage && (
            <Text style={styles.lastMessage}>
              {lastMessage.content}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text>No chats found. Start a new chat!</Text>
            <TouchableOpacity 
              onPress={navigateToNewChat}
              style={styles.newChatButton}
            >
              <Text style={styles.newChatButtonText}>New Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity 
        onPress={navigateToNewChat}
        style={styles.floatingButton}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  lastMessage: {
    color: '#888',
    marginTop: 5
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  newChatButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5
  },
  newChatButtonText: {
    color: 'white',
    textAlign: 'center'
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  }
});

export default ChatListScreen;