import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, Lightbulb, TrendingUp, X } from "lucide-react";

interface DashboardWelcomeDialogProps {
  user: any;
}

export function DashboardWelcomeDialog({ user }: DashboardWelcomeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show if user exists and dialog hasn't been shown
    if (user && !localStorage.getItem('hasSeenDashboardWelcome')) {
      // Show after a brief delay to ensure dashboard is rendered
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenDashboardWelcome', 'true');
  };

  if (!user) return null;

  const currentTime = new Date();
  const hour = currentTime.getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  const userFirstName = user?.firstName || "there";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-red-500" />
            {greeting}, {userFirstName}! Welcome to TestCaseTracker!
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Welcome back! Logged in on {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} at {currentTime.toLocaleTimeString()}
            <Badge variant="secondary" className="ml-2">Session Active</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Daily Inspiration */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <h3 className="font-medium">Daily Inspiration</h3>
            </div>
            <p className="text-sm italic text-muted-foreground">
              "The only way to do great work is to love what you do."
            </p>
            <p className="text-xs text-muted-foreground mt-1">— Steve Jobs</p>
          </div>

          {/* Latest Updates */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="font-medium">Testing Industry Updates</h3>
              <Badge variant="outline" className="text-xs">Fresh Insights</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-sm font-medium">AI-Powered Test Generation</h4>
                  <p className="text-xs text-muted-foreground">
                    Revolutionary advances in AI for automated test case creation, improving efficiency by 70%.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-sm font-medium">Shift-Left Testing Adoption</h4>
                  <p className="text-xs text-muted-foreground">
                    Early testing practices showing 65% cost reduction in defect resolution.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-sm font-medium">Continuous Testing Evolution</h4>
                  <p className="text-xs text-muted-foreground">
                    New frameworks for seamless CI/CD integration and real-time quality gates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Testing Quote */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-center italic">
              "Testing is not just about finding bugs; it's about building confidence in software quality."
            </p>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleClose}>
              Maybe Later
            </Button>
            <Button onClick={handleClose} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              Let's Start Testing! ✨
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}