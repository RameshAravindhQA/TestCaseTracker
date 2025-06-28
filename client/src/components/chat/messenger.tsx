import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Search, 
  Plus,
  Smile,
  Paperclip,
  Hash,
  Users,
  Star,
  Reply,
  Forward,
  Trash2,
  Edit,
  Pin
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId?: number;
  chatId: number;
  type: 'text' | 'image' | 'file';
  replyTo?: number;
  reactions: { emoji: string; userId: number; count: number }[];
  isPinned: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Chat {
  id: number;
  name?: string;
  type: 'direct' | 'group' | 'space';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  description?: string;
  createdAt: string;
}

interface Thread {
  id: number;
  parentMessageId: number;
  messages: Message[];
  participantCount: number;
}

export function Messenger() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return response.json();
    },
  });

  // Fetch chats
  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chats');
      return response.json();
    },
  });

  // Fetch messages for selected chat
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat) return [];
      const response = await apiRequest('GET', `/api/chats/${selectedChat.id}/messages`);
      return response.json();
    },
    enabled: !!selectedChat,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; chatId: number; replyTo?: number }) => {
      const response = await apiRequest('POST', '/api/messages', messageData);
      return response.json();
    },
    onSuccess: () => {
      setMessageInput('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
  });

  // Create chat mutation
  const createChatMutation = useMutation({
    mutationFn: async (chatData: { name?: string; type: string; participantIds: number[] }) => {
      const response = await apiRequest('POST', '/api/chats', chatData);
      return response.json();
    },
    onSuccess: (newChat) => {
      setSelectedChat(newChat);
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    sendMessageMutation.mutate({
      content: messageInput,
      chatId: selectedChat.id,
      replyTo: replyingTo?.id,
    });
  };

  const handleCreateDirectChat = (user: User) => {
    createChatMutation.mutate({
      type: 'direct',
      participantIds: [user.id],
    });
  };

  const handleCreateGroupChat = () => {
    // Implementation for group chat creation
    const selectedUserIds = [1, 2]; // This should come from a selection UI
    createChatMutation.mutate({
      name: 'New Group',
      type: 'group',
      participantIds: selectedUserIds,
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messenger
            </h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateGroupChat}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserPanel(!showUserPanel)}
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations or people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Chats List */}
          <div className={`${showUserPanel ? 'w-1/2' : 'w-full'} border-r`}>
            <ScrollArea className="h-full">
              <div className="p-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Conversations</h3>
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent ${
                      selectedChat?.id === chat.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <Avatar>
                      <AvatarImage src={chat.participants[0]?.avatar} />
                      <AvatarFallback>
                        {chat.type === 'group' ? <Hash className="h-4 w-4" /> : 
                         getInitials(chat.participants[0]?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {chat.name || chat.participants[0]?.name}
                        </p>
                        {chat.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Users Panel */}
          {showUserPanel && (
            <div className="w-1/2">
              <ScrollArea className="h-full">
                <div className="p-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">People</h3>
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent"
                      onClick={() => handleCreateDirectChat(user)}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                          user.status === 'online' ? 'bg-green-500' :
                          user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedChat.participants[0]?.avatar} />
                  <AvatarFallback>
                    {selectedChat.type === 'group' ? <Hash className="h-4 w-4" /> : 
                     getInitials(selectedChat.participants[0]?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {selectedChat.name || selectedChat.participants[0]?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedChat.type === 'group' 
                      ? `${selectedChat.participants.length} members`
                      : selectedChat.participants[0]?.status}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={users.find(u => u.id === message.senderId)?.avatar} />
                      <AvatarFallback>
                        {getInitials(users.find(u => u.id === message.senderId)?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {users.find(u => u.id === message.senderId)?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                        {message.isPinned && <Pin className="h-3 w-3 text-yellow-500" />}
                        {message.isEdited && <span className="text-xs text-muted-foreground">(edited)</span>}
                      </div>
                      {message.replyTo && (
                        <div className="bg-muted p-2 rounded mb-2 text-sm">
                          Replying to: {messages.find(m => m.id === message.replyTo)?.content}
                        </div>
                      )}
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{message.content}</p>
                      </div>
                      {message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {message.reactions.map((reaction, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {reaction.emoji} {reaction.count}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2 opacity-0 hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(message)}>
                          <Reply className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Smile className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Forward className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply Banner */}
            {replyingTo && (
              <div className="px-4 py-2 bg-muted border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply className="h-4 w-4" />
                  <span className="text-sm">
                    Replying to {users.find(u => u.id === replyingTo.senderId)?.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messenger;