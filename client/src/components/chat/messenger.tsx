import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Send, 
  Phone, 
  Video, 
  Users, 
  Settings, 
  MoreVertical, 
  Edit, 
  Reply, 
  Tag, 
  Search,
  Plus,
  Smile,
  Paperclip,
  Mic,
  Image as ImageIcon,
  FileText,
  Calendar,
  Archive,
  Trash2,
  Star,
  Pin,
  Clock,
  CheckCheck,
  Check,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  MessageSquare,
  UserPlus,
  Hash,
  Globe,
  Lock,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface ChatMessage {
  id: number;
  conversationId: number;
  userId: number;
  message: string;
  type: 'text' | 'system' | 'mention';
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  replyToId?: number;
  mentionedUsers?: number[];
  attachments?: string[];
  reactions?: { id: number; emoji: string; userId: number; createdAt: string }[];
  replyCount?: number;
  user?: {
    id: number;
    firstName: string;
    lastName?: string;
    profilePicture?: string;
  };
  thread?: ChatMessage[];
}

interface Conversation {
  id: number;
  name: string;
  type: 'direct' | 'group' | 'channel';
  description?: string;
  isPrivate: boolean;
  lastMessage?: ChatMessage;
  lastMessageAt?: string;
  unreadCount: number;
  memberCount: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

interface ConversationMember {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  profilePicture?: string;
  role: string;
  isOnline: boolean;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  error?: string;
  timestamp?: string;
  userId?: number;
  conversationId?: number;
  message?: ChatMessage;
  isTyping?: boolean;
  userName?: string;
  isOnline?: boolean;
  messageId?: number;
  readAt?: string;
  presence?: { userId: number; isOnline: boolean; lastSeen?: string }[];
}

const Messenger = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: number]: string[] }>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [showMembersList, setShowMembersList] = useState(false);
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [newConversationType, setNewConversationType] = useState<'direct' | 'group' | 'channel'>('group');
  const [newConversationName, setNewConversationName] = useState("");
  const [newConversationDescription, setNewConversationDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // WebSocket connection and management
  const connectWebSocket = useCallback(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat`;

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionRetries(0);

        // Authenticate
        ws.send(JSON.stringify({
          type: 'authenticate',
          data: {
            userId: user.id,
            userName: user.firstName
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect if not a clean close
        if (!event.wasClean && connectionRetries < 5) {
          const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
          console.log(`Reconnecting in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionRetries(prev => prev + 1);
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [user, connectionRetries]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    const { type, data } = message;

    switch (type) {
      case 'connection_established':
        console.log('WebSocket connection established');
        break;

      case 'authenticated':
        console.log('WebSocket authenticated');
        if (data?.onlineUsers) {
          setOnlineUsers(new Set(data.onlineUsers.map((u: any) => u.userId)));
        }
        break;

      case 'new_message':
        if (message.message) {
          // Update conversations list
          queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });

          // Update messages if viewing this conversation
          if (message.message.conversationId === selectedConversation) {
            queryClient.invalidateQueries({ 
              queryKey: [`/api/chat/conversations/${selectedConversation}/messages`] 
            });
          }

          // Clear typing indicator for this user
          if (message.message.conversationId) {
            setTypingUsers(prev => ({
              ...prev,
              [message.message.conversationId]: prev[message.message.conversationId]?.filter(
                name => name !== message.message?.user?.firstName
              ) || []
            }));
          }
        }
        break;

      case 'user_typing':
        if (message.conversationId && message.userName) {
          setTypingUsers(prev => {
            const currentTyping = prev[message.conversationId] || [];
            if (message.isTyping) {
              if (!currentTyping.includes(message.userName)) {
                return {
                  ...prev,
                  [message.conversationId]: [...currentTyping, message.userName]
                };
              }
            } else {
              return {
                ...prev,
                [message.conversationId]: currentTyping.filter(name => name !== message.userName)
              };
            }
            return prev;
          });
        }
        break;

      case 'presence_update':
        if (message.userId !== undefined) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            if (message.isOnline) {
              newSet.add(message.userId);
            } else {
              newSet.delete(message.userId);
            }
            return newSet;
          });
        }

        if (data?.presence) {
          setOnlineUsers(new Set(data.presence.filter((p: any) => p.isOnline).map((p: any) => p.userId)));
        }
        break;

      case 'user_joined':
      case 'user_left':
        // Refresh members list if viewing this conversation
        if (message.conversationId === selectedConversation) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/chat/conversations/${selectedConversation}/members`] 
          });
        }
        break;

      case 'message_read':
        // Update read status in cache
        if (message.messageId && selectedConversation) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/chat/conversations/${selectedConversation}/messages`] 
          });
        }
        break;

      case 'error':
        console.error('WebSocket error:', message.error);
        toast({
          title: "Connection Error",
          description: message.error,
          variant: "destructive",
        });
        break;

      default:
        console.log('Unknown WebSocket message type:', type);
    }
  }, [selectedConversation, queryClient, toast]);

  // Join/leave conversations via WebSocket
  const joinConversation = useCallback((conversationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_conversation',
        data: { conversationId }
      }));
    }
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave_conversation',
        data: { conversationId }
      }));
    }
  }, []);

  // Typing indicators
  const startTyping = useCallback((conversationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing_start',
        data: { conversationId }
      }));
    }
  }, []);

  const stopTyping = useCallback((conversationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing_stop',
        data: { conversationId }
      }));
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [user, connectWebSocket]);

  // Join conversation when selected
  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation);

      return () => {
        leaveConversation(selectedConversation);
      };
    }
  }, [selectedConversation, joinConversation, leaveConversation]);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/chat/conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chat/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/conversations/${selectedConversation}/messages`],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await apiRequest('GET', `/api/chat/conversations/${selectedConversation}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  // Fetch conversation members
  const { data: conversationMembers = [] } = useQuery<ConversationMember[]>({
    queryKey: [`/api/chat/conversations/${selectedConversation}/members`],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await apiRequest('GET', `/api/chat/conversations/${selectedConversation}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  // Fetch all users for member selection
  const { data: allUsers = [] } = useQuery<ConversationMember[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: showCreateConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; replyToId?: number; attachments?: string[] }) => {
      if (!selectedConversation) throw new Error("No conversation selected");

      const response = await apiRequest("POST", `/api/chat/messages`, {
        ...messageData,
        conversationId: selectedConversation
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      setReplyingTo(null);
      // Message will be updated via WebSocket
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (conversationData: { 
      name: string; 
      type: string; 
      participants: number[]; 
      description?: string; 
      isPrivate?: boolean 
    }) => {
      const response = await apiRequest("POST", `/api/chat/conversations`, conversationData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setSelectedConversation(newConversation.id);
      setShowCreateConversation(false);
      setNewConversationName("");
      setNewConversationDescription("");
      setSelectedMembers([]);
      toast({
        title: "Success",
        description: "Conversation created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create conversation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle message sending
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || sendMessageMutation.isPending) {
      return;
    }

    // Stop typing indicator
    if (selectedConversation) {
      stopTyping(selectedConversation);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    sendMessageMutation.mutate({
      message: newMessage.trim(),
      replyToId: replyingTo?.id
    });
  };

  // Handle typing
  const handleTyping = () => {
    if (!selectedConversation) return;

    startTyping(selectedConversation);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedConversation);
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const handleCreateConversation = () => {
    if (!newConversationName.trim() || selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a name and select at least one member.",
        variant: "destructive",
      });
      return;
    }

    createConversationMutation.mutate({
      name: newConversationName.trim(),
      type: newConversationType,
      participants: selectedMembers,
      description: newConversationDescription.trim() || undefined,
      isPrivate: newConversationType === 'direct'
    });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'h:mm a');
    } else if (isThisWeek(date)) {
      return format(date, 'EEE h:mm a');
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const startReply = (message: ChatMessage) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const currentTypingUsers = selectedConversation ? (typingUsers[selectedConversation] || []) : [];

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600">Please log in to access the messenger.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg">Messenger</h2>
              {!isConnected && (
                <Badge variant="destructive" className="text-xs">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse" />
                  Offline
                </Badge>
              )}
              {isConnected && (
                <Badge variant="default" className="text-xs bg-green-600">
                  <div className="w-2 h-2 bg-green-200 rounded-full mr-1" />
                  Online
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCreateConversation(true)}
                title="New Conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Archived Chats
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : conversations.length > 0 ? (
              conversations
                .filter(conv => conv.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg mb-1 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedConversation === conversation.id
                        ? "bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500"
                        : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {conversation.type === 'group' || conversation.type === 'channel' ? (
                              conversation.type === 'channel' ? (
                                <Hash className="h-5 w-5" />
                              ) : (
                                <Users className="h-5 w-5" />
                              )
                            ) : (
                              conversation.name.charAt(0)
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.type === 'direct' && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm truncate">{conversation.name}</span>
                            {conversation.isPrivate && <Lock className="h-3 w-3 text-gray-500" />}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">
                              {conversation.lastMessageAt ? formatMessageTime(conversation.lastMessageAt) : ''}
                            </span>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs min-w-[20px] h-5">
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {conversation.lastMessage?.message || 'No messages yet'}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center text-xs text-gray-400">
                            <Users className="h-3 w-3 mr-1" />
                            {conversation.memberCount}
                          </div>
                          <div className="text-xs text-gray-400">
                            {conversation.type === 'channel' && <Globe className="h-3 w-3" />}
                            {conversation.type === 'group' && <Users className="h-3 w-3" />}
                            {conversation.type === 'direct' && <MessageSquare className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-400">Create a new conversation to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white dark:bg-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {selectedConv.type === 'group' || selectedConv.type === 'channel' ? (
                      selectedConv.type === 'channel' ? (
                        <Hash className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )
                    ) : (
                      selectedConv.name.charAt(0)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {selectedConv.name}
                    {selectedConv.isPrivate && <Lock className="h-4 w-4 text-gray-500" />}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {selectedConv.type === 'direct' ? 'Direct message' : `${conversationMembers.length} members`}
                    {conversationMembers.filter(m => onlineUsers.has(m.id)).length > 0 && (
                      <span className="ml-2">
                        • {conversationMembers.filter(m => onlineUsers.has(m.id)).length} online
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" title="Voice Call">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" title="Video Call">
                  <Video className="h-4 w-4" />
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" title="Members">
                      <Users className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Members ({conversationMembers.length})</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="mt-4">
                      {conversationMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.profilePicture} />
                              <AvatarFallback>{member.firstName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {onlineUsers.has(member.id) && (
                              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{member.firstName} {member.lastName}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              {member.role}
                              {onlineUsers.has(member.id) ? (
                                <Badge variant="default" className="text-xs bg-green-600">Online</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Offline</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
                <Button variant="ghost" size="sm" title="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message, index) => {
                    const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;
                    const showTimestamp = index === 0 || 
                      new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000;

                    return (
                      <div key={message.id}>
                        {showTimestamp && (
                          <div className="text-center text-xs text-gray-500 my-4">
                            {formatMessageTime(message.createdAt)}
                          </div>
                        )}

                        <div className="flex items-start gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                          <div className="w-8">
                            {showAvatar && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.user?.profilePicture} />
                                <AvatarFallback>
                                  {message.user?.firstName?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {showAvatar && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {message.user?.firstName} {message.user?.lastName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(message.createdAt), 'h:mm a')}
                                </span>
                                {message.isEdited && (
                                  <Badge variant="secondary" className="text-xs">edited</Badge>
                                )}
                              </div>
                            )}

                            {/* Reply indicator */}
                            {message.replyToId && (
                              <div className="text-xs text-gray-500 mb-2 pl-3 border-l-2 border-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2">
                                <Reply className="h-3 w-3 inline mr-1" />
                                Replying to message
                              </div>
                            )}

                            <div className="relative group/message">
                              <div className="text-sm bg-gray-100 dark:bg-gray-700 rounded-lg p-3 relative max-w-[70%] break-words">
                                {message.message}

                                {/* Message status */}
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                </div>
                              </div>

                              {/* Reactions */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {message.reactions.map((reaction, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                    >
                                      {reaction.emoji} 1
                                    </Button>
                                  ))}
                                </div>
                              )}

                              {/* Message actions */}
                              <div className="absolute top-0 right-0 -mt-8 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => startReply(message)}
                                  >
                                    <Reply className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Smile className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => startReply(message)}>
                                        <Reply className="h-4 w-4 mr-2" />
                                        Reply
                                      </DropdownMenuItem>
                                      {message.userId === user.id && (
                                        <DropdownMenuItem>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem>
                                        <Pin className="h-4 w-4 mr-2" />
                                        Pin message
                                      </DropdownMenuItem>
                                      <Separator />
                                      {(message.userId === user.id || user.role === "Admin") && (
                                        <DropdownMenuItem className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">No messages yet</h3>
                        <p className="text-sm text-gray-400">Start the conversation!</p>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Typing indicator */}
            {currentTypingUsers.length > 0 && (
              <div className="px-4 py-2 text-sm text-gray-500">
                {currentTypingUsers.join(', ')} {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            {/* Reply indicator */}
            {replyingTo && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Reply className="h-4 w-4" />
                      <span>Replying to {replyingTo.user?.firstName}</span>
                    </div>
                    <div className="text-gray-500 truncate mt-1 max-w-md">
                      {replyingTo.message}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={cancelReply}>
                    ✕
                  </Button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t bg-white dark:bg-gray-900">
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" title="Attach file">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Add image">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Add emoji">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 relative">
                  <Textarea
                    ref={messageInputRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[40px] max-h-[120px] resize-none pr-12"
                    rows={1}
                    disabled={!isConnected}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      title="Voice message"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending || !isConnected}
                  size="sm"
                  className="px-4"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="font-medium text-lg mb-2">Welcome to Messenger</h3>
              <p className="text-gray-500 max-w-sm">
                Select a conversation from the sidebar to start messaging with your team.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Conversation Dialog */}
      <AlertDialog open={showCreateConversation} onOpenChange={setShowCreateConversation}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Set up a new conversation to collaborate with your team.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={newConversationType === 'direct' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewConversationType('direct')}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Direct
                </Button>
                <Button
                  variant={newConversationType === 'group' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewConversationType('group')}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Group
                </Button>
                <Button
                  variant={newConversationType === 'channel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewConversationType('channel')}
                >
                  <Hash className="h-4 w-4 mr-1" />
                  Channel
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newConversationName}
                onChange={(e) => setNewConversationName(e.target.value)}
                placeholder="Enter conversation name"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={newConversationDescription}
                onChange={(e) => setNewConversationDescription(e.target.value)}
                placeholder="Describe what this conversation is about"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Members</label>
              <div className="mt-1 max-h-40 overflow-y-auto border rounded p-2">
                {allUsers.filter(u => u.id !== user.id).map((member) => (
                  <div key={member.id} className="flex items-center gap-2 p-1">
                    <input
                      type="checkbox"
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers(prev => [...prev, member.id]);
                        } else {
                          setSelectedMembers(prev => prev.filter(id => id !== member.id));
                        }
                      }}
                    />
                    <label htmlFor={`member-${member.id}`} className="flex items-center gap-2 flex-1 cursor-pointer">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.profilePicture} />
                        <AvatarFallback className="text-xs">{member.firstName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.firstName} {member.lastName}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCreateConversation}
              disabled={createConversationMutation.isPending}
            >
              {createConversationMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Messenger;