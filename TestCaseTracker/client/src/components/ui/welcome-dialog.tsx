
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LottieAnimation } from '@/components/ui/lottie-animation';
import { Clock, Calendar, Sparkles, Play } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [motivationalQuote, setMotivationalQuote] = useState('');

  const motivationalQuotes = [
    "Quality is not an act, it is a habit. - Aristotle",
    "Testing leads to failure, and failure leads to understanding. - Burt Rutan", 
    "The bitterness of poor quality remains long after the sweetness of low price is forgotten.",
    "Good testing is like good cooking; it requires the right ingredients, proper timing, and attention to detail.",
    "Every bug you find today is one less bug your users will find tomorrow.",
    "Testing is not about breaking things; it's about making them stronger.",
    "A good tester is someone who thinks outside the box but tests inside the requirements.",
    "Quality assurance is not just a job, it's a commitment to excellence."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set random motivational quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setMotivationalQuote(randomQuote);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatLoginTime = () => {
    return currentTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleStartTesting = () => {
    if (window.soundManager) {
      window.soundManager.playSuccess();
    }
    onOpenChange(false);
    // Navigate to test cases or dashboard
    window.location.href = '/test-cases';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {getGreeting()}, {user?.firstName}! 👋
          </DialogTitle>
          <DialogDescription className="text-lg">
            Welcome back to your testing workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lottie Animation */}
          <div className="flex justify-center">
            <LottieAnimation
              animationPath="/lottie/office-team.json"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>

          {/* Session Details */}
          <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Login Time</p>
                    <p className="font-medium">{formatLoginTime()}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Session</p>
                    <p className="font-medium">Testing Session #{Math.floor(Math.random() * 1000)}</p>
                  </div>
                </div>
              </div>

              {/* QA Update */}
              <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <Sparkles className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Today's QA Focus</h4>
                    <p className="text-sm text-green-700">
                      Focus on regression testing and user experience validation. 
                      Remember to document edge cases thoroughly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-start space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-800">Daily Motivation</h4>
                    <p className="text-sm text-purple-700 italic">"{motivationalQuote}"</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Testing Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleStartTesting}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Testing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
