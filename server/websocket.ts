import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from './logger';

import { memStorage as storage } from './storage';

export function setupWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io"
  });

  const userSockets = new Map<number, any>();

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);
    let currentUserId: number | null = null;

    // Handle user authentication
    socket.on('authenticate', async (data) => {
      const { userId, userName } = data;
      currentUserId = userId;
      userSockets.set(userId, socket);

      logger.info(`User ${userId} (${userName}) authenticated`);

      // Get user's conversations
      const conversations = await storage.getUserConversations(userId);
      socket.emit('conversations_list', conversations);

      // Join user to their conversations
      conversations.forEach(conv => {
        socket.join(`conversation_${conv.id}`);
      });

      socket.emit('authenticated', { user: { id: userId, name: userName }, onlineUsers: [] });
    });

    // Join conversation room
    socket.on('join_conversation', async (data) => {
      const { conversationId } = data;
      socket.join(`conversation_${conversationId}`);
      logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);

      // Send conversation messages
      const messages = await storage.getChatMessages(conversationId);
      socket.emit('conversation_messages', { conversationId, messages });
    });

    // Handle new messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, message, type = 'text', replyTo } = data;

        if (!currentUserId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Get sender info
        const sender = await storage.getUser(currentUserId);
        if (!sender) {
          socket.emit('error', { message: 'Sender not found' });
          return;
        }

        // Create message
        const newMessage = await storage.createChatMessage({
          conversationId,
          senderId: currentUserId,
          senderName: `${sender.firstName} ${sender.lastName || ''}`.trim(),
          message,
          type,
          replyTo,
          timestamp: new Date().toISOString()
        });

        // Broadcast to all users in the conversation
        io.to(`conversation_${conversationId}`).emit('new_message', newMessage);
        logger.info(`Message sent to conversation ${conversationId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      if (currentUserId) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', { 
          conversationId, 
          userId: currentUserId, 
          userName: `User ${currentUserId}` 
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      if (currentUserId) {
        socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', { 
          conversationId, 
          userId: currentUserId 
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
      if (currentUserId) {
        userSockets.delete(currentUserId);
      }
    });
  });

  return io;
}