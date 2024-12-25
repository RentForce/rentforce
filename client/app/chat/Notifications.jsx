import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSocket, addSocketListener, removeSocketListener } from './Socket';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);

  const fetchUnreadCount = async (currentUserId) => {
    try {
      if (!currentUserId) {
        console.log('No userId available for fetching unread count');
        return;
      }
  
      console.log('Fetching unread count for user:', currentUserId);
      console.log('API URL:', `${process.env.EXPO_PUBLIC_API_URL}/api/chat/unread/${currentUserId}`);
  
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/chat/unread/${currentUserId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
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
      // Log more details about the error
      if (error.response) {
        console.error('Response:', await error.response.text());
      }
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

    const handleNewMessage = (data) => {
      console.log('New message received:', data);
      if (data.receiverId === userId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    addSocketListener('new message', handleNewMessage);

    return () => {
      removeSocketListener('new message', handleNewMessage);
    };
  }, [userId]);

  const markChatAsRead = async (chatId) => {
    if (!userId || !chatId) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/chat/messages/read/${chatId}/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh unread count after marking as read
      await fetchUnreadCount(userId);
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

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