import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSocket, disconnectSocket } from './Socket';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket and user ID
  useEffect(() => {
    const loadUserIdAndInitialize = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = decodedToken.id;
        setUserId(currentUserId);
        
        const serverUrl = process.env.EXPO_PUBLIC_API_URL;
        const newSocket = await initSocket(serverUrl, currentUserId);
        
        if (newSocket) {
          setSocket(newSocket);
          
          // Only increment for messages where we are the receiver
          newSocket.on('new_message', (message) => {
            if (message.receiverId === parseInt(currentUserId)) {
              setUnreadCount(prev => prev + 1);
            }
          });

          // Update unread count when messages are read
          newSocket.on('messages_read', (data) => {
            if (data.userId === currentUserId && typeof data.unreadCount === 'number') {
              setUnreadCount(data.unreadCount);
            }
          });

          // Get initial unread count
          fetchUnreadCount();
        }

        return () => {
          if (newSocket) {
            disconnectSocket();
          }
        };
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    loadUserIdAndInitialize();
  }, []);

  const markChatAsRead = useCallback(async (chatId, unreadMessagesCount = 1) => {
    try {
      if (!userId || !chatId) return false;

      const token = await AsyncStorage.getItem('userToken');
      if (!token) return false;

      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/chat/${chatId}/read/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authToken
          }
        }
      );

      if (!response.ok) return false;

      const data = await response.json();
      if (!data.success) return false;

      // Update unread count from server response
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }

      return true;
    } catch (error) {
      console.error('Error marking chat as read:', error);
      return false;
    }
  }, [userId]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/chat/unread/${userId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authToken
          }
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success && typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [userId]);

  // Fetch unread count when userId changes
  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
    }
  }, [userId, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ 
      unreadCount,
      markChatAsRead,
      userId,
      fetchUnreadCount
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

export default NotificationProvider;