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
import { Send, MessageCircle, Users, Settings, Plus, Search, UserPlus, Hash, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";

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
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (user) {
      connectWebSocket();
      loadChats();
      loadUsers();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    if (!user) return;
    
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat`;
      console.log('Attempting WebSocket connection:', wsUrl);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);

        try {
          ws.send(JSON.stringify({
            type: 'authenticate',
            data: {
              userId: user.id,
              userName: user.name
            }
          }));
        } catch (error) {
          console.warn('Error sending authentication:', error);
        }
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
        console.log('WebSocket error - continuing in demo mode:', error);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Try to reconnect after a delay if not a normal closure
        if (event.code !== 1000 && user) {
          setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 3000);
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
          setMessages(prev => [...prev, {
            id: data.message.id,
            userId: data.message.userId,
            userName: data.message.user?.firstName || 'Unknown',
            message: data.message.message,
            timestamp: data.message.createdAt,
            type: 'text'
          }]);
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
        // Handle new user registration notification
        toast({
          title: "New User Joined!",
          description: `${data.userName} has joined the platform`,
        });
        loadUsers(); // Refresh user list
        break;
      case 'error':
        console.error('WebSocket error:', data.error);
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
      const response = await fetch('/api/users/public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const usersData = await response.json();
        if (Array.isArray(usersData) && usersData.length > 0) {
          setUsers(usersData);
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
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'join_conversation',
            data: { conversationId: chatId }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startDirectChat = async (targetUser: User) => {
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

    setChats(prev => {
      const existing = prev.find(c => c.id === demoChat.id);
      if (existing) return prev;
      return [...prev, demoChat];
    });
    
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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Add message to local state immediately for demo mode
    const demoMessage: ChatMessage = {
      id: Date.now(),
      userId: user?.id || 1,
      userName: user?.name || 'You',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, demoMessage]);
    setNewMessage('');

    // Try to send via WebSocket if connected
    if (selectedChat && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const messageData = {
          type: 'send_message',
          data: {
            conversationId: selectedChat.id,
            message: demoMessage.message
          }
        };
        wsRef.current.send(JSON.stringify(messageData));
      } catch (error) {
        console.warn('Error sending message via WebSocket:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                            <Badge variant="destructive" className="text-xs">
                              {chat.unreadCount}
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
                      className={`flex ${message.userId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.userId === user.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-100">
                            {getInitials(message.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={`rounded-lg p-3 ${
                            message.userId === user.id 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            <p className="text-sm">{message.message}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {message.userId !== user.id && message.userName} • {formatTime(message.timestamp)}
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
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
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