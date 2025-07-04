import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { storage } from './storage.js';

interface ConnectedUser {
  id: number;
  name: string;
  socketId: string;
  isOnline: boolean;
  currentChat?: number;
  lastSeen: Date;
}

interface ChatRoom {
  id: number;
  participants: number[];
  activeUsers: Set<string>;
  typingUsers: Set<number>;
}

interface ActiveCall {
  chatId: number;
  type: 'voice' | 'video';
  participants: number[];
  startTime: Date;
  status: 'ringing' | 'active' | 'ended';
}

interface SpreadsheetSession {
  id: string;
  collaborators: Set<number>;
  activeUsers: Map<number, {
    name: string;
    cursor?: { row: number; col: number };
    selection?: { startRow: number; startCol: number; endRow: number; endCol: number };
  }>;
}

export class EnhancedWebSocketServer {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, ConnectedUser>();
  private userSocketMap = new Map<number, string>();
  private chatRooms = new Map<number, ChatRoom>();
  private activeCalls = new Map<number, ActiveCall>();
  private spreadsheetSessions = new Map<string, SpreadsheetSession>();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      path: '/socket.io/'
    });

    this.setupChatNamespace();
    this.setupSpreadsheetNamespace();
    this.setupMainConnection();
  }

  private setupMainConnection() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('authenticate', async ({ userId, userName }) => {
        try {
          const user: ConnectedUser = {
            id: userId,
            name: userName,
            socketId: socket.id,
            isOnline: true,
            lastSeen: new Date()
          };

          this.connectedUsers.set(socket.id, user);
          this.userSocketMap.set(userId, socket.id);

          // Broadcast user online status
          this.broadcastUserPresence(userId, true);

          socket.emit('authenticated', { success: true });
          console.log(`User ${userName} (${userId}) authenticated`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_error', { error: 'Failed to authenticate' });
        }
      });

      socket.on('disconnect', () => {
        this.handleDisconnection(socket.id);
      });
    });
  }

  private setupChatNamespace() {
    const chatNamespace = this.io.of('/chat');

    chatNamespace.on('connection', (socket) => {
      console.log('Chat client connected:', socket.id);

      socket.on('authenticate', async ({ userId, userName, token }) => {
        try {
          // Validate token if needed
          const user: ConnectedUser = {
            id: userId,
            name: userName,
            socketId: socket.id,
            isOnline: true,
            lastSeen: new Date()
          };

          this.connectedUsers.set(socket.id, user);
          this.userSocketMap.set(userId, socket.id);

          // Join user to their chat rooms
          await this.joinUserChatRooms(socket, userId);

          socket.emit('authenticated', { success: true });
          this.broadcastUserPresence(userId, true);

          console.log(`Chat user ${userName} (${userId}) authenticated`);
        } catch (error) {
          console.error('Chat authentication error:', error);
          socket.emit('authentication_error', { error: 'Failed to authenticate' });
        }
      });

      // Message handling
      socket.on('sendMessage', async (messageData) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (!user) return;

          // Save message to database
          const message = await storage.createMessage({
            ...messageData,
            userId: user.id,
            timestamp: new Date()
          });

          // Broadcast to chat room
          const chatRoom = this.chatRooms.get(messageData.chatId);
          if (chatRoom) {
            chatRoom.activeUsers.forEach(socketId => {
              if (socketId !== socket.id) {
                this.io.to(socketId).emit('message', {
                  ...message,
                  sender: {
                    id: user.id,
                    name: user.name
                  },
                  isCurrentUser: false
                });
              }
            });
          }

          socket.emit('messageSent', { success: true, message });
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('messageError', { error: 'Failed to send message' });
        }
      });

      // Typing indicators
      socket.on('typing', ({ chatId, userId, userName }) => {
        const chatRoom = this.chatRooms.get(chatId);
        if (chatRoom) {
          chatRoom.typingUsers.add(userId);
          chatRoom.activeUsers.forEach(socketId => {
            if (socketId !== socket.id) {
              this.io.to(socketId).emit('typing', { userId, userName, chatId });
            }
          });

          // Auto-stop typing after 3 seconds
          setTimeout(() => {
            chatRoom.typingUsers.delete(userId);
            chatRoom.activeUsers.forEach(socketId => {
              if (socketId !== socket.id) {
                this.io.to(socketId).emit('stopTyping', { userId, userName, chatId });
              }
            });
          }, 3000);
        }
      });

      socket.on('stopTyping', ({ chatId, userId, userName }) => {
        const chatRoom = this.chatRooms.get(chatId);
        if (chatRoom) {
          chatRoom.typingUsers.delete(userId);
          chatRoom.activeUsers.forEach(socketId => {
            if (socketId !== socket.id) {
              this.io.to(socketId).emit('stopTyping', { userId, userName, chatId });
            }
          });
        }
      });

      // Voice and Video call handling
      socket.on('startCall', async ({ chatId, participants, type }) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (!user) return;

          const call: ActiveCall = {
            chatId,
            type,
            participants,
            startTime: new Date(),
            status: 'ringing'
          };

          this.activeCalls.set(chatId, call);

          // Notify all participants
          participants.forEach(participantId => {
            if (participantId !== user.id) {
              const participantSocketId = this.userSocketMap.get(participantId);
              if (participantSocketId) {
                this.io.to(participantSocketId).emit(`incoming${type === 'voice' ? 'Voice' : 'Video'}Call`, {
                  chatId,
                  callerId: user.id,
                  callerName: user.name,
                  participants,
                  type
                });
              }
            }
          });

          socket.emit('callStarted', { success: true, call });
        } catch (error) {
          console.error('Error starting call:', error);
          socket.emit('callError', { error: 'Failed to start call' });
        }
      });

      socket.on('acceptCall', ({ chatId }) => {
        const call = this.activeCalls.get(chatId);
        if (call) {
          call.status = 'active';
          
          // Notify all participants that call was accepted
          call.participants.forEach(participantId => {
            const participantSocketId = this.userSocketMap.get(participantId);
            if (participantSocketId) {
              this.io.to(participantSocketId).emit('callAccepted', { chatId, call });
            }
          });
        }
      });

      socket.on('rejectCall', ({ chatId }) => {
        const call = this.activeCalls.get(chatId);
        if (call) {
          call.status = 'ended';
          
          // Notify all participants that call was rejected
          call.participants.forEach(participantId => {
            const participantSocketId = this.userSocketMap.get(participantId);
            if (participantSocketId) {
              this.io.to(participantSocketId).emit('callRejected', { chatId });
            }
          });

          this.activeCalls.delete(chatId);
        }
      });

      socket.on('endCall', ({ chatId }) => {
        const call = this.activeCalls.get(chatId);
        if (call) {
          call.status = 'ended';
          
          // Notify all participants that call ended
          call.participants.forEach(participantId => {
            const participantSocketId = this.userSocketMap.get(participantId);
            if (participantSocketId) {
              this.io.to(participantSocketId).emit('callEnded', { chatId });
            }
          });

          this.activeCalls.delete(chatId);
        }
      });

      // Chat room management
      socket.on('joinChat', async ({ chatId }) => {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        user.currentChat = chatId;
        
        if (!this.chatRooms.has(chatId)) {
          this.chatRooms.set(chatId, {
            id: chatId,
            participants: [],
            activeUsers: new Set(),
            typingUsers: new Set()
          });
        }

        const chatRoom = this.chatRooms.get(chatId)!;
        chatRoom.activeUsers.add(socket.id);
        
        socket.join(`chat-${chatId}`);
        
        // Notify others that user joined
        socket.to(`chat-${chatId}`).emit('userJoinedChat', {
          userId: user.id,
          userName: user.name,
          chatId
        });
      });

      socket.on('leaveChat', ({ chatId }) => {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        const chatRoom = this.chatRooms.get(chatId);
        if (chatRoom) {
          chatRoom.activeUsers.delete(socket.id);
          chatRoom.typingUsers.delete(user.id);
        }

        socket.leave(`chat-${chatId}`);
        
        // Notify others that user left
        socket.to(`chat-${chatId}`).emit('userLeftChat', {
          userId: user.id,
          userName: user.name,
          chatId
        });
      });

      socket.on('disconnect', () => {
        this.handleChatDisconnection(socket.id);
      });
    });
  }

  private setupSpreadsheetNamespace() {
    const spreadsheetNamespace = this.io.of('/spreadsheet');

    spreadsheetNamespace.on('connection', (socket) => {
      console.log('Spreadsheet client connected:', socket.id);

      socket.on('joinSpreadsheet', ({ spreadsheetId, userId, userName }) => {
        try {
          if (!this.spreadsheetSessions.has(spreadsheetId)) {
            this.spreadsheetSessions.set(spreadsheetId, {
              id: spreadsheetId,
              collaborators: new Set(),
              activeUsers: new Map()
            });
          }

          const session = this.spreadsheetSessions.get(spreadsheetId)!;
          session.collaborators.add(userId);
          session.activeUsers.set(userId, { name: userName });

          socket.join(`spreadsheet-${spreadsheetId}`);

          // Notify other collaborators
          socket.to(`spreadsheet-${spreadsheetId}`).emit('user-joined', {
            user: { id: userId, name: userName }
          });

          // Send current collaborators to new user
          socket.emit('collaborators-update', {
            collaborators: Array.from(session.activeUsers.entries()).map(([id, data]) => ({
              id,
              ...data
            }))
          });

          console.log(`User ${userName} joined spreadsheet ${spreadsheetId}`);
        } catch (error) {
          console.error('Error joining spreadsheet:', error);
          socket.emit('join-error', { error: 'Failed to join spreadsheet' });
        }
      });

      socket.on('cursor-update', ({ spreadsheetId, cursor }) => {
        const user = this.getSpreadsheetUser(socket.id, spreadsheetId);
        if (user) {
          const session = this.spreadsheetSessions.get(spreadsheetId);
          if (session) {
            const userData = session.activeUsers.get(user.id);
            if (userData) {
              userData.cursor = cursor;
              
              socket.to(`spreadsheet-${spreadsheetId}`).emit('cursor-update', {
                userId: user.id,
                cursor
              });
            }
          }
        }
      });

      socket.on('selection-update', ({ spreadsheetId, selection }) => {
        const user = this.getSpreadsheetUser(socket.id, spreadsheetId);
        if (user) {
          const session = this.spreadsheetSessions.get(spreadsheetId);
          if (session) {
            const userData = session.activeUsers.get(user.id);
            if (userData) {
              userData.selection = selection;
              
              socket.to(`spreadsheet-${spreadsheetId}`).emit('selection-update', {
                userId: user.id,
                selection
              });
            }
          }
        }
      });

      socket.on('content-change', ({ spreadsheetId, changes }) => {
        try {
          // Broadcast changes to other collaborators
          socket.to(`spreadsheet-${spreadsheetId}`).emit('content-change', {
            changes,
            timestamp: new Date()
          });

          // Auto-save changes (debounced)
          this.scheduleSpreadsheetSave(spreadsheetId, changes);
        } catch (error) {
          console.error('Error handling content change:', error);
        }
      });

      socket.on('leaveSpreadsheet', ({ spreadsheetId, userId }) => {
        this.handleSpreadsheetLeave(socket.id, spreadsheetId, userId);
      });

      socket.on('disconnect', () => {
        this.handleSpreadsheetDisconnection(socket.id);
      });
    });
  }

  private async joinUserChatRooms(socket: any, userId: number) {
    try {
      const userChats = await storage.getUserConversations(userId);
      userChats.forEach(chat => {
        socket.join(`chat-${chat.id}`);
        
        if (!this.chatRooms.has(chat.id)) {
          this.chatRooms.set(chat.id, {
            id: chat.id,
            participants: chat.participants?.map(p => p.id) || [],
            activeUsers: new Set(),
            typingUsers: new Set()
          });
        }
      });
    } catch (error) {
      console.error('Error joining user chat rooms:', error);
    }
  }

  private broadcastUserPresence(userId: number, isOnline: boolean) {
    this.io.emit('userPresence', { userId, isOnline, timestamp: new Date() });
  }

  private handleDisconnection(socketId: string) {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      this.connectedUsers.delete(socketId);
      this.userSocketMap.delete(user.id);
      
      // Update user's last seen
      user.lastSeen = new Date();
      user.isOnline = false;
      
      // Broadcast user offline status
      this.broadcastUserPresence(user.id, false);
      
      console.log(`User ${user.name} (${user.id}) disconnected`);
    }
  }

  private handleChatDisconnection(socketId: string) {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      // Remove from all chat rooms
      this.chatRooms.forEach((chatRoom, chatId) => {
        chatRoom.activeUsers.delete(socketId);
        chatRoom.typingUsers.delete(user.id);
        
        // Notify other users in the chat
        this.io.to(`chat-${chatId}`).emit('userLeftChat', {
          userId: user.id,
          userName: user.name,
          chatId
        });
      });
      
      // Handle any active calls
      this.activeCalls.forEach((call, chatId) => {
        if (call.participants.includes(user.id)) {
          call.status = 'ended';
          call.participants.forEach(participantId => {
            const participantSocketId = this.userSocketMap.get(participantId);
            if (participantSocketId && participantSocketId !== socketId) {
              this.io.to(participantSocketId).emit('callEnded', { chatId, reason: 'user_disconnected' });
            }
          });
          this.activeCalls.delete(chatId);
        }
      });
      
      this.handleDisconnection(socketId);
    }
  }

  private handleSpreadsheetDisconnection(socketId: string) {
    // Find and remove user from all spreadsheet sessions
    this.spreadsheetSessions.forEach((session, spreadsheetId) => {
      session.activeUsers.forEach((userData, userId) => {
        // Check if this user has this socket (simplified check)
        const userSocketId = this.userSocketMap.get(userId);
        if (userSocketId === socketId) {
          this.handleSpreadsheetLeave(socketId, spreadsheetId, userId);
        }
      });
    });
  }

  private handleSpreadsheetLeave(socketId: string, spreadsheetId: string, userId: number) {
    const session = this.spreadsheetSessions.get(spreadsheetId);
    if (session) {
      session.collaborators.delete(userId);
      session.activeUsers.delete(userId);
      
      // Notify other collaborators
      this.io.to(`spreadsheet-${spreadsheetId}`).emit('user-left', { userId });
      
      // Clean up empty sessions
      if (session.collaborators.size === 0) {
        this.spreadsheetSessions.delete(spreadsheetId);
      }
    }
  }

  private getSpreadsheetUser(socketId: string, spreadsheetId: string): { id: number; name: string } | null {
    const user = this.connectedUsers.get(socketId);
    return user ? { id: user.id, name: user.name } : null;
  }

  private saveTimeouts = new Map<string, NodeJS.Timeout>();
  
  private scheduleSpreadsheetSave(spreadsheetId: string, changes: any) {
    // Clear existing timeout
    const existingTimeout = this.saveTimeouts.get(spreadsheetId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new save after 2 seconds of inactivity
    const timeout = setTimeout(async () => {
      try {
        // TODO: Implement actual spreadsheet saving logic
        console.log(`Auto-saving spreadsheet ${spreadsheetId}`);
        this.saveTimeouts.delete(spreadsheetId);
      } catch (error) {
        console.error('Error auto-saving spreadsheet:', error);
      }
    }, 2000);

    this.saveTimeouts.set(spreadsheetId, timeout);
  }

  public getConnectedUsers(): ConnectedUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUsersInChat(chatId: number): ConnectedUser[] {
    const chatRoom = this.chatRooms.get(chatId);
    if (!chatRoom) return [];

    return Array.from(chatRoom.activeUsers).map(socketId => 
      this.connectedUsers.get(socketId)!
    ).filter(Boolean);
  }

  public getActiveCall(chatId: number): ActiveCall | undefined {
    return this.activeCalls.get(chatId);
  }

  public getSpreadsheetCollaborators(spreadsheetId: string): any[] {
    const session = this.spreadsheetSessions.get(spreadsheetId);
    if (!session) return [];

    return Array.from(session.activeUsers.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }
}

let enhancedWebSocketServer: EnhancedWebSocketServer | null = null;

export function initializeEnhancedWebSocket(httpServer: HTTPServer): EnhancedWebSocketServer {
  enhancedWebSocketServer = new EnhancedWebSocketServer(httpServer);
  return enhancedWebSocketServer;
}

export function getEnhancedWebSocketServer(): EnhancedWebSocketServer | null {
  return enhancedWebSocketServer;
}