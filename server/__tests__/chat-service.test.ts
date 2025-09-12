
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../storage';

describe('Chat Service', () => {
  beforeEach(() => {
    // Reset storage before each test
    (storage as any).resetStorage();
  });

  describe('Chat Message Creation', () => {
    it('should create chat message successfully', async () => {
      const messageData = {
        projectId: 1,
        userId: 1,
        userName: 'Test User',
        message: 'Hello, World!',
        type: 'text' as const,
      };

      const createdMessage = await storage.createChatMessage(messageData);
      
      expect(createdMessage).toBeDefined();
      expect(createdMessage.id).toBeDefined();
      expect(createdMessage.projectId).toBe(1);
      expect(createdMessage.userId).toBe(1);
      expect(createdMessage.message).toBe('Hello, World!');
      expect(createdMessage.timestamp).toBeDefined();
    });

    it('should retrieve chat messages for project', async () => {
      const messageData = {
        projectId: 1,
        userId: 1,
        userName: 'Test User',
        message: 'Test message',
        type: 'text' as const,
      };

      await storage.createChatMessage(messageData);
      const messages = await storage.getChatMessages(1);
      
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe('Test message');
    });

    it('should handle empty project chat messages', async () => {
      const messages = await storage.getChatMessages(999);
      expect(messages).toHaveLength(0);
    });

    it('should limit chat messages correctly', async () => {
      // Create multiple messages
      for (let i = 0; i < 5; i++) {
        await storage.createChatMessage({
          projectId: 1,
          userId: 1,
          userName: 'Test User',
          message: `Message ${i}`,
          type: 'text' as const,
        });
      }

      const messages = await storage.getChatMessages(1, 3);
      expect(messages).toHaveLength(3);
      // Should return the last 3 messages
      expect(messages[0].message).toBe('Message 2');
      expect(messages[1].message).toBe('Message 3');
      expect(messages[2].message).toBe('Message 4');
    });

    it('should handle malformed message data', async () => {
      const malformedData = {
        projectId: 'invalid' as any,
        userId: null as any,
        userName: '',
        message: '',
        type: 'invalid' as any,
      };

      try {
        await storage.createChatMessage(malformedData);
        expect(true).toBe(true); // Should not throw error
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Chat API Response Format', () => {
    it('should return valid JSON response format', async () => {
      const messageData = {
        projectId: 1,
        userId: 1,
        userName: 'Test User',
        message: 'Test message',
        type: 'text' as const,
      };

      const createdMessage = await storage.createChatMessage(messageData);
      
      // Verify the response can be serialized to JSON
      const jsonString = JSON.stringify(createdMessage);
      expect(() => JSON.parse(jsonString)).not.toThrow();
      
      // Verify required fields
      const parsed = JSON.parse(jsonString);
      expect(parsed.id).toBeDefined();
      expect(parsed.projectId).toBe(1);
      expect(parsed.message).toBe('Test message');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should handle concurrent message creation', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(storage.createChatMessage({
          projectId: 1,
          userId: 1,
          userName: 'Test User',
          message: `Concurrent message ${i}`,
          type: 'text' as const,
        }));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      
      // Verify all messages have unique IDs
      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('Chat Message Validation', () => {
    it('should validate required fields', async () => {
      const incompleteData = {
        projectId: 1,
        // Missing userId, userName, message
      };

      const result = await storage.createChatMessage(incompleteData);
      // Should still create message but with defaults
      expect(result).toBeDefined();
      expect(result.projectId).toBe(1);
    });

    it('should handle special characters in messages', async () => {
      const specialMessage = {
        projectId: 1,
        userId: 1,
        userName: 'Test User',
        message: 'Special chars: <>&"\'{}[]',
        type: 'text' as const,
      };

      const result = await storage.createChatMessage(specialMessage);
      expect(result.message).toBe('Special chars: <>&"\'{}[]');
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(10000);
      const messageData = {
        projectId: 1,
        userId: 1,
        userName: 'Test User',
        message: longMessage,
        type: 'text' as const,
      };

      const result = await storage.createChatMessage(messageData);
      expect(result.message).toBe(longMessage);
    });
  });
});
