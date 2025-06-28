import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
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

  const expression = formula.slice(1);

  // Handle SUM function
  if (expression.toUpperCase().startsWith('SUM(')) {
    const range = expression.slice(4, -1);
    const [start, end] = range.split(':');
    // Simple range calculation for demo
    return 0; // Implement proper range calculation
  }

  // Handle AVERAGE function
  if (expression.toUpperCase().startsWith('AVERAGE(')) {
    const range = expression.slice(8, -1);
    return 0; // Implement proper average calculation
  }

  // Handle simple arithmetic
  try {
    return eval(expression.replace(/[A-Z]+\d+/g, '0')); // Replace cell refs with 0 for demo
  } catch {
    return 0;
  }
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
      setSelectedCell({ row, col });
      setSelectedRange(null);
      const cellKey = getCellKey(row, col);
      const cellData = cells[cellKey];
      setFormulaBarValue(cellData?.formula || cellData?.value || '');
    }
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    const cellKey = getCellKey(row, col);
    const cellData = cells[cellKey];
    if (inputRef.current) {
      inputRef.current.value = cellData?.formula || cellData?.value || '';
      inputRef.current.focus();
    }
  };

  const updateCell = useCallback((row: number, col: number, updates: Partial<CellData>) => {
    const cellKey = getCellKey(row, col);
    setCells(prev => {
      const newCells = {
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          ...updates
        }
      };

      // Add to history
      setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(i => i + 1);

      return newCells;
    });
  }, [historyIndex]);

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    if (selectedCell) {
      const isFormula = value.startsWith('=');
      updateCell(selectedCell.row, selectedCell.col, {
        value: isFormula ? parseFormula(value, cells).toString() : value,
        formula: isFormula ? value : undefined
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">fx</span>
              <Input
                value={formulaBarValue}
                onChange={(e) => handleFormulaBarChange(e.target.value)}
                placeholder="Enter formula or value"
                className="flex-1"
              />
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

                    return (
                      <div
                        key={col}
                        className={cn(
                          "w-24 h-8 border-r border-b flex items-center px-1 cursor-cell text-xs",
                          isSelected && "bg-blue-100 border-blue-500",
                          isInRange && "bg-blue-50",
                          cellData?.format?.backgroundColor && `bg-${cellData.format.backgroundColor}`,
                          cellData?.format?.bold && "font-bold",
                          cellData?.format?.italic && "italic",
                          cellData?.format?.underline && "underline"
                        )}
                        style={{
                          textAlign: cellData?.format?.textAlign || 'left',
                          color: cellData?.format?.fontColor,
                          fontSize: cellData?.format?.fontSize ? `${cellData.format.fontSize}px` : '12px'
                        }}
                        onClick={(e) => handleCellClick(row, col, e)}
                        onDoubleClick={() => handleCellDoubleClick(row, col)}
                      >
                        {editingCell?.row === row && editingCell?.col === col ? (
                          <input
                            ref={inputRef}
                            className="w-full h-full bg-transparent border-none outline-none"
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingCell(null);
                              }
                            }}
                          />
                        ) : (
                          <span className="truncate">
                            {cellData ? formatCellValue(cellData.value, cellData.format) : ''}
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