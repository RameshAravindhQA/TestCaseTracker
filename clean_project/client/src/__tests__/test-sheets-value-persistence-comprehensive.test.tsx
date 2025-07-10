import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TestSheetEditor from '../components/test-sheets/test-sheet-editor';

// Mock the API functions
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock toast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock useAuth
vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, firstName: 'Test', lastName: 'User' },
  }),
}));

// Mock router
vi.mock('wouter', () => ({
  useLocation: () => ['/test-sheets', vi.fn()],
  useParams: () => ({ projectId: '1' }),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Test Sheets Value Persistence', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock successful API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/test-sheets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 1,
            name: 'Test Sheet',
            projectId: 1,
            data: {
              rows: [
                { id: 'row1', cells: [{ id: 'cell1', value: '', formula: '', type: 'text' }] },
                { id: 'row2', cells: [{ id: 'cell2', value: '', formula: '', type: 'text' }] }
              ],
              columns: [{ id: 'col1', name: 'Column 1', width: 120 }]
            },
            metadata: { version: 1, lastModifiedBy: 1 },
            createdById: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should persist cell values when clicking on other cells', async () => {
    renderWithQueryClient(<TestSheetEditor />);

    // Wait for the test sheet to load
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    // Find the first cell and enter a value
    const firstCell = screen.getByTestId('cell-row1-col1') || screen.getAllByRole('gridcell')[0];

    // Click on the first cell to focus it
    await user.click(firstCell);

    // Type a value
    const testValue = 'Test Value 1';
    await user.type(firstCell, testValue);

    // Verify the value is in the cell
    expect(firstCell).toHaveValue(testValue);

    // Find and click on a different cell
    const secondCell = screen.getByTestId('cell-row2-col1') || screen.getAllByRole('gridcell')[1];
    await user.click(secondCell);

    // Wait for any state updates
    await waitFor(() => {
      // Check that the first cell still has its value
      expect(firstCell).toHaveValue(testValue);
    }, { timeout: 2000 });

    // Enter a value in the second cell
    const secondTestValue = 'Test Value 2';
    await user.type(secondCell, secondTestValue);

    // Click back on the first cell
    await user.click(firstCell);

    // Verify both cells retain their values
    await waitFor(() => {
      expect(firstCell).toHaveValue(testValue);
      expect(secondCell).toHaveValue(secondTestValue);
    }, { timeout: 2000 });
  });

  it('should persist values after pressing Enter key', async () => {
    renderWithQueryClient(<TestSheetEditor />);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const cell = screen.getAllByRole('gridcell')[0];
    await user.click(cell);

    const testValue = 'Enter Test Value';
    await user.type(cell, testValue);

    // Press Enter to confirm the value
    await user.keyboard('{Enter}');

    // Wait and verify the value persists
    await waitFor(() => {
      expect(cell).toHaveValue(testValue);
    }, { timeout: 2000 });
  });

  it('should persist values after pressing Tab key', async () => {
    renderWithQueryClient(<TestSheetEditor />);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const firstCell = screen.getAllByRole('gridcell')[0];
    await user.click(firstCell);

    const testValue = 'Tab Test Value';
    await user.type(firstCell, testValue);

    // Press Tab to move to next cell
    await user.keyboard('{Tab}');

    // Wait and verify the value persists
    await waitFor(() => {
      expect(firstCell).toHaveValue(testValue);
    }, { timeout: 2000 });
  });

  it('should handle rapid cell switching without losing values', async () => {
    renderWithQueryClient(<TestSheetEditor />);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const cells = screen.getAllByRole('gridcell');
    const values = ['Value 1', 'Value 2', 'Value 3'];

    // Rapidly enter values and switch cells
    for (let i = 0; i < Math.min(3, cells.length); i++) {
      await user.click(cells[i]);
      await user.type(cells[i], values[i]);

      // Immediately click next cell (rapid switching)
      if (i < cells.length - 1) {
        await user.click(cells[i + 1]);
      }
    }

    // Wait for all state updates to complete
    await waitFor(() => {
      for (let i = 0; i < Math.min(3, cells.length); i++) {
        expect(cells[i]).toHaveValue(values[i]);
      }
    }, { timeout: 3000 });
  });

  it('should persist values when using keyboard navigation', async () => {
    renderWithQueryClient(<TestSheetEditor />);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const firstCell = screen.getAllByRole('gridcell')[0];
    await user.click(firstCell);

    const testValue = 'Keyboard Nav Value';
    await user.type(firstCell, testValue);

    // Use arrow keys to navigate
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    // Verify value is still there
    await waitFor(() => {
      expect(firstCell).toHaveValue(testValue);
    }, { timeout: 2000 });
  });

  it('should save data to backend when values change', async () => {
    // Mock the update API call
    const updateMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/test-sheets') && options?.method === 'PUT') {
        return updateMock(url, options);
      }
      return mockFetch.mockImplementation.call(this, url, options);
    });

    renderWithQueryClient(<TestSheetEditor />);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const cell = screen.getAllByRole('gridcell')[0];
    await user.click(cell);
    await user.type(cell, 'Backend Save Test');

    // Click another cell to trigger save
    const otherCell = screen.getAllByRole('gridcell')[1];
    await user.click(otherCell);

    // Wait for the API call
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});