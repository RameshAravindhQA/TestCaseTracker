import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('Messenger Chat Functionality', () => {
  beforeEach(async () => {
    // Initialize with clean storage
  });

  it('should create a conversation between two users', async () => {
    // Create test users
    const user1 = await storage.createUser({
      firstName: 'User',
      lastName: 'One',
      email: 'user1@test.com',
      password: 'password123',
      role: 'Developer'
    });

    const user2 = await storage.createUser({
      firstName: 'User',
      lastName: 'Two',
      email: 'user2@test.com',
      password: 'password123',
      role: 'Tester'
    });

    // Create conversation
    const conversationData = {
      type: 'direct',
      title: 'Direct Chat',
      participants: [user1.id, user2.id],
      createdBy: user1.id,
      isActive: true
    };

    const conversation = await storage.createConversation(conversationData);

    expect(conversation).toBeDefined();
    expect(conversation.id).toBeDefined();
    expect(conversation.participants).toContain(user1.id);
    expect(conversation.participants).toContain(user2.id);
  });

  it('should retrieve conversation by ID', async () => {
    const conversationData = {
      type: 'direct',
      title: 'Test Chat',
      participants: [1, 2],
      createdBy: 1,
      isActive: true
    };

    const created = await storage.createConversation(conversationData);
    const retrieved = await storage.getConversation(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(created.id);
  });

  it('should send and retrieve messages', async () => {
    const conversationData = {
      type: 'direct',
      title: 'Message Test',
      participants: [1, 2],
      createdBy: 1,
      isActive: true
    };

    const conversation = await storage.createConversation(conversationData);

    const messageData = {
      conversationId: conversation.id,
      senderId: 1,
      senderName: 'Test User',
      content: 'Hello, this is a test message!',
      type: 'text'
    };

    const message = await storage.createMessage(messageData);

    expect(message).toBeDefined();
    expect(message.content).toBe('Hello, this is a test message!');
    expect(message.conversationId).toBe(conversation.id);
  });

  it('should get user conversations', async () => {
    const conversationData = {
      type: 'direct',
      title: 'User Conversations Test',
      participants: [1, 2],
      createdBy: 1,
      isActive: true
    };

    await storage.createConversation(conversationData);
    const userConversations = await storage.getUserConversations(1);

    expect(userConversations).toBeDefined();
    expect(Array.isArray(userConversations)).toBe(true);
  });
});