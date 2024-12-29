import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSocket, disconnectSocket } from './Socket';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [readChats, setReadChats] = useState(new Set());

  // Initialize socket and user ID
  useEffect(() => {
    const loadUserIdAndInitialize = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = decodedToken.id;
        setUserId(currentUserId);
        
        // Initialize socket connection with server URL and user ID
        const serverUrl = process.env.EXPO_PUBLIC_API_URL;
        const newSocket = await initSocket(serverUrl, currentUserId);
        
        if (newSocket) {
          console.log('Socket initialized successfully');
          setSocket(newSocket);
          
          // Set up socket event listeners
          newSocket.on('new_message', (message) => {
            if (message.userId !== currentUserId) {
              setUnreadCount(prev => prev + 1);
            }
          });

          newSocket.on('messages_read', (data) => {
            if (data.userId === currentUserId) {
              fetchUnreadCount(currentUserId);
            }
          });
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

  const markChatAsRead = useCallback(async (chatId) => {
    try {
      if (!userId || !chatId) {
        console.log('Missing required data:', { userId, chatId });
        return false;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No auth token available');
        return false;
      }

      console.log('Marking chat as read:', chatId);

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

      if (!response.ok) {
        if (response.status === 403) {
          // Token might be expired, trigger re-auth
          return false;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setReadChats(prev => new Set([...prev, chatId]));
        await fetchUnreadCount(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking chat as read:', error);
      return false;
    }
  }, [userId, fetchUnreadCount]);

  const fetchUnreadCount = useCallback(async (currentUserId) => {
    try {
      if (!currentUserId) {
        console.log('No userId available for fetching unread count');
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/chat/unread/${currentUserId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authToken
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUnreadCount(Math.max(0, parseInt(data.count) || 0));
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUnreadCount(userId);
    }
  }, [userId, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, markChatAsRead, userId }}>
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