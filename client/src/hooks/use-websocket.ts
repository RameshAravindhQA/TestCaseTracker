
import { useEffect, useState, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types';

interface WebSocketStatus {
  connected: boolean;
  error?: string;
}

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>({ connected: false });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    try {
      // @ts-ignore
      const socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        path: '/socket.io'
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ WebSocket connected successfully');
        setStatus({ connected: true });
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setStatus({ connected: false });
      });

      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setStatus({ connected: false, error: error.message });
      });

      // Message handling
      socket.on('new-message', (message: ChatMessage) => {
        console.log('📩 New message received:', message);
        setMessages(prev => [...prev, message]);
      });

      // Typing indicators
      socket.on('user-typing', ({ userId, userName }) => {
        console.log('✍️ User typing:', { userId, userName });
        setTypingUsers(prev => new Set(prev).add(userName));
      });

      socket.on('user-stopped-typing', ({ userId }) => {
        console.log('⏹️ User stopped typing:', userId);
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          // Note: We'd need to maintain a userId -> userName mapping to properly remove
          return newSet;
        });
      });

      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setStatus({ connected: false, error: 'Failed to connect' });
    }
  }, []);

  const sendMessage = useCallback((conversationId: string, message: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-message', { conversationId, message });
      console.log(`📤 Sent message to conversation: ${conversationId}`);
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
    }
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-conversation', conversationId);
      console.log(`💬 Joined conversation: ${conversationId}`);
    }
  }, []);

  const joinUser = useCallback((userId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-user', userId);
      console.log(`👤 Joined user room: ${userId}`);
    }
  }, []);

  const startTyping = useCallback((conversationId: string, userId: number, userName: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing-start', { conversationId, userId, userName });
    }
  }, []);

  const stopTyping = useCallback((conversationId: string, userId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing-stop', { conversationId, userId });
    }
  }, []);

  return {
    status,
    messages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    joinConversation,
    joinUser,
    startTyping,
    stopTyping,
    isConnected: status.connected,
    socket: socketRef.current
  };
}
