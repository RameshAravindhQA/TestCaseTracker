
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Quote, TrendingUp, Coffee, Sun, Moon } from "lucide-react";

interface LoginMotivationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export function LoginMotivationDialog({ isOpen, onClose, userName }: LoginMotivationDialogProps) {
  const [quote, setQuote] = useState("");
  const [testingTip, setTestingTip] = useState("");
  const [greeting, setGreeting] = useState("");

  const motivationalQuotes = [
    "Quality is not an act, it is a habit. - Aristotle",
    "Testing leads to failure, and failure leads to understanding. - Burt Rutan",
    "The bitterness of poor quality remains long after the sweetness of low price is forgotten. - Benjamin Franklin",
    "Software testing is a sport like hunting, it's bughunting. - Cem Kaner",
    "If debugging is the process of removing bugs, then programming must be the process of putting them in. - Edsger W. Dijkstra"
  ];

  const testingTips = [
    "Always test your edge cases - they often reveal the most critical bugs.",
    "Write test cases before you start testing to maintain focus and coverage.",
    "Document every bug clearly - future you will thank present you.",
    "Automate repetitive tests to focus on exploratory testing.",
    "Remember: A bug found in testing is cheaper than a bug found in production."
  ];

  useEffect(() => {
    if (isOpen) {
      // Set random quote and tip
      setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
      setTestingTip(testingTips[Math.floor(Math.random() * testingTips.length)]);
      
      // Set greeting based on time
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting("Good morning");
      } else if (hour < 17) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    }
  }, [isOpen]);

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sun className="h-5 w-5 text-yellow-500" />;
    if (hour < 17) return <Sun className="h-5 w-5 text-orange-500" />;
    return <Moon className="h-5 w-5 text-blue-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTimeIcon()}
            {greeting}, {userName}!
          </DialogTitle>
          <DialogDescription>
            Welcome back to your testing journey
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Time Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Logged in at {new Date().toLocaleTimeString()}
          </div>

          {/* Motivational Quote */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
              <p className="text-sm italic text-blue-700 dark:text-blue-300">
                {quote}
              </p>
            </div>
          </div>

          {/* Testing Tip */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-700 dark:text-green-300 mb-1">
                  Today's Testing Tip
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {testingTip}
                </p>
              </div>
            </div>
          </div>

          {/* Software Testing Updates */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Coffee className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Industry Update
                </h4>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Shift-left testing continues to gain momentum. Consider integrating more tests early in your development cycle.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Let's Start Testing!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
