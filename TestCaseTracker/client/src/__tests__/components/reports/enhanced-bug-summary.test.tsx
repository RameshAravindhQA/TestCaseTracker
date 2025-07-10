
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnhancedBugSummary } from '@/components/reports/enhanced-bug-summary';
import { Bug, Module } from '@/types';

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockBugs: Bug[] = [
  {
    id: 1,
    bugId: 'BUG-001',
    title: 'Critical Bug',
    description: 'Test description',
    severity: 'Critical',
    priority: 'High',
    status: 'Open',
    projectId: 1,
    moduleId: 1,
    reportedById: 1,
    dateReported: new Date(),
    stepsToReproduce: 'Steps',
    expectedResult: 'Expected',
    actualResult: 'Actual',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    bugId: 'BUG-002',
    title: 'Major Bug',
    description: 'Test description',
    severity: 'Major',
    priority: 'Medium',
    status: 'In Progress',
    projectId: 1,
    moduleId: 2,
    reportedById: 1,
    dateReported: new Date(),
    stepsToReproduce: 'Steps',
    expectedResult: 'Expected',
    actualResult: 'Actual',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockModules: Module[] = [
  {
    id: 1,
    moduleId: 'MOD-1',
    name: 'Auth Module',
    description: 'Authentication module',
    projectId: 1,
    status: 'Active',
    createdAt: new Date(),
  },
  {
    id: 2,
    moduleId: 'MOD-2', 
    name: 'UI Module',
    description: 'User interface module',
    projectId: 1,
    status: 'Active',
    createdAt: new Date(),
  },
];

describe('EnhancedBugSummary', () => {
  it('should render bug summary cards', () => {
    render(
      <EnhancedBugSummary
        bugs={mockBugs}
        modules={mockModules}
        projectName="Test Project"
      />
    );

    expect(screen.getByText('Bug Reports Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Bugs')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Major')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total bugs
  });

  it('should filter bugs by module', async () => {
    render(
      <EnhancedBugSummary
        bugs={mockBugs}
        modules={mockModules}
        projectName="Test Project"
      />
    );

    // Open module filter
    const moduleSelect = screen.getByRole('combobox');
    fireEvent.click(moduleSelect);

    // Select Auth Module
    const authModule = screen.getByText('Auth Module');
    fireEvent.click(authModule);

    // Should show filtered results
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Only 1 bug in Auth Module
    });
  });

  it('should handle copy to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <EnhancedBugSummary
        bugs={mockBugs}
        modules={mockModules}
        projectName="Test Project"
      />
    );

    const copyAllButton = screen.getByText('Copy All');
    fireEvent.click(copyAllButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('should show no bugs message when empty', () => {
    render(
      <EnhancedBugSummary
        bugs={[]}
        modules={mockModules}
        projectName="Test Project"
      />
    );

    expect(screen.getByText('No bugs found!')).toBeInTheDocument();
    expect(screen.getByText('Great job on maintaining quality!')).toBeInTheDocument();
  });

  it('should calculate correct percentages', () => {
    render(
      <EnhancedBugSummary
        bugs={mockBugs}
        modules={mockModules}
        projectName="Test Project"
      />
    );

    // Should show 50% for critical bugs (1 out of 2)
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });
});
