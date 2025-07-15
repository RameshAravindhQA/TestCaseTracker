
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Player } from '@lottiefiles/react-lottie-player';
import { useSound } from '../hooks/useSound';
import { 
  CheckCircle2, 
  Users, 
  FileText, 
  Bug, 
  BarChart3, 
  MessageSquare, 
  Settings,
  Rocket,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

const features = [
  {
    icon: FileText,
    title: 'Test Case Management',
    description: 'Create, organize, and manage test cases with ease',
    color: 'bg-blue-500'
  },
  {
    icon: Bug,
    title: 'Bug Tracking',
    description: 'Track and resolve bugs efficiently',
    color: 'bg-red-500'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together with real-time chat and notifications',
    color: 'bg-green-500'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Get insights with comprehensive reporting',
    color: 'bg-purple-500'
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Communicate with your team instantly',
    color: 'bg-orange-500'
  },
  {
    icon: Settings,
    title: 'Customizable',
    description: 'Tailor the system to your workflow',
    color: 'bg-gray-500'
  }
];

const quickActions = [
  { label: 'Create Your First Project', action: 'projects' },
  { label: 'Add Team Members', action: 'team' },
  { label: 'Import Test Cases', action: 'import' },
  { label: 'Set Up GitHub Integration', action: 'github' },
  { label: 'Configure Sound Settings', action: 'sounds' }
];

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  open,
  onClose,
  userName = 'User'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { playSound } = useSound();

  useEffect(() => {
    if (open) {
      playSound('success');
      setTimeout(() => setShowConfetti(true), 500);
    }
  }, [open, playSound]);

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      playSound('click');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      playSound('click');
    }
  };

  const handleClose = () => {
    playSound('success');
    onClose();
  };

  const handleQuickAction = (action: string) => {
    playSound('click');
    // Handle navigation based on action
    console.log('Quick action:', action);
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="h-32 w-32 mx-auto mb-4">
                <Player
                  autoplay
                  loop
                  src="/lottie/rocket.json"
                  className="w-full h-full"
                />
              </div>
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-16 w-16 mx-auto">
                    <Player
                      autoplay
                      loop={false}
                      src="/lottie/confetti.json"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                Welcome to TestCaseTracker!
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </h2>
              <p className="text-lg text-muted-foreground">
                Hello <span className="font-semibold text-primary">{userName}</span>! 
                We're excited to have you aboard.
              </p>
              <p className="text-muted-foreground">
                Let's get you started with the most powerful test case management system.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Account Created
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Rocket className="h-3 w-3 mr-1" />
                Ready to Launch
              </Badge>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Powerful Features</h2>
              <p className="text-muted-foreground">
                Discover what makes TestCaseTracker special
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center mb-2`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-sm">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="h-24 w-24 mx-auto mb-4">
                <Player
                  autoplay
                  loop
                  src="/lottie/business-team.json"
                  className="w-full h-full"
                />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
              <p className="text-muted-foreground">
                Here are some quick actions to help you begin
              </p>
            </div>

            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-between hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleQuickAction(action.action)}
                >
                  <span>{action.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't worry, you can always access these features later!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Getting Started</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {renderStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep < 2 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleClose} className="bg-primary">
                Let's Start!
                <Rocket className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
