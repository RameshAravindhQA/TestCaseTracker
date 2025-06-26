
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

export function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: 'Hello! I\'m your AI assistant. I can help you with test case management, bug reporting, project organization, and answer questions about your testing workflow. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest('POST', '/api/chat/ai', {
        message: messageText,
        context: 'test-management'
      });
      return response.json();
    },
    onSuccess: (data) => {
      const botMessage: ChatMessage = {
        id: Date.now().toString() + '_bot',
        type: 'bot',
        message: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      scrollToBottom();
    },
    onError: (error) => {
      setIsTyping(false);
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
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: message.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);
    
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  const renderMessage = (msg: ChatMessage) => {
    const isBot = msg.type === 'bot';

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex gap-3 mb-4 ${isBot ? 'justify-start' : 'justify-end'}`}
      >
        {isBot && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-purple-100 text-purple-600">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[80%] ${isBot ? 'text-left' : 'text-right'}`}>
          <div className={`rounded-lg p-3 ${
            isBot 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
              : 'bg-purple-500 text-white'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatMessageTime(msg.timestamp)}
          </p>
        </div>

        {!isBot && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </motion.div>
    );
  };

  const quickActions = [
    "Create a test case",
    "How to report a bug?",
    "Show project status",
    "Generate test report",
    "Help with automation"
  ];

  const handleQuickAction = (action: string) => {
    setMessage(action);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
            {/* Notification badge */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center"
            >
              <span className="text-xs text-white font-bold">AI</span>
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
            className={`fixed bottom-6 right-6 z-50 ${
              isMinimized ? 'w-80' : 'w-96'
            } ${isMinimized ? 'h-16' : 'h-[500px]'} transition-all duration-200`}
          >
            <Card className="h-full shadow-2xl border-purple-200 dark:border-purple-800">
              {/* Header */}
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    <CardTitle className="text-lg">AI Assistant</CardTitle>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="text-white hover:bg-purple-700 h-8 w-8 p-0"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-purple-700 h-8 w-8 p-0"
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
                    {messages.map(renderMessage)}
                    
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3 mb-4"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  {/* Quick Actions */}
                  {messages.length === 1 && (
                    <div className="px-4 pb-2">
                      <p className="text-sm text-muted-foreground mb-2">Quick actions:</p>
                      <div className="flex flex-wrap gap-1">
                        {quickActions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => handleQuickAction(action)}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask me anything about testing..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sendMessageMutation.isPending || isTyping}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isPending || isTyping}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
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
