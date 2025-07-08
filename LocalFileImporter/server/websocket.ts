import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { storage } from './storage';
import { logger } from './logger';

interface User {
  id: number;
  name: string;
  email: string;
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  message: string;
  type: 'text' | 'file' | 'system';
  timestamp: string;
}

interface TypingStatus {
  conversationId: string;
  userId: number;
  userName: string;
  isTyping: boolean;
}

export class EnhancedChatWebSocketServer {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, { userId: number; socketId: string; user: User }>();
  private userSockets = new Map<number, Set<string>>();
  private typingUsers = new Map<string, Set<number>>();

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : '*',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    logger.info('Enhanced Chat WebSocket server initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      socket.on('join_chat', async (data) => {
        try {
          const { userId, userName, userEmail } = data;
          
          if (!userId || !userName) {
            socket.emit('error', { message: 'User ID and name required' });
            return;
          }

          const user: User = {
            id: userId,
            name: userName,
            email: userEmail,
            isOnline: true
          };

          // Store user connection
          this.connectedUsers.set(socket.id, { userId, socketId: socket.id, user });
          
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
          }
          this.userSockets.get(userId)!.add(socket.id);

          // Broadcast user online status
          this.broadcastUserStatus(userId, true);
          
          socket.emit('connected', { message: 'Connected to chat server' });
          logger.info(`User ${userName} (${userId}) joined chat`);
        } catch (error) {
          logger.error('Error handling join_chat:', error);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      socket.on('send_message', async (data) => {
        try {
          const userConnection = this.connectedUsers.get(socket.id);
          if (!userConnection) {
            socket.emit('message_error', { message: 'User not authenticated' });
            return;
          }

          const { conversationId, message, type = 'text' } = data;
          
          if (!conversationId || !message) {
            socket.emit('message_error', { message: 'Conversation ID and message required' });
            return;
          }

          // Create message in storage
          const newMessage = await storage.createMessage({
            conversationId,
            senderId: userConnection.userId,
            senderName: userConnection.user.name,
            message,
            type,
            timestamp: new Date().toISOString()
          });

          const broadcastMessage: ChatMessage = {
            id: newMessage.id,
            conversationId: newMessage.conversationId,
            senderId: newMessage.senderId,
            senderName: newMessage.senderName,
            message: newMessage.message,
            type: newMessage.type,
            timestamp: newMessage.timestamp
          };

          // Broadcast to all users in conversation
          this.broadcastToConversation(conversationId, 'new_message', broadcastMessage);
          
          logger.info(`Message sent from ${userConnection.user.name} to conversation ${conversationId}`);
        } catch (error) {
          logger.error('Error handling send_message:', error);
          socket.emit('message_error', { message: 'Failed to send message' });
        }
      });

      socket.on('start_typing', (data) => {
        try {
          const userConnection = this.connectedUsers.get(socket.id);
          if (!userConnection) return;

          const { conversationId } = data;
          this.startTyping(conversationId, userConnection.userId, userConnection.user.name);
        } catch (error) {
          logger.error('Error handling start_typing:', error);
        }
      });

      socket.on('stop_typing', (data) => {
        try {
          const userConnection = this.connectedUsers.get(socket.id);
          if (!userConnection) return;

          const { conversationId } = data;
          this.stopTyping(conversationId, userConnection.userId);
        } catch (error) {
          logger.error('Error handling stop_typing:', error);
        }
      });

      socket.on('disconnect', () => {
        try {
          const userConnection = this.connectedUsers.get(socket.id);
          if (userConnection) {
            const { userId } = userConnection;
            
            // Remove socket from user connections
            if (this.userSockets.has(userId)) {
              this.userSockets.get(userId)!.delete(socket.id);
              
              // If no more sockets for user, mark offline
              if (this.userSockets.get(userId)!.size === 0) {
                this.userSockets.delete(userId);
                this.broadcastUserStatus(userId, false);
              }
            }
            
            this.connectedUsers.delete(socket.id);
            logger.info(`User ${userConnection.user.name} disconnected`);
          }
        } catch (error) {
          logger.error('Error handling disconnect:', error);
        }
      });
    });
  }

  private startTyping(conversationId: string, userId: number, userName: string) {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    
    this.typingUsers.get(conversationId)!.add(userId);

    const typingStatus: TypingStatus = {
      conversationId,
      userId,
      userName,
      isTyping: true
    };

    this.broadcastToConversation(conversationId, 'user_typing', typingStatus);
  }

  private stopTyping(conversationId: string, userId: number) {
    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId)!.delete(userId);
    }

    const typingStatus: TypingStatus = {
      conversationId,
      userId,
      userName: '',
      isTyping: false
    };

    this.broadcastToConversation(conversationId, 'user_typing', typingStatus);
  }

  private broadcastUserStatus(userId: number, isOnline: boolean) {
    this.io.emit('user_status', { userId, isOnline });
  }

  public broadcastToUser(userId: number, event: string, data: any) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public async broadcastToConversation(conversationId: string, event: string, data: any) {
    try {
      // Get conversation participants from storage
      const conversation = await storage.getConversation(conversationId);
      if (conversation) {
        // Broadcast to each participant
        conversation.participants.forEach(userId => {
          this.broadcastToUser(userId, event, data);
        });
      } else {
        // Fallback to broadcast to all if conversation not found
        this.io.emit(event, data);
      }
    } catch (error) {
      logger.error('Error broadcasting to conversation:', error);
      // Fallback to broadcast to all
      this.io.emit(event, data);
    }
  }

  public getOnlineUsers(): number[] {
    return Array.from(this.userSockets.keys());
  }

  public isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }
}