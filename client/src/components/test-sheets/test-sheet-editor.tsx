
import { useState, useEffect, useRef, useCallback } from "react";
import { TestSheet, CellData, CellValue } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Update cell data
  const updateCell = useCallback((row: number, col: number, updates: Partial<CellData>) => {
    const cellId = getCellId(row, col);
    setSheetData(prev => ({
      ...prev,
      cells: {
        ...prev.cells,
        [cellId]: {
          ...getCellData(row, col),
          ...updates,
        },
      },
    }));
  }, [sheetData.cells]);

  // Save sheet mutation
  const saveSheetMutation = useMutation({
    mutationFn: async (data: typeof sheetData) => {
      return apiRequest('PUT', `/api/test-sheets/${sheet.id}`, {
        ...sheet,
        data,
        metadata: {
          ...sheet.metadata,
          version: sheet.metadata.version + 1,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Sheet saved",
        description: "Your changes have been saved successfully.",
      });
      onSave();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save sheet: ${error}`,
        variant: "destructive",
      });
    },
  });

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

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    const cellId = getCellId(row, col);
    setSelectedCell({ row, col, cellId });
    
    const cellData = getCellData(row, col);
    if (cellData.formula) {
      setFormulaBarValue(cellData.formula);
    } else {
      setFormulaBarValue(String(cellData.value || ''));
    }
    setIsEditing(false);
  };

  // Handle cell double click to start editing
  const handleCellDoubleClick = (row: number, col: number) => {
    setSelectedCell({ row, col, cellId: getCellId(row, col) });
    setIsEditing(true);
  };

  // Handle formula bar change
  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    
    if (selectedCell) {
      let cellValue: any = value;
      let cellType: CellData['type'] = 'text';
      let formula: string | undefined;

      // Determine cell type and process value
      if (value.startsWith('=')) {
        cellType = 'formula';
        formula = value;
        // Evaluate formula
        try {
          const context = Object.keys(sheetData.cells).reduce((acc, cellId) => {
            acc[cellId] = sheetData.cells[cellId].value;
            return acc;
          }, {} as Record<string, any>);
          cellValue = formulaEngine.evaluate(value, context);
        } catch (error) {
          cellValue = '#ERROR!';
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

      // Force update the cell data
      setSheetData(prev => ({
        ...prev,
        cells: {
          ...prev.cells,
          [selectedCell.cellId]: {
            value: cellValue,
            type: cellType,
            formula,
            style: getCellData(selectedCell.row, selectedCell.col).style || {},
          },
        },
      }));
    }
  };

  // Handle key press in grid
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

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
        if (row < sheetData.rows - 1) handleCellClick(row + 1, col);
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
        if (!isEditing) {
          setFormulaBarValue('=');
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

  const selectedCellData = selectedCell ? getCellData(selectedCell.row, selectedCell.col) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {sheet.name}
          </DialogTitle>
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
            onBlur={() => handleFormulaBarChange(formulaBarValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFormulaBarChange(formulaBarValue);
              }
            }}
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
                          onChange={(e) => setFormulaBarValue(e.target.value)}
                          onBlur={() => {
                            handleFormulaBarChange(formulaBarValue);
                            setIsEditing(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleFormulaBarChange(formulaBarValue);
                              setIsEditing(false);
                            } else if (e.key === 'Escape') {
                              setIsEditing(false);
                            }
                          }}
                          className="w-full h-full border-none p-0 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate w-full">
                          {cellData.type === 'formula' ? cellData.value : (cellData.value || '')}
                        </span>
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
    </Dialog>
  );
}
