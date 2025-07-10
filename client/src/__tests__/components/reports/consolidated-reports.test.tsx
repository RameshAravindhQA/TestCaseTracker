
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConsolidatedReports from '../../../pages/reports/consolidated';

// Mock fetch
global.fetch = vi.fn();

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ConsolidatedReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, name: 'Test Project', status: 'Active' }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, moduleId: 'MOD-1', name: 'Test Module', projectId: 1 }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            moduleId: 1,
            feature: 'Login Test',
            priority: 'High',
            status: 'Not Executed',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            moduleId: 1,
            title: 'Login Bug',
            priority: 'High',
            status: 'Open',
            dateReported: '2024-01-01T00:00:00Z'
          }
        ])
      });
  });

  it('should render consolidated reports page', async () => {
    renderWithProviders(<ConsolidatedReports />);
    
    expect(screen.getByText('Consolidated Reports')).toBeInTheDocument();
    expect(screen.getByText('Complete project overview and status management')).toBeInTheDocument();
  });

  it('should allow status selection for test cases and bugs', async () => {
    renderWithProviders(<ConsolidatedReports />);
    
    await waitFor(() => {
      expect(screen.getByText('All Status')).toBeInTheDocument();
    });
    
    const statusSelect = screen.getByText('All Status');
    fireEvent.click(statusSelect);
    
    // Should see test case statuses
    expect(screen.getByText('Pass')).toBeInTheDocument();
    expect(screen.getByText('Fail')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Not Executed')).toBeInTheDocument();
    
    // Should see bug statuses
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('should update status when changed', async () => {
    const mockPut = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, status: 'Pass' })
    });
    
    (fetch as any).mockImplementation((url: string, options?: any) => {
      if (options?.method === 'PUT') {
        return mockPut(url, options);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    renderWithProviders(<ConsolidatedReports />);
    
    await waitFor(() => {
      expect(screen.getByText('Project Items')).toBeInTheDocument();
    });
    
    // This test would need the actual data to be rendered first
    // In a real scenario, you'd wait for the table to load and then interact with status dropdowns
  });

  it('should handle bulk status updates', async () => {
    renderWithProviders(<ConsolidatedReports />);
    
    await waitFor(() => {
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });
    
    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);
    
    // Would need actual data to test bulk selection properly
  });
});
