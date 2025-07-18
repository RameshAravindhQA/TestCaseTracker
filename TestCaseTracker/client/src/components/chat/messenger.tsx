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
  const { user, isAuthenticated } = useAuth();
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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);


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
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact) return [];
      try {
        console.log(`[MESSENGER] Fetching messages for contact: ${selectedContact.id}`);

        // Get or create direct conversation
        let conversationResponse = await apiRequest('GET', `/api/conversations/direct?userId=${selectedContact.id}`);
        if (conversationResponse.status === 404) {
          console.log('[MESSENGER] Conversation not found, creating new one');
          // Create new conversation if it doesn't exist
          conversationResponse = await apiRequest('POST', '/api/conversations/direct', {
            userId: selectedContact.id
          });
        }

        if (!conversationResponse.ok) {
          const errorText = await conversationResponse.text();
          console.error('[MESSENGER] Conversation API error:', errorText);
          throw new Error('Failed to get conversation');
        }

        const conversation = await conversationResponse.json();
        console.log('[MESSENGER] Got conversation:', conversation);

        // Fetch messages for this conversation
        const messagesResponse = await apiRequest('GET', `/api/messages/conversation/${conversation.id}`);
        if (!messagesResponse.ok) {
          if (messagesResponse.status === 404) {
            console.log('[MESSENGER] No messages found for conversation');
            return []; // No messages yet
          }
          const errorText = await messagesResponse.text();
          console.error('[MESSENGER] Messages API error:', errorText);
          throw new Error('Failed to fetch messages');
        }

        const messagesData = await messagesResponse.json();
        console.log('[MESSENGER] Got messages:', messagesData);
        return Array.isArray(messagesData) ? messagesData : [];
      } catch (error) {
        console.error('[MESSENGER] Error fetching messages:', error);
        toast({
          title: "Connection Error",
          description: "Failed to load messages. Please check your connection.",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!selectedContact,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
    retry: false, // Don't retry on failure to avoid spam
  });

  // WebSocket connection setup
  useEffect(() => {
    if (!user) return;

    const connectWebSocket = () => {
      try {
        setConnectionStatus('connecting');

        // Use correct WebSocket URL for Replit
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // Include port for development
        const wsUrl = `${protocol}//${host}/ws`;

        console.log(`[MESSENGER] Attempting to connect to WebSocket: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[MESSENGER] WebSocket connected successfully');
          setConnectionStatus('connected');
          setIsConnected(true);

          // Authenticate user
          ws.send(JSON.stringify({
            type: 'authenticate',
            data: {
              userId: user.id,
              userName: user.firstName || user.name || 'Unknown User'
            }
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[MESSENGER] Received WebSocket message:', data);

            switch (data.type) {
              case 'authenticated':
                console.log('[MESSENGER] User authenticated via WebSocket');
                break;
              case 'new_message':
                // Handle new message
                queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
                if (selectedContact && (data.message.senderId === selectedContact.id || data.message.receiverId === selectedContact.id)) {
                  queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact.id] });
                  refetchMessages(); // Force immediate refresh
                }
                if (data.message.senderId !== user?.id) {
                  toast({
                    title: "New message",
                    description: `From ${data.message.sender?.firstName || 'Unknown'}`,
                  });
                }
                break;
              case 'user_typing':
                if (data.userId !== user.id) {
                  setIsTyping(data.isTyping);
                }
                break;
              case 'presence_update':
                // Update user presence
                queryClient.invalidateQueries({ queryKey: ['/api/users/public'] });
                break;
              case 'error':
                console.error('[MESSENGER] WebSocket error:', data.error);
                toast({
                  title: "Connection Error",
                  description: data.error,
                  variant: "destructive"
                });
                break;
            }
          } catch (error) {
            console.error('[MESSENGER] Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('[MESSENGER] WebSocket connection closed:', event);
          setConnectionStatus('disconnected');
          setIsConnected(false);
          wsRef.current = null;

          // Attempt to reconnect after a delay (only if it wasn't a clean close)
          if (!event.wasClean && event.code !== 1000) {
            setTimeout(() => {
              console.log('[MESSENGER] Attempting to reconnect...');
              connectWebSocket();
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error('[MESSENGER] WebSocket error:', error);
          setConnectionStatus('disconnected');
          setIsConnected(false);
        };

      } catch (error) {
        console.error('[MESSENGER] Failed to create WebSocket connection:', error);
        setConnectionStatus('disconnected');
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, queryClient, toast]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: number; content: string; type?: string; attachments?: any[] }) => {
      if (!selectedContact) throw new Error('No contact selected');

      try {
        console.log('[MESSENGER] Sending message to:', selectedContact.id);

        // Get or create conversation first
        let conversationResponse = await apiRequest('GET', `/api/conversations/direct?userId=${selectedContact.id}`);
        if (conversationResponse.status === 404) {
          console.log('[MESSENGER] Creating new conversation');
          conversationResponse = await apiRequest('POST', '/api/conversations/direct', {
            userId: selectedContact.id
          });
        }

        if (!conversationResponse.ok) {
          const errorText = await conversationResponse.text();
          console.error('[MESSENGER] Conversation error:', errorText);
          throw new Error('Failed to get conversation');
        }

        const conversation = await conversationResponse.json();
        console.log('[MESSENGER] Using conversation:', conversation.id);

        // Send via API for persistence first
        const response = await apiRequest('POST', '/api/messages', {
          conversationId: conversation.id,
          receiverId: messageData.receiverId,
          content: messageData.content,
          type: messageData.type || 'text',
          attachments: messageData.attachments || []
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[MESSENGER] Send message API error:', errorText);
          throw new Error('Failed to send message');
        }

        const messageResult = await response.json();
        console.log('[MESSENGER] Message sent successfully:', messageResult);

        // Then send via WebSocket for real-time delivery (if connected)
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({
              type: 'send_message',
              data: {
                conversationId: conversation.id,
                receiverId: selectedContact.id,
                message: messageData.content,
                type: messageData.type || 'text',
                attachments: messageData.attachments || []
              }
            }));
          } catch (wsError) {
            console.error('[MESSENGER] WebSocket send error:', wsError);
            // Don't fail the mutation if WebSocket fails
          }
        }

        return messageResult;
      } catch (error) {
        console.error('[MESSENGER] Send message error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setNewMessage('');
      setAttachments([]);
      setReplyingTo(null);

      // Immediately refetch messages to show the new message
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact?.id] });

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

  const filteredContacts = (contacts || []).filter(contact => {
    if (!contact) return false;

    // Handle both the old format (firstName, lastName) and new format (name)
    const displayName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    const email = contact.email || '';

    if (!displayName && !email) return false;

    if (!searchTerm) return true;

    return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

  // Fetch conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/chats');
        if (!response.ok) {
          console.warn('Failed to fetch conversations, returning empty array');
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  // Fetch users for direct messaging
  const { data: users = [] } = useQuery({
    queryKey: ['users', 'public'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/users/public');
        if (!response.ok) {
          console.warn('Failed to fetch users, returning empty array');
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  // Fetch messages for selected conversation
  const { data: messages1 = [], refetch: refetchMessages1 } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];

      try {
        const response = await fetch(`/api/messages/conversation/${selectedConversation.id}`);
        if (!response.ok) {
          console.warn(`Failed to fetch messages for conversation ${selectedConversation.id}`);
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!selectedConversation?.id,
  });

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log('[MESSENGER] Attempting to connect to WebSocket...');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[MESSENGER] WebSocket connected successfully');
          setIsConnected(true);

          // Send authentication message
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'auth',
              userId: user.id,
              userEmail: user.email
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[MESSENGER] Received WebSocket message:', data);

            if (data.type === 'message') {
              // Add new message to the messages
              refetchMessages1();
              refetchConversations();
            } else if (data.type === 'userStatus') {
              // Handle user online/offline status
              console.log('[MESSENGER] User status update:', data);
            }
          } catch (error) {
            console.error('[MESSENGER] Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('[MESSENGER] WebSocket connection closed:', event.code, event.reason);
          setIsConnected(false);

          // Attempt to reconnect after 3 seconds
          if (event.code !== 1000) { // Not a normal closure
            reconnectTimeout = setTimeout(() => {
              console.log('[MESSENGER] Attempting to reconnect...');
              connect();
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error('[MESSENGER] WebSocket error:', error);
          setIsConnected(false);
        };

        setSocket(ws);
      } catch (error) {
        console.error('[MESSENGER] Failed to create WebSocket connection:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [isAuthenticated, user, refetchMessages1, refetchConversations]);

  // Handle starting a conversation with a user
  const handleStartConversation = async (targetUser: any) => {
    if (!targetUser || !targetUser.id) {
      console.error('Invalid target user for conversation');
      return;
    }

    try {
      const response = await fetch('/api/chats/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: targetUser.id,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to create conversation, using mock conversation');
        // Create a mock conversation for UI purposes
        const mockConversation = {
          id: Date.now(),
          name: targetUser.name || targetUser.firstName || 'Unknown User',
          type: 'direct',
          participants: [user?.id, targetUser.id],
          lastMessage: null,
          lastMessageAt: new Date().toISOString()
        };
        setSelectedConversation(mockConversation);
        setShowUserList(false);
        return;
      }

      const conversation = await response.json();
      setSelectedConversation(conversation);
      setShowUserList(false);
      refetchConversations();

    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
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
              filteredContacts.map((contact) => {
                if (!contact) return null;

                // Handle both old format (firstName, lastName) and new format (name)
                const displayName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
                const initials = contact.name ? 
                  contact.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 
                  `${contact.firstName?.[0] || '?'}${contact.lastName?.[0] || '?'}`;

                if (!displayName) return null;

                return (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={