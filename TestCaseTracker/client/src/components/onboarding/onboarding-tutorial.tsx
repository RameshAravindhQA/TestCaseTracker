import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, X, Lightbulb, Target, Users, BarChart3 } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  content: string;
  target?: string;
  icon: React.ReactNode;
  action?: () => void;
}

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Welcome to Test Case Management",
    content: "Let's take a quick tour of the key features that will help you manage your testing workflow effectively.",
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    id: 2,
    title: "Create Your First Project",
    content: "Projects help you organize your test cases, bugs, and team collaboration. Click 'New Project' to get started.",
    target: "[data-testid='new-project-button']",
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: 3,
    title: "Manage Test Cases",
    content: "Create, edit, and organize your test cases with our intuitive interface. Track execution status and results.",
    target: "[data-testid='test-cases-nav']",
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    id: 4,
    title: "Bug Tracking",
    content: "Report and track bugs with detailed information, attachments, and priority levels.",
    target: "[data-testid='bugs-nav']",
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: 5,
    title: "Team Collaboration",
    content: "Use the built-in messenger to communicate with your team and discuss project updates.",
    target: "[data-testid='messenger-nav']",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 6,
    title: "Reports & Analytics",
    content: "View comprehensive reports and analytics to track your testing progress and team performance.",
    target: "[data-testid='reports-nav']",
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

export function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  console.log('OnboardingTutorial render:', { isOpen, currentStep, completedSteps });

  useEffect(() => {
    if (isOpen) {
      console.log('OnboardingTutorial opened, highlighting first step');
      // Don't set overflow hidden to prevent blur issues
      document.body.style.pointerEvents = 'auto';
    } else {
      document.body.style.pointerEvents = 'auto';
    }

    return () => {
      document.body.style.pointerEvents = 'auto';
    };
  }, [isOpen]);

  const handleNext = () => {
    try {
      const nextStep = currentStep + 1;
      setCompletedSteps(prev => [...prev, steps[currentStep].id]);

      if (nextStep < steps.length) {
        setCurrentStep(nextStep);
      } else {
        handleComplete();
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
    }
  };

  const handlePrevious = () => {
    try {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    } catch (error) {
      console.error('Error in handlePrevious:', error);
    }
  };

  const handleSkip = () => {
    try {
      console.log('Skipping tutorial');
      onClose();
    } catch (error) {
      console.error('Error in handleSkip:', error);
    }
  };

  const handleComplete = () => {
    try {
      console.log('Tutorial completed');
      setCompletedSteps(prev => [...prev, steps[currentStep].id]);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error in handleComplete:', error);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Lighter overlay to prevent blur issues */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={handleSkip}
      />

      {/* Tutorial Card */}
      <Card className="relative w-full max-w-md mx-4 bg-white shadow-2xl pointer-events-auto">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {steps[currentStep].icon}
              {steps[currentStep].title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {steps[currentStep].content}
          </p>

          <div className="flex flex-wrap gap-2">
            {steps.map((step) => (
              <Badge
                key={step.id}
                variant={
                  completedSteps.includes(step.id) 
                    ? "default" 
                    : step.id === steps[currentStep].id
                    ? "secondary"
                    : "outline"
                }
                className="text-xs"
              >
                {completedSteps.includes(step.id) && (
                  <CheckCircle className="w-3 h-3 mr-1" />
                )}
                {step.id}
              </Badge>
            ))}
          </div>

          <div className="flex justify-between gap-2 pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
              >
                Skip Tutorial
              </Button>
            </div>

            <Button
              size="sm"
              onClick={handleNext}
              className="min-w-[80px]"
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}