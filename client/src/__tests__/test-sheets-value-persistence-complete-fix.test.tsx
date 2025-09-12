
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TestSheetEditor } from '../components/test-sheets/test-sheet-editor';
import { TestSheet } from '../types';

// Mock dependencies
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('Test Sheets Value Persistence Complete Fix', () => {
  let queryClient: QueryClient;
  let mockSheet: TestSheet;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    user = userEvent.setup();

    mockSheet = {
      id: 1,
      name: 'Test Sheet',
      projectId: 1,
      data: {
        cells: {},
        rows: 100,
        cols: 26,
      },
      metadata: {
        version: 1,
        lastModifiedBy: 1,
        collaborators: [],
        chartConfigs: [],
        namedRanges: [],
      },
      createdById: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should persist cell values when entering text', async () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <TestSheetEditor
        sheet={mockSheet}
        open={true}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    // Get the first data cell (row 1, column A)
    const firstRow = screen.getAllByRole('row')[1]; // Skip header row
    const cellA1 = firstRow.children[1]; // Skip row header

    // Click to select the cell
    fireEvent.click(cellA1);

    // Double click to edit
    fireEvent.doubleClick(cellA1);

    // Find the input element within the cell
    const input = cellA1.querySelector('input');
    expect(input).toBeInTheDocument();

    if (input) {
      // Enter text value
      fireEvent.change(input, { target: { value: 'Test Value' } });
      fireEvent.blur(input);

      // Wait for value to persist
      await waitFor(() => {
        expect(cellA1).toHaveTextContent('Test Value');
      }, { timeout: 2000 });
    }
  });

  it('should persist numeric values correctly', async () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <TestSheetEditor
        sheet={mockSheet}
        open={true}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    const firstRow = screen.getAllByRole('row')[1];
    const cellA1 = firstRow.children[1];

    fireEvent.click(cellA1);
    fireEvent.doubleClick(cellA1);

    const input = cellA1.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { value: '123.45' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(cellA1).toHaveTextContent('123.45');
      });
    }
  });

  it('should persist formula values correctly', async () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <TestSheetEditor
        sheet={mockSheet}
        open={true}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    // Get formula bar
    const formulaBar = screen.getByPlaceholderText('Enter value or formula (=SUM(A1:A10))');

    // Select a cell first
    const firstRow = screen.getAllByRole('row')[1];
    const cellA1 = firstRow.children[1];
    fireEvent.click(cellA1);

    // Enter formula in formula bar
    fireEvent.change(formulaBar, { target: { value: '=5+3' } });
    fireEvent.blur(formulaBar);

    // Should show calculated result
    await waitFor(() => {
      expect(cellA1).toHaveTextContent('8');
    });
  });

  it('should maintain values when switching between cells', async () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <TestSheetEditor
        sheet={mockSheet}
        open={true}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    const firstRow = rows[1];
    const secondRow = rows[2];
    
    const cellA1 = firstRow.children[1];
    const cellA2 = secondRow.children[1];

    // Enter value in A1
    fireEvent.click(cellA1);
    fireEvent.doubleClick(cellA1);
    
    let input = cellA1.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { value: 'First Value' } });
      fireEvent.blur(input);
    }

    // Switch to A2 and enter value
    fireEvent.click(cellA2);
    fireEvent.doubleClick(cellA2);
    
    input = cellA2.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { value: 'Second Value' } });
      fireEvent.blur(input);
    }

    // Switch back to A1 and verify value persisted
    fireEvent.click(cellA1);

    await waitFor(() => {
      expect(cellA1).toHaveTextContent('First Value');
      expect(cellA2).toHaveTextContent('Second Value');
    });
  });
});
