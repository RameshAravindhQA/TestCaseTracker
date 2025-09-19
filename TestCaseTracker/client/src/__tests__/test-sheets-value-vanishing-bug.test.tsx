
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TestSheetEditor } from '../components/test-sheets/test-sheet-editor';
import { TestSheet } from '@/types';

// Mock dependencies
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn().mockResolvedValue({}),
  queryClient: { invalidateQueries: vi.fn() }
}));

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('Test Sheets Value Vanishing Bug Reproduction', () => {
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
      name: 'Bug Reproduction Sheet',
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

  const renderTestSheetEditor = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TestSheetEditor
          sheet={mockSheet}
          open={true}
          onOpenChange={vi.fn()}
          onSave={vi.fn()}
        />
      </QueryClientProvider>
    );
  };

  it('CRITICAL: Values should NOT vanish when entering value and clicking another cell', async () => {
    console.log('🧪 Starting critical bug reproduction test...');
    
    renderTestSheetEditor();
    
    const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
    
    // Step 1: Click on cell A1
    console.log('📍 Step 1: Clicking on cell A1');
    const rows = screen.getAllByRole('row');
    const cellA1 = rows[1].children[1]; // Row 1 (index 1), Column A (index 1)
    await user.click(cellA1);
    
    // Verify A1 is selected
    expect(formulaBar).toBeInTheDocument();
    
    // Step 2: Enter a value
    console.log('✍️ Step 2: Entering value "Test Data 123"');
    await user.clear(formulaBar);
    await user.type(formulaBar, 'Test Data 123');
    
    // Verify value appears in formula bar
    expect(formulaBar).toHaveValue('Test Data 123');
    
    // Step 3: Commit the value (blur or press Enter)
    console.log('💾 Step 3: Committing value via blur');
    fireEvent.blur(formulaBar);
    
    // Wait for state update
    await waitFor(() => {
      expect(cellA1).toHaveTextContent('Test Data 123');
    }, { timeout: 3000 });
    
    // Step 4: Click on another cell (B1)
    console.log('👆 Step 4: Clicking on cell B1');
    const cellB1 = rows[1].children[2]; // Row 1, Column B
    await user.click(cellB1);
    
    // Step 5: Click back on A1 and verify value is still there
    console.log('🔍 Step 5: Clicking back on A1 to check persistence');
    await user.click(cellA1);
    
    // CRITICAL CHECK: Value should still be there
    await waitFor(() => {
      expect(formulaBar).toHaveValue('Test Data 123');
      expect(cellA1).toHaveTextContent('Test Data 123');
    }, { timeout: 3000 });
    
    console.log('✅ Test passed: Value persisted correctly');
  });

  it('should handle rapid cell switching without losing data', async () => {
    console.log('🧪 Testing rapid cell switching...');
    
    renderTestSheetEditor();
    
    const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
    const rows = screen.getAllByRole('row');
    
    // Add values to multiple cells rapidly
    const testCells = [
      { row: 1, col: 1, value: 'A1 Value', cellId: 'A1' },
      { row: 1, col: 2, value: 'B1 Value', cellId: 'B1' },
      { row: 2, col: 1, value: 'A2 Value', cellId: 'A2' },
      { row: 2, col: 2, value: 'B2 Value', cellId: 'B2' },
    ];
    
    // Enter values in sequence
    for (const testCell of testCells) {
      console.log(`📝 Entering "${testCell.value}" in ${testCell.cellId}`);
      
      const cell = rows[testCell.row].children[testCell.col];
      await user.click(cell);
      await user.clear(formulaBar);
      await user.type(formulaBar, testCell.value);
      fireEvent.blur(formulaBar);
      
      // Quick verification
      await waitFor(() => {
        expect(cell).toHaveTextContent(testCell.value);
      });
    }
    
    // Now verify all values are still there by checking each cell
    console.log('🔍 Verifying all values persisted...');
    
    for (const testCell of testCells) {
      const cell = rows[testCell.row].children[testCell.col];
      await user.click(cell);
      
      await waitFor(() => {
        expect(formulaBar).toHaveValue(testCell.value);
        expect(cell).toHaveTextContent(testCell.value);
      });
      
      console.log(`✅ ${testCell.cellId}: "${testCell.value}" - PERSISTED`);
    }
  });

  it('should maintain data integrity with keyboard navigation', async () => {
    console.log('🧪 Testing keyboard navigation data integrity...');
    
    renderTestSheetEditor();
    
    const formulaBar = screen.getByPlaceholderText(/Enter value or formula/);
    const rows = screen.getAllByRole('row');
    const cellA1 = rows[1].children[1];
    
    // Enter value and use keyboard to navigate
    await user.click(cellA1);
    await user.clear(formulaBar);
    await user.type(formulaBar, 'Keyboard Test');
    
    // Press Enter to confirm and move down
    fireEvent.keyDown(formulaBar, { key: 'Enter' });
    
    // Verify A1 still has the value
    await waitFor(() => {
      expect(cellA1).toHaveTextContent('Keyboard Test');
    });
    
    // Navigate back using arrow keys
    fireEvent.keyDown(document.activeElement || document.body, { key: 'ArrowUp' });
    
    // Verify we're back on A1 and value is there
    await waitFor(() => {
      expect(formulaBar).toHaveValue('Keyboard Test');
    });
    
    console.log('✅ Keyboard navigation test passed');
  });
});
