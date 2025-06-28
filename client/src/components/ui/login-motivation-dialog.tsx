
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Star, 
  Coffee,
  Sun,
  Moon,
  Sunrise,
  Users,
  Target,
  Lightbulb,
  Gift,
  CheckCircle,
  Globe,
  Zap,
  Award,
  RefreshCw,
  Heart
} from "lucide-react";

interface MotivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userFirstName?: string;
  loginTime?: Date;
}

interface DailyUpdate {
  title: string;
  description: string;
  category: 'feature' | 'tip' | 'news' | 'update' | 'trend' | 'tool';
  icon: React.ReactNode;
  isNew?: boolean;
  priority?: 'high' | 'medium' | 'low';
  source?: string;
}

interface MotivationalQuote {
  text: string;
  author: string;
  category: 'testing' | 'motivation' | 'success' | 'innovation';
}

const motivationalQuotes: MotivationalQuote[] = [
  {
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle",
    category: "testing"
  },
  {
    text: "Testing shows the presence, not the absence of bugs.",
    author: "Edsger Dijkstra",
    category: "testing"
  },
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
    category: "motivation"
  },
  {
    text: "Progress, not perfection.",
    author: "Unknown",
    category: "motivation"
  },
  {
    text: "Every bug is a mystery story waiting to be solved.",
    author: "Testing Philosophy",
    category: "testing"
  },
  {
    text: "Good testing is like good cooking - it takes time, patience, and the right ingredients.",
    author: "Software Testing Wisdom",
    category: "testing"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "motivation"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "success"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    category: "innovation"
  },
  {
    text: "Testing is not about finding bugs, it's about providing information.",
    author: "Cem Kaner",
    category: "testing"
  },
  {
    text: "If you want to go fast, go alone. If you want to go far, go together.",
    author: "African Proverb",
    category: "motivation"
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    category: "motivation"
  }
];

// Enhanced software testing updates with current industry trends
const softwareTestingUpdates: DailyUpdate[] = [
  {
    title: "AI-Powered Test Generation",
    description: "Microsoft announces Playwright's new AI capabilities for automatic test case generation, reducing manual effort by 70%.",
    category: "news",
    icon: <Target className="h-4 w-4" />,
    isNew: true,
    priority: "high",
    source: "Microsoft Dev Blog"
  },
  {
    title: "Shift-Left Testing Revolution",
    description: "Industry study shows 85% cost reduction when defects are caught during development vs production.",
    category: "trend",
    icon: <TrendingUp className="h-4 w-4" />,
    priority: "high",
    source: "Software Testing Report 2024"
  },
  {
    title: "Cypress 13.0 Released",
    description: "New component testing features and improved debugging capabilities now available for modern web applications.",
    category: "update",
    icon: <Zap className="h-4 w-4" />,
    isNew: true,
    priority: "medium",
    source: "Cypress.io"
  },
  {
    title: "API Testing Best Practice",
    description: "Contract testing with Pact reduces integration issues by 60% according to latest DevOps research.",
    category: "tip",
    icon: <Lightbulb className="h-4 w-4" />,
    priority: "medium",
    source: "DevOps Institute"
  },
  {
    title: "TestContainers Evolution",
    description: "New cloud-native testing approach allows testing against real database instances in isolated containers.",
    category: "tool",
    icon: <CheckCircle className="h-4 w-4" />,
    priority: "medium",
    source: "TestContainers Community"
  },
  {
    title: "Visual Testing Breakthrough",
    description: "Applitools releases AI-powered visual testing that can detect layout issues across 3000+ browser combinations.",
    category: "feature",
    icon: <Award className="h-4 w-4" />,
    isNew: true,
    priority: "high",
    source: "Applitools Labs"
  },
  {
    title: "Automation ROI Statistics",
    description: "Companies with mature test automation report 5x faster release cycles and 90% fewer production defects.",
    category: "news",
    icon: <Users className="h-4 w-4" />,
    priority: "medium",
    source: "QA Intelligence Report"
  },
  {
    title: "Selenium 4.15 Features",
    description: "Enhanced WebDriver BiDi support and improved relative locators make browser automation more reliable.",
    category: "update",
    icon: <RefreshCw className="h-4 w-4" />,
    priority: "medium",
    source: "Selenium Project"
  },
  {
    title: "Performance Testing Insight",
    description: "JMeter alternative K6 gains popularity with 200% year-over-year growth in enterprise adoption.",
    category: "trend",
    icon: <Globe className="h-4 w-4" />,
    priority: "low",
    source: "Load Testing Survey 2024"
  },
  {
    title: "Security Testing Integration",
    description: "OWASP ZAP integration in CI/CD pipelines prevents 95% of common security vulnerabilities.",
    category: "tip",
    icon: <BookOpen className="h-4 w-4" />,
    priority: "high",
    source: "OWASP Foundation"
  }
];

export function LoginMotivationDialog({ 
  open, 
  onOpenChange, 
  userFirstName = "Tester", 
  loginTime = new Date() 
}: MotivationDialogProps) {
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(motivationalQuotes[0]);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);
  const [greeting, setGreeting] = useState("");
  const [timeIcon, setTimeIcon] = useState(<Sun className="h-5 w-5" />);
  const [sessionDuration, setSessionDuration] = useState("0 minutes");

  // Debug logging
  React.useEffect(() => {
    console.log('LoginMotivationDialog mounted/updated:', { open, userFirstName, loginTime });
  }, [open, userFirstName, loginTime]);

  useEffect(() => {
    // Set random quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setCurrentQuote(randomQuote);

    // Get random daily updates (4-6 items with priority weighting)
    const priorityWeight = (update: DailyUpdate) => {
      switch (update.priority) {
        case 'high': return 3;
        case 'medium': return 2;
        default: return 1;
      }
    };

    const weightedUpdates = softwareTestingUpdates
      .sort(() => 0.5 - Math.random())
      .sort((a, b) => priorityWeight(b) - priorityWeight(a));
    
    setDailyUpdates(weightedUpdates.slice(0, Math.floor(Math.random() * 3) + 4));

    // Set greeting based on time
    const hour = loginTime.getHours();
    if (hour < 6) {
      setGreeting("Good Early Morning");
      setTimeIcon(<Moon className="h-5 w-5 text-indigo-500" />);
    } else if (hour < 12) {
      setGreeting("Good Morning");
      setTimeIcon(<Sunrise className="h-5 w-5 text-orange-500" />);
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
      setTimeIcon(<Sun className="h-5 w-5 text-yellow-500" />);
    } else if (hour < 20) {
      setGreeting("Good Evening");
      setTimeIcon(<Sun className="h-5 w-5 text-orange-400" />);
    } else {
      setGreeting("Good Night");
      setTimeIcon(<Moon className="h-5 w-5 text-blue-500" />);
    }

    // Calculate session info
    const storedLoginTime = localStorage.getItem('loginTime');
    if (storedLoginTime) {
      const loginDate = new Date(storedLoginTime);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) {
        setSessionDuration("Just started");
      } else if (diffMinutes < 60) {
        setSessionDuration(`${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`);
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        setSessionDuration(`${hours}h ${minutes}m`);
      }
    }
  }, [loginTime]);

  const formatLoginTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature': return 'bg-green-100 text-green-800 border-green-200';
      case 'tip': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'news': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'update': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'trend': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'tool': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIndicator = (priority?: string) => {
    if (priority === 'high') return '🔥';
    if (priority === 'medium') return '⭐';
    return '💡';
  };

  const getSessionWish = () => {
    const hour = loginTime.getHours();
    const wishes = [
      "Have a productive testing session!",
      "May your tests be comprehensive and your bugs be few!",
      "Wishing you clear requirements and successful test execution!",
      "Hope you discover interesting insights through testing today!",
      "May your automation run smoothly and your coverage be complete!"
    ];

    if (hour < 9) {
      return "Start your day with thorough testing! ☀️";
    } else if (hour < 13) {
      return "Keep up the excellent testing momentum! 🚀";
    } else if (hour < 17) {
      return "Afternoon testing brings clarity and precision! 🎯";
    } else {
      return "Evening sessions often reveal the most interesting bugs! 🌙";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            {timeIcon}
            {greeting}, {userFirstName}!
            <Heart className="h-6 w-6 text-red-500 animate-pulse" />
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Welcome back! Logged in on {formatLoginTime(loginTime)}
            <Badge variant="outline" className="ml-2">
              Session: {sessionDuration}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Motivational Quote */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Daily Inspiration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <blockquote className="text-lg italic text-gray-700 mb-2">
                  "{currentQuote.text}"
                </blockquote>
                <cite className="text-sm text-gray-500">— {currentQuote.author}</cite>
                <Badge 
                  variant="outline" 
                  className={`ml-2 ${getCategoryColor(currentQuote.category)}`}
                >
                  {currentQuote.category}
                </Badge>
              </CardContent>
            </Card>

            {/* Session Info & Wishes */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Coffee className="h-5 w-5 text-brown-500" />
                    <p className="font-medium text-lg">{getSessionWish()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 justify-center">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Session started: {loginTime.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>Ready for Quality Assurance</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Software Testing Updates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-green-500" />
                  Latest in Software Testing
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    Live Updates
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {dailyUpdates.map((update, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex-shrink-0 p-2 rounded-full bg-white border">
                          {update.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium text-gray-900 text-sm">{update.title}</h4>
                            <div className="flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getCategoryColor(update.category)}`}
                              >
                                {update.category}
                              </Badge>
                              {update.isNew && (
                                <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                              )}
                              <span className="text-xs">{getPriorityIndicator(update.priority)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{update.description}</p>
                          {update.source && (
                            <p className="text-xs text-blue-600 font-medium">
                              Source: {update.source}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            "Testing is not just about finding bugs, it's about building confidence in software quality."
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => {
              console.log('View Later clicked');
              onOpenChange(false);
            }}>
              View Later
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                console.log('Lets Start Testing clicked');
                onOpenChange(false);
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Let's Start Testing! 🚀
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
