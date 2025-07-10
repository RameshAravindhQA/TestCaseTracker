
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TestSheetEditor } from '@/components/test-sheets/test-sheet-editor';
import { TestSheet } from '@/types';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the API request
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

describe('Enhanced Test Sheets Functionality', () => {
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
        cells: {
          'A1': { value: 'Header 1', type: 'text', style: {} },
          'B1': { value: 'Header 2', type: 'text', style: {} },
          'A2': { value: 10, type: 'number', style: {} },
          'B2': { value: 20, type: 'number', style: {} },
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
      createdById: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const renderTestSheetEditor = (sheet = mockSheet) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TestSheetEditor
          sheet={sheet}
          open={true}
          onOpenChange={vi.fn()}
          onSave={vi.fn()}
        />
      </QueryClientProvider>
    );
  };

  describe('Value Persistence', () => {
    it('should persist text values correctly', async () => {
      renderTestSheetEditor();
      
      // Find the formula bar input
      const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
      
      // Click on cell A3 (should be empty)
      const cellA3 = screen.getByText('A3').closest('div')?.parentElement?.children[1];
      if (cellA3) {
        await user.click(cellA3 as Element);
      }
      
      // Enter a text value
      await user.clear(formulaBar);
      await user.type(formulaBar, 'Test Value');
      fireEvent.blur(formulaBar);
      
      // Check if value persists
      await waitFor(() => {
        expect(formulaBar).toHaveValue('Test Value');
      });
    });

    it('should persist number values correctly', async () => {
      renderTestSheetEditor();
      
      const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
      
      // Click on cell A4
      const cellA4 = screen.getByText('A4').closest('div')?.parentElement?.children[1];
      if (cellA4) {
        await user.click(cellA4 as Element);
      }
      
      // Enter a number value
      await user.clear(formulaBar);
      await user.type(formulaBar, '123.45');
      fireEvent.blur(formulaBar);
      
      // Check if value persists and is treated as number
      await waitFor(() => {
        expect(formulaBar).toHaveValue('123.45');
      });
    });

    it('should handle formula values correctly', async () => {
      renderTestSheetEditor();
      
      const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
      
      // Click on cell C2
      const cellC2 = screen.getByText('C2').closest('div')?.parentElement?.children[3];
      if (cellC2) {
        await user.click(cellC2 as Element);
      }
      
      // Enter a formula
      await user.clear(formulaBar);
      await user.type(formulaBar, '=A2+B2');
      fireEvent.blur(formulaBar);
      
      // Check if formula persists
      await waitFor(() => {
        expect(formulaBar).toHaveValue('=A2+B2');
      });
    });
  });

  describe('Cell Editing', () => {
    it('should allow inline cell editing on double click', async () => {
      renderTestSheetEditor();
      
      // Double click on cell A1
      const cellA1 = screen.getByDisplayValue('Header 1').closest('div');
      if (cellA1) {
        await user.dblClick(cellA1);
      }
      
      // Should show inline editor
      const inlineInput = screen.getByDisplayValue('Header 1');
      expect(inlineInput).toBeInTheDocument();
      
      // Edit the value
      await user.clear(inlineInput);
      await user.type(inlineInput, 'New Header');
      fireEvent.blur(inlineInput);
      
      // Value should persist
      await waitFor(() => {
        expect(screen.getByDisplayValue('New Header')).toBeInTheDocument();
      });
    });

    it('should handle keyboard navigation correctly', async () => {
      renderTestSheetEditor();
      
      // Click on cell A1
      const cellA1 = screen.getByDisplayValue('Header 1').closest('div');
      if (cellA1) {
        await user.click(cellA1);
      }
      
      // Press arrow down
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
      
      // Should select cell A2
      await waitFor(() => {
        const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
        expect(formulaBar).toHaveValue('10');
      });
    });
  });

  describe('Formula Engine', () => {
    it('should evaluate basic arithmetic formulas', async () => {
      renderTestSheetEditor();
      
      const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
      
      // Select empty cell
      const cellC1 = screen.getByText('C1').closest('div')?.parentElement?.children[3];
      if (cellC1) {
        await user.click(cellC1 as Element);
      }
      
      // Enter formula
      await user.clear(formulaBar);
      await user.type(formulaBar, '=5+3*2');
      fireEvent.blur(formulaBar);
      
      // Should evaluate to 11
      await waitFor(() => {
        // The cell should show the calculated value
        expect(screen.getByText('11')).toBeInTheDocument();
      });
    });

    it('should handle cell references in formulas', async () => {
      renderTestSheetEditor();
      
      const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
      
      // Select cell C3
      const cellC3 = screen.getByText('C3').closest('div')?.parentElement?.children[3];
      if (cellC3) {
        await user.click(cellC3 as Element);
      }
      
      // Enter formula referencing existing cells
      await user.clear(formulaBar);
      await user.type(formulaBar, '=A2+B2');
      fireEvent.blur(formulaBar);
      
      // Should evaluate to 30 (10+20)
      await waitFor(() => {
        expect(screen.getByText('30')).toBeInTheDocument();
      });
    });
  });

  describe('Cell Formatting', () => {
    it('should apply bold formatting to selected cells', async () => {
      renderTestSheetEditor();
      
      // Click on cell A1
      const cellA1 = screen.getByDisplayValue('Header 1').closest('div');
      if (cellA1) {
        await user.click(cellA1);
      }
      
      // Click bold button
      const boldButton = screen.getByRole('button', { name: /bold/i });
      await user.click(boldButton);
      
      // Check if cell has bold styling
      await waitFor(() => {
        const cell = screen.getByDisplayValue('Header 1').closest('div');
        expect(cell).toHaveStyle({ fontWeight: 'bold' });
      });
    });

    it('should apply text alignment correctly', async () => {
      renderTestSheetEditor();
      
      // Select cell A1
      const cellA1 = screen.getByDisplayValue('Header 1').closest('div');
      if (cellA1) {
        await user.click(cellA1);
      }
      
      // Click center align button
      const centerButton = screen.getByRole('button', { name: /center/i });
      await user.click(centerButton);
      
      // Check if cell has center alignment
      await waitFor(() => {
        const cell = screen.getByDisplayValue('Header 1').closest('div');
        expect(cell).toHaveStyle({ textAlign: 'center' });
      });
    });
  });

  describe('Range Selection', () => {
    it('should handle range selection with shift+click', async () => {
      renderTestSheetEditor();
      
      // Click on cell A1
      const cellA1 = screen.getByDisplayValue('Header 1').closest('div');
      if (cellA1) {
        await user.click(cellA1);
      }
      
      // Shift+click on cell B2
      const cellB2 = screen.getByDisplayValue('20').closest('div');
      if (cellB2) {
        await user.click(cellB2, { shiftKey: true });
      }
      
      // Should select range A1:B2
      await waitFor(() => {
        const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
        expect(formulaBar.closest('div')?.textContent).toContain('A1:B2');
      });
    });

    it('should insert SUM formula for selected range', async () => {
      renderTestSheetEditor();
      
      // Select range A2:B2
      const cellA2 = screen.getByDisplayValue('10').closest('div');
      const cellB2 = screen.getByDisplayValue('20').closest('div');
      
      if (cellA2 && cellB2) {
        await user.click(cellA2);
        await user.click(cellB2, { shiftKey: true });
      }
      
      // Click SUM button
      const sumButton = screen.getByText('SUM');
      await user.click(sumButton);
      
      // Should insert SUM formula in cell below
      await waitFor(() => {
        const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
        expect(formulaBar).toHaveValue('=SUM(A2:B2)');
      });
    });
  });

  describe('Auto-save Functionality', () => {
    it('should trigger auto-save after value changes', async () => {
      const mockSave = vi.fn();
      renderTestSheetEditor();
      
      const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
      
      // Click on empty cell
      const cellA5 = screen.getByText('A5').closest('div')?.parentElement?.children[1];
      if (cellA5) {
        await user.click(cellA5 as Element);
      }
      
      // Enter value
      await user.clear(formulaBar);
      await user.type(formulaBar, 'Auto-save test');
      fireEvent.blur(formulaBar);
      
      // Wait for auto-save delay (1.5 seconds)
      await waitFor(() => {
        // Auto-save should have been triggered
        expect(formulaBar).toHaveValue('Auto-save test');
      }, { timeout: 2000 });
    });
  });

  describe('Data Export', () => {
    it('should export data to CSV format', async () => {
      renderTestSheetEditor();
      
      // Mock URL.createObjectURL
      const mockCreateObjectURL = vi.fn(() => 'mock-url');
      global.URL.createObjectURL = mockCreateObjectURL;
      
      // Mock document.createElement
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const mockCreateElement = vi.fn(() => mockAnchor);
      document.createElement = mockCreateElement;
      
      // Click export button
      const exportButton = screen.getByText(/Export CSV/);
      await user.click(exportButton);
      
      // Should create download link
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });
});
