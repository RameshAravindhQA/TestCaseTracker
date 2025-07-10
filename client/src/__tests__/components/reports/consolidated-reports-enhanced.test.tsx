
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

const mockProjects = [
  {
    id: 1,
    name: 'Test Project',
    description: 'Test project description',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockModules = [
  {
    id: 1,
    moduleId: 'MOD-01',
    name: 'Authentication',
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
  }
];

const mockTestCases = [
  {
    id: 1,
    moduleId: 1,
    feature: 'Login Functionality',
    priority: 'High',
    status: 'Pass',
    assignedTo: 1,
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Test login with valid credentials'
  },
  {
    id: 2,
    moduleId: 1,
    feature: 'Password Reset',
    priority: 'Medium',
    status: 'Fail',
    assignedTo: 1,
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Test password reset functionality'
  }
];

const mockBugs = [
  {
    id: 1,
    moduleId: 1,
    title: 'Login page crash',
    priority: 'Critical',
    status: 'Open',
    severity: 'Critical',
    assignedTo: 1,
    reportedById: 1,
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Login page crashes on submit'
  }
];

describe('ConsolidatedReports Enhanced', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();

    // Setup API mock responses
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
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render enhanced gradient cards with proper styling', async () => {
    renderWithProviders(<ConsolidatedReports projectId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Consolidated Reports - Test Project')).toBeInTheDocument();
    });

    // Check for gradient card elements
    const totalItemsCard = screen.getByText('Total Items').closest('div');
    expect(totalItemsCard).toHaveClass('bg-gradient-to-br');
    expect(totalItemsCard).toHaveClass('from-indigo-500');
    expect(totalItemsCard).toHaveClass('via-blue-600');
    expect(totalItemsCard).toHaveClass('to-cyan-500');

    const passRateCard = screen.getByText('Test Pass Rate').closest('div');
    expect(passRateCard).toHaveClass('bg-gradient-to-br');
    expect(passRateCard).toHaveClass('from-emerald-500');
    expect(passRateCard).toHaveClass('via-green-600');
    expect(passRateCard).toHaveClass('to-teal-500');
  });

  it('should display correct statistics', async () => {
    renderWithProviders(<ConsolidatedReports projectId={1} />);

    await waitFor(() => {
      // Total items (2 test cases + 1 bug = 3)
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Pass rate (1 pass out of 2 test cases = 50%)
      expect(screen.getByText('50%')).toBeInTheDocument();
      
      // Open bugs (1)
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should handle loading states properly', () => {
    // Mock loading state
    mockApiRequest.mockImplementation(() => new Promise(() => {}));
    
    renderWithProviders(<ConsolidatedReports projectId={1} />);

    // Should show skeleton loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should display data in table format', async () => {
    renderWithProviders(<ConsolidatedReports projectId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Login Functionality')).toBeInTheDocument();
      expect(screen.getByText('Login page crash')).toBeInTheDocument();
      expect(screen.getByText('Authentication')).toBeInTheDocument();
    });

    // Check for status badges with proper styling
    const passBadge = screen.getByText('Pass').closest('button');
    expect(passBadge).toHaveClass('bg-gradient-to-r');
    
    const openBadge = screen.getByText('Open').closest('button');
    expect(openBadge).toHaveClass('bg-gradient-to-r');
  });

  it('should show enhanced empty state when no data', async () => {
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
        json: () => Promise.resolve(mockModules)
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
  });

  it('should handle hover effects on gradient cards', async () => {
    renderWithProviders(<ConsolidatedReports projectId={1} />);

    await waitFor(() => {
      const cards = document.querySelectorAll('.group');
      expect(cards.length).toBeGreaterThan(0);
      
      // Check for hover classes
      cards.forEach(card => {
        expect(card).toHaveClass('hover:scale-105');
        expect(card).toHaveClass('transition-all');
        expect(card).toHaveClass('duration-500');
      });
    });
  });
});
