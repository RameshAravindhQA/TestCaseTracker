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
  Redo,
  FileText,
  Image,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  SortAsc,
  SortDesc,
  Freeze,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Palette,
  Grid3X3,
  Merge,
  Split,
  WrapText,
  MoreHorizontal,
  Settings,
  Share,
  Print,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
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
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
    fontFamily?: string;
    fontColor?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    borderTop?: boolean;
    borderRight?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    numberFormat?: 'general' | 'number' | 'currency' | 'percentage' | 'date' | 'time' | 'text';
    wrapText?: boolean;
    indent?: number;
    rotation?: number;
  };
  dataValidation?: {
    type: 'list' | 'number' | 'date' | 'custom';
    criteria: any;
    showDropDown?: boolean;
    errorMessage?: string;
  };
  note?: string;
  hyperlink?: string;
  merged?: boolean;
  mergeRange?: string;
}

interface ChartConfig {
  id: string;
  type: 'bar' | 'column' | 'line' | 'pie' | 'area' | 'scatter' | 'doughnut';
  range: string;
  title: string;
  position: { row: number; col: number };
  size: { width: number; height: number };
  colors?: string[];
  showLegend?: boolean;
  showDataLabels?: boolean;
}

interface ConditionalFormat {
  id: string;
  range: string;
  type: 'cellValue' | 'colorScale' | 'dataBar' | 'iconSet';
  condition: any;
  format: Partial<CellData['format']>;
}

const COLUMN_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FONT_FAMILIES = ['Arial', 'Calibri', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana', 'Courier New'];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];
const NUMBER_FORMATS = [
  { value: 'general', label: 'General' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'text', label: 'Text' }
];

const getColumnLabel = (index: number): string => {
  if (index < 26) return COLUMN_LABELS[index];
  const firstChar = Math.floor(index / 26) - 1;
  const secondChar = index % 26;
  return COLUMN_LABELS[firstChar] + COLUMN_LABELS[secondChar];
};

const parseFormula = (formula: string, cells: Record<string, CellData>): any => {
  if (!formula.startsWith('=')) {
    const num = parseFloat(formula);
    return isNaN(num) ? formula : num;
  }

  let expression = formula.slice(1).trim();

  try {
    // Enhanced formula functions
    expression = expression.replace(/SUM\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeSum(start, end, cells).toString();
      }
      const cellRefs = range.split(',').map(ref => ref.trim());
      let sum = 0;
      cellRefs.forEach(cellRef => {
        const cell = cells[cellRef];
        if (cell && cell.value !== '') {
          const numValue = parseFloat(cell.value);
          if (!isNaN(numValue)) {
            sum += numValue;
          }
        }
      });
      return sum.toString();
    });

    expression = expression.replace(/AVERAGE\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeAverage(start, end, cells).toString();
      }
      const cellRefs = range.split(',').map(ref => ref.trim());
      let sum = 0;
      let count = 0;
      cellRefs.forEach(cellRef => {
        const cell = cells[cellRef];
        if (cell && cell.value !== '') {
          const numValue = parseFloat(cell.value);
          if (!isNaN(numValue)) {
            sum += numValue;
            count++;
          }
        }
      });
      return count > 0 ? (sum / count).toString() : '0';
    });

    expression = expression.replace(/COUNT\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeCount(start, end, cells).toString();
      }
      const cellRefs = range.split(',').map(ref => ref.trim());
      let count = 0;
      cellRefs.forEach(cellRef => {
        const cell = cells[cellRef];
        if (cell && cell.value !== '' && !isNaN(parseFloat(cell.value))) {
          count++;
        }
      });
      return count.toString();
    });

    expression = expression.replace(/MAX\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeMax(start, end, cells).toString();
      }
      const cellRefs = range.split(',').map(ref => ref.trim());
      let max = -Infinity;
      cellRefs.forEach(cellRef => {
        const cell = cells[cellRef];
        if (cell && cell.value !== '') {
          const numValue = parseFloat(cell.value);
          if (!isNaN(numValue)) {
            max = Math.max(max, numValue);
          }
        }
      });
      return max === -Infinity ? '0' : max.toString();
    });

    expression = expression.replace(/MIN\(([^)]+)\)/gi, (match, range) => {
      if (range.includes(':')) {
        const [start, end] = range.split(':');
        return calculateRangeMin(start, end, cells).toString();
      }
      const cellRefs = range.split(',').map(ref => ref.trim());
      let min = Infinity;
      cellRefs.forEach(cellRef => {
        const cell = cells[cellRef];
        if (cell && cell.value !== '') {
          const numValue = parseFloat(cell.value);
          if (!isNaN(numValue)) {
            min = Math.min(min, numValue);
          }
        }
      });
      return min === Infinity ? '0' : min.toString();
    });

    // Add more advanced functions
    expression = expression.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/gi, (match, condition, trueVal, falseVal) => {
      try {
        const conditionResult = new Function('return ' + condition.replace(/[A-Z]+\d+/g, (cellRef) => {
          const cell = cells[cellRef];
          if (!cell || cell.value === '') return '0';
          const numValue = parseFloat(cell.value);
          return isNaN(numValue) ? `"${cell.value}"` : numValue.toString();
        }))();
        return conditionResult ? trueVal.trim() : falseVal.trim();
      } catch {
        return falseVal.trim();
      }
    });

    expression = expression.replace(/CONCATENATE\(([^)]+)\)/gi, (match, args) => {
      const values = args.split(',').map(arg => {
        const trimmed = arg.trim();
        if (trimmed.match(/^[A-Z]+\d+$/)) {
          const cell = cells[trimmed];
          return cell ? cell.value : '';
        }
        return trimmed.replace(/"/g, '');
      });
      return `"${values.join('')}"`;
    });

    // Replace cell references with actual values
    expression = expression.replace(/\b[A-Z]+\d+\b/g, (cellRef) => {
      const cell = cells[cellRef];
      if (!cell || cell.value === '') return '0';
      const numValue = parseFloat(cell.value);
      return isNaN(numValue) ? `"${cell.value}"` : numValue.toString();
    });

    // Handle basic arithmetic - ensure it's safe
    if (/^[\d\s+\-*/().]+$/.test(expression)) {
      const result = new Function('return ' + expression)();
      return typeof result === 'number' ? result : 0;
    }

    const result = new Function('return ' + expression)();
    return result;

  } catch (error) {
    console.error('Formula parsing error:', error);
    return '#ERROR!';
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
  const [sheetTabs, setSheetTabs] = useState([{ id: 'sheet1', name: 'Sheet1', active: true }]);
  const [activeSheet, setActiveSheet] = useState('sheet1');
  const [frozenRows, setFrozenRows] = useState(0);
  const [frozenCols, setFrozenCols] = useState(0);
  const [hiddenRows, setHiddenRows] = useState<Set<number>>(new Set());
  const [hiddenCols, setHiddenCols] = useState<Set<number>>(new Set());
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [conditionalFormats, setConditionalFormats] = useState<ConditionalFormat[]>([]);
  const [namedRanges, setNamedRanges] = useState<Record<string, string>>({});
  const [filterRange, setFilterRange] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<{ column: number; direction: 'asc' | 'desc' } | null>(null);
  const [history, setHistory] = useState<Record<string, CellData>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<{ cells: Record<string, CellData>; range: { start: { row: number; col: number }; end: { row: number; col: number } } } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceTerm, setReplaceTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showGridlines, setShowGridlines] = useState(true);
  const [showHeadings, setShowHeadings] = useState(true);
  const [showFormulaBar, setShowFormulaBar] = useState(true);
  const [pageBreakPreview, setPageBreakPreview] = useState(false);
  const [protectedSheet, setProtectedSheet] = useState(false);
  const [comments, setComments] = useState<Record<string, string>>({});

  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formulaBarRef = useRef<HTMLInputElement>(null);

  // Enhanced formula suggestions data
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
    { name: 'NOT', description: 'Reverses the logic of a condition', example: 'NOT(A1>5)' },
    { name: 'VLOOKUP', description: 'Looks up value in leftmost column', example: 'VLOOKUP(A1, B:D, 2, FALSE)' },
    { name: 'HLOOKUP', description: 'Looks up value in top row', example: 'HLOOKUP(A1, B2:D5, 2, FALSE)' },
    { name: 'INDEX', description: 'Returns value at intersection of row and column', example: 'INDEX(A1:C10, 5, 2)' },
    { name: 'MATCH', description: 'Returns position of item in array', example: 'MATCH(A1, B:B, 0)' }
  ];

  const rows = sheet.data.rows || 100;
  const cols = sheet.data.cols || 26;

  useEffect(() => {
    if (sheet.data.cells) {
      setCells(sheet.data.cells);
    } else {
      // Enhanced sample data with comprehensive math operations tutorial
      const sampleCells: Record<string, CellData> = {
        // Header row
        'A1': { value: 'MATH OPERATIONS TUTORIAL', format: { bold: true, backgroundColor: '#4CAF50', fontColor: '#FFFFFF', fontSize: 14 } },
        'B1': { value: '', format: { backgroundColor: '#4CAF50' } },
        'C1': { value: '', format: { backgroundColor: '#4CAF50' } },
        'D1': { value: '', format: { backgroundColor: '#4CAF50' } },
        'E1': { value: '', format: { backgroundColor: '#4CAF50' } },

        // Basic Operations Section
        'A3': { value: 'BASIC OPERATIONS', format: { bold: true, backgroundColor: '#E3F2FD' } },
        'A4': { value: 'Number 1', format: { bold: true } },
        'B4': { value: 'Number 2', format: { bold: true } },
        'C4': { value: 'Operation', format: { bold: true } },
        'D4': { value: 'Formula', format: { bold: true } },
        'E4': { value: 'Result', format: { bold: true } },

        'A5': { value: '10', format: {} },
        'B5': { value: '5', format: {} },
        'C5': { value: 'Addition', format: {} },
        'D5': { value: '=A5+B5', formula: '=A5+B5', format: {} },
        'E5': { value: '15', format: {} },

        'A6': { value: '20', format: {} },
        'B6': { value: '8', format: {} },
        'C6': { value: 'Subtraction', format: {} },
        'D6': { value: '=A6-B6', formula: '=A6-B6', format: {} },
        'E6': { value: '12', format: {} },

        'A7': { value: '6', format: {} },
        'B7': { value: '4', format: {} },
        'C7': { value: 'Multiplication', format: {} },
        'D7': { value: '=A7*B7', formula: '=A7*B7', format: {} },
        'E7': { value: '24', format: {} },

        'A8': { value: '15', format: {} },
        'B8': { value: '3', format: {} },
        'C8': { value: 'Division', format: {} },
        'D8': { value: '=A8/B8', formula: '=A8/B8', format: {} },
        'E8': { value: '5', format: {} },

        'A9': { value: '2', format: {} },
        'B9': { value: '3', format: {} },
        'C9': { value: 'Power', format: {} },
        'D9': { value: '=POWER(A9,B9)', formula: '=POWER(A9,B9)', format: {} },
        'E9': { value: '8', format: {} },

        // Functions Section
        'A11': { value: 'FUNCTIONS', format: { bold: true, backgroundColor: '#FFF3E0' } },
        'A12': { value: 'Data Range: 5, 10, 15, 20, 25', format: { italic: true } },

        'A13': { value: 'Function', format: { bold: true } },
        'B13': { value: 'Formula', format: { bold: true } },
        'C13': { value: 'Result', format: { bold: true } },
        'D13': { value: 'Description', format: { bold: true } },

        'A14': { value: 'SUM', format: {} },
        'B14': { value: '=SUM(A16:E16)', formula: '=SUM(A16:E16)', format: {} },
        'C14': { value: '75', format: {} },
        'D14': { value: 'Adds all numbers', format: {} },

        'A15': { value: 'AVERAGE', format: {} },
        'B15': { value: '=AVERAGE(A16:E16)', formula: '=AVERAGE(A16:E16)', format: {} },
        'C15': { value: '15', format: {} },
        'D15': { value: 'Average of numbers', format: {} },

        // Data for functions
        'A16': { value: '5', format: {} },
        'B16': { value: '10', format: {} },
        'C16': { value: '15', format: {} },
        'D16': { value: '20', format: {} },
        'E16': { value: '25', format: {} },

        'A17': { value: 'COUNT', format: {} },
        'B17': { value: '=COUNT(A16:E16)', formula: '=COUNT(A16:E16)', format: {} },
        'C17': { value: '5', format: {} },
        'D17': { value: 'Counts numbers', format: {} },

        'A18': { value: 'MAX', format: {} },
        'B18': { value: '=MAX(A16:E16)', formula: '=MAX(A16:E16)', format: {} },
        'C18': { value: '25', format: {} },
        'D18': { value: 'Largest number', format: {} },

        'A19': { value: 'MIN', format: {} },
        'B19': { value: '=MIN(A16:E16)', formula: '=MIN(A16:E16)', format: {} },
        'C19': { value: '5', format: {} },
        'D19': { value: 'Smallest number', format: {} },

        // Advanced Examples
        'A21': { value: 'ADVANCED EXAMPLES', format: { bold: true, backgroundColor: '#F3E5F5' } },

        'A22': { value: 'Sales Data', format: { bold: true } },
        'B22': { value: 'Q1', format: { bold: true } },
        'C22': { value: 'Q2', format: { bold: true } },
        'D22': { value: 'Q3', format: { bold: true } },
        'E22': { value: 'Q4', format: { bold: true } },
        'F22': { value: 'Total', format: { bold: true } },

        'A23': { value: 'Product A', format: {} },
        'B23': { value: '1000', format: { numberFormat: 'currency' } },
        'C23': { value: '1200', format: { numberFormat: 'currency' } },
        'D23': { value: '1100', format: { numberFormat: 'currency' } },
        'E23': { value: '1300', format: { numberFormat: 'currency' } },
        'F23': { value: '=SUM(B23:E23)', formula: '=SUM(B23:E23)', format: { numberFormat: 'currency', bold: true } },

        'A24': { value: 'Product B', format: {} },
        'B24': { value: '800', format: { numberFormat: 'currency' } },
        'C24': { value: '900', format: { numberFormat: 'currency' } },
        'D24': { value: '850', format: { numberFormat: 'currency' } },
        'E24': { value: '950', format: { numberFormat: 'currency' } },
        'F24': { value: '=SUM(B24:E24)', formula: '=SUM(B24:E24)', format: { numberFormat: 'currency', bold: true } },

        'A25': { value: 'TOTALS', format: { bold: true } },
        'B25': { value: '=SUM(B23:B24)', formula: '=SUM(B23:B24)', format: { numberFormat: 'currency', bold: true } },
        'C25': { value: '=SUM(C23:C24)', formula: '=SUM(C23:C24)', format: { numberFormat: 'currency', bold: true } },
        'D25': { value: '=SUM(D23:D24)', formula: '=SUM(D23:D24)', format: { numberFormat: 'currency', bold: true } },
        'E25': { value: '=SUM(E23:E24)', formula: '=SUM(E23:E24)', format: { numberFormat: 'currency', bold: true } },
        'F25': { value: '=SUM(F23:F24)', formula: '=SUM(F23:F24)', format: { numberFormat: 'currency', bold: true, backgroundColor: '#FFEB3B' } },

        // Instructions
        'A27': { value: 'HOW TO USE:', format: { bold: true, backgroundColor: '#E8F5E8' } },
        'A28': { value: '1. Click any cell to select it', format: {} },
        'A29': { value: '2. Type = to start a formula', format: {} },
        'A30': { value: '3. Use functions like =SUM(A1:A5)', format: {} },
        'A31': { value: '4. Press Enter to execute', format: {} },
        'A32': { value: '5. Try: =A5+B5 or =SUM(A16:E16)', format: {} }
      };
      setCells(sampleCells);
    }
  }, [sheet]);

  const getCellKey = (row: number, col: number) => `${getColumnLabel(col)}${row + 1}`;

  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    if (event.shiftKey && selectedCell) {
      setSelectedRange({
        start: selectedCell,
        end: { row, col }
      });
    } else {
      const isEditingFormula = formulaBarValue.startsWith('=') && formulaBarRef.current === document.activeElement;

      if (isEditingFormula) {
        const cellRef = getCellKey(row, col);
        const currentFormula = formulaBarValue;
        const newFormula = currentFormula + cellRef;
        setFormulaBarValue(newFormula);

        setTimeout(() => {
          if (formulaBarRef.current) {
            formulaBarRef.current.focus();
            formulaBarRef.current.setSelectionRange(newFormula.length, newFormula.length);
          }
        }, 0);
        return;
      }

      // Stop editing other cells
      if (editingCell && (editingCell.row !== row || editingCell.col !== col)) {
        setEditingCell(null);
      }

      setSelectedCell({ row, col });
      setSelectedRange(null);
      const cellKey = getCellKey(row, col);
      const cellData = cells[cellKey];
      setFormulaBarValue(cellData?.formula || cellData?.value || '');

      // Enable single-click editing immediately
      setEditingCell({ row, col });
      
      // Focus the input after DOM update
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    const cellKey = getCellKey(row, col);
    const cellData = cells[cellKey];
    if (inputRef.current) {
      inputRef.current.value = cellData?.formula || cellData?.value || '';
      inputRef.current.focus();
      inputRef.current.select();
    }
  };

  const updateCell = useCallback((row: number, col: number, updates: Partial<CellData>) => {
    const cellKey = getCellKey(row, col);
    setCells(prev => {
      // Save to history
      setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(i => i + 1);

      const currentCell = prev[cellKey] || { value: '', format: {} };
      const newCell = { ...currentCell, ...updates };

      // Handle formula calculation
      if (newCell.formula && newCell.formula.startsWith('=')) {
        try {
          const context: Record<string, CellData> = { ...prev, [cellKey]: newCell };
          const result = parseFormula(newCell.formula, context);
          newCell.value = result !== null && result !== undefined ? result.toString() : '';
        } catch (error) {
          console.error('Formula error:', error);
          newCell.value = '#ERROR!';
        }
      } else if (updates.value !== undefined) {
        // Clear formula if setting value directly
        newCell.formula = undefined;
      }

      const newCells = {
        ...prev,
        [cellKey]: newCell
      };

      // Recalculate dependent cells
      Object.keys(newCells).forEach(key => {
        const cell = newCells[key];
        if (cell.formula && cell.formula.startsWith('=') && cell.formula.includes(cellKey)) {
          try {
            const result = parseFormula(cell.formula, newCells);
            cell.value = result !== null && result !== undefined ? result.toString() : '';
          } catch (error) {
            cell.value = '#ERROR!';
          }
        }
      });

      return newCells;
    });
  }, [historyIndex]);

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);

    if (value.startsWith('=')) {
      const formulaText = value.slice(1).toUpperCase();
      const lastWord = formulaText.split(/[^A-Z]/).pop() || '';

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
    } else {
      setShowFormulaSuggestions(false);
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
    } else if (e.key === 'Enter' && selectedCell) {
      e.preventDefault();
      const value = formulaBarValue.trim();
      if (value.startsWith('=')) {
        updateCell(selectedCell.row, selectedCell.col, {
          formula: value,
          value: value
        });
      } else {
        updateCell(selectedCell.row, selectedCell.col, {
          value: value,
          formula: undefined
        });
      }

      if (selectedCell.row < rows - 1) {
        setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
        const nextCellKey = getCellKey(selectedCell.row + 1, selectedCell.col);
        const nextCell = cells[nextCellKey];
        setFormulaBarValue(nextCell?.formula || nextCell?.value || '');
      }
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

  const insertChart = (chartType: ChartConfig['type']) => {
    if (!selectedRange) {
      toast({
        title: "Select a range",
        description: "Please select a data range first",
        variant: "destructive",
      });
      return;
    }

    const newChart: ChartConfig = {
      id: `chart_${Date.now()}`,
      type: chartType,
      range: `${getCellKey(selectedRange.start.row, selectedRange.start.col)}:${getCellKey(selectedRange.end.row, selectedRange.end.col)}`,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      position: { row: selectedRange.end.row + 2, col: selectedRange.start.col },
      size: { width: 400, height: 300 },
      showLegend: true,
      showDataLabels: false
    };

    setCharts(prev => [...prev, newChart]);
    toast({
      title: "Chart created",
      description: `${chartType} chart has been added to the sheet`,
    });
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
          frozenCols,
          conditionalFormats
        },
        metadata: {
          ...sheet.metadata,
          version: sheet.metadata.version + 1,
          lastModifiedBy: 0,
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

  const exportToExcel = () => {
    toast({
      title: "Excel Export",
      description: "Excel export functionality would be implemented here",
    });
  };

  const printSheet = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>{sheet.name}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={printSheet}>
                <Print className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button size="sm" variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportToExcel}>
                <FileText className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button size="sm" onClick={saveSheet}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Enhanced Toolbar */}
          <div className="border-b bg-background">
            {/* Main Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b">
              {/* File Operations */}
              <div className="flex items-center gap-1 mr-2">
                <Button size="sm" variant="ghost" onClick={undo} disabled={historyIndex < 0}>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Font Formatting */}
              <div className="flex items-center gap-1 mr-2">
                <Select defaultValue="Arial">
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map(font => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select defaultValue="11">
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map(size => (
                      <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => applyFormat({ bold: true })}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => applyFormat({ italic: true })}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => applyFormat({ underline: true })}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Alignment */}
              <div className="flex items-center gap-1 mr-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => applyFormat({ textAlign: 'left' })}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => applyFormat({ textAlign: 'center' })}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => applyFormat({ textAlign: 'right' })}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Colors */}
              <div className="flex items-center gap-1 mr-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Font Color</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(color => (
                            <button
                              key={color}
                              className="w-6 h-6 border rounded"
                              style={{ backgroundColor: color }}
                              onClick={() => applyFormat({ fontColor: color })}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Background Color</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {['#FFFFFF', '#FFFFCC', '#CCFFCC', '#CCFFFF', '#CCCCFF', '#FFCCFF', '#FFCCCC', '#F0F0F0'].map(color => (
                            <button
                              key={color}
                              className="w-6 h-6 border rounded"
                              style={{ backgroundColor: color }}
                              onClick={() => applyFormat({ backgroundColor: color })}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Number Format */}
              <div className="flex items-center gap-1 mr-2">
                <Select defaultValue="general">
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NUMBER_FORMATS.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Charts */}
              <div className="flex items-center gap-1 mr-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <BarChart3 className="h-4 w-4" />
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => insertChart('column')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Column Chart
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => insertChart('bar')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Bar Chart
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => insertChart('line')}>
                      <LineChart className="h-4 w-4 mr-2" />
                      Line Chart
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => insertChart('pie')}>
                      <PieChart className="h-4 w-4 mr-2" />
                      Pie Chart
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* View Options */}
              <div className="flex items-center gap-1 mr-2">
                <Button 
                  size="sm" 
                  variant={showGridlines ? "default" : "ghost"}
                  onClick={() => setShowGridlines(!showGridlines)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant={showHeadings ? "default" : "ghost"}
                  onClick={() => setShowHeadings(!showHeadings)}
                >
                  <Hash className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant={showFormulaBar ? "default" : "ghost"}
                  onClick={() => setShowFormulaBar(!showFormulaBar)}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Zoom */}
              <div className="flex items-center gap-2 mr-2">
                <Button size="sm" variant="ghost" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center">{zoomLevel}%</span>
                <Button size="sm" variant="ghost" onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Formula Bar */}
            {showFormulaBar && (
              <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedRange ? 
                      `${getCellKey(selectedRange.start.row, selectedRange.start.col)}:${getCellKey(selectedRange.end.row, selectedRange.end.col)}` :
                      selectedCell ? getCellKey(selectedCell.row, selectedCell.col) : 
                      'Select a cell'
                    }
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <Calculator className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex-1 flex items-center gap-2 relative">
                  <Input
                    ref={formulaBarRef}
                    value={formulaBarValue}
                    onChange={(e) => handleFormulaBarChange(e.target.value)}
                    onKeyDown={handleFormulaBarKeyDown}
                    placeholder="Enter formula (e.g., =SUM(A1:A5)) or click cell to reference"
                    className="font-mono text-sm"
                  />

                  {/* Formula Suggestions */}
                  {showFormulaSuggestions && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {formulaSuggestions.slice(0, 8).map((func, index) => (
                        <div
                          key={func.name}
                          className={`flex items-center justify-between p-2 hover:bg-muted cursor-pointer ${
                            index === selectedSuggestionIndex ? 'bg-muted' : ''
                          }`}
                          onClick={() => insertFormulaSuggestion(func)}
                        >
                          <div>
                            <span className="font-mono text-sm font-medium">{func.name}</span>
                            <div className="text-xs text-muted-foreground">
                              {func.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (selectedCell) {
                        const value = formulaBarValue.trim();
                        if (value.startsWith('=')) {
                          updateCell(selectedCell.row, selectedCell.col, {
                            formula: value,
                            value: value
                          });
                        } else {
                          updateCell(selectedCell.row, selectedCell.col, {
                            value: value,
                            formula: undefined
                          });
                        }
                      }
                    }}
                    disabled={!formulaBarValue.trim()}
                    className="h-7 px-2"
                  >
                    <Calculator className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Spreadsheet Grid */}
          <div className="flex-1 overflow-auto" style={{ zoom: `${zoomLevel}%` }}>
            <div className="inline-block min-w-full">
              <div className="grid" style={{ gridTemplateColumns: `2rem repeat(${cols}, minmax(5rem, 10rem))` }}>
                {/* Top left corner cell */}
                {showHeadings && (
                  <div className="sticky top-0 left-0 z-10 bg-secondary border-b border-r text-muted-foreground"></div>
                )}
                {/* Column labels */}
                {showHeadings && Array.from({ length: cols }, (_, index) => (
                  <div key={index} className="sticky top-0 z-0 bg-secondary border-b border-r text-muted-foreground px-2 py-1.5 text-center font-medium">
                    {getColumnLabel(index)}
                  </div>
                ))}
                {/* Row labels and cells */}
                {Array.from({ length: rows }, (_, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    {showHeadings && (
                      <div className="sticky left-0 z-0 bg-secondary border-b border-r text-muted-foreground px-2 py-1.5 text-center font-medium">
                        {rowIndex + 1}
                      </div>
                    )}
                    {Array.from({ length: cols }, (_, colIndex) => {
                      const cellKey = getCellKey(rowIndex, colIndex);
                      const cellData = cells[cellKey];
                      const isSelected = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;
                      const isInRange = selectedRange && 
                        rowIndex >= Math.min(selectedRange.start.row, selectedRange.end.row) &&
                        rowIndex <= Math.max(selectedRange.start.row, selectedRange.end.row) &&
                        colIndex >= Math.min(selectedRange.start.col, selectedRange.end.col) &&
                        colIndex <= Math.max(selectedRange.start.col, selectedRange.end.col);

                      return (
                        <div 
                          key={colIndex} 
                          className={cn(
                            "relative min-h-[2rem] flex items-center px-2 text-sm cursor-cell",
                            showGridlines && "border-b border-r",
                            isSelected && "ring-2 ring-blue-500 bg-blue-50",
                            isInRange && "bg-blue-100",
                            cellData?.format?.bold && "font-bold",
                            cellData?.format?.italic && "italic",
                            cellData?.format?.underline && "underline"
                          )}
                          style={{
                            backgroundColor: cellData?.format?.backgroundColor || (isSelected ? undefined : 'transparent'),
                            color: cellData?.format?.fontColor || 'inherit',
                            fontSize: cellData?.format?.fontSize ? `${cellData.format.fontSize}px` : undefined,
                            fontFamily: cellData?.format?.fontFamily || undefined,
                            textAlign: cellData?.format?.textAlign || 'left',
                            verticalAlign: cellData?.format?.verticalAlign || 'middle'
                          }}
                          onClick={() => {
                            setSelectedCell({ row: rowIndex, col: colIndex });
                            setEditingCell({ row: rowIndex, col: colIndex });
                          }}
                        >
                          {editingCell && editingCell.row === rowIndex && editingCell.col === colIndex ? (
                            <input
                              ref={inputRef}
                              type="text"
                              defaultValue={cellData?.formula || cellData?.value || ''}
                              onBlur={(e) => {
                                const value = e.target.value.trim();
                                if (value.startsWith('=')) {
                                  updateCell(rowIndex, colIndex, {
                                    formula: value,
                                    value: value
                                  });
                                } else {
                                  updateCell(rowIndex, colIndex, {
                                    value: value,
                                    formula: undefined
                                  });
                                }
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const value = e.currentTarget.value.trim();
                                  if (value.startsWith('=')) {
                                    updateCell(rowIndex, colIndex, {
                                      formula: value,
                                      value: value
                                    });
                                  } else {
                                    updateCell(rowIndex, colIndex, {
                                      value: value,
                                      formula: undefined
                                    });
                                  }
                                  setEditingCell(null);
                                  
                                  // Move to next cell
                                  if (rowIndex < rows - 1) {
                                    setTimeout(() => {
                                      setSelectedCell({ row: rowIndex + 1, col: colIndex });
                                      setEditingCell({ row: rowIndex + 1, col: colIndex });
                                    }, 50);
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                } else if (e.key === 'Tab') {
                                  e.preventDefault();
                                  const value = e.currentTarget.value.trim();
                                  if (value.startsWith('=')) {
                                    updateCell(rowIndex, colIndex, {
                                      formula: value,
                                      value: value
                                    });
                                  } else {
                                    updateCell(rowIndex, colIndex, {
                                      value: value,
                                      formula: undefined
                                    });
                                  }
                                  setEditingCell(null);
                                  
                                  // Move to next column
                                  if (colIndex < cols - 1) {
                                    setTimeout(() => {
                                      setSelectedCell({ row: rowIndex, col: colIndex + 1 });
                                      setEditingCell({ row: rowIndex, col: colIndex + 1 });
                                    }, 50);
                                  }
                                }
                              }}
                              className="w-full h-full bg-transparent border-0 outline-0 p-0"
                              autoFocus
                            />
                          ) : (
                            <span className="truncate w-full">
                              {cellData ? formatCellValue(cellData.value, cellData.format) : ''}
                            </span>
                          )}
                          {cellData?.note && (
                            <div className="absolute top-0 right-0 w-0 h-0 border-l-4 border-b-4 border-l-transparent border-b-orange-400"></div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Sheet Tabs */}
          <div className="border-t p-2 bg-muted/30">
            <div className="flex items-center gap-2">
              {sheetTabs.map((tab) => (
                <Badge
                  key={tab.id}
                  variant={tab.active ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setActiveSheet(tab.id)}
                >
                  {tab.name}
                </Badge>
              ))}
              <Button size="sm" variant="ghost" onClick={() => {
                const newTab = {
                  id: `sheet${sheetTabs.length + 1}`,
                  name: `Sheet${sheetTabs.length + 1}`,
                  active: false
                };
                setSheetTabs(prev => [...prev, newTab]);
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}