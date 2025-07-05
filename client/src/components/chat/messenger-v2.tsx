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
import { Separator } from '@/components/ui/separator';
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
  Hash
} from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
}

interface Conversation {
  id: number;
  participantIds: number[];
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
  type: 'direct' | 'group';
  name?: string; // For group conversations
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
}

interface MessengerV2Props {
  currentUserId?: number;
  onConversationChange?: (conversationId: number | null) => void;
}

export function MessengerV2({ currentUserId, onConversationChange }: MessengerV2Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    staleTime: 300000, // 5 minutes
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/chats');
        const data = await response.json();
        console.log('Loaded conversations:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading conversations:', error);
        return [];
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['/api/chats', selectedConversationId, 'messages'],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      try {
        const response = await apiRequest('GET', `/api/chats/${selectedConversationId}/messages`);
        const data = await response.json();
        console.log('Loaded messages for conversation', selectedConversationId, ':', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading messages:', error);
        return [];
      }
    },
    enabled: !!selectedConversationId,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time messages
  });

  // Fetch all users for starting new conversations
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
    staleTime: 300000, // 5 minutes
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      console.log('Sending message to conversation:', conversationId, 'content:', content);
      const response = await apiRequest('POST', `/api/chats/${conversationId}/messages`, {
        message: content,
        type: 'text'
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Message sent successfully:', data);
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/chats', selectedConversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: number }) => {
      console.log('Creating direct conversation with user:', targetUserId);
      const response = await apiRequest('POST', '/api/chats/direct', {
        targetUserId
      });
      const result = await response.json();
      console.log('Conversation created:', result);
      return result;
    },
    onSuccess: (conversation: any) => {
      console.log('Setting selected conversation:', conversation.id);
      
      // Invalidate and refetch conversations first
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      // Then set the selected conversation
      setSelectedConversationId(conversation.id);
      onConversationChange?.(conversation.id);
      
      // Invalidate messages for the new conversation
      queryClient.invalidateQueries({ queryKey: ['/api/chats', conversation.id, 'messages'] });
      
      // Wait for UI to update then focus input
      setTimeout(() => {
        const messageInput = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
        if (messageInput) {
          messageInput.focus();
        }
      }, 800);
      
      toast({
        title: "Conversation Started",
        description: "You can now start messaging"
      });
    },
    onError: (error: any) => {
      console.error('Failed to create conversation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
        variant: "destructive"
      });
    }
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      await apiRequest('POST', `/api/conversations/${conversationId}/mark-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }
  });

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

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Event handlers
  const handleConversationSelect = (conversationId: number) => {
    console.log('Selecting conversation:', conversationId);
    setSelectedConversationId(conversationId);
    onConversationChange?.(conversationId);
    
    // Trigger messages refetch
    queryClient.invalidateQueries({ queryKey: ['/api/chats', conversationId, 'messages'] });
    
    // Focus on message input with longer delay to ensure DOM is ready
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
        console.log('Focused on message input for conversation:', conversationId);
      }
    }, 800);
  };

  const handleSendMessage = () => {
    if (!selectedConversationId || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: newMessage.trim()
    });
  };

  const handleStartConversation = (userId: number) => {
    if (!currentUser) {
      console.error('No current user for conversation creation');
      return;
    }
    
    console.log('Starting conversation with user:', userId, 'current user:', currentUser.id);
    
    // Check if conversation already exists
    const existingConversation = conversations.find(conv => 
      conv.type === 'direct' && 
      conv.participantIds && 
      conv.participantIds.includes(userId) && 
      conv.participantIds.includes(currentUser.id) &&
      conv.participantIds.length === 2
    );
    
    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation.id);
      handleConversationSelect(existingConversation.id);
      return;
    }
    
    console.log('Creating new direct conversation...');
    // Create new conversation using the direct chat endpoint
    createConversationMutation.mutate({
      targetUserId: userId
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const conversationName = getConversationName(conv).toLowerCase();
    return conversationName.includes(searchQuery.toLowerCase());
  });

  // Filter users for new conversations (exclude current user and existing conversation participants)
  const availableUsers = allUsers.filter(user => {
    if (user.id === currentUser?.id) return false;
    
    const hasDirectConversation = conversations.some(conv => 
      conv.type === 'direct' && 
      conv.participantIds.includes(user.id) && 
      conv.participantIds.includes(currentUser?.id || 0)
    );
    
    return !hasDirectConversation;
  });

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

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

        {/* Available Users for New Conversations */}
        {availableUsers.length > 0 && (
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Start New Conversation</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {availableUsers.slice(0, 5).map(user => (
                <button
                  key={user.id}
                  onClick={() => handleStartConversation(user.id)}
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
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No conversations found</p>
              <p className="text-xs text-gray-400 mt-1">Start a new conversation to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map(conversation => (
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
                        : `Last seen ${formatLastSeen(selectedConversation.updatedAt)}`
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

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
                          "flex gap-3",
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
                          <div className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            isOwnMessage 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-100 text-gray-900"
                          )}>
                            <p>{message.content}</p>
                          </div>
                          
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs text-gray-500",
                            isOwnMessage ? "justify-end" : "justify-start"
                          )}>
                            <Clock className="h-3 w-3" />
                            <span>{formatMessageTime(message.createdAt)}</span>
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

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sendMessageMutation.isPending}
                    className="min-h-[40px] bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {isTyping && (
                <div className="mt-2 text-xs text-gray-500">
                  Someone is typing...
                </div>
              )}
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
    </div>
  );
}