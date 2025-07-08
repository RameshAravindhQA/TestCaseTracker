
import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../storage';

describe('Chat Conversation Management', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    (storage as any).initializeDefaultData();
  });

  describe('Direct Conversation Creation', () => {
    it('should create a new direct conversation between two users', async () => {
      // Create test users
      const user1 = await storage.createUser({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      const user2 = await storage.createUser({
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      // Create conversation
      const conversationData = {
        type: 'direct',
        participants: [user1.id, user2.id],
        createdBy: user1.id,
        isActive: true
      };

      const conversation = await storage.createConversation(conversationData);

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.type).toBe('direct');
      expect(conversation.participants).toEqual([user1.id, user2.id]);
      expect(conversation.createdBy).toBe(user1.id);
      expect(conversation.isActive).toBe(true);
    });

    it('should find existing direct conversation', async () => {
      // Create test users
      const user1 = await storage.createUser({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      const user2 = await storage.createUser({
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      // Create conversation
      const conversationData = {
        type: 'direct',
        participants: [user1.id, user2.id],
        createdBy: user1.id,
        isActive: true
      };

      const createdConversation = await storage.createConversation(conversationData);

      // Try to find the conversation
      const foundConversation = await storage.getDirectConversation(user1.id, user2.id);

      expect(foundConversation).toBeDefined();
      expect(foundConversation.id).toBe(createdConversation.id);

      // Should also work with reversed user order
      const foundConversationReversed = await storage.getDirectConversation(user2.id, user1.id);
      expect(foundConversationReversed).toBeDefined();
      expect(foundConversationReversed.id).toBe(createdConversation.id);
    });

    it('should return null when no direct conversation exists', async () => {
      // Create test users
      const user1 = await storage.createUser({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      const user2 = await storage.createUser({
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      const conversation = await storage.getDirectConversation(user1.id, user2.id);
      expect(conversation).toBeNull();
    });

    it('should validate participants array', async () => {
      // Test missing participants
      await expect(
        storage.createConversation({
          type: 'direct',
          createdBy: 1,
          isActive: true
        })
      ).rejects.toThrow('Participants array is required');

      // Test invalid participants
      await expect(
        storage.createConversation({
          type: 'direct',
          participants: 'invalid',
          createdBy: 1,
          isActive: true
        })
      ).rejects.toThrow('Participants array is required');

      // Test insufficient participants
      await expect(
        storage.createConversation({
          type: 'direct',
          participants: [1],
          createdBy: 1,
          isActive: true
        })
      ).rejects.toThrow('At least 2 participants required for conversation');
    });
  });

  describe('Chat Message Creation', () => {
    it('should create a chat message in a conversation', async () => {
      // Create users and conversation first
      const user1 = await storage.createUser({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      const user2 = await storage.createUser({
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      const conversation = await storage.createConversation({
        type: 'direct',
        participants: [user1.id, user2.id],
        createdBy: user1.id,
        isActive: true
      });

      // Create message
      const messageData = {
        conversationId: conversation.id,
        userId: user1.id,
        message: 'Hello, Bob!',
        type: 'text'
      };

      const message = await storage.createChatMessage(messageData);

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.conversationId).toBe(conversation.id);
      expect(message.userId).toBe(user1.id);
      expect(message.message).toBe('Hello, Bob!');
      expect(message.type).toBe('text');
      expect(message.createdAt).toBeDefined();
    });

    it('should retrieve messages for a conversation', async () => {
      // Create users and conversation
      const user1 = await storage.createUser({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      const user2 = await storage.createUser({
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@test.com',
        password: 'password123',
        role: 'Tester',
        status: 'Active'
      });

      const conversation = await storage.createConversation({
        type: 'direct',
        participants: [user1.id, user2.id],
        createdBy: user1.id,
        isActive: true
      });

      // Create multiple messages
      await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        message: 'Hello, Bob!',
        type: 'text'
      });

      await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user2.id,
        message: 'Hi Alice!',
        type: 'text'
      });

      // Retrieve messages
      const messages = await storage.getChatMessages(conversation.id);

      expect(messages).toHaveLength(2);
      expect(messages[0].message).toBe('Hello, Bob!');
      expect(messages[1].message).toBe('Hi Alice!');
    });
  });
});
