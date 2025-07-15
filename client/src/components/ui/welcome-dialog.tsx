
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Clock, Calendar, Globe, ArrowRight, Quote, ExternalLink, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { EnhancedLottie } from './enhanced-lottie';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export function WelcomeDialog({ isOpen, onClose, userName }: WelcomeDialogProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dailyQuote, setDailyQuote] = useState({ text: "", author: "" });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Daily motivational quotes for testing professionals
  const motivationalQuotes = [
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Testing leads to failure, and failure leads to understanding.", author: "Burt Rutan" },
    { text: "The bitterness of poor quality remains long after the sweetness of low price is forgotten.", author: "Benjamin Franklin" },
    { text: "Software testing is a sport like hunting, it's bughunting.", author: "Cem Kaner" },
    { text: "If debugging is the process of removing bugs, then programming must be the process of putting them in.", author: "Edsger W. Dijkstra" },
    { text: "Testing shows the presence, not the absence of bugs.", author: "Edsger W. Dijkstra" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
    { text: "Strive for perfection in everything you do. Take the best that exists and make it better.", author: "Sir Henry Royce" },
    { text: "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.", author: "Aristotle" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
    { text: "Quality is everyone's responsibility.", author: "W. Edwards Deming" },
    { text: "Testing is an infinite process of comparing the invisible to the ambiguous in order to avoid the unthinkable happening to the anonymous.", author: "James Bach" },
    { text: "The purpose of testing is to build confidence in the software.", author: "Testing Wisdom" },
    { text: "A bug is never just a mistake. It represents something bigger. An error of thinking that makes you who you are.", author: "Testing Philosophy" },
    { text: "Good testing is a challenging intellectual process.", author: "Cem Kaner" },
    { text: "Test automation is not about replacing manual testing; it's about freeing testers to do more interesting work.", author: "Testing Best Practice" },
    { text: "The sooner you start testing, the more time you have to fix the issues you find.", author: "Testing Principle" },
    { text: "Every bug fixed is a step towards perfection.", author: "Quality Mindset" },
    { text: "Testing is not just finding bugs; it's about building quality into the product.", author: "Quality Assurance" },
    { text: "A tester's best tool is a diverse viewpoint.", author: "James Whittaker" },
    { text: "The best way to predict the future is to test it.", author: "Testing Vision" },
    { text: "Quality starts with the intention, which is fixed by management.", author: "Philip Crosby" },
    { text: "In testing, as in life, preparation is everything.", author: "Testing Wisdom" },
    { text: "A good test case is one that has a high probability of detecting an undiscovered error.", author: "Glenford Myers" },
    { text: "The goal of testing is not to eliminate every bug, but to reduce risk to an acceptable level.", author: "Risk Management" },
    { text: "Testing without requirements is like traveling without a map.", author: "Testing Strategy" },
    { text: "Great testing requires great communication.", author: "Testing Collaboration" },
    { text: "Every test is a step towards understanding.", author: "Testing Philosophy" }
  ];

  // Get daily quote based on date
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % motivationalQuotes.length;
    setDailyQuote(motivationalQuotes[quoteIndex]);
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Updated testing resources with working links
  const testingUpdates = [
    {
      title: "AI-Powered Test Generation",
      description: "Revolutionary machine learning algorithms transforming automated test case generation",
      category: "Innovation",
      icon: <Lightbulb className="h-4 w-4" />,
      link: "https://www.testim.io/blog/ai-test-automation/",
      color: "bg-purple-100 text-purple-700 border-purple-200"
    },
    {
      title: "Shift-Left Testing Strategy",
      description: "Early testing integration in development lifecycle for faster feedback loops",
      category: "Best Practices",
      icon: <Target className="h-4 w-4" />,
      link: "https://www.atlassian.com/continuous-delivery/software-testing/shift-left-testing",
      color: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      title: "Modern Test Automation",
      description: "Latest frameworks: Playwright, Cypress, and WebDriver advancements",
      category: "Tools",
      icon: <TrendingUp className="h-4 w-4" />,
      link: "https://playwright.dev/",
      color: "bg-green-100 text-green-700 border-green-200"
    },
    {
      title: "API Testing Excellence",
      description: "Comprehensive API testing strategies and best practices for modern applications",
      category: "Techniques",
      icon: <Globe className="h-4 w-4" />,
      link: "https://www.postman.com/api-testing/",
      color: "bg-orange-100 text-orange-700 border-orange-200"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-3xl font-bold text-center">
            <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to Test Case Management System
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Welcome Section */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className="w-32 h-32">
                  <EnhancedLottie
                    customUrl="/lottie/Business team_1752294842244.json"
                    size="lg"
                    loop={true}
                    autoplay={true}
                    className="w-full h-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  {getTimeBasedGreeting()}, {userName}! 👋
                </h2>
                <p className="text-muted-foreground text-sm">
                  Welcome back to your testing workspace
                </p>
              </div>
              
              {/* Time Display */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Current Time:</span>
                    </div>
                    <div className="text-center">
                      <span className="text-blue-600 font-mono text-lg">
                        {formatTime(currentTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-600 font-medium text-xs">
                        {formatDate(currentTime)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Motivational Quote */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Quote className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700">Daily Inspiration</span>
                    </div>
                    <blockquote className="text-sm italic text-gray-700 text-center leading-relaxed">
                      "{dailyQuote.text}"
                    </blockquote>
                    <p className="text-xs text-green-600 text-center font-medium">
                      — {dailyQuote.author}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Testing Updates */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Latest Testing Updates & Resources</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {testingUpdates.map((update, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {update.icon}
                            <CardTitle className="text-sm font-medium leading-tight">
                              {update.title}
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className={`text-xs ${update.color}`}>
                            {update.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-xs mb-3 leading-relaxed">
                          {update.description}
                        </CardDescription>
                        <a
                          href={update.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          Explore Resource
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Additional Quick Tips */}
              <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    Quick Testing Tips for Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs space-y-1 text-amber-700">
                    <li>• Start your day by reviewing yesterday's failed test cases</li>
                    <li>• Consider edge cases in your test scenarios</li>
                    <li>• Document your testing process for future reference</li>
                    <li>• Collaborate with developers for better bug resolution</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center pt-6 border-t"
        >
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Proceed to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
