
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Quote, Newspaper, Sparkles } from 'lucide-react';

interface LoginSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

interface NewsItem {
  title: string;
  source: string;
  link: string;
  date: string;
}

const motivationalQuotes = [
  "Quality is not an act, it is a habit. - Aristotle",
  "Testing leads to failure, and failure leads to understanding. - Burt Rutan",
  "The bitterness of poor quality remains long after the sweetness of low price is forgotten. - Benjamin Franklin",
  "It is not the strongest of the species that survive, but the one most responsive to change. - Charles Darwin",
  "Debugging is twice as hard as writing the code in the first place. - Brian Kernighan",
  "The best way to find out if you can trust somebody is to trust them. - Ernest Hemingway",
  "Quality is never an accident; it is always the result of high intention. - John Ruskin",
  "Testing can only prove the presence of bugs, not their absence. - Edsger Dijkstra",
  "The expert in anything was once a beginner. - Helen Hayes",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs"
];

export const LoginSuccessDialog: React.FC<LoginSuccessDialogProps> = ({ 
  isOpen, 
  onClose, 
  userName 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dailyQuote, setDailyQuote] = useState('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  // Capitalize first letter
  const capitalizeFirstLetter = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get daily quote
  const getDailyQuote = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return motivationalQuotes[dayOfYear % motivationalQuotes.length];
  };

  // Mock RSS feed data (in a real implementation, you'd fetch from the RSS feeds)
  const mockNewsData: NewsItem[] = [
    {
      title: "Latest Testing Trends in 2024",
      source: "Ministry of Testing",
      link: "https://www.ministryoftesting.com",
      date: "Today"
    },
    {
      title: "AI in Software Testing: What You Need to Know",
      source: "Software Testing Weekly",
      link: "https://softwaretestingweekly.com",
      date: "Yesterday"
    },
    {
      title: "Cross-Browser Testing Best Practices",
      source: "LambdaTest",
      link: "https://www.lambdatest.com",
      date: "2 days ago"
    },
    {
      title: "Cypress Testing Framework Updates",
      source: "Cypress Blog",
      link: "https://www.cypress.io",
      date: "3 days ago"
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentTime(new Date());
      setDailyQuote(getDailyQuote());
      
      // Simulate loading news
      setTimeout(() => {
        setNewsItems(mockNewsData);
        setIsLoadingNews(false);
      }, 1000);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-blue-600">
            Welcome Back! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <User className="h-6 w-6 text-blue-500" />
              <h3 className="text-xl font-semibold text-gray-800">
                {getGreeting()}, {capitalizeFirstLetter(userName)}!
              </h3>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                Login Time: {currentTime.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Daily Quote */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Quote className="h-5 w-5 text-purple-500" />
                Quote of the Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 italic">"{dailyQuote}"</p>
            </CardContent>
          </Card>

          {/* Daily QA Updates */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Newspaper className="h-5 w-5 text-green-500" />
                Daily QA Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingNews ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  <span className="ml-2 text-gray-600">Loading latest updates...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {newsItems.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm hover:text-blue-600 cursor-pointer">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-blue-600 font-medium">{item.source}</span>
                            <span className="text-xs text-gray-500">• {item.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900">Today's Testing Tips:</h4>
                <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                  <li>• Start with your most critical test cases</li>
                  <li>• Document issues as you find them</li>
                  <li>• Review and update test cases regularly</li>
                  <li>• Collaborate with your team for better coverage</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={onClose} 
              size="lg" 
              className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Start Proceeding
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
