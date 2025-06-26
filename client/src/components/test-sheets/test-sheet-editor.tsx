import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Save, Download, Upload, Undo, Redo, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Palette, Lock, Unlock, X, FileSpreadsheet, Grid3X3, Square, Edit2, Check, BarChart3, Minus } from 'lucide-react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Enhanced cell data structure
interface CellData {
  id: string;
  value: any;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'formula';
  formula?: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    textColor?: string;
  };
  validation?: {
    type: 'list' | 'number' | 'date';
    options?: string[];
    min?: number;
    max?: number;
  };
  width?: number;
  height?: number;
  locked?: boolean;
}

interface TestSheetData {
  id: string;
  name: string;
  projectId: number;
  cells: Record<string, CellData>;
  columns: Array<{ id: string; name: string; width: number; frozen?: boolean }>;
  rows: Array<{ id: string; height: number; frozen?: boolean }>;
  frozenCols?: number;
  frozenRows?: number;
}

interface TestSheetEditorProps {
  projectId: number;
  sheetId?: string;
  onSave?: (sheet: TestSheetData) => void;
}

// Formula engine for basic calculations
class FormulaEngine {
  static evaluate(formula: string, cells: Record<string, CellData>): any {
    try {
      if (!formula.startsWith('=')) return formula;

      const expression = formula.substring(1);

      // Handle basic functions
      if (expression.toUpperCase().startsWith('SUM(')) {
        return this.evaluateSum(expression, cells);
      }
      if (expression.toUpperCase().startsWith('AVERAGE(')) {
        return this.evaluateAverage(expression, cells);
      }
      if (expression.toUpperCase().startsWith('COUNT(')) {
        return this.evaluateCount(expression, cells);
      }

      // Handle simple cell references and arithmetic
      const cellRefRegex = /([A-Z]+)(\d+)/g;
      let processedExpression = expression;

      processedExpression = processedExpression.replace(cellRefRegex, (match, col, row) => {
        const cellId = `${col}${row}`;
        const cell = cells[cellId];
        return cell ? (typeof cell.value === 'number' ? cell.value : 0) : 0;
      });

      // Evaluate basic arithmetic
      return Function('"use strict"; return (' + processedExpression + ')')();
    } catch (error) {
      return '#ERROR';
    }
  }

  static evaluateSum(expression: string, cells: Record<string, CellData>): number {
    const range = this.extractRange(expression);
    return this.sumRange(range, cells);
  }

  static evaluateAverage(expression: string, cells: Record<string, CellData>): number {
    const range = this.extractRange(expression);
    const sum = this.sumRange(range, cells);
    const count = this.countRange(range, cells);
    return count > 0 ? sum / count : 0;
  }

  static evaluateCount(expression: string, cells: Record<string, CellData>): number {
    const range = this.extractRange(expression);
    return this.countRange(range, cells);
  }

  static extractRange(expression: string): string {
    const match = expression.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
  }

  static sumRange(range: string, cells: Record<string, CellData>): number {
    const cellIds = this.expandRange(range);
    return cellIds.reduce((sum, cellId) => {
      const cell = cells[cellId];
      const value = cell ? parseFloat(cell.value) : 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  }

  static countRange(range: string, cells: Record<string, CellData>): number {
    const cellIds = this.expandRange(range);
    return cellIds.filter(cellId => {
      const cell = cells[cellId];
      return cell && cell.value !== null && cell.value !== undefined && cell.value !== '';
    }).length;
  }

  static expandRange(range: string): string[] {
    if (range.includes(':')) {
      const [start, end] = range.split(':');
      return this.getCellsInRange(start, end);
    }
    return [range];
  }

  static getCellsInRange(start: string, end: string): string[] {
    const startCol = start.match(/[A-Z]+/)?.[0] || 'A';
    const startRow = parseInt(start.match(/\d+/)?.[0] || '1');
    const endCol = end.match(/[A-Z]+/)?.[0] || 'A';
    const endRow = parseInt(end.match(/\d+/)?.[0] || '1');

    const cells: string[] = [];
    const startColNum = this.columnToNumber(startCol);
    const endColNum = this.columnToNumber(endCol);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startColNum; col <= endColNum; col++) {
        cells.push(`${this.numberToColumn(col)}${row}`);
      }
    }

    return cells;
  }

  static columnToNumber(column: string): number {
    let result = 0;
    for (let i = 0; i < column.length; i++) {
      result = result * 26 + (column.charCodeAt(i) - 65 + 1);
    }
    return result;
  }

  static numberToColumn(number: number): string {
    let result = '';
    while (number > 0) {
      number--;
      result = String.fromCharCode(65 + (number % 26)) + result;
      number = Math.floor(number / 26);
    }
    return result;
  }
}

export default function TestSheetEditor({ projectId, sheetId, onSave }: TestSheetEditorProps) {
  const [sheet, setSheet] = useState<TestSheetData | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [history, setHistory] = useState<TestSheetData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'fill' | 'move'>('select');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize default sheet structure
  const initializeSheet = useCallback(() => {
    const columns = Array.from({ length: 26 }, (_, i) => ({
      id: String.fromCharCode(65 + i),
      name: String.fromCharCode(65 + i),
      width: 120
    }));

    const rows = Array.from({ length: 100 }, (_, i) => ({
      id: (i + 1).toString(),
      height: 28
    }));

    const newSheet: TestSheetData = {
      id: sheetId || 'new',
      name: 'Test Sheet',
      projectId,
      cells: {},
      columns,
      rows,
      frozenCols: 0,
      frozenRows: 1
    };

    // Initialize header row
    columns.forEach((col) => {
      const cellId = `${col.id}1`;
      newSheet.cells[cellId] = {
        id: cellId,
        value: `Header ${col.id}`,
        type: 'text',
        style: {
          bold: true,
          backgroundColor: '#f3f4f6',
          align: 'center'
        }
      };
    });

    setSheet(newSheet);
    addToHistory(newSheet);
  }, [projectId, sheetId]);

  // Load existing sheet
  const { data: existingSheet, isLoading } = useQuery({
    queryKey: [`/api/test-sheets/${sheetId}`],
    enabled: !!sheetId,
    onSuccess: (data) => {
      setSheet(data);
      addToHistory(data);
    }
  });

  useEffect(() => {
    if (sheetId && existingSheet) {
      setSheet(existingSheet);
    } else if (!sheetId) {
      initializeSheet();
    }
  }, [sheetId, existingSheet, initializeSheet]);

  // History management
  const addToHistory = useCallback((newSheet: TestSheetData) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...newSheet });
      if (newHistory.length > 50) newHistory.shift(); // Limit history
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setSheet(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setSheet(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Cell operations
  const getCellId = useCallback((col: string, row: string) => `${col}${row}`, []);

  const getCell = useCallback((cellId: string): CellData => {
    return sheet?.cells[cellId] || {
      id: cellId,
      value: '',
      type: 'text'
    };
  }, [sheet]);

  const updateCell = useCallback((cellId: string, updates: Partial<CellData>) => {
    if (!sheet) return;

    const newSheet = { ...sheet };
    newSheet.cells[cellId] = {
      ...getCell(cellId),
      ...updates
    };

    // Recalculate formulas
    Object.keys(newSheet.cells).forEach(id => {
      const cell = newSheet.cells[id];
      if (cell.formula) {
        cell.value = FormulaEngine.evaluate(cell.formula, newSheet.cells);
      }
    });

    setSheet(newSheet);
    addToHistory(newSheet);
  }, [sheet, getCell, addToHistory]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedCell || !sheet) return;

    const [col, row] = [selectedCell.match(/[A-Z]+/)?.[0] || 'A', parseInt(selectedCell.match(/\d+/)?.[0] || '1')];
    const colIndex = FormulaEngine.columnToNumber(col) - 1;

    switch (e.key) {
      case 'ArrowUp':
        if (row > 1) {
          setSelectedCell(`${col}${row - 1}`);
        }
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (row < sheet.rows.length) {
          setSelectedCell(`${col}${row + 1}`);
        }
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (colIndex > 0) {
          setSelectedCell(`${FormulaEngine.numberToColumn(colIndex)}${row}`);
        }
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (colIndex < sheet.columns.length - 1) {
          setSelectedCell(`${FormulaEngine.numberToColumn(colIndex + 2)}${row}`);
        }
        e.preventDefault();
        break;
      case 'Enter':
        if (isEditing) {
          handleCellSave();
        } else {
          startEditing();
        }
        e.preventDefault();
        break;
      case 'Tab':
        if (colIndex < sheet.columns.length - 1) {
          setSelectedCell(`${FormulaEngine.numberToColumn(colIndex + 2)}${row}`);
        }
        e.preventDefault();
        break;
      case 'Escape':
        if (isEditing) {
          setIsEditing(false);
          setEditValue('');
        }
        e.preventDefault();
        break;
      case 'Delete':
      case 'Backspace':
        if (!isEditing) {
          updateCell(selectedCell, { value: '', formula: undefined });
        }
        e.preventDefault();
        break;
      default:
        if (!isEditing && e.key.length === 1) {
          startEditing(e.key);
        }
    }
  }, [selectedCell, sheet, isEditing]);

  // Edit operations
  const startEditing = useCallback((initialValue?: string) => {
    if (!selectedCell) return;

    const cell = getCell(selectedCell);
    setIsEditing(true);
    setEditValue(initialValue || cell.formula || cell.value?.toString() || '');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [selectedCell, getCell]);

  const handleCellSave = useCallback(() => {
    if (!selectedCell) return;

    const isFormula = editValue.startsWith('=');
    const updates: Partial<CellData> = {
      value: isFormula ? FormulaEngine.evaluate(editValue, sheet?.cells || {}) : editValue,
      type: detectCellType(editValue)
    };

    if (isFormula) {
      updates.formula = editValue;
    }

    updateCell(selectedCell, updates);
    setIsEditing(false);
    setEditValue('');
  }, [selectedCell, editValue, sheet, updateCell]);

  // Auto-detect cell type
  const detectCellType = (value: string): CellData['type'] => {
    if (value.startsWith('=')) return 'formula';
    if (!isNaN(Number(value)) && value !== '') return 'number';
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'checkbox';
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'date';
    return 'text';
  };

  // Drag and drop for auto-fill
  const handleMouseDown = useCallback((cellId: string, e: React.MouseEvent) => {
    setSelectedCell(cellId);
    setDragStart(cellId);
    setIsDragging(true);

    if (e.detail === 2) { // Double click
      startEditing();
    }
  }, [startEditing]);

  const handleMouseEnter = useCallback((cellId: string) => {
    if (isDragging && dragStart) {
      // Update selection range
      const range = getCellRange(dragStart, cellId);
      setSelectedRange(range);
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && selectedRange.length > 1) {
      // Auto-fill logic
      autoFillCells(selectedRange);
    }
    setIsDragging(false);
    setDragStart(null);
    setSelectedRange([]);
  }, [isDragging, selectedRange]);

  // Auto-fill implementation
  const autoFillCells = useCallback((range: string[]) => {
    if (!sheet || range.length < 2) return;

    const firstCell = getCell(range[0]);
    const pattern = detectPattern(range.slice(0, 2).map(id => getCell(id)));

    range.slice(1).forEach((cellId, index) => {
      const newValue = generateAutoFillValue(firstCell.value, pattern, index + 1);
      updateCell(cellId, { value: newValue, type: firstCell.type });
    });
  }, [sheet, getCell, updateCell]);

  const detectPattern = (cells: CellData[]): 'sequence' | 'copy' => {
    if (cells.length < 2) return 'copy';

    const first = parseFloat(cells[0].value);
    const second = parseFloat(cells[1].value);

    if (!isNaN(first) && !isNaN(second) && second === first + 1) {
      return 'sequence';
    }

    return 'copy';
  };

  const generateAutoFillValue = (baseValue: any, pattern: 'sequence' | 'copy', step: number) => {
    if (pattern === 'sequence' && !isNaN(Number(baseValue))) {
      return Number(baseValue) + step;
    }
    return baseValue;
  };

  const getCellRange = (start: string, end: string): string[] => {
    return FormulaEngine.getCellsInRange(start, end);
  };

  // Style operations
  const applyCellStyle = useCallback((styleUpdates: Partial<CellData['style']>) => {
    if (!selectedCell) return;

    const cell = getCell(selectedCell);
    updateCell(selectedCell, {
      style: { ...cell.style, ...styleUpdates }
    });
  }, [selectedCell, getCell, updateCell]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (sheetData: TestSheetData) => {
      const res = await apiRequest(
        sheetData.id === 'new' ? 'POST' : 'PUT',
        sheetData.id === 'new' ? '/api/test-sheets' : `/api/test-sheets/${sheetData.id}`,
        sheetData
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Test sheet saved successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-sheets'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to save: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const handleSave = useCallback(() => {
    if (sheet) {
      saveMutation.mutate(sheet);
      onSave?.(sheet);
    }
  }, [sheet, saveMutation, onSave]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!sheet) {
    return <div>No sheet data available</div>;
  }

  return (
    <div className="w-full h-full flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
          <Redo className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-2" />

        <Button variant="outline" size="sm" onClick={() => applyCellStyle({ bold: !getCell(selectedCell || '').style?.bold })}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyCellStyle({ italic: !getCell(selectedCell || '').style?.italic })}>
          <Italic className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={() => applyCellStyle({ align: 'left' })}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyCellStyle({ align: 'center' })}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyCellStyle({ align: 'right' })}>
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-2" />

        <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-1" />
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Formula bar */}
      {selectedCell && (
        <div className="border-b p-2 flex items-center gap-2">
          <Badge variant="outline">{selectedCell}</Badge>
          <Input
            ref={inputRef}
            value={isEditing ? editValue : (getCell(selectedCell).formula || getCell(selectedCell).value?.toString() || '')}
            onChange={(e) => setEditValue(e.target.value)}
            onFocus={() => startEditing()}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellSave();
              } else if (e.key === 'Escape') {
                setIsEditing(false);
                setEditValue('');
              }
            }}
            className="flex-1"
            placeholder="Enter value or formula (start with =)"
          />
        </div>
      )}

      {/* Spreadsheet grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="relative">
          {/* Column headers */}
          <div className="sticky top-0 z-20 bg-gray-50 border-b flex">
            <div className="w-12 h-8 border-r bg-gray-100 flex items-center justify-center text-xs font-medium">
              {/* Corner cell */}
            </div>
            {sheet.columns.map((col) => (
              <div
                key={col.id}
                className="border-r bg-gray-50 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-gray-100"
                style={{ width: col.width, minWidth: col.width }}
              >
                {col.name}
              </div>
            ))}
          </div>

          {/* Rows */}
          {sheet.rows.map((row) => (
            <div key={row.id} className="flex border-b">
              {/* Row header */}
              <div
                className="w-12 border-r bg-gray-50 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-gray-100"
                style={{ height: row.height }}
              >
                {row.id}
              </div>

              {/* Cells */}
              {sheet.columns.map((col) => {
                const cellId = getCellId(col.id, row.id);
                const cell = getCell(cellId);
                const isSelected = selectedCell === cellId;
                const isInRange = selectedRange.includes(cellId);

                return (
                  <div
                    key={cellId}
                    className={cn(
                      "border-r flex items-center px-2 cursor-cell relative",
                      isSelected && "ring-2 ring-blue-500 bg-blue-50",
                      isInRange && "bg-blue-100",
                      cell.style?.bold && "font-bold",
                      cell.style?.italic && "italic"
                    )}
                    style={{
                      width: col.width,
                      height: row.height,
                      backgroundColor: isSelected ? undefined : cell.style?.backgroundColor,
                      color: cell.style?.textColor,
                      textAlign: cell.style?.align || 'left'
                    }}
                    onMouseDown={(e) => handleMouseDown(cellId, e)}
                    onMouseEnter={() => handleMouseEnter(cellId)}
                    onMouseUp={handleMouseUp}
                  >
                    {cell.type === 'checkbox' ? (
                      <Checkbox
                        checked={cell.value === true || cell.value === 'true'}
                        onCheckedChange={(checked) => updateCell(cellId, { value: checked })}
                      />
                    ) : cell.type === 'date' ? (
                      <DatePicker
                        date={cell.value ? new Date(cell.value) : undefined}
                        onSelect={(date) => updateCell(cellId, { value: date?.toISOString().split('T')[0] })}
                      />
                    ) : (
                      <span className="truncate w-full">
                        {cell.value?.toString() || ''}
                      </span>
                    )}

                    {/* Resize handle */}
                    {isSelected && (
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 cursor-se-resize" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
        <div>
          {selectedCell && `Selected: ${selectedCell}`}
          {selectedRange.length > 1 && ` | Range: ${selectedRange.length} cells`}
        </div>
        <div>
          {sheet.rows.length} rows × {sheet.columns.length} columns
        </div>
      </div>
    </div>
  );
}