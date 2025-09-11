import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { storage } from './storage';
import { logger } from './logger';
import session from 'express-session';
import { parse as parseUrl } from 'url';
import { parse as parseCookie } from 'cookie';

interface ConnectedUser {
  ws: WebSocket;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  lastSeen: Date;
  isTyping: boolean;
  typingInConversation?: number;
  sessionId?: string;
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
  private sessionStore: any;

  constructor(server: any, sessionStore: any) {
    this.sessionStore = sessionStore;
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws', // Use /ws path to match client connection
      host: '0.0.0.0' // Bind to all interfaces for external access
    });
    this.setupWebSocket();
    this.startCleanupInterval();
    logger.info('Chat WebSocket server initialized on /ws/chat');
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      logger.info('New WebSocket connection established');

      // Extract session info from request headers
      this.extractSessionFromRequest(ws, request);

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
      case 'ping':
        await this.handlePing(ws, data);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  private async extractSessionFromRequest(ws: WebSocket, request: any) {
    try {
      // Parse cookies from request
      const cookieHeader = request.headers.cookie;
      if (!cookieHeader) {
        this.sendError(ws, 'No session cookie found');
        return;
      }

      const cookies = parseCookie(cookieHeader);
      const sessionId = cookies['connect.sid'];
      
      if (!sessionId) {
        this.sendError(ws, 'No session ID found');
        return;
      }

      // Decode session ID (remove 's:' prefix and signature)
      const decodedSessionId = sessionId.startsWith('s:') 
        ? sessionId.slice(2).split('.')[0] 
        : sessionId;

      // Get session from store
      this.sessionStore.get(decodedSessionId, (err: any, sessionData: any) => {
        if (err || !sessionData || !sessionData.userId) {
          this.sendError(ws, 'Invalid or expired session');
          return;
        }

        // Store session info with WebSocket for later use
        (ws as any).sessionData = {
          userId: sessionData.userId,
          userName: sessionData.userName,
          userEmail: sessionData.userEmail,
          userRole: sessionData.userRole,
          sessionId: decodedSessionId
        };

        logger.info(`WebSocket connected with valid session for user ${sessionData.userName} (${sessionData.userId})`);
      });
    } catch (error) {
      logger.error('Error extracting session from WebSocket request:', error);
      this.sendError(ws, 'Session validation failed');
    }
  }

  private async handleAuthentication(ws: WebSocket, data: any) {
    // Verify that WebSocket has valid session data
    const sessionData = (ws as any).sessionData;
    
    if (!sessionData || !sessionData.userId) {
      this.sendError(ws, 'Authentication failed: No valid session found');
      return;
    }

    const { userId, userName, userEmail, userRole } = sessionData;

    // Verify user exists in database
    const user = await storage.getUser(userId);
    if (!user) {
      this.sendError(ws, 'Authentication failed: User not found');
      return;
    }

    // Update user connection - close existing connection if any
    const existingUser = this.connectedUsers.get(userId);
    if (existingUser) {
      logger.info(`Closing existing WebSocket connection for user ${userId}`);
      existingUser.ws.close();
    }

    this.connectedUsers.set(userId, {
      ws,
      userId,
      userName: user.firstName, // Use verified name from database
      userEmail: user.email,
      userRole: user.role,
      lastSeen: new Date(),
      isTyping: false,
      sessionId: sessionData.sessionId
    });

    // Notify about user presence
    this.broadcastPresenceUpdate(userId, true);

    this.send(ws, {
      type: 'authenticated',
      userId,
      userName: user.firstName,
      onlineUsers: Array.from(this.connectedUsers.values()).map(user => ({
        userId: user.userId,
        userName: user.userName,
        lastSeen: user.lastSeen
      }))
    });

    logger.info(`User ${user.firstName} (${userId}) authenticated via WebSocket with verified session`);
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
    const messageData = data.data || data; // Handle both data structures
    const { receiverId, message, replyToId, attachments, tempId } = messageData;
    const user = this.getUserByWebSocket(ws);

    if (!user || !receiverId || !message) {
      this.sendError(ws, 'Invalid message data - missing user, receiverId, or message');
      return;
    }

    try {
      console.log(`[WebSocket] Sending message from ${user.userId} to ${receiverId}`);

      // Get sender info for message enrichment
      const senderUser = await storage.getUser(user.userId);

      // Store message in database using the storage.createMessage method
      const chatMessage = await storage.createMessage({
        senderId: user.userId,
        receiverId: receiverId,
        content: message.trim(),
        type: 'text',
        attachments: attachments || [],
        sender: senderUser ? {
          id: senderUser.id,
          firstName: senderUser.firstName,
          lastName: senderUser.lastName || '',
          profilePicture: senderUser.profilePicture
        } : null
      });

      console.log(`[WebSocket] Message stored successfully: ${chatMessage.id}`);

      // Clear typing indicator - use proper conversation ID for direct messages
      const conversationId = await this.getOrCreateDirectConversationId(user.userId, receiverId);
      this.clearTypingIndicator(user.userId, conversationId);

      // Broadcast message to both sender and receiver
      this.broadcastToUsers([user.userId, receiverId], {
        type: 'new_message',
        message: chatMessage
      });

      // Send confirmation to sender
      this.send(ws, {
        type: 'message_sent',
        messageId: chatMessage.id,
        tempId: tempId,
        timestamp: chatMessage.createdAt || new Date().toISOString()
      });

      console.log(`[WebSocket] Message broadcast completed for message ${chatMessage.id}`);

    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      this.sendError(ws, `Failed to send message: ${error.message}`);
    }
  }

  private broadcastToUsers(userIds: number[], message: any) {
    for (const userId of userIds) {
      const user = this.connectedUsers.get(userId);
      if (user && user.ws.readyState === WebSocket.OPEN) {
        this.send(user.ws, message);
      }
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

  private async handlePing(ws: WebSocket, data: any) {
    // Respond with pong to keep connection alive
    this.send(ws, {
      type: 'pong',
      timestamp: new Date().toISOString()
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

  // Helper method to get or create conversation ID for direct messages
  private async getOrCreateDirectConversationId(userId1: number, userId2: number): Promise<number> {
    try {
      // Try to get existing direct conversation
      let conversation = await storage.getDirectConversation(userId1, userId2);
      
      if (!conversation) {
        // Create new direct conversation if it doesn't exist
        conversation = await storage.createDirectConversation(userId1, userId2);
      }
      
      return conversation.id;
    } catch (error) {
      logger.error('Error getting/creating direct conversation:', error);
      // Fallback: use a simple hash of both user IDs for conversation ID
      return Math.abs((userId1 * 1000) + userId2);
    }
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

  public notifyUserRegistration(userName: string, userId: number) {
    // Broadcast new user registration to all connected users
    const message = {
      type: 'user_registered',
      userId,
      userName,
      timestamp: new Date().toISOString()
    };

    for (const user of this.connectedUsers.values()) {
      if (user.ws.readyState === WebSocket.OPEN) {
        this.send(user.ws, message);
      }
    }

    logger.info(`Notified all users about new registration: ${userName} (${userId})`);
  }
}