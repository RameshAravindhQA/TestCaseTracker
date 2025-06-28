
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TestSheet } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Save, Download, Upload, Copy, Paste, Undo, Redo } from 'lucide-react';

interface TestSheetEditorProps {
  sheet: TestSheet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

interface CellData {
  value: string | number;
  type: 'text' | 'number' | 'formula';
  style?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: string;
    border?: string;
  };
}

const COLUMNS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

function TestSheetEditor({ sheet, open, onOpenChange, onSave }: TestSheetEditorProps) {
  const [cells, setCells] = useState<Record<string, CellData>>(sheet.data.cells || {});
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<TestSheet>) => {
      const response = await apiRequest('PUT', `/api/test-sheets/${sheet.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test sheet saved",
        description: "Your changes have been saved successfully.",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: [`/api/test-sheets`] });
      onSave?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save test sheet: ${error}`,
        variant: "destructive",
      });
    },
  });

  const getCellKey = (row: number, col: number) => `${COLUMNS[col]}${row + 1}`;
  
  const getCellValue = (cellKey: string) => {
    const cell = cells[cellKey];
    if (!cell) return '';
    return cell.value?.toString() || '';
  };

  const updateCell = useCallback((cellKey: string, value: string | number) => {
    setCells(prev => {
      const newCells = { ...prev };
      if (value === '' || value === null || value === undefined) {
        delete newCells[cellKey];
      } else {
        newCells[cellKey] = {
          value,
          type: typeof value === 'number' ? 'number' : 'text',
          style: prev[cellKey]?.style || {}
        };
      }
      return newCells;
    });
    setHasChanges(true);
  }, []);

  const handleCellClick = (cellKey: string) => {
    if (editingCell && editingCell !== cellKey) {
      // Save the current editing cell
      updateCell(editingCell, editValue);
      setEditingCell(null);
    }
    setSelectedCell(cellKey);
  };

  const handleCellDoubleClick = (cellKey: string) => {
    setEditingCell(cellKey);
    setEditValue(getCellValue(cellKey));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleCellEdit = (value: string) => {
    setEditValue(value);
  };

  const handleCellSubmit = () => {
    if (editingCell) {
      updateCell(editingCell, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCellSubmit();
      } else if (e.key === 'Escape') {
        setEditingCell(null);
        setEditValue('');
      }
    } else {
      // Navigation
      const [col, row] = selectedCell.match(/([A-Z]+)(\d+)/)?.slice(1, 3) || ['A', '1'];
      const colIndex = COLUMNS.indexOf(col);
      const rowIndex = parseInt(row) - 1;

      let newCol = colIndex;
      let newRow = rowIndex;

      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, rowIndex - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(99, rowIndex + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, colIndex - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(25, colIndex + 1);
          break;
        case 'Enter':
          handleCellDoubleClick(selectedCell);
          break;
        case 'Delete':
          updateCell(selectedCell, '');
          break;
      }

      if (newCol !== colIndex || newRow !== rowIndex) {
        setSelectedCell(getCellKey(newRow, newCol));
      }
    }
  };

  const handleSave = () => {
    if (editingCell) {
      updateCell(editingCell, editValue);
      setEditingCell(null);
    }

    const updatedSheet = {
      ...sheet,
      data: {
        ...sheet.data,
        cells
      },
      metadata: {
        ...sheet.metadata,
        version: (sheet.metadata.version || 1) + 1,
        lastModifiedBy: 1 // This should come from auth context
      }
    };

    saveMutation.mutate(updatedSheet);
  };

  const exportToCSV = () => {
    const rows = [];
    const maxRow = Math.max(...Object.keys(cells).map(key => {
      const match = key.match(/[A-Z]+(\d+)/);
      return match ? parseInt(match[1]) : 1;
    }), 10);
    
    const maxCol = Math.max(...Object.keys(cells).map(key => {
      const match = key.match(/([A-Z]+)\d+/);
      return match ? COLUMNS.indexOf(match[1]) : 0;
    }), 5);

    for (let row = 0; row < maxRow; row++) {
      const rowData = [];
      for (let col = 0; col <= maxCol; col++) {
        const cellKey = getCellKey(row, col);
        rowData.push(getCellValue(cellKey));
      }
      rows.push(rowData.join(','));
    }

    const csvContent = rows.join('\n');
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
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{sheet.name}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saveMutation.isPending}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Formula Bar */}
          <div className="border-b p-2 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm min-w-[60px]">{selectedCell}:</span>
              <Input
                ref={inputRef}
                value={editingCell === selectedCell ? editValue : getCellValue(selectedCell)}
                onChange={(e) => editingCell === selectedCell ? handleCellEdit(e.target.value) : updateCell(selectedCell, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateCell(selectedCell, e.currentTarget.value);
                  }
                }}
                className="flex-1"
                placeholder="Enter value..."
              />
            </div>
          </div>

          {/* Spreadsheet Grid */}
          <div className="flex-1 overflow-auto">
            <div className="inline-block min-w-full">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="w-12 h-8 border border-gray-300 bg-gray-100 text-xs font-medium"></th>
                    {COLUMNS.map((col) => (
                      <th
                        key={col}
                        className="w-24 h-8 border border-gray-300 bg-gray-100 text-xs font-medium text-center"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody onKeyDown={handleKeyDown} tabIndex={0}>
                  {Array.from({ length: 100 }, (_, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="w-12 h-8 border border-gray-300 bg-gray-100 text-xs font-medium text-center">
                        {rowIndex + 1}
                      </td>
                      {COLUMNS.map((col, colIndex) => {
                        const cellKey = getCellKey(rowIndex, colIndex);
                        const isSelected = selectedCell === cellKey;
                        const isEditing = editingCell === cellKey;
                        
                        return (
                          <td
                            key={cellKey}
                            className={`w-24 h-8 border border-gray-300 relative cursor-pointer ${
                              isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => handleCellClick(cellKey)}
                            onDoubleClick={() => handleCellDoubleClick(cellKey)}
                          >
                            {isEditing ? (
                              <Input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => handleCellEdit(e.target.value)}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === 'Enter') {
                                    handleCellSubmit();
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                    setEditValue('');
                                  }
                                }}
                                onBlur={handleCellSubmit}
                                className="w-full h-full border-none p-1 text-xs"
                                autoFocus
                              />
                            ) : (
                              <div className="w-full h-full p-1 text-xs overflow-hidden">
                                {getCellValue(cellKey)}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TestSheetEditor;
export { TestSheetEditor };
