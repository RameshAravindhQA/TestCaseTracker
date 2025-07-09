import { useEffect, useState, useCallback } from 'react';
import { websocketClient } from '@/lib/websocket';
import { ChatMessage } from '@/types';

interface WebSocketStatus {
  connected: boolean;
  error?: string;
}

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>({ connected: false });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Connection status handler
    const handleConnectionStatus = (statusData: WebSocketStatus) => {
      setStatus(statusData);
    };

    // Message handler
    const handleMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    };

    // Typing handlers
    const handleTypingStart = ({ userId, userName }: { userId: number; userName: string }) => {
      setTypingUsers(prev => new Set(prev).add(userName));
    };

    const handleTypingStop = ({ userId }: { userId: number }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        // Remove user from typing (we'd need to track userId -> userName mapping)
        return newSet;
      });
    };

    // Register event listeners
    websocketClient.on('connection-status', handleConnectionStatus);
    websocketClient.on('message', handleMessage);
    websocketClient.on('typing-start', handleTypingStart);
    websocketClient.on('typing-stop', handleTypingStop);

    // Cleanup
    return () => {
      websocketClient.off('connection-status', handleConnectionStatus);
      websocketClient.off('message', handleMessage);
      websocketClient.off('typing-start', handleTypingStart);
      websocketClient.off('typing-stop', handleTypingStop);
    };
  }, []);

  const sendMessage = useCallback((conversationId: string, message: ChatMessage) => {
    websocketClient.sendMessage(conversationId, message);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    websocketClient.joinConversation(conversationId);
  }, []);

  const joinUser = useCallback((userId: number) => {
    websocketClient.joinUser(userId);
  }, []);

  const startTyping = useCallback((conversationId: string, userId: number, userName: string) => {
    websocketClient.startTyping(conversationId, userId, userName);
  }, []);

  const stopTyping = useCallback((conversationId: string, userId: number) => {
    websocketClient.stopTyping(conversationId, userId);
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
    isConnected: status.connected
  };
}