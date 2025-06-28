
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
  CheckCircle
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
  category: 'feature' | 'tip' | 'news' | 'update';
  icon: React.ReactNode;
  isNew?: boolean;
}

interface MotivationalQuote {
  text: string;
  author: string;
  category: 'testing' | 'motivation' | 'success';
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
  }
];

const testingUpdates: DailyUpdate[] = [
  {
    title: "Enhanced Test Automation",
    description: "New AI-powered test case generation feature helps create comprehensive test scenarios automatically.",
    category: "feature",
    icon: <Target className="h-4 w-4" />,
    isNew: true
  },
  {
    title: "Testing Best Practice",
    description: "Pro tip: Use boundary value analysis to test edge cases more effectively and catch critical bugs.",
    category: "tip",
    icon: <Lightbulb className="h-4 w-4" />
  },
  {
    title: "Industry News",
    description: "Shift-left testing approach reduces bug fixing costs by 60% according to latest industry research.",
    category: "news",
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    title: "Platform Update",
    description: "New traceability matrix visualization helps track requirement coverage more efficiently.",
    category: "update",
    icon: <CheckCircle className="h-4 w-4" />,
    isNew: true
  },
  {
    title: "Testing Methodology",
    description: "Risk-based testing helps prioritize test cases based on business impact and failure probability.",
    category: "tip",
    icon: <BookOpen className="h-4 w-4" />
  },
  {
    title: "Community Insight",
    description: "Test-driven development (TDD) practitioners report 40-80% reduction in production defects.",
    category: "news",
    icon: <Users className="h-4 w-4" />
  }
];

export function LoginMotivationDialog({ open, onOpenChange, userFirstName = "Tester", loginTime = new Date() }: MotivationDialogProps) {
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(motivationalQuotes[0]);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);
  const [greeting, setGreeting] = useState("");
  const [timeIcon, setTimeIcon] = useState(<Sun className="h-5 w-5" />);

  useEffect(() => {
    // Set random quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setCurrentQuote(randomQuote);

    // Get random daily updates (3-4 items)
    const shuffled = [...testingUpdates].sort(() => 0.5 - Math.random());
    setDailyUpdates(shuffled.slice(0, Math.floor(Math.random() * 2) + 3));

    // Set greeting based on time
    const hour = loginTime.getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
      setTimeIcon(<Sunrise className="h-5 w-5 text-orange-500" />);
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
      setTimeIcon(<Sun className="h-5 w-5 text-yellow-500" />);
    } else {
      setGreeting("Good Evening");
      setTimeIcon(<Moon className="h-5 w-5 text-blue-500" />);
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
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            {timeIcon}
            {greeting}, {userFirstName}!
            <Gift className="h-6 w-6 text-pink-500" />
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Welcome back! Logged in on {formatLoginTime(loginTime)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
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

          {/* Daily Updates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-green-500" />
                What's New in Software Testing
                <Badge className="bg-red-500 text-white">Live Updates</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dailyUpdates.map((update, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 p-2 rounded-full bg-white border">
                    {update.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{update.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={getCategoryColor(update.category)}
                      >
                        {update.category}
                      </Badge>
                      {update.isNew && (
                        <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{update.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coffee className="h-5 w-5 text-brown-500" />
                  <div>
                    <p className="font-medium">Ready to start testing?</p>
                    <p className="text-sm text-gray-600">Your quality assurance journey continues!</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    Session started
                  </div>
                  <p className="text-xs text-gray-400">
                    {loginTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-center">
            <Button onClick={() => onOpenChange(false)} className="px-8">
              Let's Get Testing! 🚀
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
