import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, ChevronLeft, Play, SkipForward, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'type' | 'none';
  waitForNavigation?: boolean;
  isOptional?: boolean;
}

interface TutorialModule {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  prerequisite?: string;
}

interface TutorialManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: (moduleId: string) => void;
  currentModule?: string;
  completedModules: string[];
}

const TUTORIAL_MODULES: TutorialModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard Overview',
    description: 'Get familiar with the main dashboard and navigation',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to TestCaseTracker',
        description: 'This is your main dashboard where you can see project statistics and recent activity.',
        target: '[data-tour="dashboard-main"]',
        position: 'bottom',
        action: 'none'
      },
      {
        id: 'navigation',
        title: 'Navigation Menu',
        description: 'Use the sidebar to navigate between different modules like Projects, Test Cases, and Bug Reports.',
        target: '[data-tour="sidebar-nav"]',
        position: 'right',
        action: 'none'
      },
      {
        id: 'project-stats',
        title: 'Project Statistics',
        description: 'View your project statistics including test cases, bugs, and progress metrics.',
        target: '[data-tour="project-stats"]',
        position: 'bottom',
        action: 'none'
      }
    ]
  },
  {
    id: 'projects',
    name: 'Project Management',
    description: 'Learn how to create and manage projects',
    steps: [
      {
        id: 'project-list',
        title: 'Project List',
        description: 'Here you can see all your projects. Each project contains modules, test cases, and bug reports.',
        target: '[data-tour="project-list"]',
        position: 'bottom',
        action: 'none'
      },
      {
        id: 'create-project',
        title: 'Create New Project',
        description: 'Click here to create a new project. You can add a name, description, and assign team members.',
        target: '[data-tour="create-project-btn"]',
        position: 'bottom',
        action: 'click',
        isOptional: true
      },
      {
        id: 'project-actions',
        title: 'Project Actions',
        description: 'Use these buttons to view, edit, or delete projects. You can also manage team members from here.',
        target: '[data-tour="project-actions"]',
        position: 'left',
        action: 'none'
      }
    ]
  },
  {
    id: 'test-cases',
    name: 'Test Case Management',
    description: 'Learn how to create and manage test cases',
    prerequisite: 'projects',
    steps: [
      {
        id: 'test-case-list',
        title: 'Test Case List',
        description: 'View all test cases for the selected project. Test cases are organized by modules.',
        target: '[data-tour="test-case-list"]',
        position: 'bottom',
        action: 'none'
      },
      {
        id: 'create-test-case',
        title: 'Create Test Case',
        description: 'Click here to create a new test case. Fill in the details like title, description, and expected results.',
        target: '[data-tour="create-test-case-btn"]',
        position: 'bottom',
        action: 'click',
        isOptional: true
      },
      {
        id: 'test-case-status',
        title: 'Test Case Status',
        description: 'Each test case has a status: Draft, Active, or Deprecated. You can update the status as needed.',
        target: '[data-tour="test-case-status"]',
        position: 'top',
        action: 'none'
      }
    ]
  },
  {
    id: 'bug-reports',
    name: 'Bug Tracking',
    description: 'Learn how to report and track bugs',
    prerequisite: 'test-cases',
    steps: [
      {
        id: 'bug-list',
        title: 'Bug Reports',
        description: 'View all bug reports for the selected project. Bugs can be linked to test cases.',
        target: '[data-tour="bug-list"]',
        position: 'bottom',
        action: 'none'
      },
      {
        id: 'create-bug',
        title: 'Report Bug',
        description: 'Click here to report a new bug. You can add screenshots, assign priority, and link to test cases.',
        target: '[data-tour="create-bug-btn"]',
        position: 'bottom',
        action: 'click',
        isOptional: true
      },
      {
        id: 'bug-status',
        title: 'Bug Status',
        description: 'Track bug status from Open to Resolved. You can also assign bugs to team members.',
        target: '[data-tour="bug-status"]',
        position: 'top',
        action: 'none'
      }
    ]
  },
  {
    id: 'traceability',
    name: 'Traceability Matrix',
    description: 'Learn how to use the traceability matrix',
    prerequisite: 'bug-reports',
    steps: [
      {
        id: 'matrix-overview',
        title: 'Traceability Matrix',
        description: 'The traceability matrix shows relationships between modules using custom markers.',
        target: '[data-tour="matrix-overview"]',
        position: 'bottom',
        action: 'none'
      },
      {
        id: 'create-marker',
        title: 'Create Markers',
        description: 'Create custom markers with different colors to represent different types of relationships.',
        target: '[data-tour="create-marker-btn"]',
        position: 'bottom',
        action: 'click',
        isOptional: true
      },
      {
        id: 'assign-markers',
        title: 'Assign Markers',
        description: 'Click on matrix cells to assign markers and create relationships between modules.',
        target: '[data-tour="matrix-cell"]',
        position: 'top',
        action: 'click',
        isOptional: true
      }
    ]
  }
];

export function TutorialManager({ isVisible, onClose, onComplete, currentModule, completedModules }: TutorialManagerProps) {
  const [activeModule, setActiveModule] = useState<TutorialModule | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Initialize with current module or first incomplete module
  useEffect(() => {
    if (currentModule) {
      const module = TUTORIAL_MODULES.find(m => m.id === currentModule);
      if (module) {
        setActiveModule(module);
        setCurrentStep(0);
      }
    } else if (isVisible && !activeModule) {
      const firstIncomplete = TUTORIAL_MODULES.find(m => !completedModules.includes(m.id));
      if (firstIncomplete) {
        setActiveModule(firstIncomplete);
        setCurrentStep(0);
      }
    }
  }, [currentModule, isVisible, completedModules, activeModule]);

  // Highlight target element and position tooltip
  useEffect(() => {
    if (activeModule && isVisible) {
      const step = activeModule.steps[currentStep];
      if (step) {
        const element = document.querySelector(step.target) as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Calculate tooltip position
          const rect = element.getBoundingClientRect();
          let x = rect.left + rect.width / 2;
          let y = rect.top;
          
          switch (step.position) {
            case 'top':
              y = rect.top - 10;
              break;
            case 'bottom':
              y = rect.bottom + 10;
              break;
            case 'left':
              x = rect.left - 10;
              y = rect.top + rect.height / 2;
              break;
            case 'right':
              x = rect.right + 10;
              y = rect.top + rect.height / 2;
              break;
          }
          
          setTooltipPosition({ x, y });
        }
      }
    }
  }, [activeModule, currentStep, isVisible]);

  const nextStep = useCallback(() => {
    if (activeModule && currentStep < activeModule.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (activeModule) {
      // Complete current module
      onComplete(activeModule.id);
      
      // Find next module
      const nextModule = TUTORIAL_MODULES.find(m => 
        !completedModules.includes(m.id) && 
        m.id !== activeModule.id &&
        (!m.prerequisite || completedModules.includes(m.prerequisite))
      );
      
      if (nextModule) {
        setActiveModule(nextModule);
        setCurrentStep(0);
      } else {
        onClose();
      }
    }
  }, [activeModule, currentStep, completedModules, onComplete, onClose]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    onClose();
  }, [onClose]);

  const selectModule = useCallback((module: TutorialModule) => {
    setActiveModule(module);
    setCurrentStep(0);
  }, []);

  if (!isVisible) return null;

  const availableModules = TUTORIAL_MODULES.filter(m => 
    !m.prerequisite || completedModules.includes(m.prerequisite)
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Highlight overlay */}
      {highlightedElement && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 4,
            left: highlightedElement.getBoundingClientRect().left - 4,
            width: highlightedElement.getBoundingClientRect().width + 8,
            height: highlightedElement.getBoundingClientRect().height + 8,
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          }}
        />
      )}

      {/* Tutorial Selection Modal */}
      {!activeModule && (
        <div className="fixed inset-0 flex items-center justify-center z-51">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Welcome to TestCaseTracker
                  </CardTitle>
                  <CardDescription>
                    Choose a tutorial module to get started
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableModules.map((module) => (
                  <div
                    key={module.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-colors",
                      completedModules.includes(module.id) 
                        ? "bg-green-50 border-green-200" 
                        : "hover:bg-gray-50 border-gray-200"
                    )}
                    onClick={() => selectModule(module)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {module.name}
                          {completedModules.includes(module.id) && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{module.description}</p>
                        <div className="mt-2">
                          <Badge variant="secondary">
                            {module.steps.length} steps
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={skipTutorial}>
                Skip Tutorial
              </Button>
              <p className="text-sm text-gray-600">
                {completedModules.length} of {TUTORIAL_MODULES.length} modules completed
              </p>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Tutorial Step Modal */}
      {activeModule && (
        <div 
          className="fixed z-51 pointer-events-none"
          style={{
            top: tooltipPosition.y,
            left: tooltipPosition.x,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <Card className="w-80 pointer-events-auto">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{activeModule.steps[currentStep].title}</CardTitle>
                  <CardDescription className="text-xs">
                    Step {currentStep + 1} of {activeModule.steps.length}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-4">
              <p className="text-sm text-gray-700">
                {activeModule.steps[currentStep].description}
              </p>
              {activeModule.steps[currentStep].isOptional && (
                <Badge variant="outline" className="mt-2">
                  Optional
                </Badge>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={previousStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={skipTutorial}>
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip
                </Button>
                <Button size="sm" onClick={nextStep}>
                  {currentStep === activeModule.steps.length - 1 ? 'Complete' : 'Next'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}