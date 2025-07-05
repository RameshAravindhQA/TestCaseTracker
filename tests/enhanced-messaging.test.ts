
import { storage } from '../server/storage';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Enhanced Messaging Features', () => {
  let user1: any, user2: any, conversation: any;

  beforeEach(async () => {
    storage.resetStorage();
    
    user1 = await storage.createUser({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@test.com',
      password: 'password123',
      role: 'User',
      status: 'Active'
    });

    user2 = await storage.createUser({
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@test.com',
      password: 'password123',
      role: 'User',
      status: 'Active'
    });

    conversation = await storage.createDirectConversation(user1.id, user2.id);
  });

  describe('File Attachments', () => {
    it('should create message with attachments', async () => {
      const attachments = [
        {
          id: 1,
          fileName: 'document.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          url: '/uploads/chat-attachments/document.pdf',
          uploadedAt: new Date().toISOString()
        }
      ];

      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Check out this document',
        type: 'text',
        attachments: attachments
      });

      expect(message.attachments).toHaveLength(1);
      expect(message.attachments[0].fileName).toBe('document.pdf');
    });

    it('should store and retrieve message attachments', async () => {
      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Image attachment',
        type: 'text',
        attachments: [
          {
            id: 1,
            fileName: 'image.jpg',
            fileType: 'image/jpeg',
            fileSize: 2048,
            url: '/uploads/chat-attachments/image.jpg',
            uploadedAt: new Date().toISOString()
          }
        ]
      });

      const attachments = await storage.getMessageAttachments(message.id);
      expect(attachments).toHaveLength(1);
      expect(attachments[0].fileName).toBe('image.jpg');
    });
  });

  describe('Reply Functionality', () => {
    it('should create message with reply reference', async () => {
      const originalMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Original message',
        type: 'text'
      });

      const replyMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user2.id,
        userName: user2.firstName,
        message: 'Reply to original',
        type: 'text',
        replyToId: originalMessage.id
      });

      expect(replyMessage.replyToId).toBe(originalMessage.id);
    });

    it('should maintain reply thread context', async () => {
      const originalMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Start of thread',
        type: 'text'
      });

      const reply1 = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user2.id,
        userName: user2.firstName,
        message: 'First reply',
        type: 'text',
        replyToId: originalMessage.id
      });

      const reply2 = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Second reply',
        type: 'text',
        replyToId: originalMessage.id
      });

      const messages = await storage.getMessagesByChat(conversation.id);
      const replies = messages.filter(msg => msg.replyToId === originalMessage.id);
      
      expect(replies).toHaveLength(2);
      expect(replies[0].message).toBe('First reply');
      expect(replies[1].message).toBe('Second reply');
    });
  });

  describe('Message Editing', () => {
    it('should allow users to edit their own messages', async () => {
      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Original message',
        type: 'text'
      });

      const updatedMessage = await storage.updateChatMessage(
        message.id,
        user1.id,
        { message: 'Edited message' }
      );

      expect(updatedMessage).not.toBeNull();
      expect(updatedMessage!.message).toBe('Edited message');
      expect(updatedMessage!.isEdited).toBe(true);
      expect(updatedMessage!.updatedAt).toBeDefined();
    });

    it('should not allow users to edit other users messages', async () => {
      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'User 1 message',
        type: 'text'
      });

      const updatedMessage = await storage.updateChatMessage(
        message.id,
        user2.id, // Different user trying to edit
        { message: 'Attempted edit' }
      );

      expect(updatedMessage).toBeNull();
    });

    it('should preserve original metadata when editing', async () => {
      const originalTimestamp = new Date().toISOString();
      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Original',
        type: 'text'
      });

      const updatedMessage = await storage.updateChatMessage(
        message.id,
        user1.id,
        { message: 'Edited' }
      );

      expect(updatedMessage!.userId).toBe(user1.id);
      expect(updatedMessage!.conversationId).toBe(conversation.id);
      expect(updatedMessage!.createdAt).toBe(message.createdAt);
    });
  });

  describe('Message Deletion', () => {
    it('should allow users to delete their own messages', async () => {
      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Message to delete',
        type: 'text'
      });

      const deleted = await storage.deleteChatMessage(message.id, user1.id);
      expect(deleted).toBe(true);

      const messages = await storage.getMessagesByChat(conversation.id);
      const deletedMessage = messages.find(msg => msg.id === message.id);
      
      expect(deletedMessage!.isDeleted).toBe(true);
      expect(deletedMessage!.message).toBe('This message was deleted');
    });

    it('should not allow users to delete other users messages', async () => {
      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Protected message',
        type: 'text'
      });

      const deleted = await storage.deleteChatMessage(message.id, user2.id);
      expect(deleted).toBe(false);
    });
  });

  describe('Unread Message Counter', () => {
    it('should track unread messages per user per conversation', async () => {
      // User 1 sends a message
      await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Hello Bob',
        type: 'text'
      });

      const unreadCount = await storage.getUnreadCount(user2.id, conversation.id);
      expect(unreadCount).toBe(1);

      // Sender should have 0 unread
      const senderUnreadCount = await storage.getUnreadCount(user1.id, conversation.id);
      expect(senderUnreadCount).toBe(0);
    });

    it('should reset unread count when conversation is marked as read', async () => {
      // Create multiple messages
      await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Message 1',
        type: 'text'
      });

      await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Message 2',
        type: 'text'
      });

      let unreadCount = await storage.getUnreadCount(user2.id, conversation.id);
      expect(unreadCount).toBe(2);

      // Mark as read
      await storage.markConversationAsRead(user2.id, conversation.id);

      unreadCount = await storage.getUnreadCount(user2.id, conversation.id);
      expect(unreadCount).toBe(0);
    });

    it('should accumulate unread count for multiple senders', async () => {
      await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'From Alice',
        type: 'text'
      });

      // Add third user
      const user3 = await storage.createUser({
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie@test.com',
        password: 'password123',
        role: 'User',
        status: 'Active'
      });

      // Create group conversation
      const groupConv = await storage.createGroupConversation(
        user1.id, 
        'Test Group', 
        'Test description', 
        [user2.id, user3.id]
      );

      await storage.createChatMessage({
        conversationId: groupConv.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Group message 1',
        type: 'text'
      });

      await storage.createChatMessage({
        conversationId: groupConv.id,
        userId: user3.id,
        userName: user3.firstName,
        message: 'Group message 2',
        type: 'text'
      });

      const unreadCount = await storage.getUnreadCount(user2.id, groupConv.id);
      expect(unreadCount).toBe(2);
    });
  });

  describe('Message Thread Management', () => {
    it('should handle complex reply chains', async () => {
      const msg1 = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Thread starter',
        type: 'text'
      });

      const msg2 = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user2.id,
        userName: user2.firstName,
        message: 'Reply to starter',
        type: 'text',
        replyToId: msg1.id
      });

      const msg3 = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Reply to reply',
        type: 'text',
        replyToId: msg2.id
      });

      const messages = await storage.getMessagesByChat(conversation.id);
      
      expect(messages).toHaveLength(3);
      expect(messages.find(m => m.id === msg2.id)!.replyToId).toBe(msg1.id);
      expect(messages.find(m => m.id === msg3.id)!.replyToId).toBe(msg2.id);
    });
  });

  describe('Message Validation', () => {
    it('should handle messages with both text and attachments', async () => {
      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: 'Here is the file you requested',
        type: 'text',
        attachments: [
          {
            id: 1,
            fileName: 'report.pdf',
            fileType: 'application/pdf',
            fileSize: 5120,
            url: '/uploads/chat-attachments/report.pdf',
            uploadedAt: new Date().toISOString()
          }
        ]
      });

      expect(message.message).toBe('Here is the file you requested');
      expect(message.attachments).toHaveLength(1);
    });

    it('should handle messages with only attachments', async () => {
      const message = await storage.createChatMessage({
        conversationId: conversation.id,
        userId: user1.id,
        userName: user1.firstName,
        message: '',
        type: 'text',
        attachments: [
          {
            id: 1,
            fileName: 'image.jpg',
            fileType: 'image/jpeg',
            fileSize: 2048,
            url: '/uploads/chat-attachments/image.jpg',
            uploadedAt: new Date().toISOString()
          }
        ]
      });

      expect(message.attachments).toHaveLength(1);
      expect(message.message).toBe('');
    });
  });

  describe('Real-time Messaging Integration', () => {
    it('should maintain message order with concurrent operations', async () => {
      const promises = [];
      
      // Simulate concurrent message creation
      for (let i = 0; i < 5; i++) {
        promises.push(
          storage.createChatMessage({
            conversationId: conversation.id,
            userId: i % 2 === 0 ? user1.id : user2.id,
            userName: i % 2 === 0 ? user1.firstName : user2.firstName,
            message: `Message ${i}`,
            type: 'text'
          })
        );
      }

      const messages = await Promise.all(promises);
      const retrievedMessages = await storage.getMessagesByChat(conversation.id);
      
      expect(retrievedMessages).toHaveLength(5);
      // Messages should be in creation order
      for (let i = 0; i < 5; i++) {
        expect(retrievedMessages[i].message).toBe(`Message ${i}`);
      }
    });
  });
});
