
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreHorizontal, 
  UserPlus,
  MessageCircle,
  Clock,
  CheckCheck,
  Loader2,
  Users,
  Paperclip,
  Pin,
  Reply,
  Edit,
  Trash2,
  X,
  PhoneCall,
  VideoOff,
  Mic,
  MicOff,
  Camera,
  CameraOff
} from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import io, { Socket } from 'socket.io-client';

interface User {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
  read: boolean;
  sender?: User;
  type: 'text' | 'system';
  attachments?: Attachment[];
  replyTo?: Message;
  isPinned?: boolean;
  isEdited?: boolean;
}

interface Conversation {
  id: number;
  participantIds: number[];
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
  type: 'direct' | 'group';
  name?: string;
  pinnedMessages?: Message[];
}

interface CallState {
  isActive: boolean;
  type: 'voice' | 'video';
  participants: number[];
  isMuted: boolean;
  isCameraOn: boolean;
  callLink?: string;
}

export function EnhancedMessengerV3() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    type: 'voice',
    participants: [],
    isMuted: false,
    isCameraOn: true
  });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    staleTime: 300000,
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/chats/enhanced'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/chats/enhanced');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading conversations:', error);
        return [];
      }
    },
    refetchInterval: 10000,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['/api/chats', selectedConversationId, 'messages/enhanced'],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      try {
        const response = await apiRequest('GET', `/api/chats/${selectedConversationId}/messages/enhanced`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading messages:', error);
        return [];
      }
    },
    enabled: !!selectedConversationId,
    refetchInterval: 3000,
  });

  // Fetch all users
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/users');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading users:', error);
        return [];
      }
    },
    staleTime: 300000,
  });

  // Send message mutation with attachments
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, attachments, replyToId }: { 
      conversationId: number; 
      content: string; 
      attachments?: File[];
      replyToId?: number;
    }) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        throw new Error('Message content is required');
      }

      const formData = new FormData();
      formData.append('message', content.trim());
      formData.append('type', 'text');
      
      if (replyToId) {
        formData.append('replyToId', replyToId.toString());
      }
      
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      console.log('Sending message to conversation:', conversationId, 'Content:', content.trim());

      const response = await fetch(`/api/chats/${conversationId}/messages/enhanced`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Message send failed:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Message sent successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Message mutation success:', data);
      setNewMessage('');
      setSelectedFiles([]);
      setReplyToMessage(null);
      
      // Immediately refetch messages to show the new message
      queryClient.invalidateQueries({ queryKey: ['/api/chats', selectedConversationId, 'messages/enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats/enhanced'] });
      
      toast({
        title: "Success",
        description: "Message sent successfully"
      });
    },
    onError: (error: any) => {
      console.error('Message send error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number; content: string }) => {
      const response = await apiRequest('PUT', `/api/messages/${messageId}`, {
        content
      });
      return response.json();
    },
    onSuccess: () => {
      setEditingMessage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/chats', selectedConversationId, 'messages/enhanced'] });
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest('DELETE', `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', selectedConversationId, 'messages/enhanced'] });
    }
  });

  // Pin message mutation
  const pinMessageMutation = useMutation({
    mutationFn: async ({ messageId, isPinned }: { messageId: number; isPinned: boolean }) => {
      const response = await apiRequest('PUT', `/api/messages/${messageId}/pin`, {
        isPinned
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', selectedConversationId, 'messages/enhanced'] });
    }
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: number }) => {
      const response = await apiRequest('POST', '/api/chats/direct', {
        targetUserId
      });
      return response.json();
    },
    onSuccess: (conversation: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats/enhanced'] });
      setSelectedConversationId(conversation.id);
      toast({
        title: "Conversation Started",
        description: "You can now start messaging"
      });
    }
  });

  // Initialize WebSocket
  useEffect(() => {
    if (!currentUser) return;

    const socket = io('/chat', {
      auth: {
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
        token: localStorage.getItem('authToken')
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    socket.on('message', (message: Message) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', message.conversationId, 'messages/enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats/enhanced'] });
    });

    socket.on('messageUpdate', (updatedMessage: Message) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', updatedMessage.conversationId, 'messages/enhanced'] });
    });

    // Call events
    socket.on('incomingVoiceCall', (data) => {
      setCallState({
        isActive: true,
        type: 'voice',
        participants: data.participants,
        isMuted: false,
        isCameraOn: false,
        callLink: data.callLink
      });
      setShowCallDialog(true);
    });

    socket.on('incomingVideoCall', (data) => {
      setCallState({
        isActive: true,
        type: 'video',
        participants: data.participants,
        isMuted: false,
        isCameraOn: true,
        callLink: data.callLink
      });
      setShowCallDialog(true);
    });

    socket.on('callAccepted', (data) => {
      if (data.callLink) {
        window.open(data.callLink, '_blank');
      }
    });

    socket.on('callRejected', () => {
      setCallState({
        isActive: false,
        type: 'voice',
        participants: [],
        isMuted: false,
        isCameraOn: true
      });
      setShowCallDialog(false);
    });

    socket.on('callEnded', () => {
      setCallState({
        isActive: false,
        type: 'voice',
        participants: [],
        isMuted: false,
        isCameraOn: true
      });
      setShowCallDialog(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, queryClient]);

  // Helper functions
  const getDisplayName = (user: User) => {
    const name = `${user.firstName} ${user.lastName || ''}`.trim();
    return name || user.email;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || `Group (${conversation.participants.length})`;
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.id);
    return otherParticipant ? getDisplayName(otherParticipant) : 'Unknown User';
  };

  const getInitials = (user: User) => {
    const name = getDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Event handlers
  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    setReplyToMessage(null);
    setEditingMessage(null);
  };

  const handleSendMessage = () => {
    if (!selectedConversationId || (!newMessage.trim() && selectedFiles.length === 0)) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: newMessage.trim(),
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
      replyToId: replyToMessage?.id
    });
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !newMessage.trim()) return;
    
    editMessageMutation.mutate({
      messageId: editingMessage.id,
      content: newMessage.trim()
    });
  };

  const handleDeleteMessage = (messageId: number) => {
    deleteMessageMutation.mutate(messageId);
  };

  const handlePinMessage = (message: Message) => {
    pinMessageMutation.mutate({
      messageId: message.id,
      isPinned: !message.isPinned
    });
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
    messageInputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    if (!selectedConversationId || !socketRef.current) return;

    const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);
    if (!selectedConversation) return;

    // Generate call link (in real implementation, integrate with a service like Jitsi, Agora, etc.)
    const callLink = `https://meet.jit.si/testcasetracker-${selectedConversationId}-${Date.now()}`;

    socketRef.current.emit('startCall', {
      chatId: selectedConversationId,
      participants: selectedConversation.participantIds,
      type,
      callLink
    });

    setCallState({
      isActive: true,
      type,
      participants: selectedConversation.participantIds,
      isMuted: false,
      isCameraOn: type === 'video',
      callLink
    });

    // Open call link immediately for caller
    window.open(callLink, '_blank');
  };

  const handleAcceptCall = () => {
    if (socketRef.current && selectedConversationId) {
      socketRef.current.emit('acceptCall', { chatId: selectedConversationId });
      if (callState.callLink) {
        window.open(callState.callLink, '_blank');
      }
    }
    setShowCallDialog(false);
  };

  const handleRejectCall = () => {
    if (socketRef.current && selectedConversationId) {
      socketRef.current.emit('rejectCall', { chatId: selectedConversationId });
    }
    setCallState({
      isActive: false,
      type: 'voice',
      participants: [],
      isMuted: false,
      isCameraOn: true
    });
    setShowCallDialog(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleSaveEdit();
      } else {
        handleSendMessage();
      }
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);
  const pinnedMessages = selectedConversation?.pinnedMessages || [];

  return (
    <div className="flex h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <Button size="sm" variant="outline">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Available Users */}
        {allUsers.filter(user => user.id !== currentUser?.id).length > 0 && (
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Start New Conversation</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {allUsers
                .filter(user => user.id !== currentUser?.id)
                .slice(0, 5)
                .map(user => (
                <button
                  key={user.id}
                  onClick={() => createConversationMutation.mutate({ targetUserId: user.id })}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">{getDisplayName(user)}</div>
                    <div className="text-xs text-gray-500">{user.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map(conversation => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation.id)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-gray-50 transition-colors",
                    selectedConversationId === conversation.id && "bg-blue-50 border-r-2 border-blue-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {conversation.type === 'group' ? (
                        <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                      ) : (
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.participants.find(p => p.id !== currentUser?.id)?.profilePicture} />
                          <AvatarFallback>
                            {getInitials(conversation.participants.find(p => p.id !== currentUser?.id) || conversation.participants[0])}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {getConversationName(conversation)}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessage && formatMessageTime(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedConversation.type === 'group' ? (
                    <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participants.find(p => p.id !== currentUser?.id)?.profilePicture} />
                      <AvatarFallback>
                        {getInitials(selectedConversation.participants.find(p => p.id !== currentUser?.id) || selectedConversation.participants[0])}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {getConversationName(selectedConversation)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.type === 'group' 
                        ? `${selectedConversation.participants.length} members`
                        : 'Online'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleStartCall('voice')}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleStartCall('video')}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
              <div className="p-2 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Pin className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Pinned Messages</span>
                </div>
                <div className="space-y-1">
                  {pinnedMessages.map(message => (
                    <div key={message.id} className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                      <strong>{message.sender?.firstName}:</strong> {message.content}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderId === currentUser?.id;
                    const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].senderId !== message.senderId);
                    const sender = message.sender || selectedConversation.participants.find(p => p.id === message.senderId);
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3 group",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isOwnMessage && (
                          <div className="w-8">
                            {showAvatar && sender && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={sender.profilePicture} />
                                <AvatarFallback className="text-xs">{getInitials(sender)}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}
                        
                        <div className={cn(
                          "max-w-xs lg:max-w-md",
                          isOwnMessage ? "order-1" : "order-2"
                        )}>
                          {/* Reply indicator */}
                          {message.replyTo && (
                            <div className="mb-1 p-2 bg-gray-100 rounded border-l-2 border-blue-500 text-xs">
                              <strong>{message.replyTo.sender?.firstName}:</strong> {message.replyTo.content.substring(0, 50)}...
                            </div>
                          )}

                          <div className={cn(
                            "rounded-lg px-3 py-2 text-sm relative",
                            isOwnMessage 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-100 text-gray-900"
                          )}>
                            {/* Message actions */}
                            <div className={cn(
                              "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
                              isOwnMessage ? "-left-20" : "-right-20"
                            )}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleReplyToMessage(message)}
                              >
                                <Reply className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handlePinMessage(message)}
                              >
                                <Pin className={cn("h-3 w-3", message.isPinned && "text-yellow-500")} />
                              </Button>
                              {isOwnMessage && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditMessage(message)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleDeleteMessage(message.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>

                            <p>{message.content}</p>
                            
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.attachments.map(attachment => (
                                  <div key={attachment.id} className="flex items-center gap-2 p-2 bg-white/10 rounded">
                                    <Paperclip className="h-3 w-3" />
                                    <a 
                                      href={attachment.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs underline"
                                    >
                                      {attachment.name}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {message.isPinned && (
                              <Pin className="h-3 w-3 text-yellow-500 absolute top-1 right-1" />
                            )}
                          </div>
                          
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs text-gray-500",
                            isOwnMessage ? "justify-end" : "justify-start"
                          )}>
                            <Clock className="h-3 w-3" />
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {message.isEdited && (
                              <span className="text-gray-400">(edited)</span>
                            )}
                            {isOwnMessage && (
                              <CheckCheck className={cn(
                                "h-3 w-3",
                                message.read ? "text-blue-500" : "text-gray-400"
                              )} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Reply indicator */}
            {replyToMessage && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Replying to <strong>{replyToMessage.sender?.firstName}</strong>: {replyToMessage.content.substring(0, 50)}...
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyToMessage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* File preview */}
            {selectedFiles.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white px-2 py-1 rounded border">
                      <Paperclip className="h-3 w-3" />
                      <span className="text-xs">{file.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                    disabled={sendMessageMutation.isPending || editMessageMutation.isPending}
                    className="min-h-[40px]"
                  />
                </div>
                
                {editingMessage ? (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveEdit}
                      disabled={!newMessage.trim() || editMessageMutation.isPending}
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button 
                      onClick={() => {
                        setEditingMessage(null);
                        setNewMessage('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && selectedFiles.length === 0) || sendMessageMutation.isPending}
                    size="sm"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Messages</h3>
              <p className="text-gray-500 mb-4">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Incoming {callState.type === 'video' ? 'Video' : 'Voice'} Call
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>You have an incoming {callState.type} call.</p>
            <div className="flex gap-2">
              <Button onClick={handleAcceptCall} className="flex-1">
                {callState.type === 'video' ? <Video className="h-4 w-4 mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
                Accept
              </Button>
              <Button onClick={handleRejectCall} variant="destructive" className="flex-1">
                <PhoneCall className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
