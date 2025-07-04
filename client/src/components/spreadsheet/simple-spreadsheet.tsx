import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Download, Upload, FileSpreadsheet, Copy, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CellData {
  value: string;
  formula?: string;
  isNumber?: boolean;
}

interface SpreadsheetData {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cells: Record<string, CellData>;
  createdAt: string;
  updatedAt: string;
}

interface SimpleSpreadsheetProps {
  projectId?: number;
  initialData?: SpreadsheetData;
  readOnly?: boolean;
  rows?: number;
  cols?: number;
  onSave?: (data: SpreadsheetData) => void;
}

export function SimpleSpreadsheet({ 
  projectId, 
  initialData, 
  readOnly = false,
  rows = 20,
  cols = 10,
  onSave
}: SimpleSpreadsheetProps) {
  const [data, setData] = useState<SpreadsheetData>(() => ({
    id: initialData?.id || `sheet-${Date.now()}`,
    name: initialData?.name || 'New Spreadsheet',
    rows: initialData?.rows || rows,
    cols: initialData?.cols || cols,
    cells: initialData?.cells || {},
    createdAt: initialData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const [selectedCell, setSelectedCell] = useState<string>('0-0');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [spreadsheetName, setSpreadsheetName] = useState(data.name);
  const [clipboard, setClipboard] = useState<string>('');
  const [dragState, setDragState] = useState({
    isDragging: false,
    startCell: null,
    currentFormula: '',
    operation: null
  });
  const [selectedRange, setSelectedRange] = useState([]);
  const [isQuickEntryMode, setIsQuickEntryMode] = useState(false);

  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Column labels (A, B, C, ...)
  const getColumnLabel = (index: number): string => {
    let result = '';
    let num = index;
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    }
    return result;
  };

  // Get cell key
  const getCellKey = (row: number, col: number): string => `${row}-${col}`;

  // Get cell reference (A1, B2, etc.)
  const getCellRef = (row: number, col: number): string => `${getColumnLabel(col)}${row + 1}`;

  // Parse cell reference to row/col
  const parseCellRef = (ref: string): { row: number; col: number } | null => {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;

    const colStr = match[1];
    const rowNum = parseInt(match[2]) - 1;

    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1;

    return { row: rowNum, col };
  };

  // Get cell value
  const getCellValue = useCallback((row: number, col: number): string => {
    const key = getCellKey(row, col);
    return data.cells[key]?.value || '';
  }, [data.cells]);

  // Check if value is a number
  const isNumeric = (value: string): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
  };

  // Evaluate formula
  const evaluateFormula = useCallback((formula: string): string => {
    try {
      if (!formula.startsWith('=')) return formula;

      let expression = formula.substring(1).trim();

      // Replace cell references with their values
      expression = expression.replace(/[A-Z]+\d+/g, (cellRef) => {
        const parsed = parseCellRef(cellRef);
        if (!parsed) return '0';

        const cellValue = getCellValue(parsed.row, parsed.col);
        if (cellValue === '') return '0';
        if (isNumeric(cellValue)) return cellValue;
        return '0';
      });

      // Handle SUM function
      expression = expression.replace(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/gi, (match, start, end) => {
        const startCell = parseCellRef(start);
        const endCell = parseCellRef(end);

        if (!startCell || !endCell) return '0';

        let sum = 0;
        for (let r = Math.min(startCell.row, endCell.row); r <= Math.max(startCell.row, endCell.row); r++) {
          for (let c = Math.min(startCell.col, endCell.col); c <= Math.max(startCell.col, endCell.col); c++) {
            const val = getCellValue(r, c);
            if (isNumeric(val)) {
              sum += parseFloat(val);
            }
          }
        }
        return sum.toString();
      });

      // Handle AVERAGE function
      expression = expression.replace(/AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)/gi, (match, start, end) => {
        const startCell = parseCellRef(start);
        const endCell = parseCellRef(end);

        if (!startCell || !endCell) return '0';

        let sum = 0;
        let count = 0;
        for (let r = Math.min(startCell.row, endCell.row); r <= Math.max(startCell.row, endCell.row); r++) {
          for (let c = Math.min(startCell.col, endCell.col); c <= Math.max(startCell.col, endCell.col); c++) {
            const val = getCellValue(r, c);
            if (isNumeric(val)) {
              sum += parseFloat(val);
              count++;
            }
          }
        }
        return count > 0 ? (sum / count).toString() : '0';
      });

      // Evaluate the expression safely
      const result = Function(`"use strict"; return (${expression})`)();
      return typeof result === 'number' ? result.toString() : result;
    } catch (error) {
      return '#ERROR';
    }
  }, [getCellValue]);

  // Set cell value
  const setCellValue = useCallback((row: number, col: number, value: string) => {
    const key = getCellKey(row, col);
    let displayValue = value;
    let formula = undefined;

    if (value.startsWith('=')) {
      formula = value;
      displayValue = evaluateFormula(value);
    }

    setData(prev => ({
      ...prev,
      cells: {
        ...prev.cells,
        [key]: {
          value: displayValue,
          formula: formula,
          isNumber: isNumeric(displayValue)
        }
      },
      updatedAt: new Date().toISOString()
    }));
  }, [evaluateFormula]);

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (readOnly) return;
    const key = getCellKey(row, col);
    setSelectedCell(key);
    setEditingCell(null);
  };

  // Handle cell double click
  const handleCellDoubleClick = (row: number, col: number) => {
    if (readOnly) return;
    const key = getCellKey(row, col);
    const cellData = data.cells[key];
    setEditingCell(key);
    setEditValue(cellData?.formula || getCellValue(row, col));
    setSelectedCell(key);
  };

  // Handle edit completion
  const handleEditComplete = (row: number, col: number) => {
    setCellValue(row, col, editValue);
    setEditingCell(null);
    setEditValue('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (readOnly) return;

    const key = getCellKey(row, col);

    if (editingCell === key) {
      if (e.key === 'Enter') {
        handleEditComplete(row, col);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setEditingCell(null);
        setEditValue('');
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'Enter':
        setEditingCell(key);
        const cellData = data.cells[key];
        setEditValue(cellData?.formula || getCellValue(row, col));
        e.preventDefault();
        break;
      case 'Delete':
      case 'Backspace':
        setCellValue(row, col, '');
        e.preventDefault();
        break;
      case 'ArrowUp':
        if (row > 0) setSelectedCell(getCellKey(row - 1, col));
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (row < data.rows - 1) setSelectedCell(getCellKey(row + 1, col));
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (col > 0) setSelectedCell(getCellKey(row, col - 1));
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (col < data.cols - 1) setSelectedCell(getCellKey(row, col + 1));
        e.preventDefault();
        break;
      case 'Tab':
        const nextCol = e.shiftKey ? Math.max(0, col - 1) : Math.min(data.cols - 1, col + 1);
        setSelectedCell(getCellKey(row, nextCol));
        e.preventDefault();
        break;
    }
  };

  // Copy cell
  const copyCell = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell.split('-').map(Number);
    const cellData = data.cells[selectedCell];
    setClipboard(cellData?.formula || getCellValue(row, col));
    toast({ title: "Copied", description: "Cell content copied" });
  };

  // Paste cell
  const pasteCell = () => {
    if (!selectedCell || !clipboard) return;
    const [row, col] = selectedCell.split('-').map(Number);
    setCellValue(row, col, clipboard);
    toast({ title: "Pasted", description: "Content pasted" });
  };

  // Save spreadsheet
  const saveSpreadsheet = () => {
    const updatedData = {
      ...data,
      name: spreadsheetName,
      updatedAt: new Date().toISOString()
    };

    if (onSave) {
      onSave(updatedData);
    } else {
      localStorage.setItem(`spreadsheet-${updatedData.id}`, JSON.stringify(updatedData));
    }

    setData(updatedData);
    setShowSaveDialog(false);
    toast({ title: "Saved", description: `Spreadsheet "${spreadsheetName}" saved` });
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvRows: string[] = [];

    for (let row = 0; row < data.rows; row++) {
      const csvRow: string[] = [];
      for (let col = 0; col < data.cols; col++) {
        const value = getCellValue(row, col);
        csvRow.push(`"${value.replace(/"/g, '""')}"`);
      }
      csvRows.push(csvRow.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "Spreadsheet exported to CSV" });
  };

  // Focus on edit input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const selectedCellCoords = selectedCell ? selectedCell.split('-').map(Number) : [0, 0];
  const selectedCellRef = getCellRef(selectedCellCoords[0], selectedCellCoords[1]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold">{data.name}</h2>
            <div className="text-xs text-gray-500">
              Formulas: =A1+B1, =SUM(A1:A5), =AVERAGE(A1:A5)
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={copyCell} disabled={!selectedCell}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>

            <Button variant="outline" size="sm" onClick={pasteCell} disabled={!clipboard}>
              <span className="h-4 w-4 mr-2">📋</span>
              Paste
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>

            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {selectedCell && (
          <div className="flex items-center gap-4 text-sm">
            <div className="text-gray-600 min-w-[60px]">
              Cell: {selectedCellRef}
            </div>
            <div className="flex-1">
              <div className="text-gray-500 text-xs mb-1">Formula Bar:</div>
              <div className="font-mono text-sm bg-gray-50 px-2 py-1 rounded border min-h-[28px] flex items-center">
                {(() => {
                  const cellData = data.cells[selectedCell];
                  return cellData?.formula || cellData?.value || '';
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto">
        <table ref={tableRef} className="border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium sticky left-0 z-10"></th>
              {Array.from({ length: data.cols }, (_, col) => (
                <th key={col} className="min-w-[100px] h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-center">
                  {getColumnLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: data.rows }, (_, row) => (
              <tr key={row}>
                <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-center text-xs font-medium sticky left-0 z-10">
                  {row + 1}
                </td>
                {Array.from({ length: data.cols }, (_, col) => {
                  const key = getCellKey(row, col);
                  const isSelected = selectedCell === key;
                  const isEditing = editingCell === key;
                  const value = getCellValue(row, col);
                  const cellData = data.cells[key];

                  return (
                    <td
                      key={col}
                      className={`min-w-[100px] h-8 border border-gray-300 p-0 relative ${
                        isSelected ? 'bg-blue-100 border-blue-500 border-2' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleCellClick(row, col)}
                      onDoubleClick={() => handleCellDoubleClick(row, col)}
                    >
                      {isEditing ? (
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEditComplete(row, col)}
                          onKeyDown={(e) => handleKeyDown(e, row, col)}
                          className="w-full h-8 border-0 rounded-none focus:ring-0 focus:border-0 bg-white"
                        />
                      ) : (
                        <div
                          className={`w-full h-8 px-2 flex items-center text-sm cursor-cell ${
                            cellData?.isNumber ? 'text-right' : 'text-left'
                          }`}
                          onKeyDown={(e) => handleKeyDown(e, row, col)}
                          tabIndex={0}
                        >
                          {value}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Spreadsheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Spreadsheet Name</label>
              <Input
                value={spreadsheetName}
                onChange={(e) => setSpreadsheetName(e.target.value)}
                placeholder="Enter spreadsheet name..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveSpreadsheet}>
                Save Spreadsheet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SimpleSpreadsheet;