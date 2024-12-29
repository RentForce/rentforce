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
    });
  };
  
  module.exports = socketHandler;