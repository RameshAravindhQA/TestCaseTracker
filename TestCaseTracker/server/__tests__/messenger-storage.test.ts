
import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../storage';

describe('Messenger Storage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    storage.resetStorage();
  });

  describe('Conversation Management', () => {
    it('should create a new conversation', async () => {
      const conversationData = {
        type: 'project',
        name: 'Project Chat',
        participants: [1, 2],
        projectId: 1
      };

      const conversation = await storage.createConversation(conversationData);

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.type).toBe('project');
      expect(conversation.name).toBe('Project Chat');
      expect(conversation.participants).toEqual([1, 2]);
      expect(conversation.createdAt).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
    });

    it('should create a direct conversation between two users', async () => {
      const conversation = await storage.createDirectConversation(1, 2);

      expect(conversation).toBeDefined();
      expect(conversation.type).toBe('direct');
      expect(conversation.participants).toContain(1);
      expect(conversation.participants).toContain(2);
    });

    it('should return existing direct conversation if it already exists', async () => {
      const firstConversation = await storage.createDirectConversation(1, 2);
      const secondConversation = await storage.createDirectConversation(1, 2);

      expect(firstConversation.id).toBe(secondConversation.id);
    });

    it('should get user conversations', async () => {
      const conversation1 = await storage.createConversation({
        type: 'project',
        name: 'Project 1',
        participants: [1, 2],
        projectId: 1
      });

      const conversation2 = await storage.createConversation({
        type: 'project',
        name: 'Project 2',
        participants: [1, 3],
        projectId: 2
      });

      const userConversations = await storage.getUserConversations(1);

      expect(userConversations).toHaveLength(2);
      expect(userConversations.map(c => c.id)).toContain(conversation1.id);
      expect(userConversations.map(c => c.id)).toContain(conversation2.id);
    });
  });

  describe('Message Management', () => {
    let conversationId: number;

    beforeEach(async () => {
      const conversation = await storage.createConversation({
        type: 'project',
        name: 'Test Project',
        participants: [1, 2],
        projectId: 1
      });
      conversationId = conversation.id;
    });

    it('should create a chat message', async () => {
      const messageData = {
        conversationId: conversationId,
        userId: 1,
        userName: 'Test User',
        message: 'Hello World!',
        type: 'text'
      };

      const message = await storage.createChatMessage(messageData);

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.conversationId).toBe(conversationId);
      expect(message.userId).toBe(1);
      expect(message.userName).toBe('Test User');
      expect(message.message).toBe('Hello World!');
      expect(message.type).toBe('text');
      expect(message.timestamp).toBeDefined();
      expect(message.createdAt).toBeDefined();
    });

    it('should throw error when required fields are missing', async () => {
      const invalidMessageData = {
        userId: 1,
        message: 'Hello'
        // missing conversationId
      };

      await expect(storage.createChatMessage(invalidMessageData))
        .rejects.toThrow('Missing required fields: conversationId, userId, or message');
    });

    it('should retrieve chat messages for a conversation', async () => {
      // Create multiple messages
      const messages = [];
      for (let i = 1; i <= 5; i++) {
        const message = await storage.createChatMessage({
          conversationId: conversationId,
          userId: 1,
          userName: 'Test User',
          message: `Message ${i}`,
          type: 'text'
        });
        messages.push(message);
      }

      const retrievedMessages = await storage.getChatMessages(conversationId);

      expect(retrievedMessages).toHaveLength(5);
      expect(retrievedMessages[0].message).toBe('Message 1');
      expect(retrievedMessages[4].message).toBe('Message 5');
    });

    it('should limit number of messages retrieved', async () => {
      // Create 10 messages
      for (let i = 1; i <= 10; i++) {
        await storage.createChatMessage({
          conversationId: conversationId,
          userId: 1,
          userName: 'Test User',
          message: `Message ${i}`,
          type: 'text'
        });
      }

      const retrievedMessages = await storage.getChatMessages(conversationId, 3);

      expect(retrievedMessages).toHaveLength(3);
      // Should get the last 3 messages
      expect(retrievedMessages[0].message).toBe('Message 8');
      expect(retrievedMessages[2].message).toBe('Message 10');
    });

    it('should handle empty conversation gracefully', async () => {
      const messages = await storage.getChatMessages(conversationId);
      expect(messages).toHaveLength(0);
    });

    it('should handle invalid conversation ID', async () => {
      const messages = await storage.getChatMessages(9999);
      expect(messages).toHaveLength(0);
    });
  });

  describe('Message Persistence', () => {
    let conversationId: number;

    beforeEach(async () => {
      const conversation = await storage.createConversation({
        type: 'project',
        name: 'Test Project',
        participants: [1, 2],
        projectId: 1
      });
      conversationId = conversation.id;
    });

    it('should persist messages across multiple operations', async () => {
      // Create a message
      const message1 = await storage.createChatMessage({
        conversationId: conversationId,
        userId: 1,
        userName: 'User 1',
        message: 'First message',
        type: 'text'
      });

      // Retrieve messages
      let messages = await storage.getChatMessages(conversationId);
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe('First message');

      // Create another message
      const message2 = await storage.createChatMessage({
        conversationId: conversationId,
        userId: 2,
        userName: 'User 2',
        message: 'Second message',
        type: 'text'
      });

      // Retrieve messages again
      messages = await storage.getChatMessages(conversationId);
      expect(messages).toHaveLength(2);
      expect(messages[0].message).toBe('First message');
      expect(messages[1].message).toBe('Second message');
    });

    it('should maintain message order', async () => {
      const messageTexts = ['First', 'Second', 'Third', 'Fourth'];
      
      for (const text of messageTexts) {
        await storage.createChatMessage({
          conversationId: conversationId,
          userId: 1,
          userName: 'Test User',
          message: text,
          type: 'text'
        });
      }

      const messages = await storage.getChatMessages(conversationId);
      
      expect(messages).toHaveLength(4);
      for (let i = 0; i < messageTexts.length; i++) {
        expect(messages[i].message).toBe(messageTexts[i]);
      }
    });
  });

  describe('Multiple Conversations', () => {
    it('should handle messages in different conversations separately', async () => {
      // Create two conversations
      const conv1 = await storage.createConversation({
        type: 'project',
        name: 'Project 1',
        participants: [1, 2],
        projectId: 1
      });

      const conv2 = await storage.createConversation({
        type: 'project',
        name: 'Project 2',
        participants: [1, 3],
        projectId: 2
      });

      // Add messages to each conversation
      await storage.createChatMessage({
        conversationId: conv1.id,
        userId: 1,
        userName: 'User 1',
        message: 'Message in project 1',
        type: 'text'
      });

      await storage.createChatMessage({
        conversationId: conv2.id,
        userId: 1,
        userName: 'User 1',
        message: 'Message in project 2',
        type: 'text'
      });

      // Verify messages are separate
      const conv1Messages = await storage.getChatMessages(conv1.id);
      const conv2Messages = await storage.getChatMessages(conv2.id);

      expect(conv1Messages).toHaveLength(1);
      expect(conv2Messages).toHaveLength(1);
      expect(conv1Messages[0].message).toBe('Message in project 1');
      expect(conv2Messages[0].message).toBe('Message in project 2');
    });
  });

  describe('Message Read Status', () => {
    it('should mark message as read', async () => {
      const conversation = await storage.createConversation({
        type: 'project',
        name: 'Test Project',
        participants: [1, 2],
        projectId: 1
      });

      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: 1,
        userName: 'User 1',
        message: 'Test message',
        type: 'text'
      });

      // Mark as read - should not throw error
      await expect(storage.markMessageAsRead(message.id, 2)).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle string conversation ID in createChatMessage', async () => {
      const conversation = await storage.createConversation({
        type: 'project',
        name: 'Test Project',
        participants: [1, 2],
        projectId: 1
      });

      const message = await storage.createChatMessage({
        conversationId: conversation.id.toString(), // Pass as string
        userId: 1,
        userName: 'Test User',
        message: 'Test message',
        type: 'text'
      });

      expect(message.conversationId).toBe(conversation.id);
    });

    it('should handle string user ID in createChatMessage', async () => {
      const conversation = await storage.createConversation({
        type: 'project',
        name: 'Test Project',
        participants: [1, 2],
        projectId: 1
      });

      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: '1', // Pass as string
        userName: 'Test User',
        message: 'Test message',
        type: 'text'
      });

      expect(message.userId).toBe(1);
    });

    it('should handle missing optional fields', async () => {
      const conversation = await storage.createConversation({
        type: 'project',
        name: 'Test Project',
        participants: [1, 2],
        projectId: 1
      });

      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: 1,
        message: 'Test message'
        // Missing userName, type, mentionedUsers, attachments
      });

      expect(message.userName).toBe('Anonymous');
      expect(message.type).toBe('text');
      expect(message.mentionedUsers).toEqual([]);
      expect(message.attachments).toEqual([]);
      expect(message.isEdited).toBe(false);
    });
  });
});
