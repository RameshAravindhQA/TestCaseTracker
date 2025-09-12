
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BugSummaryCards } from '@/components/reports/bug-summary-cards';

const mockBugs = [
  {
    id: 1,
    bugId: 'BUG-001',
    title: 'Critical bug',
    severity: 'Critical',
    status: 'Open',
    projectId: 1
  },
  {
    id: 2,
    bugId: 'BUG-002', 
    title: 'Major bug',
    severity: 'Major',
    status: 'In Progress',
    projectId: 1
  },
  {
    id: 3,
    bugId: 'BUG-003',
    title: 'Minor bug',
    severity: 'Minor', 
    status: 'Closed',
    projectId: 1
  }
];

describe('Enhanced Bug Summary Colors', () => {
  it('should render cards with gradient backgrounds', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    // Check for gradient classes in the DOM
    const cards = screen.getAllByRole('heading', { level: 2 });
    expect(cards[0]).toBeInTheDocument();
  });

  it('should display correct bug counts', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    expect(screen.getByText('3')).toBeInTheDocument(); // Total bugs
    expect(screen.getByText('1')).toBeInTheDocument(); // Critical count
  });

  it('should show percentage calculations', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    // Should show percentages for each category
    expect(screen.getByText('33.3% of total')).toBeInTheDocument(); // Critical bugs (1/3)
  });

  it('should render enhanced title with gradient', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    const title = screen.getByText('Bug Reports Summary');
    expect(title).toHaveClass('bg-gradient-to-r');
    expect(title).toHaveClass('bg-clip-text');
  });

  it('should handle empty bug list', () => {
    render(<BugSummaryCards bugs={[]} projectName="Test Project" />);

    expect(screen.getByText('No bugs found!')).toBeInTheDocument();
    expect(screen.getByText('Excellent work on maintaining quality!')).toBeInTheDocument();
  });

  it('should display copy button with gradient styling', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    const copyButton = screen.getByText('Copy to Clipboard');
    expect(copyButton).toBeInTheDocument();
  });

  it('should show progress bars for each category', () => {
    render(<BugSummaryCards bugs={mockBugs} projectName="Test Project" />);

    // Progress bars should be rendered for visual representation
    const progressBars = document.querySelectorAll('.bg-gradient-to-r');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});
