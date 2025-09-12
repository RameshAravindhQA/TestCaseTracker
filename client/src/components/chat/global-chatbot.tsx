import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  MessageCircle,
  User,
  Loader2,
  Users,
  Paperclip,
  Smile,
  Image,
  File
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

interface ChatMessage {
  id: string;
  userId: number;
  userName: string;
  content: string;
  timestamp: Date;
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
}

export function GlobalChatbot() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append("userId", String(user?.id));
    formData.append("userName", user?.name || "Unknown User");
    formData.append("content", message.trim());

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      // Simulate sending message and file
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: user?.id || 0,
        userName: user?.name || "Unknown User",
        content: message.trim(),
        timestamp: new Date(),
        attachments: selectedFile
          ? [
              {
                name: selectedFile.name,
                type: selectedFile.type,
                url: URL.createObjectURL(selectedFile), // In real scenario, upload file and get URL
              },
            ]
          : [],
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
      scrollToBottom();
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: `Something went wrong.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const isCurrentUser = msg.userId === user?.id;

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex gap-3 mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isCurrentUser && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <Users className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`max-w-[80%] ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          <div className={`rounded-lg p-3 ${
            isCurrentUser
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            {msg.attachments &&
              msg.attachments.map((attachment, index) => (
                <div key={index} className="mt-2">
                  {attachment.type.startsWith("image/") ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-h-32 rounded-md"
                    />
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      <File className="inline w-4 h-4 mr-1" />
                      {attachment.name}
                    </a>
                  )}
                </div>
              ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {msg.userName} - {formatMessageTime(msg.timestamp)}
          </p>
        </div>

        {isCurrentUser && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </motion.div>
    );
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const addEmoji = (emoji: string) => {
    setMessage((prevMessage) => prevMessage + emoji);
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
            className="fixed bottom-24 right-20 z-40"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
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
            className={`fixed bottom-24 right-20 z-40 ${
              isMinimized ? 'w-80' : 'w-96'
            } ${isMinimized ? 'h-16' : 'h-[500px]'} transition-all duration-200`}
          >
            <Card className="h-full shadow-2xl border-purple-200 dark:border-purple-800">
              {/* Header */}
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle className="text-lg">Team Chat</CardTitle>
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
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleEmojiPicker}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>

                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1"
                      />

                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                      />
                      <label htmlFor="file-upload">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      </label>
                      <Button
                        onClick={handleSendMessage}
                        disabled={(!message.trim() && !selectedFile) || isLoading}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {showEmojiPicker && (
                      <div className="mt-2">
                        {/* Implement your emoji picker here. This is just a placeholder. */}
                        <div>Emoji Picker</div>
                      </div>
                    )}
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