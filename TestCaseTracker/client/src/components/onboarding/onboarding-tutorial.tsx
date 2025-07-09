
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, ArrowLeft, X, FolderPlus, FileText, Bug, Users, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
  highlight?: string;
}

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { user } = useAuth();

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Welcome to TestCaseTracker! 🎉",
      description: `Hi ${user?.firstName || 'there'}! Let's get you started with your new testing workspace. This tutorial will guide you through the essential features to help you manage your testing projects effectively.`,
      icon: <Users className="h-8 w-8 text-blue-500" />,
    },
    {
      id: 2,
      title: "Create Your First Project",
      description: "Projects are containers for organizing your testing activities. Each project can have multiple modules, test cases, and bug reports. Start by creating a project for your application or feature.",
      icon: <FolderPlus className="h-8 w-8 text-green-500" />,
      action: "Go to Projects → New Project",
      highlight: "projects"
    },
    {
      id: 3,
      title: "Add Modules to Structure Your Tests",
      description: "Modules help you organize test cases by features or components. For example: 'User Authentication', 'Shopping Cart', or 'Payment Processing'.",
      icon: <FileText className="h-8 w-8 text-purple-500" />,
      action: "Navigate to Modules → Add Module",
      highlight: "modules"
    },
    {
      id: 4,
      title: "Create Test Cases",
      description: "Test cases define what to test and expected results. You can create them manually or use our AI-powered test case generator for common scenarios.",
      icon: <CheckCircle className="h-8 w-8 text-orange-500" />,
      action: "Go to Test Cases → New Test Case",
      highlight: "test-cases"
    },
    {
      id: 5,
      title: "Report and Track Bugs",
      description: "When tests fail, you can quickly report bugs with detailed information, attachments, and assign them to team members for resolution.",
      icon: <Bug className="h-8 w-8 text-red-500" />,
      action: "Visit Bug Reports → Report Bug",
      highlight: "bugs"
    },
    {
      id: 6,
      title: "Monitor Progress with Reports",
      description: "Track your testing progress with comprehensive reports and charts. View test execution rates, bug trends, and project health at a glance.",
      icon: <BarChart3 className="h-8 w-8 text-indigo-500" />,
      action: "Check Reports → Consolidated Reports",
      highlight: "reports"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCompletedSteps([...completedSteps, currentStep]);
    onComplete();
    onClose();
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              🚀 Getting Started Guide
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Step Navigation */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold mb-4">Tutorial Steps</h3>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    index === currentStep
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : completedSteps.includes(index)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStepClick(index)}
                >
                  <div className="flex items-center gap-3">
                    {completedSteps.includes(index) ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        index === currentStep ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {index === currentStep && <div className="w-1 h-1 bg-white rounded-full m-2" />}
                      </div>
                    )}
                    <span className={`text-sm font-medium ${
                      index === currentStep ? 'text-blue-700' : 
                      completedSteps.includes(index) ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      Step {step.id}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 ml-8 mt-1">{step.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  {currentStepData.icon}
                  <div>
                    <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      Step {currentStep + 1} of {steps.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 leading-relaxed">
                  {currentStepData.description}
                </p>

                {currentStepData.action && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-800 mb-2">Next Action:</p>
                    <p className="text-blue-700">{currentStepData.action}</p>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Progress</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(((currentStep + 1) / steps.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={onClose}>
                      Skip Tutorial
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex items-center gap-2"
                    >
                      {currentStep === steps.length - 1 ? (
                        <>
                          Complete
                          <CheckCircle className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
