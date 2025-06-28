
import { useState, useEffect, useRef } from "react";
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
  VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";

interface ChatMessage {
  id: number;
  userId: number;
  message: string;
  type: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  replyToId?: number;
  tags?: string[];
  attachments?: string[];
  reactions?: { emoji: string; users: number[] }[];
  isRead?: boolean;
  isPinned?: boolean;
  user?: {
    id: number;
    firstName: string;
    lastName?: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
}

interface User {
  id: number;
  name: string;
  avatar?: string;
  role: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  participants: number;
  type: 'direct' | 'group' | 'channel';
  isArchived?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  avatar?: string;
}

const Messenger = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showArchivedChats, setShowArchivedChats] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mock conversations data - enhanced with Google Chat features
  const conversations: Conversation[] = [
    {
      id: 1,
      name: "Team General",
      lastMessage: "Let's discuss the new features for the upcoming release",
      timestamp: new Date().toISOString(),
      unreadCount: 3,
      participants: 12,
      type: 'group',
      isPinned: true,
      avatar: "/images/team-avatar.png"
    },
    {
      id: 2,
      name: "Project Alpha",
      lastMessage: "The testing phase is complete",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      unreadCount: 0,
      participants: 5,
      type: 'group',
      avatar: "/images/project-avatar.png"
    },
    {
      id: 3,
      name: "John Doe",
      lastMessage: "Thanks for the update!",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      unreadCount: 1,
      participants: 2,
      type: 'direct',
      avatar: "/images/user-avatar.png"
    }
  ];

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: ["chatMessages", selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await apiRequest("GET", `/api/projects/${selectedConversation}/chat`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!selectedConversation,
    refetchInterval: 3000,
  });

  // Fetch users for the conversation
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["conversationUsers", selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await apiRequest("GET", `/api/projects/${selectedConversation}/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; replyToId?: number; attachments?: string[] }) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      
      try {
        const response = await apiRequest("POST", `/api/projects/${selectedConversation}/chat`, messageData);
        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = `Server error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            errorMessage = await response.text() || errorMessage;
          }
          throw new Error(errorMessage);
        }
        return response.json();
      } catch (error) {
        console.error("Send message API error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      refetchMessages();
      setNewMessage("");
      setReplyingTo(null);
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error) => {
      console.error("Send message mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, message }: { messageId: number; message: string }) => {
      const response = await apiRequest("PUT", `/api/chat/messages/${messageId}`, { message });
      if (!response.ok) throw new Error("Failed to edit message");
      return response.json();
    },
    onSuccess: () => {
      refetchMessages();
      setEditingMessageId(null);
      setEditingText("");
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to edit message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) {
      console.warn("Cannot send message: empty message or no conversation selected");
      return;
    }

    if (sendMessageMutation.isPending) {
      console.warn("Message send already in progress");
      return;
    }

    console.log("Sending message:", {
      conversationId: selectedConversation,
      message: newMessage.trim(),
      replyToId: replyingTo?.id
    });

    sendMessageMutation.mutate({
      message: newMessage.trim(),
      replyToId: replyingTo?.id
    });
  };

  const handleEditMessage = (messageId: number, newText: string) => {
    if (!newText.trim()) return;
    editMessageMutation.mutate({ messageId, message: newText.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startEditing = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingText(message.message);
  };

  const startReply = (message: ChatMessage) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
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

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (showArchivedChats ? conv.isArchived : !conv.isArchived)
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const getRepliedMessage = (replyToId: number) => {
    return messages.find(m => m.id === replyToId);
  };

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🎉'];

  return (
    <div className="flex h-[calc(100vh-100px)] border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Chat</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowArchivedChats(!showArchivedChats)}>
                    <Archive className="h-4 w-4 mr-2" />
                    {showArchivedChats ? 'Hide archived' : 'Show archived'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
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
            {filteredConversations.map((conversation) => (
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
                      <AvatarImage src={conversation.avatar} />
                      <AvatarFallback>
                        {conversation.type === 'group' ? (
                          <Users className="h-5 w-5" />
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
                        {conversation.isPinned && <Pin className="h-3 w-3 text-gray-500" />}
                        {conversation.isMuted && <VolumeX className="h-3 w-3 text-gray-500" />}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">
                          {formatMessageTime(conversation.timestamp)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs min-w-[20px] h-5">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{conversation.lastMessage}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center text-xs text-gray-400">
                        <Users className="h-3 w-3 mr-1" />
                        {conversation.participants}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                  <AvatarImage src={selectedConv.avatar} />
                  <AvatarFallback>
                    {selectedConv.type === 'group' ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      selectedConv.name.charAt(0)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {selectedConv.name}
                    {selectedConv.isPinned && <Pin className="h-4 w-4 text-gray-500" />}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {selectedConv.type === 'direct' ? 'Active now' : `${users.length} members`}
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
                      <SheetTitle>Members ({users.length})</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="mt-4">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {user.isOnline && (
                              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.role}</div>
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
                  <div className="text-center text-gray-500 py-8">Loading messages...</div>
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
                        
                        <div className={`flex items-start gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors ${
                          selectedMessages.includes(message.id) ? 'bg-blue-50 dark:bg-blue-900' : ''
                        }`}>
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
                                {message.isPinned && (
                                  <Pin className="h-3 w-3 text-gray-500" />
                                )}
                              </div>
                            )}

                            {/* Reply indicator */}
                            {message.replyToId && (
                              <div className="text-xs text-gray-500 mb-2 pl-3 border-l-2 border-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2">
                                <Reply className="h-3 w-3 inline mr-1" />
                                Replying to: {getRepliedMessage(message.replyToId)?.message.substring(0, 50)}...
                              </div>
                            )}

                            {editingMessageId === message.id ? (
                              <div className="flex gap-2">
                                <Textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleEditMessage(message.id, editingText);
                                    } else if (e.key === 'Escape') {
                                      setEditingMessageId(null);
                                      setEditingText("");
                                    }
                                  }}
                                  className="flex-1 text-sm min-h-[60px]"
                                  autoFocus
                                />
                                <div className="flex flex-col gap-1">
                                  <Button size="sm" onClick={() => handleEditMessage(message.id, editingText)}>
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      setEditingMessageId(null);
                                      setEditingText("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative group/message">
                                <div className="text-sm bg-gray-100 dark:bg-gray-700 rounded-lg p-3 relative max-w-[70%] break-words">
                                  {message.message}
                                  
                                  {/* Message status */}
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    {message.isRead ? (
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <Check className="h-3 w-3 text-gray-400" />
                                    )}
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
                                        {reaction.emoji} {reaction.users.length}
                                      </Button>
                                    ))}
                                  </div>
                                )}

                                {/* Message actions */}
                                <div className="absolute top-0 right-0 -mt-8 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                  <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg flex items-center">
                                    {emojis.map((emoji) => (
                                      <Button
                                        key={emoji}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-gray-100"
                                      >
                                        {emoji}
                                      </Button>
                                    ))}
                                    <Separator orientation="vertical" className="h-6" />
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
                                        <DropdownMenuItem onClick={() => startEditing(message)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Pin className="h-4 w-4 mr-2" />
                                          Pin message
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Star className="h-4 w-4 mr-2" />
                                          Star
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Tag className="h-4 w-4 mr-2" />
                                          Tag
                                        </DropdownMenuItem>
                                        <Separator />
                                        <DropdownMenuItem className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tags */}
                            {message.tags && message.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {message.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">No messages yet</h3>
                        <p className="text-sm text-gray-400">Start the conversation with your team!</p>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Typing indicator */}
            {isTyping && (
              <div className="px-4 py-2 text-sm text-gray-500">
                Someone is typing...
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
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-6 w-6 p-0 ${isRecording ? 'text-red-500' : ''}`}
                      title="Voice message"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="font-medium text-lg mb-2">Welcome to Chat</h3>
              <p className="text-gray-500 max-w-sm">
                Select a conversation from the sidebar to start messaging with your team.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;
