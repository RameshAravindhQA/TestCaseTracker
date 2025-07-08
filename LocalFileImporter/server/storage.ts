import { logger } from './logger';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role?: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  participants: number[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastMessage?: any;
  unreadCount?: number;
  memberCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  message: string;
  type: 'text' | 'file' | 'system';
  timestamp: string;
  attachments?: string[];
}

export interface TestSheet {
  id: number;
  projectId: number;
  name: string;
  type: 'document' | 'spreadsheet' | 'text' | 'presentation';
  content: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  updatedBy?: number;
}

class MemoryStorage {
  private users: Map<number, User> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private testSheets: Map<number, TestSheet> = new Map();
  private userIdCounter = 1;
  private testSheetIdCounter = 1;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users
    const sampleUsers = [
      {
        id: this.userIdCounter++,
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: this.userIdCounter++,
        name: 'Ragul Aravindh',
        email: 'ragul@example.com',
        password: 'password123',
        role: 'user',
        createdAt: new Date().toISOString()
      },
      {
        id: this.userIdCounter++,
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
        createdAt: new Date().toISOString()
      }
    ];

    sampleUsers.forEach(user => {
      this.users.set(user.id, user);
    });

    logger.info(`Initialized memory storage with ${sampleUsers.length} sample users`);
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    console.log(`Storage: authenticateUser(${email})`);
    for (const user of this.users.values()) {
      if (user.email === email && user.password === password) {
        console.log(`Authentication successful for: ${user.name}`);
        return user;
      }
    }
    console.log(`Authentication failed for: ${email}`);
    return null;
  }

  async getUser(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      id: this.userIdCounter++,
      ...userData,
      createdAt: new Date().toISOString()
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async getUserConversations(userId: number): Promise<Conversation[]> {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.participants.includes(userId));
    
    return userConversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getDirectConversation(userId1: number, userId2: number): Promise<Conversation | null> {
    const conversations = Array.from(this.conversations.values());
    
    for (const conv of conversations) {
      if (conv.type === 'direct' && 
          conv.participants.includes(userId1) && 
          conv.participants.includes(userId2) &&
          conv.participants.length === 2) {
        return conv;
      }
    }
    
    return null;
  }

  async createDirectConversation(data: {
    type: 'direct' | 'group';
    participants: number[];
    createdBy: number;
  }): Promise<Conversation> {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    
    // Generate conversation name based on participants
    let name = 'New Conversation';
    if (data.type === 'direct' && data.participants.length === 2) {
      const otherUserId = data.participants.find(id => id !== data.createdBy);
      const otherUser = await this.getUser(otherUserId!);
      name = otherUser ? otherUser.name : 'Direct Chat';
    }

    const conversation: Conversation = {
      id,
      type: data.type,
      name,
      participants: data.participants,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      memberCount: data.participants.length
    };

    this.conversations.set(id, conversation);
    this.messages.set(id, []); // Initialize empty message array
    
    return conversation;
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.conversations.get(conversationId) || null;
  }

  async updateConversationActivity(conversationId: string, lastMessage: any): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.lastMessage = lastMessage;
      conversation.updatedAt = new Date().toISOString();
      this.conversations.set(conversationId, conversation);
    }
  }

  async getConversationMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const messages = this.messages.get(conversationId) || [];
    return messages.slice(-limit); // Return last N messages
  }

  async createMessage(data: {
    conversationId: string;
    senderId: number;
    senderName: string;
    message: string;
    type: 'text' | 'file' | 'system';
    timestamp: string;
  }): Promise<Message> {
    const message: Message = {
      id: Date.now().toString(),
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderName: data.senderName,
      message: data.message,
      type: data.type,
      timestamp: data.timestamp
    };

    if (!this.messages.has(data.conversationId)) {
      this.messages.set(data.conversationId, []);
    }
    
    this.messages.get(data.conversationId)!.push(message);
    
    // Update conversation last message
    await this.updateConversationActivity(data.conversationId, message);
    
    return message;
  }

  async getProjectTestSheets(projectId?: number): Promise<TestSheet[]> {
    const sheets = Array.from(this.testSheets.values());
    if (projectId) {
      return sheets.filter(sheet => sheet.projectId === projectId);
    }
    return sheets;
  }

  async createTestSheet(data: {
    name: string;
    projectId: number;
    type: 'document' | 'spreadsheet' | 'text' | 'presentation';
    content: string;
    createdBy: number;
  }): Promise<TestSheet> {
    const now = new Date().toISOString();
    const testSheet: TestSheet = {
      id: this.testSheetIdCounter++,
      name: data.name,
      projectId: data.projectId,
      type: data.type,
      content: data.content,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    this.testSheets.set(testSheet.id, testSheet);
    return testSheet;
  }

  async getTestSheet(id: number): Promise<TestSheet | null> {
    return this.testSheets.get(id) || null;
  }

  async updateTestSheet(id: number, data: {
    name?: string;
    content?: string;
    type?: 'document' | 'spreadsheet' | 'text' | 'presentation';
    updatedBy?: number;
  }): Promise<TestSheet | null> {
    const sheet = this.testSheets.get(id);
    if (!sheet) return null;

    const updatedSheet: TestSheet = {
      ...sheet,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.testSheets.set(id, updatedSheet);
    return updatedSheet;
  }

  async deleteTestSheet(id: number): Promise<boolean> {
    return this.testSheets.delete(id);
  }
}

export const storage = new MemoryStorage();