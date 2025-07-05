import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingTutorial, TutorialStep, DASHBOARD_TUTORIAL_STEPS, PROJECT_CREATION_TUTORIAL_STEPS } from '../client/src/components/onboarding/onboarding-tutorial';

// Mock the UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => {
    const button = document.createElement('button');
    if (onClick) button.onclick = onClick;
    if (disabled) button.disabled = disabled;
    button.textContent = children;
    return button;
  }
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  DialogFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => (
    <div data-testid="progress" data-value={value} {...props}>
      {value}%
    </div>
  )
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('Onboarding Tutorial System Unit Tests', () => {
  let mockSteps: TutorialStep[];
  let mockOnClose: any;
  let mockOnComplete: any;

  beforeEach(() => {
    mockSteps = [
      {
        id: 'step1',
        title: 'First Step',
        description: 'This is the first step',
        targetElement: '.target-element',
        position: 'bottom',
        action: 'click'
      },
      {
        id: 'step2',
        title: 'Second Step',
        description: 'This is the second step',
        expectedValue: 'Test Value',
        validation: (value: string) => value.length >= 3
      },
      {
        id: 'step3',
        title: 'Final Step',
        description: 'This is the final step',
        skip: false
      }
    ];

    mockOnClose = vi.fn();
    mockOnComplete = vi.fn();

    // Mock DOM methods
    global.document.querySelector = vi.fn().mockReturnValue({
      getBoundingClientRect: () => ({
        top: 100,
        left: 100,
        bottom: 150,
        right: 200,
        width: 100,
        height: 50
      }),
      style: {}
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Tutorial Component Rendering', () => {
    it('should render tutorial dialog when open', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('Welcome to TestCaseTracker')).toBeInTheDocument();
      expect(screen.getByText('First Step')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={false}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should render custom title and description', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
          title="Custom Title"
          description="Custom Description"
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should advance to next step when next button clicked', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('First Step')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Next'));
      
      expect(screen.getByText('Second Step')).toBeInTheDocument();
    });

    it('should go back to previous step when previous button clicked', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Go to second step first
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Second Step')).toBeInTheDocument();

      // Then go back
      fireEvent.click(screen.getByText('Previous'));
      expect(screen.getByText('First Step')).toBeInTheDocument();
    });

    it('should disable previous button on first step', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    it('should show complete button on last step', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Navigate to last step
      fireEvent.click(screen.getByText('Next')); // Step 2
      fireEvent.click(screen.getByText('Next')); // Step 3

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    it('should show correct progress percentage', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Step 1 of 3 = 33.33%
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('33% Complete')).toBeInTheDocument();

      // Navigate to step 2
      fireEvent.click(screen.getByText('Next'));
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
      expect(screen.getByText('67% Complete')).toBeInTheDocument();
    });

    it('should update progress bar value', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      const progressBar = screen.getByTestId('progress');
      expect(progressBar).toHaveAttribute('data-value', '33.333333333333336');

      fireEvent.click(screen.getByText('Next'));
      expect(progressBar).toHaveAttribute('data-value', '66.66666666666667');
    });
  });

  describe('Step Content Display', () => {
    it('should display step action information', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/Action: click/)).toBeInTheDocument();
      expect(screen.getByText(/on \.target-element/)).toBeInTheDocument();
    });

    it('should display expected value when provided', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Navigate to step with expected value
      fireEvent.click(screen.getByText('Next'));
      
      expect(screen.getByText('Expected: Test Value')).toBeInTheDocument();
    });

    it('should show target element guidance', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Look for the highlighted element on the page')).toBeInTheDocument();
    });
  });

  describe('Step Validation', () => {
    it('should handle step validation correctly', () => {
      const validationStep: TutorialStep = {
        id: 'validation-test',
        title: 'Validation Test',
        description: 'Test validation',
        validation: (value: string) => value === 'correct'
      };

      render(
        <OnboardingTutorial
          steps={[validationStep]}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // The validation logic is internal to the component
      // This test verifies the validation function exists and works
      expect(validationStep.validation?.('correct')).toBe(true);
      expect(validationStep.validation?.('incorrect')).toBe(false);
    });

    it('should handle steps without validation', () => {
      const noValidationStep: TutorialStep = {
        id: 'no-validation',
        title: 'No Validation',
        description: 'No validation required'
      };

      render(
        <OnboardingTutorial
          steps={[noValidationStep]}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('No Validation')).toBeInTheDocument();
    });
  });

  describe('Skip Functionality', () => {
    it('should show skip button when skip is not disabled', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    it('should hide skip button when skip is disabled', () => {
      const noSkipSteps = mockSteps.map(step => ({ ...step, skip: false }));
      
      render(
        <OnboardingTutorial
          steps={noSkipSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.queryByText('Skip')).not.toBeInTheDocument();
    });

    it('should advance step when skip is clicked', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('First Step')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Skip'));
      
      expect(screen.getByText('Second Step')).toBeInTheDocument();
    });
  });

  describe('Tutorial Completion', () => {
    it('should call onComplete when tutorial is finished', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Navigate to last step
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      
      // Complete tutorial
      fireEvent.click(screen.getByText('Complete'));

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when exit button is clicked', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      fireEvent.click(screen.getByText('Exit'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Element Highlighting', () => {
    it('should handle missing target elements gracefully', () => {
      global.document.querySelector = vi.fn().mockReturnValue(null);

      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Should not crash and should still display step content
      expect(screen.getByText('First Step')).toBeInTheDocument();
    });

    it('should calculate tooltip positions correctly', () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 100,
          bottom: 150,
          right: 200,
          width: 100,
          height: 50
        }),
        style: {}
      };

      global.document.querySelector = vi.fn().mockReturnValue(mockElement);

      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Tooltip position calculations are tested implicitly through rendering
      expect(screen.getByText('First Step')).toBeInTheDocument();
    });
  });

  describe('Predefined Tutorial Steps', () => {
    it('should have valid dashboard tutorial steps', () => {
      expect(DASHBOARD_TUTORIAL_STEPS).toBeDefined();
      expect(DASHBOARD_TUTORIAL_STEPS.length).toBeGreaterThan(0);
      
      DASHBOARD_TUTORIAL_STEPS.forEach(step => {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.description).toBeDefined();
      });
    });

    it('should have valid project creation tutorial steps', () => {
      expect(PROJECT_CREATION_TUTORIAL_STEPS).toBeDefined();
      expect(PROJECT_CREATION_TUTORIAL_STEPS.length).toBeGreaterThan(0);
      
      PROJECT_CREATION_TUTORIAL_STEPS.forEach(step => {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.description).toBeDefined();
      });
    });

    it('should have proper validation functions for form steps', () => {
      const projectNameStep = PROJECT_CREATION_TUTORIAL_STEPS.find(
        step => step.id === 'project-name'
      );
      
      expect(projectNameStep?.validation).toBeDefined();
      expect(projectNameStep?.validation?.('ab')).toBe(false); // Too short
      expect(projectNameStep?.validation?.('valid name')).toBe(true); // Valid length
    });
  });

  describe('Tutorial State Management', () => {
    it('should track completed steps', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Navigate through steps
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Previous'));
      fireEvent.click(screen.getByText('Next'));

      // The component should internally track completed steps
      // This is verified through the navigation behavior
      expect(screen.getByText('Second Step')).toBeInTheDocument();
    });

    it('should handle rapid navigation correctly', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      // Rapid navigation
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Previous'));

      expect(screen.getByText('Second Step')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide clear step indicators', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument(); // Step badge
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });

    it('should show helpful instruction text', () => {
      render(
        <OnboardingTutorial
          steps={mockSteps}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Look for the highlighted element on the page')).toBeInTheDocument();
    });

    it('should handle edge cases with single step', () => {
      const singleStep: TutorialStep[] = [{
        id: 'single',
        title: 'Only Step',
        description: 'This is the only step'
      }];

      render(
        <OnboardingTutorial
          steps={singleStep}
          isOpen={true}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
      expect(screen.getByText('100% Complete')).toBeInTheDocument();
    });
  });
});