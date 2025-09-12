
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// Mock authentication
vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'Admin' },
    isAuthenticated: true,
  }),
}));

describe('Enhanced Test Sheets', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('Enhanced Formula Engine', () => {
    it('should evaluate basic arithmetic operations', () => {
      expect(formulaEngine.evaluate('=2+3', {})).toBe(5);
      expect(formulaEngine.evaluate('=10-4', {})).toBe(6);
      expect(formulaEngine.evaluate('=3*4', {})).toBe(12);
      expect(formulaEngine.evaluate('=15/3', {})).toBe(5);
      expect(formulaEngine.evaluate('=(2+3)*4', {})).toBe(20);
    });

    it('should evaluate power and square root functions', () => {
      expect(formulaEngine.evaluate('=POWER(2,3)', {})).toBe(8);
      expect(formulaEngine.evaluate('=SQRT(16)', {})).toBe(4);
      expect(formulaEngine.evaluate('=SQRT(9)', {})).toBe(3);
    });

    it('should evaluate trigonometric functions', () => {
      expect(formulaEngine.evaluate('=SIN(0)', {})).toBe(0);
      expect(formulaEngine.evaluate('=COS(0)', {})).toBe(1);
      expect(Math.round(formulaEngine.evaluate('=TAN(0)', {}) * 1000) / 1000).toBe(0);
    });

    it('should evaluate logarithmic functions', () => {
      expect(formulaEngine.evaluate('=LOG10(100)', {})).toBe(2);
      expect(formulaEngine.evaluate('=LOG10(1000)', {})).toBe(3);
    });

    it('should evaluate rounding functions', () => {
      expect(formulaEngine.evaluate('=ROUND(3.14159, 2)', {})).toBe(3.14);
      expect(formulaEngine.evaluate('=CEILING(3.1)', {})).toBe(4);
      expect(formulaEngine.evaluate('=FLOOR(3.9)', {})).toBe(3);
      expect(formulaEngine.evaluate('=ABS(-5)', {})).toBe(5);
    });

    it('should evaluate modulo operations', () => {
      expect(formulaEngine.evaluate('=MOD(10, 3)', {})).toBe(1);
      expect(formulaEngine.evaluate('=MOD(15, 4)', {})).toBe(3);
    });

    it('should evaluate mathematical constants', () => {
      expect(Math.round(formulaEngine.evaluate('=PI()', {}) * 100) / 100).toBe(3.14);
      expect(Math.round(formulaEngine.evaluate('=E()', {}) * 100) / 100).toBe(2.72);
    });

    it('should evaluate random functions', () => {
      const random = formulaEngine.evaluate('=RANDOM()', {});
      expect(random).toBeGreaterThanOrEqual(0);
      expect(random).toBeLessThan(1);

      const randBetween = formulaEngine.evaluate('=RANDBETWEEN(1, 10)', {});
      expect(randBetween).toBeGreaterThanOrEqual(1);
      expect(randBetween).toBeLessThanOrEqual(10);
    });

    it('should evaluate statistical functions', () => {
      const context = { A1: 10, A2: 20, A3: 30 };
      expect(formulaEngine.evaluate('=SUM(A1:A3)', context)).toBe(60);
      expect(formulaEngine.evaluate('=AVERAGE(A1:A3)', context)).toBe(20);
      expect(formulaEngine.evaluate('=COUNT(A1:A3)', context)).toBe(3);
      expect(formulaEngine.evaluate('=MAX(A1:A3)', context)).toBe(30);
      expect(formulaEngine.evaluate('=MIN(A1:A3)', context)).toBe(10);
    });

    it('should handle complex formulas', () => {
      const context = { A1: 5, A2: 3, B1: 2, B2: 4 };
      expect(formulaEngine.evaluate('=SUM(A1:A2) * POWER(B1, B2)', context)).toBe(128); // (5+3) * 2^4 = 8 * 16 = 128
      expect(formulaEngine.evaluate('=SQRT(POWER(A1, 2) + POWER(A2, 2))', context)).toBeCloseTo(5.83, 2); // √(5²+3²) = √(25+9) = √34 ≈ 5.83
    });

    it('should handle error cases gracefully', () => {
      expect(formulaEngine.evaluate('=SQRT(-1)', {})).toBe('#ERROR!');
      expect(formulaEngine.evaluate('=INVALID_FUNCTION()', {})).toBe('#ERROR!');
      expect(formulaEngine.evaluate('=1/0', {})).toBe('#ERROR!');
    });
  });

  describe('Cell ID Generation', () => {
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

    it('should generate correct cell IDs for single letters', () => {
      expect(getCellId(0, 0)).toBe('A1');
      expect(getCellId(0, 1)).toBe('B1');
      expect(getCellId(0, 25)).toBe('Z1');
      expect(getCellId(9, 0)).toBe('A10');
    });

    it('should generate correct cell IDs for double letters', () => {
      expect(getCellId(0, 26)).toBe('AA1');
      expect(getCellId(0, 27)).toBe('AB1');
      expect(getCellId(0, 51)).toBe('AZ1');
      expect(getCellId(0, 52)).toBe('BA1');
    });
  });

  describe('Cell Type Detection', () => {
    const detectCellType = (value: string) => {
      if (value.startsWith('=')) return 'formula';
      if (!isNaN(Number(value)) && value.trim() !== '' && value.trim() !== '.') return 'number';
      if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean';
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'date';
      return 'text';
    };

    it('should detect number types correctly', () => {
      expect(detectCellType('123')).toBe('number');
      expect(detectCellType('123.45')).toBe('number');
      expect(detectCellType('-67.89')).toBe('number');
      expect(detectCellType('0')).toBe('number');
    });

    it('should detect text types correctly', () => {
      expect(detectCellType('hello')).toBe('text');
      expect(detectCellType('Hello World')).toBe('text');
      expect(detectCellType('')).toBe('text');
      expect(detectCellType('.')).toBe('text');
    });

    it('should detect boolean types correctly', () => {
      expect(detectCellType('true')).toBe('boolean');
      expect(detectCellType('false')).toBe('boolean');
      expect(detectCellType('TRUE')).toBe('boolean');
      expect(detectCellType('FALSE')).toBe('boolean');
    });

    it('should detect date types correctly', () => {
      expect(detectCellType('2023-12-25')).toBe('date');
      expect(detectCellType('2024-01-01')).toBe('date');
      expect(detectCellType('1999-06-15')).toBe('date');
    });

    it('should detect formula types correctly', () => {
      expect(detectCellType('=SUM(A1:A10)')).toBe('formula');
      expect(detectCellType('=A1+B1')).toBe('formula');
      expect(detectCellType('=POWER(2,3)')).toBe('formula');
    });
  });

  describe('Range Selection and Drag Operations', () => {
    it('should create proper range references', () => {
      const createRangeReference = (startRow: number, startCol: number, endRow: number, endCol: number) => {
        const getCellId = (row: number, col: number) => {
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

        const startCellId = getCellId(startRow, startCol);
        const endCellId = getCellId(endRow, endCol);
        return `${startCellId}:${endCellId}`;
      };

      expect(createRangeReference(0, 0, 2, 0)).toBe('A1:A3');
      expect(createRangeReference(0, 0, 0, 2)).toBe('A1:C1');
      expect(createRangeReference(0, 0, 2, 2)).toBe('A1:C3');
      expect(createRangeReference(1, 1, 3, 3)).toBe('B2:D4');
    });

    it('should handle range expansion correctly', () => {
      const expandRange = (startCell: string, endCell: string, context: Record<string, any>): number[] => {
        const columnLetterToNumber = (letter: string): number => {
          let result = 0;
          for (let i = 0; i < letter.length; i++) {
            result = result * 26 + (letter.charCodeAt(i) - 64);
          }
          return result;
        };

        const numberToColumnLetter = (num: number): string => {
          let result = '';
          while (num > 0) {
            num--;
            result = String.fromCharCode(65 + (num % 26)) + result;
            num = Math.floor(num / 26);
          }
          return result;
        };

        const startMatch = startCell.match(/([A-Z]+)(\d+)/);
        const endMatch = endCell.match(/([A-Z]+)(\d+)/);
        
        if (!startMatch || !endMatch) return [];
        
        const startCol = columnLetterToNumber(startMatch[1]);
        const startRow = parseInt(startMatch[2]);
        const endCol = columnLetterToNumber(endMatch[1]);
        const endRow = parseInt(endMatch[2]);
        
        const values: number[] = [];
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const cellId = numberToColumnLetter(col) + row;
            const value = context[cellId];
            if (!isNaN(Number(value))) {
              values.push(Number(value));
            }
          }
        }
        
        return values;
      };

      const context = { A1: 10, A2: 20, A3: 30, B1: 5, B2: 15, B3: 25 };
      expect(expandRange('A1', 'A3', context)).toEqual([10, 20, 30]);
      expect(expandRange('A1', 'B1', context)).toEqual([10, 5]);
      expect(expandRange('A1', 'B3', context)).toEqual([10, 5, 20, 15, 30, 25]);
    });
  });

  describe('CSV Export Functionality', () => {
    it('should format CSV data correctly', () => {
      const csvData = [
        ['Name', 'Value', 'Formula'],
        ['Test 1', '100', '=A1*2'],
        ['Test 2', '200', '=B1+50'],
      ];

      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const expectedContent = '"Name","Value","Formula"\n"Test 1","100","=A1*2"\n"Test 2","200","=B1+50"';
      expect(csvContent).toBe(expectedContent);
    });

    it('should handle special characters in CSV export', () => {
      const csvData = [
        ['Text with "quotes"', 'Text with, commas', 'Text with\nnewlines'],
      ];

      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const expectedContent = '"Text with ""quotes""","Text with, commas","Text with\nnewlines"';
      expect(csvContent).toBe(expectedContent);
    });
  });

  describe('Sheet Data Management', () => {
    it('should create empty sheet data structure', () => {
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
      updateCell('C1', { value: '=A1&" World"', type: 'formula' });

      expect(sheetData.cells['A1']).toEqual({ value: 'Hello', type: 'text' });
      expect(sheetData.cells['B1']).toEqual({ value: 123, type: 'number' });
      expect(sheetData.cells['C1']).toEqual({ value: '=A1&" World"', type: 'formula' });
    });

    it('should handle cell style updates', () => {
      const cellData = {
        value: 'Styled Text',
        type: 'text',
        style: {}
      };

      const updateCellStyle = (cell: any, styleUpdates: any) => ({
        ...cell,
        style: { ...cell.style, ...styleUpdates }
      });

      const styledCell = updateCellStyle(cellData, {
        fontWeight: 'bold',
        color: '#ff0000',
        backgroundColor: '#ffff00'
      });

      expect(styledCell.style.fontWeight).toBe('bold');
      expect(styledCell.style.color).toBe('#ff0000');
      expect(styledCell.style.backgroundColor).toBe('#ffff00');
    });
  });

  describe('Formula Dependencies', () => {
    it('should extract cell dependencies from formulas', () => {
      const getDependencies = (formula: string): string[] => {
        const dependencies: string[] = [];
        const cellPattern = /\b[A-Z]+\d+\b/g;
        let match;
        
        while ((match = cellPattern.exec(formula)) !== null) {
          if (!dependencies.includes(match[0])) {
            dependencies.push(match[0]);
          }
        }
        
        return dependencies;
      };

      expect(getDependencies('=A1+B2')).toEqual(['A1', 'B2']);
      expect(getDependencies('=SUM(A1:A10)')).toEqual(['A1', 'A10']);
      expect(getDependencies('=IF(C1>0, A1*B1, 0)')).toEqual(['C1', 'A1', 'B1']);
      expect(getDependencies('=POWER(A1, 2) + SQRT(B1)')).toEqual(['A1', 'B1']);
    });
  });
});
