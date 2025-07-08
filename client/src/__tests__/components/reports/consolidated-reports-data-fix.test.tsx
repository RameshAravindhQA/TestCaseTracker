
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsolidatedReports } from '../../../components/reports/consolidated-reports';

// Mock the API client
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}));

const mockApiRequest = vi.mocked(await import('@/lib/queryClient')).apiRequest;

// Mock React Router
vi.mock('wouter', () => ({
  useLocation: () => ['/reports/consolidated', vi.fn()],
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockProjects = [
  {
    id: 1,
    name: 'Test Project Alpha',
    description: 'Main testing project',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
    createdById: 1
  },
  {
    id: 2, 
    name: 'Test Project Beta',
    description: 'Secondary testing project',
    status: 'Active',
    createdAt: '2024-01-02T00:00:00Z',
    createdById: 1
  }
];

const mockModules = [
  {
    id: 1,
    moduleId: 'MOD-01',
    name: 'Authentication Module',
    projectId: 1,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    moduleId: 'MOD-02', 
    name: 'User Management Module',
    projectId: 1,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@test.com',
    role: 'Tester'
  },
  {
    id: 2,
    name: 'Jane Smith', 
    email: 'jane@test.com',
    role: 'Lead Tester'
  }
];

const mockTestCases = [
  {
    id: 1,
    testCaseId: 'TC-001',
    moduleId: 1,
    feature: 'User Login Functionality',
    priority: 'High',
    status: 'Pass',
    assignedTo: 1,
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Test successful user login',
    projectId: 1
  },
  {
    id: 2,
    testCaseId: 'TC-002',
    moduleId: 1,
    feature: 'Password Reset',
    priority: 'Medium',
    status: 'Fail',
    assignedTo: 2,
    createdAt: '2024-01-02T00:00:00Z',
    description: 'Test password reset flow',
    projectId: 1
  },
  {
    id: 3,
    testCaseId: 'TC-003',
    moduleId: 2,
    feature: 'User Profile Update',
    priority: 'Low',
    status: 'Not Executed',
    assignedTo: 1,
    createdAt: '2024-01-03T00:00:00Z',
    description: 'Test user profile updates',
    projectId: 1
  }
];

const mockBugs = [
  {
    id: 1,
    bugId: 'BUG-001',
    moduleId: 1,
    title: 'Login button not responsive',
    priority: 'Critical',
    status: 'Open',
    severity: 'Critical',
    assignedTo: 1,
    reportedById: 2,
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Login button does not respond to clicks',
    projectId: 1
  },
  {
    id: 2,
    bugId: 'BUG-002',
    moduleId: 2,
    title: 'Profile image upload fails',
    priority: 'High',
    status: 'In Progress',
    severity: 'Major',
    assignedTo: 2,
    reportedById: 1,
    createdAt: '2024-01-02T00:00:00Z',
    description: 'Cannot upload profile images larger than 1MB',
    projectId: 1
  },
  {
    id: 3,
    bugId: 'BUG-003',
    moduleId: 1,
    title: 'Password validation too strict',
    priority: 'Medium',
    status: 'Resolved',
    severity: 'Minor',
    assignedTo: 1,
    reportedById: 2,
    createdAt: '2024-01-03T00:00:00Z',
    description: 'Password requirements are too restrictive',
    projectId: 1
  }
];

describe('ConsolidatedReports Data Loading Fix', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  const setupSuccessfulApiMocks = () => {
    mockApiRequest
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects[0])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModules)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTestCases)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBugs)
      });
  };

  it('should load and display real-time data correctly', async () => {
    setupSuccessfulApiMocks();

    renderWithProviders(<ConsolidatedReports projectId={1} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Consolidated Reports - Test Project Alpha')).toBeInTheDocument();
    });

    // Check stats cards display correct data
    await waitFor(() => {
      // Total items (3 test cases + 3 bugs = 6)
      expect(screen.getByText('6')).toBeInTheDocument();
      
      // Test pass rate (1 pass out of 3 test cases = 33%)
      expect(screen.getByText('33%')).toBeInTheDocument();
      
      // Open bugs (1 bug with Open status)
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Check that test cases are displayed
    await waitFor(() => {
      expect(screen.getByText('User Login Functionality')).toBeInTheDocument();
      expect(screen.getByText('Password Reset')).toBeInTheDocument();
      expect(screen.getByText('User Profile Update')).toBeInTheDocument();
    });

    // Check that bugs are displayed  
    await waitFor(() => {
      expect(screen.getByText('Login button not responsive')).toBeInTheDocument();
      expect(screen.getByText('Profile image upload fails')).toBeInTheDocument();
      expect(screen.getByText('Password validation too strict')).toBeInTheDocument();
    });

    // Check modules are displayed correctly
    await waitFor(() => {
      expect(screen.getByText('Authentication Module')).toBeInTheDocument();
      expect(screen.getByText('User Management Module')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API failure for test cases
    mockApiRequest
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects[0])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModules)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      })
      .mockRejectedValueOnce(new Error('Failed to fetch test cases'))
      .mockRejectedValueOnce(new Error('Failed to fetch bugs'));

    renderWithProviders(<ConsolidatedReports projectId={1} />);

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText('Test Cases: Failed to fetch test cases')).toBeInTheDocument();
      expect(screen.getByText('Bugs: Failed to fetch bugs')).toBeInTheDocument();
    });
  });

  it('should handle empty data sets correctly', async () => {
    // Mock empty responses
    mockApiRequest
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects[0])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

    renderWithProviders(<ConsolidatedReports projectId={1} />);

    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('No test cases or bugs have been created for this project yet.')).toBeInTheDocument();
    });

    // Check debug info shows correct empty counts
    await waitFor(() => {
      expect(screen.getByText('• Test Cases: 0')).toBeInTheDocument();
      expect(screen.getByText('• Bugs: 0')).toBeInTheDocument();
      expect(screen.getByText('• Combined Data: 0')).toBeInTheDocument();
    });
  });

  it('should calculate metrics correctly', async () => {
    setupSuccessfulApiMocks();

    renderWithProviders(<ConsolidatedReports projectId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Consolidated Reports - Test Project Alpha')).toBeInTheDocument();
    });

    // Wait for metrics calculation
    await waitFor(() => {
      // Total items: 3 test cases + 3 bugs = 6
      const totalItems = screen.getByText('6');
      expect(totalItems).toBeInTheDocument();

      // Pass rate: 1 pass out of 3 test cases = 33%
      const passRate = screen.getByText('33%');
      expect(passRate).toBeInTheDocument();

      // Open bugs: 1 bug with "Open" status
      const openBugs = screen.getByText('1');
      expect(openBugs).toBeInTheDocument();
    });
  });

  it('should handle project ID resolution correctly', async () => {
    setupSuccessfulApiMocks();

    renderWithProviders(<ConsolidatedReports />); // No project ID provided

    // Should use first project from the list
    await waitFor(() => {
      expect(screen.getByText('Consolidated Reports - Test Project Alpha')).toBeInTheDocument();
    });
  });

  it('should show loading states appropriately', async () => {
    // Mock a delayed response
    mockApiRequest.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<ConsolidatedReports projectId={1} />);

    // Should show loading skeleton
    expect(screen.getByText('Loading consolidated reports...')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should filter data correctly', async () => {
    setupSuccessfulApiMocks();

    renderWithProviders(<ConsolidatedReports projectId={1} />);

    await waitFor(() => {
      expect(screen.getByText('User Login Functionality')).toBeInTheDocument();
    });

    // All items should be visible initially
    expect(screen.getByText('User Login Functionality')).toBeInTheDocument();
    expect(screen.getByText('Login button not responsive')).toBeInTheDocument();

    // Test that status badges are rendered with proper styling
    const passBadge = screen.getByDisplayValue('Pass');
    expect(passBadge).toBeInTheDocument();
  });
});
