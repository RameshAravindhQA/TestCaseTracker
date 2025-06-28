import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { storage } from './storage';
import { logger } from './logger';

interface ConnectedUser {
  ws: WebSocket;
  userId: number;
  userName: string;
  lastSeen: Date;
  isTyping: boolean;
  typingInConversation?: number;
}

interface TypingIndicator {
  userId: number;
  userName: string;
  conversationId: number;
  timestamp: Date;
}

export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private connectedUsers = new Map<number, ConnectedUser>();
  private conversations = new Map<number, Set<number>>(); // conversationId -> Set<userId>
  private typingIndicators = new Map<number, Map<number, TypingIndicator>>(); // conversationId -> userId -> TypingIndicator

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/chat' // Use specific path to avoid conflicts with Vite's WebSocket
    });
    this.setupWebSocket();
    this.startCleanupInterval();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      logger.info('New WebSocket connection established');

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          logger.error('Error processing WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });

      // Send initial connection response
      this.send(ws, {
        type: 'connection_established',
        timestamp: new Date().toISOString()
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    const { type, data } = message;

    switch (type) {
      case 'authenticate':
        await this.handleAuthentication(ws, data);
        break;
      case 'join_conversation':
        await this.handleJoinConversation(ws, data);
        break;
      case 'leave_conversation':
        await this.handleLeaveConversation(ws, data);
        break;
      case 'send_message':
        await this.handleSendMessage(ws, data);
        break;
      case 'typing_start':
        await this.handleTypingStart(ws, data);
        break;
      case 'typing_stop':
        await this.handleTypingStop(ws, data);
        break;
      case 'message_read':
        await this.handleMessageRead(ws, data);
        break;
      case 'get_presence':
        await this.handleGetPresence(ws, data);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  private async handleAuthentication(ws: WebSocket, data: any) {
    const { userId, userName } = data;

    if (!userId || !userName) {
      this.sendError(ws, 'Invalid authentication data');
      return;
    }

    // Update user connection
    const existingUser = this.connectedUsers.get(userId);
    if (existingUser) {
      existingUser.ws.close();
    }

    this.connectedUsers.set(userId, {
      ws,
      userId,
      userName,
      lastSeen: new Date(),
      isTyping: false
    });

    // Notify about user presence
    this.broadcastPresenceUpdate(userId, true);

    this.send(ws, {
      type: 'authenticated',
      userId,
      onlineUsers: Array.from(this.connectedUsers.values()).map(user => ({
        userId: user.userId,
        userName: user.userName,
        lastSeen: user.lastSeen
      }))
    });

    logger.info(`User ${userName} (${userId}) authenticated via WebSocket`);
  }

  private async handleJoinConversation(ws: WebSocket, data: any) {
    const { conversationId } = data;
    const user = this.getUserByWebSocket(ws);

    if (!user || !conversationId) {
      this.sendError(ws, 'Invalid join conversation data');
      return;
    }

    // Add user to conversation
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, new Set());
    }
    this.conversations.get(conversationId)!.add(user.userId);

    // Notify other users in conversation
    this.broadcastToConversation(conversationId, {
      type: 'user_joined',
      conversationId,
      userId: user.userId,
      userName: user.userName
    }, user.userId);

    this.send(ws, {
      type: 'conversation_joined',
      conversationId
    });
  }

  private async handleLeaveConversation(ws: WebSocket, data: any) {
    const { conversationId } = data;
    const user = this.getUserByWebSocket(ws);

    if (!user || !conversationId) return;

    // Remove user from conversation
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.delete(user.userId);
      if (conversation.size === 0) {
        this.conversations.delete(conversationId);
      }
    }

    // Clear typing indicator
    this.clearTypingIndicator(user.userId, conversationId);

    // Notify other users
    this.broadcastToConversation(conversationId, {
      type: 'user_left',
      conversationId,
      userId: user.userId,
      userName: user.userName
    }, user.userId);
  }

  private async handleSendMessage(ws: WebSocket, data: any) {
    const { conversationId, message, replyToId, attachments } = data;
    const user = this.getUserByWebSocket(ws);

    if (!user || !conversationId || !message) {
      this.sendError(ws, 'Invalid message data');
      return;
    }

    try {
      // Store message in database
      const chatMessage = await storage.createChatMessage({
        conversationId,
        userId: user.userId,
        message: message.trim(),
        type: 'text',
        replyToId: replyToId || null,
        attachments: attachments || []
      });

      // Clear typing indicator
      this.clearTypingIndicator(user.userId, conversationId);

      // Broadcast message to all users in conversation
      this.broadcastToConversation(conversationId, {
        type: 'new_message',
        message: {
          ...chatMessage,
          user: {
            id: user.userId,
            firstName: user.userName,
            profilePicture: null
          }
        }
      });

      // Send confirmation to sender
      this.send(ws, {
        type: 'message_sent',
        messageId: chatMessage.id,
        timestamp: chatMessage.createdAt
      });

    } catch (error) {
      logger.error('Error sending message:', error);
      this.sendError(ws, 'Failed to send message');
    }
  }

  private async handleTypingStart(ws: WebSocket, data: any) {
    const { conversationId } = data;
    const user = this.getUserByWebSocket(ws);

    if (!user || !conversationId) return;

    user.isTyping = true;
    user.typingInConversation = conversationId;

    // Store typing indicator
    if (!this.typingIndicators.has(conversationId)) {
      this.typingIndicators.set(conversationId, new Map());
    }
    this.typingIndicators.get(conversationId)!.set(user.userId, {
      userId: user.userId,
      userName: user.userName,
      conversationId,
      timestamp: new Date()
    });

    // Broadcast typing indicator
    this.broadcastToConversation(conversationId, {
      type: 'user_typing',
      conversationId,
      userId: user.userId,
      userName: user.userName,
      isTyping: true
    }, user.userId);
  }

  private async handleTypingStop(ws: WebSocket, data: any) {
    const { conversationId } = data;
    const user = this.getUserByWebSocket(ws);

    if (!user || !conversationId) return;

    this.clearTypingIndicator(user.userId, conversationId);
  }

  private async handleMessageRead(ws: WebSocket, data: any) {
    const { messageId, conversationId } = data;
    const user = this.getUserByWebSocket(ws);

    if (!user || !messageId) return;

    try {
      // Mark message as read in database
      await storage.markMessageAsRead(messageId, user.userId);

      // Broadcast read status
      this.broadcastToConversation(conversationId, {
        type: 'message_read',
        messageId,
        userId: user.userId,
        readAt: new Date().toISOString()
      }, user.userId);

    } catch (error) {
      logger.error('Error marking message as read:', error);
    }
  }

  private async handleGetPresence(ws: WebSocket, data: any) {
    const { userIds } = data;

    if (!Array.isArray(userIds)) {
      this.sendError(ws, 'Invalid user IDs');
      return;
    }

    const presence = userIds.map(userId => ({
      userId,
      isOnline: this.connectedUsers.has(userId),
      lastSeen: this.connectedUsers.get(userId)?.lastSeen || null
    }));

    this.send(ws, {
      type: 'presence_update',
      presence
    });
  }

  private handleDisconnection(ws: WebSocket) {
    const user = this.getUserByWebSocket(ws);
    if (!user) return;

    // Remove from connected users
    this.connectedUsers.delete(user.userId);

    // Remove from all conversations
    for (const [conversationId, userIds] of this.conversations.entries()) {
      if (userIds.has(user.userId)) {
        userIds.delete(user.userId);

        // Clear typing indicator
        this.clearTypingIndicator(user.userId, conversationId);

        // Notify other users
        this.broadcastToConversation(conversationId, {
          type: 'user_left',
          conversationId,
          userId: user.userId,
          userName: user.userName
        }, user.userId);

        if (userIds.size === 0) {
          this.conversations.delete(conversationId);
        }
      }
    }

    // Broadcast presence update
    this.broadcastPresenceUpdate(user.userId, false);

    logger.info(`User ${user.userName} (${user.userId}) disconnected`);
  }

  private getUserByWebSocket(ws: WebSocket): ConnectedUser | undefined {
    for (const user of this.connectedUsers.values()) {
      if (user.ws === ws) {
        return user;
      }
    }
    return undefined;
  }

  private clearTypingIndicator(userId: number, conversationId: number) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      user.isTyping = false;
      user.typingInConversation = undefined;
    }

    const typingMap = this.typingIndicators.get(conversationId);
    if (typingMap) {
      typingMap.delete(userId);
      if (typingMap.size === 0) {
        this.typingIndicators.delete(conversationId);
      }
    }

    // Broadcast typing stop
    this.broadcastToConversation(conversationId, {
      type: 'user_typing',
      conversationId,
      userId,
      isTyping: false
    }, userId);
  }

  private broadcastToConversation(conversationId: number, message: any, excludeUserId?: number) {
    const userIds = this.conversations.get(conversationId);
    if (!userIds) return;

    for (const userId of userIds) {
      if (excludeUserId && userId === excludeUserId) continue;

      const user = this.connectedUsers.get(userId);
      if (user && user.ws.readyState === WebSocket.OPEN) {
        this.send(user.ws, message);
      }
    }
  }

  private broadcastPresenceUpdate(userId: number, isOnline: boolean) {
    const message = {
      type: 'presence_update',
      userId,
      isOnline,
      timestamp: new Date().toISOString()
    };

    for (const user of this.connectedUsers.values()) {
      if (user.ws.readyState === WebSocket.OPEN) {
        this.send(user.ws, message);
      }
    }
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: 'error',
      error,
      timestamp: new Date().toISOString()
    });
  }

  private startCleanupInterval() {
    setInterval(() => {
      const now = new Date();

      // Clean up old typing indicators (older than 30 seconds)
      for (const [conversationId, typingMap] of this.typingIndicators.entries()) {
        for (const [userId, indicator] of typingMap.entries()) {
          if (now.getTime() - indicator.timestamp.getTime() > 30000) {
            this.clearTypingIndicator(userId, conversationId);
          }
        }
      }
    }, 10000); // Run every 10 seconds
  }

  public getConnectedUsers(): ConnectedUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserPresence(userId: number): { isOnline: boolean; lastSeen?: Date } {
    const user = this.connectedUsers.get(userId);
    return {
      isOnline: !!user,
      lastSeen: user?.lastSeen
    };
  }
}