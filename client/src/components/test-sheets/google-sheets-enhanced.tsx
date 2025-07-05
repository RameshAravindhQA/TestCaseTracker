import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Save, 
  Download, 
  Upload, 
  Plus, 
  Minus, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type,
  Grid3x3,
  Calculator,
  TrendingUp,
  FileSpreadsheet,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Copy,
  Clipboard,
  Undo,
  Redo,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cell {
  value: string;
  formula?: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
  };
  type?: 'text' | 'number' | 'formula' | 'date';
}

interface TestSheet {
  id: number;
  name: string;
  projectId: number;
  data: {
    cells: { [key: string]: Cell };
    rows: number;
    cols: number;
  };
  metadata: {
    version: number;
    lastModifiedBy: number;
    collaborators: any[];
    chartConfigs: any[];
    namedRanges: any[];
  };
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
}

interface GoogleSheetsEnhancedProps {
  selectedSheet?: TestSheet;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

export function GoogleSheetsEnhanced({ selectedSheet, onSave, onClose }: GoogleSheetsEnhancedProps) {
  const { toast } = useToast();
  
  // State management
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(selectedSheet?.projectId || null);
  const [currentSheet, setCurrentSheet] = useState<TestSheet | null>(selectedSheet || null);
  const [cells, setCells] = useState<{ [key: string]: Cell }>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  
  // Refs
  const tableRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Constants
  const ROWS = 100;
  const COLS = 26;
  const COLUMN_LETTERS = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));

  // Queries
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !selectedSheet // Only load if no sheet is pre-selected
  });

  const { data: sheets = [], isLoading: sheetsLoading, refetch: refetchSheets } = useQuery<TestSheet[]>({
    queryKey: ['/api/test-sheets', selectedProjectId],
    enabled: !!selectedProjectId && !selectedSheet
  });

  // Mutations
  const saveSheetMutation = useMutation({
    mutationFn: async (data: { id: number; cells: any }) => {
      const response = await apiRequest('PATCH', `/api/test-sheets/${data.id}`, {
        data: {
          cells: data.cells,
          rows: ROWS,
          cols: COLS
        }
      });
      return response.json();
    },
    onSuccess: () => {
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Test sheet saved successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save test sheet",
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const getCellId = (row: number, col: number) => `${COLUMN_LETTERS[col]}${row + 1}`;
  
  const parseCellId = (cellId: string) => {
    const match = cellId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    const col = match[1].charCodeAt(0) - 65;
    const row = parseInt(match[2]) - 1;
    return { row, col };
  };

  const getCellValue = (cellId: string): string => {
    const cell = cells[cellId];
    if (!cell) return '';
    if (cell.formula && cell.formula.startsWith('=')) {
      return evaluateFormula(cell.formula);
    }
    return cell.value || '';
  };

  const evaluateFormula = (formula: string): string => {
    try {
      // Simple formula evaluation for basic operations
      const expression = formula.slice(1); // Remove '='
      
      // Handle cell references (A1, B2, etc.)
      const cellRefRegex = /[A-Z]+\d+/g;
      const processedExpression = expression.replace(cellRefRegex, (match) => {
        const cellValue = getCellValue(match);
        return cellValue || '0';
      });
      
      // Basic math evaluation (be careful with eval in production)
      const result = Function(`"use strict"; return (${processedExpression})`)();
      return result.toString();
    } catch (error) {
      return '#ERROR';
    }
  };

  const getAutoSuggestions = (value: string): string[] => {
    const suggestions: string[] = [];
    
    // Formula suggestions
    if (value.startsWith('=')) {
      const formulas = ['=SUM(', '=AVERAGE(', '=COUNT(', '=MAX(', '=MIN(', '=IF(', '=VLOOKUP('];
      suggestions.push(...formulas.filter(f => f.toLowerCase().includes(value.toLowerCase())));
    }
    
    // Data suggestions based on existing values in the column
    if (selectedCell && !value.startsWith('=')) {
      const parsed = parseCellId(selectedCell);
      if (parsed) {
        const columnValues = new Set<string>();
        for (let row = 0; row < ROWS; row++) {
          const cellId = getCellId(row, parsed.col);
          const cellValue = getCellValue(cellId);
          if (cellValue && cellValue.toLowerCase().includes(value.toLowerCase())) {
            columnValues.add(cellValue);
          }
        }
        suggestions.push(...Array.from(columnValues).slice(0, 5));
      }
    }
    
    return suggestions;
  };

  // Event handlers
  const handleCellClick = (row: number, col: number) => {
    const cellId = getCellId(row, col);
    setSelectedCell(cellId);
    setIsEditing(false);
    
    const cell = cells[cellId];
    if (cell?.formula) {
      setEditValue(cell.formula);
    } else {
      setEditValue(cell?.value || '');
    }
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    const cellId = getCellId(row, col);
    setSelectedCell(cellId);
    setIsEditing(true);
    
    const cell = cells[cellId];
    if (cell?.formula) {
      setEditValue(cell.formula);
    } else {
      setEditValue(cell?.value || '');
    }
    
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 0);
  };

  const handleCellValueChange = (value: string) => {
    setEditValue(value);
    
    // Show auto-suggestions
    const autoSuggestions = getAutoSuggestions(value);
    setSuggestions(autoSuggestions);
    setShowSuggestions(autoSuggestions.length > 0);
    setSelectedSuggestion(0);
  };

  const commitCellValue = () => {
    if (!selectedCell) return;
    
    const newCells = { ...cells };
    const isFormula = editValue.startsWith('=');
    
    newCells[selectedCell] = {
      value: isFormula ? evaluateFormula(editValue) : editValue,
      formula: isFormula ? editValue : undefined,
      type: isFormula ? 'formula' : isNaN(Number(editValue)) ? 'text' : 'number'
    };
    
    setCells(newCells);
    setHasChanges(true);
    setIsEditing(false);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;
    
    const parsed = parseCellId(selectedCell);
    if (!parsed) return;
    
    let newRow = parsed.row;
    let newCol = parsed.col;
    
    if (isEditing) {
      if (e.key === 'Enter') {
        if (showSuggestions && suggestions.length > 0) {
          setEditValue(suggestions[selectedSuggestion]);
          setShowSuggestions(false);
          return;
        }
        commitCellValue();
        newRow = Math.min(parsed.row + 1, ROWS - 1);
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setShowSuggestions(false);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitCellValue();
        newCol = Math.min(parsed.col + 1, COLS - 1);
      } else if (showSuggestions) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestion(Math.min(selectedSuggestion + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestion(Math.max(selectedSuggestion - 1, 0));
        }
      }
    } else {
      switch (e.key) {
        case 'Enter':
        case 'F2':
          setIsEditing(true);
          setTimeout(() => editInputRef.current?.focus(), 0);
          return;
        case 'ArrowUp':
          newRow = Math.max(parsed.row - 1, 0);
          break;
        case 'ArrowDown':
          newRow = Math.min(parsed.row + 1, ROWS - 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(parsed.col - 1, 0);
          break;
        case 'ArrowRight':
          newCol = Math.min(parsed.col + 1, COLS - 1);
          break;
        case 'Tab':
          e.preventDefault();
          newCol = Math.min(parsed.col + 1, COLS - 1);
          break;
        case 'Delete':
        case 'Backspace':
          const newCells = { ...cells };
          delete newCells[selectedCell];
          setCells(newCells);
          setHasChanges(true);
          return;
      }
    }
    
    if (newRow !== parsed.row || newCol !== parsed.col) {
      const newCellId = getCellId(newRow, newCol);
      setSelectedCell(newCellId);
      const cell = cells[newCellId];
      setEditValue(cell?.formula || cell?.value || '');
    }
  };

  const handleSave = () => {
    if (currentSheet && hasChanges) {
      saveSheetMutation.mutate({
        id: currentSheet.id,
        cells
      });
    }
  };

  const handleSheetSelect = (sheet: TestSheet) => {
    setCurrentSheet(sheet);
    setCells(sheet.data.cells || {});
    setHasChanges(false);
    setSelectedCell('A1');
    setEditValue('');
  };

  // Load sheet data on mount
  useEffect(() => {
    if (selectedSheet) {
      setCells(selectedSheet.data.cells || {});
      setSelectedCell('A1');
    }
  }, [selectedSheet]);

  // Keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [hasChanges, currentSheet]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                {currentSheet ? currentSheet.name : 'Enhanced Test Sheets'}
              </h1>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600">
                Unsaved changes
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Button 
                onClick={handleSave} 
                disabled={saveSheetMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2">
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Redo className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Underline className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <AlignRight className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm">
            <Palette className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm">
            <Calculator className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="border-b border-gray-200 p-2">
        <div className="flex items-center space-x-2">
          <div className="w-16 text-sm font-mono text-gray-600">
            {selectedCell || 'A1'}
          </div>
          <div className="flex-1">
            <Input
              value={editValue}
              onChange={(e) => handleCellValueChange(e.target.value)}
              placeholder="Enter value or formula (start with = for formulas)"
              className="font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitCellValue();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Sheet Selection */}
      {!selectedSheet && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select
                value={selectedProjectId?.toString() || ''}
                onValueChange={(value) => setSelectedProjectId(parseInt(value))}
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
            {selectedProjectId && (
              <div className="flex-1">
                <Select
                  value={currentSheet?.id.toString() || ''}
                  onValueChange={(value) => {
                    const sheet = sheets.find(s => s.id === parseInt(value));
                    if (sheet) handleSheetSelect(sheet);
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a test sheet" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map((sheet) => (
                      <SelectItem key={sheet.id} value={sheet.id.toString()}>
                        {sheet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto" ref={tableRef} onKeyDown={handleKeyDown} tabIndex={0}>
        {currentSheet || selectedSheet ? (
          <div className="relative">
            <table className="border-collapse">
              {/* Header row */}
              <thead>
                <tr>
                  <th className="w-12 h-8 border border-gray-300 bg-gray-100 text-xs font-medium text-gray-600"></th>
                  {COLUMN_LETTERS.map((letter) => (
                    <th
                      key={letter}
                      className="min-w-24 h-8 border border-gray-300 bg-gray-100 text-xs font-medium text-gray-600 px-2"
                    >
                      {letter}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROWS }, (_, row) => (
                  <tr key={row}>
                    <td className="w-12 h-6 border border-gray-300 bg-gray-100 text-xs font-medium text-gray-600 text-center">
                      {row + 1}
                    </td>
                    {Array.from({ length: COLS }, (_, col) => {
                      const cellId = getCellId(row, col);
                      const isSelected = selectedCell === cellId;
                      const cellValue = getCellValue(cellId);
                      
                      return (
                        <td
                          key={col}
                          className={cn(
                            "min-w-24 h-6 border border-gray-300 px-1 text-xs cursor-cell relative",
                            isSelected && "ring-2 ring-blue-500 bg-blue-50"
                          )}
                          onClick={() => handleCellClick(row, col)}
                          onDoubleClick={() => handleCellDoubleClick(row, col)}
                        >
                          {isSelected && isEditing ? (
                            <div className="relative">
                              <Input
                                ref={editInputRef}
                                value={editValue}
                                onChange={(e) => handleCellValueChange(e.target.value)}
                                className="absolute inset-0 border-0 p-0 text-xs h-6 bg-white"
                                onBlur={commitCellValue}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    commitCellValue();
                                  } else if (e.key === 'Escape') {
                                    setIsEditing(false);
                                    setShowSuggestions(false);
                                  }
                                }}
                              />
                              {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-6 left-0 z-10 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
                                  {suggestions.map((suggestion, index) => (
                                    <div
                                      key={index}
                                      className={cn(
                                        "px-2 py-1 text-xs cursor-pointer",
                                        index === selectedSuggestion ? "bg-blue-100" : "hover:bg-gray-100"
                                      )}
                                      onClick={() => {
                                        setEditValue(suggestion);
                                        setShowSuggestions(false);
                                      }}
                                    >
                                      {suggestion}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="truncate block">
                              {cellValue}
                            </span>
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
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Test Sheet</h3>
              <p className="text-gray-500">Choose a project and test sheet to start editing</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            {selectedCell && (
              <span>Cell: {selectedCell}</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>Rows: {ROWS}</span>
            <span>Columns: {COLS}</span>
            {saveSheetMutation.isPending && (
              <div className="flex items-center space-x-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}