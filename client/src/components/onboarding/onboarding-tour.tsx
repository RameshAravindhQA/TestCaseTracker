
import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuth } from '@/hooks/use-auth';

interface OnboardingTourProps {
  steps: Step[];
  tourKey: string;
  autoStart?: boolean;
}

export function OnboardingTour({ steps, tourKey, autoStart = true }: OnboardingTourProps) {
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (user && autoStart) {
      // Check if user has completed this tour
      const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');
      const tourCompleted = completedTours.includes(`${user.id}-${tourKey}`);
      
      if (!tourCompleted) {
        // Start tour after a short delay
        setTimeout(() => {
          setRun(true);
        }, 1000);
      }
    }
  }, [user, tourKey, autoStart]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setStepIndex(0);
      
      // Mark tour as completed
      if (user) {
        const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');
        completedTours.push(`${user.id}-${tourKey}`);
        localStorage.setItem('completedTours', JSON.stringify(completedTours));
      }
    }
  };

  const startTour = () => {
    setRun(true);
    setStepIndex(0);
  };

  const resetTour = () => {
    if (user) {
      const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');
      const filtered = completedTours.filter((tour: string) => tour !== `${user.id}-${tourKey}`);
      localStorage.setItem('completedTours', JSON.stringify(filtered));
      startTour();
    }
  };

  return (
    <>
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={run}
        steps={steps}
        stepIndex={stepIndex}
        styles={{
          options: {
            primaryColor: '#3b82f6',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonNext: {
            backgroundColor: '#3b82f6',
          },
          buttonBack: {
            marginRight: 10,
          },
        }}
        locale={{
          back: 'Previous',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip tour',
        }}
        showProgress
        showSkipButton
      />
    </>
  );
}

export { startTour as restartTour };
