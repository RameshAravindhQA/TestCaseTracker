
import { EventEmitter } from 'events';
import { storage } from './storage';

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
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket);
  }

  removeUserSocket(userId: number, socket: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  async sendMessage(projectId: number, userId: number, message: string, type: 'text' | 'system' | 'mention' = 'text'): Promise<ChatMessage> {
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const chatMessage: ChatMessage = {
      id: Date.now(),
      projectId,
      userId,
      userName: user.name,
      userAvatar: user.avatar || undefined,
      message,
      timestamp: new Date(),
      type,
      mentionedUsers: this.extractMentions(message),
    };

    // Store message in database
    await storage.createChatMessage(chatMessage);

    // Emit to all users in the project
    this.emit('message', chatMessage);

    return chatMessage;
  }

  private extractMentions(message: string): number[] {
    const mentionRegex = /@(\d+)/g;
    const mentions: number[] = [];
    let match;
    
    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(parseInt(match[1]));
    }
    
    return mentions;
  }

  async getProjectMessages(projectId: number, limit: number = 50): Promise<ChatMessage[]> {
    return await storage.getChatMessages(projectId, limit);
  }

  async markUserAsTyping(projectId: number, userId: number) {
    this.emit('typing', { projectId, userId });
  }

  async getOnlineUsers(projectId: number): Promise<number[]> {
    const projectUsers = await storage.getProjectUsers(projectId);
    return projectUsers.filter(userId => this.userSockets.has(userId)).map(u => u.id);
  }
}

export const chatService = new ChatService();
