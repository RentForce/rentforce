// socketHandler.js
const socketHandler = (io) => {
    const connectedUsers = new Map();
  
    io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId;
      const token = socket.handshake.query.token;
  
      console.log('Socket connection attempt from user:', userId);
  
      if (!userId) {
        console.log('No userId provided, disconnecting socket');
        socket.disconnect();
        return;
      }
  
      // Store socket connection for user
      connectedUsers.set(userId, socket.id);
      console.log('Connected users:', Array.from(connectedUsers.entries()));
  
      // Join user's room
      const userRoom = `user_${userId}`;
      socket.join(userRoom);
      console.log(`User ${userId} joined room:`, userRoom);
  
      // Handle joining specific room
      socket.on('join', (data) => {
        if (data.userId) {
          const room = `user_${data.userId}`;
          socket.join(room);
          console.log(`User ${data.userId} joined room:`, room);
        }
      });

      // Handle call initiation
      socket.on('initiateCall', (data) => {
        try {
          console.log('Call initiation request:', data);
          const { receiverId, callerId, callerName } = data;
          
          if (!receiverId || !callerId) {
            console.error('Missing required call data:', data);
            return;
          }

          const receiverSocketId = connectedUsers.get(receiverId.toString());
          const receiverRoom = `user_${receiverId}`;

          if (receiverSocketId) {
            console.log(`Emitting incoming call to receiver ${receiverId}`);
            io.to(receiverSocketId).emit('incomingCall', {
              ...data,
              timestamp: new Date()
            });
            io.to(receiverRoom).emit('incomingCall', {
              ...data,
              timestamp: new Date()
            });
          } else {
            console.log(`Receiver ${receiverId} not connected`);
            socket.emit('callRejected', {
              reason: 'User is offline',
              receiverId,
              callerId
            });
          }
        } catch (error) {
          console.error('Error handling call initiation:', error);
        }
      });

      // Handle call acceptance
      socket.on('acceptCall', (data) => {
        try {
          console.log('Call accepted:', data);
          const { callerId } = data;
          const callerSocketId = connectedUsers.get(callerId.toString());
          const callerRoom = `user_${callerId}`;

          if (callerSocketId) {
            io.to(callerSocketId).emit('callAccepted', data);
            io.to(callerRoom).emit('callAccepted', data);
          }
        } catch (error) {
          console.error('Error handling call acceptance:', error);
        }
      });

      // Handle call rejection
      socket.on('rejectCall', (data) => {
        try {
          console.log('Call rejected:', data);
          const { callerId } = data;
          const callerSocketId = connectedUsers.get(callerId.toString());
          const callerRoom = `user_${callerId}`;

          if (callerSocketId) {
            io.to(callerSocketId).emit('callRejected', data);
            io.to(callerRoom).emit('callRejected', data);
          }
        } catch (error) {
          console.error('Error handling call rejection:', error);
        }
      });

      // Handle call ending
      socket.on('endCall', (data) => {
        try {
          console.log('Call ended:', data);
          const { receiverId, callerId } = data;
          
          // Notify both caller and receiver
          [receiverId, callerId].forEach(userId => {
            const userSocketId = connectedUsers.get(userId.toString());
            const userRoom = `user_${userId}`;
            
            if (userSocketId) {
              io.to(userSocketId).emit('callEnded', data);
              io.to(userRoom).emit('callEnded', data);
            }
          });
        } catch (error) {
          console.error('Error handling call end:', error);
        }
      });
  
      // Handle new messages
      socket.on('new message', (message) => {
        try {
          console.log('New message received:', message);
          if (message.chat?.receiverId) {
            const receiverRoom = `user_${message.chat.receiverId}`;
            
            // Emit to both the room and the specific socket
            io.to(receiverRoom).emit('new message', {
              ...message,
              timestamp: new Date(),
            });
            
            const receiverSocketId = connectedUsers.get(message.chat.receiverId.toString());
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('new message', {
                ...message,
                timestamp: new Date(),
              });
            }
          }
        } catch (error) {
          console.error('Error handling new message:', error);
        }
      });
  
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);
        connectedUsers.delete(userId);
      });

      // Debug: Log all events
      socket.onAny((eventName, ...args) => {
        console.log(`[DEBUG] Event '${eventName}' received with args:`, args);
      });
    });
  };
  
  module.exports = socketHandler;