
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { storage } from '../storage';
import { registerRoutes } from '../routes';
import { logger } from '../logger';

describe('Messenger One-on-One Chat', () => {
  let app: express.Application;
  let server: any;

  beforeEach(async () => {
    // Reset storage for clean tests
    storage.resetStorage();

    // Create test app
    app = express();
    app.use(express.json());
    
    // Setup test session
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));

    // Register routes
    server = await registerRoutes(app);

    // Create test users
    await storage.createUser({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'hashedPassword123',
      role: 'Developer'
    });

    await storage.createUser({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      password: 'hashedPassword456',
      role: 'Tester'
    });

    await storage.createUser({
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob@test.com',
      password: 'hashedPassword789',
      role: 'Manager'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Direct Chat Creation', () => {
    it('should create a new direct conversation between two users', async () => {
      const agent = request.agent(app);
      
      // Mock session for user 1
      await agent
        .get('/api/auth/user')
        .set('Cookie', 'connect.sid=test-session')
        .then((res) => {
          res.request.req.session = { userId: 1, userRole: 'Developer' };
        });

      const response = await agent
        .post('/api/chats/direct')
        .set('Cookie', 'connect.sid=test-session')
        .send({ targetUserId: 2 })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('direct');
      expect(response.body.participants).toEqual([1, 2]);
      expect(response.body.name).toBe('Jane Smith');
      expect(response.body.isActive).toBe(true);

      // Verify conversation was stored
      const conversations = await storage.getUserConversations(1);
      expect(conversations).toHaveLength(1);
      expect(conversations[0].type).toBe('direct');
    });

    it('should return existing conversation if already exists', async () => {
      // Create initial conversation
      const existingConversation = await storage.createConversation({
        type: 'direct',
        name: 'Jane Smith',
        participants: [1, 2],
        createdBy: 1,
        isActive: true
      });

      const agent = request.agent(app);
      
      const response = await agent
        .post('/api/chats/direct')
        .set('Cookie', 'connect.sid=test-session')
        .send({ targetUserId: 2 });

      // Mock the session properly
      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      // Should return the existing conversation
      expect(response.body.id).toBe(existingConversation.id);
    });

    it('should reject conversation creation with self', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post('/api/chats/direct')
        .set('Cookie', 'connect.sid=test-session')
        .send({ targetUserId: 1 });

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot create conversation with yourself');
    });

    it('should reject invalid target user ID', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post('/api/chats/direct')
        .set('Cookie', 'connect.sid=test-session')
        .send({ targetUserId: 'invalid' });

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid target user ID format');
    });

    it('should reject non-existent target user', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post('/api/chats/direct')
        .set('Cookie', 'connect.sid=test-session')
        .send({ targetUserId: 999 });

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Target user not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/chats/direct')
        .send({ targetUserId: 2 })
        .expect(401);

      expect(response.body.message).toBe('Not authenticated');
    });

    it('should require targetUserId parameter', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post('/api/chats/direct')
        .set('Cookie', 'connect.sid=test-session')
        .send({});

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Target user ID is required');
    });
  });

  describe('Message Exchange', () => {
    let conversationId: number;

    beforeEach(async () => {
      // Create a conversation for testing
      const conversation = await storage.createConversation({
        type: 'direct',
        name: 'Jane Smith',
        participants: [1, 2],
        createdBy: 1,
        isActive: true
      });
      conversationId = conversation.id;
    });

    it('should send a message in direct conversation', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post(`/api/chats/${conversationId}/messages`)
        .set('Cookie', 'connect.sid=test-session')
        .send({ message: 'Hello Jane!' });

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Hello Jane!');
      expect(response.body.senderId).toBe(1);
      expect(response.body.type).toBe('text');
    });

    it('should reject empty messages', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post(`/api/chats/${conversationId}/messages`)
        .set('Cookie', 'connect.sid=test-session')
        .send({ message: '' });

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Message content is required');
    });

    it('should reject messages to non-existent conversations', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post('/api/chats/999/messages')
        .set('Cookie', 'connect.sid=test-session')
        .send({ message: 'Hello!' });

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Conversation not found');
    });

    it('should reject unauthorized message sending', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post(`/api/chats/${conversationId}/messages`)
        .set('Cookie', 'connect.sid=test-session')
        .send({ message: 'Hello!' });

      response.request.req = { session: { userId: 3, userRole: 'Manager' } }; // User 3 not in conversation
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized');
    });

    it('should retrieve conversation messages', async () => {
      // First, send some messages
      await storage.createMessage({
        conversationId: conversationId,
        senderId: 1,
        senderName: 'John Doe',
        message: 'Hello Jane!',
        type: 'text'
      });

      await storage.createMessage({
        conversationId: conversationId,
        senderId: 2,
        senderName: 'Jane Smith',
        message: 'Hi John!',
        type: 'text'
      });

      const agent = request.agent(app);
      
      const response = await agent
        .get(`/api/chats/${conversationId}/messages`)
        .set('Cookie', 'connect.sid=test-session');

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].message).toBe('Hello Jane!');
      expect(response.body[1].message).toBe('Hi John!');
    });
  });

  describe('Conversation Management', () => {
    it('should list user conversations', async () => {
      // Create multiple conversations for user 1
      await storage.createConversation({
        type: 'direct',
        name: 'Jane Smith',
        participants: [1, 2],
        createdBy: 1,
        isActive: true
      });

      await storage.createConversation({
        type: 'direct',
        name: 'Bob Wilson',
        participants: [1, 3],
        createdBy: 1,
        isActive: true
      });

      const agent = request.agent(app);
      
      const response = await agent
        .get('/api/chats')
        .set('Cookie', 'connect.sid=test-session');

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].type).toBe('direct');
      expect(response.body[1].type).toBe('direct');
    });

    it('should handle session validation for conversations list', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .get('/api/chats')
        .set('Cookie', 'connect.sid=test-session');

      response.request.req = { session: {} }; // Invalid session
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('User session invalid');
    });
  });

  describe('Real-time Chat Functionality', () => {
    it('should handle bidirectional conversation correctly', async () => {
      // Create conversation
      const conversation = await storage.createConversation({
        type: 'direct',
        name: 'Jane Smith',
        participants: [1, 2],
        createdBy: 1,
        isActive: true
      });

      // User 1 sends message
      const message1 = await storage.createMessage({
        conversationId: conversation.id,
        senderId: 1,
        senderName: 'John Doe',
        message: 'Hello Jane!',
        type: 'text'
      });

      // User 2 sends reply
      const message2 = await storage.createMessage({
        conversationId: conversation.id,
        senderId: 2,
        senderName: 'Jane Smith',
        message: 'Hi John! How are you?',
        type: 'text'
      });

      // Both users should see both messages
      const user1Messages = await storage.getChatMessages(conversation.id);
      const user2Messages = await storage.getChatMessages(conversation.id);

      expect(user1Messages).toHaveLength(2);
      expect(user2Messages).toHaveLength(2);
      
      expect(user1Messages[0].senderId).toBe(1);
      expect(user1Messages[1].senderId).toBe(2);
      expect(user2Messages[0].senderId).toBe(1);
      expect(user2Messages[1].senderId).toBe(2);
    });

    it('should maintain conversation state across multiple messages', async () => {
      const conversation = await storage.createConversation({
        type: 'direct',
        name: 'Jane Smith',
        participants: [1, 2],
        createdBy: 1,
        isActive: true
      });

      // Send multiple messages in sequence
      const messages = [
        'Hello!',
        'How are you doing?',
        'Are you free for a meeting?',
        'Let me know when you are available'
      ];

      for (const messageText of messages) {
        await storage.createMessage({
          conversationId: conversation.id,
          senderId: 1,
          senderName: 'John Doe',
          message: messageText,
          type: 'text'
        });
      }

      const retrievedMessages = await storage.getChatMessages(conversation.id);
      expect(retrievedMessages).toHaveLength(4);
      
      // Verify message order and content
      messages.forEach((messageText, index) => {
        expect(retrievedMessages[index].message).toBe(messageText);
        expect(retrievedMessages[index].senderId).toBe(1);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      // Mock storage to throw error
      const originalCreateConversation = storage.createConversation;
      storage.createConversation = vi.fn().mockRejectedValue(new Error('Database error'));

      const agent = request.agent(app);
      
      const response = await agent
        .post('/api/chats/direct')
        .set('Cookie', 'connect.sid=test-session')
        .send({ targetUserId: 2 });

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create direct chat');

      // Restore original function
      storage.createConversation = originalCreateConversation;
    });

    it('should handle invalid conversation ID gracefully', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .get('/api/chats/invalid-id/messages')
        .set('Cookie', 'connect.sid=test-session');

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };
      
      expect(response.status).toBe(200); // Should return empty array for invalid numeric ID
      expect(response.body).toEqual([]);
    });

    it('should log important events correctly', async () => {
      const loggerSpy = vi.spyOn(logger, 'info');

      const agent = request.agent(app);
      
      await agent
        .post('/api/chats/direct')
        .set('Cookie', 'connect.sid=test-session')
        .send({ targetUserId: 2 });

      response.request.req = { session: { userId: 1, userRole: 'Developer' } };

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Create direct chat request')
      );
    });
  });
});
