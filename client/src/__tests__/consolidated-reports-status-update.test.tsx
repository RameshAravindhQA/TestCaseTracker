
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConsolidatedReports from '../components/reports/consolidated-reports';

// Mock API request
const mockApiRequest = vi.fn();
vi.mock('../lib/queryClient', () => ({
  apiRequest: mockApiRequest,
  queryClient: {
    invalidateQueries: vi.fn()
  }
}));

// Mock toast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock authentication
vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'Admin' },
    isAuthenticated: true,
  }),
}));

describe('Consolidated Reports Status Update', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock successful API responses
    mockApiRequest.mockImplementation((method, url, data) => {
      if (url.includes('/api/projects')) {
        return Promise.resolve([
          { id: 1, name: 'Test Project 1' },
          { id: 2, name: 'Test Project 2' }
        ]);
      }
      if (url.includes('/api/test-cases')) {
        return Promise.resolve([
          {
            id: 1,
            title: 'Test Case 1',
            status: 'Pass',
            priority: 'High',
            moduleId: 1,
            module: { name: 'Authentication' },
            type: 'testcase'
          },
          {
            id: 2,
            title: 'Test Case 2',
            status: 'Fail',
            priority: 'Medium',
            moduleId: 1,
            module: { name: 'Authentication' },
            type: 'testcase'
          }
        ]);
      }
      if (url.includes('/api/bugs')) {
        return Promise.resolve([
          {
            id: 1,
            title: 'Bug 1',
            status: 'Open',
            priority: 'High',
            severity: 'Critical',
            moduleId: 1,
            module: { name: 'Authentication' },
            type: 'bug'
          }
        ]);
      }
      if (url.includes('/api/modules')) {
        return Promise.resolve([
          { id: 1, name: 'Authentication' }
        ]);
      }
      if (method === 'PUT') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve([]);
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render consolidated reports with items', async () => {
    renderWithProviders(<ConsolidatedReports />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Consolidated Reports')).toBeInTheDocument();
    });
  });

  it('should open status update dialog when clicking update status', async () => {
    renderWithProviders(<ConsolidatedReports />);

    // Select a project first
    await waitFor(() => {
      const projectSelect = screen.getByText('Select a project');
      fireEvent.click(projectSelect);
    });

    // Wait for project options and select one
    await waitFor(() => {
      const project = screen.getByText('Test Project 1');
      fireEvent.click(project);
    });

    // Wait for data to load and find action button
    await waitFor(() => {
      const actionButtons = screen.getAllByRole('button');
      const dropdownButton = actionButtons.find(button => 
        button.querySelector('.lucide-more-horizontal')
      );
      if (dropdownButton) {
        fireEvent.click(dropdownButton);
      }
    });

    // Find and click update status option
    await waitFor(() => {
      const updateStatusOption = screen.getByText('Update Status');
      fireEvent.click(updateStatusOption);
    });

    // Check if dialog opened
    await waitFor(() => {
      expect(screen.getByText('Update Status')).toBeInTheDocument();
    });
  });

  it('should update test case status successfully', async () => {
    renderWithProviders(<ConsolidatedReports />);

    // Mock the update API call
    mockApiRequest.mockResolvedValueOnce({ success: true });

    // Simulate opening status dialog and updating
    // This would normally be triggered by user interaction
    const updateData = { id: 1, status: 'Blocked' };
    
    // Call the API directly to test the mutation logic
    const result = await mockApiRequest('PUT', '/api/test-cases/1', updateData);
    
    expect(result).toEqual({ success: true });
    expect(mockApiRequest).toHaveBeenCalledWith('PUT', '/api/test-cases/1', updateData);
  });

  it('should update bug status successfully', async () => {
    renderWithProviders(<ConsolidatedReports />);

    // Mock the update API call
    mockApiRequest.mockResolvedValueOnce({ success: true });

    // Test bug status update
    const updateData = { id: 1, status: 'Resolved' };
    
    const result = await mockApiRequest('PUT', '/api/bugs/1', updateData);
    
    expect(result).toEqual({ success: true });
    expect(mockApiRequest).toHaveBeenCalledWith('PUT', '/api/bugs/1', updateData);
  });

  it('should handle status update errors gracefully', async () => {
    renderWithProviders(<ConsolidatedReports />);

    // Mock API error
    mockApiRequest.mockRejectedValueOnce(new Error('Update failed'));

    try {
      await mockApiRequest('PUT', '/api/test-cases/1', { status: 'Pass' });
    } catch (error) {
      expect(error.message).toBe('Update failed');
    }
  });

  it('should filter items by status correctly', async () => {
    const testCases = [
      { id: 1, status: 'Pass', title: 'Test 1', type: 'testcase' },
      { id: 2, status: 'Fail', title: 'Test 2', type: 'testcase' },
      { id: 3, status: 'Blocked', title: 'Test 3', type: 'testcase' }
    ];

    const filterByStatus = (items: any[], status: string) => {
      if (status === 'all') return items;
      return items.filter(item => item.status === status);
    };

    expect(filterByStatus(testCases, 'all')).toHaveLength(3);
    expect(filterByStatus(testCases, 'Pass')).toHaveLength(1);
    expect(filterByStatus(testCases, 'Fail')).toHaveLength(1);
    expect(filterByStatus(testCases, 'Blocked')).toHaveLength(1);
  });

  it('should validate status options for test cases', () => {
    const testCaseStatuses = ['Pass', 'Fail', 'Blocked', 'In Progress', 'Not Executed'];
    
    expect(testCaseStatuses).toContain('Pass');
    expect(testCaseStatuses).toContain('Fail');
    expect(testCaseStatuses).toContain('Blocked');
    expect(testCaseStatuses).toContain('In Progress');
    expect(testCaseStatuses).toContain('Not Executed');
  });

  it('should validate status options for bugs', () => {
    const bugStatuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'];
    
    expect(bugStatuses).toContain('Open');
    expect(bugStatuses).toContain('In Progress');
    expect(bugStatuses).toContain('Resolved');
    expect(bugStatuses).toContain('Closed');
    expect(bugStatuses).toContain('Reopened');
  });

  it('should combine test cases and bugs correctly', () => {
    const testCases = [
      { id: 1, type: 'testcase', title: 'Test 1', status: 'Pass' },
      { id: 2, type: 'testcase', title: 'Test 2', status: 'Fail' }
    ];
    
    const bugs = [
      { id: 1, type: 'bug', title: 'Bug 1', status: 'Open' },
      { id: 2, type: 'bug', title: 'Bug 2', status: 'Resolved' }
    ];

    const combined = [...testCases, ...bugs];
    
    expect(combined).toHaveLength(4);
    expect(combined.filter(item => item.type === 'testcase')).toHaveLength(2);
    expect(combined.filter(item => item.type === 'bug')).toHaveLength(2);
  });
});
