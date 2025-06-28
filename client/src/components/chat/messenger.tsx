import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Phone, Video, Users, Settings, MoreVertical, Edit, Reply, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  user?: {
    id: number;
    firstName: string;
    lastName?: string;
    profilePicture?: string;
  };
}

interface User {
  id: number;
  name: string;
  avatar?: string;
  role: string;
}

export function Messenger() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mock conversations - in a real app, these would come from an API
  const conversations = [
    {
      id: 1,
      name: "General Discussion",
      lastMessage: "Hello everyone! Welcome to the team.",
      timestamp: "about 1 hour ago",
      unreadCount: 0,
      participants: 5
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
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
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
    mutationFn: async (messageData: { message: string; replyToId?: number }) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      const response = await apiRequest("POST", `/api/projects/${selectedConversation}/chat`, messageData);
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
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
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to edit message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

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

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-900">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Conversations</h2>
        </div>
        <div className="p-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                selectedConversation === conversation.id
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => setSelectedConversation(conversation.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{conversation.name}</span>
                {conversation.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">{conversation.lastMessage}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{conversation.timestamp}</span>
                <div className="flex items-center text-xs text-gray-400">
                  <Users className="h-3 w-3 mr-1" />
                  {conversation.participants}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white dark:bg-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedConv.name}</h3>
                <div className="text-sm text-gray-500">
                  {users.length} members
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" title="Voice Call">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" title="Video Call">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" title="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className="flex items-start gap-3 group">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.user?.profilePicture} />
                      <AvatarFallback>
                        {message.user?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.user?.firstName} {message.user?.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                        {message.isEdited && (
                          <Badge variant="secondary" className="text-xs">edited</Badge>
                        )}
                      </div>

                      {/* Reply indicator */}
                      {message.replyToId && (
                        <div className="text-xs text-gray-500 mb-2 pl-2 border-l-2 border-gray-300">
                          Replying to: {getRepliedMessage(message.replyToId)?.message.substring(0, 50)}...
                        </div>
                      )}

                      {editingMessageId === message.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleEditMessage(message.id, editingText);
                              } else if (e.key === 'Escape') {
                                setEditingMessageId(null);
                                setEditingText("");
                              }
                            }}
                            className="flex-1 text-sm"
                            autoFocus
                          />
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
                      ) : (
                        <div className="text-sm bg-gray-100 dark:bg-gray-700 rounded-lg p-3 relative">
                          {message.message}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
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
                                  <Tag className="h-4 w-4 mr-2" />
                                  Tag
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {message.tags && message.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {message.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply indicator */}
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Replying to {replyingTo.user?.firstName}: {replyingTo.message.substring(0, 50)}...
                  </div>
                  <Button variant="ghost" size="sm" onClick={cancelReply}>
                    ✕
                  </Button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}