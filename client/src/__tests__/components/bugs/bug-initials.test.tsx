
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BugTable } from '@/components/bugs/bug-table';

const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    role: 'Tester'
  },
  {
    id: 2,
    name: 'Jane Smith',
    firstName: 'Jane', 
    lastName: 'Smith',
    email: 'jane@test.com',
    role: 'Developer'
  }
];

const mockBugs = [
  {
    id: 1,
    bugId: 'BUG-001',
    title: 'Login issue',
    status: 'Open',
    priority: 'High',
    severity: 'Major',
    reportedById: 1,
    dateReported: '2023-01-01T00:00:00Z',
    projectId: 1,
    tags: []
  },
  {
    id: 2,
    bugId: 'BUG-002', 
    title: 'UI glitch',
    status: 'In Progress',
    priority: 'Medium',
    severity: 'Minor',
    reportedById: 2,
    dateReported: '2023-01-02T00:00:00Z',
    projectId: 1,
    tags: []
  }
];

// Mock the users query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: mockUsers,
    isLoading: false
  })
}));

describe('Bug Reported By Initials', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnView = vi.fn();

  it('should display user initials for reported by column', () => {
    render(
      <BugTable 
        bugs={mockBugs}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // Check for initials in the DOM (they would be in div elements)
    const initialsElements = screen.getAllByText('JD');
    expect(initialsElements).toHaveLength(1);
    
    const janeInitials = screen.getAllByText('JS');
    expect(janeInitials).toHaveLength(1);
  });

  it('should show full name on hover via title attribute', () => {
    render(
      <BugTable 
        bugs={mockBugs}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const johnInitials = screen.getByTitle('John Doe');
    expect(johnInitials).toBeInTheDocument();
    expect(johnInitials).toHaveTextContent('JD');

    const janeInitials = screen.getByTitle('Jane Smith');
    expect(janeInitials).toBeInTheDocument();
    expect(janeInitials).toHaveTextContent('JS');
  });

  it('should handle users with no name gracefully', () => {
    const bugsWithUnknownUser = [
      {
        ...mockBugs[0],
        reportedById: 999 // Non-existent user
      }
    ];

    render(
      <BugTable 
        bugs={bugsWithUnknownUser}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('should apply gradient background to initials', () => {
    render(
      <BugTable 
        bugs={mockBugs}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const initialsElement = screen.getByTitle('John Doe');
    expect(initialsElement).toHaveClass('bg-gradient-to-r');
    expect(initialsElement).toHaveClass('from-blue-500');
    expect(initialsElement).toHaveClass('to-purple-600');
  });
});
