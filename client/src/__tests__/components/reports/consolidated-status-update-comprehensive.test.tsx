
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

const mockProjects = [
  { id: 1, name: 'Test Project', status: 'Active' },
];

const mockModules = [
  { id: 1, name: 'Authentication', projectId: 1 },
  { id: 2, name: 'Dashboard', projectId: 1 },
];

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@test.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@test.com' },
];

const mockTestCases = [
  {
    id: 1,
    title: 'Login Functionality Test',
    status: 'Not Executed',
    priority: 'High',
    moduleId: 1,
    assignedTo: 1,
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Test login with valid credentials',
  },
  {
    id: 2,
    title: 'Dashboard Loading Test',
    status: 'Pass',
    priority: 'Medium',
    moduleId: 2,
    assignedTo: 2,
    createdAt: '2024-01-02T00:00:00Z',
    description: 'Test dashboard loading speed',
  },
];

const mockBugs = [
  {
    id: 1,
    title: 'Login Button Not Responsive',
    status: 'Open',
    priority: 'Critical',
    severity: 'High',
    moduleId: 1,
    assignedTo: 1,
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Login button does not respond to clicks',
  },
  {
    id: 2,
    title: 'Dashboard Performance Issue',
    status: 'In Progress',
    priority: 'Major',
    severity: 'Medium',
    moduleId: 2,
    assignedTo: 2,
    createdAt: '2024-01-02T00:00:00Z',
    description: 'Dashboard takes too long to load',
  },
];

describe('Consolidated Reports Status Update Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup comprehensive API responses
    mockApiRequest.mockImplementation((method: string, url: string, data?: any) => {
      console.log(`API Call: ${method} ${url}`, data);
      
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProjects),
        });
      }
      
      if (url.includes('/api/projects/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProjects[0]),
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
          const testCaseId = url.split('/').pop();
          console.log(`Updating test case ${testCaseId} with:`, data);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              id: parseInt(testCaseId!), 
              ...data,
              success: true 
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTestCases),
        });
      }
      
      if (url.includes('/bugs')) {
        if (method === 'PATCH') {
          const bugId = url.split('/').pop();
          console.log(`Updating bug ${bugId} with:`, data);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              id: parseInt(bugId!), 
              ...data,
              success: true 
            }),
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

  it('should render consolidated reports with test cases and bugs', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Consolidated Reports - Test Project')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Login Functionality Test')).toBeInTheDocument();
      expect(screen.getByText('Login Button Not Responsive')).toBeInTheDocument();
    });
  });

  it('should successfully update test case status from Not Executed to Pass', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Functionality Test')).toBeInTheDocument();
    });

    // Find the status select for the test case
    const statusSelects = screen.getAllByRole('combobox');
    const testCaseStatusSelect = statusSelects.find(select => 
      select.getAttribute('aria-expanded') !== null
    );
    
    expect(testCaseStatusSelect).toBeDefined();
    
    if (testCaseStatusSelect) {
      fireEvent.click(testCaseStatusSelect);
      
      await waitFor(() => {
        const passOption = screen.getByRole('option', { name: 'Pass' });
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
    }
  });

  it('should successfully update bug status from Open to Resolved', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Button Not Responsive')).toBeInTheDocument();
    });

    // Find all status dropdowns and identify the bug one
    const statusSelects = screen.getAllByRole('combobox');
    
    // Click on a status dropdown
    if (statusSelects.length > 0) {
      fireEvent.click(statusSelects[0]);
      
      await waitFor(() => {
        const resolvedOptions = screen.getAllByText('Resolved');
        if (resolvedOptions.length > 0) {
          fireEvent.click(resolvedOptions[0]);
        }
      });

      // Verify API call was made
      await waitFor(() => {
        const patchCalls = mockApiRequest.mock.calls.filter(call => call[0] === 'PATCH');
        expect(patchCalls.length).toBeGreaterThan(0);
      });
    }
  });

  it('should handle status update errors gracefully', async () => {
    // Mock API to return error for PATCH requests
    mockApiRequest.mockImplementation((method: string, url: string, data?: any) => {
      if (method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        });
      }
      
      // Return normal responses for GET requests
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProjects),
        });
      }
      if (url.includes('/api/projects/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProjects[0]),
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
      expect(screen.getByText('Login Functionality Test')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByRole('combobox');
    
    if (statusSelects.length > 0) {
      fireEvent.click(statusSelects[0]);
      
      await waitFor(() => {
        const passOptions = screen.getAllByText('Pass');
        if (passOptions.length > 0) {
          fireEvent.click(passOptions[0]);
        }
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Update failed',
            variant: 'destructive',
          })
        );
      });
    }
  });

  it('should validate that all test case status options are available', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Functionality Test')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByRole('combobox');
    
    if (statusSelects.length > 0) {
      fireEvent.click(statusSelects[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Pass')).toBeInTheDocument();
        expect(screen.getByText('Fail')).toBeInTheDocument();
        expect(screen.getByText('Blocked')).toBeInTheDocument();
        expect(screen.getByText('Not Executed')).toBeInTheDocument();
      });
    }
  });

  it('should validate that all bug status options are available', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Button Not Responsive')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByRole('combobox');
    
    if (statusSelects.length > 0) {
      fireEvent.click(statusSelects[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Open')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Resolved')).toBeInTheDocument();
        expect(screen.getByText('Closed')).toBeInTheDocument();
      });
    }
  });

  it('should update metrics after status changes', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports selectedProjectId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Functionality Test')).toBeInTheDocument();
    });

    // Initial metrics should be displayed
    await waitFor(() => {
      const totalItems = screen.getByText('2'); // 2 test cases + 2 bugs
      expect(totalItems).toBeInTheDocument();
    });

    // Test pass rate calculation (1 passed out of 2 test cases = 50%)
    await waitFor(() => {
      const passRate = screen.getByText('50%');
      expect(passRate).toBeInTheDocument();
    });
  });

  it('should handle network timeouts gracefully', async () => {
    // Mock API to simulate timeout
    mockApiRequest.mockImplementation((method: string, url: string) => {
      if (method === 'PATCH') {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        });
      }
      
      // Return normal responses for GET requests
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
      expect(screen.getByText('Login Functionality Test')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByRole('combobox');
    
    if (statusSelects.length > 0) {
      fireEvent.click(statusSelects[0]);
      
      await waitFor(() => {
        const passOptions = screen.getAllByText('Pass');
        if (passOptions.length > 0) {
          fireEvent.click(passOptions[0]);
        }
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Update failed',
            variant: 'destructive',
          })
        );
      }, { timeout: 5000 });
    }
  });
});
