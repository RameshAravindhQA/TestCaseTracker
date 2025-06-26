import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Users, X, UserPlus, Settings } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [open, setOpen] = useState(false);
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
    enabled: open,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Fetch project users
  const { data: projectUsers = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/users`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/projects/${projectId}/users`);
      return response.json();
    },
    enabled: open,
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
    if (open) {
      scrollToBottom();
    }
  }, [messages, open]);

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
      <div
        key={msg.id}
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
            <AvatarImage src={currentUser?.avatar} />
            <AvatarFallback>{getInitials(currentUser?.name || 'U')}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  const insertMention = (user: any) => {
    const mention = `@${user.name} `;
    setMessage(prev => prev + mention);
  };

  const [showCollaborators, setShowCollaborators] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Simulate real-time presence
  useEffect(() => {
    if (open) {
      // In a real implementation, you would use WebSocket for real-time presence
      const mockOnlineUsers = ['Alice Johnson', 'Bob Smith', 'Carol Davis'];
      setOnlineUsers(mockOnlineUsers);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          Team Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Project Chat
            <Badge variant="outline" className="ml-2">
              <Users className="h-3 w-3 mr-1" />
              {projectUsers.length} members
            </Badge>
             <Badge variant="secondary" className="ml-2">
                {onlineUsers.length} online
              </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
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
        </div>

         <Dialog open={showCollaborators} onOpenChange={setShowCollaborators}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="View Collaborators">
                  <Users className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Project Collaborators</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Online Now ({onlineUsers.length})
                  </div>
                  {onlineUsers.map((user, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user}</div>
                        <div className="text-xs text-muted-foreground">Active now</div>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs">
                        Online
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Collaborator
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
      </DialogContent>
    </Dialog>
  );
}