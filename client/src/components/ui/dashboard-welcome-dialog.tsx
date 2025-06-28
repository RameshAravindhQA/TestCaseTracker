
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, Lightbulb, TrendingUp, X, Sparkles } from "lucide-react";

interface DashboardWelcomeDialogProps {
  user: any;
}

export function DashboardWelcomeDialog({ user }: DashboardWelcomeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show if user exists and dialog hasn't been shown today
    if (user && (user.firstName || user.name)) {
      const today = new Date().toDateString();
      const lastShown = localStorage.getItem('welcomeDialogLastShown');
      const userName = user.firstName || user.name || 'User';
      
      console.log("Welcome dialog check:", { user: userName, today, lastShown });
      
      if (lastShown !== today) {
        // Show after a delay to ensure dashboard is fully loaded
        const timer = setTimeout(() => {
          console.log("Showing welcome dialog for:", userName);
          setIsOpen(true);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
    const today = new Date().toDateString();
    localStorage.setItem('welcomeDialogLastShown', today);
  };

  if (!user || (!user.firstName && !user.name)) {
    console.log("Welcome dialog: No user or name", user);
    return null;
  }

  const currentTime = new Date();
  const hour = currentTime.getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  const userFirstName = user.firstName || user.name || 'User';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl border-2 border-gradient-to-r from-blue-500 to-purple-500">
        <DialogHeader className="relative text-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {greeting}, {userFirstName}!
            <Heart className="h-5 w-5 text-red-500" />
          </DialogTitle>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
            <Clock className="h-4 w-4" />
            Welcome to TestCaseTracker!
            <Badge variant="secondary" className="ml-2">
              {currentTime.toLocaleDateString()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Welcome Message */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to Start Testing? 🚀</h3>
            <p className="text-sm text-muted-foreground">
              Your testing dashboard is ready. Let's build quality software together!
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium">Today's Focus</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-blue-600">Quality</div>
                <div className="text-muted-foreground">First Priority</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">Testing</div>
                <div className="text-muted-foreground">Excellence</div>
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Daily Inspiration</span>
            </div>
            <p className="text-sm italic text-muted-foreground">
              "Testing is not just about finding bugs; it's about building confidence in software quality."
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={handleClose} size="sm">
              Maybe Later
            </Button>
            <Button 
              onClick={handleClose} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
              size="sm"
            >
              Let's Start Testing! ✨
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
