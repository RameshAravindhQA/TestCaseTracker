
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ConsolidatedReports from '../../../pages/reports/consolidated';

// Mock dependencies
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

const mockToast = vi.fn();
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/reports/consolidated', vi.fn()],
}));

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
    title: 'Critical Test',
    status: 'Not Executed',
    priority: 'Critical',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'High Priority Test',
    status: 'Pass',
    priority: 'High',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    title: 'Medium Priority Test',
    status: 'Fail',
    priority: 'Medium',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    title: 'Low Priority Test',
    status: 'Blocked',
    priority: 'Low',
    moduleId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockProjects = [{ id: 1, name: 'Test Project' }];
const mockModules = [{ id: 1, name: 'Authentication' }];

describe('Priority Colors Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
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
      if (url.includes('/test-cases')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTestCases),
        });
      }
      if (url.includes('/bugs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  it('should apply Critical priority gradient colors', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Critical Test')).toBeInTheDocument();
    });

    // Check for Critical priority gradient: red-600 via rose-700 to pink-600
    const criticalElements = document.querySelectorAll('[class*="from-red-600"][class*="via-rose-700"][class*="to-pink-600"]');
    expect(criticalElements.length).toBeGreaterThan(0);
  });

  it('should apply High priority gradient colors', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('High Priority Test')).toBeInTheDocument();
    });

    // Check for High priority gradient: orange-600 via red-600 to rose-600
    const highElements = document.querySelectorAll('[class*="from-orange-600"][class*="via-red-600"][class*="to-rose-600"]');
    expect(highElements.length).toBeGreaterThan(0);
  });

  it('should apply Medium priority gradient colors', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Medium Priority Test')).toBeInTheDocument();
    });

    // Check for Medium priority gradient: yellow-500 via amber-600 to orange-500
    const mediumElements = document.querySelectorAll('[class*="from-yellow-500"][class*="via-amber-600"][class*="to-orange-500"]');
    expect(mediumElements.length).toBeGreaterThan(0);
  });

  it('should apply Low priority gradient colors', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Low Priority Test')).toBeInTheDocument();
    });

    // Check for Low priority gradient: lime-500 via green-600 to emerald-500
    const lowElements = document.querySelectorAll('[class*="from-lime-500"][class*="via-green-600"][class*="to-emerald-500"]');
    expect(lowElements.length).toBeGreaterThan(0);
  });

  it('should include proper shadow and transition effects for all priorities', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Critical Test')).toBeInTheDocument();
    });

    // Check for shadow and transition classes
    const priorityElements = document.querySelectorAll('[class*="shadow-lg"][class*="hover:shadow-xl"][class*="transition-all"][class*="duration-300"]');
    expect(priorityElements.length).toBeGreaterThan(0);
  });

  it('should apply font-bold and text-white to all priority badges', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Critical Test')).toBeInTheDocument();
    });

    // Check for font-bold and text-white classes
    const boldWhiteElements = document.querySelectorAll('[class*="font-bold"][class*="text-white"]');
    expect(boldWhiteElements.length).toBeGreaterThan(0);
  });

  it('should have border-0 class for all priority badges', async () => {
    render(
      <TestWrapper>
        <ConsolidatedReports />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Critical Test')).toBeInTheDocument();
    });

    // Check for border-0 class
    const borderlessElements = document.querySelectorAll('[class*="border-0"]');
    expect(borderlessElements.length).toBeGreaterThan(0);
  });
});
