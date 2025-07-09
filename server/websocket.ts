
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from './logger';
import { storage } from './storage';

interface ConnectedUser {
  id: number;
  name: string;
  socketId: string;
  joinedAt: Date;
  avatar?: string;
}

interface ConversationRoom {
  id: string;
  participants: number[];
  type: 'direct' | 'group';
  createdAt: Date;
}

export function setupWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: '/socket.io'
  });

  // Track connected users and conversations
  const connectedUsers = new Map<string, ConnectedUser>();
  const userSocketMap = new Map<number, string>(); // userId -> socketId
  const conversationRooms = new Map<string, ConversationRoom>();

  io.on('connection', (socket) => {
    logger.info(`New socket connection: ${socket.id}`);

    // Handle user joining
    socket.on('join-user', async (userId: number) => {
      try {
        const user = await storage.getUser(userId);
        if (!user) {
          logger.error(`User not found: ${userId}`);
          return;
        }

        const connectedUser: ConnectedUser = {
          id: userId,
          name: `${user.firstName} ${user.lastName}`.trim(),
          socketId: socket.id,
          joinedAt: new Date(),
          avatar: user.profilePicture || undefined
        };

        // Remove user from previous socket if exists
        const previousSocketId = userSocketMap.get(userId);
        if (previousSocketId) {
          connectedUsers.delete(previousSocketId);
        }

        // Add user to current socket
        connectedUsers.set(socket.id, connectedUser);
        userSocketMap.set(userId, socket.id);
        
        socket.join(`user_${userId}`);
        logger.info(`User ${userId} (${connectedUser.name}) joined with socket ${socket.id}`);

        // Notify others that user is online
        socket.broadcast.emit('user-online', {
          id: userId,
          name: connectedUser.name,
          avatar: connectedUser.avatar,
          lastSeen: new Date()
        });

        // Send current online users to the new user
        const onlineUsers = Array.from(connectedUsers.values()).map(u => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          lastSeen: u.joinedAt
        }));
        socket.emit('users-online', onlineUsers);

        // Load user's conversations
        const conversations = await storage.getUserConversations(userId);
        socket.emit('conversations-loaded', conversations);

      } catch (error) {
        logger.error(`Error in join-user: ${error}`);
        socket.emit('error', { message: 'Failed to join user' });
      }
    });

    // Handle creating direct conversations
    socket.on('create-direct-conversation', async (data: { userId: number; targetUserId: number; targetUserName: string }) => {
      try {
        const { userId, targetUserId, targetUserName } = data;
        
        // Check if conversation already exists
        const existingConversation = await storage.findDirectConversation(userId, targetUserId);
        
        if (existingConversation) {
          socket.emit('conversation-exists', existingConversation);
          return;
        }

        // Create new direct conversation
        const conversationId = `direct_${Math.min(userId, targetUserId)}_${Math.max(userId, targetUserId)}`;
        const currentUser = await storage.getUser(userId);
        const targetUser = await storage.getUser(targetUserId);

        if (!currentUser || !targetUser) {
          socket.emit('error', { message: 'Users not found' });
          return;
        }

        const conversation = {
          id: conversationId,
          type: 'direct' as const,
          participants: [userId, targetUserId],
          name: `${currentUser.firstName} ${currentUser.lastName} & ${targetUser.firstName} ${targetUser.lastName}`,
          createdAt: new Date().toISOString(),
          lastMessage: null,
          unreadCount: 0,
          isActive: true
        };

        // Store conversation in database
        await storage.createConversation(conversation);

        // Add to memory
        conversationRooms.set(conversationId, {
          id: conversationId,
          participants: [userId, targetUserId],
          type: 'direct',
          createdAt: new Date()
        });

        // Join both users to the conversation room
        socket.join(conversationId);
        const targetSocketId = userSocketMap.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).socketsJoin(conversationId);
        }

        // Notify both users about the new conversation
        io.to(conversationId).emit('conversation-created', conversation);
        
        logger.info(`Created direct conversation: ${conversationId} between users ${userId} and ${targetUserId}`);

      } catch (error) {
        logger.error(`Error creating direct conversation: ${error}`);
        socket.emit('error', { message: 'Failed to create conversation' });
      }
    });

    // Handle joining conversation rooms
    socket.on('join-conversation', async (conversationId: string) => {
      try {
        socket.join(conversationId);
        logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);

        // Load conversation messages
        const messages = await storage.getConversationMessages(conversationId, 50);
        socket.emit('conversation-messages', { conversationId, messages });

        // Mark messages as read for this user
        const user = connectedUsers.get(socket.id);
        if (user) {
          await storage.markConversationAsRead(conversationId, user.id);
        }

      } catch (error) {
        logger.error(`Error joining conversation: ${error}`);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(conversationId);
      logger.info(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send-message', async (messageData: any) => {
      try {
        const { conversationId, message, type = 'text', attachments = [] } = messageData;
        const user = connectedUsers.get(socket.id);
        
        if (!user) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Create message object
        const chatMessage = {
          id: Date.now(),
          conversationId,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          message,
          type,
          attachments,
          timestamp: new Date(),
          status: 'sent'
        };

        // Store message in database
        await storage.createChatMessage(chatMessage);

        // Update conversation last message
        await storage.updateConversationLastMessage(conversationId, chatMessage);

        // Broadcast to all users in the conversation
        io.to(conversationId).emit('new-message', chatMessage);
        
        // Send delivery confirmation to sender
        socket.emit('message-delivered', { 
          messageId: chatMessage.id, 
          conversationId 
        });

        logger.info(`Message sent in conversation ${conversationId} by user ${user.id}`);

      } catch (error) {
        logger.error(`Error sending message: ${error}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data: { conversationId: string; userId: number; userName: string }) => {
      const { conversationId, userId, userName } = data;
      socket.to(conversationId).emit('user-typing', { conversationId, userId, userName });
      logger.debug(`User ${userId} started typing in conversation ${conversationId}`);
    });

    socket.on('typing-stop', (data: { conversationId: string; userId: number; userName: string }) => {
      const { conversationId, userId, userName } = data;
      socket.to(conversationId).emit('user-stopped-typing', { conversationId, userId, userName });
      logger.debug(`User ${userId} stopped typing in conversation ${conversationId}`);
    });

    // Handle marking messages as read
    socket.on('mark-message-read', async (data: { messageId: number; conversationId: string; userId: number }) => {
      try {
        const { messageId, conversationId, userId } = data;
        
        await storage.markMessageAsRead(messageId, userId);
        
        // Notify other participants that message was read
        socket.to(conversationId).emit('message-read', { 
          messageId, 
          conversationId, 
          readBy: userId 
        });

      } catch (error) {
        logger.error(`Error marking message as read: ${error}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      const user = connectedUsers.get(socket.id);
      
      if (user) {
        // Remove user from connected users
        connectedUsers.delete(socket.id);
        userSocketMap.delete(user.id);
        
        // Notify others that user went offline
        socket.broadcast.emit('user-offline', {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          lastSeen: new Date()
        });

        logger.info(`User ${user.id} (${user.name}) disconnected: ${reason}`);
      } else {
        logger.info(`Socket ${socket.id} disconnected: ${reason}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}: ${error}`);
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const now = new Date();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [socketId, user] of connectedUsers.entries()) {
      if (now.getTime() - user.joinedAt.getTime() > staleThreshold) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          connectedUsers.delete(socketId);
          userSocketMap.delete(user.id);
          logger.info(`Cleaned up stale connection for user ${user.id}`);
        }
      }
    }
  }, 5 * 60 * 1000); // Run cleanup every 5 minutes

  logger.info('✅ WebSocket server initialized with comprehensive one-on-one messaging support');
  return io;
}
