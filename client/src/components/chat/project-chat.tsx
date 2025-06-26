import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Users, X, UserPlus, Minimize2, Maximize2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: number;
  projectId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
  type: 'text' | 'system' | 'mention';
  mentionedUsers?: number[];
}

interface ProjectChatProps {
  projectId: number;
  currentUser: any;
}

export function ProjectChat({ projectId, currentUser }: ProjectChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch chat messages
  const { data: messages = [], refetch } = useQuery({
    queryKey: [`/api/projects/${projectId}/chat`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/projects/${projectId}/chat`);
      return response.json();
    },
    enabled: isOpen,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Fetch project users
  const { data: projectUsers = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/users`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/projects/${projectId}/users`);
      return response.json();
    },
    enabled: isOpen,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/chat`, {
        message: messageText,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      refetch();
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwnMessage = msg.userId === currentUser?.id;
    const isMentioned = msg.mentionedUsers?.includes(currentUser?.id);

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex gap-3 mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      >
        {!isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={msg.userAvatar} />
            <AvatarFallback>{getInitials(msg.userName)}</AvatarFallback>
          </Avatar>
        )}

        <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          <div className={`rounded-lg p-3 ${
            isOwnMessage 
              ? 'bg-purple-500 text-white' 
              : isMentioned
                ? 'bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700'
                : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            {!isOwnMessage && (
              <p className="text-xs font-medium mb-1 opacity-70">
                {msg.userName}
              </p>
            )}
            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
            {msg.type === 'mention' && (
              <Badge variant="outline" className="mt-1 text-xs">
                Mentioned you
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatMessageTime(msg.timestamp)}
          </p>
        </div>

        {isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.profilePicture} />
            <AvatarFallback>{getInitials(currentUser?.firstName + ' ' + (currentUser?.lastName || ''))}</AvatarFallback>
          </Avatar>
        )}
      </motion.div>
    );
  };

  const insertMention = (user: any) => {
    const mention = `@${user.name} `;
    setMessage(prev => prev + mention);
  };

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Simulate real-time presence
  useEffect(() => {
    if (isOpen) {
      const mockOnlineUsers = projectUsers.slice(0, 3).map((user: any) => user.name);
      setOnlineUsers(mockOnlineUsers);
    }
  }, [isOpen, projectUsers]);

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-24 right-6 z-40"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
            {/* Notification badge */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center"
            >
              <Users className="h-3 w-3 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`fixed bottom-24 right-6 z-40 ${
              isMinimized ? 'w-80' : 'w-96'
            } ${isMinimized ? 'h-16' : 'h-[500px]'} transition-all duration-200`}
          >
            <Card className="h-full shadow-2xl border-blue-200 dark:border-blue-800">
              {/* Header */}
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <CardTitle className="text-lg">Team Chat</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Users className="h-3 w-3 mr-1" />
                      {projectUsers.length} members
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="text-white hover:bg-blue-700 h-8 w-8 p-0"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-blue-700 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Content */}
              {!isMinimized && (
                <CardContent className="flex flex-col h-full p-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <div>
                        {messages.map(renderMessage)}
                        <div ref={messagesEndRef} />
                      </div>
                    )}

                    {typingUsers.length > 0 && (
                      <div className="text-sm text-muted-foreground italic">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Type your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={sendMessageMutation.isPending}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quick mention buttons */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {projectUsers.slice(0, 5).map((user: any) => (
                        <Button
                          key={user.id}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => insertMention(user)}
                        >
                          @{user.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
const sendMessage = async () => {
    if (!newMessage.trim() || !user || !projectId) return;

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: parseInt(projectId),
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          message: newMessage.trim(),
          type: "text",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();

      // Handle new API response format
      if (result.success && result.data) {
        setMessages((prev) => [...prev, result.data]);
        setNewMessage("");
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };
const sendMessage = async () => {
    if (!newMessage.trim() || !user || !projectId) return;

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: parseInt(projectId),
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          message: newMessage.trim(),
          type: "text",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();

      // Handle new API response format
      if (result.success && result.data) {
        setMessages((prev) => [...prev, result.data]);
        setNewMessage("");
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };
const fetchMessages = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/chat/messages/${projectId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const result = await response.json();

      // Handle new API response format
      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        console.error("API Error:", result.error);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }
  };