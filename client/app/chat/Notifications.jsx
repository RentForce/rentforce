import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSocket, addSocketListener, removeSocketListener } from './Socket';
import api from '../api/axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [socket, setSocket] = useState(null);

  const fetchUnreadCount = async (currentUserId) => {
    try {
      if (!currentUserId) {
        console.log('No userId available for fetching unread count');
        return;
      }
  
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No auth token available');
        return;
      }
  
      console.log('Fetching unread count for user:', currentUserId);
      
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/chat/unread/${currentUserId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }
      );
      
      if (!response.ok) {
        console.error('Server response:', await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched unread count:', data);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      if (error.response) {
        console.error('Response:', await error.response.text());
      }
    }
  };
  
  const markChatAsRead = async (chatId) => {
    try {
      if (!userId) return;
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No auth token available');
        return;
      }
  
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/chat/${chatId}/read/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Mark as read response:', data);
  
      if (data.readCount) {
        setUnreadCount(prev => Math.max(0, prev - data.readCount));
      }
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };
  

  useEffect(() => {
    const loadUserIdAndInitialize = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        console.log('Stored userId:', storedUserId);
        
        if (storedUserId) {
          const parsedUserId = parseInt(storedUserId);
          console.log('Parsed userId:', parsedUserId);
          setUserId(parsedUserId);
          
          // Add delay to ensure socket is initialized
          setTimeout(() => {
            fetchUnreadCount(parsedUserId);
          }, 1000);
        }
      } catch (error) {
        console.error('Error in loadUserIdAndInitialize:', error);
      }
    };

    loadUserIdAndInitialize();
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Handler for new messages
    const handleNewMessage = (data) => {
      console.log('New message received:', data);
      if (data.receiverId === userId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    // Handler for read messages
    const handleMessagesRead = (data) => {
      console.log('Messages read event received:', data);
      if (data && typeof data.count === 'number') {
        setUnreadCount(prev => Math.max(0, prev - data.count));
      }
    };

    // Add socket listeners
    addSocketListener('new message', handleNewMessage);
    addSocketListener('messages_read', handleMessagesRead);

    // Cleanup function
    return () => {
      removeSocketListener('new message', handleNewMessage);
      removeSocketListener('messages_read', handleMessagesRead);
    };
  }, [userId]);

  

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      markChatAsRead,
      fetchUnreadCount,
      userId
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};