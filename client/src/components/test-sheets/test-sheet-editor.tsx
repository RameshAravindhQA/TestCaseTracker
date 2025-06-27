import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TestSheet } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  Download, 
  Upload, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Merge,
  Split,
  Plus,
  Minus,
  Calculator,
  SortAsc,
  SortDesc,
  Filter,
  Search,
  Copy,
  Clipboard,
  Undo,
  Redo,
  X
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TestSheetEditorProps {
  sheet: TestSheet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

interface CellData {
  value: string;
  formula?: string;
  style?: CellStyle;
  validation?: DataValidation;
}

interface CellStyle {
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  color?: string;
  border?: string;
  fontSize?: number;
}

interface DataValidation {
  type: 'list' | 'date' | 'number' | 'custom';
  criteria?: string[];
  min?: number;
  max?: number;
  formula?: string;
}

interface SheetData {
  cells: Record<string, CellData>;
  rows: number;
  cols: number;
  sheets: SheetTab[];
  activeSheet: number;
}

interface SheetTab {
  id: string;
  name: string;
  color?: string;
}

const TestSheetEditor: React.FC<TestSheetEditorProps> = ({
  sheet,
  open,
  onOpenChange,
  onSave,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gridRef = useRef<HTMLDivElement>(null);

  // State management
  const [sheetData, setSheetData] = useState<SheetData>({
    cells: sheet.data?.cells || {},
    rows: sheet.data?.rows || 100,
    cols: sheet.data?.cols || 26,
    sheets: sheet.data?.sheets || [{ id: 'sheet1', name: 'Sheet1' }],
    activeSheet: 0,
  });

  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [selectedRange, setSelectedRange] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [formulaBar, setFormulaBar] = useState<string>('');
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [clipboard, setClipboard] = useState<Record<string, CellData>>({});
  const [history, setHistory] = useState<SheetData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCriteria, setFilterCriteria] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<string | null>(null);
  const [showFormulaSuggestions, setShowFormulaSuggestions] = useState(false);
  const [formulaSuggestions, setFormulaSuggestions] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);

  // Column helpers
  const getColumnName = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  const getColumnIndex = (name: string): number => {
    let result = 0;
    for (let i = 0; i < name.length; i++) {
      result = result * 26 + (name.charCodeAt(i) - 64);
    }
    return result - 1;
  };

  const getCellId = (row: number, col: number): string => {
    return `${getColumnName(col)}${row + 1}`;
  };

  // Enhanced formula engine with Google Sheets-like functions
  const evaluateFormula = useCallback((formula: string, cellId: string): string => {
    try {
      if (!formula.startsWith('=')) return formula;

      const expression = formula.substring(1);

      // Handle SUM function
      if (expression.startsWith('SUM(')) {
        const range = expression.match(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/);
        if (range) {
          const [, start, end] = range;
          const values = getRangeValues(start, end);
          return values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toString();
        }
      }

      // Handle AVERAGE function
      if (expression.startsWith('AVERAGE(')) {
        const range = expression.match(/AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)/);
        if (range) {
          const [, start, end] = range;
          const values = getRangeValues(start, end);
          const sum = values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
          return (sum / values.length).toString();
        }
      }

      // Handle COUNT function
      if (expression.startsWith('COUNT(')) {
        const range = expression.match(/COUNT\(([A-Z]+\d+):([A-Z]+\d+)\)/);
        if (range) {
          const [, start, end] = range;
          const values = getRangeValues(start, end);
          return values.filter(val => !isNaN(parseFloat(val))).length.toString();
        }
      }

      // Handle MIN function
      if (expression.startsWith('MIN(')) {
        const range = expression.match(/MIN\(([A-Z]+\d+):([A-Z]+\d+)\)/);
        if (range) {
          const [, start, end] = range;
          const values = getRangeValues(start, end).map(v => parseFloat(v)).filter(v => !isNaN(v));
          return values.length > 0 ? Math.min(...values).toString() : '0';
        }
      }

      // Handle MAX function
      if (expression.startsWith('MAX(')) {
        const range = expression.match(/MAX\(([A-Z]+\d+):([A-Z]+\d+)\)/);
        if (range) {
          const [, start, end] = range;
          const values = getRangeValues(start, end).map(v => parseFloat(v)).filter(v => !isNaN(v));
          return values.length > 0 ? Math.max(...values).toString() : '0';
        }
      }

      // Handle ROUND function
      if (expression.startsWith('ROUND(')) {
        const match = expression.match(/ROUND\(([^,]+),\s*(\d+)\)/);
        if (match) {
          const [, valueExpr, digits] = match;
          const value = parseFloat(evaluateExpression(valueExpr));
          return Math.round(value * Math.pow(10, parseInt(digits))) / Math.pow(10, parseInt(digits)).toString();
        }
      }

      // Handle IF function
      if (expression.startsWith('IF(')) {
        const match = expression.match(/IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
        if (match) {
          const [, condition, trueValue, falseValue] = match;
          const conditionResult = evaluateExpression(condition);
          return conditionResult ? evaluateExpression(trueValue) : evaluateExpression(falseValue);
        }
      }

      return evaluateExpression(expression);
    } catch (error) {
      return '#ERROR!';
    }
  }, [sheetData.cells]);

  // Helper function to evaluate expressions
  const evaluateExpression = (expression: string): string => {
    try {
      // Handle cell references
      let processedExpression = expression;
      const cellReferences = expression.match(/[A-Z]+\d+/g);
      if (cellReferences) {
        cellReferences.forEach(ref => {
          const cellValue = sheetData.cells[ref]?.value || '0';
          processedExpression = processedExpression.replace(new RegExp(ref, 'g'), cellValue);
        });
      }

      // Evaluate safely
      const result = Function(`"use strict"; return (${processedExpression})`)();
      return result.toString();
    } catch (error) {
      throw new Error('Invalid expression');
    }
  };

  const getRangeValues = (start: string, end: string): string[] => {
    const values: string[] = [];
    const startCol = getColumnIndex(start.replace(/\d+/, ''));
    const startRow = parseInt(start.replace(/[A-Z]+/, '')) - 1;
    const endCol = getColumnIndex(end.replace(/\d+/, ''));
    const endRow = parseInt(end.replace(/[A-Z]+/, '')) - 1;

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellId = getCellId(row, col);
        values.push(sheetData.cells[cellId]?.value || '0');
      }
    }
    return values;
  };

  // Cell operations
  const updateCell = useCallback((cellId: string, value: string, formula?: string) => {
    setSheetData(prev => {
      const newData = {
        ...prev,
        cells: {
          ...prev.cells,
          [cellId]: {
            ...prev.cells[cellId],
            value,
            formula,
          }
        }
      };

      // Add to history
      setHistory(prevHistory => [...prevHistory.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(prev => prev + 1);

      return newData;
    });
  }, [historyIndex]);

  const formatCell = useCallback((cellId: string, style: Partial<CellStyle>) => {
    setSheetData(prev => ({
      ...prev,
      cells: {
        ...prev.cells,
        [cellId]: {
          ...prev.cells[cellId],
          style: {
            ...prev.cells[cellId]?.style,
            ...style,
          }
        }
      }
    }));
  }, []);

  const mergeCells = useCallback((range: string[]) => {
    if (range.length < 2) return;

    const firstCell = range[0];
    const mergedValue = range.map(cellId => sheetData.cells[cellId]?.value || '').join(' ');

    setSheetData(prev => {
      const newCells = { ...prev.cells };

      // Set the merged value in the first cell
      newCells[firstCell] = {
        ...newCells[firstCell],
        value: mergedValue,
        style: {
          ...newCells[firstCell]?.style,
          merged: range,
        }
      };

      // Clear other cells in the range
      range.slice(1).forEach(cellId => {
        delete newCells[cellId];
      });

      return { ...prev, cells: newCells };
    });
  }, [sheetData.cells]);

  const addRow = useCallback(() => {
    setSheetData(prev => ({ ...prev, rows: prev.rows + 1 }));
  }, []);

  const addColumn = useCallback(() => {
    setSheetData(prev => ({ ...prev, cols: prev.cols + 1 }));
  }, []);

  const deleteRow = useCallback((rowIndex: number) => {
    setSheetData(prev => {
      const newCells = { ...prev.cells };

      // Remove cells in the deleted row
      Object.keys(newCells).forEach(cellId => {
        const row = parseInt(cellId.replace(/[A-Z]+/, '')) - 1;
        if (row === rowIndex) {
          delete newCells[cellId];
        } else if (row > rowIndex) {
          // Shift cells up
          const col = cellId.replace(/\d+/, '');
          const newCellId = `${col}${row}`;
          newCells[newCellId] = newCells[cellId];
          delete newCells[cellId];
        }
      });

      return {
        ...prev,
        cells: newCells,
        rows: Math.max(1, prev.rows - 1),
      };
    });
  }, []);

  const deleteColumn = useCallback((colIndex: number) => {
    setSheetData(prev => {
      const newCells = { ...prev.cells };

      // Remove cells in the deleted column
      Object.keys(newCells).forEach(cellId => {
        const col = getColumnIndex(cellId.replace(/\d+/, ''));
        if (col === colIndex) {
          delete newCells[cellId];
        } else if (col > colIndex) {
          // Shift cells left
          const row = cellId.replace(/[A-Z]+/, '');
          const newCellId = `${getColumnName(col - 1)}${row}`;
          newCells[newCellId] = newCells[cellId];
          delete newCells[cellId];
        }
      });

      return {
        ...prev,
        cells: newCells,
        cols: Math.max(1, prev.cols - 1),
      };
    });
  }, []);

  // Sort and filter
  const sortColumn = useCallback((colIndex: number, ascending: boolean = true) => {
    const columnCells: Array<{ cellId: string; value: string; rowIndex: number }> = [];

    for (let row = 0; row < sheetData.rows; row++) {
      const cellId = getCellId(row, colIndex);
      const cell = sheetData.cells[cellId];
      if (cell) {
        columnCells.push({ cellId, value: cell.value, rowIndex: row });
      }
    }

    columnCells.sort((a, b) => {
      const aVal = isNaN(parseFloat(a.value)) ? a.value : parseFloat(a.value);
      const bVal = isNaN(parseFloat(b.value)) ? b.value : parseFloat(b.value);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return ascending ? aVal - bVal : bVal - aVal;
      } else {
        return ascending ? 
          aVal.toString().localeCompare(bVal.toString()) :
          bVal.toString().localeCompare(aVal.toString());
      }
    });

    // Rearrange all rows based on the sort
    setSheetData(prev => {
      const newCells = { ...prev.cells };
      const rowMapping: Record<number, number> = {};

      columnCells.forEach((cell, index) => {
        rowMapping[cell.rowIndex] = index;
      });

      // Create new cell mapping
      const rearrangedCells: Record<string, CellData> = {};
      Object.keys(newCells).forEach(cellId => {
        const row = parseInt(cellId.replace(/[A-Z]+/, '')) - 1;
        const col = cellId.replace(/\d+/, '');
        const newRow = rowMapping[row];
        if (newRow !== undefined) {
          const newCellId = `${col}${newRow + 1}`;
          rearrangedCells[newCellId] = newCells[cellId];
        }
      });

      return { ...prev, cells: rearrangedCells };
    });
  }, [sheetData]);

  // Copy and paste
  const copySelection = useCallback(() => {
    const copiedCells: Record<string, CellData> = {};
    selectedRange.forEach(cellId => {
      if (sheetData.cells[cellId]) {
        copiedCells[cellId] = { ...sheetData.cells[cellId] };
      }
    });
    setClipboard(copiedCells);

    toast({
      title: "Copied",
      description: `Copied ${Object.keys(copiedCells).length} cells`,
    });
  }, [selectedRange, sheetData.cells, toast]);

  const pasteSelection = useCallback(() => {
    if (Object.keys(clipboard).length === 0) return;

    const startCell = selectedCell;
    const startCol = getColumnIndex(startCell.replace(/\d+/, ''));
    const startRow = parseInt(startCell.replace(/[A-Z]+/, '')) - 1;

    setSheetData(prev => {
      const newCells = { ...prev.cells };

      Object.keys(clipboard).forEach(originalCellId => {
        const originalCol = getColumnIndex(originalCellId.replace(/\d+/, ''));
        const originalRow = parseInt(originalCellId.replace(/[A-Z]+/, '')) - 1;

        const newCol = startCol + (originalCol - getColumnIndex(Object.keys(clipboard)[0].replace(/\d+/, '')));
        const newRow = startRow + (originalRow - (parseInt(Object.keys(clipboard)[0].replace(/[A-Z]+/, '')) - 1));

        if (newCol >= 0 && newCol < prev.cols && newRow >= 0 && newRow < prev.rows) {
          const newCellId = getCellId(newRow, newCol);
          newCells[newCellId] = { ...clipboard[originalCellId] };
        }
      });

      return { ...prev, cells: newCells };
    });

    toast({
      title: "Pasted",
      description: `Pasted ${Object.keys(clipboard).length} cells`,
    });
  }, [clipboard, selectedCell, toast]);

  // Undo and redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setSheetData(history[historyIndex - 1]);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setSheetData(history[historyIndex + 1]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // Save mutation
  const saveSheetMutation = useMutation({
    mutationFn: async (data: SheetData) => {
      const response = await apiRequest("PUT", `/api/test-sheets/${sheet.id}`, {
        data,
        metadata: {
          ...sheet.metadata,
          lastModifiedBy: 1, // Current user
          version: sheet.metadata.version + 1,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to save sheet");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Saved",
        description: "Sheet saved successfully",
      });
      onSave?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save sheet: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Handle cell click - now supports single-click editing like Google Sheets
  const handleCellClick = useCallback((cellId: string, event: React.MouseEvent) => {
    if (event.shiftKey && selectedCell) {
      // Select range
      const startCol = getColumnIndex(selectedCell.replace(/\d+/, ''));
      const startRow = parseInt(selectedCell.replace(/[A-Z]+/, '')) - 1;
      const endCol = getColumnIndex(cellId.replace(/\d+/, ''));
      const endRow = parseInt(cellId.replace(/[A-Z]+/, '')) - 1;

      const range: string[] = [];
      for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
        for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
          range.push(getCellId(row, col));
        }
      }
      setSelectedRange(range);
    } else if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedRange(prev => 
        prev.includes(cellId) 
          ? prev.filter(id => id !== cellId)
          : [...prev, cellId]
      );
    } else {
      // Single select and immediate edit mode like Google Sheets
      setSelectedCell(cellId);
      setSelectedRange([cellId]);
      setFormulaBar(sheetData.cells[cellId]?.formula || sheetData.cells[cellId]?.value || '');

      // Enable immediate editing on click
      setTimeout(() => {
        setEditingCell(cellId);
      }, 100);
    }
  }, [selectedCell, sheetData.cells]);

  // Handle cell double click for formula editing
  const handleCellDoubleClick = useCallback((cellId: string) => {
    setEditingCell(cellId);
    setFormulaBar(sheetData.cells[cellId]?.formula || sheetData.cells[cellId]?.value || '');
  }, [sheetData.cells]);

  // Handle cell edit
  const handleCellEdit = useCallback((cellId: string, value: string) => {
    if (value.startsWith('=')) {
      const evaluatedValue = evaluateFormula(value, cellId);
      updateCell(cellId, evaluatedValue, value);
    } else {
      updateCell(cellId, value);
    }
    setEditingCell(null);
  }, [evaluateFormula, updateCell]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'c':
            event.preventDefault();
            copySelection();
            break;
          case 'v':
            event.preventDefault();
            pasteSelection();
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 's':
            event.preventDefault();
            saveSheetMutation.mutate(sheetData);
            break;
        }
      }

      if (editingCell) return;

      // Navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const currentCol = getColumnIndex(selectedCell.replace(/\d+/, ''));
        const currentRow = parseInt(selectedCell.replace(/[A-Z]+/, '')) - 1;

        let newCol = currentCol;
        let newRow = currentRow;

        switch (event.key) {
          case 'ArrowUp':
            newRow = Math.max(0, currentRow - 1);
            break;
          case 'ArrowDown':
            newRow = Math.min(sheetData.rows - 1, currentRow + 1);
            break;
          case 'ArrowLeft':
            newCol = Math.max(0, currentCol - 1);
            break;
          case 'ArrowRight':
            newCol = Math.min(sheetData.cols - 1, currentCol + 1);
            break;
        }

        const newCellId = getCellId(newRow, newCol);
        setSelectedCell(newCellId);
        setSelectedRange([newCellId]);
        setFormulaBar(sheetData.cells[newCellId]?.formula || sheetData.cells[newCellId]?.value || '');
      }

      // Delete key
      if (event.key === 'Delete') {
        selectedRange.forEach(cellId => {
          updateCell(cellId, '');
        });
      }

      // Enter key
      if (event.key === 'Enter') {
        setEditingCell(selectedCell);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedCell, selectedRange, editingCell, sheetData, copySelection, pasteSelection, undo, redo, saveSheetMutation, updateCell]);

  // Export functions
  const exportToCSV = useCallback(() => {
    const csvContent = [];

    for (let row = 0; row < sheetData.rows; row++) {
      const rowData = [];
      for (let col = 0; col < sheetData.cols; col++) {
        const cellId = getCellId(row, col);
        const cellValue = sheetData.cells[cellId]?.value || '';
        rowData.push(`"${cellValue.replace(/"/g, '""')}"`);
      }
      csvContent.push(rowData.join(','));
    }

    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sheetData, sheet.name]);

  const exportToExcel = useCallback(() => {
    // This would require a library like xlsx
    toast({
      title: "Feature Coming Soon",
      description: "Excel export will be available in the next update",
    });
  }, [toast]);

  // Render toolbar
  const renderToolbar = () => (
    <div className="flex items-center gap-2 p-2 border-b bg-gray-50 dark:bg-gray-900">
      <Button size="sm" onClick={() => saveSheetMutation.mutate(sheetData)} disabled={saveSheetMutation.isPending}>
        <Save className="h-4 w-4 mr-1" />
        Save
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex <= 0}>
        <Undo className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
        <Redo className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="outline" onClick={() => formatCell(selectedCell, { fontWeight: 'bold' })}>
        <Bold className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => formatCell(selectedCell, { fontStyle: 'italic' })}>
        <Italic className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => formatCell(selectedCell, { textDecoration: 'underline' })}>
        <Underline className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="outline" onClick={() => formatCell(selectedCell, { textAlign: 'left' })}>
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => formatCell(selectedCell, { textAlign: 'center' })}>
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => formatCell(selectedCell, { textAlign: 'right' })}>
        <AlignRight className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline">
            <Palette className="h-4 w-4 mr-1" />
            Colors
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid grid-cols-8 gap-2">
            {['#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#374151', '#111827',
              '#fef2f2', '#fee2e2', '#fecaca', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
              '#fff7ed', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412',
              '#fefce8', '#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e',
              '#f0fff4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d',
              '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490',
              '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
              '#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'
            ].map(color => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: color }}
                onClick={() => formatCell(selectedCell, { backgroundColor: color })}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button size="sm" variant="outline" onClick={() => mergeCells(selectedRange)}>
        <Merge className="h-4 w-4 mr-1" />
        Merge
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="outline" onClick={addRow}>
        <Plus className="h-4 w-4 mr-1" />
        Row
      </Button>
      <Button size="sm" variant="outline" onClick={addColumn}>
        <Plus className="h-4 w-4 mr-1" />
        Column
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="outline" onClick={copySelection}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={pasteSelection}>
        <Clipboard className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline">
            <Calculator className="h-4 w-4 mr-1" />
            Functions
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="grid gap-2">
            <Button size="sm" variant="ghost" onClick={() => setFormulaBar(`=SUM(${selectedCell}:${selectedCell})`)}>
              SUM - Add numbers
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFormulaBar(`=AVERAGE(${selectedCell}:${selectedCell})`)}>
              AVERAGE - Calculate mean
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFormulaBar(`=COUNT(${selectedCell}:${selectedCell})`)}>
              COUNT - Count numbers
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFormulaBar(`=MIN(${selectedCell}:${selectedCell})`)}>
              MIN - Find minimum
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFormulaBar(`=MAX(${selectedCell}:${selectedCell})`)}>
              MAX - Find maximum
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFormulaBar(`=ROUND(${selectedCell},2)`)}>
              ROUND - Round number
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFormulaBar(`=IF(${selectedCell}>0,"Positive","Negative")`)}>
              IF - Conditional logic
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="outline" onClick={exportToCSV}>
        <Download className="h-4 w-4 mr-1" />
        CSV
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-40"
        />
        <Button size="sm" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render formula bar
  const renderFormulaBar = () => (
    <div className="flex items-center gap-2 p-2 border-b bg-white dark:bg-gray-950">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calculator className="h-4 w-4" />
        <span className="w-16">{selectedCell}</span>
      </div>
      <Input
        value={formulaBar}
        onChange={(e) => setFormulaBar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleCellEdit(selectedCell, formulaBar);
            setFormulaBar('');
          }
        }}
        placeholder="Enter value or formula (start with =)"
        className="flex-1"
      />
    </div>
  );

  // Handle drag start for cell selection
  const handleDragStart = useCallback((startCell: string, event: React.MouseEvent) => {
    if (event.shiftKey) return; // Don't start drag if shift is held

    setSelectedRange([startCell]);
    setSelectedCell(startCell);

    const handleMouseMove = (e: MouseEvent) => {
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element && element.dataset.cellId) {
        const endCell = element.dataset.cellId;
        const startCol = getColumnIndex(startCell.replace(/\d+/, ''));
        const startRow = parseInt(startCell.replace(/[A-Z]+/, '')) - 1;
        const endCol = getColumnIndex(endCell.replace(/\d+/, ''));
        const endRow = parseInt(endCell.replace(/[A-Z]+/, '')) - 1;

        const range: string[] = [];
        for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
          for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
            range.push(getCellId(row, col));
          }
        }
        setSelectedRange(range);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Auto-suggest formulas
  const getFormulaSuggestions = useCallback((input: string) => {
    if (!input.startsWith('=')) return [];

    const formulaStart = input.substring(1).toUpperCase();
    const suggestions = [
      'SUM(A1:A10)',
      'AVERAGE(A1:A10)',
      'COUNT(A1:A10)',
      'MIN(A1:A10)',
      'MAX(A1:A10)',
      'ROUND(A1,2)',
      'IF(A1>0,"Positive","Negative")'
    ].filter(formula => formula.startsWith(formulaStart));

    return suggestions;
  }, []);

  // Render grid
  const renderGrid = () => (
    <div className="flex-1 overflow-auto" ref={gridRef}>
      <div className="grid" style={{ 
        gridTemplateColumns: `40px repeat(${sheetData.cols}, minmax(120px, 1fr))`,
        gridTemplateRows: `30px repeat(${sheetData.rows}, auto)`,
      }}>
        {/* Corner cell */}
        <div className="border border-gray-300 bg-gray-100 dark:bg-gray-800"></div>

        {/* Column headers */}
        {Array.from({ length: sheetData.cols }, (_, i) => (
          <div
            key={`col-${i}`}
            className="border border-gray-300 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              // Select entire column
              const columnCells = Array.from({ length: sheetData.rows }, (_, row) => getCellId(row, i));
              setSelectedRange(columnCells);
            }}
          >
            <span>{getColumnName(i)}</span>
            <div className="ml-1 flex flex-col">
              <Button size="sm" variant="ghost" className="h-3 w-3 p-0" onClick={(e) => {
                e.stopPropagation();
                sortColumn(i, true);
              }}>
                <SortAsc className="h-2 w-2" />
              </Button>
              <Button size="sm" variant="ghost" className="h-3 w-3 p-0" onClick={(e) => {
                e.stopPropagation();
                sortColumn(i, false);
              }}>
                <SortDesc className="h-2 w-2" />
              </Button>
            </div>
          </div>
        ))}

        {/* Row headers and cells */}
        {Array.from({ length: sheetData.rows }, (_, row) => (
          <React.Fragment key={`row-${row}`}>
            {/* Row header */}
            <div
              className="border border-gray-300 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => {
                // Select entire row
                const rowCells = Array.from({ length: sheetData.cols }, (_, col) => getCellId(row, col));
                setSelectedRange(rowCells);
              }}
            >
              {row + 1}
            </div>

            {/* Cells */}
            {Array.from({ length: sheetData.cols }, (_, col) => {
              const cellId = getCellId(row, col);
              const cell = sheetData.cells[cellId];
              const isSelected = selectedRange.includes(cellId);
              const isEditing = editingCell === cellId;

              return (
                <div
                  key={cellId}
                  data-cell-id={cellId}
                  className={`border border-gray-300 relative min-h-[30px] ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : 'bg-white dark:bg-gray-950'} hover:bg-gray-50 dark:hover:bg-gray-900 resize-x overflow-hidden`}
                  style={{
                    fontWeight: cell?.style?.fontWeight,
                    fontStyle: cell?.style?.fontStyle,
                    textDecoration: cell?.style?.textDecoration,
                    textAlign: cell?.style?.textAlign,
                    backgroundColor: cell?.style?.backgroundColor,
                    color: cell?.style?.color,
                    fontSize: cell?.style?.fontSize,
                  }}
                  onClick={(e) => handleCellClick(cellId, e)}
                  onDoubleClick={() => handleCellDoubleClick(cellId)}
                  onMouseDown={(e) => handleDragStart(cellId, e)}
                >
                  {isEditing ? (
                    <div className="relative">
                      <Input
                        value={formulaBar}
                        onChange={(e) => setFormulaBar(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellEdit(cellId, formulaBar);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        onBlur={() => handleCellEdit(cellId, formulaBar)}
                        className="w-full h-full border-none p-1 text-xs"
                        autoFocus
                      />
                      {formulaBar.startsWith('=') && getFormulaSuggestions(formulaBar).length > 0 && (
                        <div className="absolute top-full left-0 bg-white border rounded shadow-lg z-50 min-w-[200px]">
                          {getFormulaSuggestions(formulaBar).map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="p-2 hover:bg-gray-100 cursor-pointer text-xs"
                              onClick={() => {
                                setFormulaBar(`=${suggestion}`);
                                handleCellEdit(cellId, `=${suggestion}`);
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-1 text-xs break-words whitespace-pre-wrap min-h-[24px]">
                      {cell?.value || ''}
                    </div>
                  )}

                  {isSelected && !isEditing && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 cursor-crosshair"></div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{sheet.name}</span>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[85vh]">
          {renderToolbar()}
          {renderFormulaBar()}

          {/* Sheet tabs */}
          <div className="flex items-center gap-2 p-2 border-b bg-gray-50 dark:bg-gray-900">
            {sheetData.sheets.map((sheetTab, index) => (
              <Button
                key={sheetTab.id}
                size="sm"
                variant={index === sheetData.activeSheet ? "default" : "ghost"}
                onClick={() => setSheetData(prev => ({ ...prev, activeSheet: index }))}
              >
                {sheetTab.name}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => {
              const newSheet = {
                id: `sheet${sheetData.sheets.length + 1}`,
                name: `Sheet${sheetData.sheets.length + 1}`,
              };
              setSheetData(prev => ({
                ...prev,
                sheets: [...prev.sheets, newSheet],
                activeSheet: prev.sheets.length,
              }));
            }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {renderGrid()}

          {/* Status bar */}
          <div className="flex items-center justify-between p-2 border-t bg-gray-50 dark:bg-gray-900 text-sm">
            <div className="flex items-center gap-4">
              <span>Selected: {selectedRange.length} cell(s)</span>
              {selectedRange.length > 1 && (
                <span>
                  Sum: {selectedRange.reduce((sum, cellId) => {
                    const value = parseFloat(sheetData.cells[cellId]?.value || '0');
                    return sum + (isNaN(value) ? 0 : value);
                  }, 0)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>{sheetData.rows} rows × {sheetData.cols} columns</span>
              <Badge variant="secondary">v{sheet.metadata.version}</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestSheetEditor;