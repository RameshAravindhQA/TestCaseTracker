import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Users, 
  MessageCircle, 
  Phone, 
  Video, 
  MoreHorizontal, 
  Search, 
  Plus, 
  Paperclip, 
  Smile, 
  User,
  Edit,
  Trash2,
  Reply,
  Tag,
  Image,
  FileText,
  Download,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  role: string;
  lastSeen?: string;
  isOnline?: boolean;
}

interface MessageAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
  isEdited?: boolean;
  type: 'text' | 'image' | 'file' | 'voice';
  attachments?: MessageAttachment[];
  reactions?: { emoji: string; userId: number; count: number }[];
  replyTo?: Message;
  tags?: string[];
  sender: Contact;
}

interface Chat {
  id: number;
  participants: Contact[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// Emoji picker data
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Gestures': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Objects': ['💼', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️']
};

export function Messenger() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch all users for contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ['/api/users/public'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users/public');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      return data.filter((contact: Contact) => contact.id !== user?.id);
    },
  });

  // Fetch messages for selected contact
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact) return [];
      const response = await apiRequest('GET', `/api/messages?userId=${selectedContact.id}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!selectedContact,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // WebSocket connection setup
  useEffect(() => {
    if (!user) return;

    const connectWebSocket = () => {
      try {
        setConnectionStatus('connecting');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('connected');
          setIsConnected(true);

          // Authenticate with server
          ws.send(JSON.stringify({
            type: 'authenticate',
            data: {
              userId: user.id,
              userName: `${user.firstName} ${user.lastName || ''}`.trim()
            }
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'new_message') {
              // Refresh messages when new message received
              queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact?.id] });
            } else if (message.type === 'authenticated') {
              console.log('WebSocket authenticated');
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
          setIsConnected(false);

          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (user) {
              connectWebSocket();
            }
          }, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('disconnected');
          setIsConnected(false);
        };

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnectionStatus('disconnected');
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: number; content: string; type?: string; attachments?: any[] }) => {
      const response = await apiRequest('POST', '/api/messages', messageData);
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      setAttachments([]);
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact?.id] });

      // Also send via WebSocket for real-time delivery
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedContact) {
        wsRef.current.send(JSON.stringify({
          type: 'send_message',
          data: {
            receiverId: selectedContact.id,
            message: newMessage.trim(),
            type: 'text'
          }
        }));
      }

      toast({
        title: "✅ Message sent",
        description: "Your message has been delivered successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const response = await apiRequest('PUT', `/api/messages/${id}`, { content });
      if (!response.ok) throw new Error('Failed to edit message');
      return response.json();
    },
    onSuccess: () => {
      setEditingMessageId(null);
      setEditingContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact?.id] });
      toast({
        title: "✅ Message updated",
        description: "Your message has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Failed to edit message",
        variant: "destructive",
      });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/messages/${id}`);
      if (!response.ok) throw new Error('Failed to delete message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact?.id] });
      toast({
        title: "✅ Message deleted",
        description: "Your message has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  // React to message mutation
  const reactToMessageMutation = useMutation({
    mutationFn: async ({ id, emoji }: { id: number; emoji: string }) => {
      const response = await apiRequest('POST', `/api/messages/${id}/react`, { emoji });
      if (!response.ok) throw new Error('Failed to react to message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact?.id] });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Failed to react to message",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const messageData = {
      receiverId: selectedContact.id,
      content: newMessage.trim(),
      type: attachments.length > 0 ? 'file' : 'text',
      attachments: attachments.map(file => ({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }))
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editingContent.trim()) {
      editMessageMutation.mutate({ id: editingMessageId, content: editingContent.trim() });
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
    setNewMessage(`@${message.sender.firstName} `);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReactToMessage = (messageId: number, emoji: string) => {
    reactToMessageMutation.mutate({ id: messageId, emoji });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) {
        handleSaveEdit();
      } else {
        handleSendMessage();
      }
    }
  };

  const startVoiceCall = () => {
    if (selectedContact) {
      const roomName = `voice-${Math.min(user?.id || 0, selectedContact.id)}-${Math.max(user?.id || 0, selectedContact.id)}`;
      const jitsiUrl = `https://meet.jit.si/${roomName}`;
      window.open(jitsiUrl, '_blank');
      toast({
        title: "📞 Voice call started",
        description: "Opening Jitsi Meet for voice call",
      });
    }
  };

  const startVideoCall = () => {
    if (selectedContact) {
      const roomName = `video-${Math.min(user?.id || 0, selectedContact.id)}-${Math.max(user?.id || 0, selectedContact.id)}`;
      const jitsiUrl = `https://meet.jit.si/${roomName}`;
      window.open(jitsiUrl, '_blank');
      toast({
        title: "📹 Video call started",
        description: "Opening Jitsi Meet for video call",
      });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'developer': return 'bg-green-100 text-green-800';
      case 'tester': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContacts = contacts.filter(contact =>
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMessageContent = (message: Message) => {
    if (message.type === 'image') {
      return (
        <div className="space-y-2">
          {message.attachments?.map((attachment, index) => (
            <div key={index} className="relative">
              <img 
                src={attachment.fileUrl} 
                alt={attachment.fileName}
                className="max-w-xs rounded-lg cursor-pointer"
                onClick={() => window.open(attachment.fileUrl, '_blank')}
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                onClick={() => window.open(attachment.fileUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <p className="text-sm">{message.content}</p>
        </div>
      );
    }

    if (message.type === 'file') {
      return (
        <div className="space-y-2">
          {message.attachments?.map((attachment, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                <p className="text-xs text-gray-500">{(attachment.fileSize / 1024).toFixed(1)} KB</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(attachment.fileUrl, '_blank')}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <p className="text-sm">{message.content}</p>
        </div>
      );
    }

    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages 💬</h2>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Contacts List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {contactsLoading ? (
              <div className="p-4 text-center text-gray-500">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No contacts found</div>
            ) : (
              filteredContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                    selectedContact?.id === contact.id && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                  )}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.profilePicture} alt={`${contact.firstName} ${contact.lastName}`} />
                      <AvatarFallback>
                        {contact.firstName[0]}{contact.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </div>

                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <Badge variant="secondary" className={cn("text-xs", getRoleColor(contact.role))}>
                        {contact.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {contact.email}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedContact.profilePicture} alt={`${selectedContact.firstName} ${selectedContact.lastName}`} />
                    <AvatarFallback>
                      {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedContact.isOnline ? '🟢 Active now' : `🔴 Last seen ${selectedContact.lastSeen || 'recently'}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Connection Status */}
                  <div className="flex items-center space-x-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      connectionStatus === 'connected' ? 'bg-green-500' :
                      connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                    <span className="text-xs text-gray-500">
                      {connectionStatus === 'connected' ? 'Online' :
                       connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
                    </span>
                  </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={startVoiceCall}
                    title="Start voice call"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={startVideoCall}
                    title="Start video call"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet. Start a conversation! 💬</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex group",
                        message.senderId === user?.id ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "flex items-end space-x-2 max-w-xs lg:max-w-md",
                        message.senderId === user?.id ? "flex-row-reverse space-x-reverse" : "flex-row"
                      )}>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={message.sender.profilePicture} />
                          <AvatarFallback className="text-xs">
                            {message.sender.firstName[0]}{message.sender.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "rounded-lg px-3 py-2",
                          message.senderId === user?.id 
                            ? "bg-blue-500 text-white" 
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                        )}>
                          {editingMessageId === message.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="min-h-[60px] resize-none"
                                onKeyPress={handleKeyPress}
                              />
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {message.replyTo && (
                                <div className="text-xs opacity-75 mb-1 p-1 bg-black/10 rounded">
                                  Replying to: {message.replyTo.content.substring(0, 50)}...
                                </div>
                              )}
                              {renderMessageContent(message)}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="flex space-x-1 mt-1">
                                  {message.reactions.map((reaction, index) => (
                                    <span key={index} className="text-xs bg-black/10 px-1 rounded">
                                      {reaction.emoji} {reaction.count}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <p className={cn(
                                  "text-xs",
                                  message.senderId === user?.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                )}>
                                  {formatMessageTime(message.timestamp)}
                                  {message.isEdited && <span className="ml-1">(edited)</span>}
                                </p>
                                {message.senderId === user?.id && (
                                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        {message.senderId !== user?.id && (
                          <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleReplyToMessage(message)}
                            >
                              <Reply className="h-3 w-3" />
                            </Button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                >
                                  <Smile className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-2">
                                <div className="grid grid-cols-8 gap-1">
                                  {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                                    <div key={category} className="col-span-8">
                                      <p className="text-xs font-medium mb-1">{category}</p>
                                      <div className="grid grid-cols-8 gap-1">
                                        {emojis.map((emoji) => (
                                          <Button
                                            key={emoji}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handleReactToMessage(message.id, emoji)}
                                          >
                                            {emoji}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {replyingTo && (
                <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-500">Replying to {replyingTo.sender.firstName}</p>
                  <p className="text-sm truncate">{replyingTo.content}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-2"
                    onClick={() => setReplyingTo(null)}
                  >
                    ×
                  </Button>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => removeAttachment(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
```text```text
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[40px] max-h-[120px] resize-none pr-10"
                  />
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2">
                      <div className="grid grid-cols-8 gap-1">
                        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                          <div key={category} className="col-span-8">
                            <p className="text-xs font-medium mb-1">{category}</p>
                            <div className="grid grid-cols-8 gap-1">
                              {emojis.map((emoji) => (
                                <Button
                                  key={emoji}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEmojiSelect(emoji)}
                                >
                                  {emoji}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a conversation 💬
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose from your existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}