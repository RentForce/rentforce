// socket.js
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;

export const initSocket = async (serverUrl, userId) => {
  try {
    if (!userId) {
      console.log('No userId provided for socket connection');
      return null;
    }

    // Close existing socket if it exists
    if (socket) {
      socket.close();
      socket = null;
    }

    console.log('Initializing socket with userId:', userId);
    
    // Get the token
    const token = await AsyncStorage.getItem('token');

    // Make sure serverUrl is correct
    const fullUrl = serverUrl.startsWith('http') ? serverUrl : `http://${serverUrl}`;
    console.log('Connecting to socket server:', fullUrl);

    socket = io(fullUrl, {
      query: { 
        userId: userId.toString(),
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully for user:', userId);
      socket.emit('join', { userId: userId.toString() });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Reconnect if server disconnected
        socket.connect();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    return null;
  }
};

export const getSocket = () => socket;

export const addSocketListener = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const removeSocketListener = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

export const emitMessage = (message) => {
  if (socket) {
    console.log('Emitting message:', message);
    socket.emit('new message', message);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};