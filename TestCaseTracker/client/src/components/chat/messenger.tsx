
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
import { useToast } from '@/hooks/use-toast';
import { Send, Users, MessageCircle, Phone, Video, MoreHorizontal, Search, Plus, Paperclip, Smile, User } from 'lucide-react';
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

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
  sender: Contact;
}

interface Chat {
  id: number;
  participants: Contact[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export function Messenger() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all users for contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
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
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: number; content: string }) => {
      const response = await apiRequest('POST', '/api/messages', messageData);
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedContact.id,
      content: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredContacts = contacts.filter(contact =>
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
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
          <>
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
                      {selectedContact.isOnline ? 'Active now' : `Last seen ${selectedContact.lastSeen || 'recently'}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
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
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
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
                          "rounded-lg px-3 py-2 text-sm",
                          message.senderId === user?.id 
                            ? "bg-blue-500 text-white" 
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                        )}>
                          <p>{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            message.senderId === user?.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                          )}>
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-10"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a conversation
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
