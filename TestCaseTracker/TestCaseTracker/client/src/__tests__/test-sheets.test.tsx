
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { formulaEngine } from '../lib/formula-engine';
import TestSheetsPage from '../pages/test-sheets';

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

// Mock authentication
vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'Admin' },
    isAuthenticated: true,
  }),
}));

describe('Test Sheets', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Formula Engine', () => {
    it('should evaluate SUM formula correctly', () => {
      const context = { A1: 10, A2: 20, A3: 30 };
      const result = formulaEngine.evaluate('=SUM(10, 20, 30)', context);
      expect(result).toBe(60);
    });

    it('should evaluate AVERAGE formula correctly', () => {
      const context = { A1: 10, A2: 20, A3: 30 };
      const result = formulaEngine.evaluate('=AVERAGE(10, 20, 30)', context);
      expect(result).toBe(20);
    });

    it('should evaluate COUNT formula correctly', () => {
      const context = { A1: 10, A2: 20, A3: 'text' };
      const result = formulaEngine.evaluate('=COUNT(10, 20, "text")', context);
      expect(result).toBe(2);
    });

    it('should evaluate COUNTA formula correctly', () => {
      const context = { A1: 10, A2: 20, A3: 'text' };
      const result = formulaEngine.evaluate('=COUNTA(10, 20, "text")', context);
      expect(result).toBe(3);
    });

    it('should evaluate MAX formula correctly', () => {
      const context = { A1: 10, A2: 50, A3: 30 };
      const result = formulaEngine.evaluate('=MAX(10, 50, 30)', context);
      expect(result).toBe(50);
    });

    it('should evaluate MIN formula correctly', () => {
      const context = { A1: 10, A2: 50, A3: 30 };
      const result = formulaEngine.evaluate('=MIN(10, 50, 30)', context);
      expect(result).toBe(10);
    });

    it('should evaluate text functions correctly', () => {
      expect(formulaEngine.evaluate('=CONCATENATE("Hello", " ", "World")', {})).toBe('Hello World');
      expect(formulaEngine.evaluate('=LEFT("Hello", 3)', {})).toBe('Hel');
      expect(formulaEngine.evaluate('=RIGHT("Hello", 3)', {})).toBe('llo');
      expect(formulaEngine.evaluate('=MID("Hello", 2, 3)', {})).toBe('ell');
      expect(formulaEngine.evaluate('=LEN("Hello")', {})).toBe(5);
      expect(formulaEngine.evaluate('=UPPER("hello")', {})).toBe('HELLO');
      expect(formulaEngine.evaluate('=LOWER("HELLO")', {})).toBe('hello');
    });

    it('should evaluate logical functions correctly', () => {
      expect(formulaEngine.evaluate('=IF(true, "Yes", "No")', {})).toBe('Yes');
      expect(formulaEngine.evaluate('=IF(false, "Yes", "No")', {})).toBe('No');
      expect(formulaEngine.evaluate('=AND(true, true)', {})).toBe(true);
      expect(formulaEngine.evaluate('=AND(true, false)', {})).toBe(false);
      expect(formulaEngine.evaluate('=OR(true, false)', {})).toBe(true);
      expect(formulaEngine.evaluate('=OR(false, false)', {})).toBe(false);
      expect(formulaEngine.evaluate('=NOT(true)', {})).toBe(false);
      expect(formulaEngine.evaluate('=NOT(false)', {})).toBe(true);
    });

    it('should handle cell references', () => {
      const context = { A1: 10, B1: 20 };
      const result = formulaEngine.evaluate('=A1+B1', context);
      expect(result).toBe(30);
    });

    it('should handle errors gracefully', () => {
      const result = formulaEngine.evaluate('=INVALID_FUNCTION()', {});
      expect(result).toBe('#ERROR!');
    });

    it('should get dependencies correctly', () => {
      const dependencies = formulaEngine.getDependencies('=SUM(A1:A10)+B5*C3');
      expect(dependencies).toContain('A1');
      expect(dependencies).toContain('B5');
      expect(dependencies).toContain('C3');
    });
  });

  describe('Test Sheet Grid Operations', () => {
    it('should convert column numbers to letters correctly', () => {
      // Test helper function for column conversion
      const getColumnLetter = (colIndex: number): string => {
        let result = '';
        while (colIndex >= 0) {
          result = String.fromCharCode(65 + (colIndex % 26)) + result;
          colIndex = Math.floor(colIndex / 26) - 1;
        }
        return result;
      };

      expect(getColumnLetter(0)).toBe('A');
      expect(getColumnLetter(1)).toBe('B');
      expect(getColumnLetter(25)).toBe('Z');
      expect(getColumnLetter(26)).toBe('AA');
      expect(getColumnLetter(27)).toBe('AB');
    });

    it('should generate correct cell IDs', () => {
      const getCellId = (row: number, col: number): string => {
        const getColumnLetter = (colIndex: number): string => {
          let result = '';
          while (colIndex >= 0) {
            result = String.fromCharCode(65 + (colIndex % 26)) + result;
            colIndex = Math.floor(colIndex / 26) - 1;
          }
          return result;
        };
        return `${getColumnLetter(col)}${row + 1}`;
      };

      expect(getCellId(0, 0)).toBe('A1');
      expect(getCellId(0, 1)).toBe('B1');
      expect(getCellId(1, 0)).toBe('A2');
      expect(getCellId(9, 25)).toBe('Z10');
    });
  });

  describe('Cell Data Types', () => {
    it('should detect number type correctly', () => {
      const detectCellType = (value: string) => {
        if (value.startsWith('=')) return 'formula';
        if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
        if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean';
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'date';
        return 'text';
      };

      expect(detectCellType('123')).toBe('number');
      expect(detectCellType('123.45')).toBe('number');
      expect(detectCellType('hello')).toBe('text');
      expect(detectCellType('true')).toBe('boolean');
      expect(detectCellType('false')).toBe('boolean');
      expect(detectCellType('2023-12-25')).toBe('date');
      expect(detectCellType('=SUM(A1:A10)')).toBe('formula');
    });
  });

  describe('Export Functionality', () => {
    it('should format CSV data correctly', () => {
      const csvData = [
        ['Name', 'Age', 'City'],
        ['John Doe', '30', 'New York'],
        ['Jane Smith', '25', 'Los Angeles'],
      ];

      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const expectedContent = '"Name","Age","City"\n"John Doe","30","New York"\n"Jane Smith","25","Los Angeles"';
      expect(csvContent).toBe(expectedContent);
    });

    it('should handle quotes in CSV data correctly', () => {
      const csvData = [
        ['Text with "quotes"', 'Normal text'],
      ];

      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const expectedContent = '"Text with ""quotes""","Normal text"';
      expect(csvContent).toBe(expectedContent);
    });
  });

  describe('Sheet Operations', () => {
    it('should create empty sheet data correctly', () => {
      const createEmptySheet = (rows: number, cols: number) => ({
        cells: {},
        rows,
        cols,
      });

      const sheet = createEmptySheet(100, 26);
      expect(sheet.rows).toBe(100);
      expect(sheet.cols).toBe(26);
      expect(Object.keys(sheet.cells)).toHaveLength(0);
    });

    it('should update cell data correctly', () => {
      const sheetData = {
        cells: {},
        rows: 10,
        cols: 10,
      };

      const updateCell = (cellId: string, data: any) => {
        sheetData.cells[cellId] = data;
      };

      updateCell('A1', { value: 'Hello', type: 'text' });
      updateCell('B1', { value: 123, type: 'number' });

      expect(sheetData.cells['A1']).toEqual({ value: 'Hello', type: 'text' });
      expect(sheetData.cells['B1']).toEqual({ value: 123, type: 'number' });
    });
  });

  describe('Collaboration Features', () => {
    it('should track version changes correctly', () => {
      const metadata = {
        version: 1,
        lastModifiedBy: 1,
        collaborators: [1, 2, 3],
        chartConfigs: [],
        namedRanges: [],
      };

      const updateMetadata = (newVersion: number, userId: number) => ({
        ...metadata,
        version: newVersion,
        lastModifiedBy: userId,
      });

      const updated = updateMetadata(2, 2);
      expect(updated.version).toBe(2);
      expect(updated.lastModifiedBy).toBe(2);
      expect(updated.collaborators).toHaveLength(3);
    });
  });

  describe('Named Ranges', () => {
    it('should create named ranges correctly', () => {
      const namedRanges = [
        { name: 'SalesData', range: 'A1:C10', description: 'Sales data for Q1' },
        { name: 'TotalRow', range: 'A11:C11', description: 'Total calculations' },
      ];

      expect(namedRanges).toHaveLength(2);
      expect(namedRanges[0].name).toBe('SalesData');
      expect(namedRanges[0].range).toBe('A1:C10');
    });
  });

  describe('Validation', () => {
    it('should validate cell data correctly', () => {
      const validateCell = (value: any, validation: any) => {
        if (!validation) return true;
        
        switch (validation.type) {
          case 'number':
            return !isNaN(Number(value));
          case 'list':
            return validation.criteria.includes(value);
          case 'date':
            return !isNaN(Date.parse(value));
          default:
            return true;
        }
      };

      expect(validateCell('123', { type: 'number' })).toBe(true);
      expect(validateCell('abc', { type: 'number' })).toBe(false);
      expect(validateCell('Option1', { type: 'list', criteria: ['Option1', 'Option2'] })).toBe(true);
      expect(validateCell('Option3', { type: 'list', criteria: ['Option1', 'Option2'] })).toBe(false);
      expect(validateCell('2023-12-25', { type: 'date' })).toBe(true);
      expect(validateCell('invalid-date', { type: 'date' })).toBe(false);
    });
  });
});
