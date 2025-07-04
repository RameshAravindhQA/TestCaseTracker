import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemStorage } from '../server/storage';

describe('Messaging System Unit Tests', () => {
  let storage: MemStorage;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async () => {
    storage = new MemStorage();
    
    // Create test users
    user1 = await storage.createUser({
      email: 'user1@test.com',
      password: 'hashedpassword',
      firstName: 'John',
      lastName: 'Smith',
      role: 'Tester'
    });

    user2 = await storage.createUser({
      email: 'user2@test.com',
      password: 'hashedpassword',
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'Developer'
    });

    user3 = await storage.createUser({
      email: 'user3@test.com',
      password: 'hashedpassword',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'Admin'
    });
  });

  describe('Direct Conversation Management', () => {
    it('should create a direct conversation between two users', async () => {
      const conversation = await storage.createDirectConversation(user1.id, user2.id);
      
      expect(conversation).toBeDefined();
      expect(conversation.type).toBe('direct');
      expect(conversation.participants).toContain(user1.id);
      expect(conversation.participants).toContain(user2.id);
      expect(conversation.participants).toHaveLength(2);
      expect(conversation.name).toBe('John & Sarah');
    });

    it('should return existing conversation if one already exists', async () => {
      const conversation1 = await storage.createDirectConversation(user1.id, user2.id);
      const conversation2 = await storage.createDirectConversation(user1.id, user2.id);
      
      expect(conversation1.id).toBe(conversation2.id);
    });

    it('should return existing conversation regardless of user order', async () => {
      const conversation1 = await storage.createDirectConversation(user1.id, user2.id);
      const conversation2 = await storage.createDirectConversation(user2.id, user1.id);
      
      expect(conversation1.id).toBe(conversation2.id);
    });
  });

  describe('Group Conversation Management', () => {
    it('should create a group conversation with multiple participants', async () => {
      const participants = [user2.id, user3.id];
      const conversation = await storage.createGroupConversation(
        user1.id,
        'Test Group',
        'A test group conversation',
        participants
      );

      expect(conversation).toBeDefined();
      expect(conversation.type).toBe('group');
      expect(conversation.name).toBe('Test Group');
      expect(conversation.description).toBe('A test group conversation');
      expect(conversation.participants).toContain(user1.id); // Creator included
      expect(conversation.participants).toContain(user2.id);
      expect(conversation.participants).toContain(user3.id);
      expect(conversation.participants).toHaveLength(3);
    });

    it('should include creator in participants even if not explicitly added', async () => {
      const conversation = await storage.createGroupConversation(
        user1.id,
        'Test Group',
        'A test group',
        [user2.id, user3.id] // Creator not included
      );

      expect(conversation.participants).toContain(user1.id);
      expect(conversation.participants).toHaveLength(3);
    });
  });

  describe('Message Operations', () => {
    let conversation: any;

    beforeEach(async () => {
      conversation = await storage.createDirectConversation(user1.id, user2.id);
    });

    it('should create and store messages in a conversation', async () => {
      const messageData = {
        conversationId: conversation.id,
        userId: user1.id,
        message: 'Hello, how are you?',
        type: 'text'
      };

      const message = await storage.createMessage(messageData);

      expect(message).toBeDefined();
      expect(message.conversationId).toBe(conversation.id);
      expect(message.userId).toBe(user1.id);
      expect(message.message).toBe('Hello, how are you?');
      expect(message.type).toBe('text');
      expect(message.timestamp).toBeDefined();
    });

    it('should retrieve messages for a conversation', async () => {
      // Create multiple messages
      await storage.createMessage({
        conversationId: conversation.id,
        userId: user1.id,
        message: 'First message',
        type: 'text'
      });

      await storage.createMessage({
        conversationId: conversation.id,
        userId: user2.id,
        message: 'Second message',
        type: 'text'
      });

      const messages = await storage.getMessagesByChat(conversation.id);
      
      expect(messages).toHaveLength(2);
      expect(messages[0].message).toBe('First message');
      expect(messages[1].message).toBe('Second message');
    });

    it('should support different message types', async () => {
      const textMessage = await storage.createMessage({
        conversationId: conversation.id,
        userId: user1.id,
        message: 'Hello',
        type: 'text'
      });

      const systemMessage = await storage.createMessage({
        conversationId: conversation.id,
        userId: user1.id,
        message: 'User joined the conversation',
        type: 'system'
      });

      expect(textMessage.type).toBe('text');
      expect(systemMessage.type).toBe('system');
    });
  });

  describe('Real-time Messaging Simulation', () => {
    let conversation: any;

    beforeEach(async () => {
      conversation = await storage.createDirectConversation(user1.id, user2.id);
    });

    it('should simulate two-user conversation flow', async () => {
      // User 1 sends initial message
      const message1 = await storage.createMessage({
        conversationId: conversation.id,
        userId: user1.id,
        message: 'Hey Sarah, how are you doing?',
        type: 'text'
      });

      expect(message1.userId).toBe(user1.id);
      
      // Simulate auto-response from User 2
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      
      const message2 = await storage.createMessage({
        conversationId: conversation.id,
        userId: user2.id,
        message: 'Hi John! I\'m doing well, thanks for asking. How about you?',
        type: 'text'
      });

      expect(message2.userId).toBe(user2.id);

      // Verify conversation flow
      const messages = await storage.getMessagesByChat(conversation.id);
      expect(messages).toHaveLength(2);
      expect(messages[0].userId).toBe(user1.id);
      expect(messages[1].userId).toBe(user2.id);
    });

    it('should maintain message order and timestamps', async () => {
      const startTime = Date.now();

      // Send multiple messages in sequence
      const message1 = await storage.createMessage({
        conversationId: conversation.id,
        userId: user1.id,
        message: 'First',
        type: 'text'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const message2 = await storage.createMessage({
        conversationId: conversation.id,
        userId: user2.id,
        message: 'Second',
        type: 'text'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const message3 = await storage.createMessage({
        conversationId: conversation.id,
        userId: user1.id,
        message: 'Third',
        type: 'text'
      });

      const messages = await storage.getMessagesByChat(conversation.id);
      
      // Verify order
      expect(messages[0].message).toBe('First');
      expect(messages[1].message).toBe('Second');
      expect(messages[2].message).toBe('Third');

      // Verify timestamps are in order
      expect(new Date(messages[0].timestamp).getTime()).toBeGreaterThanOrEqual(startTime);
      expect(new Date(messages[1].timestamp).getTime()).toBeGreaterThan(new Date(messages[0].timestamp).getTime());
      expect(new Date(messages[2].timestamp).getTime()).toBeGreaterThan(new Date(messages[1].timestamp).getTime());
    });
  });

  describe('Conversation Retrieval', () => {
    it('should retrieve user conversations', async () => {
      // Create multiple conversations for user1
      const directConv = await storage.createDirectConversation(user1.id, user2.id);
      const groupConv = await storage.createGroupConversation(user1.id, 'Test Group', 'Description', [user2.id, user3.id]);

      const conversations = await storage.getUserConversations(user1.id);
      
      expect(conversations).toHaveLength(2);
      expect(conversations.some(c => c.id === directConv.id)).toBe(true);
      expect(conversations.some(c => c.id === groupConv.id)).toBe(true);
    });

    it('should not return conversations user is not part of', async () => {
      // Create conversation between user2 and user3
      await storage.createDirectConversation(user2.id, user3.id);

      const user1Conversations = await storage.getUserConversations(user1.id);
      
      expect(user1Conversations).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user IDs gracefully', async () => {
      const conversation = await storage.createDirectConversation(999, 1000);
      
      expect(conversation).toBeDefined();
      expect(conversation.name).toBe('User & User'); // Fallback names
    });

    it('should handle empty message content', async () => {
      const conversation = await storage.createDirectConversation(user1.id, user2.id);
      
      const message = await storage.createMessage({
        conversationId: conversation.id,
        userId: user1.id,
        message: '',
        type: 'text'
      });

      expect(message.message).toBe('');
    });
  });
});