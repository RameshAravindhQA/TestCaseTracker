
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle, Users, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Message {
  id: number;
  userId: number;
  userName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'system';
}

interface Chat {
  id: number;
  name: string;
  type: 'direct' | 'group';
  participants: number;
  lastMessage?: string;
  lastActivity?: string;
  unreadCount?: number;
}

export default function Messenger() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      connectWebSocket();
      loadChats();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    try {
      // Ensure WebSocket connection uses correct path
      const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Authenticate with the WebSocket server
        ws.send(JSON.stringify({
          type: 'authenticate',
          data: {
            userId: user?.id,
            userName: user?.name
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'authenticated':
        console.log('WebSocket authenticated');
        break;
      case 'new_message':
        if (data.message) {
          setMessages(prev => [...prev, {
            id: data.message.id,
            userId: data.message.userId,
            userName: data.message.user?.firstName || 'Unknown',
            message: data.message.message,
            timestamp: data.message.createdAt,
            type: 'text'
          }]);
        }
        break;
      case 'user_typing':
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(name => name !== data.userName), data.userName]);
        } else {
          setTypingUsers(prev => prev.filter(name => name !== data.userName));
        }
        break;
      case 'error':
        console.error('WebSocket error:', data.error);
        break;
    }
  };

  const loadChats = async () => {
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const chatsData = await response.json();
        setChats(chatsData);
        if (chatsData.length > 0 && !selectedChat) {
          setSelectedChat(chatsData[0]);
          loadMessages(chatsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
        
        // Join conversation via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'join_conversation',
            data: { conversationId: chatId }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !wsRef.current) return;

    const messageData = {
      type: 'send_message',
      data: {
        conversationId: selectedChat.id,
        message: newMessage.trim()
      }
    };

    wsRef.current.send(JSON.stringify(messageData));
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please log in to access the messenger.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Online" : "Offline"}
              </Badge>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {chats.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No chats available</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedChat(chat);
                    loadMessages(chat.id);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {chat.type === 'group' ? <Users className="h-5 w-5" /> : getInitials(chat.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{chat.name}</h3>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                      )}
                      {chat.type === 'group' && (
                        <p className="text-xs text-gray-400">{chat.participants} participants</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedChat.type === 'group' ? <Users className="h-4 w-4" /> : getInitials(selectedChat.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{selectedChat.name}</h3>
                  {typingUsers.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.userId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.userId === user.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-100">
                            {getInitials(message.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={`rounded-lg p-3 ${
                            message.userId === user.id 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            <p className="text-sm">{message.message}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {message.userId !== user.id && message.userName} • {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
