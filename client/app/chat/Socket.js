import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true,
  transportOptions: {
    polling: {
      extraHeaders: {
        'Access-Control-Allow-Origin': '*',
      }
    }
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  forceNew: true

});

socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

export default socket;