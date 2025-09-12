
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TestSheetEditor } from '../components/test-sheets/test-sheet-editor';
import { formulaEngine } from '../lib/formula-engine';

// Mock API request
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
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

describe('Test Sheet Cell Persistence', () => {
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
        cells: {
          'A1': { value: 'Initial Value', type: 'text', style: {} },
          'B1': { value: 42, type: 'number', style: {} },
        },
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

  it('should persist text values in cells', async () => {
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

    // Find and click cell A1
    const cellA1 = screen.getByText('Initial Value');
    fireEvent.click(cellA1);

    // Double click to edit
    fireEvent.doubleClick(cellA1);

    // Find the input field and change value
    const input = screen.getByDisplayValue('Initial Value');
    fireEvent.change(input, { target: { value: 'New Text Value' } });
    fireEvent.blur(input);

    // Check if value persists
    await waitFor(() => {
      expect(screen.getByText('New Text Value')).toBeInTheDocument();
    });
  });

  it('should persist number values in cells', async () => {
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

    // Find and click cell B1
    const cellB1 = screen.getByText('42');
    fireEvent.click(cellB1);
    fireEvent.doubleClick(cellB1);

    // Change to new number
    const input = screen.getByDisplayValue('42');
    fireEvent.change(input, { target: { value: '123.45' } });
    fireEvent.blur(input);

    // Check if value persists
    await waitFor(() => {
      expect(screen.getByText('123.45')).toBeInTheDocument();
    });
  });

  it('should persist formula values and show calculated result', async () => {
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

    // Click on cell C1
    const rows = screen.getAllByRole('row');
    const cellC1 = rows[1].children[3]; // Row 1, Column C (index 3)
    fireEvent.click(cellC1);
    fireEvent.doubleClick(cellC1);

    // Enter formula
    const input = cellC1.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { value: '=B1*2' } });
      fireEvent.blur(input);
    }

    // Check if calculated value shows
    await waitFor(() => {
      expect(cellC1).toHaveTextContent('84'); // 42 * 2
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

    // Click cell A1
    const cellA1 = screen.getByText('Initial Value');
    fireEvent.click(cellA1);

    // Find formula bar input
    const formulaBar = screen.getByPlaceholderText('Enter value or formula (=SUM(A1:A10))');
    
    // Update via formula bar
    fireEvent.change(formulaBar, { target: { value: 'Formula Bar Value' } });
    fireEvent.blur(formulaBar);

    // Check if cell updated
    await waitFor(() => {
      expect(screen.getByText('Formula Bar Value')).toBeInTheDocument();
    });
  });

  it('should handle keyboard navigation and value persistence', async () => {
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

    // Click cell A1
    const cellA1 = screen.getByText('Initial Value');
    fireEvent.click(cellA1);

    // Press F2 to start editing
    fireEvent.keyDown(cellA1, { key: 'F2' });

    // Type new value
    const input = screen.getByDisplayValue('Initial Value');
    fireEvent.change(input, { target: { value: 'Keyboard Edit' } });
    
    // Press Enter to confirm
    fireEvent.keyDown(input, { key: 'Enter' });

    // Check if value persists
    await waitFor(() => {
      expect(screen.getByText('Keyboard Edit')).toBeInTheDocument();
    });
  });

  it('should validate cell type detection', () => {
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
});
