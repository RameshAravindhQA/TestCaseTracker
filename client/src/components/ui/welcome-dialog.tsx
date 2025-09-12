import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Users, FileText, Bug, BarChart3 } from 'lucide-react';

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

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900">🚀 QA Latest Updates</h4>
                <p className="text-sm text-purple-800 mt-1 mb-3">Stay updated with the latest in Quality Assurance and Testing</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <a 
                    href="https://www.ministryoftesting.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline"
                  >
                    📚 Ministry of Testing
                  </a>
                  <a 
                    href="https://testautomationu.applitools.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline"
                  >
                    🎓 Test Automation University
                  </a>
                  <a 
                    href="https://www.softwaretestinghelp.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline"
                  >
                    💡 Software Testing Help
                  </a>
                  <a 
                    href="https://www.lambdatest.com/blog/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline"
                  >
                    🔧 LambdaTest Blog
                  </a>
                  <a 
                    href="https://testguild.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline"
                  >
                    🎙️ TestGuild Podcasts
                  </a>
                  <a 
                    href="https://www.reddit.com/r/QualityAssurance/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-700 hover:text-purple-900 hover:underline"
                  >
                    👥 QA Community
                  </a>
                </div>
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