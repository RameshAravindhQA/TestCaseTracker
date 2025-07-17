import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Users, FileText, Bug, BarChart3, ExternalLink } from 'lucide-react';

interface WelcomeDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ 
  isOpen: externalIsOpen,
  onClose: externalOnClose 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  useEffect(() => {
    // Auto-show welcome dialog for new users
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome && externalIsOpen === undefined) {
      setInternalIsOpen(true);
    }
  }, [externalIsOpen]);

  const features = [
    {
      icon: <Users className="h-6 w-6 text-blue-500" />,
      title: "Project Management",
      description: "Create and manage multiple testing projects with team collaboration"
    },
    {
      icon: <FileText className="h-6 w-6 text-green-500" />,
      title: "Test Case Management", 
      description: "Write, organize, and execute comprehensive test cases"
    },
    {
      icon: <Bug className="h-6 w-6 text-red-500" />,
      title: "Bug Tracking",
      description: "Report, track, and manage bugs with detailed workflows"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
      title: "Reports & Analytics",
      description: "Generate detailed reports and track testing progress"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to TestCase Tracker! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Your comprehensive test management solution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Quick Start Tips:</h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Create your first project to get started</li>
                  <li>• Add team members to collaborate</li>
                  <li>• Start writing test cases and track bugs</li>
                  <li>• Generate reports to monitor progress</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-semibold text-green-900">Latest QA Updates</h4>
                  <p className="text-sm text-green-800">New features: Lottie Avatars, Enhanced Reports, Real-time Chat</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-500 text-green-700 hover:bg-green-100"
                  onClick={() => {
                    handleClose();
                    window.open('/qa-updates', '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View All Updates
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-blue-500 text-blue-700 hover:bg-blue-100"
                  onClick={() => {
                    handleClose();
                    setTimeout(() => window.location.href = '/profile', 100);
                  }}
                >
                  Try Lottie Avatars
                </Button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded border-l-2 border-green-400">
                <span className="font-medium text-green-800">🎭 Lottie Avatars</span>
                <p className="text-green-700">Animated profile pictures</p>
              </div>
              <div className="bg-white p-2 rounded border-l-2 border-blue-400">
                <span className="font-medium text-blue-800">📊 Enhanced Reports</span>
                <p className="text-blue-700">Advanced analytics & charts</p>
              </div>
              <div className="bg-white p-2 rounded border-l-2 border-purple-400">
                <span className="font-medium text-purple-800">💬 Real-time Chat</span>
                <p className="text-purple-700">Live team collaboration</p>
              </div>
            </div>
            
            {/* Additional QA Updates Link */}
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-700">
                  Stay updated with our latest QA improvements and features
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-900 hover:bg-green-100 h-6 px-2 text-xs"
                  onClick={() => {
                    handleClose();
                    window.open('/qa-updates', '_blank');
                  }}
                >
                  📝 View Release Notes
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={handleClose} size="lg" className="px-8">
              Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};