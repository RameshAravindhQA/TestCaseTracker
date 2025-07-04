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
      case 'edit_message':
        await this.handleEditMessage(ws, data);
        break;
      case 'delete_message':
        await this.handleDeleteMessage(ws, data);
        break;
      case 'upload_attachment':
        await this.handleUploadAttachment(ws, data);
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

    // Add user to conversation tracking
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, new Set());
    }
    const conversation = this.conversations.get(conversationId)!;
    conversation.add(user.userId);

    // Always try to get conversation participants from storage to ensure all users are tracked
    try {
      const conversationData = await storage.getConversationById(conversationId);
      if (conversationData && conversationData.participants && Array.isArray(conversationData.participants)) {
        conversationData.participants.forEach(participantId => {
          conversation.add(participantId);
        });
        logger.info(`Loaded ${conversationData.participants.length} participants from storage for conversation ${conversationId}: ${JSON.stringify(conversationData.participants)}`);
      } else {
        logger.warn(`No participants data found for conversation ${conversationId}`);
      }
    } catch (error) {
      logger.warn(`Could not load conversation participants from storage: ${error}`);
    }

    logger.info(`User ${user.userName} (${user.userId}) joined conversation ${conversationId}. Total participants: ${conversation.size}, Participants: ${JSON.stringify(Array.from(conversation))}`);

    // Notify other users in conversation
    this.broadcastToConversation(conversationId, {
      type: 'user_joined',
      conversationId,
      userId: user.userId,
      userName: user.userName
    }, user.userId);

    this.send(ws, {
      type: 'conversation_joined',
      conversationId,
      totalParticipants: conversation.size
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
      // Store new message in database
      const chatMessage = await storage.createChatMessage({
        conversationId,
        userId: user.userId,
        userName: user.userName,
        message: message.trim(),
        type: 'text',
        replyToId: replyToId || null,
        attachments: attachments || []
      });
      
      logger.info(`New message created in database: ${chatMessage.id}`);

      // Clear typing indicator
      this.clearTypingIndicator(user.userId, conversationId);

      // Ensure conversation is properly set up with all participants
      if (!this.conversations.has(conversationId)) {
        this.conversations.set(conversationId, new Set());
      }
      const conversation = this.conversations.get(conversationId)!;
      conversation.add(user.userId);
      
      // Always load conversation participants from storage before broadcasting
      try {
        const conversationData = await storage.getConversationById(conversationId);
        if (conversationData && conversationData.participants && Array.isArray(conversationData.participants)) {
          conversationData.participants.forEach(participantId => {
            conversation.add(participantId);
          });
          logger.info(`Ensured ${conversationData.participants.length} participants are tracked for conversation ${conversationId}: ${JSON.stringify(conversationData.participants)}`);
        } else {
          logger.warn(`No valid participants data for conversation ${conversationId}`);
        }
      } catch (error) {
        logger.warn(`Could not load conversation participants: ${error}`);
      }

      // Broadcast message to all users in conversation (including sender for real-time sync)
      this.broadcastToConversation(conversationId, {
        type: 'new_message',
        message: {
          ...chatMessage,
          conversationId,
          user: {
            id: user.userId,
            name: user.userName,
            firstName: user.userName,
            profilePicture: null
          }
        }
      }, null); // Don't exclude sender to ensure consistent state

      // Send confirmation to sender
      this.send(ws, {
        type: 'message_sent',
        messageId: chatMessage.id,
        conversationId,
        timestamp: chatMessage.createdAt || chatMessage.timestamp || new Date().toISOString()
      });

      logger.info(`Message sent from user ${user.userId} to conversation ${conversationId}`);

    } catch (error) {
      logger.error('Error sending message:', error);
      this.sendError(ws, 'Failed to send message');
    }
  }

  private async handleEditMessage(ws: WebSocket, data: any) {
    const { messageId, newMessage } = data;
    const user = this.getUserByWebSocket(ws);

    if (!user || !messageId || !newMessage) {
      this.sendError(ws, 'Invalid edit message data');
      return;
    }

    try {
      const updatedMessage = await storage.updateChatMessage(messageId, user.userId, {
        message: newMessage.trim()
      });

      if (updatedMessage) {
        // Broadcast updated message to conversation
        this.broadcastToConversation(updatedMessage.conversationId, {
          type: 'message_edited',
          message: updatedMessage
        });

        this.send(ws, {
          type: 'message_edit_success',
          messageId: messageId
        });

        logger.info(`Message ${messageId} edited by user ${user.userId}`);
      } else {
        this.sendError(ws, 'Message not found or not authorized to edit');
      }
    } catch (error) {
      logger.error('Error editing message:', error);
      this.sendError(ws, 'Failed to edit message');
    }
  }

  private async handleDeleteMessage(ws: WebSocket, data: any) {
    const { messageId } = data;
    const user = this.getUserByWebSocket(ws);

    if (!user || !messageId) {
      this.sendError(ws, 'Invalid delete message data');
      return;
    }

    try {
      const deleted = await storage.deleteChatMessage(messageId, user.userId);

      if (deleted) {
        // Find conversation ID to broadcast
        let conversationId = null;
        for (const [convId, messages] of storage.conversationMessages.entries()) {
          if (messages.some(msg => msg.id === messageId)) {
            conversationId = convId;
            break;
          }
        }

        if (conversationId) {
          this.broadcastToConversation(conversationId, {
            type: 'message_deleted',
            messageId: messageId
          });
        }

        this.send(ws, {
          type: 'message_delete_success',
          messageId: messageId
        });

        logger.info(`Message ${messageId} deleted by user ${user.userId}`);
      } else {
        this.sendError(ws, 'Message not found or not authorized to delete');
      }
    } catch (error) {
      logger.error('Error deleting message:', error);
      this.sendError(ws, 'Failed to delete message');
    }
  }

  private async handleUploadAttachment(ws: WebSocket, data: any) {
    const { conversationId, file, fileName, fileType, fileSize } = data;
    const user = this.getUserByWebSocket(ws);

    if (!user || !conversationId || !file) {
      this.sendError(ws, 'Invalid attachment data');
      return;
    }

    try {
      // In a real implementation, you'd save the file to disk/cloud storage
      const attachment = {
        id: Date.now(),
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        uploadedBy: user.userId,
        uploadedAt: new Date().toISOString(),
        url: `/uploads/chat-attachments/${fileName}` // Mock URL
      };

      this.send(ws, {
        type: 'attachment_uploaded',
        attachment: attachment
      });

      logger.info(`Attachment uploaded by user ${user.userId}: ${fileName}`);
    } catch (error) {
      logger.error('Error uploading attachment:', error);
      this.sendError(ws, 'Failed to upload attachment');
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
    logger.info(`Broadcasting message to conversation ${conversationId}, excluding user ${excludeUserId}`);
    
    let broadcastCount = 0;
    
    // Get conversation participants from conversation tracking
    let conversationUsers = this.conversations.get(conversationId);
    
    // If no tracked participants, try to load from storage
    if (!conversationUsers || conversationUsers.size === 0) {
      logger.info(`No tracked participants for conversation ${conversationId}, loading from storage`);
      try {
        const conversationData = storage.getConversationById(conversationId);
        if (conversationData && conversationData.participants && Array.isArray(conversationData.participants)) {
          if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, new Set());
          }
          conversationUsers = this.conversations.get(conversationId)!;
          conversationData.participants.forEach(participantId => {
            conversationUsers!.add(participantId);
          });
          logger.info(`Loaded ${conversationData.participants.length} participants from storage for broadcast`);
        }
      } catch (error) {
        logger.warn(`Failed to load conversation participants for broadcast: ${error}`);
      }
    }
    
    if (conversationUsers && conversationUsers.size > 0) {
      logger.info(`Conversation ${conversationId} has ${conversationUsers.size} tracked participants: ${JSON.stringify(Array.from(conversationUsers))}`);
      
      // Send to all connected users who are part of this conversation
      for (const participantId of conversationUsers) {
        if (excludeUserId && participantId === excludeUserId) {
          logger.debug(`Excluding sender user ${participantId}`);
          continue;
        }
        
        // Find connected user by userId
        const connectedUser = this.connectedUsers.get(participantId);
        
        if (connectedUser && connectedUser.ws.readyState === WebSocket.OPEN) {
          this.send(connectedUser.ws, message);
          broadcastCount++;
          logger.info(`Message sent to conversation participant ${participantId} (${connectedUser.userName})`);
        } else {
          logger.debug(`Participant ${participantId} not connected or WebSocket not open`);
        }
      }
    } else {
      logger.warn(`Still no tracked participants for conversation ${conversationId} after loading from storage`);
    }
    
    logger.info(`Message broadcasted to ${broadcastCount} users in conversation ${conversationId}`);
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

    let notifiedCount = 0;
    for (const user of this.connectedUsers.values()) {
      if (user.ws.readyState === WebSocket.OPEN) {
        this.send(user.ws, message);
        notifiedCount++;
      }
    }

    logger.info(`Notified ${notifiedCount} connected users about new registration: ${userName} (${userId})`);
  }
}