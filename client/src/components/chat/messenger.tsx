import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { 
  Send, 
  MessageCircle, 
  Users, 
  Wifi, 
  WifiOff, 
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  Search,
  X,
  Smile,
  Paperclip,
  Phone,
  Video,
  MoreVertical
} from 'lucide-react';

interface Message {
  id: string;
  userId: number;
  userName: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'system';
}

interface User {
  id: number;
  name: string;
  isOnline: boolean;
  email?: string;
  lastName?: string;
  firstName?: string;
}

interface Conversation {
  id: string;
  name: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  type: 'direct' | 'group';
}

const Messenger: React.FC = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const [retryCount, setRetryCount] = useState(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const connectToServer = useCallback(() => {
    if (!user || isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const socketInstance = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        autoConnect: true,
        forceNew: true
      });

      socketInstance.on('connect', () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        setRetryCount(0);

        // Join chat with user info
        socketInstance.emit('join-chat', {
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        });

        toast({
          title: "Connected",
          description: "Successfully connected to chat server",
        });
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        setIsConnected(false);
        setIsConnecting(false);

        if (reason === 'io server disconnect') {
          setConnectionError('Server disconnected the connection');
        } else {
          setConnectionError('Connection lost - attempting to reconnect...');
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError(`Connection failed: ${error.message}`);

        if (retryCount < 3) {
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connectToServer();
          }, 2000 * (retryCount + 1));
        }
      });

      socketInstance.on('new-message', (message: Message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      socketInstance.on('user-joined', (data: { user: User; message?: string }) => {
        setOnlineUsers(prev => {
          const existing = prev.find(u => u.id === data.user.id);
          if (existing) {
            return prev.map(u => u.id === data.user.id ? { ...u, isOnline: true } : u);
          }
          return [...prev, data.user];
        });

        if (data.message) {
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            userId: 0,
            userName: 'System',
            content: data.message,
            timestamp: new Date().toISOString(),
            type: 'system'
          }]);
        }
      });

      socketInstance.on('user-left', (data: { userId: number; message?: string }) => {
        setOnlineUsers(prev => prev.map(u => 
          u.id === data.userId ? { ...u, isOnline: false } : u
        ));

        if (data.message) {
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            userId: 0,
            userName: 'System',
            content: data.message,
            timestamp: new Date().toISOString(),
            type: 'system'
          }]);
        }
      });

      socketInstance.on('online-users', (users: User[]) => {
        setOnlineUsers(users);
      });

      socketInstance.on('user-typing', (data: { userId: number; userName: string; isTyping: boolean }) => {
        if (data.userId !== user.id) {
          setTypingUsers(prev => {
            if (data.isTyping) {
              return prev.includes(data.userName) ? prev : [...prev, data.userName];
            } else {
              return prev.filter(name => name !== data.userName);
            }
          });
        }
      });

      setSocket(socketInstance);

    } catch (error) {
      console.error('Error creating socket connection:', error);
      setIsConnecting(false);
      setConnectionError('Failed to initialize connection');
    }
  }, [user, isConnecting, retryCount, scrollToBottom]);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setTimeout(connectToServer, 500);
  }, [socket, connectToServer]);

  useEffect(() => {
    if (user) {
      connectToServer();
      loadConversations();
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const apiConversations = await response.json();

        const uiConversations: Conversation[] = apiConversations.map((conv: any) => {
          const otherParticipant = conv.participants.find((p: any) => p.id !== user.id);
          return {
            id: conv.id.toString(),
            name: otherParticipant ? 
              `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() || 
              otherParticipant.name || 
              otherParticipant.email || 'Unknown' : 'Unknown',
            type: 'direct',
            participants: conv.participants,
            unreadCount: 0,
            lastMessage: conv.lastMessage
          };
        });

        setConversations(uiConversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Typing indicator functionality
  const handleTypingStart = useCallback(() => {
    if (socket && selectedConversation && !isTyping) {
      setIsTyping(true);
      socket.emit('typing-start', {
        conversationId: selectedConversation,
        userId: user?.id,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email
      });
    }
  }, [socket, selectedConversation, isTyping, user]);

  const handleTypingStop = useCallback(() => {
    if (socket && selectedConversation && isTyping) {
      setIsTyping(false);
      socket.emit('typing-stop', {
        conversationId: selectedConversation,
        userId: user?.id,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email
      });
    }
  }, [socket, selectedConversation, isTyping, user]);

  // Handle message input changes with typing indicators
  const handleMessageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.trim() && !isTyping) {
      handleTypingStart();
    } else if (!value.trim() && isTyping) {
      handleTypingStop();
    }
  }, [isTyping, handleTypingStart, handleTypingStop]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user || !selectedConversation) return;

    // Stop typing indicator
    handleTypingStop();

    try {
      const response = await fetch(`/api/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          userId: user.id,
        }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');

        // Focus back on input
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }

        toast({
          title: "Message sent",
          description: "Your message has been delivered.",
        });
      } else {
        toast({
          title: "Failed to send message",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Connection error",
        description: "Unable to send message.",
        variant: "destructive",
      });
    }
  }, [newMessage, user, selectedConversation, toast, handleTypingStop]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const createDirectConversation = useCallback(async (targetUser: User) => {
    if (!user) return;

    // Check if conversation already exists
    const existingConversation = conversations.find(conv => 
      conv.type === 'direct' && 
      conv.participants.some(p => p.id === targetUser.id)
    );

    if (existingConversation) {
        setSelectedConversation(existingConversation.id);
        setShowNewConversation(false);
        setMessages([]);

        try {
          const response = await fetch(`/api/conversations/${existingConversation.id}/messages`);
          if (response.ok) {
            const conversationMessages = await response.json();
            setMessages(conversationMessages);
          }
        } catch (error) {
          console.error('Failed to load messages:', error);
        }

        // Focus on message input
        setTimeout(() => {
          if (messageInputRef.current) {
            messageInputRef.current.focus();
          }
        }, 100);

        toast({
          title: "Conversation Selected",
          description: `Selected conversation with ${existingConversation.name}`,
        });

        return;
      }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds: [user.id, targetUser.id],
          type: 'direct'
        }),
      });

      if (response.ok) {
        const newConversation = await response.json();

        const conversationForUI: Conversation = {
          id: newConversation.id.toString(),
          name: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.name || targetUser.email,
          type: 'direct',
          participants: [
            { 
              id: user.id, 
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email, 
              isOnline: true 
            },
            targetUser
          ],
          unreadCount: 0
        };

        // Update conversations list and select the new conversation
        setConversations(prev => {
          const updated = [...prev, conversationForUI];
          return updated;
        });

        // Set the selected conversation and clear messages
        setSelectedConversation(conversationForUI.id);
        setShowNewConversation(false);
        setMessages([]);

        // Reload conversations to ensure sync
        await loadConversations();

        // Focus on message input
        setTimeout(() => {
          if (messageInputRef.current) {
            messageInputRef.current.focus();
          }
        }, 100);

        toast({
          title: "Conversation Created",
          description: `Started conversation with ${conversationForUI.name}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    }
  }, [user, conversations, toast, loadConversations]);

  const selectConversation = useCallback(async (conversationId: string) => {
    console.log('Selecting conversation:', conversationId);
    setSelectedConversation(conversationId);
    setShowNewConversation(false);
    setNewMessage(''); // Clear any existing message

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const conversationMessages = await response.json();
        setMessages(conversationMessages);
        console.log('Loaded messages for conversation:', conversationMessages);
      } else {
        setMessages([]);
        console.log('No messages found for conversation');
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }

    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    ));

    // Focus on message input with a longer delay to ensure DOM is ready
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
        messageInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 300);
  }, []);

  const filteredUsers = onlineUsers.filter(u => 
    u.id !== user?.id && 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access the messenger.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messenger</h1>
          <p className="text-muted-foreground">Real-time chat with your team</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              {isConnecting ? 'Connecting...' : 'Disconnected'}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversations and Users */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Messages
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowNewConversation(!showNewConversation)}
              >
                {showNewConversation ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showNewConversation && (
              <div className="space-y-3 mb-4 p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {filteredUsers.map((availableUser) => (
                      <div 
                        key={availableUser.id}
                        className="flex items-center gap-2 p-2 hover:bg-background rounded cursor-pointer transition-colors"
                        onClick={() => createDirectConversation(availableUser)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {(availableUser.firstName?.charAt(0) || availableUser.name?.charAt(0) || availableUser.email?.charAt(0) || '?').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate">
                            {`${availableUser.firstName || ''} ${availableUser.lastName || ''}`.trim() || 
                             availableUser.name || 
                             availableUser.email}
                          </span>
                          {availableUser.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {availableUser.email}
                            </p>
                          )}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${availableUser.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">No users found</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => selectConversation(conversation.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {conversation.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{conversation.name}</span>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {conversations.length === 0 && !showNewConversation && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <p className="text-xs text-muted-foreground">Click + to start a new conversation</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col min-h-[600px] h-[600px]">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {selectedConversationData ? selectedConversationData.name : 'Select a conversation'}
              </div>

              {selectedConversationData && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {connectionError && (
                <Button
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 overflow-hidden p-0">
            {connectionError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md mx-4 mt-4">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{connectionError}</span>
              </div>
            )}

            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Welcome to Messages</h3>
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex gap-3 ${
                          message.type === 'system' ? 'justify-center' : 
                          message.userId === user?.id ? 'justify-end' : ''
                        }`}>
                          {message.type !== 'system' && message.userId !== user?.id && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {message.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`space-y-1 max-w-[70%] ${
                            message.type === 'system' ? 'text-center' : 
                            message.userId === user?.id ? 'text-right' : 'flex-1'
                          }`}>
                            {message.type !== 'system' && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{message.userName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            <div className={`p-3 rounded-lg ${
                              message.type === 'system' ? 'bg-muted text-muted-foreground italic' :
                              message.userId === user?.id ? 'bg-blue-500 text-white ml-auto' :
                              'bg-muted'
                            } ${message.userId === user?.id ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                          {message.type !== 'system' && message.userId === user?.id && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {message.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {/* Typing Indicators */}
                      {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                        </div>
                      )}

                      {messages.length === 0 && (
                        <div className="text-center text-muted-foreground">
                          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}

            {/* Message Input - Fixed at bottom when conversation is selected */}
            {selectedConversation && (
              <div className="mt-auto border-t bg-background p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 p-3 border rounded-lg bg-background min-h-[48px]">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      ref={messageInputRef}
                      value={newMessage}
                      onChange={handleMessageInputChange}
                      onKeyPress={handleKeyPress}
                      onBlur={handleTypingStop}
                      placeholder="Type a message..."
                      disabled={!isConnected}
                      className="flex-1 border-0 p-2 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                      style={{ minHeight: '32px' }}
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || !isConnected}
                    size="icon"
                    className="h-12 w-12 flex-shrink-0"
                  >
                    {isConnected ? <Send className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  </Button>
                </div>
                <div className="px-2 mt-2">
                  <p className="text-xs text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                  {!isConnected && (
                    <p className="text-xs text-red-500">
                      Reconnecting to chat server...
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messenger;