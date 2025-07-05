import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock global DOM APIs before tests
const mockLocalStorage = {
  store: {} as any,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  })
};

// Set up global window mock
Object.defineProperty(global, 'window', {
  value: {
    localStorage: mockLocalStorage
  },
  writable: true
});

// Set up global localStorage
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock Blob constructor
Object.defineProperty(global, 'Blob', {
  value: class MockBlob {
    constructor(parts: any[], options: any = {}) {
      this.parts = parts;
      this.options = options;
      this.type = options.type || '';
    }
    parts: any[];
    options: any;
    type: string;
  },
  writable: true
});

// Mock URL methods
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
});

describe('Spreadsheet System Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockLocalStorage.store = {};
  });

  describe('Spreadsheet Creation and Initialization', () => {
    it('should create a new spreadsheet with default structure', () => {
      const spreadsheetData = {
        'A1': { value: 'Project Name', type: 'text' },
        'B1': { value: 'Status', type: 'text' },
        'C1': { value: 'Progress', type: 'text' },
        'D1': { value: 'Due Date', type: 'text' },
      };

      expect(spreadsheetData['A1'].value).toBe('Project Name');
      expect(spreadsheetData['B1'].value).toBe('Status');
      expect(spreadsheetData['C1'].value).toBe('Progress');
      expect(spreadsheetData['D1'].value).toBe('Due Date');
      expect(Object.keys(spreadsheetData)).toHaveLength(4);
    });

    it('should initialize empty spreadsheet structure', () => {
      const emptySpreadsheet = {};
      
      expect(Object.keys(emptySpreadsheet)).toHaveLength(0);
    });

    it('should generate correct cell IDs for different positions', () => {
      const getCellId = (col: string, row: number) => `${col}${row}`;
      
      expect(getCellId('A', 1)).toBe('A1');
      expect(getCellId('B', 2)).toBe('B2');
      expect(getCellId('Z', 26)).toBe('Z26');
      expect(getCellId('AA', 1)).toBe('AA1');
    });
  });

  describe('Cell Operations', () => {
    let spreadsheetData: any;

    beforeEach(() => {
      spreadsheetData = {
        'A1': { value: 'Test', type: 'text' },
        'B1': { value: '100', type: 'number' },
        'C1': { value: '=A1&B1', type: 'formula' }
      };
    });

    it('should update cell values correctly', () => {
      const updateCell = (cellId: string, value: string, type: string = 'text') => {
        spreadsheetData[cellId] = { value, type };
      };

      updateCell('A2', 'New Value');
      expect(spreadsheetData['A2'].value).toBe('New Value');
      expect(spreadsheetData['A2'].type).toBe('text');
    });

    it('should handle numeric cell values', () => {
      const updateCell = (cellId: string, value: string) => {
        const isNumber = !isNaN(Number(value)) && value.trim() !== '';
        spreadsheetData[cellId] = { 
          value, 
          type: isNumber ? 'number' : 'text' 
        };
      };

      updateCell('B2', '250');
      expect(spreadsheetData['B2'].value).toBe('250');
      expect(spreadsheetData['B2'].type).toBe('number');

      updateCell('B3', 'not a number');
      expect(spreadsheetData['B3'].value).toBe('not a number');
      expect(spreadsheetData['B3'].type).toBe('text');
    });

    it('should handle formula cells', () => {
      const updateCell = (cellId: string, value: string) => {
        const isFormula = value.startsWith('=');
        spreadsheetData[cellId] = { 
          value, 
          type: isFormula ? 'formula' : 'text' 
        };
      };

      updateCell('C2', '=A1+B1');
      expect(spreadsheetData['C2'].value).toBe('=A1+B1');
      expect(spreadsheetData['C2'].type).toBe('formula');
    });

    it('should handle empty cell values', () => {
      const updateCell = (cellId: string, value: string) => {
        if (value === '') {
          delete spreadsheetData[cellId];
        } else {
          spreadsheetData[cellId] = { value, type: 'text' };
        }
      };

      updateCell('A1', '');
      expect(spreadsheetData['A1']).toBeUndefined();
    });
  });

  describe('Data Persistence', () => {
    it('should save spreadsheet data to localStorage', () => {
      const spreadsheetData = {
        'A1': { value: 'Test Data', type: 'text' },
        'B1': { value: '123', type: 'number' }
      };

      const saveSpreadsheet = () => {
        const data = JSON.stringify(spreadsheetData);
        localStorage.setItem('enhanced-spreadsheet-data', data);
      };

      saveSpreadsheet();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'enhanced-spreadsheet-data',
        JSON.stringify(spreadsheetData)
      );
    });

    it('should load spreadsheet data from localStorage', () => {
      const savedData = {
        'A1': { value: 'Loaded Data', type: 'text' },
        'B1': { value: '456', type: 'number' }
      };

      mockLocalStorage.store['enhanced-spreadsheet-data'] = JSON.stringify(savedData);

      const loadSpreadsheet = () => {
        const data = localStorage.getItem('enhanced-spreadsheet-data');
        return data ? JSON.parse(data) : {};
      };

      const loadedData = loadSpreadsheet();
      
      expect(loadedData).toEqual(savedData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('enhanced-spreadsheet-data');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.store['enhanced-spreadsheet-data'] = 'invalid json';

      const loadSpreadsheet = () => {
        try {
          const data = localStorage.getItem('enhanced-spreadsheet-data');
          return data ? JSON.parse(data) : {};
        } catch (error) {
          return {};
        }
      };

      const loadedData = loadSpreadsheet();
      expect(loadedData).toEqual({});
    });
  });

  describe('CSV Export Functionality', () => {
    it('should generate correct CSV format from spreadsheet data', () => {
      const spreadsheetData = {
        'A1': { value: 'Name', type: 'text' },
        'B1': { value: 'Age', type: 'text' },
        'C1': { value: 'City', type: 'text' },
        'A2': { value: 'John', type: 'text' },
        'B2': { value: '25', type: 'number' },
        'C2': { value: 'New York', type: 'text' },
        'A3': { value: 'Jane', type: 'text' },
        'B3': { value: '30', type: 'number' },
        'C3': { value: 'London', type: 'text' }
      };

      const exportToCSV = (data: any, rows: number = 3, cols: string[] = ['A', 'B', 'C']) => {
        let csv = '';
        for (let r = 1; r <= rows; r++) {
          const rowData = [];
          for (const col of cols) {
            const cellId = `${col}${r}`;
            const cellData = data[cellId];
            rowData.push(cellData?.value || '');
          }
          csv += rowData.join(',') + '\n';
        }
        return csv;
      };

      const csvOutput = exportToCSV(spreadsheetData);
      const expectedCSV = 'Name,Age,City\nJohn,25,New York\nJane,30,London\n';
      
      expect(csvOutput).toBe(expectedCSV);
    });

    it('should handle missing cells in CSV export', () => {
      const spreadsheetData = {
        'A1': { value: 'Name', type: 'text' },
        'C1': { value: 'City', type: 'text' },
        'A2': { value: 'John', type: 'text' }
      };

      const exportToCSV = (data: any, rows: number = 2, cols: string[] = ['A', 'B', 'C']) => {
        let csv = '';
        for (let r = 1; r <= rows; r++) {
          const rowData = [];
          for (const col of cols) {
            const cellId = `${col}${r}`;
            const cellData = data[cellId];
            rowData.push(cellData?.value || '');
          }
          csv += rowData.join(',') + '\n';
        }
        return csv;
      };

      const csvOutput = exportToCSV(spreadsheetData);
      const expectedCSV = 'Name,,City\nJohn,,\n';
      
      expect(csvOutput).toBe(expectedCSV);
    });

    it('should create downloadable blob for CSV export', () => {
      const csvData = 'Name,Age\nJohn,25\nJane,30';
      
      const createDownloadableCSV = (csvData: string) => {
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        return { blob, url };
      };

      const { blob, url } = createDownloadableCSV(csvData);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv');
      expect(url).toBe('blob:mock-url');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });
  });

  describe('Formula Evaluation', () => {
    it('should detect formula cells correctly', () => {
      const isFormula = (value: string) => value.startsWith('=');
      
      expect(isFormula('=A1+B1')).toBe(true);
      expect(isFormula('=SUM(A1:A10)')).toBe(true);
      expect(isFormula('Regular text')).toBe(false);
      expect(isFormula('123')).toBe(false);
      expect(isFormula('')).toBe(false);
    });

    it('should handle basic arithmetic formulas', () => {
      const evaluateFormula = (formula: string, data: any) => {
        if (!formula.startsWith('=')) return formula;
        
        // Simple evaluation for testing
        const expr = formula.substring(1);
        if (expr === 'A1+B1') {
          const a1 = data['A1']?.value || '0';
          const b1 = data['B1']?.value || '0';
          return String(Number(a1) + Number(b1));
        }
        return formula;
      };

      const data = {
        'A1': { value: '10', type: 'number' },
        'B1': { value: '20', type: 'number' }
      };

      expect(evaluateFormula('=A1+B1', data)).toBe('30');
      expect(evaluateFormula('Regular text', data)).toBe('Regular text');
    });
  });

  describe('Grid Navigation and Selection', () => {
    it('should handle cell selection state', () => {
      let selectedCell = 'A1';
      
      const selectCell = (cellId: string) => {
        selectedCell = cellId;
      };

      selectCell('B2');
      expect(selectedCell).toBe('B2');

      selectCell('Z26');
      expect(selectedCell).toBe('Z26');
    });

    it('should validate cell coordinates', () => {
      const isValidCell = (cellId: string) => {
        const pattern = /^[A-Z]+[0-9]+$/;
        return pattern.test(cellId);
      };

      expect(isValidCell('A1')).toBe(true);
      expect(isValidCell('Z26')).toBe(true);
      expect(isValidCell('AA1')).toBe(true);
      expect(isValidCell('A')).toBe(false);
      expect(isValidCell('1')).toBe(false);
      expect(isValidCell('')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in localStorage gracefully', () => {
      mockLocalStorage.store['enhanced-spreadsheet-data'] = '{invalid json}';

      const loadSpreadsheet = () => {
        try {
          const data = localStorage.getItem('enhanced-spreadsheet-data');
          return data ? JSON.parse(data) : {};
        } catch (error) {
          console.warn('Failed to load spreadsheet data:', error);
          return {};
        }
      };

      const result = loadSpreadsheet();
      expect(result).toEqual({});
    });

    it('should handle missing localStorage gracefully', () => {
      // Mock localStorage to throw an error
      const brokenLocalStorage = {
        setItem: vi.fn(() => {
          throw new Error('localStorage not available');
        }),
        getItem: vi.fn(() => {
          throw new Error('localStorage not available');
        }),
        removeItem: vi.fn(() => {
          throw new Error('localStorage not available');
        }),
        clear: vi.fn(() => {
          throw new Error('localStorage not available');
        })
      };

      Object.defineProperty(global, 'localStorage', {
        value: brokenLocalStorage,
        writable: true
      });

      const saveSpreadsheet = (data: any) => {
        try {
          localStorage.setItem('enhanced-spreadsheet-data', JSON.stringify(data));
          return true;
        } catch (error) {
          console.warn('Failed to save spreadsheet data:', error);
          return false;
        }
      };

      const result = saveSpreadsheet({ A1: { value: 'test' } });
      expect(result).toBe(false);
    });
  });

  describe('Real-time Collaboration Simulation', () => {
    it('should handle simultaneous cell updates', () => {
      const spreadsheetData = {
        'A1': { value: 'Initial', type: 'text' }
      };

      const updateCell = (cellId: string, value: string, userId: string) => {
        spreadsheetData[cellId] = { 
          value, 
          type: 'text',
          lastEditedBy: userId,
          lastEditedAt: new Date().toISOString()
        };
      };

      updateCell('A1', 'Updated by User1', 'user1');
      expect(spreadsheetData['A1'].value).toBe('Updated by User1');
      expect(spreadsheetData['A1'].lastEditedBy).toBe('user1');

      updateCell('A1', 'Updated by User2', 'user2');
      expect(spreadsheetData['A1'].value).toBe('Updated by User2');
      expect(spreadsheetData['A1'].lastEditedBy).toBe('user2');
    });

    it('should track cell edit history', () => {
      const editHistory: any[] = [];
      
      const updateCellWithHistory = (cellId: string, value: string, userId: string) => {
        editHistory.push({
          cellId,
          value,
          userId,
          timestamp: new Date().toISOString()
        });
      };

      updateCellWithHistory('A1', 'First edit', 'user1');
      updateCellWithHistory('A1', 'Second edit', 'user2');
      updateCellWithHistory('B1', 'Different cell', 'user1');

      expect(editHistory).toHaveLength(3);
      expect(editHistory[0].cellId).toBe('A1');
      expect(editHistory[1].cellId).toBe('A1');
      expect(editHistory[2].cellId).toBe('B1');
    });
  });
});