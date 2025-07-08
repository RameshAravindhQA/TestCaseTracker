
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Clock, Star, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "update";
  timestamp: Date;
  priority: "low" | "medium" | "high";
}

interface LoginNotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export function LoginNotificationDialog({ isOpen, onClose, userName }: LoginNotificationDialogProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [motivationalQuote, setMotivationalQuote] = useState("");

  const motivationalQuotes = [
    "Quality is not an act, it is a habit. - Aristotle",
    "Testing shows the presence, not the absence of bugs. - Edsger Dijkstra",
    "The goal is to turn data into information, and information into insight.",
    "Excellence is never an accident. It is always the result of high intention.",
    "The best way to find out if you can trust somebody is to trust them.",
    "Progress is impossible without change, and those who cannot change their minds cannot change anything.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Innovation distinguishes between a leader and a follower.",
    "The only way to do great work is to love what you do.",
    "Quality means doing it right when no one is looking."
  ];

  useEffect(() => {
    if (isOpen) {
      // Set random motivational quote
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setMotivationalQuote(randomQuote);

      // Simulate fetching notifications
      const mockNotifications: Notification[] = [
        {
          id: "1",
          title: "System Update",
          message: "New test case automation features are now available. Check out the enhanced AI test generator in the Test Cases section.",
          type: "update",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          priority: "high"
        },
        {
          id: "2", 
          title: "Project Milestone",
          message: "Congratulations! The team has successfully completed 85% of test cases this sprint. Keep up the excellent work!",
          type: "success",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          priority: "medium"
        },
        {
          id: "3",
          title: "New Testing Guidelines",
          message: "Updated testing standards and best practices document is now available in the Documents section.",
          type: "info",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          priority: "medium"
        },
        {
          id: "4",
          title: "Bug Triage Meeting",
          message: "Weekly bug triage meeting scheduled for tomorrow at 2:00 PM. Please review assigned critical bugs before the meeting.",
          type: "warning",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          priority: "high"
        }
      ];

      setNotifications(mockNotifications);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <Bell className="h-4 w-4 text-yellow-600" />;
      case "update":
        return <Star className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const currentTime = new Date().toLocaleString();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              Welcome back, {userName}! 👋
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Welcome Message */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Login time: {currentTime}
                </div>
                <div className="bg-white/80 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm italic text-gray-700 font-medium">
                    "{motivationalQuote}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          {notifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Updates & Notifications
                  <Badge variant="secondary">{notifications.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getPriorityColor(notification.priority)}`}
                                  >
                                    {notification.priority}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Have a productive testing session! 🚀
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                View Later
              </Button>
              <Button size="sm" onClick={onClose}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
