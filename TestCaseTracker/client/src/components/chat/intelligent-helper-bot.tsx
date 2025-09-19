
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
  Bot,
  User,
  Loader2,
  Copy,
  Download,
  ExternalLink,
  Calendar,
  FileText,
  Bug,
  TestTube,
  Folder,
  GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any;
  actionType?: string;
  loading?: boolean;
}

interface ActionResult {
  success: boolean;
  data?: any;
  message: string;
  actionType: string;
}

export function IntelligentHelperBot() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'bot',
      content: `Hi ${user?.firstName || 'there'}! 👋 I'm your intelligent assistant. I can help you with:\n\n🏗️ Projects & Modules\n🐛 Bug Management\n✅ Test Cases\n💬 Messaging\n📊 Reports\n📝 Documentation\n⏰ Time Tracking\n🤖 Chatbot Management\n\nJust ask me naturally! For example:\n"Show all projects"\n"How many bugs are open?"\n"How do I create a test case?"\n"Export test cases to PDF"\n\n💡 Administrators can configure my responses in the Chatbot Management section!`,
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Natural Language Processing for command recognition
  const parseCommand = (input: string): { action: string; params: any } => {
    const text = input.toLowerCase();
    
    // Project Management Commands
    if (text.includes('show') && text.includes('project')) {
      if (text.includes('all projects')) return { action: 'list_projects', params: {} };
      if (text.includes('active')) return { action: 'list_projects', params: { status: 'Active' } };
      if (text.includes('inactive') || text.includes('archived')) return { action: 'list_projects', params: { status: 'Inactive' } };
    }
    
    // Bug Management Commands
    if (text.includes('bug') || text.includes('bugs')) {
      if (text.includes('show all') || text.includes('list')) return { action: 'list_bugs', params: {} };
      if (text.includes('open')) return { action: 'list_bugs', params: { status: 'Open' } };
      if (text.includes('critical')) return { action: 'list_bugs', params: { severity: 'Critical' } };
      if (text.includes('how many')) return { action: 'count_bugs', params: {} };
    }
    
    // Test Case Commands
    if (text.includes('test case') || text.includes('test cases')) {
      if (text.includes('show all') || text.includes('list')) return { action: 'list_test_cases', params: {} };
      if (text.includes('passed')) return { action: 'list_test_cases', params: { status: 'Passed' } };
      if (text.includes('failed')) return { action: 'list_test_cases', params: { status: 'Failed' } };
      if (text.includes('not executed')) return { action: 'list_test_cases', params: { status: 'Not Executed' } };
      if (text.includes('how many')) return { action: 'count_test_cases', params: {} };
    }
    
    // Export Commands
    if (text.includes('export')) {
      if (text.includes('pdf')) return { action: 'export_pdf', params: { format: 'pdf' } };
      if (text.includes('csv')) return { action: 'export_csv', params: { format: 'csv' } };
    }
    
    // Time tracking
    if (text.includes('timesheet') || text.includes('worklog')) {
      if (text.includes('show')) return { action: 'show_timesheets', params: {} };
      if (text.includes('today')) return { action: 'show_timesheets', params: { period: 'today' } };
    }
    
    // Dashboard queries
    if (text.includes('dashboard') || text.includes('overview') || text.includes('summary')) {
      return { action: 'show_dashboard', params: {} };
    }
    
    // Default fallback
    return { action: 'general_query', params: { query: input } };
  };

  // Execute parsed commands
  const executeCommand = async (action: string, params: any): Promise<ActionResult> => {
    try {
      switch (action) {
        case 'list_projects':
          const projectsResponse = await apiRequest('GET', '/api/projects');
          const projects = await projectsResponse.json();
          let filteredProjects = projects;
          
          if (params.status) {
            filteredProjects = projects.filter((p: any) => p.status === params.status);
          }
          
          return {
            success: true,
            data: filteredProjects,
            message: `Found ${filteredProjects.length} projects${params.status ? ` with status: ${params.status}` : ''}`,
            actionType: 'projects'
          };

        case 'list_bugs':
          const bugsResponse = await apiRequest('GET', '/api/bugs');
          const bugs = await bugsResponse.json();
          let filteredBugs = bugs;
          
          if (params.status) {
            filteredBugs = bugs.filter((b: any) => b.status === params.status);
          }
          if (params.severity) {
            filteredBugs = filteredBugs.filter((b: any) => b.severity === params.severity);
          }
          
          return {
            success: true,
            data: filteredBugs,
            message: `Found ${filteredBugs.length} bugs${params.status ? ` with status: ${params.status}` : ''}${params.severity ? ` and severity: ${params.severity}` : ''}`,
            actionType: 'bugs'
          };

        case 'count_bugs':
          const bugCountResponse = await apiRequest('GET', '/api/bugs');
          const bugCount = await bugCountResponse.json();
          return {
            success: true,
            data: { count: bugCount.length },
            message: `Total bugs: ${bugCount.length}`,
            actionType: 'count'
          };

        case 'list_test_cases':
          const testCasesResponse = await apiRequest('GET', '/api/test-cases');
          const testCases = await testCasesResponse.json();
          let filteredTestCases = testCases;
          
          if (params.status) {
            filteredTestCases = testCases.filter((tc: any) => tc.status === params.status);
          }
          
          return {
            success: true,
            data: filteredTestCases,
            message: `Found ${filteredTestCases.length} test cases${params.status ? ` with status: ${params.status}` : ''}`,
            actionType: 'test_cases'
          };

        case 'count_test_cases':
          const tcCountResponse = await apiRequest('GET', '/api/test-cases');
          const tcCount = await tcCountResponse.json();
          return {
            success: true,
            data: { count: tcCount.length },
            message: `Total test cases: ${tcCount.length}`,
            actionType: 'count'
          };

        case 'show_dashboard':
          const [dashboardProjects, dashboardBugs, dashboardTestCases] = await Promise.all([
            apiRequest('GET', '/api/projects').then(r => r.json()),
            apiRequest('GET', '/api/bugs').then(r => r.json()),
            apiRequest('GET', '/api/test-cases').then(r => r.json())
          ]);
          
          return {
            success: true,
            data: {
              projects: dashboardProjects,
              bugs: dashboardBugs,
              testCases: dashboardTestCases,
              summary: {
                totalProjects: dashboardProjects.length,
                activeProjects: dashboardProjects.filter((p: any) => p.status === 'Active').length,
                totalBugs: dashboardBugs.length,
                openBugs: dashboardBugs.filter((b: any) => b.status === 'Open').length,
                totalTestCases: dashboardTestCases.length,
                passedTestCases: dashboardTestCases.filter((tc: any) => tc.status === 'Passed').length
              }
            },
            message: 'Dashboard overview loaded successfully',
            actionType: 'dashboard'
          };

        case 'general_query':
          // Use existing AI chat endpoint for general queries
          const aiResponse = await apiRequest('POST', '/api/chat/ai', {
            message: params.query,
            context: 'test_management'
          });
          const aiResult = await aiResponse.json();
          
          return {
            success: true,
            data: null,
            message: aiResult.response || 'I understand you want help with that. Could you be more specific?',
            actionType: 'general'
          };

        default:
          return {
            success: false,
            message: "I'm not sure how to help with that. Try asking about projects, bugs, test cases, or other features.",
            actionType: 'error'
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Error: ${error.message || 'Something went wrong'}`,
        actionType: 'error'
      };
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: 'Processing your request...',
      timestamp: new Date(),
      loading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setMessage('');
    setIsProcessing(true);

    try {
      // First try the enhanced intelligent chatbot with knowledge base
      const chatResponse = await apiRequest('POST', '/api/chat/intelligent', {
        message: message.trim(),
        context: 'test_management'
      });
      
      const chatResult = await chatResponse.json();
      
      if (chatResult.source === 'knowledge_base') {
        // Use knowledge base response
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== loadingMessage.id);
          const botResponse: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            content: chatResult.response,
            timestamp: new Date(),
            actionType: 'knowledge_base'
          };
          return [...filtered, botResponse];
        });
        
        toast({
          title: "💡 Knowledge Base",
          description: "Response from configured chatbot knowledge base",
        });
        return;
      }
      
      // If no knowledge base match, fall back to command parsing
      const { action, params } = parseCommand(message.trim());
      const result = await executeCommand(action, params);

      // Remove loading message and add result
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingMessage.id);
        const botResponse: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: result.message,
          timestamp: new Date(),
          data: result.data,
          actionType: result.actionType
        };
        return [...filtered, botResponse];
      });

      if (result.success) {
        toast({
          title: "✅ Success",
          description: result.message,
        });
      }
    } catch (error) {
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingMessage.id);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: 'Sorry, I encountered an error processing your request. Please try again. You can also check the Chatbot Management section to add more questions to my knowledge base.',
          timestamp: new Date(),
          actionType: 'error'
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.loading) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{msg.content}</span>
        </div>
      );
    }

    if (!msg.data || msg.actionType === 'general' || msg.actionType === 'error') {
      return <div className="whitespace-pre-wrap">{msg.content}</div>;
    }

    // Render data based on action type
    switch (msg.actionType) {
      case 'projects':
        return (
          <div className="space-y-3">
            <p className="font-medium">{msg.content}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {msg.data.map((project: any) => (
                <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center space-x-2">
                    <Folder className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );

      case 'bugs':
        return (
          <div className="space-y-3">
            <p className="font-medium">{msg.content}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {msg.data.map((bug: any) => (
                <div key={bug.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center space-x-2">
                    <Bug className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{bug.title}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Badge variant="outline">{bug.status}</Badge>
                    <Badge variant={bug.severity === 'Critical' ? 'destructive' : 'secondary'}>
                      {bug.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'test_cases':
        return (
          <div className="space-y-3">
            <p className="font-medium">{msg.content}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {msg.data.map((testCase: any) => (
                <div key={testCase.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center space-x-2">
                    <TestTube className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{testCase.feature}</span>
                  </div>
                  <Badge variant={testCase.status === 'Passed' ? 'default' : testCase.status === 'Failed' ? 'destructive' : 'secondary'}>
                    {testCase.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-4">
            <p className="font-medium">{msg.content}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Projects</p>
                    <p className="font-bold text-lg">{msg.data.summary.activeProjects}/{msg.data.summary.totalProjects}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bug className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bugs</p>
                    <p className="font-bold text-lg">{msg.data.summary.openBugs}/{msg.data.summary.totalBugs}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg col-span-2">
                <div className="flex items-center space-x-2">
                  <TestTube className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Test Cases</p>
                    <p className="font-bold text-lg">{msg.data.summary.passedTestCases}/{msg.data.summary.totalTestCases} Passed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'count':
        return (
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-500">{msg.data.count}</div>
            <div>{msg.content}</div>
          </div>
        );

      default:
        return <div className="whitespace-pre-wrap">{msg.content}</div>;
    }
  };

  return (
    <>
      {/* Floating Bot Button */}
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
              className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Bot className="h-6 w-6 text-white" />
            </Button>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center"
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
            } ${isMinimized ? 'h-16' : 'h-[600px]'} transition-all duration-200`}
          >
            <Card className="h-full shadow-2xl border-purple-200 dark:border-purple-800">
              {/* Header */}
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    <CardTitle className="text-lg">AI Assistant</CardTitle>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Smart
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
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.type === 'bot' && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-purple-100 text-purple-600">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`max-w-[80%] ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`rounded-lg p-3 ${
                              msg.type === 'user'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            }`}>
                              {renderMessageContent(msg)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                            </p>
                          </div>

                          {msg.type === 'user' && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask me anything about your projects, bugs, test cases..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isProcessing}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isProcessing}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Try: "Show all projects", "How many bugs are open?", "Export test cases"
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
