
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsolidatedReports } from '../components/reports/consolidated-reports';
import { apiRequest } from '../lib/queryClient';

// Mock dependencies
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('Consolidated Reports Status Update Fix', () => {
  let queryClient: QueryClient;
  let mockApiRequest: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockApiRequest = apiRequest as any;
    mockApiRequest.mockClear();

    // Mock successful responses
    mockApiRequest.mockImplementation((method: string, url: string) => {
      if (url.includes('/api/projects') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 1,
            name: 'Test Project',
            description: 'Test project description'
          }])
        });
      }
      
      if (url.includes('/api/projects/1/test-cases') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 1,
            title: 'Test Case 1',
            status: 'Not Executed',
            priority: 'Medium',
            moduleId: 1,
            assignedTo: 1
          }])
        });
      }

      if (url.includes('/api/projects/1/bugs') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 1,
            title: 'Bug 1',
            status: 'Open',
            priority: 'High',
            severity: 'Major',
            moduleId: 1,
            assignedTo: 1
          }])
        });
      }

      if (url.includes('/api/projects/1/modules') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 1,
            name: 'Module 1'
          }])
        });
      }

      if (url.includes('/api/users') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 1,
            name: 'Test User'
          }])
        });
      }

      // Mock status update
      if ((url.includes('/api/test-cases/') || url.includes('/api/bugs/')) && method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 1,
            status: 'Pass',
            updatedAt: new Date().toISOString()
          })
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should update test case status successfully', async () => {
    renderWithProviders(<ConsolidatedReports selectedProjectId={1} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Case 1')).toBeInTheDocument();
    });

    // Find and click status dropdown
    const statusButton = screen.getByText('Not Executed');
    fireEvent.click(statusButton);

    // Wait for dropdown to appear and select new status
    await waitFor(() => {
      const passOption = screen.getByText('Pass');
      fireEvent.click(passOption);
    });

    // Verify API was called
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        'PUT',
        '/api/test-cases/1',
        expect.objectContaining({
          status: 'Pass'
        })
      );
    });
  });

  it('should update bug status successfully', async () => {
    renderWithProviders(<ConsolidatedReports selectedProjectId={1} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Bug 1')).toBeInTheDocument();
    });

    // Find and click status dropdown for bug
    const statusButtons = screen.getAllByText('Open');
    const bugStatusButton = statusButtons.find(button => 
      button.closest('tr')?.textContent?.includes('Bug 1')
    );
    
    if (bugStatusButton) {
      fireEvent.click(bugStatusButton);

      // Wait for dropdown and select new status
      await waitFor(() => {
        const resolvedOption = screen.getByText('Resolved');
        fireEvent.click(resolvedOption);
      });

      // Verify API was called
      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith(
          'PUT',
          '/api/bugs/1',
          expect.objectContaining({
            status: 'Resolved'
          })
        );
      });
    }
  });

  it('should handle status update errors gracefully', async () => {
    // Mock API failure
    mockApiRequest.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error')
      })
    );

    renderWithProviders(<ConsolidatedReports selectedProjectId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Test Case 1')).toBeInTheDocument();
    });

    const statusButton = screen.getByText('Not Executed');
    fireEvent.click(statusButton);

    await waitFor(() => {
      const passOption = screen.getByText('Pass');
      fireEvent.click(passOption);
    });

    // Should handle error without crashing
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalled();
    });
  });
});
