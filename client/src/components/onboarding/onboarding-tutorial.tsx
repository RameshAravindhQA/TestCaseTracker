import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft, X, Check, HelpCircle, Target, MousePointer } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'type' | 'navigate';
  expectedValue?: string;
  validation?: (value: string) => boolean;
  content?: React.ReactNode;
  skip?: boolean;
}

interface OnboardingTutorialProps {
  steps: TutorialStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  title?: string;
  description?: string;
}

export function OnboardingTutorial({
  steps,
  isOpen,
  onClose,
  onComplete,
  title = "Welcome to TestCaseTracker",
  description = "Let's get you started with a quick tour"
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (!isOpen) return;

    const handleHighlight = () => {
      if (!currentStepData?.targetElement) {
        setShowTooltip(false);
        setHighlightElement(null);
        return;
      }

      const element = document.querySelector(currentStepData.targetElement) as HTMLElement;
      if (!element) {
        console.warn(`Target element not found: ${currentStepData.targetElement}`);
        return;
      }

      setHighlightElement(element);
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      const position = currentStepData.position || 'bottom';
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }

      setTooltipPosition({ top, left });
      setShowTooltip(true);

      // Add highlight styles
      element.style.position = 'relative';
      element.style.zIndex = '9999';
      element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
      element.style.borderRadius = '8px';
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    };

    // Delay to ensure DOM is ready
    const timeout = setTimeout(handleHighlight, 100);

    return () => {
      clearTimeout(timeout);
      // Clean up highlight styles
      if (highlightElement) {
        highlightElement.style.position = '';
        highlightElement.style.zIndex = '';
        highlightElement.style.boxShadow = '';
        highlightElement.style.borderRadius = '';
        highlightElement.style.backgroundColor = '';
      }
    };
  }, [currentStep, isOpen, currentStepData]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    onComplete();
    onClose();
  };

  const handleStepValidation = (value: string): boolean => {
    if (!currentStepData.validation) return true;
    return currentStepData.validation(value);
  };

  const skipStep = () => {
    handleNext();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />

      {/* Main Tutorial Dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md z-[10000]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              {title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Current Step */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline">{currentStep + 1}</Badge>
                  {currentStepData.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.description}
                  </p>

                  {currentStepData.action && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                      <MousePointer className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">
                        Action: {currentStepData.action} 
                        {currentStepData.targetElement && ` on ${currentStepData.targetElement}`}
                      </span>
                    </div>
                  )}

                  {currentStepData.expectedValue && (
                    <div className="p-2 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">
                        Expected: {currentStepData.expectedValue}
                      </span>
                    </div>
                  )}

                  {currentStepData.content && (
                    <div className="mt-3">
                      {currentStepData.content}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step Instructions */}
            <div className="flex flex-col gap-2">
              {currentStepData.targetElement && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <HelpCircle className="h-3 w-3" />
                  Look for the highlighted element on the page
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {currentStepData.skip !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipStep}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-1" />
                Exit
              </Button>
              
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Tooltip */}
      {showTooltip && currentStepData.targetElement && (
        <div
          className={cn(
            "fixed z-[10001] bg-blue-600 text-white p-3 rounded-lg shadow-lg max-w-xs",
            "transform -translate-x-1/2 -translate-y-1/2"
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <div className="text-sm font-medium mb-1">
            {currentStepData.title}
          </div>
          <div className="text-xs opacity-90">
            {currentStepData.description}
          </div>
          
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-2 h-2 bg-blue-600 rotate-45",
              currentStepData.position === 'top' && "bottom-[-4px] left-1/2 -translate-x-1/2",
              currentStepData.position === 'bottom' && "top-[-4px] left-1/2 -translate-x-1/2",
              currentStepData.position === 'left' && "right-[-4px] top-1/2 -translate-y-1/2",
              currentStepData.position === 'right' && "left-[-4px] top-1/2 -translate-y-1/2"
            )}
          />
        </div>
      )}
    </>
  );
}

// Predefined tutorial steps for common workflows
export const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TestCaseTracker',
    description: 'Your comprehensive test case management system. Let\'s explore the main features.',
    content: (
      <div className="space-y-2">
        <div className="text-sm">This tutorial will guide you through:</div>
        <ul className="text-xs space-y-1 ml-4">
          <li>• Creating your first project</li>
          <li>• Adding test cases</li>
          <li>• Using the Kanban board</li>
          <li>• Managing bugs and reports</li>
        </ul>
      </div>
    )
  },
  {
    id: 'sidebar-navigation',
    title: 'Navigation Sidebar',
    description: 'Access all features from this sidebar. Click on different sections to navigate.',
    targetElement: '[data-testid="sidebar"]',
    position: 'right',
    action: 'hover'
  },
  {
    id: 'projects-section',
    title: 'Projects',
    description: 'Create and manage your testing projects here. Click to see your projects.',
    targetElement: 'a[href="/projects"]',
    position: 'right',
    action: 'click'
  },
  {
    id: 'kanban-board',
    title: 'Kanban Board',
    description: 'Visualize your test case workflow with drag-and-drop cards.',
    targetElement: 'a[href="/kanban"]',
    position: 'right',
    action: 'click'
  },
  {
    id: 'test-cases',
    title: 'Test Cases',
    description: 'Create, edit, and organize your test cases with detailed documentation.',
    targetElement: 'a[href="/test-cases"]',
    position: 'right',
    action: 'click'
  },
  {
    id: 'bug-reports',
    title: 'Bug Reports',
    description: 'Track and manage bugs found during testing.',
    targetElement: 'a[href="/bug-reports"]',
    position: 'right',
    action: 'click'
  },
  {
    id: 'messenger',
    title: 'Team Communication',
    description: 'Collaborate with your team using the built-in messenger.',
    targetElement: 'a[href="/messenger"]',
    position: 'right',
    action: 'click'
  },
  {
    id: 'spreadsheets',
    title: 'Spreadsheets',
    description: 'Create and manage test data with Excel-like spreadsheets.',
    targetElement: 'a[href="/spreadsheets"]',
    position: 'right',
    action: 'click'
  }
];

export const PROJECT_CREATION_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'project-name',
    title: 'Project Name',
    description: 'Enter a descriptive name for your project.',
    targetElement: 'input[name="name"]',
    position: 'bottom',
    action: 'type',
    expectedValue: 'My First Test Project',
    validation: (value) => value.length >= 3
  },
  {
    id: 'project-description',
    title: 'Project Description',
    description: 'Provide a brief description of what you\'ll be testing.',
    targetElement: 'textarea[name="description"]',
    position: 'bottom',
    action: 'type',
    expectedValue: 'Testing the main application features',
    validation: (value) => value.length >= 10
  },
  {
    id: 'project-customer',
    title: 'Select Customer',
    description: 'Choose the customer or organization for this project.',
    targetElement: 'select[name="customerId"]',
    position: 'bottom',
    action: 'click'
  },
  {
    id: 'project-save',
    title: 'Save Project',
    description: 'Click the save button to create your project.',
    targetElement: 'button[type="submit"]',
    position: 'top',
    action: 'click',
    skip: false
  }
];

export const TEST_CASE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'test-case-title',
    title: 'Test Case Title',
    description: 'Give your test case a clear, descriptive title.',
    targetElement: 'input[name="title"]',
    position: 'bottom',
    action: 'type',
    expectedValue: 'Login with valid credentials',
    validation: (value) => value.length >= 5
  },
  {
    id: 'test-case-description',
    title: 'Test Description',
    description: 'Describe what this test case will verify.',
    targetElement: 'textarea[name="description"]',
    position: 'bottom',
    action: 'type',
    expectedValue: 'Verify that users can log in successfully with valid email and password'
  },
  {
    id: 'test-case-steps',
    title: 'Test Steps',
    description: 'Add the specific steps to execute this test.',
    targetElement: 'textarea[name="testSteps"]',
    position: 'bottom',
    action: 'type',
    expectedValue: '1. Navigate to login page\n2. Enter valid email\n3. Enter valid password\n4. Click login button'
  },
  {
    id: 'expected-result',
    title: 'Expected Result',
    description: 'Define what should happen when the test passes.',
    targetElement: 'textarea[name="expectedResult"]',
    position: 'bottom',
    action: 'type',
    expectedValue: 'User should be redirected to dashboard and see welcome message'
  }
];