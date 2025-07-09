
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BugTable } from '@/components/bugs/bug-table';
import { Bug } from '@/types';

const mockBugWithValidDate: Bug = {
  id: 1,
  bugId: 'BUG-001',
  title: 'Test Bug',
  description: 'Test description',
  severity: 'Critical',
  priority: 'High',
  status: 'Open',
  projectId: 1,
  reportedById: 1,
  dateReported: new Date('2023-06-19'),
  stepsToReproduce: 'Steps',
  expectedResult: 'Expected',
  actualResult: 'Actual',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBugWithInvalidDate: Bug = {
  id: 2,
  bugId: 'BUG-002',
  title: 'Test Bug 2',
  description: 'Test description',
  severity: 'Major',
  priority: 'Medium',
  status: 'Open',
  projectId: 1,
  reportedById: 1,
  dateReported: undefined as any,
  stepsToReproduce: 'Steps',
  expectedResult: 'Expected',
  actualResult: 'Actual',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BugTable Date Formatting', () => {
  it('should format valid dates correctly', () => {
    render(
      <BugTable
        bugs={[mockBugWithValidDate]}
        onEdit={() => {}}
        onDelete={() => {}}
        onView={() => {}}
      />
    );

    expect(screen.getByText('Jun 19, 2023')).toBeInTheDocument();
  });

  it('should handle invalid dates gracefully', () => {
    render(
      <BugTable
        bugs={[mockBugWithInvalidDate]}
        onEdit={() => {}}
        onDelete={() => {}}
        onView={() => {}}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should handle mixed valid and invalid dates', () => {
    render(
      <BugTable
        bugs={[mockBugWithValidDate, mockBugWithInvalidDate]}
        onEdit={() => {}}
        onDelete={() => {}}
        onView={() => {}}
      />
    );

    expect(screen.getByText('Jun 19, 2023')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
