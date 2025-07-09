import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Send, 
  MessageCircle, 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Video, 
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";

interface User {
  id: number;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  isOnline: boolean;
  avatar?: string;
  profilePicture?: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'file' | 'voice' | 'system';
}

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: number[];
  createdAt: string;
  lastMessage?: ChatMessage;
  isActive: boolean;
  unreadCount?: number;
}

export function Messenger() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Refs
  const wsRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messengerRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      console.log('User authenticated, connecting WebSocket and loading users');
      connectWebSocket();
      loadOnlineUsers();
      loadConversations();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [user]);

  const loadConversations = async () => {
    try {
      console.log('Loading conversations...');
      const response = await fetch('/api/chats', {
        credentials: 'include'
      });
      if (response.ok) {
        const convs = await response.json();
        console.log('Loaded conversations:', convs);
        setConversations(convs);
      } else {
        console.error('Failed to load conversations:', response.status);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    if (!user) return;

    try {
      console.log('Connecting to WebSocket...');

      // Use socket.io client library
      // @ts-ignore
      const socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        path: '/socket.io'
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);

        // Join user room
        socket.emit('join-user', user.id);
      });

      socket.on('new-message', (message: ChatMessage) => {
        console.log('New message received:', message);
        if (message.conversationId === selectedConversation) {
          setMessages(prev => [...prev, message]);
        }

        // Update conversation last message
        setConversations(prev => prev.map(conv => 
          conv.id === message.conversationId 
            ? { ...conv, lastMessage: message }
            : conv
        ));
      });

      socket.on('user-typing', (data: { conversationId: string; userId: number; userName: string }) => {
        if (data.conversationId === selectedConversation && data.userId !== user.id) {
          setTypingUsers(prev => {
            if (!prev.includes(data.userName)) {
              return [...prev, data.userName];
            }
            return prev;
          });
        }
      });

      socket.on('user-stopped-typing', (data: { conversationId: string; userId: number }) => {
        if (data.conversationId === selectedConversation) {
          setTypingUsers(prev => prev.filter(name => name !== data.userId.toString()));
        }
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      wsRef.current = socket;

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      console.log('Loading online users...');
      const response = await fetch('/api/users/public', {
        credentials: 'include'
      });
      if (response.ok) {
        const users = await response.json();
        console.log('Loaded users:', users);

        const formattedUsers = users.map((u: any) => {
          const firstName = u.firstName || '';
          const lastName = u.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();

          return {
            id: u.id,
            name: fullName || u.name || u.email?.split('@')[0] || 'Unknown User',
            email: u.email,
            isOnline: false,
            avatar: u.avatar || u.profilePicture,
            firstName: firstName,
            lastName: lastName
          };
        });

        console.log('Formatted users:', formattedUsers);
        setOnlineUsers(formattedUsers);
      } else {
        console.error('Failed to load users:', response.status, response.statusText);
        setOnlineUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setOnlineUsers([]);
    }
  };

  const createConversation = async () => {
    console.log('[Messenger] Creating conversation with selected users:', selectedUsers);

    if (selectedUsers.length === 0) {
      console.warn('[Messenger] No users selected for conversation');
      toast({
        title: "Error",
        description: "Please select at least one user",
        variant: "destructive"
      });
      return;
    }

    try {
      if (selectedUsers.length === 1) {
        const targetUserId = selectedUsers[0];
        console.log('[Messenger] Creating direct conversation with user:', targetUserId);

        if (targetUserId === user?.id) {
          console.warn('[Messenger] User attempting to create conversation with themselves');
          toast({
            title: "Error",
            description: "You cannot create a conversation with yourself",
            variant: "destructive"
          });
          return;
        }

        const requestBody = { targetUserId };
        console.log('[Messenger] Sending request body:', requestBody);

        const response = await fetch('/api/chats/direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });

        console.log('[Messenger] Response status:', response.status);

        if (response.ok) {
          const conversation = await response.json();
          console.log('[Messenger] Created conversation successfully:', conversation);

          setConversations(prev => {
            const exists = prev.find(c => c.id === conversation.id);
            if (exists) {
              console.log('[Messenger] Conversation already exists, not adding duplicate');
              return prev;
            }
            console.log('[Messenger] Adding new conversation to list');
            return [...prev, conversation];
          });

          setSelectedConversation(conversation.id);
          console.log('[Messenger] Set selected conversation to:', conversation.id);

          // Join the conversation room
          if (wsRef.current) {
            console.log('[Messenger] Joining conversation room via WebSocket');
            wsRef.current.emit('join-conversation', conversation.id);
          }

          // Load messages for this conversation
          await joinConversation(conversation.id);

          toast({
            title: "Success",
            description: "Conversation created successfully"
          });
        } else {
          const responseText = await response.text();
          console.error('[Messenger] Error response text:', responseText);

          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('[Messenger] Failed to parse error response:', parseError);
            errorData = { error: responseText || 'Unknown error' };
          }

          console.error('[Messenger] Failed to create direct conversation:', response.status, errorData);
          throw new Error(errorData.error || errorData.message || `Failed to create direct conversation (${response.status})`);
        }
      }

      setShowCreateChat(false);
      setSelectedUsers([]);
    } catch (error) {
      console.error('[Messenger] Error creating conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create conversation",
        variant: "destructive"
      });
    }
  };

  const joinConversation = async (conversationId: string) => {
    console.log('[Messenger] Joining conversation:', conversationId);

    setSelectedConversation(conversationId);

    try {
      const response = await fetch(`/api/chats/${conversationId}/messages`, {
        credentials: 'include'
      });

      if (response.ok) {
        const messages = await response.json();
        console.log('[Messenger] Loaded messages for conversation:', messages.length);
        setMessages(messages);
      } else {
        console.error('[Messenger] Failed to load messages:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('[Messenger] Error loading messages:', error);
      setMessages([]);
    }

    // Join via WebSocket if available
    if (wsRef.current) {
      wsRef.current.emit('join-conversation', conversationId);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    console.log('[Messenger] Sending message to conversation:', selectedConversation);

    try {
      const response = await fetch(`/api/chats/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        const message = await response.json();
        console.log('[Messenger] Message sent successfully:', message);

        setMessages(prev => [...prev, message]);

        // Update conversation last message
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, lastMessage: message }
            : conv
        ));

        setNewMessage('');

        // Emit via WebSocket for real-time updates
        if (wsRef.current) {
          wsRef.current.emit('send-message', {
            conversationId: selectedConversation,
            message: message
          });
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messenger</h1>
        <p className="text-gray-600 dark:text-gray-400">Communicate with your team members</p>
      </div>
      <div className="flex-1 flex overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow" ref={messengerRef}>
        <div className="flex h-full">
          {/* Conversations Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <div className="flex items-center space-x-2">
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  <Dialog open={showCreateChat} onOpenChange={setShowCreateChat}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Chat</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Select Users:</p>
                          <ScrollArea className="h-40">
                            {onlineUsers.length === 0 ? (
                              <div className="text-center py-4 text-sm text-gray-500">
                                No users available
                              </div>
                            ) : (
                              onlineUsers.map(chatUser => (
                                <div key={chatUser.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(chatUser.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedUsers(prev => [...prev, chatUser.id]);
                                      } else {
                                        setSelectedUsers(prev => prev.filter(id => id !== chatUser.id));
                                      }
                                    }}
                                  />
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                      {getInitials(chatUser.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{chatUser.name}</span>
                                    <div className="text-xs text-gray-500">{chatUser.email}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </ScrollArea>
                        </div>
                        <Button onClick={createConversation} className="w-full">
                          Create Chat
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {/* Show available users if no conversations */}
                {conversations.length === 0 && onlineUsers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-2">
                      Available Users
                    </h4>
                    {onlineUsers.slice(0, 5).map((user) => (
                      <div
                        key={user.id}
                        className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 border border-gray-200 mb-2"
                        onClick={async () => {
                          try {
                            setSelectedUsers([user.id]);
                            await createConversation();
                          } catch (error) {
                            console.error('Error starting conversation:', error);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {user.name}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              Click to start chatting
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {conversations.length === 0 && onlineUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No users or conversations available</p>
                    <p className="text-xs text-gray-400 mt-1">Try refreshing the page</p>
                  </div>
                ) : (
                  conversations
                    .filter(conv => conv.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conversation.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => joinConversation(conversation.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {conversation.type === 'group' ? <Users className="h-5 w-5" /> : getInitials(conversation.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {conversation.name}
                              </h3>
                            </div>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500 truncate">
                                {conversation.lastMessage.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {conversations.find(c => c.id === selectedConversation)?.type === 'group' ? 
                            <Users className="h-4 w-4" /> : 
                            getInitials(conversations.find(c => c.id === selectedConversation)?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {conversations.find(c => c.id === selectedConversation)?.name}
                        </h3>
                        {typingUsers.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
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
                          className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.senderId === user.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-gray-100">
                                {getInitials(message.senderName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="group relative">
                              <div className={`rounded-lg p-3 ${
                                message.senderId === user.id 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-white border border-gray-200'
                              }`}>
                                <p className="text-sm">{message.message}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {message.senderId !== user.id && message.senderName} • {formatTime(message.timestamp)}
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
      </div>
    </div>
  );
}