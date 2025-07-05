import React, { useState, useCallback, useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Upload, Save, Plus, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Register Handsontable modules
registerAllModules();

interface ExcelSpreadsheetProps {
  projectId?: number;
  onSave?: (data: any) => void;
  initialData?: any[][];
  sheetName?: string;
}

const ExcelSpreadsheet: React.FC<ExcelSpreadsheetProps> = ({
  projectId,
  onSave,
  initialData = [[]],
  sheetName = 'Sheet1'
}) => {
  const hotTableRef = useRef<HotTable>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<any[][]>(initialData);
  const [fileName, setFileName] = useState(sheetName);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with sample data if empty
  useEffect(() => {
    if (data.length === 1 && data[0].length === 0) {
      const sampleData = [
        ['Name', 'Age', 'City', 'Salary', 'Department'],
        ['John Doe', 30, 'New York', 50000, 'Engineering'],
        ['Jane Smith', 25, 'Los Angeles', 45000, 'Marketing'],
        ['Bob Johnson', 35, 'Chicago', 60000, 'Sales'],
        ['Alice Brown', 28, 'Houston', 55000, 'Engineering'],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
      ];
      setData(sampleData);
    }
  }, []);

  const handleDataChange = useCallback((changes: any, source: string) => {
    if (source === 'edit' || source === 'paste' || source === 'autofill') {
      const hotInstance = hotTableRef.current?.hotInstance;
      if (hotInstance) {
        const newData = hotInstance.getData();
        setData(newData);
      }
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setIsLoading(true);
      const hotInstance = hotTableRef.current?.hotInstance;
      if (hotInstance) {
        const currentData = hotInstance.getData();

        // Save to parent component if callback provided
        if (onSave) {
          onSave({
            data: currentData,
            fileName,
            projectId,
            lastModified: new Date().toISOString()
          });
        }

        toast({
          title: "Success",
          description: "Spreadsheet saved successfully!",
        });
      }
    } catch (error) {
      console.error('Error saving spreadsheet:', error);
      toast({
        title: "Error",
        description: "Failed to save spreadsheet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onSave, fileName, projectId]);

  const handleExportExcel = useCallback(() => {
    try {
      const hotInstance = hotTableRef.current?.hotInstance;
      if (hotInstance) {
        const currentData = hotInstance.getData();

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Convert data to worksheet
        const ws = XLSX.utils.aoa_to_sheet(currentData);

        // Add the worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, fileName);

        // Write and download
        XLSX.writeFile(wb, `${fileName}.xlsx`);

        toast({
          title: "Success",
          description: "Excel file exported successfully!",
        });
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "Error",
        description: "Failed to export Excel file.",
        variant: "destructive",
      });
    }
  }, [fileName]);

  const handleImportExcel = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Get first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          // Convert to array of arrays
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Ensure minimum size
          const processedData = jsonData.length > 0 ? jsonData : [[]];

          setData(processedData as any[][]);
          setFileName(file.name.replace(/\.[^/.]+$/, ""));

          toast({
            title: "Success",
            description: "Excel file imported successfully!",
          });
        } catch (error) {
          console.error('Error processing Excel file:', error);
          toast({
            title: "Error",
            description: "Failed to process Excel file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast({
        title: "Error",
        description: "Failed to import Excel file.",
        variant: "destructive",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const addNewSheet = useCallback(() => {
    const newData = Array(10).fill(null).map(() => Array(8).fill(''));
    setData(newData);
    setFileName(`Sheet_${Date.now()}`);

    toast({
      title: "Success",
      description: "New sheet created!",
    });
  }, []);

  const settings: Handsontable.GridSettings = {
    data: data,
    rowHeaders: true,
    colHeaders: true,
    contextMenu: true,
    manualRowResize: true,
    manualColumnResize: true,
    manualRowMove: true,
    manualColumnMove: true,
    fillHandle: true,
    autoWrapRow: true,
    autoWrapCol: true,
    stretchH: 'all',
    width: '100%',
    height: 500,
    licenseKey: 'non-commercial-and-evaluation',
    afterChange: handleDataChange,
    cells: function (row, col) {
      const cellProperties: any = {};

      // Header row styling
      if (row === 0) {
        cellProperties.className = 'header-cell';
        cellProperties.renderer = function (instance: any, td: HTMLElement, row: number, col: number, prop: any, value: any, cellProperties: any) {
          Handsontable.renderers.TextRenderer.apply(this, arguments as any);
          td.style.backgroundColor = '#f8f9fa';
          td.style.fontWeight = 'bold';
          td.style.textAlign = 'center';
          return td;
        };
      }

      return cellProperties;
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Spreadsheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="fileName">Sheet Name:</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-40"
                placeholder="Sheet name"
              />
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                size="sm"
                variant="default"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>

              <Button
                onClick={addNewSheet}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Sheet
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportExcel}
                size="sm"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-1" />
                Export Excel
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-1" />
                Import Excel
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                className="hidden"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <HotTable
              ref={hotTableRef}
              settings={settings}
            />
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>Features: Cell editing, formulas, import/export Excel, context menu, resizable columns/rows</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExcelSpreadsheet;