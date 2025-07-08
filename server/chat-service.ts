
import { EventEmitter } from 'events';
import { storage } from './storage';
import { logger } from './logger';

export interface ChatMessage {
  id: number;
  projectId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'mention';
  mentionedUsers?: number[];
  attachments?: string[];
}

export interface ChatRoom {
  id: string;
  projectId: number;
  name: string;
  participants: number[];
  lastActivity: Date;
}

class ChatService extends EventEmitter {
  private rooms = new Map<string, ChatRoom>();
  private userSockets = new Map<number, Set<any>>();

  addUserSocket(userId: number, socket: any) {
    logger.info(`Adding socket for user ${userId}, socket ID: ${socket.id}`);
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
      logger.info(`Created new socket set for user ${userId}`);
    }
    this.userSockets.get(userId)!.add(socket);
    logger.info(`User ${userId} now has ${this.userSockets.get(userId)!.size} active sockets`);
  }

  removeUserSocket(userId: number, socket: any) {
    logger.info(`Removing socket for user ${userId}, socket ID: ${socket.id}`);
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const wasDeleted = sockets.delete(socket);
      logger.info(`Socket removal ${wasDeleted ? 'successful' : 'failed'} for user ${userId}`);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        logger.info(`Removed user ${userId} from active users (no more sockets)`);
      } else {
        logger.info(`User ${userId} still has ${sockets.size} active sockets`);
      }
    } else {
      logger.warn(`Attempted to remove socket for user ${userId} but no sockets found`);
    }
  }

  async sendMessage(projectId: number, userId: number, message: string, type: 'text' | 'system' | 'mention' = 'text'): Promise<ChatMessage> {
    logger.info(`Sending message: projectId=${projectId}, userId=${userId}, type=${type}, messageLength=${message.length}`);
    
    const user = await storage.getUser(userId);
    if (!user) {
      logger.error(`User not found for ID: ${userId}`);
      throw new Error('User not found');
    }

    logger.info(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    const chatMessage: ChatMessage = {
      id: Date.now(),
      projectId,
      userId,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      userAvatar: user.profilePicture || undefined,
      message,
      timestamp: new Date(),
      type,
      mentionedUsers: this.extractMentions(message),
    };

    logger.info(`Created chat message object: ${JSON.stringify(chatMessage, null, 2)}`);

    try {
      // Store message in database
      await storage.createChatMessage(chatMessage);
      logger.info(`Successfully stored message in database with ID: ${chatMessage.id}`);
    } catch (error) {
      logger.error(`Failed to store message in database: ${error}`);
      throw error;
    }

    // Emit to all users in the project
    logger.info(`Emitting message to project ${projectId} listeners`);
    this.emit('message', chatMessage);

    logger.info(`Message sent successfully: ${chatMessage.id}`);
    return chatMessage;
  }

  private extractMentions(message: string): number[] {
    logger.debug(`Extracting mentions from message: "${message}"`);
    const mentionRegex = /@(\d+)/g;
    const mentions: number[] = [];
    let match;
    
    while ((match = mentionRegex.exec(message)) !== null) {
      const userId = parseInt(match[1]);
      mentions.push(userId);
      logger.debug(`Found mention for user ID: ${userId}`);
    }
    
    logger.info(`Extracted ${mentions.length} mentions: [${mentions.join(', ')}]`);
    return mentions;
  }

  async getProjectMessages(projectId: number, limit: number = 50): Promise<ChatMessage[]> {
    logger.info(`Getting project messages: projectId=${projectId}, limit=${limit}`);
    try {
      const messages = await storage.getChatMessages(projectId, limit);
      logger.info(`Retrieved ${messages.length} messages for project ${projectId}`);
      return messages;
    } catch (error) {
      logger.error(`Failed to get project messages: ${error}`);
      throw error;
    }
  }

  async markUserAsTyping(projectId: number, userId: number) {
    logger.debug(`User ${userId} is typing in project ${projectId}`);
    this.emit('typing', { projectId, userId });
  }

  async getOnlineUsers(projectId: number): Promise<number[]> {
    logger.info(`Getting online users for project ${projectId}`);
    try {
      const projectMembers = await storage.getProjectMembers(projectId);
      const projectUserIds = projectMembers.map(member => member.userId);
      const onlineUsers = projectUserIds.filter(userId => this.userSockets.has(userId));
      
      logger.info(`Project ${projectId} has ${projectUserIds.length} total members, ${onlineUsers.length} online`);
      logger.debug(`Online user IDs: [${onlineUsers.join(', ')}]`);
      
      return onlineUsers;
    } catch (error) {
      logger.error(`Failed to get online users for project ${projectId}: ${error}`);
      return [];
    }
  }
}

export const chatService = new ChatService();
