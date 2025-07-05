import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Send, MessageCircle, Users, Settings, Plus, Search, UserPlus, 
  Hash, Lock, Phone, Video, Paperclip, Mic, MicOff, 
  Image, File, Download, Pin, CheckCheck, Volume2,
  MoreVertical, Smile, Reply, Forward, Trash2, 
  PhoneCall, VideoIcon, Copy, Flag, Star
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from "framer-motion";
import io, { Socket } from 'socket.io-client';

interface EnhancedMessage {
  id: string;
  content: string;
  sender: {
    id: number;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  isCurrentUser: boolean;
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }[];
  replyTo?: EnhancedMessage;
  reactions?: {
    emoji: string;
    users: number[];
  }[];
  isPinned?: boolean;
  isEdited?: boolean;
  threadReplies?: number;
}

interface EnhancedChat {
  id: number;
  name: string;
  type: 'direct' | 'group';
  description?: string;
  participants: {
    id: number;
    name: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
    role?: 'admin' | 'member';
  }[];
  lastMessage?: EnhancedMessage;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  avatar?: string;
}

interface VoiceCallState {
  isActive: boolean;
  participants: number[];
  isMuted: boolean;
  startTime?: Date;
}

interface VideoCallState {
  isActive: boolean;
  participants: number[];
  isCameraOn: boolean;
  isMuted: boolean;
  startTime?: Date;
}

export function EnhancedMessenger() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [chats, setChats] = useState<EnhancedChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<EnhancedChat | null>(null);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');

  // Voice and Video call states
  const [voiceCall, setVoiceCall] = useState<VoiceCallState>({ isActive: false, participants: [], isMuted: false });
  const [videoCall, setVideoCall] = useState<VideoCallState>({ isActive: false, participants: [], isCameraOn: true, isMuted: false });

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // File upload and attachment
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<EnhancedMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<EnhancedMessage | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) return;

    const socket = io('/chat', {
      auth: {
        userId: user.id,
        token: localStorage.getItem('authToken')
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    socket.on('message', (message: EnhancedMessage) => {
      setMessages(prev => [...prev, message]);
      updateChatLastMessage(message);
    });

    socket.on('messageUpdate', (updatedMessage: EnhancedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      ));
    });

    socket.on('typing', ({ userId, userName, chatId }: { userId: number; userName: string; chatId: number }) => {
      if (selectedChat?.id === chatId && userId !== user.id) {
        setTypingUsers(prev => [...prev.filter(u => u !== userName), userName]);
      }
    });

    socket.on('stopTyping', ({ userId, userName, chatId }: { userId: number; userName: string; chatId: number }) => {
      setTypingUsers(prev => prev.filter(u => u !== userName));
    });

    socket.on('userOnline', ({ userId }: { userId: number }) => {
      updateUserOnlineStatus(userId, true);
    });

    socket.on('userOffline', ({ userId }: { userId: number }) => {
      updateUserOnlineStatus(userId, false);
    });

    // Voice and Video call events
    socket.on('incomingVoiceCall', handleIncomingVoiceCall);
    socket.on('incomingVideoCall', handleIncomingVideoCall);
    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.disconnect();
    };
  }, [user, selectedChat?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateChatLastMessage = (message: EnhancedMessage) => {
    setChats(prev => prev.map(chat => 
      chat.id === parseInt(message.id.split('-')[0]) 
        ? { ...chat, lastMessage: message, unreadCount: chat.unreadCount + 1 }
        : chat
    ));
  };

  const updateUserOnlineStatus = (userId: number, isOnline: boolean) => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      participants: chat.participants.map(p => 
        p.id === userId ? { ...p, isOnline } : p
      )
    })));
  };

  // Load chats and messages
  const loadChats = async () => {
    try {
      const response = await fetch('/api/chats/enhanced');
      if (response.ok) {
        const chatsData = await response.json();
        setChats(chatsData);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive"
      });
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages/enhanced`);
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
        
        // Mark messages as read
        await markMessagesAsRead(chatId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (chatId: number) => {
    try {
      await fetch(`/api/chats/${chatId}/messages/read`, {
        method: 'POST'
      });
      
      // Update unread count locally
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Message sending with attachments
  const sendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!selectedChat || !user) return;

    const messageData = {
      chatId: selectedChat.id,
      content: newMessage,
      type: selectedFiles.length > 0 ? 'file' : 'text',
      replyTo: replyToMessage?.id,
      files: selectedFiles
    };

    try {
      const formData = new FormData();
      formData.append('chatId', selectedChat.id.toString());
      formData.append('content', newMessage);
      formData.append('type', messageData.type);
      
      if (replyToMessage) {
        formData.append('replyTo', replyToMessage.id);
      }

      selectedFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await fetch('/api/chats/messages/send', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const sentMessage = await response.json();
        
        // Emit via socket for real-time delivery
        socketRef.current?.emit('sendMessage', sentMessage);
        
        setNewMessage('');
        setSelectedFiles([]);
        setReplyToMessage(null);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  // Audio recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start recording timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      setTimeout(() => clearInterval(timer), 300000); // Max 5 minutes
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start audio recording",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    if (!selectedChat) return;

    const formData = new FormData();
    formData.append('chatId', selectedChat.id.toString());
    formData.append('type', 'audio');
    formData.append('audio', audioBlob, `voice_message_${Date.now()}.wav`);

    try {
      const response = await fetch('/api/chats/messages/send', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const sentMessage = await response.json();
        socketRef.current?.emit('sendMessage', sentMessage);
      }
    } catch (error) {
      console.error('Error sending audio message:', error);
    }
  };

  // Voice and Video call functionality
  const startVoiceCall = (participants: number[]) => {
    if (!selectedChat) return;

    const callData = {
      chatId: selectedChat.id,
      participants,
      type: 'voice'
    };

    socketRef.current?.emit('startCall', callData);
    setVoiceCall({ isActive: true, participants, isMuted: false, startTime: new Date() });
  };

  const startVideoCall = (participants: number[]) => {
    if (!selectedChat) return;

    const callData = {
      chatId: selectedChat.id,
      participants,
      type: 'video'
    };

    socketRef.current?.emit('startCall', callData);
    setVideoCall({ 
      isActive: true, 
      participants, 
      isCameraOn: true, 
      isMuted: false, 
      startTime: new Date() 
    });
  };

  const handleIncomingVoiceCall = (callData: any) => {
    // Show incoming call UI
    toast({
      title: "Incoming Voice Call",
      description: `${callData.callerName} is calling you`,
      action: (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => acceptCall(callData)}>Accept</Button>
          <Button size="sm" variant="outline" onClick={() => rejectCall(callData)}>Decline</Button>
        </div>
      )
    });
  };

  const handleIncomingVideoCall = (callData: any) => {
    // Show incoming video call UI
    toast({
      title: "Incoming Video Call",
      description: `${callData.callerName} is calling you`,
      action: (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => acceptCall(callData)}>Accept</Button>
          <Button size="sm" variant="outline" onClick={() => rejectCall(callData)}>Decline</Button>
        </div>
      )
    });
  };

  const acceptCall = (callData: any) => {
    if (callData.type === 'voice') {
      setVoiceCall({ 
        isActive: true, 
        participants: callData.participants, 
        isMuted: false, 
        startTime: new Date() 
      });
    } else {
      setVideoCall({ 
        isActive: true, 
        participants: callData.participants, 
        isCameraOn: true, 
        isMuted: false, 
        startTime: new Date() 
      });
    }
    socketRef.current?.emit('acceptCall', callData);
  };

  const rejectCall = (callData: any) => {
    socketRef.current?.emit('rejectCall', callData);
  };

  const endCall = () => {
    socketRef.current?.emit('endCall', { chatId: selectedChat?.id });
    setVoiceCall({ isActive: false, participants: [], isMuted: false });
    setVideoCall({ isActive: false, participants: [], isCameraOn: true, isMuted: false });
  };

  const handleCallEnded = () => {
    setVoiceCall({ isActive: false, participants: [], isMuted: false });
    setVideoCall({ isActive: false, participants: [], isCameraOn: true, isMuted: false });
  };

  // File handling
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Message actions
  const pinMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/pin`, { method: 'POST' });
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
      ));
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  // Typing indicators
  const handleTyping = () => {
    if (!selectedChat || !user) return;

    socketRef.current?.emit('typing', {
      chatId: selectedChat.id,
      userId: user.id,
      userName: user.firstName || user.email
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stopTyping', {
        chatId: selectedChat.id,
        userId: user.id,
        userName: user.firstName || user.email
      });
    }, 2000);
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {chats
              .filter(chat => 
                chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((chat) => (
                <motion.div
                  key={chat.id}
                  layout
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                    selectedChat?.id === chat.id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {chat.type === 'group' ? (
                            <Users className="h-6 w-6" />
                          ) : (
                            chat.name.substring(0, 2).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {chat.type === 'direct' && chat.participants[0]?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">{chat.name}</p>
                        <div className="flex items-center gap-1">
                          {chat.isPinned && <Pin className="h-3 w-3 text-gray-400" />}
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatTime(new Date(chat.lastMessage.timestamp))}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 bg-blue-500">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </ScrollArea>

        {/* Connection Status */}
        <div className="p-2 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedChat.type === 'group' ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        selectedChat.name.substring(0, 2).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedChat.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedChat.type === 'group' 
                        ? `${selectedChat.participants.length} members`
                        : selectedChat.participants[0]?.isOnline 
                          ? 'Online' 
                          : 'Last seen recently'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startVoiceCall(selectedChat.participants.map(p => p.id))}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startVideoCall(selectedChat.participants.map(p => p.id))}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pin className="h-4 w-4 mr-2" />
                        {selectedChat.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Volume2 className="h-4 w-4 mr-2" />
                        {selectedChat.isMuted ? 'Unmute' : 'Mute'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Chat Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Voice/Video Call Overlay */}
            {(voiceCall.isActive || videoCall.isActive) && (
              <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {videoCall.isActive ? (
                    <VideoIcon className="h-5 w-5" />
                  ) : (
                    <PhoneCall className="h-5 w-5" />
                  )}
                  <span>
                    {videoCall.isActive ? 'Video Call' : 'Voice Call'} - 
                    {voiceCall.startTime && formatTime(voiceCall.startTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={voiceCall.isMuted || videoCall.isMuted ? "default" : "outline"}
                    onClick={() => {
                      if (voiceCall.isActive) {
                        setVoiceCall(prev => ({ ...prev, isMuted: !prev.isMuted }));
                      } else {
                        setVideoCall(prev => ({ ...prev, isMuted: !prev.isMuted }));
                      }
                    }}
                  >
                    {voiceCall.isMuted || videoCall.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  {videoCall.isActive && (
                    <Button
                      size="sm"
                      variant={videoCall.isCameraOn ? "outline" : "default"}
                      onClick={() => setVideoCall(prev => ({ ...prev, isCameraOn: !prev.isCameraOn }))}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={endCall}>
                    End Call
                  </Button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <ScrollArea 
              className="flex-1 p-4"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`mb-4 flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${message.isCurrentUser ? 'order-2' : 'order-1'}`}>
                      {message.replyTo && (
                        <div className="bg-gray-100 border-l-2 border-blue-500 p-2 mb-2 text-sm rounded">
                          <p className="font-medium text-gray-600">{message.replyTo.sender.name}</p>
                          <p className="text-gray-500 truncate">{message.replyTo.content}</p>
                        </div>
                      )}
                      
                      <div
                        className={`relative group rounded-lg p-3 ${
                          message.isCurrentUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        {!message.isCurrentUser && (
                          <p className="text-xs font-medium mb-1 text-gray-600">
                            {message.sender.name}
                          </p>
                        )}
                        
                        {message.type === 'text' && (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        {message.type === 'image' && message.attachments && (
                          <div>
                            {message.content && <p className="text-sm mb-2">{message.content}</p>}
                            {message.attachments.map(attachment => (
                              <img
                                key={attachment.id}
                                src={attachment.url}
                                alt={attachment.name}
                                className="rounded max-w-full h-auto cursor-pointer"
                                onClick={() => window.open(attachment.url, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                        
                        {message.type === 'file' && message.attachments && (
                          <div>
                            {message.content && <p className="text-sm mb-2">{message.content}</p>}
                            {message.attachments.map(attachment => (
                              <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <File className="h-6 w-6" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{attachment.name}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {message.type === 'audio' && message.attachments && (
                          <div>
                            {message.content && <p className="text-sm mb-2">{message.content}</p>}
                            <div className="flex items-center gap-2">
                              <audio controls className="max-w-full">
                                <source src={message.attachments[0].url} type="audio/wav" />
                              </audio>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                            {message.isEdited && <span className="ml-1">(edited)</span>}
                          </span>
                          
                          {message.isCurrentUser && (
                            <div className="flex items-center gap-1">
                              {message.status === 'read' && <CheckCheck className="h-3 w-3" />}
                              {message.status === 'delivered' && <CheckCheck className="h-3 w-3 opacity-50" />}
                            </div>
                          )}
                        </div>

                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {message.reactions.map((reaction, idx) => (
                              <button
                                key={idx}
                                className="bg-gray-100 rounded-full px-2 py-1 text-xs flex items-center gap-1"
                                onClick={() => reactToMessage(message.id, reaction.emoji)}
                              >
                                {reaction.emoji} {reaction.users.length}
                              </button>
                            ))}
                          </div>
                        )}

                        {message.isPinned && (
                          <Pin className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500" />
                        )}

                        {/* Message Actions Menu */}
                        <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setReplyToMessage(message)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => reactToMessage(message.id, '👍')}>
                                <Smile className="h-4 w-4 mr-2" />
                                React
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => pinMessage(message.id)}>
                                <Pin className="h-4 w-4 mr-2" />
                                {message.isPinned ? 'Unpin' : 'Pin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Forward className="h-4 w-4 mr-2" />
                                Forward
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </DropdownMenuItem>
                              {message.isCurrentUser && (
                                <DropdownMenuItem onClick={() => setEditingMessage(message)}>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Flag className="h-4 w-4 mr-2" />
                                Report
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start mb-4"
                >
                  <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-gray-600">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </p>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Reply Banner */}
            {replyToMessage && (
              <div className="bg-blue-50 border-t border-blue-200 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Replying to {replyToMessage.sender.name}</p>
                    <p className="text-xs text-gray-600 truncate max-w-md">{replyToMessage.content}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyToMessage(null)}
                >
                  ×
                </Button>
              </div>
            )}

            {/* File Preview */}
            {selectedFiles.length > 0 && (
              <div className="bg-gray-50 border-t p-3">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white rounded p-2 border">
                      <File className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className={`bg-white border-t p-4 ${isDragOver ? 'bg-blue-50 border-blue-300' : ''}`}>
              <div className="flex items-end gap-2">
                {/* Attachment Menu */}
                <DropdownMenu open={showAttachmentMenu} onOpenChange={setShowAttachmentMenu}>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <File className="h-4 w-4 mr-2" />
                      Document
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => handleFileSelect(e as any);
                      input.click();
                    }}>
                      <Image className="h-4 w-4 mr-2" />
                      Photo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Message Text Input */}
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="resize-none"
                  />
                </div>

                {/* Voice Recording Button */}
                <Button
                  size="sm"
                  variant={isRecording ? "destructive" : "outline"}
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                {/* Send Button */}
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() && selectedFiles.length === 0}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Recording Indicator */}
              {isRecording && (
                <div className="mt-2 flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm">Recording... {recordingDuration}s</span>
                </div>
              )}

              {isDragOver && (
                <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center">
                  <div className="text-center">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-blue-700 font-medium">Drop files here to send</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500 max-w-md">
                Choose a chat from the sidebar to start messaging with enhanced features like 
                voice calls, video calls, file sharing, and more.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}