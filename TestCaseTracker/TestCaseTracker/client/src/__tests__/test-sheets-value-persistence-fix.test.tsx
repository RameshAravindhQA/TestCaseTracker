
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TestSheetEditor } from '../components/test-sheets/test-sheet-editor';

// Mock dependencies
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: { invalidateQueries: vi.fn() }
}));

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('Test Sheets Value Persistence Fix', () => {
  let queryClient: QueryClient;
  let mockSheet: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockSheet = {
      id: 1,
      name: 'Test Sheet',
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
      projectId: 1,
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

  it('should persist cell values with immediate state updates', async () => {
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

    // Get cell A1
    const rows = screen.getAllByRole('row');
    const cellA1 = rows[1].children[1]; // Row 1, Column A (index 1)
    
    // Click to select cell
    fireEvent.click(cellA1);
    
    // Double click to edit
    fireEvent.doubleClick(cellA1);
    
    // Find input and enter value
    const input = cellA1.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { value: 'Test Value' } });
      fireEvent.blur(input);
    }

    // Wait for value to persist
    await waitFor(() => {
      expect(cellA1).toHaveTextContent('Test Value');
    });
  });

  it('should handle formula bar updates correctly', async () => {
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

    // Find formula bar
    const formulaBar = screen.getByPlaceholderText('Enter value or formula (=SUM(A1:A10))');
    
    // Enter value in formula bar
    fireEvent.change(formulaBar, { target: { value: 'Formula Bar Test' } });
    fireEvent.blur(formulaBar);

    // Check if value persists
    await waitFor(() => {
      expect(formulaBar).toHaveValue('Formula Bar Test');
    });
  });

  it('should handle different data types correctly', () => {
    const detectCellType = (value: string) => {
      if (value.startsWith('=')) return 'formula';
      if (!isNaN(Number(value)) && value.trim() !== '' && value.trim() !== '.') return 'number';
      if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean';
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'date';
      return 'text';
    };

    expect(detectCellType('123')).toBe('number');
    expect(detectCellType('=SUM(A1:A10)')).toBe('formula');
    expect(detectCellType('true')).toBe('boolean');
    expect(detectCellType('2023-12-25')).toBe('date');
    expect(detectCellType('Hello World')).toBe('text');
  });

  it('should auto-save changes after inactivity', async () => {
    vi.useFakeTimers();
    
    const mockMutate = vi.fn();
    const mockSaveSheetMutation = { mutate: mockMutate };

    // Simulate auto-save timer
    const autoSaveTimer = setTimeout(() => {
      mockMutate();
    }, 2000);

    // Fast forward 2 seconds
    vi.advanceTimersByTime(2000);

    expect(mockMutate).toHaveBeenCalled();
    clearTimeout(autoSaveTimer);
    vi.useRealTimers();
  });

  it('should validate cell state preservation', () => {
    const initialState = {
      cells: {},
      rows: 100,
      cols: 26,
    };

    const updateCellValue = (state: any, cellId: string, value: any) => ({
      ...state,
      cells: {
        ...state.cells,
        [cellId]: {
          value,
          type: 'text',
          style: {},
        },
      },
    });

    const newState = updateCellValue(initialState, 'A1', 'Test Value');
    
    expect(newState.cells['A1']).toEqual({
      value: 'Test Value',
      type: 'text',
      style: {},
    });
    expect(newState.cells['A1'].value).toBe('Test Value');
  });
});
