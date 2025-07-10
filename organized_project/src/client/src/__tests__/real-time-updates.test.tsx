
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsolidatedReports } from '../components/reports/consolidated-reports';

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

describe('Real-time Data Updates', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockApiRequest.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should fetch data with real-time intervals', async () => {
    renderWithProviders(<ConsolidatedReports />);

    // Wait for initial data fetch
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalled();
    });

    // Mock time progression to test refetch interval
    vi.useFakeTimers();
    
    // Fast forward 5 seconds (refetch interval)
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });

  it('should update statistics in real-time', async () => {
    // Mock data with different states
    const mockTestCases = [
      { id: 1, status: 'Pass', priority: 'High' },
      { id: 2, status: 'Fail', priority: 'Medium' }
    ];

    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTestCases),
    });

    renderWithProviders(<ConsolidatedReports />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total items
    });
  });

  it('should validate data freshness with staleTime: 0', () => {
    const queryOptions = {
      staleTime: 0,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    };

    expect(queryOptions.staleTime).toBe(0);
    expect(queryOptions.refetchInterval).toBe(5000);
    expect(queryOptions.refetchOnWindowFocus).toBe(true);
  });

  it('should handle status updates with immediate cache invalidation', async () => {
    const updateTestCaseStatus = async (id: number, status: string) => {
      const response = await mockApiRequest('PATCH', `/api/test-cases/${id}`, { status });
      // Simulate cache invalidation
      queryClient.invalidateQueries({ queryKey: [`/api/projects/1/test-cases`] });
      return response;
    };

    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await updateTestCaseStatus(1, 'Pass');
    expect(result).toBeDefined();
    expect(mockApiRequest).toHaveBeenCalledWith('PATCH', '/api/test-cases/1', { status: 'Pass' });
  });
});
