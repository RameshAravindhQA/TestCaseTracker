
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { storage } from '../storage';

describe('Chat API Integration', () => {
  beforeEach(() => {
    // Reset storage before each test
    (storage as any).resetStorage();
  });

  describe('POST /api/chat/messages', () => {
    it('should create a chat message successfully', async () => {
      const messageData = {
        projectId: 1,
        userId: 1,
        userName: 'Test User',
        message: 'Hello, World!',
        type: 'text',
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .send(messageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.message).toBe('Hello, World!');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        projectId: 1,
        // Missing userId and message
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/chat/messages')
        .send('invalid json')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('should validate content-type header', async () => {
      const messageData = {
        projectId: 1,
        userId: 1,
        userName: 'Test User',
        message: 'Hello, World!',
        type: 'text',
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .send(messageData);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /api/chat/messages/:projectId', () => {
    it('should fetch chat messages for a project', async () => {
      // First create a message
      const messageData = {
        projectId: 1,
        userId: 1,
        userName: 'Test User',
        message: 'Test message',
        type: 'text',
      };

      await request(app)
        .post('/api/chat/messages')
        .send(messageData)
        .expect(200);

      // Then fetch messages
      const response = await request(app)
        .get('/api/chat/messages/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].message).toBe('Test message');
    });

    it('should return empty array for non-existent project', async () => {
      const response = await request(app)
        .get('/api/chat/messages/999')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle invalid project ID', async () => {
      const response = await request(app)
        .get('/api/chat/messages/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid project ID');
    });

    it('should respect limit parameter', async () => {
      // Create multiple messages
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/chat/messages')
          .send({
            projectId: 1,
            userId: 1,
            userName: 'Test User',
            message: `Message ${i}`,
            type: 'text',
          });
      }

      const response = await request(app)
        .get('/api/chat/messages/1?limit=3')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage to throw error
      const originalCreateChatMessage = storage.createChatMessage;
      storage.createChatMessage = () => {
        throw new Error('Storage error');
      };

      const response = await request(app)
        .post('/api/chat/messages')
        .send({
          projectId: 1,
          userId: 1,
          userName: 'Test User',
          message: 'Test message',
          type: 'text',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create chat message');
      expect(response.body.details).toBe('Storage error');

      // Restore original method
      storage.createChatMessage = originalCreateChatMessage;
    });
  });
});
