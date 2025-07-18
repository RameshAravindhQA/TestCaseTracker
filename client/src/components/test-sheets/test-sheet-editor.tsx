import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { TestSheet } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Download,
  Upload,
  Save,
  RotateCcw,
  Copy,
  Clipboard,
  Scissors,
  Trash2,
  ChevronDown,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Calculator,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  Undo,
  Redo
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TestSheetEditorProps {
  sheet: TestSheet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface CellData {
  value: string;
  formula?: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderTop?: boolean;
    borderRight?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    numberFormat?: 'general' | 'number' | 'currency' | 'percentage' | 'date' | 'time';
  };
  dataValidation?: {
    type: 'list' | 'number' | 'date';
    criteria: any;
  };
  note?: string;
}

interface ChartConfig {
  id: string;
  type: 'bar' | 'column' | 'line' | 'pie' | 'area' | 'scatter';
  range: string;
  title: string;
  position: { row: number; col: number };
}

const COLUMN_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const getColumnLabel = (index: number): string => {
  if (index < 26) return COLUMN_LABELS[index];
  const firstChar = Math.floor(index / 26) - 1;
  const secondChar = index % 26;
  return COLUMN_LABELS[firstChar] + COLUMN_LABELS[secondChar];
};

const parseFormula = (formula: string, cells: Record<string, CellData>): number => {
  if (!formula.startsWith('=')) return parseFloat(formula) || 0;

  let expression = formula.slice(1);

  // Replace cell references with actual values
  expression = expression.replace(/[A-Z]+\d+/g, (cellRef) => {
    const cell = cells[cellRef];
    return cell ? (parseFloat(cell.value) || 0).toString() : '0';
  });

  // Handle SUM function
  if (expression.toUpperCase().includes('SUM(')) {
    expression = expression.replace(/SUM\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeSum(start, end, cells).toString();
      }
      return '0';
    });
  }

  // Handle AVERAGE function
  if (expression.toUpperCase().includes('AVERAGE(')) {
    expression = expression.replace(/AVERAGE\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeAverage(start, end, cells).toString();
      }
      return '0';
    });
  }

  // Handle COUNT function
  if (expression.toUpperCase().includes('COUNT(')) {
    expression = expression.replace(/COUNT\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeCount(start, end, cells).toString();
      }
      return '0';
    });
  }

  // Handle MIN function
  if (expression.toUpperCase().includes('MIN(')) {
    expression = expression.replace(/MIN\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeMin(start, end, cells).toString();
      }
      return '0';
    });
  }

  // Handle MAX function
  if (expression.toUpperCase().includes('MAX(')) {
    expression = expression.replace(/MAX\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeMax(start, end, cells).toString();
      }
      return '0';
    });
  }

  // Handle simple arithmetic operations
  try {
    // Use Function constructor instead of eval for safety
    return new Function('return ' + expression)();
  } catch {
    throw new Error('Invalid formula');
  }
};

const calculateRangeSum = (start: string, end: string, cells: Record<string, CellData>): number => {
  const range = getCellRange(start, end);
  return range.reduce((sum, cellKey) => {
    const cell = cells[cellKey];
    return sum + (cell ? (parseFloat(cell.value) || 0) : 0);
  }, 0);
};

const calculateRangeAverage = (start: string, end: string, cells: Record<string, CellData>): number => {
  const range = getCellRange(start, end);
  const sum = calculateRangeSum(start, end, cells);
  return range.length > 0 ? sum / range.length : 0;
};

const calculateRangeCount = (start: string, end: string, cells: Record<string, CellData>): number => {
  const range = getCellRange(start, end);
  return range.filter(cellKey => {
    const cell = cells[cellKey];
    return cell && cell.value !== '';
  }).length;
};

const calculateRangeMin = (start: string, end: string, cells: Record<string, CellData>): number => {
  const range = getCellRange(start, end);
  const values = range.map(cellKey => {
    const cell = cells[cellKey];
    return cell ? (parseFloat(cell.value) || 0) : 0;
  }).filter(val => !isNaN(val));
  return values.length > 0 ? Math.min(...values) : 0;
};

const calculateRangeMax = (start: string, end: string, cells: Record<string, CellData>): number => {
  const range = getCellRange(start, end);
  const values = range.map(cellKey => {
    const cell = cells[cellKey];
    return cell ? (parseFloat(cell.value) || 0) : 0;
  }).filter(val => !isNaN(val));
  return values.length > 0 ? Math.max(...values) : 0;
};

const getCellRange = (start: string, end: string): string[] => {
  const startCol = start.match(/[A-Z]+/)?.[0] || 'A';
  const startRow = parseInt(start.match(/\d+/)?.[0] || '1');
  const endCol = end.match(/[A-Z]+/)?.[0] || 'A';
  const endRow = parseInt(end.match(/\d+/)?.[0] || '1');
  
  const startColIndex = COLUMN_LABELS.indexOf(startCol);
  const endColIndex = COLUMN_LABELS.indexOf(endCol);
  
  const range: string[] = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startColIndex; col <= endColIndex; col++) {
      range.push(`${COLUMN_LABELS[col]}${row}`);
    }
  }
  return range;
};

const formatCellValue = (value: string, format?: CellData['format']): string => {
  if (!format?.numberFormat || format.numberFormat === 'general') return value;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;

  switch (format.numberFormat) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numValue);
    case 'percentage':
      return new Intl.NumberFormat('en-US', { style: 'percent' }).format(numValue / 100);
    case 'number':
      return new Intl.NumberFormat('en-US').format(numValue);
    case 'date':
      return new Date(numValue).toLocaleDateString();
    case 'time':
      return new Date(numValue).toLocaleTimeString();
    default:
      return value;
  }
};

export default function TestSheetEditor({ sheet, open, onOpenChange, onSave }: TestSheetEditorProps) {
  const { toast } = useToast();
  const [cells, setCells] = useState<Record<string, CellData>>({});
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: { row: number; col: number }; end: { row: number; col: number } } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [showFormulaSuggestions, setShowFormulaSuggestions] = useState(false);
  const [formulaSuggestions, setFormulaSuggestions] = useState<Array<{name: string, description: string, example: string}>>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [showCellSuggestions, setShowCellSuggestions] = useState(false);
  const [cellSuggestions, setCellSuggestions] = useState<string[]>([]);
  const [sheetTabs, setSheetTabs] = useState([{ id: 'sheet1', name: 'Sheet1', active: true }]);
  const [activeSheet, setActiveSheet] = useState('sheet1');
  const [frozenRows, setFrozenRows] = useState(0);
  const [frozenCols, setFrozenCols] = useState(0);
  const [hiddenRows, setHiddenRows] = useState<Set<number>>(new Set());
  const [hiddenCols, setHiddenCols] = useState<Set<number>>(new Set());
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [namedRanges, setNamedRanges] = useState<Record<string, string>>({});
  const [filterRange, setFilterRange] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<{ column: number; direction: 'asc' | 'desc' } | null>(null);
  const [history, setHistory] = useState<Record<string, CellData>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<{ cells: Record<string, CellData>; range: { start: { row: number; col: number }; end: { row: number; col: number } } } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceTerm, setReplaceTerm] = useState('');

  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formulaBarRef = useRef<HTMLInputElement>(null);

  // Formula suggestions data
  const FORMULA_FUNCTIONS = [
    { name: 'SUM', description: 'Adds all numbers in a range of cells', example: 'SUM(A1:A10)' },
    { name: 'AVERAGE', description: 'Returns the average of numbers in a range', example: 'AVERAGE(A1:A10)' },
    { name: 'COUNT', description: 'Counts the number of cells that contain numbers', example: 'COUNT(A1:A10)' },
    { name: 'COUNTA', description: 'Counts non-empty cells in a range', example: 'COUNTA(A1:A10)' },
    { name: 'MAX', description: 'Returns the largest value in a range', example: 'MAX(A1:A10)' },
    { name: 'MIN', description: 'Returns the smallest value in a range', example: 'MIN(A1:A10)' },
    { name: 'IF', description: 'Returns one value if condition is true, another if false', example: 'IF(A1>10, "High", "Low")' },
    { name: 'CONCATENATE', description: 'Joins several text strings into one', example: 'CONCATENATE(A1, " ", B1)' },
    { name: 'LEFT', description: 'Returns leftmost characters from text', example: 'LEFT(A1, 5)' },
    { name: 'RIGHT', description: 'Returns rightmost characters from text', example: 'RIGHT(A1, 3)' },
    { name: 'MID', description: 'Returns characters from middle of text', example: 'MID(A1, 2, 4)' },
    { name: 'LEN', description: 'Returns the length of text', example: 'LEN(A1)' },
    { name: 'UPPER', description: 'Converts text to uppercase', example: 'UPPER(A1)' },
    { name: 'LOWER', description: 'Converts text to lowercase', example: 'LOWER(A1)' },
    { name: 'ROUND', description: 'Rounds a number to specified digits', example: 'ROUND(A1, 2)' },
    { name: 'POWER', description: 'Returns number raised to a power', example: 'POWER(A1, 2)' },
    { name: 'SQRT', description: 'Returns the square root of a number', example: 'SQRT(A1)' },
    { name: 'ABS', description: 'Returns absolute value of a number', example: 'ABS(A1)' },
    { name: 'TODAY', description: 'Returns current date', example: 'TODAY()' },
    { name: 'NOW', description: 'Returns current date and time', example: 'NOW()' },
    { name: 'YEAR', description: 'Returns the year from a date', example: 'YEAR(A1)' },
    { name: 'MONTH', description: 'Returns the month from a date', example: 'MONTH(A1)' },
    { name: 'DAY', description: 'Returns the day from a date', example: 'DAY(A1)' },
    { name: 'AND', description: 'Returns TRUE if all conditions are true', example: 'AND(A1>5, B1<10)' },
    { name: 'OR', description: 'Returns TRUE if any condition is true', example: 'OR(A1>5, B1<10)' },
    { name: 'NOT', description: 'Reverses the logic of a condition', example: 'NOT(A1>5)' }
  ];

  const rows = sheet.data.rows || 100;
  const cols = sheet.data.cols || 26;

  useEffect(() => {
    if (sheet.data.cells) {
      setCells(sheet.data.cells);
    }
  }, [sheet]);

  const getCellKey = (row: number, col: number) => `${getColumnLabel(col)}${row + 1}`;

  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    if (event.shiftKey && selectedCell) {
      // Range selection
      setSelectedRange({
        start: selectedCell,
        end: { row, col }
      });
    } else {
      // Save current editing cell before switching
      if (editingCell && (editingCell.row !== row || editingCell.col !== col)) {
        setEditingCell(null);
      }
      
      setSelectedCell({ row, col });
      setSelectedRange(null);
      const cellKey = getCellKey(row, col);
      const cellData = cells[cellKey];
      setFormulaBarValue(cellData?.formula || cellData?.value || '');
      
      // Single-click editing - start editing immediately
      setTimeout(() => {
        setEditingCell({ row, col });
      }, 100);
    }
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    // Keep double-click as alternative for formula editing
    setEditingCell({ row, col });
    const cellKey = getCellKey(row, col);
    const cellData = cells[cellKey];
    if (inputRef.current) {
      inputRef.current.value = cellData?.formula || cellData?.value || '';
      inputRef.current.focus();
      inputRef.current.select(); // Select all text for easy replacement
    }
  };

  const updateCell = useCallback((row: number, col: number, updates: Partial<CellData>) => {
    const cellKey = getCellKey(row, col);
    setCells(prev => {
      // Add to history before making changes
      setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(i => i + 1);

      const currentCell = prev[cellKey] || { value: '', format: {} };
      const newCell = { ...currentCell, ...updates };
      
      // If it's a formula, calculate the result
      if (newCell.formula && newCell.formula.startsWith('=')) {
        try {
          const result = parseFormula(newCell.formula, prev);
          newCell.value = result.toString();
        } catch (error) {
          newCell.value = '#ERROR';
        }
      }

      return {
        ...prev,
        [cellKey]: newCell
      };
    });
  }, [historyIndex]);

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    
    // Handle formula suggestions
    if (value.startsWith('=')) {
      const formulaText = value.slice(1).toUpperCase();
      const lastWord = formulaText.split(/[^A-Z]/).pop() || '';
      
      // Show function suggestions
      if (lastWord && /^[A-Z]+$/.test(lastWord)) {
        const suggestions = FORMULA_FUNCTIONS.filter(func => 
          func.name.startsWith(lastWord)
        );
        setFormulaSuggestions(suggestions);
        setShowFormulaSuggestions(suggestions.length > 0);
        setSelectedSuggestionIndex(0);
      } else {
        setShowFormulaSuggestions(false);
      }
      
      // Show cell reference suggestions
      const cellRefMatch = formulaText.match(/([A-Z]*)(\d*)$/);
      if (cellRefMatch && cellRefMatch[1]) {
        const colPrefix = cellRefMatch[1];
        const rowPrefix = cellRefMatch[2];
        const suggestions: string[] = [];
        
        // Generate cell suggestions
        for (let col = 0; col < Math.min(cols, 10); col++) {
          const colLetter = getColumnLabel(col);
          if (colLetter.startsWith(colPrefix)) {
            for (let row = 1; row <= Math.min(rows, 20); row++) {
              if (!rowPrefix || row.toString().startsWith(rowPrefix)) {
                suggestions.push(`${colLetter}${row}`);
              }
            }
          }
        }
        
        setCellSuggestions(suggestions.slice(0, 10));
        setShowCellSuggestions(suggestions.length > 0);
      } else {
        setShowCellSuggestions(false);
      }
    } else {
      setShowFormulaSuggestions(false);
      setShowCellSuggestions(false);
    }

    if (selectedCell) {
      const isFormula = value.startsWith('=');
      if (isFormula) {
        updateCell(selectedCell.row, selectedCell.col, {
          formula: value,
          value: value // Will be calculated in updateCell
        });
      } else {
        updateCell(selectedCell.row, selectedCell.col, {
          value: value,
          formula: undefined
        });
      }
    }
  };

  const insertFormulaSuggestion = (suggestion: any) => {
    if (!selectedCell) return;
    
    const currentValue = formulaBarValue;
    const formulaText = currentValue.slice(1);
    const lastWordMatch = formulaText.match(/[A-Z]*$/);
    
    if (lastWordMatch) {
      const beforeLastWord = formulaText.slice(0, lastWordMatch.index);
      const newValue = `=${beforeLastWord}${suggestion.name}(`;
      setFormulaBarValue(newValue);
      setShowFormulaSuggestions(false);
      
      // Focus back to formula bar and position cursor
      if (formulaBarRef.current) {
        formulaBarRef.current.focus();
        setTimeout(() => {
          if (formulaBarRef.current) {
            formulaBarRef.current.setSelectionRange(newValue.length, newValue.length);
          }
        }, 0);
      }
    }
  };

  const insertCellSuggestion = (cellRef: string) => {
    if (!selectedCell) return;
    
    const currentValue = formulaBarValue;
    const formulaText = currentValue.slice(1);
    const cellRefMatch = formulaText.match(/([A-Z]*)(\d*)$/);
    
    if (cellRefMatch) {
      const beforeCellRef = formulaText.slice(0, cellRefMatch.index);
      const newValue = `=${beforeCellRef}${cellRef}`;
      setFormulaBarValue(newValue);
      setShowCellSuggestions(false);
      
      // Focus back to formula bar
      if (formulaBarRef.current) {
        formulaBarRef.current.focus();
        setTimeout(() => {
          if (formulaBarRef.current) {
            formulaBarRef.current.setSelectionRange(newValue.length, newValue.length);
          }
        }, 0);
      }
    }
  };

  const handleFormulaBarKeyDown = (e: React.KeyboardEvent) => {
    if (showFormulaSuggestions && formulaSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < formulaSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : formulaSuggestions.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertFormulaSuggestion(formulaSuggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowFormulaSuggestions(false);
      }
    } else if (showCellSuggestions && cellSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < cellSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : cellSuggestions.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertCellSuggestion(cellSuggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowCellSuggestions(false);
      }
    } else if (e.key === 'Enter' && selectedCell) {
      const isFormula = formulaBarValue.startsWith('=');
      updateCell(selectedCell.row, selectedCell.col, {
        value: formulaBarValue,
        formula: isFormula ? formulaBarValue : undefined
      });
    }
  };

  const applyFormat = (formatUpdates: Partial<CellData['format']>) => {
    if (selectedRange) {
      const { start, end } = selectedRange;
      for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
        for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col++) {
          const cellKey = getCellKey(row, col);
          updateCell(row, col, {
            format: { ...cells[cellKey]?.format, ...formatUpdates }
          });
        }
      }
    } else if (selectedCell) {
      const cellKey = getCellKey(selectedCell.row, selectedCell.col);
      updateCell(selectedCell.row, selectedCell.col, {
        format: { ...cells[cellKey]?.format, ...formatUpdates }
      });
    }
  };

  const insertRowOrColumn = (type: 'row' | 'column', index: number) => {
    // Implementation for inserting rows/columns
    toast({
      title: `${type === 'row' ? 'Row' : 'Column'} inserted`,
      description: `New ${type} added at position ${index + 1}`,
    });
  };

  const deleteRowOrColumn = (type: 'row' | 'column', index: number) => {
    // Implementation for deleting rows/columns
    toast({
      title: `${type === 'row' ? 'Row' : 'Column'} deleted`,
      description: `${type} at position ${index + 1} has been removed`,
    });
  };

  const copyRange = () => {
    if (selectedRange) {
      const { start, end } = selectedRange;
      const copiedCells: Record<string, CellData> = {};
      for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
        for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col++) {
          const cellKey = getCellKey(row, col);
          if (cells[cellKey]) {
            copiedCells[cellKey] = cells[cellKey];
          }
        }
      }
      setClipboard({ cells: copiedCells, range: selectedRange });
      toast({ title: "Copied", description: "Range copied to clipboard" });
    }
  };

  const pasteRange = () => {
    if (clipboard && selectedCell) {
      const offsetRow = selectedCell.row - clipboard.range.start.row;
      const offsetCol = selectedCell.col - clipboard.range.start.col;

      Object.entries(clipboard.cells).forEach(([originalKey, cellData]) => {
        // Calculate new position
        // Implementation for pasting with offset
      });

      toast({ title: "Pasted", description: "Content pasted successfully" });
    }
  };

  const undo = () => {
    if (historyIndex >= 0) {
      setCells(history[historyIndex]);
      setHistoryIndex(i => i - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(i => i + 1);
      setCells(history[i + 1]);
    }
  };

  const searchAndReplace = () => {
    let replacements = 0;
    const newCells = { ...cells };

    Object.entries(newCells).forEach(([key, cellData]) => {
      if (cellData.value.includes(searchTerm)) {
        if (replaceMode) {
          newCells[key] = {
            ...cellData,
            value: cellData.value.replace(new RegExp(searchTerm, 'g'), replaceTerm)
          };
          replacements++;
        }
      }
    });

    if (replaceMode) {
      setCells(newCells);
      toast({
        title: "Replace complete",
        description: `${replacements} replacements made`,
      });
    }
  };

  const saveSheet = async () => {
    try {
      const updatedSheet = {
        ...sheet,
        data: {
          ...sheet.data,
          cells,
          charts,
          namedRanges,
          frozenRows,
          frozenCols
        },
        metadata: {
          ...sheet.metadata,
          version: sheet.metadata.version + 1,
          lastModifiedBy: 0, // Current user ID
        }
      };

      await apiRequest('PUT', `/api/test-sheets/${sheet.id}`, updatedSheet);

      toast({
        title: "Sheet saved",
        description: "Your changes have been saved successfully.",
      });

      onSave();
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save the sheet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const csvContent = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => {
        const cellKey = getCellKey(row, col);
        const cellData = cells[cellKey];
        return cellData ? `"${cellData.value.replace(/"/g, '""')}"` : '';
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>{sheet.name}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button size="sm" onClick={saveSheet}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="border-b p-2 space-y-2">
            {/* Formula Bar */}
            <div className="flex items-center gap-2 relative">
              <span className="text-sm font-medium">fx</span>
              <div className="flex-1 relative">
                <Input
                  ref={formulaBarRef}
                  value={formulaBarValue}
                  onChange={(e) => handleFormulaBarChange(e.target.value)}
                  onKeyDown={handleFormulaBarKeyDown}
                  placeholder="Enter formula or value (start with = for formulas)"
                  className="w-full"
                  autoComplete="off"
                />
                
                {/* Formula Function Suggestions */}
                {showFormulaSuggestions && formulaSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                    <div className="p-2 border-b bg-gray-50 text-xs text-gray-600 font-medium">
                      Functions - Press Tab or Enter to insert
                    </div>
                    {formulaSuggestions.map((func, index) => (
                      <div 
                        key={func.name}
                        className={`px-3 py-2 cursor-pointer text-sm border-l-2 ${
                          index === selectedSuggestionIndex 
                            ? 'bg-blue-50 border-blue-500' 
                            : 'hover:bg-gray-50 border-transparent'
                        }`}
                        onClick={() => insertFormulaSuggestion(func)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-600">{func.name}</span>
                          <span className="text-xs text-gray-400">{func.example}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{func.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cell Reference Suggestions */}
                {showCellSuggestions && cellSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-48 bg-white border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    <div className="p-2 border-b bg-gray-50 text-xs text-gray-600 font-medium">
                      Cell References
                    </div>
                    {cellSuggestions.map((cellRef, index) => (
                      <div 
                        key={cellRef}
                        className={`px-3 py-1 cursor-pointer text-sm ${
                          index === selectedSuggestionIndex 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => insertCellSuggestion(cellRef)}
                      >
                        {cellRef}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Font formatting */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormat({ bold: true })}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormat({ italic: true })}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormat({ underline: true })}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Alignment */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormat({ textAlign: 'left' })}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormat({ textAlign: 'center' })}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormat({ textAlign: 'right' })}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Number Format */}
              <Select onValueChange={(value) => applyFormat({ numberFormat: value as any })}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6" />

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={undo}>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={redo}>
                  <Redo className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={copyRange}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={pasteRange}>
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Search */}
              <div className="flex items-center gap-1">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-32"
                />
                {replaceMode && (
                  <Input
                    placeholder="Replace..."
                    value={replaceTerm}
                    onChange={(e) => setReplaceTerm(e.target.value)}
                    className="w-32"
                  />
                )}
                <Button size="sm" variant="outline" onClick={() => setReplaceMode(!replaceMode)}>
                  {replaceMode ? 'Search' : 'Replace'}
                </Button>
                <Button size="sm" variant="outline" onClick={searchAndReplace}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Spreadsheet Grid */}
          <div className="flex-1 overflow-auto" ref={gridRef}>
            <div className="inline-block min-w-full">
              {/* Column Headers */}
              <div className="flex sticky top-0 bg-gray-50 border-b z-10">
                <div className="w-12 h-8 border-r bg-gray-100 flex items-center justify-center text-xs font-medium">

                </div>
                {Array.from({ length: cols }, (_, col) => (
                  <div
                    key={col}
                    className="w-24 h-8 border-r bg-gray-50 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-gray-100"
                    onClick={() => handleCellClick(-1, col, {} as React.MouseEvent)}
                  >
                    {getColumnLabel(col)}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="flex">
                  {/* Row Header */}
                  <div
                    className="w-12 h-8 border-r border-b bg-gray-50 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-gray-100"
                    onClick={() => handleCellClick(row, -1, {} as React.MouseEvent)}
                  >
                    {row + 1}
                  </div>

                  {/* Cells */}
                  {Array.from({ length: cols }, (_, col) => {
                    const cellKey = getCellKey(row, col);
                    const cellData = cells[cellKey];
                    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
                    const isInRange = selectedRange && 
                      row >= Math.min(selectedRange.start.row, selectedRange.end.row) &&
                      row <= Math.max(selectedRange.start.row, selectedRange.end.row) &&
                      col >= Math.min(selectedRange.start.col, selectedRange.end.col) &&
                      col <= Math.max(selectedRange.start.col, selectedRange.end.col);

                    const cellValue = cellData ? formatCellValue(cellData.value, cellData.format) : '';
                    const minWidth = Math.max(80, cellValue.length * 7 + 16); // Auto-expand based on content

                    return (
                      <div
                        key={col}
                        className={cn(
                          "h-8 border-r border-b flex items-center px-1 cursor-cell text-xs relative group",
                          isSelected && "bg-blue-100 border-blue-500 ring-2 ring-blue-500",
                          isInRange && "bg-blue-50",
                          cellData?.format?.backgroundColor && `bg-${cellData.format.backgroundColor}`,
                          cellData?.format?.bold && "font-bold",
                          cellData?.format?.italic && "italic",
                          cellData?.format?.underline && "underline",
                          "hover:bg-gray-50 transition-colors"
                        )}
                        style={{
                          width: Math.max(96, minWidth), // Dynamic width
                          textAlign: cellData?.format?.textAlign || 'left',
                          color: cellData?.format?.fontColor,
                          fontSize: cellData?.format?.fontSize ? `${cellData.format.fontSize}px` : '12px',
                          whiteSpace: 'pre-wrap', // Text wrapping
                          wordBreak: 'break-word'
                        }}
                        onClick={(e) => handleCellClick(row, col, e)}
                        onDoubleClick={() => handleCellDoubleClick(row, col)}
                      >
                        {editingCell?.row === row && editingCell?.col === col ? (
                          <input
                            ref={inputRef}
                            className="w-full h-full bg-transparent border-none outline-none text-xs px-1"
                            defaultValue={cellData?.formula || cellData?.value || ''}
                            autoFocus
                            onBlur={(e) => {
                              const value = e.target.value;
                              const isFormula = value.startsWith('=');
                              updateCell(row, col, {
                                value: isFormula ? value : value,
                                formula: isFormula ? value : undefined
                              });
                              setEditingCell(null);
                              setFormulaBarValue(value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const value = (e.target as HTMLInputElement).value;
                                const isFormula = value.startsWith('=');
                                updateCell(row, col, {
                                  value: isFormula ? value : value,
                                  formula: isFormula ? value : undefined
                                });
                                setEditingCell(null);
                                setFormulaBarValue(value);
                                
                                // Move to next row (Google Sheets behavior)
                                if (row < rows - 1) {
                                  setSelectedCell({ row: row + 1, col });
                                  setTimeout(() => setEditingCell({ row: row + 1, col }), 100);
                                }
                              } else if (e.key === 'Tab') {
                                e.preventDefault();
                                const value = (e.target as HTMLInputElement).value;
                                const isFormula = value.startsWith('=');
                                updateCell(row, col, {
                                  value: isFormula ? value : value,
                                  formula: isFormula ? value : undefined
                                });
                                setEditingCell(null);
                                setFormulaBarValue(value);
                                
                                // Move to next column (Google Sheets behavior)
                                if (col < cols - 1) {
                                  setSelectedCell({ row, col: col + 1 });
                                  setTimeout(() => setEditingCell({ row, col: col + 1 }), 100);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingCell(null);
                              } else if (e.key === 'ArrowUp' && !e.ctrlKey) {
                                e.preventDefault();
                                if (row > 0) {
                                  setSelectedCell({ row: row - 1, col });
                                  setEditingCell(null);
                                }
                              } else if (e.key === 'ArrowDown' && !e.ctrlKey) {
                                e.preventDefault();
                                if (row < rows - 1) {
                                  setSelectedCell({ row: row + 1, col });
                                  setEditingCell(null);
                                }
                              } else if (e.key === 'ArrowLeft' && !e.ctrlKey && (e.target as HTMLInputElement).selectionStart === 0) {
                                e.preventDefault();
                                if (col > 0) {
                                  setSelectedCell({ row, col: col - 1 });
                                  setEditingCell(null);
                                }
                              } else if (e.key === 'ArrowRight' && !e.ctrlKey && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length) {
                                e.preventDefault();
                                if (col < cols - 1) {
                                  setSelectedCell({ row, col: col + 1 });
                                  setEditingCell(null);
                                }
                              }
                            }}
                            onChange={(e) => {
                              // Real-time auto-save as user types
                              const value = e.target.value;
                              setFormulaBarValue(value);
                            }}
                          />
                        ) : (
                          <span 
                            className="block w-full h-full min-h-[20px] whitespace-pre-wrap"
                            style={{ overflowWrap: 'break-word' }}
                            draggable={!!cellData?.value}
                            onDragStart={(e) => {
                              if (cellData) {
                                e.dataTransfer.setData('text/plain', cellData.value);
                                e.dataTransfer.setData('application/x-cell-data', JSON.stringify({
                                  row, col, value: cellData.value, formula: cellData.formula
                                }));
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.parentElement?.classList.add('bg-green-50');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.parentElement?.classList.remove('bg-green-50');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.parentElement?.classList.remove('bg-green-50');
                              
                              const cellDataStr = e.dataTransfer.getData('application/x-cell-data');
                              if (cellDataStr) {
                                try {
                                  const draggedData = JSON.parse(cellDataStr);
                                  if (draggedData.formula) {
                                    // Auto-adjust formula references when dragging
                                    const rowDiff = row - draggedData.row;
                                    const colDiff = col - draggedData.col;
                                    let adjustedFormula = draggedData.formula;
                                    
                                    // Simple formula adjustment for cell references
                                    adjustedFormula = adjustedFormula.replace(/([A-Z]+)(\d+)/g, (match: string, colRef: string, rowRef: string) => {
                                      const origCol = COLUMN_LABELS.indexOf(colRef);
                                      const origRow = parseInt(rowRef);
                                      const newCol = Math.max(0, origCol + colDiff);
                                      const newRow = Math.max(1, origRow + rowDiff);
                                      return `${COLUMN_LABELS[newCol] || 'A'}${newRow}`;
                                    });
                                    
                                    updateCell(row, col, {
                                      formula: adjustedFormula,
                                      value: adjustedFormula
                                    });
                                  } else {
                                    updateCell(row, col, {
                                      value: draggedData.value
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error parsing dragged cell data:', error);
                                }
                              } else {
                                const text = e.dataTransfer.getData('text/plain');
                                if (text) {
                                  updateCell(row, col, { value: text });
                                }
                              }
                            }}
                          >
                            {cellValue}
                            
                            {/* Auto-fill handle */}
                            {isSelected && (
                              <div 
                                className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 cursor-crosshair opacity-75 hover:opacity-100"
                                style={{ transform: 'translate(50%, 50%)' }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  // Auto-fill functionality
                                  console.log('Auto-fill started from', row, col);
                                }}
                              />
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Sheet Tabs */}
          <div className="border-t p-2 flex items-center gap-2">
            {sheetTabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "px-3 py-1 text-sm rounded border",
                  tab.active ? "bg-blue-100 border-blue-300" : "bg-gray-50 border-gray-300"
                )}
                onClick={() => setActiveSheet(tab.id)}
              >
                {tab.name}
              </button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newTab = {
                  id: `sheet${sheetTabs.length + 1}`,
                  name: `Sheet${sheetTabs.length + 1}`,
                  active: false
                };
                setSheetTabs([...sheetTabs, newTab]);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}