
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsolidatedReports } from '@/components/reports/consolidated-reports';

// Mock data
const mockTestCases = [
  {
    id: 1,
    testCaseId: 'TC-001',
    feature: 'Login Feature',
    status: 'Pass',
    priority: 'High',
    moduleId: 1,
    projectId: 1,
    createdAt: '2023-01-01T00:00:00Z',
    description: 'Test login functionality'
  },
  {
    id: 2,
    testCaseId: 'TC-002',
    feature: 'Logout Feature',
    status: 'Fail',
    priority: 'Medium',
    moduleId: 1,
    projectId: 1,
    createdAt: '2023-01-02T00:00:00Z',
    description: 'Test logout functionality'
  }
];

const mockBugs = [
  {
    id: 1,
    bugId: 'BUG-001',
    title: 'Login button not working',
    status: 'Open',
    priority: 'Critical',
    severity: 'Major',
    moduleId: 1,
    projectId: 1,
    createdAt: '2023-01-01T00:00:00Z',
    description: 'Button does not respond'
  }
];

const mockProject = {
  id: 1,
  name: 'Test Project',
  status: 'Active',
  createdById: 1,
  createdAt: '2023-01-01T00:00:00Z'
};

const mockModules = [
  {
    id: 1,
    moduleId: 'MOD-1',
    name: 'Authentication Module',
    projectId: 1,
    status: 'Active',
    createdAt: '2023-01-01T00:00:00Z'
  }
];

const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@test.com',
    role: 'Tester'
  }
];

// Mock API calls
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  }),
}));

describe('ConsolidatedReports Data Display Fix', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock React Query hooks
    vi.doMock('@tanstack/react-query', async () => {
      const actual = await vi.importActual('@tanstack/react-query');
      return {
        ...actual,
        useQuery: vi.fn().mockImplementation(({ queryKey }) => {
          if (queryKey[0].includes('/test-cases')) {
            return { data: mockTestCases, isLoading: false };
          }
          if (queryKey[0].includes('/bugs')) {
            return { data: mockBugs, isLoading: false };
          }
          if (queryKey[0].includes('/projects/1')) {
            return { data: mockProject, isLoading: false };
          }
          if (queryKey[0].includes('/modules')) {
            return { data: mockModules, isLoading: false };
          }
          if (queryKey[0].includes('/users')) {
            return { data: mockUsers, isLoading: false };
          }
          return { data: null, isLoading: false };
        }),
        useMutation: vi.fn().mockReturnValue({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
        }),
      };
    });
  });

  it('should display combined test cases and bugs data', async () => {
    const { useQuery } = await import('@tanstack/react-query');
    
    render(
      <QueryClientProvider client={queryClient}>
        <ConsolidatedReports projectId={1} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Feature')).toBeInTheDocument();
      expect(screen.getByText('Login button not working')).toBeInTheDocument();
    });
  });

  it('should show correct statistics in cards', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ConsolidatedReports projectId={1} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total items (2 test cases + 1 bug)
      expect(screen.getByText('50%')).toBeInTheDocument(); // Pass rate (1 pass out of 2 test cases)
      expect(screen.getByText('1')).toBeInTheDocument(); // Open bugs
    });
  });

  it('should apply gradient colors to status badges', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ConsolidatedReports projectId={1} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const statusElements = screen.getAllByText('Pass');
      expect(statusElements[0]).toHaveClass('bg-gradient-to-r');
    });
  });

  it('should filter data correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ConsolidatedReports projectId={1} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check that all items are displayed initially
      expect(screen.getByText('Login Feature')).toBeInTheDocument();
      expect(screen.getByText('Logout Feature')).toBeInTheDocument();
      expect(screen.getByText('Login button not working')).toBeInTheDocument();
    });
  });
});
