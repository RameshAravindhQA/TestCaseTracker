import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from './logger';

export function setupWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Join user to their personal room
    socket.on('join-user', (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`User ${userId} joined personal room`);
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle new messages
    socket.on('send-message', (data) => {
      const { conversationId, message } = data;
      logger.info(`WebSocket: Broadcasting message to conversation ${conversationId}`);
      
      // Broadcast to all users in the conversation (including the sender)
      io.to(`conversation_${conversationId}`).emit('new-message', message);
      logger.info(`Message broadcasted to conversation ${conversationId}`);
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { conversationId, userId, userName } = data;
      socket.to(`conversation_${conversationId}`).emit('user-typing', { userId, userName });
    });

    socket.on('typing-stop', (data) => {
      const { conversationId, userId } = data;
      socket.to(`conversation_${conversationId}`).emit('user-stopped-typing', { userId });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}