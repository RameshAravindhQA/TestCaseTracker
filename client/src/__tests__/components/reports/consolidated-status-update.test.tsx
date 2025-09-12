
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsolidatedReports } from '../../../components/reports/consolidated-reports';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the API request function
const mockApiRequest = vi.fn();
vi.mock('../../../lib/queryClient', () => ({
  apiRequest: mockApiRequest,
  queryClient: new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/reports/consolidated', vi.fn()],
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockTestCases = [
  {
    id: 1,
    title: 'Login Test',
    status: 'Not Executed',
    priority: 'High',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Dashboard Test',
    status: 'Pass',
    priority: 'Medium',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockBugs = [
  {
    id: 1,
    title: 'Login Bug',
    status: 'Open',
    priority: 'Critical',
    severity: 'High',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockProjects = [
  { id: 1, name: 'Test Project' },
];

const mockModules = [
  { id: 1, name: 'Authentication' },
];

const mockUsers = [
  { id: 1, name: 'Test User' },
];

describe('ConsolidatedReports Status Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default API responses
    mockApiRequest.mockImplementation((method: string, url: string) => {
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProjects),
        });
      }
      if (url.includes('/modules')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });
      }
      if (url === '/api/users') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        });
      }
      if (url.includes('/test-cases')) {
        if (method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTestCases),
        });
      }
      if (url.includes('/bugs')) {
        if (method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBugs),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  it('should successfully update test case status', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Test')).toBeInTheDocument();
    });

    // Find and click the status dropdown for the test case
    const statusDropdowns = screen.getAllByDisplayValue('Not Executed');
    const testCaseDropdown = statusDropdowns[0];
    
    fireEvent.click(testCaseDropdown);
    
    await waitFor(() => {
      const passOption = screen.getByText('Pass');
      fireEvent.click(passOption);
    });

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        'PATCH',
        '/api/test-cases/1',
        { status: 'Pass' }
      );
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Status updated',
        description: 'Test case status updated to Pass',
      });
    });
  });

  it('should successfully update bug status', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Bug')).toBeInTheDocument();
    });

    // Find and click the status dropdown for the bug
    const statusDropdowns = screen.getAllByDisplayValue('Open');
    const bugDropdown = statusDropdowns[0];
    
    fireEvent.click(bugDropdown);
    
    await waitFor(() => {
      const resolvedOption = screen.getByText('Resolved');
      fireEvent.click(resolvedOption);
    });

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        'PATCH',
        '/api/bugs/1',
        { status: 'Resolved' }
      );
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Status updated',
        description: 'Bug status updated to Resolved',
      });
    });
  });

  it('should handle status update errors gracefully', async () => {
    // Mock API to return error
    mockApiRequest.mockImplementation((method: string, url: string) => {
      if (method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        });
      }
      // Return normal responses for other calls
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProjects),
        });
      }
      if (url.includes('/modules')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });
      }
      if (url === '/api/users') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        });
      }
      if (url.includes('/test-cases')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTestCases),
        });
      }
      if (url.includes('/bugs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBugs),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Test')).toBeInTheDocument();
    });

    const statusDropdowns = screen.getAllByDisplayValue('Not Executed');
    const testCaseDropdown = statusDropdowns[0];
    
    fireEvent.click(testCaseDropdown);
    
    await waitFor(() => {
      const passOption = screen.getByText('Pass');
      fireEvent.click(passOption);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Update failed',
        description: expect.stringContaining('Failed to update test case'),
        variant: 'destructive',
      });
    });
  });

  it('should display correct metrics after status updates', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total items (2 test cases + 1 bug)
    });

    // Check pass rate calculation
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument(); // 1 passed out of 2 test cases
    });

    // Check open bugs count
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 open bug
    });
  });
});
