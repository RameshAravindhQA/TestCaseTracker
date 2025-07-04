import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Phone, 
  Video, 
  Paperclip, 
  Mic, 
  MicOff,
  Users, 
  Plus,
  Search,
  MoreVertical,
  Smile
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  type: 'text' | 'file' | 'voice';
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
  }>;
  lastMessage?: Message;
  unreadCount: number;
}

export function SimpleEnhancedMessenger() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'John Smith',
      type: 'direct',
      participants: [
        { id: '1', name: 'John Smith', status: 'online' },
        { id: 'me', name: 'You', status: 'online' }
      ],
      unreadCount: 2
    },
    {
      id: '2',
      name: 'Project Team',
      type: 'group',
      participants: [
        { id: '1', name: 'John Smith', status: 'online' },
        { id: '2', name: 'Jane Doe', status: 'away' },
        { id: '3', name: 'Bob Wilson', status: 'offline' },
        { id: 'me', name: 'You', status: 'online' }
      ],
      unreadCount: 0
    }
  ]);

  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hey, how is the project coming along?',
      sender: { id: '1', name: 'John Smith' },
      timestamp: new Date(Date.now() - 60000),
      type: 'text',
      status: 'read'
    },
    {
      id: '2',
      content: 'Making good progress! Should be done by end of week.',
      sender: { id: 'me', name: 'You' },
      timestamp: new Date(Date.now() - 30000),
      type: 'text',
      status: 'delivered'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; with: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation === '1') {
      setMessages([
        {
          id: '1',
          content: 'Hey, how is the project coming along?',
          sender: { id: '1', name: 'John Smith' },
          timestamp: new Date(Date.now() - 60000),
          type: 'text',
          status: 'read'
        },
        {
          id: '2',
          content: 'Making good progress! Should be done by end of week.',
          sender: { id: 'me', name: 'You' },
          timestamp: new Date(Date.now() - 30000),
          type: 'text',
          status: 'delivered'
        }
      ]);
    } else if (selectedConversation === '2') {
      setMessages([
        {
          id: '3',
          content: 'Team meeting is scheduled for tomorrow at 2 PM',
          sender: { id: '2', name: 'Jane Doe' },
          timestamp: new Date(Date.now() - 120000),
          type: 'text',
          status: 'read'
        },
        {
          id: '4',
          content: 'Perfect! I\'ll be there.',
          sender: { id: 'me', name: 'You' },
          timestamp: new Date(Date.now() - 90000),
          type: 'text',
          status: 'read'
        },
        {
          id: '5',
          content: 'Should we prepare any materials beforehand?',
          sender: { id: '3', name: 'Bob Wilson' },
          timestamp: new Date(Date.now() - 45000),
          type: 'text',
          status: 'read'
        }
      ]);
    }
  }, [selectedConversation]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: { id: 'me', name: 'You' },
      timestamp: new Date(),
      type: 'text',
      status: 'sent'
    };

    setMessages(prev => [...prev, message]);
    
    // Update conversation's last message
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, lastMessage: message, unreadCount: 0 }
        : conv
    ));
    
    setNewMessage('');
    
    // Simulate a response from the other person after 1-3 seconds
    setTimeout(() => {
      const responses = [
        "That's great to hear!",
        "Thanks for the update.",
        "Sounds good to me!",
        "I agree with that approach.",
        "Let me know if you need any help.",
        "Perfect, let's move forward with that.",
        "That makes sense.",
        "Great work!",
        "I'll look into that.",
        "Thanks for letting me know."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const selectedConv = conversations.find(c => c.id === selectedConversation);
      const otherParticipant = selectedConv?.participants.find(p => p.id !== 'me');
      
      if (otherParticipant) {
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: randomResponse,
          sender: { id: otherParticipant.id, name: otherParticipant.name },
          timestamp: new Date(),
          type: 'text',
          status: 'sent'
        };
        
        setMessages(prev => [...prev, responseMessage]);
        
        // Update conversation's last message
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, lastMessage: responseMessage }
            : conv
        ));
      }
    }, Math.random() * 2000 + 1000); // Random delay between 1-3 seconds
  };

  const startCall = (type: 'voice' | 'video') => {
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    setActiveCall({ type, with: conversation.name });
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Active Call Overlay */}
      {activeCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <Card className="w-96 text-center">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {activeCall.type === 'video' ? <Video className="h-8 w-8" /> : <Phone className="h-8 w-8" />}
                </div>
                <h3 className="text-lg font-semibold">{activeCall.type === 'video' ? 'Video' : 'Voice'} Call</h3>
                <p className="text-gray-600">with {activeCall.with}</p>
              </div>
              <div className="flex justify-center space-x-4">
                <Button variant="destructive" onClick={endCall} className="rounded-full w-12 h-12">
                  <Phone className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversations List */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search conversations..." className="pl-10" />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={cn(
                  "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                  selectedConversation === conversation.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <div className="relative">
                  {conversation.type === 'group' ? (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                  ) : (
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conversation.participants[0]?.avatar} />
                      <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  {conversation.type === 'direct' && conversation.participants[0]?.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                <div className="flex-1 ml-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{conversation.name}</h3>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {currentConversation.type === 'group' ? (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                  ) : (
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarImage src={currentConversation.participants[0]?.avatar} />
                      <AvatarFallback>{currentConversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h3 className="font-semibold">{currentConversation.name}</h3>
                    <p className="text-sm text-gray-500">
                      {currentConversation.type === 'group' 
                        ? `${currentConversation.participants.length} participants`
                        : 'Online'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => startCall('voice')}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startCall('video')}>
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender.id === 'me' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                        message.sender.id === 'me'
                          ? "bg-primary text-primary-foreground"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.sender.id === 'me'
                            ? "text-primary-foreground/70"
                            : "text-gray-500"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleRecording}
                  className={cn(isRecording && "text-red-500")}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}