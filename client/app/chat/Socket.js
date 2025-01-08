// socket.js
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;
let isConnected = false;
let activeListeners = new Set();
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 3;
const RECONNECTION_DELAY = 2000;

// Store callbacks for events
const eventCallbacks = {
  incomingCall: new Set(),
  callAccepted: new Set(),
  callRejected: new Set(),
  callEnded: new Set()
};

// Debug function to log all active listeners
const logActiveListeners = () => {
  console.log('Active socket listeners:', Array.from(activeListeners));
  Object.entries(eventCallbacks).forEach(([event, callbacks]) => {
    console.log(`${event} callbacks:`, callbacks.size);
  });
};

const initializeSocket = async (serverUrl, userId, attempt = 1) => {
  try {
    console.log(`Attempting to initialize socket (attempt ${attempt}/${MAX_RECONNECTION_ATTEMPTS})`);
    
    if (!userId) {
      console.log('No userId provided for socket connection');
      return null;
    }

    // Close existing socket if it exists
    if (socket) {
      console.log('Closing existing socket connection');
      socket.close();
      socket = null;
      isConnected = false;
      activeListeners.clear();
      // Clear all callbacks
      Object.values(eventCallbacks).forEach(callbacks => callbacks.clear());
    }

    console.log('Initializing socket with userId:', userId);
    console.log('Server URL:', serverUrl);
    
    // Get the token
    const token = await AsyncStorage.getItem('userToken');
    console.log('Token retrieved:', token ? 'Yes' : 'No');

    // Make sure serverUrl is correct and includes the protocol
    let fullUrl = serverUrl;
    if (!serverUrl.startsWith('http')) {
      fullUrl = `http://${serverUrl}`;
    }
    console.log('Connecting to socket server:', fullUrl);

    return new Promise((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        console.log('Socket connection timeout');
        if (socket) {
          socket.close();
        }
        if (attempt < MAX_RECONNECTION_ATTEMPTS) {
          console.log(`Retrying connection in ${RECONNECTION_DELAY}ms...`);
          setTimeout(() => {
            initializeSocket(serverUrl, userId, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, RECONNECTION_DELAY);
        } else {
          reject(new Error('Socket connection timeout'));
        }
      }, 5000);

      socket = io(fullUrl, {
        query: { 
          userId: userId.toString(),
          token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000,
        forceNew: true
      });

      socket.on('connect', () => {
        console.log('Socket connected successfully for user:', userId);
        clearTimeout(connectionTimeout);
        isConnected = true;
        connectionAttempts = 0;
        socket.emit('join', { userId: userId.toString() });
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        isConnected = false;
        if (attempt < MAX_RECONNECTION_ATTEMPTS) {
          console.log(`Retrying connection in ${RECONNECTION_DELAY}ms...`);
          setTimeout(() => {
            initializeSocket(serverUrl, userId, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, RECONNECTION_DELAY);
        } else {
          reject(error);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        isConnected = false;
        if (reason === 'io server disconnect' || reason === 'transport close') {
          if (connectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
            connectionAttempts++;
            console.log(`Attempting to reconnect (${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})...`);
            socket.connect();
          }
        }
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Call-related events
      socket.on('incomingCall', (data) => {
        console.log('Received incoming call event:', data);
        eventCallbacks.incomingCall.forEach(callback => callback(data));
      });

      socket.on('callAccepted', (data) => {
        console.log('Call accepted:', data);
        eventCallbacks.callAccepted.forEach(callback => callback(data));
      });

      socket.on('callRejected', (data) => {
        console.log('Call rejected:', data);
        eventCallbacks.callRejected.forEach(callback => callback(data));
      });

      socket.on('callEnded', (data) => {
        console.log('Call ended:', data);
        eventCallbacks.callEnded.forEach(callback => callback(data));
      });
    });
  } catch (error) {
    console.error('Error initializing socket:', error);
    if (attempt < MAX_RECONNECTION_ATTEMPTS) {
      console.log(`Retrying connection in ${RECONNECTION_DELAY}ms...`);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(initializeSocket(serverUrl, userId, attempt + 1));
        }, RECONNECTION_DELAY);
      });
    }
    throw error;
  }
};

export const initSocket = async (serverUrl, userId) => {
  try {
    const newSocket = await initializeSocket(serverUrl, userId);
    console.log('Socket successfully initialized');
    return newSocket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    return null;
  }
};

export const getSocket = () => {
  if (!socket || !isConnected) {
    console.warn('Socket not initialized or not connected when getSocket called');
    return null;
  }
  return socket;
};

export const addSocketListener = (event, callback) => {
  if (!socket) {
    console.warn(`Failed to add listener for ${event}: Socket not initialized`);
    return;
  }

  if (!isConnected) {
    console.warn(`Failed to add listener for ${event}: Socket not connected`);
    return;
  }

  console.log(`Adding listener for event: ${event}`);
  
  // Store callback in our event system
  if (eventCallbacks[event]) {
    eventCallbacks[event].add(callback);
  }
  
  activeListeners.add(event);
  logActiveListeners();
};

export const removeSocketListener = (event, callback) => {
  if (socket) {
    console.log(`Removing listener for event: ${event}`);
    if (eventCallbacks[event]) {
      eventCallbacks[event].delete(callback);
    }
    activeListeners.delete(event);
    logActiveListeners();
  }
};

export const initiateCall = (data) => {
  if (!socket || !isConnected) {
    console.warn('Failed to initiate call: Socket not connected');
    return;
  }

  if (!data.callerId || !data.receiverId) {
    console.error('Missing required call data:', data);
    return;
  }

  const callData = {
    ...data,
    timestamp: Date.now(),
    type: 'AUDIO_CALL'
  };

  console.log('Initiating call with data:', callData);
  socket.emit('initiateCall', callData);

  // Also try alternative event names
  socket.emit('call:initiate', callData);
  socket.emit('startCall', callData);
};

export const acceptCall = (data) => {
  if (!socket || !isConnected) {
    console.warn('Failed to accept call: Socket not connected');
    return;
  }

  const callData = {
    ...data,
    timestamp: Date.now(),
    type: 'AUDIO_CALL'
  };

  console.log('Accepting call with data:', callData);
  socket.emit('acceptCall', callData);
  socket.emit('call:accept', callData);
};

export const rejectCall = (data) => {
  if (!socket || !isConnected) {
    console.warn('Failed to reject call: Socket not connected');
    return;
  }

  const callData = {
    ...data,
    timestamp: Date.now(),
    type: 'AUDIO_CALL'
  };

  console.log('Rejecting call with data:', callData);
  socket.emit('rejectCall', callData);
  socket.emit('call:reject', callData);
};

export const endCall = (data) => {
  if (!socket || !isConnected) {
    console.warn('Failed to end call: Socket not connected');
    return;
  }

  const callData = {
    ...data,
    timestamp: Date.now(),
    type: 'AUDIO_CALL'
  };

  console.log('Ending call with data:', callData);
  socket.emit('endCall', callData);
  socket.emit('call:end', callData);
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket');
    socket.disconnect();
    socket = null;
    isConnected = false;
    activeListeners.clear();
    // Clear all callbacks
    Object.values(eventCallbacks).forEach(callbacks => callbacks.clear());
  }
};