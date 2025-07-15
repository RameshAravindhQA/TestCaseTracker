import React from 'react';
import { Step } from 'react-joyride';
import { OnboardingTour } from './onboarding-tour';

const dashboardSteps: Step[] = [
  {
    target: '.stats-overview',
    content: 'Welcome! This is your dashboard overview with key metrics about your projects, test cases, and bugs.',
    placement: 'bottom',
  },
  {
    target: '.projects-section',
    content: 'Here you can see your recent projects. Click on any project to view its details.',
    placement: 'top',
  },
  {
    target: '.recent-activity',
    content: 'Keep track of recent activities across all your projects in this section.',
    placement: 'left',
  },
  {
    target: '.sidebar-navigation',
    content: 'Use this sidebar to navigate between different modules like Test Cases, Bug Reports, and more.',
    placement: 'right',
  },
  {
    target: '.user-menu',
    content: 'Access your profile settings, notifications, and logout options from here.',
    placement: 'bottom',
  },
  {
        target: '[data-tour="test-automation"]',
        content: 'Test Automation helps you create and manage automated test scripts for your projects.',
        placement: 'right' as const,
      },
      {
        target: '[data-tour="api-testing"]',
        content: 'API Testing module allows you to test REST APIs, manage collections, and validate responses.',
        placement: 'right' as const,
      },
];

export function DashboardTour() {
  return <OnboardingTour steps={dashboardSteps} tourKey="dashboard" />;
}