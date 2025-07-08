import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  MessageCircle, 
  Users, 
  Plus, 
  Search, 
  Paperclip, 
  Phone, 
  Video, 
  Mic, 
  Edit, 
  Trash, 
  Pin,
  Reply,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";

interface User {
  id: number;
  name: string;
  email: string;
  isOnline: boolean;
}

interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'file' | 'voice' | 'system';
  attachments?: MessageAttachment[];
  replyTo?: string;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
}

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: number[];
  createdAt: string;
  lastMessage?: ChatMessage;
  isActive: boolean;
}

interface JitsiCall {
  id: string;
  conversationId: string;
  roomName: string;
  initiatorId: number;
  type: 'audio' | 'video';
  participants: number[];
  startTime: string;
  isActive: boolean;
}

export function Messenger() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeCall, setActiveCall] = useState<JitsiCall | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      console.log('User authenticated, connecting WebSocket and loading users');
      connectWebSocket();
      loadOnlineUsers();
      loadConversations();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user]);

  const loadConversations = async () => {
    try {
      console.log('Loading conversations...');
      const response = await fetch('/api/chats', {
        credentials: 'include'
      });
      if (response.ok) {
        const convs = await response.json();
        console.log('Loaded conversations:', convs);
        setConversations(convs);
      } else {
        console.error('Failed to load conversations:', response.status);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    if (!user) return;

    try {
      console.log('Connecting to WebSocket...');

      // Use socket.io client library
      // @ts-ignore
      const socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        path: '/socket.io'
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);

        // Authenticate
        socket.emit('authenticate', {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName || ''}`.trim()
        });
      });

      socket.on('authenticated', (data: { user: User; onlineUsers: User[] }) => {
        console.log('Authenticated successfully', data);
        setOnlineUsers(data.onlineUsers);

        // Also load all available users for creating conversations
        loadOnlineUsers();
      });

      socket.on('conversations_list', (data: Conversation[]) => {
        setConversations(data);
      });

      socket.on('conversation_created', (conversation: Conversation) => {
        setConversations(prev => {
          const exists = prev.find(c => c.id === conversation.id);
          if (exists) return prev;
          return [...prev, conversation];
        });
      });

      socket.on('conversation_messages', (data: { conversationId: string; messages: ChatMessage[] }) => {
        if (data.conversationId === selectedConversation) {
          setMessages(data.messages);
        }
      });

      socket.on('pinned_messages', (data: { conversationId: string; messages: ChatMessage[] }) => {
        if (data.conversationId === selectedConversation) {
          setPinnedMessages(data.messages);
        }
      });

      socket.on('new_message', (message: ChatMessage) => {
        if (message.conversationId === selectedConversation) {
          setMessages(prev => [...prev, message]);
        }

        // Update conversation last message
        setConversations(prev => prev.map(conv => 
          conv.id === message.conversationId 
            ? { ...conv, lastMessage: message }
            : conv
        ));
      });

      socket.on('message_edited', (data: { messageId: string; newMessage: string; editedAt: string }) => {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, message: data.newMessage, isEdited: true, editedAt: data.editedAt }
            : msg
        ));
      });

      socket.on('message_deleted', (data: { messageId: string }) => {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      });

      socket.on('message_pin_toggled', (data: { messageId: string; isPinned: boolean }) => {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, isPinned: data.isPinned }
            : msg
        ));

        if (data.isPinned) {
          const message = messages.find(msg => msg.id === data.messageId);
          if (message) {
            setPinnedMessages(prev => [...prev, { ...message, isPinned: true }]);
          }
        } else {
          setPinnedMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        }
      });

      socket.on('user_typing', (data: { conversationId: string; userId: number; userName: string }) => {
        if (data.conversationId === selectedConversation && data.userId !== user.id) {
          setTypingUsers(prev => {
            if (!prev.includes(data.userName)) {
              return [...prev, data.userName];
            }
            return prev;
          });
        }
      });

      socket.on('user_stopped_typing', (data: { conversationId: string; userId: number }) => {
        if (data.conversationId === selectedConversation) {
          setTypingUsers(prev => prev.filter(name => name !== data.userId.toString()));
        }
      });

      socket.on('call_initiated', (data: { call: JitsiCall; initiator: User; jitsiUrl: string }) => {
        setActiveCall(data.call);
        toast({
          title: "Incoming Call",
          description: `${data.initiator.name} is calling you`,
          action: (
            <Button onClick={() => joinCall(data.call.id, data.jitsiUrl)}>
              Join
            </Button>
          )
        });
      });

      socket.on('call_ended', (data: { callId: string }) => {
        setActiveCall(null);
        toast({
          title: "Call Ended",
          description: "The call has been ended"
        });
      });

      socket.on('user_online', (user: User) => {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.id === user.id);
          if (exists) return prev;
          return [...prev, user];
        });
      });

      socket.on('user_offline', (user: User) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== user.id));
      });

      socket.on('file_uploaded', (data: { conversationId: string; attachment: MessageAttachment }) => {
        // Handle file upload success
        toast({
          title: "File Uploaded",
          description: "File uploaded successfully"
        });
      });

      socket.on('upload_error', (data: { message: string }) => {
        toast({
          title: "Upload Error",
          description: data.message,
          variant: "destructive"
        });
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      wsRef.current = socket;

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      console.log('Loading online users...');
      const response = await fetch('/api/users/public', {
        credentials: 'include'
      });
      if (response.ok) {
        const users = await response.json();
        console.log('Loaded users:', users);

        // Ensure we have proper user data structure
        const formattedUsers = users.map((u: any) => {
          const firstName = u.firstName || '';
          const lastName = u.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();

          return {
            id: u.id,
            name: fullName || u.name || u.email?.split('@')[0] || 'Unknown User',
            email: u.email,
            isOnline: false,
            avatar: u.avatar || u.profilePicture,
            firstName: firstName,
            lastName: lastName
          };
        });

        console.log('Formatted users:', formattedUsers);
        setOnlineUsers(formattedUsers);
      } else {
        console.error('Failed to load users:', response.status, response.statusText);
        setOnlineUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setOnlineUsers([]);
    }
  };

  const createConversation = async () => {
    console.log('[Messenger] Creating conversation with selected users:', selectedUsers);

    if (selectedUsers.length === 0) {
      console.warn('[Messenger] No users selected for conversation');
      toast({
        title: "Error",
        description: "Please select at least one user",
        variant: "destructive"
      });
      return;
    }

    try {
      if (selectedUsers.length === 1) {
        // Create direct conversation
        const targetUserId = selectedUsers[0];
        console.log('[Messenger] Creating direct conversation with user:', targetUserId);
        console.log('[Messenger] Current user ID:', user?.id);

        if (targetUserId === user?.id) {
          console.warn('[Messenger] User attempting to create conversation with themselves');
          toast({
            title: "Error",
            description: "You cannot create a conversation with yourself",
            variant: "destructive"
          });
          return;
        }

        const requestBody = { targetUserId };
        console.log('[Messenger] Sending request body:', requestBody);

        const response = await fetch('/api/chats/direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });

        console.log('[Messenger] Response status:', response.status);
        console.log('[Messenger] Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const conversation = await response.json();
          console.log('[Messenger] Created conversation successfully:', conversation);

          setConversations(prev => {
            const exists = prev.find(c => c.id === conversation.id);
            if (exists) {
              console.log('[Messenger] Conversation already exists, not adding duplicate');
              return prev;
            }
            console.log('[Messenger] Adding new conversation to list');
            return [...prev, conversation];
          });

          setSelectedConversation(conversation.id);
          console.log('[Messenger] Set selected conversation to:', conversation.id);

          // Join the conversation room
          if (wsRef.current) {
            console.log('[Messenger] Joining conversation room via WebSocket');
            wsRef.current.emit('join_conversation', { conversationId: conversation.id });
          } else {
            console.warn('[Messenger] WebSocket not available for joining room');
          }

          toast({
            title: "Success",
            description: "Conversation created successfully"
          });
        } else {
          const responseText = await response.text();
          console.error('[Messenger] Error response text:', responseText);

          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('[Messenger] Failed to parse error response:', parseError);
            errorData = { error: responseText || 'Unknown error' };
          }

          console.error('[Messenger] Failed to create direct conversation:', response.status, errorData);
          throw new Error(errorData.error || errorData.message || `Failed to create direct conversation (${response.status})`);
        }
      } else {
        // Create group conversation - require name for groups
        if (!newChatName.trim()) {
          console.warn('[Messenger] No chat name provided for group conversation');
          toast({
            title: "Error",
            description: "Please enter a chat name for group conversations",
            variant: "destructive"
          });
          return;
        }

        const requestBody = {
          name: newChatName.trim(),
          participants: selectedUsers
        };
        console.log('[Messenger] Creating group conversation with body:', requestBody);

        const response = await fetch('/api/chats/group', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });

        console.log('[Messenger] Group conversation response status:', response.status);

        if (response.ok) {
          const conversation = await response.json();
          console.log('[Messenger] Created group conversation successfully:', conversation);

          setConversations(prev => {
            const exists = prev.find(c => c.id === conversation.id);
            if (exists) return prev;
            return [...prev, conversation];
          });
          setSelectedConversation(conversation.id);

          // Join the conversation room
          if (wsRef.current) {
            wsRef.current.emit('join_conversation', { conversationId: conversation.id });
          }

          toast({
            title: "Success",
            description: "Group conversation created successfully"
          });
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[Messenger] Failed to create group conversation:', response.status, errorData);
          throw new Error(errorData.error || `Failed to create group conversation (${response.status})`);
        }
      }

      setShowCreateChat(false);
      setNewChatName('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('[Messenger] Error creating conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create conversation",
        variant: "destructive"
      });
    }
  };

  const joinConversation = async (conversationId: string) => {
    console.log('[Messenger] Joining conversation:', conversationId);

    setSelectedConversation(conversationId);

    // Load messages for this conversation
    try {
      const response = await fetch(`/api/chats/${conversationId}/messages`, {
        credentials: 'include'
      });

      if (response.ok) {
        const messages = await response.json();
        console.log('[Messenger] Loaded messages for conversation:', messages.length);
        setMessages(messages);
      } else {
        console.error('[Messenger] Failed to load messages:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('[Messenger] Error loading messages:', error);
      setMessages([]);
    }

    // Join via WebSocket if available
    if (wsRef.current) {
      wsRef.current.emit('join_conversation', { conversationId });
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    console.log('[Messenger] Sending message to conversation:', selectedConversation);

    try {
      // Use the chat API endpoint for direct conversations
      const response = await fetch(`/api/chats/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newMessage.trim(),
          replyToId: replyingTo?.id
        })
      });

      if (response.ok) {
        const message = await response.json();
        console.log('[Messenger] Message sent successfully:', message);

        // Add message to current conversation
        setMessages(prev => [...prev, message]);

        // Update conversation last message
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, lastMessage: message }
            : conv
        ));

        setNewMessage('');
        setReplyingTo(null);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Enhanced error handling with retry logic
      if (error.message?.includes('404')) {
        console.log('[Messenger] Conversation not found, attempting to refresh conversations');
        loadConversations(); // Refresh conversations
        toast({
          title: "Error",
          description: "Conversation not found. Please try again.",
          variant: "destructive"
        });
      } else if (error.message?.includes('403')) {
        toast({
          title: "Error", 
          description: "Access denied to this conversation.",
          variant: "destructive"
        });
      } else {
        console.log('[Messenger] Falling back to WebSocket');

        // Fallback to WebSocket if available
        if (wsRef.current && wsRef.current.connected) {
          wsRef.current.emit('send_message', {
            conversationId: selectedConversation,
            message: newMessage.trim(),
            type: 'text',
            replyTo: replyingTo?.id
          });

          setNewMessage('');
          setReplyingTo(null);
        } else {
          toast({
            title: "Error",
            description: "Failed to send message. Please check your connection.",
            variant: "destructive"
          });
        }
      }
    }
  };

  const editMessage = (messageId: string, newText: string) => {
    if (!wsRef.current || !selectedConversation) return;

    wsRef.current.emit('edit_message', {
      conversationId: selectedConversation,
      messageId,
      newMessage: newText
    });

    setEditingMessage(null);
    setEditingText('');
  };

  const deleteMessage = (messageId: string) => {
    if (!wsRef.current || !selectedConversation) return;

    wsRef.current.emit('delete_message', {
      conversationId: selectedConversation,
      messageId
    });
  };

  const togglePinMessage = (messageId: string) => {
    if (!wsRef.current || !selectedConversation) return;

    wsRef.current.emit('toggle_pin_message', {
      conversationId: selectedConversation,
      messageId
    });
  };

  const startTyping = () => {
    if (!wsRef.current || !selectedConversation) return;
    wsRef.current.emit('typing_start', { conversationId: selectedConversation });
  };

  const stopTyping = () => {
    if (!wsRef.current || !selectedConversation) return;
    wsRef.current.emit('typing_stop', { conversationId: selectedConversation });
  };

  const initiateCall = (type: 'audio' | 'video') => {
    if (!selectedConversation) return;

    // Generate a unique room name for this conversation
    const roomName = `testcase-${selectedConversation}-${Date.now()}`;
    const callId = `call_${Date.now()}`;

    // Create Jitsi Meet URL
    const jitsiUrl = `https://meet.jit.si/${roomName}`;

    // Open Jitsi Meet in new window with proper configuration
    const jitsiWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

    if (jitsiWindow) {
      jitsiWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Jitsi Meet - ${type === 'video' ? 'Video' : 'Audio'} Call</title>
          <script src="https://meet.jit.si/external_api.js"></script>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
            #jitsi-container { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="jitsi-container"></div>
          <script>
            const api = new JitsiMeetExternalAPI('meet.jit.si', {
              roomName: '${roomName}',
              width: '100%',
              height: '100%',
              parentNode: document.querySelector('#jitsi-container'),
              configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: ${type === 'audio' ? 'true' : 'false'},
                enableWelcomePage: false,
                prejoinPageEnabled: false
              },
              interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                  'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                  'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                  'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                  'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                  'tileview', 'videobackgroundblur', 'download', 'help'
                ]
              },
              userInfo: {
                displayName: '${user?.firstName} ${user?.lastName || ''}' || 'User'
              }
            });

            api.addEventListener('readyToClose', () => {
              window.close();
            });
          </script>
        </body>
        </html>
      `);
      jitsiWindow.document.close();
    }

    // Notify via WebSocket if available
    if (wsRef.current) {
      wsRef.current.emit('initiate_call', {
        conversationId: selectedConversation,
        type,
        callId,
        roomName,
        jitsiUrl
      });
    }

    // Show notification to other participants
    toast({
      title: `${type === 'video' ? 'Video' : 'Audio'} Call Started`,
      description: `You initiated a ${type} call. Other participants will be notified.`
    });
  };

  const joinCall = (callId: string, jitsiUrl: string) => {
    // Extract room name from Jitsi URL
    const roomName = jitsiUrl.split('/').pop();

    // Open Jitsi Meet in new window
    const jitsiWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

    if (jitsiWindow && roomName) {
      jitsiWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Jitsi Meet - Join Call</title>
          <script src="https://meet.jit.si/external_api.js"></script>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
            #jitsi-container { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="jitsi-container"></div>
          <script>
            const api = new JitsiMeetExternalAPI('meet.jit.si', {
              roomName: '${roomName}',
              width: '100%',
              height: '100%',
              parentNode: document.querySelector('#jitsi-container'),
              configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                enableWelcomePage: false,
                prejoinPageEnabled: false
              },
              userInfo: {
                displayName: '${user?.firstName} ${user?.lastName || ''}' || 'User'
              }
            });

            api.addEventListener('readyToClose', () => {
              window.close();
            });
          </script>
        </body>
        </html>
      `);
      jitsiWindow.document.close();
    }

    if (wsRef.current) {
      wsRef.current.emit('join_call', { callId });
    }
  };

  const endCall = () => {
    if (!wsRef.current || !activeCall) return;

    wsRef.current.emit('end_call', { callId: activeCall.id });
    setActiveCall(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !wsRef.current || !selectedConversation) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result?.toString().split(',')[1];
      if (base64Data) {
        wsRef.current!.emit('upload_file', {
          conversationId: selectedConversation,
          fileName: file.name,
          fileData: base64Data,
          fileType: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result?.toString().split(',')[1];
          if (base64Data && wsRef.current && selectedConversation) {
            wsRef.current.emit('upload_file', {
              conversationId: selectedConversation,
              fileName: `voice-${Date.now()}.wav`,
              fileData: base64Data,
              fileType: 'audio/wav'
            });
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast({
        title: "Error",
        description: "Could not start voice recording",
        variant: "destructive"
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
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
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Dialog open={showCreateChat} onOpenChange={setShowCreateChat}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Chat name"
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                    />
                    <div>
                      <p className="text-sm font-medium mb-2">Select Users:</p>
                      <ScrollArea className="h-40">
                        {onlineUsers.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No users available
                          </div>
                        ) : (
                          onlineUsers.map(chatUser => (
                            <div key={chatUser.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(chatUser.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers(prev => [...prev, chatUser.id]);
                                  } else {
                                    setSelectedUsers(prev => prev.filter(id => id !== chatUser.id));
                                  }
                                }}
                              />
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                  {getInitials(chatUser.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <span className="text-sm font-medium">{chatUser.name}</span><div className="text-xs text-gray-500">{chatUser.email}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </ScrollArea>
                    </div>
                    <Button onClick={createConversation} className="w-full">
                      Create Chat
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Show available users if no conversations */}
            {conversations.length === 0 && onlineUsers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-2">
                  Available Users
                </h4>
                {onlineUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 border border-gray-200 mb-2"
                    onClick={async () => {
                      try {
                        console.log('Starting conversation with user:', user);

                        // Validate user data
                        if (!user || !user.id) {
                          toast({
                            title: "Error",
                            description: "Invalid user data",
                            variant: "destructive"
                          });
                          return;
                        }

                        // Check if conversation already exists
                        const existingConversation = conversations.find(conv => 
                          conv.type === 'direct' && 
                          conv.participants.includes(user.id) && 
                          conv.participants.includes(user?.id || 0)
                        );

                        if (existingConversation) {
                          setSelectedConversation(existingConversation.id);

                          // Load messages immediately
                          await joinConversation(existingConversation.id);

                          // Join the conversation room
                          if (wsRef.current) {
                            wsRef.current.emit('join_conversation', { conversationId: existingConversation.id });
                          }

                          toast({
                            title: "Success",
                            description: `Opened conversation with ${user.name}`
                          });
                          return;
                        }

                        // Create direct conversation
                        const response = await fetch('/api/chats/direct', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          credentials: 'include',
                          body: JSON.stringify({
                            targetUserId: user.id
                          })
                        });

                        if (response.ok) {
                          const conversation = await response.json();
                          console.log('Created conversation:', conversation);

                          setConversations(prev => {
                            const exists = prev.find(c => c.id === conversation.id);
                            if (exists) return prev;
                            return [...prev, conversation];
                          });
                          setSelectedConversation(conversation.id);

                          // Load messages immediately after selecting conversation
                          await joinConversation(conversation.id);

                          // Join the conversation room
                          if (wsRef.current) {
                            wsRef.current.emit('join_conversation', { conversationId: conversation.id });
                          }

                          toast({
                            title: "Success",
                            description: `Started conversation with ${user.name}`
                          });
                        } else {
                          const errorData =await response.json().catch(() => ({ error: 'Unknown error' }));
                          console.error('Failed to create conversation:', response.status, errorData);

                          let errorMessage = errorData.error || 'Unknown error occurred';
                          if (response.status === 400 && errorData.error?.includes('yourself')) {
                            errorMessage = 'You cannot start a conversation with yourself';
                          } else if (response.status === 404) {
                            errorMessage = 'User not found';
                          }

                          toast({
                            title: "Error",
                            description: errorMessage,
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        console.error('Error starting conversation:', error);
                        toast({
                          title: "Error",
                          description: "Network error occurred. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          Click to start chatting
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {conversations.length === 0 && onlineUsers.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No users or conversations available</p>
                <p className="text-xs text-gray-400 mt-1">Try refreshing the page</p>
              </div>
            ) : (
              conversations
                .filter(conv => conv.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conversation.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => joinConversation(conversation.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {conversation.type === 'group' ? <Users className="h-5 w-5" /> : getInitials(conversation.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.name}
                          </h3>
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.lastMessage.message}
                          </p>
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
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {conversations.find(c => c.id === selectedConversation)?.type === 'group' ? 
                        <Users className="h-4 w-4" /> : 
                        getInitials(conversations.find(c => c.id === selectedConversation)?.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {conversations.find(c => c.id === selectedConversation)?.name}
                    </h3>
                    {typingUsers.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => initiateCall('audio')}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => initiateCall('video')}>
                    <Video className="h-4 w-4" />
                  </Button>
                  {activeCall && (
                    <Button variant="destructive" size="sm" onClick={endCall}>
                      End Call
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-2">
                <p className="text-xs text-yellow-800 font-medium mb-1">Pinned Messages:</p>
                <div className="space-y-1">
                  {pinnedMessages.map(msg => (
                    <div key={msg.id} className="text-xs text-yellow-700 bg-yellow-100 rounded p-1">
                      <strong>{msg.senderName}:</strong> {msg.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Banner */}
            {replyingTo && (
              <div className="bg-blue-50 border-b border-blue-200 p-2 flex items-center justify-between">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Replying to {replyingTo.senderName}:</span>
                  <span className="ml-2">{replyingTo.message}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                  ×
                </Button>
              </div>
            )}

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
                      className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.senderId === user.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-100">
                            {getInitials(message.senderName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="group relative">
                          {/* Reply indicator */}
                          {message.replyTo && (
                            <div className="text-xs text-gray-500 mb-1 pl-2 border-l-2 border-gray-300">
                              Reply to: {messages.find(m => m.id === message.replyTo)?.message || 'Message'}
                            </div>
                          )}

                          <div className={`rounded-lg p-3 ${
                            message.senderId === user.id 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            {editingMessage === message.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="text-sm"
                                />
                                <div className="flex space-x-2">
                                  <Button size="sm" onClick={() => editMessage(message.id, editingText)}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingMessage(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm">{message.message}</p>
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {message.attachments.map(att => (
                                      <div key={att.id} className="text-xs">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline">
                                          {att.name}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Message actions */}
                          {message.senderId === user.id && editingMessage !== message.id && (
                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex space-x-1 bg-white border rounded shadow-sm p-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingMessage(message.id);
                                    setEditingText(message.message);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteMessage(message.id)}
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => togglePinMessage(message.id)}
                                >
                                  <Pin className={`h-3 w-3 ${message.isPinned ? 'text-yellow-500' : ''}`} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setReplyingTo(message)}
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-gray-500 mt-1">
                            {message.senderId !== user.id && message.senderName} • {formatTime(message.timestamp)}
                            {message.isEdited && <span className="ml-1">(edited)</span>}
                            {message.isPinned && <Pin className="inline h-3 w-3 ml-1 text-yellow-500" />}
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
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={isRecording ? 'text-red-500' : ''}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    if (e.target.value.trim()) {
                      startTyping();
                    } else {
                      stopTyping();
                    }
                  }}
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