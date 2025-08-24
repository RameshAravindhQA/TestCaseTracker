
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Send, 
  User, 
  Database, 
  FileText, 
  BarChart3, 
  Bug, 
  TestTube, 
  Users, 
  Briefcase,
  MessageSquare,
  Loader2,
  Sparkles,
  Brain,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  data?: any;
  charts?: any[];
}

interface AIContext {
  users: any[];
  projects: any[];
  testCases: any[];
  bugs: any[];
  employees: any[];
  projectAssignments: any[];
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all data for AI context
  const { data: users = [] } = useQuery({
    queryKey: ["ai-users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return res.ok ? res.json() : [];
    }
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["ai-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects");
      return res.ok ? res.json() : [];
    }
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ["ai-test-cases"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/test-cases");
      return res.ok ? res.json() : [];
    }
  });

  const { data: bugs = [] } = useQuery({
    queryKey: ["ai-bugs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/bugs");
      return res.ok ? res.json() : [];
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["ai-employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      return res.ok ? res.json() : [];
    }
  });

  const { data: projectAssignments = [] } = useQuery({
    queryKey: ["ai-project-assignments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employee-projects");
      return res.ok ? res.json() : [];
    }
  });

  // AI Query Mutation
  const aiQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const context: AIContext = {
        users,
        projects,
        testCases,
        bugs,
        employees,
        projectAssignments
      };

      const res = await apiRequest('POST', '/api/ai-assistant/query', {
        query,
        context: selectedContext === 'all' ? context : { [selectedContext]: context[selectedContext as keyof AIContext] },
        userRole: user?.role,
        userId: user?.id
      });

      if (!res.ok) {
        throw new Error('Failed to process AI query');
      }

      return res.json();
    },
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date(),
        suggestions: response.suggestions,
        data: response.data,
        charts: response.charts
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    aiQueryMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0 && user) {
      const welcomeMessage: Message = {
        id: '0',
        type: 'assistant',
        content: `Hello ${user.firstName}! I'm your AI Assistant. I can help you with:
        
• 📊 **Analytics & Reports** - Get insights about projects, bugs, and test cases
• 👥 **Team Management** - Information about employees and allocations  
• 🔍 **Data Queries** - Search and analyze your project data
• 📈 **Performance Metrics** - Track progress and identify trends
• 🐛 **Bug Analysis** - Understand bug patterns and priorities
• ✅ **Test Case Insights** - Review test coverage and execution status

What would you like to know about your projects?`,
        timestamp: new Date(),
        suggestions: [
          "Show me project status overview",
          "What are the critical bugs?",
          "Employee allocation summary",
          "Test case coverage report",
          "Recent project activities",
          "Bug trends analysis"
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [user, messages.length]);

  const quickActions = [
    { icon: BarChart3, label: "Analytics", query: "Show me comprehensive analytics dashboard" },
    { icon: Bug, label: "Bug Report", query: "Generate bug analysis report" },
    { icon: TestTube, label: "Test Status", query: "What's the current test case status?" },
    { icon: Users, label: "Team Info", query: "Show team allocation and availability" },
    { icon: Briefcase, label: "Projects", query: "Give me project status summary" },
    { icon: TrendingUp, label: "Trends", query: "Show me performance trends" }
  ];

  return (
    <MainLayout>
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Assistant
                  </h1>
                  <p className="text-sm text-muted-foreground">Your intelligent project companion</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedContext} onValueChange={setSelectedContext}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="projects">Projects Only</SelectItem>
                  <SelectItem value="bugs">Bugs Only</SelectItem>
                  <SelectItem value="testCases">Test Cases</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Connected
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Quick Actions Sidebar */}
          <div className="w-64 border-r bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setInputMessage(action.query)}
                >
                  <action.icon className="h-4 w-4 mr-2 text-blue-500" />
                  <div className="text-sm">{action.label}</div>
                </Button>
              ))}
            </div>

            {/* System Stats */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">System Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projects:</span>
                  <span className="font-medium">{projects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Test Cases:</span>
                  <span className="font-medium">{testCases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bugs:</span>
                  <span className="font-medium">{bugs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employees:</span>
                  <span className="font-medium">{employees.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.type === 'assistant' && (
                      <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600">
                        <AvatarFallback>
                          <Bot className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-3xl ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                      <Card className={`${
                        message.type === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white dark:bg-gray-800 border shadow-sm'
                      }`}>
                        <CardContent className="p-4">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                          
                          {message.charts && message.charts.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {message.charts.map((chart, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <h4 className="font-medium mb-2">{chart.title}</h4>
                                  <div className="text-sm text-muted-foreground">{chart.description}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {message.suggestions && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      <div className="text-xs text-muted-foreground mt-1 px-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profilePictureUrl} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600">
                      <AvatarFallback>
                        <Bot className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <Card className="bg-white dark:bg-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing your data...
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about your projects, bugs, test cases, or team..."
                    className="flex-1 min-h-[50px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
