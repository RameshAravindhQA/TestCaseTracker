
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ConsolidatedReports from '../../../pages/reports/consolidated';

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
    priority: 'Low',
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

describe('Consolidated Reports Status Update Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default API responses
    mockApiRequest.mockImplementation((method: string, url: string, data?: any) => {
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

  it('should immediately update status without pending state', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Test')).toBeInTheDocument();
    });

    // Find the status dropdown
    const statusDropdown = screen.getAllByRole('combobox')[2]; // Assuming status is the 3rd dropdown
    fireEvent.click(statusDropdown);
    
    await waitFor(() => {
      const passOption = screen.getByText('Pass');
      fireEvent.click(passOption);
    });

    // Should immediately call API
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        'PATCH',
        '/api/test-cases/1',
        { status: 'Pass' }
      );
    });

    // Should show success toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Test Case status updated to Pass',
      });
    });
  });

  it('should apply correct gradient colors for status badges', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Test')).toBeInTheDocument();
    });

    // Check if gradient classes are applied
    const statusElements = document.querySelectorAll('[class*="bg-gradient-to-r"]');
    expect(statusElements.length).toBeGreaterThan(0);
    
    // Check for specific gradient patterns
    const hasGradientColors = Array.from(statusElements).some(el => 
      el.className.includes('from-emerald-500') || 
      el.className.includes('from-red-500') ||
      el.className.includes('from-orange-500') ||
      el.className.includes('from-slate-500')
    );
    expect(hasGradientColors).toBe(true);
  });

  it('should apply correct priority colors including Low priority', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Test')).toBeInTheDocument();
    });

    // Check for Low priority gradient
    const priorityElements = document.querySelectorAll('[class*="from-lime-500"]');
    expect(priorityElements.length).toBeGreaterThan(0);
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
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Test')).toBeInTheDocument();
    });

    const statusDropdown = screen.getAllByRole('combobox')[2];
    fireEvent.click(statusDropdown);
    
    await waitFor(() => {
      const passOption = screen.getByText('Pass');
      fireEvent.click(passOption);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: expect.stringContaining('Failed to update status'),
        variant: 'destructive',
      });
    });
  });

  it('should change background color when status is selected', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Test')).toBeInTheDocument();
    });

    // Find status dropdown and check initial color
    const statusTrigger = document.querySelector('[class*="from-slate-500"]'); // Not Executed color
    expect(statusTrigger).toBeInTheDocument();

    // Change status
    const statusDropdown = screen.getAllByRole('combobox')[2];
    fireEvent.click(statusDropdown);
    
    await waitFor(() => {
      const passOption = screen.getByText('Pass');
      fireEvent.click(passOption);
    });

    // After status change, should have green gradient
    await waitFor(() => {
      const updatedTrigger = document.querySelector('[class*="from-emerald-500"]');
      expect(updatedTrigger).toBeInTheDocument();
    });
  });
});
