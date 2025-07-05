
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  Grid,
  FileSpreadsheet,
  Calculator,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Type,
  Palette,
  MoreHorizontal,
  Copy,
  Paste,
  Cut,
  Undo,
  Redo
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface SpreadsheetData {
  id?: number;
  name: string;
  projectId: number;
  data: any[][];
  columns: string[];
  metadata?: {
    columnWidths?: number[];
    rowHeights?: number[];
    cellStyles?: { [key: string]: CellStyle };
    frozenRows?: number;
    frozenCols?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface CellStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: string;
  border?: string;
}

interface CellPosition {
  row: number;
  col: number;
}

const COLUMN_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function EnhancedSpreadsheet() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetData[]>([]);
  const [currentSpreadsheet, setCurrentSpreadsheet] = useState<SpreadsheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Spreadsheet editing state
  const [selectedCell, setSelectedCell] = useState<CellPosition>({ row: 0, col: 0 });
  const [selectedRange, setSelectedRange] = useState<{ start: CellPosition; end: CellPosition } | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [clipboardData, setClipboardData] = useState<any[][] | null>(null);
  const [undoStack, setUndoStack] = useState<SpreadsheetData[]>([]);
  const [redoStack, setRedoStack] = useState<SpreadsheetData[]>([]);
  
  // UI state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('');
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [rowHeights, setRowHeights] = useState<number[]>([]);
  
  // Refs
  const spreadsheetRef = useRef<HTMLDivElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions
  const getColumnLabel = (index: number): string => {
    let result = '';
    let num = index;
    while (num >= 0) {
      result = COLUMN_LABELS[num % 26] + result;
      num = Math.floor(num / 26) - 1;
    }
    return result;
  };

  const getCellId = (row: number, col: number): string => {
    return `${getColumnLabel(col)}${row + 1}`;
  };

  const parseFormula = (formula: string, data: any[][]): any => {
    if (!formula.startsWith('=')) return formula;
    
    try {
      // Simple formula parser for basic operations
      const expression = formula.slice(1);
      
      // Handle cell references like A1, B2, etc.
      const cellRefPattern = /([A-Z]+)(\d+)/g;
      let processedExpression = expression.replace(cellRefPattern, (match, col, row) => {
        const colIndex = col.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
        const rowIndex = parseInt(row) - 1;
        
        if (data[rowIndex] && data[rowIndex][colIndex] !== undefined) {
          const value = data[rowIndex][colIndex];
          return isNaN(value) ? `"${value}"` : value.toString();
        }
        return '0';
      });
      
      // Handle basic functions
      processedExpression = processedExpression.replace(/SUM\(([^)]+)\)/g, (match, range) => {
        // Simple SUM implementation
        const cells = range.split(',');
        let sum = 0;
        cells.forEach(cell => {
          const cellMatch = cell.trim().match(/([A-Z]+)(\d+)/);
          if (cellMatch) {
            const colIndex = cellMatch[1].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
            const rowIndex = parseInt(cellMatch[2]) - 1;
            if (data[rowIndex] && !isNaN(data[rowIndex][colIndex])) {
              sum += parseFloat(data[rowIndex][colIndex]) || 0;
            }
          }
        });
        return sum.toString();
      });
      
      // Evaluate the expression (be careful with eval in production)
      const result = Function(`"use strict"; return (${processedExpression})`)();
      return isNaN(result) ? formula : result;
    } catch (error) {
      return '#ERROR';
    }
  };

  // API functions
  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    }
  };

  const loadSpreadsheets = async (projectId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/spreadsheets?projectId=${projectId}`);
      if (response.ok) {
        const spreadsheetsData = await response.json();
        setSpreadsheets(spreadsheetsData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load spreadsheets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSpreadsheet = async () => {
    if (!selectedProject || !newSpreadsheetName.trim()) {
      toast({
        title: "Error",
        description: "Please select a project and enter a name",
        variant: "destructive"
      });
      return;
    }

    try {
      const initialData = Array(20).fill(null).map(() => Array(10).fill(''));
      const initialColumns = Array(10).fill(null).map((_, i) => `Column ${getColumnLabel(i)}`);
      
      const newSpreadsheet: Omit<SpreadsheetData, 'id'> = {
        name: newSpreadsheetName.trim(),
        projectId: selectedProject,
        data: initialData,
        columns: initialColumns,
        metadata: {
          columnWidths: Array(10).fill(120),
          rowHeights: Array(20).fill(30),
          cellStyles: {},
          frozenRows: 0,
          frozenCols: 0
        }
      };

      const response = await fetch('/api/spreadsheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpreadsheet)
      });

      if (response.ok) {
        const createdSpreadsheet = await response.json();
        setSpreadsheets(prev => [...prev, createdSpreadsheet]);
        setCurrentSpreadsheet(createdSpreadsheet);
        setNewSpreadsheetName('');
        setShowCreateDialog(false);
        initializeSpreadsheetState(createdSpreadsheet);
        
        toast({
          title: "Success",
          description: "Spreadsheet created successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create spreadsheet",
        variant: "destructive"
      });
    }
  };

  const saveSpreadsheet = async (spreadsheet: SpreadsheetData) => {
    if (!spreadsheet.id) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/spreadsheets/${spreadsheet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: spreadsheet.data,
          columns: spreadsheet.columns,
          metadata: spreadsheet.metadata
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Spreadsheet saved successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save spreadsheet",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const initializeSpreadsheetState = (spreadsheet: SpreadsheetData) => {
    setColumnWidths(spreadsheet.metadata?.columnWidths || Array(spreadsheet.columns.length).fill(120));
    setRowHeights(spreadsheet.metadata?.rowHeights || Array(spreadsheet.data.length).fill(30));
    setSelectedCell({ row: 0, col: 0 });
    setSelectedRange(null);
    setEditingCell(null);
    setCellValue('');
    setFormulaBarValue('');
  };

  const updateCellValue = (row: number, col: number, value: any) => {
    if (!currentSpreadsheet) return;

    // Add current state to undo stack
    setUndoStack(prev => [...prev.slice(-19), { ...currentSpreadsheet }]);
    setRedoStack([]);

    const newData = [...currentSpreadsheet.data];
    if (!newData[row]) newData[row] = [];
    newData[row][col] = value;

    const updatedSpreadsheet = {
      ...currentSpreadsheet,
      data: newData
    };

    setCurrentSpreadsheet(updatedSpreadsheet);

    // Auto-save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveSpreadsheet(updatedSpreadsheet);
    }, 2000);
  };

  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    if (!currentSpreadsheet) return;

    if (event.shiftKey && selectedCell) {
      // Handle range selection
      setSelectedRange({
        start: selectedCell,
        end: { row, col }
      });
    } else {
      setSelectedCell({ row, col });
      setSelectedRange(null);
    }

    const cellValue = currentSpreadsheet.data[row]?.[col] || '';
    setCellValue(cellValue);
    setFormulaBarValue(cellValue);
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    setTimeout(() => {
      cellInputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!currentSpreadsheet) return;

    const { key, ctrlKey, shiftKey } = event;

    // Handle navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault();
      const { row, col } = selectedCell;
      let newRow = row;
      let newCol = col;

      switch (key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(currentSpreadsheet.data.length - 1, row + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(currentSpreadsheet.columns.length - 1, col + 1);
          break;
      }

      if (shiftKey) {
        setSelectedRange({
          start: selectedRange?.start || selectedCell,
          end: { row: newRow, col: newCol }
        });
      } else {
        setSelectedCell({ row: newRow, col: newCol });
        setSelectedRange(null);
      }

      const cellValue = currentSpreadsheet.data[newRow]?.[newCol] || '';
      setCellValue(cellValue);
      setFormulaBarValue(cellValue);
      return;
    }

    // Handle shortcuts
    if (ctrlKey) {
      switch (key.toLowerCase()) {
        case 's':
          event.preventDefault();
          saveSpreadsheet(currentSpreadsheet);
          break;
        case 'c':
          event.preventDefault();
          handleCopy();
          break;
        case 'v':
          event.preventDefault();
          handlePaste();
          break;
        case 'x':
          event.preventDefault();
          handleCut();
          break;
        case 'z':
          event.preventDefault();
          handleUndo();
          break;
        case 'y':
          event.preventDefault();
          handleRedo();
          break;
      }
      return;
    }

    // Handle Enter and Escape
    if (key === 'Enter') {
      if (editingCell) {
        handleCellValueChange();
        setEditingCell(null);
      } else {
        setEditingCell(selectedCell);
        setTimeout(() => {
          cellInputRef.current?.focus();
        }, 0);
      }
      event.preventDefault();
    } else if (key === 'Escape') {
      if (editingCell) {
        setEditingCell(null);
        setCellValue(currentSpreadsheet.data[selectedCell.row]?.[selectedCell.col] || '');
      }
      event.preventDefault();
    }
  };

  const handleCellValueChange = () => {
    if (editingCell && currentSpreadsheet) {
      updateCellValue(editingCell.row, editingCell.col, cellValue);
    }
  };

  const handleCopy = () => {
    if (!currentSpreadsheet || !selectedRange) return;

    const { start, end } = selectedRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    const copiedData = [];
    for (let row = minRow; row <= maxRow; row++) {
      const rowData = [];
      for (let col = minCol; col <= maxCol; col++) {
        rowData.push(currentSpreadsheet.data[row]?.[col] || '');
      }
      copiedData.push(rowData);
    }

    setClipboardData(copiedData);
    toast({
      title: "Copied",
      description: `Copied ${copiedData.length} row(s) and ${copiedData[0]?.length || 0} column(s)`
    });
  };

  const handlePaste = () => {
    if (!currentSpreadsheet || !clipboardData) return;

    const { row, col } = selectedCell;
    const newData = [...currentSpreadsheet.data];

    clipboardData.forEach((rowData, rowIndex) => {
      rowData.forEach((cellData, colIndex) => {
        const targetRow = row + rowIndex;
        const targetCol = col + colIndex;
        
        if (!newData[targetRow]) newData[targetRow] = [];
        newData[targetRow][targetCol] = cellData;
      });
    });

    setCurrentSpreadsheet({
      ...currentSpreadsheet,
      data: newData
    });

    toast({
      title: "Pasted",
      description: `Pasted ${clipboardData.length} row(s) and ${clipboardData[0]?.length || 0} column(s)`
    });
  };

  const handleCut = () => {
    handleCopy();
    // Clear the selected range
    if (selectedRange && currentSpreadsheet) {
      const { start, end } = selectedRange;
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);

      const newData = [...currentSpreadsheet.data];
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (newData[row]) {
            newData[row][col] = '';
          }
        }
      }

      setCurrentSpreadsheet({
        ...currentSpreadsheet,
        data: newData
      });
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0 && currentSpreadsheet) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, currentSpreadsheet]);
      setUndoStack(prev => prev.slice(0, -1));
      setCurrentSpreadsheet(previousState);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, currentSpreadsheet!]);
      setRedoStack(prev => prev.slice(0, -1));
      setCurrentSpreadsheet(nextState);
    }
  };

  const isCellSelected = (row: number, col: number): boolean => {
    if (selectedRange) {
      const { start, end } = selectedRange;
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);
      
      return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    }
    
    return row === selectedCell.row && col === selectedCell.col;
  };

  // Effects
  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadSpreadsheets(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (currentSpreadsheet) {
      initializeSpreadsheetState(currentSpreadsheet);
    }
  }, [currentSpreadsheet]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <FileSpreadsheet className="h-6 w-6 mr-2" />
              Enhanced Spreadsheets
            </h1>
            {isSaving && (
              <Badge variant="outline" className="bg-blue-50">
                Saving...
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => currentSpreadsheet && saveSpreadsheet(currentSpreadsheet)}
              disabled={!currentSpreadsheet || isSaving}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              disabled={!selectedProject}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Sheet
            </Button>
          </div>
        </div>

        {/* Project Selection */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Project:</label>
            <Select
              value={selectedProject?.toString() || ''}
              onValueChange={(value) => setSelectedProject(parseInt(value))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentSpreadsheet && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{currentSpreadsheet.name}</Badge>
              <span className="text-sm text-gray-500">
                {currentSpreadsheet.data.length} rows × {currentSpreadsheet.columns.length} columns
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {currentSpreadsheet && (
        <div className="bg-white border-b border-gray-200 p-2">
          <div className="flex items-center space-x-2">
            {/* Formula Bar */}
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-sm font-medium min-w-[60px]">
                {getCellId(selectedCell.row, selectedCell.col)}
              </span>
              <Input
                value={formulaBarValue}
                onChange={(e) => {
                  setFormulaBarValue(e.target.value);
                  setCellValue(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateCellValue(selectedCell.row, selectedCell.col, formulaBarValue);
                    setEditingCell(null);
                  }
                }}
                placeholder="Enter value or formula (=SUM(A1,A2))"
                className="flex-1"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              <Button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                variant="ghost"
                size="sm"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                variant="ghost"
                size="sm"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button onClick={handleCopy} variant="ghost" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
              <Button onClick={handlePaste} variant="ghost" size="sm">
                <Paste className="h-4 w-4" />
              </Button>
              <Button onClick={handleCut} variant="ghost" size="sm">
                <Cut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Spreadsheets</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : !selectedProject ? (
              <div className="text-center py-8">
                <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Select a project to view spreadsheets</p>
              </div>
            ) : spreadsheets.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500 mb-4">No spreadsheets found</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Sheet
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2">
                  {spreadsheets.map((sheet) => (
                    <Card
                      key={sheet.id}
                      className={`cursor-pointer transition-colors ${
                        currentSpreadsheet?.id === sheet.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentSpreadsheet(sheet)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{sheet.name}</h4>
                            <p className="text-xs text-gray-500">
                              {sheet.data.length} rows × {sheet.columns.length} cols
                            </p>
                          </div>
                          <FileSpreadsheet className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Spreadsheet Area */}
        <div className="flex-1 bg-white overflow-hidden">
          {currentSpreadsheet ? (
            <div
              ref={spreadsheetRef}
              className="h-full overflow-auto"
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="w-12 h-8 border border-gray-300 bg-gray-100 text-xs text-center">
                      
                    </th>
                    {currentSpreadsheet.columns.map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className="h-8 border border-gray-300 bg-gray-100 text-xs font-medium text-center min-w-[120px]"
                        style={{ width: columnWidths[colIndex] || 120 }}
                      >
                        {getColumnLabel(colIndex)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentSpreadsheet.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="w-12 h-8 border border-gray-300 bg-gray-100 text-xs text-center font-medium">
                        {rowIndex + 1}
                      </td>
                      {currentSpreadsheet.columns.map((_, colIndex) => {
                        const cellValue = row[colIndex] || '';
                        const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                        const isSelected = isCellSelected(rowIndex, colIndex);
                        const displayValue = typeof cellValue === 'string' && cellValue.startsWith('=')
                          ? parseFormula(cellValue, currentSpreadsheet.data)
                          : cellValue;

                        return (
                          <td
                            key={colIndex}
                            className={`border border-gray-300 p-0 text-xs ${
                              isSelected ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-50'
                            }`}
                            style={{
                              width: columnWidths[colIndex] || 120,
                              height: rowHeights[rowIndex] || 30
                            }}
                            onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                            onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                          >
                            {isEditing ? (
                              <input
                                ref={cellInputRef}
                                value={cellValue}
                                onChange={(e) => setCellValue(e.target.value)}
                                onBlur={handleCellValueChange}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCellValueChange();
                                    setEditingCell(null);
                                    e.preventDefault();
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                    setCellValue(currentSpreadsheet.data[rowIndex]?.[colIndex] || '');
                                    e.preventDefault();
                                  }
                                }}
                                className="w-full h-full px-2 border-none outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            ) : (
                              <div className="px-2 py-1 h-full flex items-center">
                                {displayValue}
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
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Spreadsheet Selected</h3>
                <p className="text-gray-500 mb-4">
                  {!selectedProject
                    ? 'Select a project to view spreadsheets'
                    : 'Choose a spreadsheet from the sidebar or create a new one'
                  }
                </p>
                {selectedProject && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Spreadsheet
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Spreadsheet Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Spreadsheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newSpreadsheetName}
                onChange={(e) => setNewSpreadsheetName(e.target.value)}
                placeholder="Enter spreadsheet name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createSpreadsheet();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewSpreadsheetName('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={createSpreadsheet}>
                Create Spreadsheet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
