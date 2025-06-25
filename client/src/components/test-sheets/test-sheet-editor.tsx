import { useState, useEffect, useRef, useCallback } from "react";
import { TestSheet, CellData, CellValue } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formulaEngine } from "@/lib/formula-engine";
import {
  Save,
  Download,
  Upload,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  BarChart3,
  Plus,
  Minus,
  X,
  FileSpreadsheet,
  Grid3X3,
  Square,
  Edit2,
  Check,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";

interface TestSheetEditorProps {
  sheet: TestSheet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface SelectedCell {
  row: number;
  col: number;
  cellId: string;
}

interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export function TestSheetEditor({ sheet, open, onOpenChange, onSave }: TestSheetEditorProps) {
  const [sheetData, setSheetData] = useState(sheet.data);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [selectedRange, setSelectedRange] = useState<CellRange | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [bgColorPickerOpen, setBgColorPickerOpen] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [borderStyle, setBorderStyle] = useState("1px solid #000000");
  const [dragFillStart, setDragFillStart] = useState<{ row: number; col: number } | null>(null);
  const [isDragFilling, setIsDragFilling] = useState(false);
  const [copiedCells, setCopiedCells] = useState<{ [key: string]: CellData } | null>(null);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [sheetName, setSheetName] = useState(sheet.name);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gridRef = useRef<HTMLDivElement>(null);
  const formulaBarRef = useRef<HTMLInputElement>(null);

  // Convert column number to letter (0 -> A, 1 -> B, etc.)
  const getColumnLetter = (colIndex: number): string => {
    let result = '';
    while (colIndex >= 0) {
      result = String.fromCharCode(65 + (colIndex % 26)) + result;
      colIndex = Math.floor(colIndex / 26) - 1;
    }
    return result;
  };

  // Convert cell coordinates to cell ID (row 0, col 0 -> A1)
  const getCellId = (row: number, col: number): string => {
    return `${getColumnLetter(col)}${row + 1}`;
  };

  // Get cell data or create empty cell
  const getCellData = (row: number, col: number): CellData => {
    const cellId = getCellId(row, col);
    return sheetData.cells[cellId] || {
      value: '',
      type: 'text',
      style: {},
    };
  };

  // Update cell data with enhanced persistence and immediate state reflection
  const updateCell = useCallback((row: number, col: number, updates: Partial<CellData>) => {
    const cellId = getCellId(row, col);
    console.log('UpdateCell called - Row:', row, 'Col:', col, 'CellId:', cellId, 'Updates:', updates);

    setSheetData(prev => {
      const currentCell = prev.cells[cellId] || { value: '', type: 'text' as const, style: {} };

      // Process value based on type
      let processedValue = updates.value;
      let cellType = updates.type || currentCell.type || 'text';

      if (updates.value !== undefined) {
        const valueStr = String(updates.value);
        
        // Auto-detect type if not specified
        if (!updates.type) {
          if (valueStr.startsWith('=')) {
            cellType = 'formula';
          } else if (!isNaN(Number(valueStr)) && valueStr.trim() !== '' && valueStr.trim() !== '.') {
            cellType = 'number';
            processedValue = Number(valueStr);
          } else if (valueStr.toLowerCase() === 'true' || valueStr.toLowerCase() === 'false') {
            cellType = 'boolean';
            processedValue = valueStr.toLowerCase() === 'true';
          } else if (valueStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            cellType = 'date';
          } else {
            cellType = 'text';
          }
        }
      }

      const newCell = { 
        ...currentCell, 
        ...updates,
        value: processedValue !== undefined ? processedValue : currentCell.value,
        type: cellType,
        lastModified: new Date().toISOString(),
        id: cellId
      };

      console.log('UpdateCell - Previous cell:', currentCell, 'New cell:', newCell);

      // Create immutable update
      const newCells = {
        ...prev.cells,
        [cellId]: newCell
      };

      const newSheetData = {
        ...prev,
        cells: newCells,
        lastModified: new Date().toISOString(),
        version: (prev.version || 0) + 1
      };

      console.log('UpdateCell - Updated sheet data for cell', cellId, ':', newSheetData.cells[cellId]);

      // Backup to localStorage
      try {
        localStorage.setItem(`sheet_${sheet.id}_backup`, JSON.stringify(newSheetData));
      } catch (error) {
        console.warn('Failed to backup to localStorage:', error);
      }

      return newSheetData;
    });
  }, [sheet.id]);

  // Save sheet mutation with auto-save
  const saveSheetMutation = useMutation({
    mutationFn: async (data: typeof sheetData) => {
      console.log('Saving sheet data:', data);
      const response = await apiRequest('PUT', `/api/test-sheets/${sheet.id}`, {
        name: sheet.name,
        data,
        metadata: {
          ...sheet.metadata,
          lastModifiedBy: 1, // Should come from user context
          version: (sheet.metadata.version || 0) + 1,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (savedSheet) => {
      console.log('Sheet saved successfully:', savedSheet);
      toast({
        title: "Sheet saved",
        description: "Your changes have been saved successfully.",
      });
      
      // Update local sheet data with server response
      if (savedSheet && savedSheet.data) {
        setSheetData(savedSheet.data);
      }
      
      onSave();
    },
    onError: (error: any) => {
      console.error('Save sheet error:', error);
      toast({
        title: "Error",
        description: `Failed to save sheet: ${error.message}`,
        variant: "destructive",
      });
    },
  });

    // Update sheet name mutation
    const updateNameMutation = useMutation({
      mutationFn: async (newName: string) => {
        const res = await apiRequest("PUT", `/api/test-sheets/${sheet.id}`, {
          name: newName
        });
        return res.json();
      },
      onSuccess: () => {
        toast({
          title: "Name updated",
          description: "Sheet name has been updated successfully.",
        });
        setEditingName(false);
        if (onSave) onSave();
      },
      onError: (error) => {
        toast({
          title: "Update failed",
          description: `Failed to update sheet name: ${error}`,
          variant: "destructive",
        });
        setSheetName(sheet.name); // Reset to original name
        setEditingName(false);
      },
    });

  // Enhanced auto-save with real-time persistence
  useEffect(() => {
    console.log('Sheet data changed, scheduling auto-save...', sheetData);
    const autoSaveTimer = setTimeout(() => {
      const hasChanges = JSON.stringify(sheetData.cells) !== JSON.stringify(sheet.data.cells);
      console.log('Auto-save check - Has changes:', hasChanges);

      if (hasChanges) {
        console.log('Auto-saving sheet data changes');
        // Create a deep copy to ensure data persistence
        const dataToSave = {
          ...sheetData,
          cells: JSON.parse(JSON.stringify(sheetData.cells)), // Deep clone
          lastModified: new Date().toISOString(),
          version: (sheetData.version || 0) + 1
        };
        console.log('Saving data:', dataToSave);
        saveSheetMutation.mutate(dataToSave);
        
        // Also backup to localStorage for immediate recovery
        try {
          localStorage.setItem(`sheet_${sheet.id}_realtime`, JSON.stringify(dataToSave));
        } catch (error) {
          console.warn('Failed to backup to localStorage:', error);
        }
      }
    }, 800); // Reduced delay for more responsive saving

    return () => clearTimeout(autoSaveTimer);
  }, [sheetData.cells, sheetData.version, saveSheetMutation, sheet.id]);

  // Handle range selection
  const isInSelectedRange = (row: number, col: number): boolean => {
    if (!selectedRange) return false;
    return row >= selectedRange.startRow && row <= selectedRange.endRow &&
           col >= selectedRange.startCol && col <= selectedRange.endCol;
  };

  // Handle cell mouse down (start selection)
  const handleCellMouseDown = (row: number, col: number, event: React.MouseEvent) => {
    event.preventDefault();

    if (event.shiftKey && selectedCell) {
      // Extend selection
      setSelectedRange({
        startRow: Math.min(selectedCell.row, row),
        startCol: Math.min(selectedCell.col, col),
        endRow: Math.max(selectedCell.row, row),
        endCol: Math.max(selectedCell.col, col),
      });
    } else {
      // Start new selection
      const cellId = getCellId(row, col);
      setSelectedCell({ row, col, cellId });
      setSelectedRange(null);
      setDragStart({ row, col });
      setIsDragging(true);

      const cellData = getCellData(row, col);
      if (cellData.formula) {
        setFormulaBarValue(cellData.formula);
      } else {
        setFormulaBarValue(String(cellData.value || ''));
      }
      setIsEditing(false);
    }
  };

  // Handle cell mouse enter (extend selection during drag)
  const handleCellMouseEnter = (row: number, col: number) => {
    if (isDragging && dragStart) {
      setSelectedRange({
        startRow: Math.min(dragStart.row, row),
        startCol: Math.min(dragStart.col, col),
        endRow: Math.max(dragStart.row, row),
        endCol: Math.max(dragStart.col, col),
      });
    }
  };

  // Handle mouse up (end selection)
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Handle cell click - Enable immediate editing
  const handleCellClick = (row: number, col: number) => {
    const cellId = getCellId(row, col);
    setSelectedCell({ row, col, cellId });

    const cellData = getCellData(row, col);
    if (cellData.formula) {
      setFormulaBarValue(cellData.formula);
    } else {
      setFormulaBarValue(String(cellData.value || ''));
    }
    // Enable immediate editing on single click
    setTimeout(() => setIsEditing(true), 50); // Small delay to ensure cell selection is complete
  };

  // Handle cell double click for enhanced editing (now redundant but keeping for compatibility)
  const handleCellDoubleClick = (row: number, col: number) => {
    const cellId = getCellId(row, col);
    setSelectedCell({ row, col, cellId });
    setIsEditing(true);
  };

  // Handle formula bar change with enhanced persistence and immediate UI update
  const handleFormulaBarChange = useCallback((value: string) => {
    setFormulaBarValue(value);
    
    // Immediately update the cell for real-time persistence
    if (selectedCell) {
      const row = selectedCell.row;
      const col = selectedCell.col;
      
      let cellValue: any = value;
      let cellType: CellData['type'] = 'text';
      let formula: string | undefined;

      // Determine cell type and process value
      if (value.startsWith('=')) {
        cellType = 'formula';
        formula = value;
        // Evaluate formula immediately for real-time feedback
        try {
          const context = Object.keys(sheetData.cells).reduce((acc, cellId) => {
            const cell = sheetData.cells[cellId];
            acc[cellId] = cell?.value || '';
            return acc;
          }, {} as Record<string, any>);
          cellValue = formulaEngine.evaluate(value, context);
        } catch (error) {
          cellValue = value; // Show formula if evaluation fails
        }
      } else if (!isNaN(Number(value)) && value.trim() !== '' && value.trim() !== '.') {
        cellType = 'number';
        cellValue = Number(value);
      } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        cellType = 'boolean';
        cellValue = value.toLowerCase() === 'true';
      } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        cellType = 'date';
        cellValue = value;
      } else {
        cellType = 'text';
        cellValue = value;
      }

      // Update cell immediately with real-time persistence
      updateCell(row, col, {
        value: cellValue,
        type: cellType,
        formula,
        style: getCellData(row, col).style || {},
        lastModified: new Date().toISOString()
      });

      // Trigger immediate save for critical data
      const currentData = {
        ...sheetData,
        cells: {
          ...sheetData.cells,
          [getCellId(row, col)]: {
            value: cellValue,
            type: cellType,
            formula,
            style: getCellData(row, col).style || {},
            lastModified: new Date().toISOString()
          }
        },
        lastModified: new Date().toISOString(),
        version: (sheetData.version || 0) + 1
      };

      // Debounced auto-save for performance
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        console.log('Real-time save triggered for cell change');
        saveSheetMutation.mutate(currentData);
      }, 500);
    }
  }, [selectedCell, updateCell, sheetData, saveSheetMutation]);

  const handleFormulaBarBlur = useCallback(() => {
    if (selectedCell && formulaBarValue !== null && formulaBarValue !== undefined) {
      const currentValue = String(formulaBarValue);
      const row = selectedCell.row;
      const col = selectedCell.col;

      let cellValue: any = currentValue;
      let cellType: CellData['type'] = 'text';
      let formula: string | undefined;

      // Skip if value is empty and not intentionally cleared
      if (currentValue === '' && getCellData(row, col).value !== '') {
        return;
      }

      // Determine cell type and process value
      if (currentValue.startsWith('=')) {
        cellType = 'formula';
        formula = currentValue;
        // Evaluate formula
        try {
          const context = Object.keys(sheetData.cells).reduce((acc, cellId) => {
            const cell = sheetData.cells[cellId];
            acc[cellId] = cell?.value || '';
            return acc;
          }, {} as Record<string, any>);
          cellValue = formulaEngine.evaluate(currentValue, context);
        } catch (error) {
          cellValue = '#ERROR!';
          console.error('Formula evaluation error:', error);
        }
      } else if (!isNaN(Number(currentValue)) && currentValue.trim() !== '' && currentValue.trim() !== '.') {
        cellType = 'number';
        cellValue = Number(currentValue);
      } else if (currentValue.toLowerCase() === 'true' || currentValue.toLowerCase() === 'false') {
        cellType = 'boolean';
        cellValue = currentValue.toLowerCase() === 'true';
      } else if (currentValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        cellType = 'date';
        cellValue = currentValue;
      } else {
        cellType = 'text';
        cellValue = currentValue;
      }

      console.log('Formula bar blur - updating cell:', { row, col, currentValue, cellValue, cellType });

      updateCell(row, col, {
        value: cellValue,
        type: cellType,
        formula,
        style: getCellData(row, col).style || {}
      });
    }
  }, [formulaBarValue, sheetData.cells, updateCell, selectedCell]);

  const handleFormulaBarKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedCell) {
      handleFormulaBarBlur();
      setIsEditing(false);
    }
  }, [handleFormulaBarBlur, selectedCell]);

  // Handle cell input change during editing
  const handleCellInputChange = (value: string) => {
    setFormulaBarValue(value);
  };

  // Handle cell input blur (finish editing)
  const handleCellInputBlur = () => {
    handleFormulaBarBlur();
    setIsEditing(false);
  };

  // Handle cell input key down
  const handleCellInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFormulaBarChange(formulaBarValue);
      setIsEditing(false);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      const cellData = selectedCell ? getCellData(selectedCell.row, selectedCell.col) : null;
      if (cellData?.formula) {
        setFormulaBarValue(cellData.formula);
      } else {
        setFormulaBarValue(String(cellData?.value || ''));
      }
      setIsEditing(false);
      e.preventDefault();
    }
  };

  // Handle key press in grid with enhanced navigation
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    // If currently editing, handle editing keys
    if (isEditing) {
      switch (event.key) {
        case 'Enter':
          setIsEditing(false);
          if (row < sheetData.rows - 1) handleCellClick(row + 1, col);
          event.preventDefault();
          break;
        case 'Tab':
          setIsEditing(false);
          if (col < sheetData.cols - 1) handleCellClick(row, col + 1);
          else if (row < sheetData.rows - 1) handleCellClick(row + 1, 0);
          event.preventDefault();
          break;
        case 'Escape':
          setIsEditing(false);
          const cellData = getCellData(row, col);
          if (cellData.formula) {
            setFormulaBarValue(cellData.formula);
          } else {
            setFormulaBarValue(String(cellData.value || ''));
          }
          event.preventDefault();
          break;
      }
      return;
    }

    // Navigation when not editing
    switch (event.key) {
      case 'ArrowUp':
        if (row > 0) handleCellClick(row - 1, col);
        event.preventDefault();
        break;
      case 'ArrowDown':
        if (row < sheetData.rows - 1) handleCellClick(row + 1, col);
        event.preventDefault();
        break;
      case 'ArrowLeft':
        if (col > 0) handleCellClick(row, col - 1);
        event.preventDefault();
        break;
      case 'ArrowRight':
        if (col < sheetData.cols - 1) handleCellClick(row, col + 1);
        event.preventDefault();
        break;
      case 'Enter':
        setIsEditing(true);
        event.preventDefault();
        break;
      case 'Tab':
        if (col < sheetData.cols - 1) handleCellClick(row, col + 1);
        else if (row < sheetData.rows - 1) handleCellClick(row + 1, 0);
        event.preventDefault();
        break;
      case 'Delete':
      case 'Backspace':
        updateCell(row, col, { value: '', type: 'text', formula: undefined });
        setFormulaBarValue('');
        event.preventDefault();
        break;
      case 'F2':
        setIsEditing(true);
        event.preventDefault();
        break;
      case '=':
        setFormulaBarValue('=');
        setIsEditing(true);
        event.preventDefault();
        break;
      default:
        // Auto-start editing for alphanumeric keys
        if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
          setFormulaBarValue(event.key);
          setIsEditing(true);
          event.preventDefault();
        }
        break;
    }
  };

  // Format cell style
  const formatCell = (property: string, value: any) => {
    if (selectedRange) {
      // Apply to range
      for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
        for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
          const currentCell = getCellData(row, col);
          updateCell(row, col, {
            style: {
              ...currentCell.style,
              [property]: value,
            },
          });
        }
      }
    } else if (selectedCell) {
      // Apply to single cell
      const { row, col } = selectedCell;
      const currentCell = getCellData(row, col);

      updateCell(row, col, {
        style: {
          ...currentCell.style,
          [property]: value,
        },
      });
    }
  };

  // Add border to selected cells
  const addBorder = (borderType: string = "all") => {
    if (selectedRange) {
      for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
        for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
          const currentCell = getCellData(row, col);
          const border = {
            top: borderType === "all" || borderType === "top" ? borderStyle : currentCell.style?.border?.top,
            right: borderType === "all" || borderType === "right" ? borderStyle : currentCell.style?.border?.right,
            bottom: borderType === "all" || borderType === "bottom" ? borderStyle : currentCell.style?.border?.bottom,
            left: borderType === "all" || borderType === "left" ? borderStyle : currentCell.style?.border?.left,
          };

          updateCell(row, col, {
            style: {
              ...currentCell.style,
              border,
            },
          });
        }
      }
    } else if (selectedCell) {
      const { row, col } = selectedCell;
      const currentCell = getCellData(row, col);
      const border = {
        top: borderStyle,
        right: borderStyle,
        bottom: borderStyle,
        left: borderStyle,
      };

      updateCell(row, col, {
        style: {
          ...currentCell.style,
          border,
        },
      });
    }
  };

  // Insert SUM formula for selected range
  const insertSumFormula = () => {
    insertFormulaForRange('SUM');
  };

  // Insert formula for selected range
  const insertFormulaForRange = (functionName: string) => {
    if (!selectedRange) return;

    const startCellId = getCellId(selectedRange.startRow, selectedRange.startCol);
    const endCellId = getCellId(selectedRange.endRow, selectedRange.endCol);
    const formula = `=${functionName}(${startCellId}:${endCellId})`;

    // Insert in cell below the selection
    const targetRow = selectedRange.endRow + 1;
    const targetCol = selectedRange.startCol;

    if (targetRow < sheetData.rows) {
      const targetCellId = getCellId(targetRow, targetCol);
      setSelectedCell({ 
        row: targetRow, 
        col: targetCol, 
        cellId: targetCellId 
      });
      setFormulaBarValue(formula);
      handleFormulaBarChange(formula);
      setSelectedRange(null);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvData: string[][] = [];

    for (let row = 0; row < sheetData.rows; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < sheetData.cols; col++) {
        const cellData = getCellData(row, col);
        rowData.push(String(cellData.value || ''));
      }
      csvData.push(rowData);
    }

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Insert function into formula bar
  const insertFunction = (functionName: string) => {
    const currentValue = formulaBarValue;
    let newValue = '';

    if (functionName === 'PI' || functionName === 'E') {
      newValue = currentValue + `${functionName}()`;
    } else if (functionName === 'RANDOM') {
      newValue = currentValue + `${functionName}()`;
    } else {
      newValue = currentValue + `${functionName}()`;
    }

    setFormulaBarValue(newValue);
  };

  // Auto-fill functionality for drag and drop
  const handleDragFillStart = (row: number, col: number) => {
    setDragFillStart({ row, col });
    setIsDragFilling(true);
  };

  const handleDragFillEnd = (endRow: number, endCol: number) => {
    if (!dragFillStart || !isDragFilling) return;

    const startCell = getCellData(dragFillStart.row, dragFillStart.col);
    const startValue = startCell.value;

    // Auto-fill logic for numbers and sequences
    if (typeof startValue === 'number') {
      let currentValue = startValue;
      for (let r = dragFillStart.row; r <= endRow; r++) {
        for (let c = dragFillStart.col; c <= endCol; c++) {
          if (r === dragFillStart.row && c === dragFillStart.col) continue;
          updateCell(r, c, {
            value: currentValue + (r - dragFillStart.row) + (c - dragFillStart.col),
            type: 'number',
            style: startCell.style || {}
          });
        }
      }
    } else if (typeof startValue === 'string') {
      // Check if it's a sequence pattern (e.g., "Item 1", "Item 2")
      const match = String(startValue).match(/^(.+?)(\d+)(.*)$/);
      if (match) {
        const prefix = match[1];
        const number = parseInt(match[2]);
        const suffix = match[3];

        let counter = 0;
        for (let r = dragFillStart.row; r <= endRow; r++) {
          for (let c = dragFillStart.col; c <= endCol; c++) {
            if (r === dragFillStart.row && c === dragFillStart.col) continue;
            counter++;
            updateCell(r, c, {
              value: `${prefix}${number + counter}${suffix}`,
              type: 'text',
              style: startCell.style || {}
            });
          }
        }
      } else {
        // Just copy the value
        for (let r = dragFillStart.row; r <= endRow; r++) {
          for (let c = dragFillStart.col; c <= endCol; c++) {
            if (r === dragFillStart.row && c === dragFillStart.col) continue;
            updateCell(r, c, {
              value: startValue,
              type: startCell.type,
              style: startCell.style || {}
            });
          }
        }
      }
    }

    setDragFillStart(null);
    setIsDragFilling(false);
  };

  // Copy-paste functionality
  const handleCopy = () => {
    if (!selectedRange && !selectedCell) return;

    const cellsToCopy: { [key: string]: CellData } = {};

    if (selectedRange) {
      for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
        for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
          const cellId = getCellId(row, col);
          cellsToCopy[cellId] = getCellData(row, col);
        }
      }
    } else if (selectedCell) {
      const cellId = getCellId(selectedCell.row, selectedCell.col);
      cellsToCopy[cellId] = getCellData(selectedCell.row, selectedCell.col);
    }

    setCopiedCells(cellsToCopy);

    toast({
      title: "Copied",
      description: `Copied ${Object.keys(cellsToCopy).length} cell(s)`,
    });
  };

  const handlePaste = () => {
    if (!copiedCells || !selectedCell) return;

    const copiedEntries = Object.entries(copiedCells);
    if (copiedEntries.length === 0) return;

    // Get the first copied cell as reference point
    const firstCopiedCell = copiedEntries[0];
    const firstCellId = firstCopiedCell[0];
    const firstCol = firstCellId.charCodeAt(0) - 65; // A=0, B=1, etc.
    const firstRow = parseInt(firstCellId.substring(1)) - 1;

    // Calculate offset
    const rowOffset = selectedCell.row - firstRow;
    const colOffset = selectedCell.col - firstCol;

    // Paste all copied cells with offset
    copiedEntries.forEach(([cellId, cellData]) => {
      const col = cellId.charCodeAt(0) - 65;
      const row = parseInt(cellId.substring(1)) - 1;

      const newRow = row + rowOffset;
      const newCol = col + colOffset;

      if (newRow >= 0 && newRow < sheetData.rows && newCol >= 0 && newCol < sheetData.cols) {
        updateCell(newRow, newCol, {
          value: cellData.value,
          type: cellData.type,
          formula: cellData.formula,
          style: cellData.style || {}
        });
      }
    });

    toast({
      title: "Pasted",
      description: `Pasted ${copiedEntries.length} cell(s)`,
    });
  };

  // Find and replace functionality
  const handleFindReplace = (replaceAll: boolean = false) => {
    if (!findText) return;

    let replacedCount = 0;
    const updatedCells: { row: number; col: number; newValue: any }[] = [];

    for (let row = 0; row < sheetData.rows; row++) {
      for (let col = 0; col < sheetData.cols; col++) {
        const cellData = getCellData(row, col);
        const cellValue = String(cellData.value || '');

        if (cellValue.includes(findText)) {
          const newValue = cellValue.replace(
            replaceAll ? new RegExp(findText, 'g') : findText,
            replaceText
          );
          updatedCells.push({ row, col, newValue });
          replacedCount++;

          if (!replaceAll) break;
        }
      }
      if (!replaceAll && replacedCount > 0) break;
    }

    // Apply all replacements
    updatedCells.forEach(({ row, col, newValue }) => {
      const currentCell = getCellData(row, col);
      updateCell(row, col, {
        ...currentCell,
        value: newValue
      });
    });

    toast({
      title: replaceAll ? "Replace All Complete" : "Replace Complete",
      description: `Replaced ${replacedCount} occurrence(s)`,
    });

    if (!replaceAll) {
      setFindReplaceOpen(false);
    }
  };

  const selectedCellData = selectedCell ? getCellData(selectedCell.row, selectedCell.col) : null;

  const handleNameSave = () => {
    if (sheetName.trim() && sheetName !== sheet.name) {
      updateNameMutation.mutate(sheetName.trim());
    } else {
      setEditingName(false);
      setSheetName(sheet.name);
    }
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditingName(false);
      setSheetName(sheet.name);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  onKeyDown={handleNameKeyPress}
                  onBlur={handleNameSave}
                  className="text-lg font-semibold border-none p-0 h-auto focus:ring-0"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNameSave}
                  disabled={updateNameMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-semibold">{sheetName}</DialogTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingName(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Badge variant="outline">v{sheet.metadata.version}</Badge>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 border-b">
          <Button 
            size="sm" 
            onClick={() => saveSheetMutation.mutate(sheetData)}
            disabled={saveSheetMutation.isPending}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button size="sm" variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Border tools */}
          <Button size="sm" variant="outline" onClick={() => addBorder("all")}>
            <Grid3X3 className="h-4 w-4" />
          </Button>

          <Select value={borderStyle} onValueChange={setBorderStyle}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Border style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1px solid #000000">Thin</SelectItem>
              <SelectItem value="2px solid #000000">Medium</SelectItem>
              <SelectItem value="3px solid #000000">Thick</SelectItem>
              <SelectItem value="1px dashed #000000">Dashed</SelectItem>
              <SelectItem value="1px dotted #000000">Dotted</SelectItem>
            </SelectContent>
          </Select>

          {selectedRange && (
            <>
              <Button size="sm" variant="outline" onClick={insertSumFormula}>
                <div className="flex items-center gap-1">
                  <span>Σ</span>
                  <span className="text-xs">SUM</span>
                </div>
              </Button>
              <Button size="sm" variant="outline" onClick={() => insertFormulaForRange('AVERAGE')}>
                <div className="flex items-center gap-1">
                  <span>μ</span>
                  <span className="text-xs">AVG</span>
                </div>
              </Button>
              <Button size="sm" variant="outline" onClick={() => insertFormulaForRange('COUNT')}>
                <div className="flex items-center gap-1">
                  <span>#</span>
                  <span className="text-xs">COUNT</span>
                </div>
              </Button>
              <Button size="sm" variant="outline" onClick={() => insertFormulaForRange('MAX')}>
                <div className="flex items-center gap-1">
                  <span>↑</span>
                  <span className="text-xs">MAX</span>
                </div>
              </Button>
              <Button size="sm" variant="outline" onClick={() => insertFormulaForRange('MIN')}>
                <div className="flex items-center gap-1">
                  <span>↓</span>
                  <span className="text-xs">MIN</span>
                </div>
              </Button>
            </>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Mathematical operations dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <span className="text-xs">fx</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Mathematical Functions</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('SUM')}>SUM</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('AVERAGE')}>AVERAGE</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('COUNT')}>COUNT</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('MAX')}>MAX</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('MIN')}>MIN</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('POWER')}>POWER</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('SQRT')}>SQRT</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('ABS')}>ABS</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('ROUND')}>ROUND</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('SIN')}>SIN</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('COS')}>COS</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('TAN')}>TAN</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('LOG')}>LOG</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('LOG10')}>LOG10</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('PI')}>PI</Button>
                  <Button size="sm" variant="ghost" onClick={() => insertFunction('E')}>E</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* Formatting tools */}
          <Button
            size="sm"
            variant={selectedCellData?.style?.fontWeight === 'bold' ? 'default' : 'outline'}
            onClick={() => formatCell('fontWeight', 
              selectedCellData?.style?.fontWeight === 'bold' ? 'normal' : 'bold'
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={selectedCellData?.style?.fontStyle === 'italic' ? 'default' : 'outline'}
            onClick={() => formatCell('fontStyle', 
              selectedCellData?.style?.fontStyle === 'italic' ? 'normal' : 'italic'
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={selectedCellData?.style?.textAlign === 'left' ? 'default' : 'outline'}
            onClick={() => formatCell('textAlign', 'left')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={selectedCellData?.style?.textAlign === 'center' ? 'default' : 'outline'}
            onClick={() => formatCell('textAlign', 'center')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={selectedCellData?.style?.textAlign === 'right' ? 'default' : 'outline'}
            onClick={() => formatCell('textAlign', 'right')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <Label>Text Color</Label>
                <HexColorPicker
                  color={selectedCellData?.style?.color || '#000000'}
                  onChange={(color) => formatCell('color', color)}
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={bgColorPickerOpen} onOpenChange={setBgColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <div 
                  className="w-4 h-4 border border-gray-300"
                  style={{ backgroundColor: selectedCellData?.style?.backgroundColor || '#ffffff' }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <Label>Background Color</Label>
                <HexColorPicker
                  color={selectedCellData?.style?.backgroundColor || '#ffffff'}
                  onChange={(color) => formatCell('backgroundColor', color)}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Formula Bar */}
        <div className="flex items-center gap-2 p-2 border-b">
          <Label className="text-sm font-medium min-w-fit">
            {selectedRange 
              ? `${getCellId(selectedRange.startRow, selectedRange.startCol)}:${getCellId(selectedRange.endRow, selectedRange.endCol)}`
              : selectedCell ? selectedCell.cellId : 'A1'
            }
          </Label>
          <Input
            value={formulaBarValue}
            onChange={(e) => setFormulaBarValue(e.target.value)}
            onBlur={handleFormulaBarBlur}
            onKeyDown={handleFormulaBarKeyDown}
            placeholder="Enter value or formula (=SUM(A1:A10))"
            className="flex-1"
          />
        </div>

        {/* Spreadsheet Grid */}
        <div 
          className="flex-1 overflow-auto" 
          ref={gridRef}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onKeyDown={(e) => {
            // Keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
              switch (e.key) {
                case 'c':
                  e.preventDefault();
                  handleCopy();
                  break;
                case 'v':
                  e.preventDefault();
                  handlePaste();
                  break;
                case 'f':
                  e.preventDefault();
                  setFindReplaceOpen(true);
                  break;
                case 'h':
                  e.preventDefault();
                  setFindReplaceOpen(true);
                  break;
              }
            } else {
              handleKeyPress(e);
            }
          }}
          tabIndex={0}
        >
          <div className="relative min-w-fit min-h-fit" style={{ userSelect: 'none' }}>
            {/* Column Headers */}
            <div className="flex sticky top-0 bg-gray-50 z-10">
              <div className="w-12 h-8 border border-gray-300 bg-gray-100"></div>
              {Array.from({ length: sheetData.cols }, (_, col) => (
                <div
                  key={col}
                  className="w-24 h-8 border border-gray-300 bg-gray-100 flex items-center justify-center text-sm font-medium"
                >
                  {getColumnLetter(col)}
                </div>
              ))}
            </div>

            {/* Rows */}
            {Array.from({ length: sheetData.rows }, (_, row) => (
              <div key={row} className="flex">
                {/* Row Header */}
                <div className="w-12 h-8 border border-gray-300 bg-gray-100 flex items-center justify-center text-sm font-medium sticky left-0 z-10">
                  {row + 1}
                </div>

                {/* Cells */}
                {Array.from({ length: sheetData.cols }, (_, col) => {
                  const cellData = getCellData(row, col);
                  const isSelected = selectedCell?.row === row && selectedCell?.col === col;
                  const isInRange = isInSelectedRange(row, col);

                  const cellStyle = {
                    backgroundColor: isSelected ? '#e3f2fd' : isInRange ? '#f3e5f5' : cellData.style?.backgroundColor,
                    color: cellData.style?.color,
                    fontWeight: cellData.style?.fontWeight,
                    fontStyle: cellData.style?.fontStyle,
                    textAlign: cellData.style?.textAlign as any,
                    borderTop: cellData.style?.border?.top || '1px solid #e0e0e0',
                    borderRight: cellData.style?.border?.right || '1px solid #e0e0e0',
                    borderBottom: cellData.style?.border?.bottom || '1px solid #e0e0e0',
                    borderLeft: cellData.style?.border?.left || '1px solid #e0e0e0',
                  };

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`w-24 h-8 cursor-cell relative flex items-center px-1 text-sm ${
                        isSelected ? 'ring-2 ring-blue-500' : isInRange ? 'ring-1 ring-purple-300' : 'hover:bg-gray-50'
                      }`}
                      style={cellStyle}
                      onMouseDown={(e) => handleCellMouseDown(row, col, e)}
                      onMouseEnter={() => handleCellMouseEnter(row, col)}
                      onClick={() => handleCellClick(row, col)}
                      onDoubleClick={() => handleCellDoubleClick(row, col)}
                    >
                      {isEditing && isSelected ? (
                        <Input
                          value={formulaBarValue}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setFormulaBarValue(newValue);
                          }}
                          onBlur={handleCellInputBlur}
                          onKeyDown={handleCellInputKeyDown}
                          className="w-full h-full border-none p-0 text-sm bg-transparent"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="truncate w-full" title={String(cellData.value || '')}>
                            {cellData.formula ? String(cellData.value || '') : String(cellData.value || '')}
                          </span>
                          {isSelected && (
                            <div
                              className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 cursor-se-resize"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleDragFillStart(row, col);
                              }}
                              title="Drag to fill"
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={() => saveSheetMutation.mutate(sheetData)}
            disabled={saveSheetMutation.isPending}
          >
            {saveSheetMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Find & Replace Dialog */}
      <Dialog open={findReplaceOpen} onOpenChange={setFindReplaceOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Find & Replace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="find">Find</Label>
              <Input
                id="find"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Enter text to find..."
              />
            </div>
            <div>
              <Label htmlFor="replace">Replace with</Label>
              <Input
                id="replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Enter replacement text..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFindReplaceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleFindReplace(false)}>
              Replace
            </Button>
            <Button onClick={() => handleFindReplace(true)}>
              Replace All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}