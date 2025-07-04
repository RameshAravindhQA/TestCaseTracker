import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageCircle, Users, Settings, Plus, Search, UserPlus, Hash, Lock, RotateCcw, Paperclip, Reply, Edit, Trash2, Download, X, Check, MoreVertical, Pin, Volume2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";
import { User } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  avatar: string;
  isOnline: boolean;
}

interface ChatUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface Chat {
  id: number;
  name: string;
  type: 'direct' | 'group';
  description?: string;
  participants: ChatUser[];
  lastMessage?: string;
  unreadCount?: number;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  userId: number;
  userName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'system';
  replyToId?: number;
  attachments?: Attachment[];
  isEdited?: boolean;
  isDeleted?: boolean;
  readBy?: number[];
}

interface Attachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: string;
}

export function Messenger() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Enhanced debugging state
  const [debugInfo, setDebugInfo] = useState({
    componentMounted: false,
    authChecked: false,
    userLoaded: false,
    initialLoadComplete: false,
    wsConnected: false,
    dataLoaded: false
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'users'>(() => {
    try {
      const saved = localStorage.getItem('messenger_activeTab');
      return saved ? saved as 'chats' | 'users' : 'chats';
    } catch {
      return 'chats';
    }
  });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupDescription, setEditingGroupDescription] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const updateGroupChat = async (chatId: number, updates: { name?: string; description?: string }) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedChat = await response.json();
        setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));
        if (selectedChat && selectedChat.id === chatId) {
          setSelectedChat(updatedChat);
        }
        toast({
          title: "Success",
          description: "Group updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive"
      });
    }
  };

  const addGroupMember = async (chatId: number, userId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const updatedChat = await response.json();
        setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));
        if (selectedChat && selectedChat.id === chatId) {
          setSelectedChat(updatedChat);
        }
        toast({
          title: "Success",
          description: "Member added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive"
      });
    }
  };

  const removeGroupMember = async (chatId: number, userId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/members/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedChat = await response.json();
        setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));
        if (selectedChat && selectedChat.id === chatId) {
          setSelectedChat(updatedChat);
        }
        toast({
          title: "Success",
          description: "Member removed successfully"
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const deleteGroupChat = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (selectedChat && selectedChat.id === chatId) {
          setSelectedChat(null);
          setMessages([]);
        }
        toast({
          title: "Success",
          description: "Group deleted successfully"
        });
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive"
      });
    }
  };

    const leaveGroup = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        // Refresh chats after leaving the group
        loadChats();
        setSelectedChat(null);
        setMessages([]);
        toast({
          title: "Success",
          description: "Left group successfully"
        });
      } else {
        throw new Error('Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive"
      });
    }
  };

    const loadAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: selectedChat.id })
      });

      if (response.ok) {
        const usersData = await response.json();
        setAvailableUsers(usersData);
      } else {
        console.log(`Available Users API returned ${response.status}`);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.log('Error loading available users:', error.message);
      setAvailableUsers([]);
    }
  };

  // Enhanced initialization with better auth handling
  useEffect(() => {
    const initializeData = async () => {
      console.log('🔄 MESSENGER INIT: Starting initialization');
      console.log('🔄 MESSENGER AUTH STATE:', {
        user: user ? { id: user.id, email: user.email, firstName: user.firstName } : null,
        authLoading,
        isAuthenticated,
        hasInitialLoad,
        localStorage: {
          auth: localStorage.getItem('isAuthenticated'),
          user: localStorage.getItem('user') ? 'present' : 'none',
          chats: localStorage.getItem('messenger_chats') ? 'present' : 'none',
          selectedChat: localStorage.getItem('messenger_selectedChat') ? 'present' : 'none'
        }
      });
      
      setDebugInfo(prev => ({ 
        ...prev, 
        componentMounted: true, 
        authChecked: true,
        userLoaded: !!user 
      }));
      
      // Don't wait for authLoading if we have stored auth data
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');
      const hasStoredAuth = storedAuth === 'true' && storedUser;
      
      if (authLoading && !hasStoredAuth) {
        console.log('🔄 MESSENGER AUTH: Still loading and no stored auth, waiting...');
        return;
      }
      
      // If we have stored auth but no user yet, proceed with initialization
      if (!user && hasStoredAuth) {
        console.log('🔄 MESSENGER AUTH: No API user yet but have stored auth, proceeding with stored data');
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('📦 MESSENGER: Using stored user data temporarily:', parsedUser.firstName);
        } catch (error) {
          console.warn('⚠️ MESSENGER: Failed to parse stored user, waiting for API');
          return;
        }
      }
      
      if (!user && !hasStoredAuth) {
        console.log('❌ MESSENGER AUTH: No user and no stored auth');
        setIsLoading(false);
        setHasInitialLoad(true);
        return;
      }

      console.log('Initializing messenger for user:', user.firstName || user.email);
      setIsLoading(true);

      try {
        // Restore state from localStorage first
        console.log('Restoring state from localStorage...');
        
        const savedChatStr = localStorage.getItem('messenger_selectedChat');
        const savedChatsStr = localStorage.getItem('messenger_chats');
        const savedActiveTab = localStorage.getItem('messenger_activeTab');
        
        if (savedChatsStr) {
          try {
            const parsedChats = JSON.parse(savedChatsStr);
            if (Array.isArray(parsedChats)) {
              setChats(parsedChats);
              console.log('Restored chats from localStorage:', parsedChats.length);
            }
          } catch (error) {
            console.warn('Failed to parse saved chats:', error);
          }
        }
        
        if (savedActiveTab) {
          setActiveTab(savedActiveTab as 'chats' | 'users');
        }
        
        if (savedChatStr) {
          try {
            const savedChat = JSON.parse(savedChatStr);
            if (savedChat && savedChat.id) {
              console.log('Restoring selected chat:', savedChat.id);
              setSelectedChat(savedChat);
              
              // Restore messages for this chat
              const savedMessages = localStorage.getItem(`messenger_messages_${savedChat.id}`);
              if (savedMessages) {
                try {
                  const parsedMessages = JSON.parse(savedMessages);
                  if (Array.isArray(parsedMessages)) {
                    setMessages(parsedMessages);
                    console.log('Restored', parsedMessages.length, 'messages for chat', savedChat.id);
                  }
                } catch (error) {
                  console.warn('Failed to parse saved messages:', error);
                }
              }
            }
          } catch (error) {
            console.warn('Failed to parse saved chat:', error);
          }
        }
        
        // Load fresh data from API
        console.log('Loading fresh data from API...');
        const [usersResult, chatsResult] = await Promise.allSettled([
          loadUsers().catch(error => {
            console.warn('Users loading failed:', error);
            return [];
          }),
          loadChats().catch(error => {
            console.warn('Chats loading failed:', error);
            return [];
          })
        ]);

        // Process results
        if (usersResult.status === 'fulfilled' && Array.isArray(usersResult.value)) {
          setUsers(usersResult.value);
          console.log('Users loaded successfully:', usersResult.value.length);
        } else {
          console.warn('Failed to load users, using empty array');
          setUsers([]);
        }

        if (chatsResult.status === 'fulfilled' && Array.isArray(chatsResult.value)) {
          setChats(chatsResult.value);
          localStorage.setItem('messenger_chats', JSON.stringify(chatsResult.value));
          console.log('Chats loaded successfully:', chatsResult.value.length);
        }

        // Refresh messages for selected chat if we have one
        if (savedChatStr) {
          try {
            const savedChat = JSON.parse(savedChatStr);
            if (savedChat && savedChat.id) {
              console.log('Refreshing messages for selected chat:', savedChat.id);
              setTimeout(() => {
                loadMessages(savedChat.id).catch(error => {
                  console.warn('Failed to refresh messages for chat', savedChat.id, ':', error);
                });
              }, 300);
            }
          } catch (error) {
            console.warn('Failed to refresh messages:', error);
          }
        }

        // Connect WebSocket after state restoration
        if (user) {
          setTimeout(connectWebSocket, 500);
        }

      } catch (error) {
        console.error('Critical error initializing messenger:', error);
      } finally {
        setIsLoading(false);
        setHasInitialLoad(true);
        console.log('Messenger initialization complete');
      }
    };

    // Add small delay to ensure component is fully mounted
    const timer = setTimeout(initializeData, 100);
    return () => clearTimeout(timer);
  }, [user])

    // Separate WebSocket connection effect to avoid conflicts
  useEffect(() => {
    // Only connect WebSocket after initial load is complete
    if (user && hasInitialLoad && !wsRef.current) {
      console.log('Connecting WebSocket after initialization...');
      const timer = setTimeout(connectWebSocket, 500);
      return () => clearTimeout(timer);
    }
    
    return () => {
      // Cleanup WebSocket connection
      if (wsRef.current) {
        console.log('Cleaning up WebSocket connection');
        wsRef.current.close();
        wsRef.current = null;
      }
      // Clear typing indicators
      setTypingUsers([]);
    };
  }, [user, hasInitialLoad]);

  // Enhanced state persistence with real-time updates
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('messenger_selectedChat', JSON.stringify(selectedChat));
    }
  }, [selectedChat]);

  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      localStorage.setItem(`messenger_messages_${selectedChat.id}`, JSON.stringify(messages));
    }
  }, [messages, selectedChat]);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('messenger_chats', JSON.stringify(chats));
    }
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('messenger_activeTab', activeTab);
  }, [activeTab]);

  // Handle component unmount cleanup
  useEffect(() => {
    return () => {
      console.log('Messenger component unmounting, preserving state...');
      // Final state save on unmount
      if (selectedChat) {
        localStorage.setItem('messenger_selectedChat', JSON.stringify(selectedChat));
        if (messages.length > 0) {
          localStorage.setItem(`messenger_messages_${selectedChat.id}`, JSON.stringify(messages));
        }
      }
      if (chats.length > 0) {
        localStorage.setItem('messenger_chats', JSON.stringify(chats));
      }
      localStorage.setItem('messenger_activeTab', activeTab);
      
      // Cleanup WebSocket but don't destroy connection completely
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('Preserving WebSocket connection for future use');
        // Don't close WebSocket, just clean up listeners
      }
    };
  }, [selectedChat, messages, chats, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('messenger_selectedChat', JSON.stringify(selectedChat));
  }, [selectedChat]);

  useEffect(() => {
    localStorage.setItem('messenger_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('messenger_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem(`messenger_messages_${selectedChat.id}`, JSON.stringify(messages));
    }
  }, [messages, selectedChat]);

  const connectWebSocket = () => {
    if (!user) {
      console.log('WebSocket connection skipped: No user authenticated');
      return;
    }

    // Don't create new connection if one already exists and is working
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, reusing existing connection');
      setIsConnected(true);
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat`;
      console.log('Attempting WebSocket connection:', wsUrl, 'for user:', user.firstName);

      const ws = new WebSocket(wsUrl);
      let connectionTimeout: NodeJS.Timeout;

      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        console.log('WebSocket connection timeout');
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setIsConnected(false);
        }
      }, 15000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected successfully for user:', user.firstName);
        setIsConnected(true);

        // Send authentication with a small delay to ensure connection is ready
        setTimeout(() => {
          try {
            if (ws.readyState === WebSocket.OPEN) {
              const authMessage = {
                type: 'authenticate',
                data: {
                  userId: user.id,
                  userName: user.firstName || user.email || 'User'
                }
              };
              console.log('Sending authentication:', authMessage);
              ws.send(JSON.stringify(authMessage));
              
              // Rejoin selected conversation if we have one
              if (selectedChat) {
                setTimeout(() => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                      type: 'join_conversation',
                      data: { conversationId: selectedChat.id }
                    }));
                    console.log('Rejoined conversation:', selectedChat.id);
                  }
                }, 200);
              }
            }
          } catch (error) {
            console.warn('Error sending authentication:', error);
            setIsConnected(false);
          }
        }, 200);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.warn('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket error - continuing in demo mode:', error);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);

        // Only try to reconnect if user is still authenticated and not a normal closure
        if (event.code !== 1000 && user && wsRef.current === ws && hasInitialLoad) {
          console.log('Scheduling WebSocket reconnection...');
          setTimeout(() => {
            if (user && hasInitialLoad) { // Double-check user is still authenticated
              console.log('Attempting to reconnect WebSocket...');
              connectWebSocket();
            }
          }, 5000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.log('WebSocket not available - using demo mode:', error);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'authenticated':
        console.log('WebSocket authenticated');
        updateUserPresence(data.onlineUsers || []);
        break;
      case 'new_message':
        if (data.message) {
          const newMessage = {
            id: data.message.id || data.message.messageId,
            userId: data.message.userId,
            userName: data.message.userName || data.message.user?.firstName || data.message.user?.name || 'Unknown',
            message: data.message.message,
            timestamp: data.message.timestamp || data.message.createdAt || new Date().toISOString(),
            type: 'text',
            replyToId: data.message.replyToId,
            attachments: data.message.attachments || [],
            isEdited: data.message.isEdited || false,
            isDeleted: data.message.isDeleted || false
          };

          console.log('Received new message via WebSocket:', newMessage, 'for conversation:', data.message.conversationId);

          // Add message to current conversation if it matches
          if (selectedChat && selectedChat.id === data.message.conversationId) {
            setMessages(prev => {
              // More robust duplicate checking
              const exists = prev.some(msg => {
                // Check by ID first
                if (String(msg.id) === String(newMessage.id)) {
                  return true;
                }

                // Check by content and user within a time window
                const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime());
                if (msg.message === newMessage.message && 
                    msg.userId === newMessage.userId && 
                    timeDiff < 5000) { // 5 second window
                  return true;
                }

                return false;
              });

              if (exists) {
                console.log('Message already exists, skipping duplicate');
                return prev;
              }

              console.log('Adding new message to current conversation');
              return [...prev, newMessage];
            });
          }

          // Update chat's last message and unread count with proper logic
          setChats(prev => prev.map(chat => {
            if (chat.id === data.message.conversationId) {
              const isFromCurrentUser = newMessage.userId === user?.id;
              const isCurrentChat = selectedChat && selectedChat.id === chat.id;

              let newUnreadCount = chat.unreadCount || 0;
              
              // Only increment unread count if:
              // 1. Message is not from current user
              // 2. The chat is not currently selected/active
              if (!isFromCurrentUser && !isCurrentChat) {
                newUnreadCount = newUnreadCount + 1;
              } else if (isCurrentChat) {
                // Reset unread count if this is the active chat
                newUnreadCount = 0;
              }

              return {
                ...chat,
                lastMessage: newMessage.message,
                unreadCount: newUnreadCount,
                timestamp: new Date(newMessage.timestamp)
              };
            }
            return chat;
          }));

          // Show toast notification for messages from other users in different chats
          if (newMessage.userId !== user?.id && (!selectedChat || selectedChat.id !== data.message.conversationId)) {
            toast({
              title: "New Message",
              description: `${newMessage.userName}: ${newMessage.message}`,
            });
          }
        }
        break;
      case 'message_edited':
        if (data.message && selectedChat && selectedChat.id === data.message.conversationId) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.message.id 
              ? { ...msg, message: data.message.message, isEdited: true, timestamp: data.message.updatedAt }
              : msg
          ));
        }
        break;
      case 'message_deleted':
        if (data.messageId && selectedChat) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, message: "This message was deleted", isDeleted: true }
              : msg
          ));
        }
        break;
      case 'message_sent':
        // Confirmation that message was sent successfully
        console.log('Message sent confirmation:', data);

        // Update the optimistic message with real ID if available
        if (data.messageId && data.conversationId === selectedChat?.id) {
          setMessages(prev => prev.map(msg => {
            // Find the most recent temporary message from this user
            if (typeof msg.id === 'number' && msg.id > Date.now() - 10000 && msg.userId === user?.id) {
              return {
                ...msg,
                id: data.messageId,
                timestamp: data.timestamp || msg.timestamp
              };
            }
            return msg;
          }));
        }
        break;
      case 'user_typing':
        if (data.conversationId === selectedChat?.id) {
          if (data.isTyping) {
            setTypingUsers(prev => [...prev.filter(name => name !== data.userName), data.userName]);
          } else {
            setTypingUsers(prev => prev.filter(name => name !== data.userName));
          }
        }
        break;
      case 'presence_update':
        if (Array.isArray(data.presence)) {
          updateUserPresence(data.presence);
        } else {
          updateSingleUserPresence(data.userId, data.isOnline);
        }
        break;
      case 'user_registered':
        toast({
          title: "New User Joined!",
          description: `${data.userName} has joined the platform`,
        });
        loadUsers(); // Refresh user list
        break;
      case 'conversation_joined':
        console.log('Joined conversation:', data.conversationId);
        break;
      case 'user_joined':
        if (data.conversationId === selectedChat?.id) {
          toast({
            title: "User Joined",
            description: `${data.userName} joined the conversation`,
          });
        }
        break;
      case 'user_left':
        if (data.conversationId === selectedChat?.id) {
          toast({
            title: "User Left",
            description: `${data.userName} left the conversation`,
          });
        }
        break;
      case 'error':
        console.error('WebSocket error:', data.error);
        toast({
          title: "Connection Error",
          description: data.error,
          variant: "destructive"
        });
        break;
    }
  };

  const updateUserPresence = (presenceData: any[]) => {
    setUsers(prev => prev.map(user => {
      const presence = presenceData.find(p => p.userId === user.id);
      return {
        ...user,
        isOnline: presence?.isOnline || false,
        lastSeen: presence?.lastSeen || user.lastSeen
      };
    }));
  };

  const updateSingleUserPresence = (userId: number, isOnline: boolean) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isOnline } : user
    ));
  };

  const loadChats = async () => {
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const chatsData = await response.json();
        setChats(chatsData);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users for messenger...');
      const response = await fetch('/api/users/public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const usersData = await response.json();
        console.log('Raw users data received:', usersData);
        
        if (Array.isArray(usersData)) {
          // Process users to ensure proper display names
          const processedUsers = usersData.map(user => ({
            ...user,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User'
          }));
          
          setUsers(processedUsers);
          console.log('Loaded and processed users for messenger:', processedUsers.length);
          return processedUsers;
        } else {
          console.log('No valid users array returned from API');
          setUsers([]);
          return [];
        }
      } else {
        console.log(`Users API returned ${response.status}: ${response.statusText}`);
        setUsers([]);
        return [];
      }
    } catch (error) {
      console.log('Error loading users:', error.message);
      setUsers([]);
      return [];
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      // Clear typing indicators when switching chats
      setTypingUsers([]);

      console.log('Loading messages for chat:', chatId);
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        console.log('Loaded messages from API:', messagesData);

        // Ensure messages have proper user names and timestamps
        const enhancedMessages = messagesData.map(msg => ({
          ...msg,
          id: msg.id || msg.messageId,
          userId: msg.userId,
          userName: msg.userName || msg.user?.name || msg.user?.firstName || 'User',
          message: msg.message,
          timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
          type: msg.type || 'text',
          replyToId: msg.replyToId || null,
          attachments: msg.attachments || [],
          isEdited: msg.isEdited || false,
          isDeleted: msg.isDeleted || false
        }));

        console.log('Enhanced messages:', enhancedMessages);
        setMessages(enhancedMessages);

        // Join conversation via WebSocket for real-time updates
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log('Joining conversation via WebSocket:', chatId);
          wsRef.current.send(JSON.stringify({
            type: 'join_conversation',
            data: { conversationId: chatId }
          }));
        } else {
          console.log('WebSocket not ready, will join when connected');
        }

        // Mark conversation as read and reset unread count
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        ));

        // Persist unread count reset
        const updatedChats = chats.map(chat => 
          chat.id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        );
        localStorage.setItem('messenger_chats', JSON.stringify(updatedChats));

      } else {
        console.log('Failed to load messages, starting with empty chat. Response:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);

      // Still try to join conversation via WebSocket even if API fails
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'join_conversation',
          data: { conversationId: chatId }
        }));
        console.log('Joined conversation via WebSocket (fallback):', chatId);
      }
    }
  };

  const startDirectChat = async (targetUser: User) => {
    if (!targetUser || !targetUser.id) {
      console.error('Invalid target user:', targetUser);
      return;
    }

    // Ensure we have a proper name for the user
    const userName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || 
                    targetUser.email || 
                    'Unknown User';

    console.log('Starting direct chat with user:', { ...targetUser, displayName: userName });

    // Check if direct chat already exists
    const existingChat = chats.find(chat => 
      chat.type === 'direct' && 
      chat.participants.some(p => p.id === targetUser.id)
    );

    if (existingChat) {
      console.log('Found existing chat:', existingChat);
      setSelectedChat(existingChat);
      loadMessages(existingChat.id);
      setActiveTab('chats');
      return;
    }

    // Create demo chat immediately with proper name
    const demoChat: Chat = {
      id: Date.now(),
      name: userName,
      type: 'direct',
      participants: [{
        ...targetUser,
        name: userName
      }],
      lastMessage: '',
      unreadCount: 0,
      createdAt: new Date().toISOString()
    };

    setChats(prev => [...prev, demoChat]);
    setSelectedChat(demoChat);
    setMessages([]);
    setActiveTab('chats');

    // Try API call in background
    try {
      const response = await fetch('/api/chats/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetUser.id })
      });

      if (response.ok) {
        const chat = await response.json();
        // Ensure the chat has the correct name
        const updatedChat = {
          ...chat,
          name: chat.name || userName,
          participants: chat.participants.map(p => ({
            ...p,
            name: p.name || (p.id === targetUser.id ? userName : p.email || 'User')
          }))
        };
        setChats(prev => prev.map(c => c.id === demoChat.id ? updatedChat : c));
        setSelectedChat(updatedChat);
        loadMessages(updatedChat.id);
      }
    } catch (error) {
      console.log('API not available, using demo chat:', error);
    }
  };

  const createGroupChat = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast({
        title: "Invalid Input",
        description: "Group name and at least one participant are required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create optimistic group chat first
      const optimisticChat: Chat = {
        id: Date.now(),
        name: groupName.trim(),
        type: 'group',
        description: groupDescription.trim(),
        participants: selectedUsers.map(userId => {
          const foundUser = users.find(u => u.id === userId);
          return {
            id: userId,
            name: foundUser?.name || foundUser?.email || 'User',
            email: foundUser?.email || '',
            isOnline: foundUser?.isOnline || false
          };
        }),
        lastMessage: '',
        unreadCount: 0,
        createdAt: new Date().toISOString()
      };

      // Add current user to participants
      optimisticChat.participants.push({
        id: user.id,
        name: user.firstName || user.email || 'You',
        email: user.email || '',
        isOnline: true
      });

      setChats(prev => [...prev, optimisticChat]);
      setSelectedChat(optimisticChat);
      setMessages([]);
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);

      const response = await fetch('/api/chats/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim(),
          participants: [...selectedUsers, user.id] // Include current user
        })
      });

      if (response.ok) {
        const chat = await response.json();
        // Replace optimistic chat with real one
        setChats(prev => prev.map(c => c.id === optimisticChat.id ? chat : c));
        setSelectedChat(chat);
        loadMessages(chat.id);

        toast({
          title: "Success",
          description: "Group created successfully"
        });
      } else {
        throw new Error('Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      // Remove optimistic chat on failure
      setChats(prev => prev.filter(c => c.id !== Date.now()));
      setSelectedChat(null);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedChat || !user) {
      console.log('Cannot send message: missing requirements');
      return;
    }

    const messageToSend = newMessage.trim();
    console.log('Sending message:', messageToSend, 'to chat:', selectedChat.id);

    // Ensure WebSocket is connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected, attempting to reconnect...');
      connectWebSocket();
      
      // Show user feedback
      toast({
        title: "Connecting...",
        description: "Establishing connection to send your message",
      });
      
      // Wait a moment for connection then try again
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          handleSendMessage();
        } else {
          toast({
            title: "Connection failed",
            description: "Unable to send message. Please try again.",
            variant: "destructive"
          });
        }
      }, 2000);
      return;
    }

    const tempId = Date.now();

    // Create optimistic message for immediate UI update
    const optimisticMessage: ChatMessage = {
      id: tempId,
      userId: user.id,
      userName: user.firstName || user.email || 'You',
      message: messageToSend,
      timestamp: new Date().toISOString(),
      type: 'text',
      replyToId: replyToMessage?.id || null,
      attachments: [],
      isEdited: false,
      isDeleted: false
    };

    // Clear input immediately
    setNewMessage('');
    setSelectedFiles([]);
    setReplyToMessage(null);

    // Add message to UI immediately
    setMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      console.log('Added optimistic message, total messages:', newMessages.length);
      return newMessages;
    });
    
    // Update chat's last message immediately
    setChats(prev => prev.map(chat => 
      chat.id === selectedChat.id 
        ? { 
            ...chat, 
            lastMessage: messageToSend,
            timestamp: new Date(),
            unreadCount: 0
          }
        : chat
    ));

    // Handle file uploads first if any
    let attachments: Attachment[] = [];
    if (selectedFiles.length > 0) {
      try {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('conversationId', selectedChat.id.toString());

          const uploadResponse = await fetch('/api/upload/attachment', {
            method: 'POST',
            body: formData
          });

          if (uploadResponse.ok) {
            const attachment = await uploadResponse.json();
            attachments.push(attachment);
          }
        }
      } catch (error) {
        console.error('File upload failed:', error);
        toast({
          title: "File upload failed",
          description: "Some files couldn't be uploaded",
          variant: "destructive"
        });
      }
    }

    // Create message data
    const messageData = {
      conversationId: selectedChat.id,
      message: messageToSend || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ''),
      replyToId: replyToMessage?.id || null,
      attachments: attachments,
      userId: user.id,
      userName: user.firstName || user.email || 'You'
    };

    // Send via WebSocket
    let messageDelivered = false;
    
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'send_message',
          data: messageData
        }));
        console.log('Message sent via WebSocket');
        messageDelivered = true;
      } else {
        throw new Error('WebSocket not available');
      }
    } catch (wsError) {
      console.warn('WebSocket send failed, falling back to API:', wsError);
      
      // Fallback to API
      try {
        const response = await fetch(`/api/chats/${selectedChat.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData)
        });

        if (response.ok) {
          const savedMessage = await response.json();
          console.log('Message sent via API:', savedMessage);
          
          // Replace optimistic message with real one
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...savedMessage, id: savedMessage.id }
              : msg
          ));
          messageDelivered = true;
        } else {
          throw new Error(`API request failed with status: ${response.status}`);
        }
      } catch (apiError) {
        console.error('Failed to send message via API:', apiError);
      }
    }

    if (!messageDelivered) {
      console.error('Message delivery failed completely');
      // Remove optimistic message on failure and restore input
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageToSend);
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    }
  };

  const sendViaAPI = async (messageToSend: string, messageData: any) => {
    try {
      const response = await fetch(`/api/chats/${selectedChat!.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const savedMessage = await response.json();
        console.log('Message saved to database:', savedMessage);

        // Add the message to local state
        const displayMessage: ChatMessage = {
          id: savedMessage.id,
          userId: savedMessage.userId,
          userName: savedMessage.userName,
          message: savedMessage.message,
          timestamp: savedMessage.timestamp || savedMessage.createdAt,
          type: 'text'
        };

        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(msg => msg.id === displayMessage.id);
          if (exists) return prev;
          return [...prev, displayMessage];
        });

        // Update chat's last message
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat!.id 
            ? { ...chat, lastMessage: messageToSend }
            : chat
        ));

      } else {
        throw new Error('Failed to send message via API');
      }
    } catch (error) {
      console.error('API message sending failed:', error);
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleEditSubmit();
      } else {
        handleSendMessage();
      }
    } else if (e.key === 'Escape') {
      handleCancelEdit();
      setReplyToMessage(null);
    }
  };

  const handleEditMessage = (message: ChatMessage) => {
    // Check if current user can edit this message
    if (message.userId !== user?.id) {
      toast({
        title: "Not authorized",
        description: "You can only edit your own messages",
        variant: "destructive"
      });
      return;
    }
    setEditingMessage(message);
    setEditText(message.message);
  };

  const handleEditSubmit = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      let editSuccess = false;

      // Try WebSocket first
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'edit_message',
          data: {
            messageId: editingMessage.id,
            newMessage: editText.trim()
          }
        }));
        editSuccess = true;
      } else {
        // Fallback to API
        const response = await fetch(`/api/chat/messages/${editingMessage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: editText.trim() })
        });

        if (response.ok) {
          editSuccess = true;
        }
      }

      if (editSuccess) {
        // Optimistically update the message
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, message: editText.trim(), isEdited: true }
            : msg
        ));

        setEditingMessage(null);
        setEditText('');
      } else {
        throw new Error('Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Failed to edit message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!wsRef.current) return;

    try {
      wsRef.current.send(JSON.stringify({
        type: 'delete_message',
        data: { messageId }
      }));

      // Optimistically mark as deleted
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, message: "This message was deleted", isDeleted: true }
          : msg
      ));
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Failed to delete message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getReplyToMessage = (replyToId: number) => {
    return messages.find(msg => msg.id === replyToId);
  };


  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !wsRef.current) return;

    const messageData = {
      type: 'send_message',
      data: {
        conversationId: selectedChat.id,
        message: newMessage.trim()
      }
    };

    wsRef.current.send(JSON.stringify(messageData));
    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (chat.name && chat.name.toLowerCase().includes(query)) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(query)) ||
      (chat.participants && chat.participants.some(p => 
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query))
      ))
    );
  });

  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const displayName = user.name || 
                       `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                       user.email || 
                       'Unknown User';
    return (
      displayName.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  });

  // Enhanced debug logging function
  const logDebugInfo = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      component: 'Messenger',
      auth: {
        user: user ? { id: user.id, email: user.email, firstName: user.firstName } : null,
        authLoading,
        isAuthenticated,
        hasInitialLoad
      },
      data: {
        chatsCount: chats.length,
        usersCount: users.length,
        messagesCount: messages.length,
        selectedChatId: selectedChat?.id,
        isLoading
      },
      connectivity: {
        isConnected,
        wsState: wsRef.current?.readyState,
        wsStateText: wsRef.current?.readyState === 0 ? 'CONNECTING' : 
                     wsRef.current?.readyState === 1 ? 'OPEN' :
                     wsRef.current?.readyState === 2 ? 'CLOSING' :
                     wsRef.current?.readyState === 3 ? 'CLOSED' : 'UNKNOWN'
      },
      localStorage: {
        auth: localStorage.getItem('isAuthenticated'),
        user: localStorage.getItem('user') ? 'present' : 'none',
        selectedChat: localStorage.getItem('messenger_selectedChat') ? 'present' : 'none',
        chats: localStorage.getItem('messenger_chats') ? 'present' : 'none',
        activeTab: localStorage.getItem('messenger_activeTab')
      },
      debugInfo,
      route: window.location.pathname
    };
    
    console.log('🐛 MESSENGER DEBUG STATE:', debugData);
    
    // Also log to a global debug object for easier inspection
    if (typeof window !== 'undefined') {
      (window as any).messengerDebug = debugData;
      console.log('💾 Debug data saved to window.messengerDebug');
    }
    
    return debugData;
  };

  // Enhanced authentication guard with better fallback handling
  if (!user && !authLoading && hasInitialLoad && !isAuthenticated) {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    
    // If we have stored auth but no user context, show a different message
    if (storedAuth === 'true' && storedUser) {
      console.log('⚠️ MESSENGER: Auth state mismatch detected, showing recovery options');
      
      return (
        <div className="flex h-full bg-gray-50">
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Auth Recovery
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={logDebugInfo}
                    title="Debug Info"
                  >
                    🐛
                  </Button>
                </div>
              </div>
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Restoring Session</h3>
                <p className="text-gray-600 mb-4 text-sm">Reconnecting your authentication...</p>
                <Button 
                  onClick={() => {
                    console.log('🔄 MESSENGER: Force reload attempt');
                    window.location.reload();
                  }}
                  size="sm"
                  variant="outline"
                >
                  Refresh Now
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Restoring Messenger</h3>
              <p className="text-gray-500">Please wait while we restore your session...</p>
            </div>
          </div>
        </div>
      );
    }
    
    console.log('❌ MESSENGER: User not authenticated, showing login prompt');
    
    return (
      <div className="flex h-full bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">
                  Not Authenticated
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logDebugInfo}
                  title="Debug Info"
                >
                  🐛
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                disabled
                className="pl-9"
              />
            </div>
          </div>

          {/* Empty state */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Please Log In</h3>
              <p className="text-gray-600 mb-4 text-sm">You need to be logged in to access the messenger.</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    console.log('🔄 MESSENGER: Manual auth refresh attempt');
                    // Try to refresh auth state
                    window.location.reload();
                  }}
                  size="sm"
                  variant="outline"
                >
                  Refresh Page
                </Button>
                <Button 
                  onClick={() => {
                    console.log('🔄 MESSENGER: Clearing auth and redirecting to login');
                    // Clear any stale auth data
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('isAuthenticated');
                    window.location.href = '/login';
                  }}
                  size="sm"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to Messenger</h3>
            <p className="text-gray-500">Please log in to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  // If user exists but no users loaded, show better loading state
  if (user && users.length === 0 && isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Messenger</h3>
            <p className="text-gray-600">Setting up your conversations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while initial data is being fetched
  if (isLoading && user) {
      return (
        <div className="flex flex-col h-screen bg-gray-50">
          <div className="flex items-center justify-center h-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Messenger</p>
              <p className="text-sm text-gray-500">Setting up your conversations...</p>
              <p className="text-xs text-gray-400 mt-2">
                Welcome, {user?.firstName || user?.email || 'User'}
              </p>
              <Button 
                onClick={() => {
                  console.log('Force loading complete due to timeout');
                  setIsLoading(false);
                  setHasInitialLoad(true);
                }}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Continue Anyway
              </Button>
            </motion.div>
          </div>
        </div>
      );
  }

  // Show welcome state with proper chat interface layout
  if (users.length === 0 && !isLoading) {
    console.log('Showing welcome state for user:', user?.firstName, 'hasInitialLoad:', hasInitialLoad);
    return (
      <div className="flex h-full bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <div className="flex items-center space-x-2">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Online" : "Offline"}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                className="flex-1 py-1 px-3 text-sm rounded-md bg-white text-gray-900 shadow-sm"
              >
                <MessageCircle className="h-4 w-4 inline mr-1" />
                Chats
              </button>
              <button
                className="flex-1 py-1 px-3 text-sm rounded-md text-gray-600"
              >
                <Users className="h-4 w-4 inline mr-1" />
                People
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Welcome content */}
          <div className="flex-1 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <MessageCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Messenger</h3>
              <p className="text-gray-600 text-sm mb-4">
                Connect with other users on the platform. Once other users register, you'll be able to chat with them here.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Getting Started:</strong> Other users need to register to start messaging.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
            <p className="text-sm text-gray-400 mt-4">
              Welcome, {user?.firstName || user?.email || 'User'}!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Online" : "Offline"}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logDebugInfo}
                title="Debug Info"
              >
                🐛
              </Button>
              <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                    <Textarea
                      placeholder="Group description (optional)"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                    />
                    <div>
                      <p className="text-sm font-medium mb-2">Select Members:</p>
                      <ScrollArea className="h-40">
                        {users.map(user => (
                          <div key={user.id} className="flex items-center space-x-2 p-2">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers(prev => [...prev, user.id]);
                                } else {
                                  setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                }
                              }}
                            />
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name}</span>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                    <Button onClick={createGroupChat} className="w-full">
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-1 px-3 text-sm rounded-md transition-colors ${
                activeTab === 'chats' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="h-4 w-4 inline mr-1" />
              Chats
            </button>
            <button
              onClick={() => {
                console.log('People tab clicked, current users:', users.length);
                setActiveTab('users');
                // Force refresh users when People tab is clicked if no users loaded
                if (users.length === 0) {
                  console.log('No users loaded, refreshing...');
                  loadUsers();
                }
              }}
              className={`flex-1 py-1 px-3 text-sm rounded-md transition-colors ${
                activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              People ({users.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={activeTab === 'chats' ? 'Search conversations...' : 'Search people...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {activeTab === 'chats' ? (
              filteredChats.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'No chats found' : 'No chats yet'}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedChat(chat);
                      loadMessages(chat.id);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {chat.type === 'group' ? <Hash className="h-5 w-5" /> : getInitials(chat.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate flex items-center">
                            {chat.name}
                            {chat.type === 'group' && <Users className="h-3 w-3 ml-1 text-gray-400" />}
                          </h3>
                          {chat.unreadCount && chat.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate flex-1">
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {new Date().toLocaleDateString() === new Date(Date.now()).toLocaleDateString() 
                                ? new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : new Date(Date.now()).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {chat.type === 'group' && (
                          <p className="text-xs text-gray-400">{chat.participants.length} members</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'No users found' : users.length === 0 ? 'Loading users...' : 'No users available'}
                  </p>
                  {!searchQuery && users.length === 0 && (
                    <div className="mt-4">
                      <Button 
                        onClick={() => {
                          console.log('Retrying user load...');
                          loadUsers();
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Refresh Users
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                filteredUsers.map((chatUser) => {
                  const displayName = chatUser.name || 
                                    `${chatUser.firstName || ''} ${chatUser.lastName || ''}`.trim() || 
                                    chatUser.email || 
                                    'Unknown User';

                  return (
                    <div
                      key={chatUser.id}
                      className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        console.log('Clicked on user:', chatUser);
                        // Ensure we have a complete user object with proper name
                        const userObj = {
                          ...chatUser,
                          name: displayName
                        };
                        startDirectChat(userObj);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gray-100 text-gray-600">
                              {getInitials(displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            chatUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{displayName}</h3>
                          <p className="text-xs text-gray-500 truncate">{chatUser.email}</p>
                          <p className="text-xs text-gray-400">
                            {chatUser.isOnline ? 'Online' : `Last seen ${chatUser.lastSeen ? new Date(chatUser.lastSeen).toLocaleDateString() : 'unknown'}`}
                          </p>
                        </div>
                        <UserPlus className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedChat.type === 'group' ? <Hash className="h-4 w-4" /> : getInitials(selectedChat.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    {selectedChat.name}
                    {selectedChat.type === 'group' && <Users className="h-3 w-3 ml-1 text-gray-400" />}
                  </h3>
                  {selectedChat.type === 'group' && selectedChat.description && (
                    <p className="text-xs text-gray-500">{selectedChat.description}</p>
                  )}
                  {typingUsers.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </p>
                  )}
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {selectedChat.type === 'group' && (
                        <DropdownMenuItem onClick={() => {
                          setShowGroupManagement(true);
                          loadAvailableUsers();
                        }}>
                          <Users className="h-4 w-4 mr-2" />
                          Manage Group
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Pin className="h-4 w-4 mr-2" />
                        {selectedChat.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Volume2 className="h-4 w-4 mr-2" />
                        {selectedChat.isMuted ? 'Unmute' : 'Mute'}
                      </DropdownMenuItem>
                      {selectedChat.type === 'group' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => leaveGroup(selectedChat.id)}
                            className="text-orange-600"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Leave Group
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteGroupChat(selectedChat.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Group
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Group Management Dialog */}
                  <Dialog open={showGroupManagement} onOpenChange={setShowGroupManagement}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Manage Group: {selectedChat.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Group Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Group Name</label>
                            <Input
                              value={editingGroupName || selectedChat.name}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              placeholder="Group name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Total Members</label>
                            <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                              {selectedChat.participants.length} members
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            value={editingGroupDescription || selectedChat.description || ''}
                            onChange={(e) => setEditingGroupDescription(e.target.value)}
                            placeholder="Group description"
                            className="mt-1"
                          />
                        </div>

                        {/* Current Members */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Current Members ({selectedChat.participants.length})</label>
                          <ScrollArea className="h-40 border rounded p-3">
                            <div className="space-y-2">
                              {selectedChat.participants.map(participant => (
                                <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {getInitials(participant.name || participant.email || 'U')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{participant.name || participant.email}</span>
                                    {participant.id === user?.id && (
                                      <Badge variant="secondary" className="text-xs">You</Badge>
                                    )}
                                  </div>
                                  {participant.id !== user?.id && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => removeGroupMember(selectedChat.id, participant.id)}
                                      className="h-7 px-2"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Available Users to Add */}
                        {availableUsers.length > 0 && (
                          <div>
                            <label className="text-sm font-medium mb-2 block">Add Members ({availableUsers.length} available)</label>
                            <ScrollArea className="h-32 border rounded p-3">
                              <div className="space-y-2">
                                {availableUsers.map(availableUser => (
                                  <div key={availableUser.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                          {getInitials(availableUser.name || availableUser.email || 'U')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">{availableUser.name || availableUser.email}</span>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => addGroupMember(selectedChat.id, availableUser.id)}
                                      className="h-7 px-2"
                                    >
                                      <UserPlus className="h-3 w-3 mr-1" />
                                      Add
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button 
                            onClick={() => {
                              if (editingGroupName || editingGroupDescription) {
                                updateGroupChat(selectedChat.id, {
                                  name: editingGroupName || selectedChat.name,
                                  description: editingGroupDescription || selectedChat.description
                                });
                              }
                              setShowGroupManagement(false);
                              setEditingGroupName('');
                              setEditingGroupDescription('');
                            }}
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Update Group
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setShowGroupManagement(false);
                              setEditingGroupName('');
                              setEditingGroupDescription('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.userId === user.id;
                    const replyToMsg = message.replyToId ? getReplyToMessage(message.replyToId) : null;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`flex space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <Avatar className="h-6 w-6 mt-auto">
                            <AvatarFallback className="text-xs bg-gray-100">
                              {getInitials(message.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="relative">
                            {/* Reply context */}
                            {replyToMsg && (
                              <div className={`text-xs p-2 mb-1 rounded border-l-2 ${
                                isCurrentUser 
                                  ? 'bg-blue-100 border-blue-300' 
                                  : 'bg-gray-100 border-gray-300'
                              }`}>
                                <p className="font-medium text-gray-600">{replyToMsg.userName}</p>
                                <p className="text-gray-500 truncate">{replyToMsg.message}</p>
                              </div>
                            )}

                            {/* Main message */}
                            <div className={`rounded-lg p-3 relative ${
                              isCurrentUser 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white border border-gray-200'
                            } ${message.isDeleted ? 'opacity-60' : ''}`}>
                              {editingMessage?.id === message.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className={`text-sm ${
                                      isCurrentUser 
                                        ? 'bg-white text-black border-gray-300' 
                                        : 'bg-gray-100 text-black border-gray-300'
                                    }`}
                                    autoFocus
                                  />
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      onClick={handleEditSubmit}
                                      className="bg-green-500 hover:bg-green-600 text-white"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={handleCancelEdit}
                                      className="bg-gray-500 hover:bg-gray-600 text-white"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm">{message.message}</p>
                                  {message.isEdited && (
                                    <span className="text-xs opacity-70 italic">(edited)</span>
                                  )}
                                </>
                              )}

                              {/* Attachments */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.attachments.map((attachment, index) => (
                                    <div key={index} className={`flex items-center space-x-2 p-2 rounded border ${
                                      isCurrentUser ? 'bg-blue-400' : 'bg-gray-50'
                                    }`}>
                                      <Paperclip className="h-3 w-3" />
                                      <span className="text-xs truncate flex-1">{attachment.fileName}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.open(attachment.url, '_blank')}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Message actions */}
                            {!message.isDeleted && (
                              <div className={`absolute top-0 ${isCurrentUser ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity bg-white border rounded shadow-sm p-1 flex space-x-1 z-10`}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setReplyToMessage(message)}
                                  className="h-6 w-6 p-0 hover:bg-gray-100"
                                  title="Reply to message"
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                                {message.userId === user?.id && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditMessage(message)}
                                      className="h-6 w-6 p-0 hover:bg-gray-100"
                                      title="Edit message"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      title="Delete message"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}

                            <p className="text-xs text-gray-500 mt-1">
                              {!isCurrentUser && (message.userName || 'User')} • {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div 
              className={`bg-white border-t border-gray-200 p-4 ${dragOver ? 'bg-blue-50' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
            >
              {/* Reply indicator */}
              {replyToMessage && (
                <div className="mb-2 p-2 bg-gray-100 rounded border-l-4 border-blue-500 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Replying to {replyToMessage.userName}</p>
                    <p className="text-sm text-gray-500 truncate">{replyToMessage.message}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyToMessage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* File attachments preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-2 space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={editingMessage ? editText : newMessage}
                  onChange={(e) => editingMessage ? setEditText(e.target.value) : setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                  className="flex-1"
                />
                {editingMessage ? (
                  <div className="flex space-x-1">
                    <Button onClick={handleEditSubmit} size="sm">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && selectedFiles.length === 0}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}