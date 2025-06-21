
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { BugSummaryCards } from '../../../components/reports/bug-summary-cards';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockBugs = [
  {
    id: 1,
    title: 'Critical Bug',
    status: 'Open',
    priority: 'Critical',
    severity: 'Critical',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Major Bug',
    status: 'In Progress',
    priority: 'High',
    severity: 'Major',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    title: 'Minor Bug',
    status: 'Resolved',
    priority: 'Low',
    severity: 'Minor',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    title: 'Trivial Bug',
    status: 'Closed',
    priority: 'Low',
    severity: 'Trivial',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

describe('Bug Summary Cards Gradient Implementation', () => {
  it('should render all 9 cards with proper gradient backgrounds', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    // Check for the presence of all 9 cards
    expect(screen.getByText('Total Bugs')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Major')).toBeInTheDocument();
    expect(screen.getByText('Minor')).toBeInTheDocument();
    expect(screen.getByText('Trivial')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();

    // Check for gradient classes in the DOM
    const gradientElements = document.querySelectorAll('[class*="bg-gradient-to-br"]');
    expect(gradientElements.length).toBeGreaterThanOrEqual(9);
  });

  it('should apply correct gradient patterns for each card type', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    // Check for specific gradient patterns
    const indigo_blue_cyan = document.querySelectorAll('[class*="from-indigo-500"][class*="via-blue-600"][class*="to-cyan-500"]');
    expect(indigo_blue_cyan.length).toBeGreaterThan(0); // Total Bugs card

    const red_rose_pink = document.querySelectorAll('[class*="from-red-500"][class*="via-rose-600"][class*="to-pink-500"]');
    expect(red_rose_pink.length).toBeGreaterThan(0); // Critical/Open cards

    const emerald_green_teal = document.querySelectorAll('[class*="from-emerald-500"][class*="via-green-600"][class*="to-teal-500"]');
    expect(emerald_green_teal.length).toBeGreaterThan(0); // Resolved card

    const purple_violet_indigo = document.querySelectorAll('[class*="from-purple-600"][class*="via-violet-700"][class*="to-indigo-600"]');
    expect(purple_violet_indigo.length).toBeGreaterThan(0); // Closed card
  });

  it('should display correct counts for each severity and status', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    // Check counts
    expect(screen.getByText('4')).toBeInTheDocument(); // Total bugs
    expect(screen.getByText('1')).toBeInTheDocument(); // Critical, Major, Minor, Trivial, Open, In Progress, Resolved, Closed
  });

  it('should handle empty bug list gracefully', () => {
    render(<BugSummaryCards bugs={[]} projectName="Test Project" />);

    // Should show no bugs message
    expect(screen.getByText('No bugs found!')).toBeInTheDocument();
    expect(screen.getByText('Excellent work on maintaining quality!')).toBeInTheDocument();
  });

  it('should include hover effects and transitions in card classes', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    // Check for transition and hover effect classes
    const cardsWithEffects = document.querySelectorAll('[class*="hover:shadow-2xl"][class*="transition-all"][class*="duration-500"]');
    expect(cardsWithEffects.length).toBeGreaterThanOrEqual(9);
  });

  it('should display percentage calculations correctly', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    // Each bug type should show 25.0% (1 out of 4)
    const percentageElements = screen.getAllByText('25.0%');
    expect(percentageElements.length).toBeGreaterThan(0);
  });

  it('should include proper icons for each card type', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    // Check for icon containers with proper backdrop blur
    const iconContainers = document.querySelectorAll('[class*="bg-white/20"][class*="rounded-lg"][class*="backdrop-blur-sm"]');
    expect(iconContainers.length).toBeGreaterThanOrEqual(9);
  });
});
