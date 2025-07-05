
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileSpreadsheet, 
  Table, 
  Calculator, 
  BarChart3,
  Zap,
  Download,
  Upload,
  Save
} from 'lucide-react';
import ExcelSpreadsheet from '@/components/spreadsheet/excel-spreadsheet';
import EnhancedSpreadsheet from '@/components/spreadsheet/enhanced-spreadsheet';
import { toast } from '@/hooks/use-toast';

const SpreadsheetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('excel');

  const handleSpreadsheetSave = (data: any) => {
    console.log('Saving spreadsheet data:', data);
    toast({
      title: "Success",
      description: "Spreadsheet data saved successfully!",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spreadsheets</h1>
          <p className="text-muted-foreground">
            Create and manage Excel-compatible spreadsheets for your projects
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Enhanced
        </Badge>
      </div>

      <Separator />

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <FileSpreadsheet className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium">Excel Compatible</p>
              <p className="text-xs text-muted-foreground">Import/Export .xlsx</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <Calculator className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium">Formulas</p>
              <p className="text-xs text-muted-foreground">Built-in calculations</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <Table className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium">Data Tables</p>
              <p className="text-xs text-muted-foreground">Interactive grids</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <BarChart3 className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium">Charts</p>
              <p className="text-xs text-muted-foreground">Visual data analysis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Spreadsheet Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="excel" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel Spreadsheet
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                Enhanced Grid
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="excel" className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Full Excel compatibility with import/export, formulas, and advanced features</span>
              </div>
              <ExcelSpreadsheet 
                onSave={handleSpreadsheetSave}
                sheetName="TestCaseTracker_Sheet"
              />
            </TabsContent>
            
            <TabsContent value="enhanced" className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Table className="h-4 w-4" />
                <span>Enhanced data grid with real-time collaboration and advanced editing</span>
              </div>
              <EnhancedSpreadsheet 
                onSave={handleSpreadsheetSave}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="font-medium">Import Excel</p>
              <p className="text-xs text-muted-foreground">Upload .xlsx/.xls files</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Download className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="font-medium">Export Data</p>
              <p className="text-xs text-muted-foreground">Download as Excel</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Save className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="font-medium">Save Template</p>
              <p className="text-xs text-muted-foreground">Create reusable templates</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpreadsheetsPage;
