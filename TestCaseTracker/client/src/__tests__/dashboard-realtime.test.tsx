
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/dashboard/index';

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-length={data?.length || 0}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Line: ({ dataKey, stroke }: any) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} />
  ),
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  )
}));

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

describe('Dashboard Real-time Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          totalProjects: 5,
          totalTestCases: 100,
          openBugs: 10,
          passRate: 85
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, name: 'Project 1', status: 'Active' },
          { id: 2, name: 'Project 2', status: 'Active' }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            feature: 'Login Test',
            status: 'Pass',
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            feature: 'Register Test',
            status: 'Fail',
            createdAt: new Date().toISOString()
          }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            title: 'Login Bug',
            status: 'Open',
            severity: 'Critical',
            dateReported: new Date().toISOString()
          }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });
  });

  it('should display real-time data without days mention', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Real-time test execution status')).toBeInTheDocument();
      expect(screen.getByText('Real-time bug activity overview')).toBeInTheDocument();
    });
    
    // Should not mention "Last 7 days" or similar
    expect(screen.queryByText(/last.*days/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/7 days/i)).not.toBeInTheDocument();
  });

  it('should display current statistics', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Total projects
      expect(screen.getByText('100')).toBeInTheDocument(); // Total test cases
      expect(screen.getByText('10')).toBeInTheDocument(); // Open bugs
      expect(screen.getByText('85%')).toBeInTheDocument(); // Pass rate
    });
  });

  it('should update charts with real-time data', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      const lineCharts = screen.getAllByTestId('line-chart');
      expect(lineCharts).toHaveLength(2);
    });
    
    // Verify chart components are rendered
    expect(screen.getAllByTestId('x-axis')).toHaveLength(2);
    expect(screen.getAllByTestId('y-axis')).toHaveLength(2);
  });

  it('should handle no data gracefully', async () => {
    // Mock empty responses
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          totalProjects: 0,
          totalTestCases: 0,
          openBugs: 0,
          passRate: 0
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No test case data available')).toBeInTheDocument();
      expect(screen.getByText('No bug data available')).toBeInTheDocument();
    });
  });
});
