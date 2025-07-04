
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Copy, 
  Paste,
  FileSpreadsheet,
  Calculator,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Cell {
  value: string;
  formula?: string;
  style?: {
    fontWeight?: 'bold' | 'normal';
    fontStyle?: 'italic' | 'normal';
    textDecoration?: 'underline' | 'none';
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    color?: string;
  };
}

interface SpreadsheetData {
  [key: string]: Cell;
}

export function SimpleEnhancedSpreadsheet() {
  const { toast } = useToast();
  const [data, setData] = useState<SpreadsheetData>(() => {
    try {
      const saved = localStorage.getItem('spreadsheet-data');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [spreadsheetName, setSpreadsheetName] = useState('Untitled Spreadsheet');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const rows = 20;
  const cols = 10;
  const columnHeaders = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i));

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('spreadsheet-data', JSON.stringify(data));
  }, [data]);

  const getCellId = (row: number, col: number): string => {
    return `${columnHeaders[col]}${row + 1}`;
  };

  const getCellValue = (cellId: string): string => {
    const cell = data[cellId];
    if (!cell) return '';
    
    // If it's a formula, try to evaluate it
    if (cell.formula) {
      try {
        return evaluateFormula(cell.formula);
      } catch {
        return cell.value || '';
      }
    }
    
    return cell.value || '';
  };

  const evaluateFormula = (formula: string): string => {
    if (!formula.startsWith('=')) return formula;
    
    try {
      // Simple formula evaluation - just basic math for now
      const expression = formula.slice(1);
      
      // Replace cell references with their values
      const processedExpression = expression.replace(/[A-Z]+\d+/g, (cellRef) => {
        const cellValue = data[cellRef]?.value || '0';
        return isNaN(Number(cellValue)) ? '0' : cellValue;
      });
      
      // Basic safety check - only allow numbers, operators, and parentheses
      if (!/^[0-9+\-*/().\s]+$/.test(processedExpression)) {
        return '#ERROR';
      }
      
      const result = Function(`"use strict"; return (${processedExpression})`)();
      return isNaN(result) ? '#ERROR' : result.toString();
    } catch {
      return '#ERROR';
    }
  };

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId);
    const cell = data[cellId];
    setFormulaBarValue(cell?.formula || cell?.value || '');
    setIsEditing(false);
  };

  const handleCellDoubleClick = (cellId: string) => {
    setSelectedCell(cellId);
    const cell = data[cellId];
    setFormulaBarValue(cell?.formula || cell?.value || '');
    setIsEditing(true);
  };

  const handleCellChange = (cellId: string, value: string) => {
    setData(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        value: value,
        formula: value.startsWith('=') ? value : undefined
      }
    }));
  };

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    handleCellChange(selectedCell, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent, cellId: string) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      // Move to next row
      const match = cellId.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1];
        const row = parseInt(match[2]);
        const nextCell = `${col}${row + 1}`;
        if (row < rows) {
          setSelectedCell(nextCell);
          const nextCellData = data[nextCell];
          setFormulaBarValue(nextCellData?.formula || nextCellData?.value || '');
        }
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const copyCell = () => {
    setCopiedCell(selectedCell);
    toast({ title: "Cell copied", description: `Copied ${selectedCell}` });
  };

  const pasteCell = () => {
    if (copiedCell && copiedCell !== selectedCell) {
      const copiedData = data[copiedCell];
      if (copiedData) {
        setData(prev => ({
          ...prev,
          [selectedCell]: { ...copiedData }
        }));
        toast({ title: "Cell pasted", description: `Pasted to ${selectedCell}` });
      }
    }
  };

  const saveSpreadsheet = () => {
    const spreadsheetData = {
      name: spreadsheetName,
      data: data,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`spreadsheet-${Date.now()}`, JSON.stringify(spreadsheetData));
    toast({ title: "Saved", description: "Spreadsheet saved successfully" });
  };

  const exportToCSV = () => {
    const csvData: string[][] = [];
    
    // Create header row
    csvData.push(['', ...columnHeaders]);
    
    // Create data rows
    for (let row = 0; row < rows; row++) {
      const rowData: string[] = [(row + 1).toString()];
      for (let col = 0; col < cols; col++) {
        const cellId = getCellId(row, col);
        rowData.push(getCellValue(cellId));
      }
      csvData.push(rowData);
    }
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spreadsheetName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Exported", description: "CSV file downloaded" });
  };

  const clearSpreadsheet = () => {
    setData({});
    setSelectedCell('A1');
    setFormulaBarValue('');
    toast({ title: "Cleared", description: "Spreadsheet cleared" });
  };

  const newSpreadsheet = () => {
    clearSpreadsheet();
    setSpreadsheetName('Untitled Spreadsheet');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileSpreadsheet className="h-6 w-6 text-green-600" />
          <Input
            value={spreadsheetName}
            onChange={(e) => setSpreadsheetName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:ring-0 w-64"
          />
          <Badge variant="secondary">Auto-saved</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={newSpreadsheet} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
          <Button onClick={saveSpreadsheet} variant="outline" size="sm">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button onClick={clearSpreadsheet} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b p-2 flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Button onClick={copyCell} variant="outline" size="sm">
            <Copy className="h-4 w-4" />
          </Button>
          <Button onClick={pasteCell} variant="outline" size="sm">
            <Paste className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="border-l mx-2 h-6"></div>
        
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Underline className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="border-l mx-2 h-6"></div>
        
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 flex items-center space-x-2 ml-4">
          <Calculator className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">{selectedCell}</span>
          <Input
            value={formulaBarValue}
            onChange={(e) => handleFormulaBarChange(e.target.value)}
            placeholder="Enter value or formula (=A1+B1)"
            className="flex-1"
          />
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="inline-block min-w-full min-h-full">
          <table className="border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600"></th>
                {columnHeaders.map((header) => (
                  <th key={header} className="w-24 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 text-center">
                    {rowIndex + 1}
                  </td>
                  {Array.from({ length: cols }, (_, colIndex) => {
                    const cellId = getCellId(rowIndex, colIndex);
                    const isSelected = selectedCell === cellId;
                    const isCopied = copiedCell === cellId;
                    
                    return (
                      <td key={cellId} className="relative">
                        <div
                          className={`w-24 h-8 border border-gray-300 cursor-cell ${
                            isSelected ? 'bg-blue-100 border-blue-500' : 
                            isCopied ? 'bg-green-100 border-green-500' : 
                            'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => handleCellClick(cellId)}
                          onDoubleClick={() => handleCellDoubleClick(cellId)}
                        >
                          {isEditing && isSelected ? (
                            <Input
                              value={formulaBarValue}
                              onChange={(e) => handleFormulaBarChange(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, cellId)}
                              onBlur={() => setIsEditing(false)}
                              className="w-full h-full border-none bg-transparent p-1 text-xs focus:ring-0"
                              autoFocus
                            />
                          ) : (
                            <div className="w-full h-full p-1 text-xs overflow-hidden">
                              {getCellValue(cellId)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t p-2 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          <span>Sheet1</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{Object.keys(data).length} cells with data</span>
          <span>Auto-save enabled</span>
        </div>
      </div>
    </div>
  );
}
