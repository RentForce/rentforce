// import io from 'socket.io-client';

// const socket = io('http://localhost:5000', {
//   withCredentials: true,
//   transportOptions: {
//     polling: {
//       extraHeaders: {
//         'Access-Control-Allow-Origin': '*',
//       }
//     }
//   },
//   transports: ['websocket', 'polling'],
//   reconnection: true,
//   reconnectionAttempts: 10,  // Increased attempts
//   reconnectionDelay: 1000,
//   reconnectionDelayMax: 5000,  // Maximum delay between reconnections
//   randomizationFactor: 0.5,    // Add some randomness to reconnection timing
//   timeout: 20000,              // Connection timeout
//   forceNew: true
// });

// socket.on('connect', () => {
//   console.log('Connected to socket server');
// });

// socket.on('connect_error', (error) => {
//   console.error('Connection error:', error);
// });

// export default socket;

import { io } from "socket.io-client";

let socket = null;

export const initSocket = (serverUrl) => {
  if (!socket) {
    socket = io(serverUrl, {
      transports: ["websocket"],
      autoConnect: true,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }
  return socket;
};

export const getSocket = () => socket;
