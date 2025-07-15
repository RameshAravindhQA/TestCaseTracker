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
import { Send, MessageCircle, Users, Settings, Plus, Search, UserPlus, Hash, Lock, Reply, Edit3, Trash2, Pin, PinOff, Phone, Video, Paperclip, AtSign, X, Download, Palette, Mic, MicOff, Play, Pause, Square, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";
import { ThemeCustomizer } from './theme-customizer';

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

interface User {
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
  participants: User[];
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
  conversationId?: number;
  replyToId?: number;
  replyToMessage?: string;
  replyToUser?: string;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  attachments?: FileAttachment[];
  tags?: string[];
}

interface FileAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export function Messenger() {
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [conversationMessages, setConversationMessages] = useState<Map<number, ChatMessage[]>>(new Map());
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [showPinnedBoard, setShowPinnedBoard] = useState(false);
  const [jitsiMeetUrl, setJitsiMeetUrl] = useState<string>('');
  const [showJitsiDialog, setShowJitsiDialog] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<Map<number, Date>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<number, number>>(new Map());
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [chatTheme, setChatTheme] = useState({
    backgroundColor: '#f9fafb',
    messageBackgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#3b82f6'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('messengerTheme');
    if (savedTheme) {
      try {
        setChatTheme(JSON.parse(savedTheme));
      } catch (error) {
        console.warn('Error loading saved theme:', error);
      }
    }
  }, []);

  // Initialize demo data and load users
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Always set demo data first to avoid blank screen
        setConversations([
          {
            id: '1',
            name: 'Project Team',
            lastMessage: 'The latest test results are looking good!',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            unreadCount: 2,
            avatar: 'PT',
            isOnline: true
          },
          {
            id: '2',
            name: 'QA Team',
            lastMessage: 'Found a critical bug in the login module',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            unreadCount: 0,
            avatar: 'QA',
            isOnline: true
          }
        ]);

        // Set initial demo users to prevent blank screen
        setUsers([
          { id: 1, name: 'Demo User', email: 'demo@test.com', isOnline: true },
          { id: 2, name: 'Test User', email: 'test@test.com', isOnline: false },
          { id: 3, name: 'QA Tester', email: 'qa@test.com', isOnline: true }
        ]);

        // Try to load real data
        await loadUsers();

      } catch (error) {
        console.warn('Error initializing messenger, using demo data:', error);
        // Ensure demo data is set even on error
        if (users.length === 0) {
          setUsers([
            { id: 1, name: 'Demo User', email: 'demo@test.com', isOnline: true },
            { id: 2, name: 'Test User', email: 'test@test.com', isOnline: false },
            { id: 3, name: 'QA Tester', email: 'qa@test.com', isOnline: true }
          ]);
        }
      } finally {
        setIsLoading(false);
        setHasInitialLoad(true);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (user && !isConnectingRef.current) {
      connectWebSocket();
      loadChats();
      loadUsers();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when selectedChat changes
  useEffect(() => {
    if (selectedChat) {
      const cachedMessages = conversationMessages.get(selectedChat.id);
      if (cachedMessages) {
        setMessages(cachedMessages);
      } else {
        loadMessages(selectedChat.id);
      }

      // Mark messages as read when opening chat
      markMessagesAsRead(selectedChat.id);
    }
  }, [selectedChat]);

  const markMessagesAsRead = (chatId: number) => {
    setLastReadTimestamp(prev => new Map(prev.set(chatId, new Date())));
    setUnreadCounts(prev => new Map(prev.set(chatId, 0)));
  };

  const isMessageUnread = (message: ChatMessage, chatId: number) => {
    const lastRead = lastReadTimestamp.get(chatId);
    if (!lastRead) return false;

    const messageTime = new Date(message.timestamp);
    return messageTime > lastRead && message.userId !== user?.id;
  };

  const connectWebSocket = () => {
    if (!user || isConnectingRef.current) return;

    isConnectingRef.current = true;

    const attemptConnection = (retryCount = 0) => {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat`;
        console.log(`WebSocket connection attempt ${retryCount + 1}:`, wsUrl);

        const ws = new WebSocket(wsUrl);
        let heartbeatInterval: NodeJS.Timeout;

        ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          setIsConnected(true);
          isConnectingRef.current = false;

          // Send authentication
          try {
            ws.send(JSON.stringify({
              type: 'authenticate',
              data: {
                userId: user.id,
                userName: user.name || user.firstName || 'Unknown User'
              }
            }));
          } catch (error) {
            console.warn('Error sending authentication:', error);
          }

          // Start heartbeat to keep connection alive
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
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
          console.log('⚠️ WebSocket error:', error);
          setIsConnected(false);
          clearInterval(heartbeatInterval);
          isConnectingRef.current = false;
        };

        ws.onclose = (event) => {
          console.log(`🔌 WebSocket connection closed: ${event.code} - ${event.reason}`);
          setIsConnected(false);
          clearInterval(heartbeatInterval);
          isConnectingRef.current = false;

          // Auto-reconnect with exponential backoff (max 5 retries)
          if (event.code !== 1000 && retryCount < 5 && user && !isConnectingRef.current) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${retryCount + 1}/5)`);
            reconnectTimeoutRef.current = setTimeout(() => attemptConnection(retryCount + 1), delay);
          } else if (retryCount >= 5) {
            console.log('❌ Max reconnection attempts reached. Using offline mode.');
            setIsConnected(false);
            toast({
              title: "Connection Lost",
              description: "Using offline mode. Messages will sync when connection is restored.",
              variant: "destructive",
            });
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.log('❌ WebSocket not available - using offline mode:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
        toast({
          title: "Offline Mode",
          description: "Chat is running in demo mode.",
        });
      }
    };

    attemptConnection();
  };

  const handleWebSocketMessage = (data: any) => {
    console.log('WebSocket message received:', data);

    switch (data.type) {
      case 'authenticated':
        console.log('WebSocket authenticated');
        updateUserPresence(data.onlineUsers || []);
        break;
      case 'new_message':
        if (data.message) {
          const newMessage = {
            id: data.message.id,
            userId: data.message.userId,
            userName: data.message.userName || data.message.user?.firstName || 'Unknown',
            message: data.message.message,
            timestamp: data.message.createdAt || data.message.timestamp,
            type: 'text',
            conversationId: data.message.conversationId
          };

          // Only add message if it's NOT from the current user (to prevent showing own messages twice)
          if (newMessage.userId !== user?.id) {
            // Add to current messages if it's the selected conversation
            if (selectedChat && newMessage.conversationId === selectedChat.id) {
              setMessages(prev => {
                // Prevent duplicates
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
              });
            }

            // Update cached messages
            setConversationMessages(prev => {
              const updated = new Map(prev);
              const conversationId = newMessage.conversationId || selectedChat?.id;
              if (conversationId) {
                const messages = updated.get(conversationId) || [];
                const exists = messages.some(msg => msg.id === newMessage.id);
                if (!exists) {
                  updated.set(conversationId, [...messages, newMessage]);
                }
              }
              return updated;
            });
          } else {
            // For own messages, replace temporary message with server response
            if (selectedChat && newMessage.conversationId === selectedChat.id) {
              setMessages(prev => {
                const tempMsgIndex = prev.findIndex(msg => msg.isTemporary && msg.userId === user?.id);
                if (tempMsgIndex !== -1) {
                  const updated = [...prev];
                  updated[tempMsgIndex] = { ...newMessage, isTemporary: false };
                  return updated;
                }
                return prev;
              });
            }
          }
        }
        break;
      case 'user_typing':
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(name => name !== data.userName), data.userName]);
        } else {
          setTypingUsers(prev => prev.filter(name => name !== data.userName));
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
        loadUsers();
        break;
      case 'connected':
        console.log('WebSocket connected:', data.message);
        break;
      case 'pong':
        // Heartbeat response, no action needed
        break;
      case 'error':
        console.error('WebSocket error:', data.error);
        toast({
          title: "Connection Error",
          description: data.error,
          variant: "destructive",
        });
        break;
      default:
        console.warn('Unknown WebSocket message type:', data.type);
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
      const response = await fetch('/api/users/public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const usersData = await response.json();
         const uniqueUsers = usersData.reduce((acc: User[], current: User) => {
        const existing = acc.find(user => user.id === current.id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);
          setUsers(uniqueUsers);
        if (Array.isArray(usersData) && usersData.length > 0) {
          console.log('Loaded users for messenger:', usersData.length);
        } else {
          console.log('No users returned from API, keeping demo data');
        }
      } else {
        console.log(`Users API returned ${response.status}, keeping demo data`);
      }
    } catch (error) {
      console.log('Error loading users, keeping demo data:', error.message);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      // First check if we have cached messages
      const cachedMessages = conversationMessages.get(chatId);
      if (cachedMessages && cachedMessages.length > 0) {
        setMessages(cachedMessages);
        scrollToBottom();
        return;
      }

      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();

        // Update conversation messages map for persistence
        setConversationMessages(prev => {
          const updated = new Map(prev);
          updated.set(chatId, messagesData);
          // Also save to localStorage for persistence across sessions
          localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messagesData));
          return updated;
        });

        setMessages(messagesData);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startDirectChat = async (targetUser: User) => {
    // Check if chat already exists
    const existingChat = chats.find(c => 
      c.type === 'direct' && 
      c.participants.some(p => p.id === targetUser.id)
    );

    if (existingChat) {
      setSelectedChat(existingChat);
      setActiveTab('chats');
      return;
    }

    // Create demo chat immediately
    const demoChat: Chat = {
      id: Date.now(),
      name: targetUser.name,
      type: 'direct',
      participants: [targetUser],
      lastMessage: 'Chat started',
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
        setSelectedChat(chat);
        loadMessages(chat.id);
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
      const response = await fetch('/api/chats/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim(),
          participants: selectedUsers
        })
      });

      if (response.ok) {
        const chat = await response.json();
        setChats(prev => [...prev, chat]);
        setSelectedChat(chat);
        loadMessages(chat.id);
        setShowCreateGroup(false);
        setGroupName('');
        setGroupDescription('');
        setSelectedUsers([]);
        toast({
          title: "Success",
          description: "Group created successfully"
        });
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleEditMessage();
      } else {
        sendMessage();
      }
    }

    // Handle @ mentions
    if (e.key === '@') {
      setShowMentions(true);
      setMentionQuery('');
    }

    // Handle mention selection
    if (showMentions && e.key === 'Escape') {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
    // Focus the input after a brief delay to ensure it's rendered
    setTimeout(() => {
      const input = document.querySelector('.message-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const handleEdit = (message: ChatMessage) => {
    setEditingMessage(message);
    setNewMessage(message.message);
    document.querySelector('.message-input')?.focus();
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast({ title: "Message deleted successfully" });
      }
    } catch (error) {
      toast({ title: "Failed to delete message", variant: "destructive" });
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !newMessage.trim()) return;

    try {
      // Update message locally first for immediate feedback
      const updatedMsg = {
        ...editingMessage,
        message: newMessage.trim(),
        isEdited: true,
        editedAt: new Date().toISOString()
      };

      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage.id ? updatedMsg : msg
      ));

      // Update cached messages
      setConversationMessages(prev => {
        const updated = new Map(prev);
        if (selectedChat) {
          const messages = updated.get(selectedChat.id) || [];
          updated.set(selectedChat.id, messages.map(msg => 
            msg.id === editingMessage.id ? updatedMsg : msg
          ));
        }
        return updated;
      });

      setEditingMessage(null);
      setNewMessage('');

      // Try to sync with server
      try {
        const response = await fetch(`/api/chat/messages/${editingMessage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: newMessage.trim() })
        });

        if (response.ok) {
          toast({ title: "Message updated successfully" });
        } else {
          throw new Error('Server update failed');
        }
      } catch (serverError) {
        console.warn('Server sync failed for message edit:', serverError);
        toast({ 
          title: "Message updated locally", 
          description: "Server sync pending",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Edit message error:', error);
      toast({ title: "Failed to update message", variant: "destructive" });
    }
  };

  const handlePin = async (message: ChatMessage) => {
    try {
      const response = await fetch(`/api/chat/messages/${message.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const updatedMessage = { ...message, isPinned: !message.isPinned };
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? updatedMessage : msg
        ));

        if (updatedMessage.isPinned) {
          setPinnedMessages(prev => [...prev, updatedMessage]);
          toast({ title: "Message pinned" });
        } else {
          setPinnedMessages(prev => prev.filter(msg => msg.id !== message.id));
          toast({ title: "Message unpinned" });
        }
      }
    } catch (error) {
      toast({ title: "Failed to update pin status", variant: "destructive" });
    }
  };

  const startJitsiCall = (isVideo: boolean = true) => {
    if (!selectedChat) return;

    const roomName = `tcm-${selectedChat.id}-${Date.now()}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}`;

    // Open Jitsi Meet in a new window
    const jitsiWindow = window.open(
      jitsiUrl,
      'jitsi-meet',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    if (jitsiWindow) {
      toast({
        title: isVideo ? "Video Call Started" : "Audio Call Started",
        description: `Jitsi Meet opened in new window for ${selectedChat.name}`,
      });
    } else {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups and try again",
        variant: "destructive"
      });
    }
  };

  const handleMention = (user: User) => {
    const mentionText = `@${user.name} `;
    const currentText = newMessage;
    const atIndex = currentText.lastIndexOf('@');

    if (atIndex !== -1) {
      const beforeAt = currentText.substring(0, atIndex);
      const afterQuery = currentText.substring(atIndex + mentionQuery.length + 1);
      const newText = beforeAt + mentionText + afterQuery;
      setNewMessage(newText);
    } else {
      setNewMessage(currentText + mentionText);
    }

    setShowMentions(false);
    setMentionQuery('');
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/uploads/bug-attachment', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Upload failed');
        }

        return response.json();
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);

      toast({ 
        title: files.length > 1 ? "Files uploaded successfully" : "File uploaded successfully",
        description: `${files.length} file(s) uploaded`
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({ 
        title: "Failed to upload files", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);

        // Upload audio file
        const formData = new FormData();
        formData.append('file', blob, `audio-${Date.now()}.webm`);

        try {
          const response = await fetch('/api/uploads/bug-attachment', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });

          if (response.ok) {
            const audioFile = await response.json();
            setAttachments(prev => [...prev, audioFile]);
            toast({ 
              title: "Audio recorded successfully",
              description: "Voice message is ready to send"
            });
          }
        } catch (error) {
          console.error('Audio upload error:', error);
          toast({ 
            title: "Failed to upload audio", 
            description: "Please try again",
            variant: "destructive" 
          });
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({ 
        title: "Recording started",
        description: "Speak into your microphone"
      });

    } catch (error) {
      console.error('Error starting audio recording:', error);
      toast({ 
        title: "Microphone access denied", 
        description: "Please allow microphone access to record audio",
        variant: "destructive" 
      });
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}-${user?.id}`;

    // Create message object with attachments and reply data
    const messageToSend = {
      id: tempId,
      userId: user?.id || 1,
      userName: user?.firstName || 'You',
      message: messageText,
      timestamp: new Date().toISOString(),
      type: 'text' as const,
      conversationId: selectedChat.id,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToId: replyingTo?.id,
      replyToMessage: replyingTo?.message,
      replyToUser: replyingTo?.userName,
      isTemporary: true // Mark as temporary message
    };

    // Add to current messages immediately for instant feedback
    setMessages(prev => [...prev, messageToSend]);

    // Update cached messages
    setConversationMessages(prev => {
      const updated = new Map(prev);
      const messages = updated.get(selectedChat.id) || [];
      updated.set(selectedChat.id, [...messages, messageToSend]);
      return updated;
    });

    // Clear input and attachments
    setNewMessage('');
    setReplyingTo(null);
    setAttachments([]);

    // Try to send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const messageData = {
          type: 'send_message',
          data: {
            conversationId: selectedChat.id,
            message: messageText,
            userId: user?.id,
            userName: user?.firstName || 'Unknown User',
            attachments: messageToSend.attachments,
            replyToId: replyingTo?.id,
            tempId: tempId // Include temp ID for replacement
          }
        };

        console.log('Sending WebSocket message:', messageData);
        wsRef.current.send(JSON.stringify(messageData));
      } catch (error) {
        console.error('Error sending message via WebSocket:', error);
        toast({
          title: "Message Error",
          description: "Failed to send message via WebSocket",
          variant: "destructive",
        });
      }
    } else {
      console.log('WebSocket not connected, message added locally only');
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
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

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const commonEmojis = ["😀", "😂", "😊", "😍", "🤔", "👍", "👎", "❤️", "🔥", "💯"];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please log in to access the messenger.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while initial data is being fetched
  if (isLoading) {
      return (
        <div className="flex flex-col h-screen">
          <div className="flex items-center justify-center h-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Messenger</p>
              <p className="text-sm text-gray-500">Setting up your conversations...</p>
            </motion.div>
          </div>
        </div>
      );
  }

  // Show welcome state if no users or chats but not loading
  if (users.length === 0 && chats.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto p-8"
          >
            <MessageCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Messenger</h2>
            <p className="text-gray-600 mb-6">
              Connect with your team members and start conversations. Once other users join the platform, you'll be able to chat with them here.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Getting Started:</strong> Invite team members to join your project to start messaging.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex h-full" 
      style={{
        backgroundColor: chatTheme.backgroundColor,
        backgroundImage: chatTheme.backgroundImage ? `url(${chatTheme.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
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
              <Button variant="ghost" size="sm" onClick={() => setShowThemeCustomizer(true)}>
                <Palette className="h-4 w-4" />
              </Button>
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
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-1 px-3 text-sm rounded-md transition-colors ${
                activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              People
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
                      // Don't restart WebSocket connection when switching chats
                      // Messages will be loaded from cache or API
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
                          {(chat.unreadCount ?? unreadCounts.get(chat.id) ?? 0) > 0 && (
                            <Badge variant="destructive" className="text-xs min-w-[20px] h-5 flex items-center justify-center">
                              {Math.min(chat.unreadCount ?? unreadCounts.get(chat.id) ?? 0, 99)}
                              {(chat.unreadCount ?? unreadCounts.get(chat.id) ?? 0) > 99 && '+'}
                            </Badge>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                        )}
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
                    {searchQuery ? 'No users found' : 'No users available'}
                  </p>
                </div>
              ) : (
                filteredUsers.map((chatUser) => (
                  <div
                    key={chatUser.id}
                    className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => startDirectChat(chatUser)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gray-100 text-gray-600">
                            {getInitials(chatUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          chatUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{chatUser.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{chatUser.email}</p>
                        <p className="text-xs text-gray-400">
                          {chatUser.isOnline ? 'Online' : `Last seen ${chatUser.lastSeen ? new Date(chatUser.lastSeen).toLocaleDateString() : 'unknown'}`}
                        </p>
                      </div>
                      <UserPlus className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))
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
                    {selectedChat.type === 'group' && <Users className="h-3 w-4 ml-1 text-gray-400" />}
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
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.userId === user.id ? 'justify-end' : 'justify-start'} group ${
                        selectedChat && isMessageUnread(message, selectedChat.id) ? 'animate-pulse' : ''
                      }`}
                    >
                      <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.userId === user.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-100">
                            {getInitials(message.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="relative">
                          {/* Reply indicator */}
                          {message.replyToId && (
                            <div className="text-xs text-gray-500 mb-1 p-2 bg-gray-50 rounded border-l-2 border-blue-300">
                              <div className="font-medium">{message.replyToUser}</div>
                              <div className="truncate">{message.replyToMessage}</div>
                            </div>
                          )}

                          {/* Pin indicator */}
                          {message.isPinned && (
                            <Pin className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                          )}

                          <div className={`rounded-lg p-3 ${
                            message.userId === user.id 
                              ? 'bg-blue-500 text-white' 
                              : selectedChat && isMessageUnread(message, selectedChat.id)
                                ? 'bg-blue-50 border-2 border-blue-300 shadow-lg'
                                : 'bg-white border border-gray-200'
                          }`}>
                            <p className="text-sm">{message.message}</p>

                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment) => {
                                  const isImage = attachment.fileType?.startsWith('image/') || 
                                    attachment.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
                                  const isPdf = attachment.fileType === 'application/pdf' || 
                                    attachment.fileName?.toLowerCase().endsWith('.pdf');
                                  const isAudio = attachment.fileType?.startsWith('audio/') || 
                                    attachment.fileName?.toLowerCase().match(/\.(mp3|wav|webm|ogg)$/);

                                  return (
                                    <div key={attachment.id} className="border rounded-lg overflow-hidden bg-white">
                                      {isImage ? (
                                        <div className="p-2">
                                          <img 
                                            src={attachment.fileUrl} 
                                            alt={attachment.fileName}
                                            className="max-w-xs max-h-48 rounded cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(attachment.fileUrl, '_blank')}
                                          />
                                          <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-600">{attachment.fileName}</span>
                                            <Button size="sm" variant="ghost" onClick={() => window.open(attachment.fileUrl, '_blank')}>
                                              <Download className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ) : isAudio ? (
                                        <div className="p-3">
                                          <div className="flex items-center space-x-2 mb-2">
                                            <Mic className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium">Voice Message</span>
                                          </div>
                                          <audio 
                                            controls 
                                            className="w-full h-8"
                                            src={attachment.fileUrl}
                                          >
                                            Your browser does not support the audio element.
                                          </audio>
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-2 p-3">
                                          {isPdf ? (
                                            <FileText className="h-5 w-5 text-red-500" />
                                          ) : (
                                            <Paperclip className="h-5 w-5 text-gray-500" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                                            <p className="text-xs text-gray-500">
                                              {attachment.fileType} • {Math.round((attachment.fileSize || 0) / 1024)} KB
                                            </p>
                                          </div>
                                          <Button size="sm" variant="ghost" onClick={() => window.open(attachment.fileUrl, '_blank')}>
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Message actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-16 top-1/2 transform -translate-y-1/2">
                            <div className="flex space-x-1 bg-white border rounded-lg shadow-lg p-1">
                              <Button size="sm" variant="ghost" onClick={() => handleReply(message)}>
                                <Reply className="h-3 w-3" />
                              </Button>
                              {message.userId === user.id && (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => handleEdit(message)}>
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDelete(message.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => handlePin(message)}>
                                {message.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 mt-1">
                            {message.userId !== user.id && message.userName} • {formatTime(message.timestamp)}
                            {message.isEdited && <span className="ml-1 italic">(edited)</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              {/* Reply indicator */}
              {replyingTo && (
                <div className="mb-2 p-2 bg-blue-50 border-l-2 border-blue-300 rounded flex justify-between items-center">
                  <div>
                    <div className="text-xs font-medium text-blue-600">Replying to {replyingTo.userName}</div>
                    <div className="text-xs text-gray-600 truncate">{replyingTo.message}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Edit indicator */}
              {editingMessage && (
                <div className="mb-2 p-2 bg-yellow-50 border-l-2 border-yellow-300 rounded flex justify-between items-center">
                  <div className="text-xs font-medium text-yellow-600">Editing message</div>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditingMessage(null);
                    setNewMessage('');
                  }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                      <span className="text-xs">{attachment.fileName}</span>
                      <Button size="sm" variant="ghost" onClick={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                {/* Attachment button */}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={(ref) => {
                    if (ref) {
                      ref.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) handleFileUpload(files);
                      };
                    }
                  }}
                  id="file-upload"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <span className="text-lg">😀</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowMentions(!showMentions)}
                >
                  <AtSign className="h-4 w-4" />
                </Button>

                {/* Audio recording button */}
                {!isRecording ? (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={startAudioRecording}
                    title="Record voice message"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={stopAudioRecording}
                    title={`Recording: ${formatRecordingTime(recordingTime)}`}
                  >
                    <MicOff className="h-4 w-4" />
                    <span className="ml-1 text-xs">{formatRecordingTime(recordingTime)}</span>
                  </Button>
                )}

                {/* Voice call button */}
                <Button size="sm" variant="ghost" onClick={() => startJitsiCall(false)}>
                  <Phone className="h-4 w-4" />
                </Button>

                {/* Video call button */}
                <Button size="sm" variant="ghost" onClick={() => startJitsiCall(true)}>
                  <Video className="h-4 w-4" />
                </Button>

                {/* Pinned messages button */}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowPinnedBoard(!showPinnedBoard)}
                  className={pinnedMessages.length > 0 ? 'text-yellow-600' : ''}
                >
                  <Pin className="h-4 w-4" />
                  {pinnedMessages.length > 0 && (
                    <span className="ml-1 text-xs bg-yellow-500 text-white rounded-full px-1">
                      {pinnedMessages.length}
                    </span>
                  )}
                </Button>

                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    // Handle mention detection
                    const value = e.target.value;
                    const atIndex = value.lastIndexOf('@');
                    if (atIndex !== -1 && atIndex === value.length - 1) {
                      setShowMentions(true);
                      setMentionQuery('');
                    } else if (atIndex !== -1 && showMentions) {
                      const query = value.substring(atIndex + 1);
                      setMentionQuery(query);
                      setMentionUsers(users.filter(u => 
                        u.name.toLowerCase().includes(query.toLowerCase())
                      ));
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                  className="flex-1 message-input"
                />

                <Button
                  onClick={editingMessage ? handleEditMessage : sendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Mention dropdown */}
              {showMentions && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border rounded-lg shadow-lg max-h-32 overflow-y-auto">
                  {mentionUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="p-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
                      onClick={() => handleMention(user)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-4 right-4 bg-white border rounded-lg shadow-lg p-4 z-50">
                <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                      onClick={() => addEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowEmojiPicker(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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

        {/* Theme Customizer */}
        <ThemeCustomizer
          open={showThemeCustomizer}
          onOpenChange={setShowThemeCustomizer}
          onThemeChange={setChatTheme}
          currentTheme={chatTheme}
        />
      </div>
    </div>
  );
}