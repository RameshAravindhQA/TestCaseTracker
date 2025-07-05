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
import { Send, MessageCircle, Users, Settings, Plus, Search, UserPlus, Hash, Lock, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";

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
}

export function MessengerFixed() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');
  const [error, setError] = useState<string | null>(null);
  
  // Group creation state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load data functions with proper error handling
  const loadChats = async () => {
    try {
      const response = await fetch('/api/chats', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const chatsData = await response.json();
        setChats(Array.isArray(chatsData) ? chatsData : []);
      } else {
        console.warn('Failed to load chats:', response.status);
        setChats([]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
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
        credentials: 'include', // Important for session-based auth
      });

      if (response.ok) {
        const usersData = await response.json();
        console.log('Users data received:', usersData);
        
        if (Array.isArray(usersData)) {
          const processedUsers = usersData.map(user => ({
            id: user.id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User',
            email: user.email || '',
            avatar: user.avatar || '',
            isOnline: user.isOnline || false,
            lastSeen: user.lastSeen
          }));
          
          setUsers(processedUsers);
          console.log(`Successfully loaded ${processedUsers.length} users`);
          setError(null); // Clear any previous errors
        } else {
          console.warn('Invalid users data format received');
          setUsers([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to load users:', response.status, errorText);
        if (response.status === 401) {
          setError('Authentication required. Please log in again.');
        } else {
          setError('Failed to load users. Please try again.');
        }
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Connection error occurred. Please check your connection and try again.');
      setUsers([]);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } else {
        console.warn('Failed to load messages:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  // WebSocket connection with error handling
  const connectWebSocket = () => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (user && wsRef.current?.readyState !== WebSocket.OPEN) {
            connectWebSocket();
          }
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setError('Connection error occurred');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      setError('Failed to connect to real-time messaging');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_message':
        if (data.chatId === selectedChat?.id) {
          setMessages(prev => [...prev, data.message]);
        }
        break;
      case 'user_joined':
        if (data.chatId === selectedChat?.id) {
          toast({
            title: "User Joined",
            description: `${data.userName} joined the conversation`,
          });
        }
        break;
      default:
        console.log('Unhandled WebSocket message type:', data.type);
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const messageData = {
      chatId: selectedChat.id,
      message: newMessage.trim(),
      userId: user.id,
      userName: user.firstName || user.email || 'Unknown User'
    };

    try {
      const response = await fetch('/api/chats/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Send via WebSocket for real-time updates
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'send_message',
            ...messageData
          }));
        }
      } else {
        throw new Error(`Failed to send message: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Create group chat
  const createGroupChat = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a group name and select at least one member.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim(),
          type: 'group',
          participants: selectedUsers
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        setChats(prev => [newChat, ...prev]);
        setShowCreateGroup(false);
        setGroupName('');
        setGroupDescription('');
        setSelectedUsers([]);
        toast({
          title: "Success",
          description: "Group chat created successfully!",
        });
      } else {
        throw new Error(`Failed to create group: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Start direct chat
  const startDirectChat = async (userId: number) => {
    try {
      const response = await fetch('/api/chats/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const chat = await response.json();
        setSelectedChat(chat);
        setActiveTab('chats');
        await loadMessages(chat.id);
      } else {
        throw new Error(`Failed to start chat: ${response.status}`);
      }
    } catch (error) {
      console.error('Error starting direct chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Effects
  useEffect(() => {
    const initializeMessenger = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (user) {
          await Promise.all([
            loadChats(),
            loadUsers()
          ]);
          connectWebSocket();
        }
      } catch (error) {
        console.error('Error initializing messenger:', error);
        setError('Failed to initialize messenger');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !authLoading) {
      initializeMessenger();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex h-full bg-gray-50">
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading messenger...</p>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Loading Messenger</h3>
            <p className="text-gray-500">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full bg-gray-50">
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col items-center justify-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-red-600 text-center">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
            className="mt-4"
          >
            Retry
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Messenger Error</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication required state
  if (!user) {
    return (
      <div className="flex h-full bg-gray-50">
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col items-center justify-center">
          <Lock className="h-8 w-8 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center">Please log in to access messenger</p>
          <Button 
            onClick={() => window.location.href = '/auth'} 
            variant="outline" 
            size="sm"
            className="mt-4"
          >
            Go to Login
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-500">Please log in to use the messenger</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const displayName = user.name.toLowerCase();
    return displayName.includes(query) || user.email.toLowerCase().includes(query);
  });

  const filteredChats = chats.filter(chat => {
    const query = searchQuery.toLowerCase();
    return chat.name.toLowerCase().includes(query);
  });

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
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Tabs */}
          <div className="flex mt-4 bg-gray-100 rounded-lg p-1">
            <Button
              variant={activeTab === 'chats' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('chats')}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Chats
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('users')}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-1" />
              Users
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeTab === 'chats' ? (
            <div className="p-2">
              {filteredChats.length > 0 ? (
                filteredChats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                      selectedChat?.id === chat.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {chat.type === 'group' ? <Hash className="h-4 w-4" /> : getInitials(chat.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {chat.name}
                          </h3>
                          {chat.unreadCount && chat.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No chats found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => startDirectChat(user.id)}
                    className="p-3 rounded-lg cursor-pointer transition-colors mb-2 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {user.isOnline ? 'Online' : `Last seen ${user.lastSeen || 'recently'}`}
                        </p>
                      </div>
                      <UserPlus className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">⚠️</div>
                  <p className="text-sm text-red-600 mb-2">{error}</p>
                  <Button 
                    onClick={() => {
                      setError(null);
                      loadUsers();
                    }} 
                    variant="outline" 
                    size="sm"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No users available</p>
                  <Button 
                    onClick={loadUsers} 
                    variant="outline" 
                    size="sm"
                    className="mt-2"
                  >
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {selectedChat.type === 'group' ? <Hash className="h-4 w-4" /> : getInitials(selectedChat.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedChat.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedChat.type === 'group' 
                      ? `${selectedChat.participants?.length || 0} members`
                      : 'Direct message'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.userId === user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.userId !== user?.id && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.userName}
                        </p>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.userId === user?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to Messenger</h3>
              <p className="text-gray-500">Select a chat or start a new conversation</p>
              <p className="text-sm text-gray-400 mt-4">
                Welcome, {user?.firstName || user?.email || 'User'}!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}