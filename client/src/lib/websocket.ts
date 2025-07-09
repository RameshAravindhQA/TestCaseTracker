import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '@/types';

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // Connect to the WebSocket server
      this.socket = io('/', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.emit('connection-status', { connected: true });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        this.emit('connection-status', { connected: false });
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.emit('connection-status', { connected: false, error: error.message });
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}`);
        this.reconnectAttempts = attemptNumber;
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ WebSocket reconnection failed');
        this.emit('connection-status', { connected: false, error: 'Reconnection failed' });
      });

      // Message handling
      this.socket.on('new-message', (message: ChatMessage) => {
        console.log('📩 New message received:', message);
        this.emit('message', message);
      });

      // Typing indicators
      this.socket.on('user-typing', ({ userId, userName }) => {
        console.log('✍️ User typing:', { userId, userName });
        this.emit('typing-start', { userId, userName });
      });

      this.socket.on('user-stopped-typing', ({ userId }) => {
        console.log('⏹️ User stopped typing:', userId);
        this.emit('typing-stop', { userId });
      });

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.emit('connection-status', { connected: false, error: 'Failed to connect' });
    }
  }

  public joinUser(userId: number) {
    if (this.socket?.connected) {
      this.socket.emit('join-user', userId);
      console.log(`👤 Joined user room: ${userId}`);
    }
  }

  public joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-conversation', conversationId);
      console.log(`💬 Joined conversation: ${conversationId}`);
    }
  }

  public sendMessage(conversationId: string, message: ChatMessage) {
    if (this.socket?.connected) {
      this.socket.emit('send-message', { conversationId, message });
      console.log(`📤 Sent message to conversation: ${conversationId}`);
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
    }
  }

  public startTyping(conversationId: string, userId: number, userName: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing-start', { conversationId, userId, userName });
    }
  }

  public stopTyping(conversationId: string, userId: number) {
    if (this.socket?.connected) {
      this.socket.emit('typing-stop', { conversationId, userId });
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export a singleton instance
export const websocketClient = new WebSocketClient();
export default websocketClient;