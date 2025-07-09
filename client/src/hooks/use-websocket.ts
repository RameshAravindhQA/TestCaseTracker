
import { useEffect, useState, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types';

interface WebSocketStatus {
  connected: boolean;
  error?: string;
}

interface OnlineUser {
  id: number;
  name: string;
  avatar?: string;
  lastSeen?: Date;
}

interface Conversation {
  id: string;
  participants: number[];
  type: 'direct' | 'group';
  name: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export function useWebSocket(userId?: number) {
  const [status, setStatus] = useState<WebSocketStatus>({ connected: false });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize Socket.IO connection
    try {
      // @ts-ignore
      const socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
        auth: {
          userId: userId
        }
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ WebSocket connected successfully');
        setStatus({ connected: true });
        
        // Join user's personal room
        socket.emit('join-user', userId);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setStatus({ connected: false });
      });

      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setStatus({ connected: false, error: error.message });
      });

      // Handle incoming messages
      socket.on('new-message', (message: ChatMessage) => {
        console.log('📩 New message received:', message);
        setMessages(prev => [...prev, message]);
        
        // Update conversation last message
        setConversations(prev => prev.map(conv => 
          conv.id === message.conversationId 
            ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + 1 }
            : conv
        ));
      });

      // Handle conversation updates
      socket.on('conversation-created', (conversation: Conversation) => {
        console.log('💬 New conversation created:', conversation);
        setConversations(prev => [conversation, ...prev]);
      });

      socket.on('conversation-updated', (conversation: Conversation) => {
        console.log('🔄 Conversation updated:', conversation);
        setConversations(prev => prev.map(conv => 
          conv.id === conversation.id ? conversation : conv
        ));
      });

      // Handle typing indicators
      socket.on('user-typing', ({ conversationId, userId: typingUserId, userName }) => {
        console.log('✍️ User typing:', { conversationId, typingUserId, userName });
        setTypingUsers(prev => new Set(prev).add(userName));
      });

      socket.on('user-stopped-typing', ({ conversationId, userId: typingUserId, userName }) => {
        console.log('⏹️ User stopped typing:', { conversationId, typingUserId, userName });
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userName);
          return newSet;
        });
      });

      // Handle online users
      socket.on('users-online', (users: OnlineUser[]) => {
        console.log('👥 Online users updated:', users);
        setOnlineUsers(users);
      });

      socket.on('user-online', (user: OnlineUser) => {
        console.log('🟢 User came online:', user);
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.id === user.id);
          if (exists) return prev;
          return [...prev, user];
        });
      });

      socket.on('user-offline', (user: OnlineUser) => {
        console.log('🔴 User went offline:', user);
        setOnlineUsers(prev => prev.filter(u => u.id !== user.id));
      });

      // Handle message delivery status
      socket.on('message-delivered', ({ messageId, conversationId }) => {
        console.log('✅ Message delivered:', messageId);
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'delivered' } : msg
        ));
      });

      socket.on('message-read', ({ messageId, conversationId, readBy }) => {
        console.log('👁️ Message read:', messageId, 'by:', readBy);
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        ));
      });

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socket.disconnect();
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setStatus({ connected: false, error: 'Failed to connect' });
    }
  }, [userId]);

  const sendMessage = useCallback((conversationId: string, message: string, type: 'text' | 'image' | 'file' = 'text', attachments?: string[]) => {
    if (socketRef.current?.connected && userId) {
      const messageData = {
        id: Date.now(),
        conversationId,
        userId,
        message,
        type,
        attachments,
        timestamp: new Date().toISOString(),
        status: 'sending'
      };

      socketRef.current.emit('send-message', messageData);
      console.log(`📤 Sent message to conversation: ${conversationId}`);
      
      // Optimistically add message to local state
      setMessages(prev => [...prev, messageData as ChatMessage]);
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected or user not authenticated');
    }
  }, [userId]);

  const createDirectConversation = useCallback((targetUserId: number, targetUserName: string) => {
    if (socketRef.current?.connected && userId) {
      socketRef.current.emit('create-direct-conversation', {
        userId,
        targetUserId,
        targetUserName
      });
      console.log(`💬 Creating direct conversation with user: ${targetUserId}`);
    }
  }, [userId]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-conversation', conversationId);
      console.log(`📥 Joined conversation: ${conversationId}`);
      
      // Mark conversation as read (reset unread count)
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ));
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-conversation', conversationId);
      console.log(`📤 Left conversation: ${conversationId}`);
    }
  }, []);

  const startTyping = useCallback((conversationId: string, userName: string) => {
    if (socketRef.current?.connected && userId) {
      socketRef.current.emit('typing-start', { conversationId, userId, userName });
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(conversationId, userName);
      }, 3000);
    }
  }, [userId]);

  const stopTyping = useCallback((conversationId: string, userName: string) => {
    if (socketRef.current?.connected && userId) {
      socketRef.current.emit('typing-stop', { conversationId, userId, userName });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [userId]);

  const markMessageAsRead = useCallback((messageId: number, conversationId: string) => {
    if (socketRef.current?.connected && userId) {
      socketRef.current.emit('mark-message-read', { messageId, conversationId, userId });
    }
  }, [userId]);

  const getConversationMessages = useCallback((conversationId: string) => {
    return messages.filter(msg => msg.conversationId === conversationId);
  }, [messages]);

  return {
    // Connection status
    status,
    isConnected: status.connected,
    
    // Data
    messages,
    conversations,
    onlineUsers,
    typingUsers: Array.from(typingUsers),
    
    // Actions
    sendMessage,
    createDirectConversation,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    markMessageAsRead,
    
    // Utilities
    getConversationMessages,
    socket: socketRef.current
  };
}
