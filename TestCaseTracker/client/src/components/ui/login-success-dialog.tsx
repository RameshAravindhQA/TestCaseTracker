import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Quote, Newspaper, Sparkles, CheckCircle, TrendingUp, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "The expert in anything was once a beginner. - Helen Hayes",
  "Quality is never an accident; it is always the result of high intention. - John Ruskin",
  "Testing can only prove the presence of bugs, not their absence. - Edsger Dijkstra",
  "Debugging is twice as hard as writing the code in the first place. - Brian Kernighan"
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
  const [showAnimation, setShowAnimation] = useState(true);

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

  // Get greeting emoji
  const getGreetingEmoji = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '🌅';
    if (hour < 17) return '☀️';
    return '🌆';
  };

  // Get daily quote
  const getDailyQuote = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return motivationalQuotes[dayOfYear % motivationalQuotes.length];
  };

  // Mock RSS feed data
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
      setShowAnimation(true);

      // Hide animation after 3 seconds
      const animationTimer = setTimeout(() => {
        setShowAnimation(false);
      }, 3000);

      // Simulate loading news
      const newsTimer = setTimeout(() => {
        setNewsItems(mockNewsData);
        setIsLoadingNews(false);
      }, 1500);

      return () => {
        clearTimeout(animationTimer);
        clearTimeout(newsTimer);
      };
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto border-0 shadow-2xl">
        <AnimatePresence>
          {showAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg backdrop-blur-sm z-10 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-6xl"
              >
                🎉
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogHeader className="text-center pb-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome Back! {getGreetingEmoji()}
            </DialogTitle>
          </motion.div>
        </DialogHeader>

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Enhanced Welcome Message */}
          <motion.div 
            className="text-center bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-8 rounded-xl border border-blue-200/50 shadow-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2, delay: 0.5 }}
              >
                <User className="h-8 w-8 text-blue-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800">
                {getGreeting()}, {capitalizeFirstLetter(userName)}!
              </h3>
              <Coffee className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-3">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">
                Login Time: {currentTime.toLocaleString()}
              </span>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1, duration: 1 }}
              className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
            />
          </motion.div>

          

          {/* Enhanced Daily Quote */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
                  <Quote className="h-6 w-6 text-purple-500" />
                  Quote of the Day
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.p 
                  className="text-gray-700 italic text-lg leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  "{dailyQuote}"
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>



          {/* Enhanced Quick Tips */}
          <motion.div 
            className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-6 w-6 text-yellow-500 mt-1" />
              </motion.div>
              <div>
                <h4 className="font-bold text-yellow-900 text-lg mb-2">Today's Testing Tips:</h4>
                <ul className="text-sm text-yellow-800 space-y-2">
                  {[
                    "Start with your most critical test cases",
                    "Document issues as you find them",
                    "Review and update test cases regularly",
                    "Collaborate with your team for better coverage"
                  ].map((tip, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + index * 0.1, duration: 0.3 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                      {tip}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Action Button */}
          <motion.div 
            className="flex justify-center pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            <Button 
              onClick={onClose} 
              size="lg" 
              className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                Start Your Journey →
              </motion.span>
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};