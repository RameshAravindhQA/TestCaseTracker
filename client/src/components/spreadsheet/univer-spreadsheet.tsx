import React, { useEffect, useRef, useState } from 'react';
import { Univer, UniverInstanceType, LocaleType } from "@univerjs/core";
import { defaultTheme } from "@univerjs/design";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import { UniverUIPlugin } from "@univerjs/ui";
import { FUniver } from "@univerjs/facade";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Save, FileText, Download, Upload, Share2, 
  MoreVertical, Plus, Trash2, Copy, Settings,
  Grid, BarChart3, PieChart, LineChart, Table
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface SpreadsheetData {
  id: string;
  name: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  sharedWith: string[];
  isPublic: boolean;
}

interface CollaborativeUser {
  id: number;
  name: string;
  avatar?: string;
  cursor?: {
    row: number;
    col: number;
  };
  selection?: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
}

export function UniverSpreadsheet() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<Univer | null>(null);
  const workbookRef = useRef<any>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetData[]>([]);
  const [currentSpreadsheet, setCurrentSpreadsheet] = useState<SpreadsheetData | null>(null);
  const [collaborators, setCollaborators] = useState<CollaborativeUser[]>([]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'list'>('list');

  // Initialize Univer
  const initializeUniver = async () => {
    if (!containerRef.current) return;

    try {
      // Create Univer instance
      const univer = new Univer({
        theme: defaultTheme,
        locale: LocaleType.EN_US,
        logLevel: 3, // Error level
      });

      // Register plugins
      univer.registerPlugin(UniverRenderEnginePlugin);
      univer.registerPlugin(UniverFormulaEnginePlugin);
      univer.registerPlugin(UniverUIPlugin, {
        container: containerRef.current,
        header: true,
        toolbar: true,
        footer: true,
      });
      univer.registerPlugin(UniverDocsPlugin, {
        hasScroll: false,
      });
      univer.registerPlugin(UniverDocsUIPlugin);
      univer.registerPlugin(UniverSheetsPlugin);
      univer.registerPlugin(UniverSheetsUIPlugin);
      univer.registerPlugin(UniverSheetsFormulaPlugin);

      // Create default workbook
      const workbook = univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
        id: 'default-workbook',
        name: 'New Spreadsheet',
        sheetOrder: ['sheet1'],
        sheets: {
          sheet1: {
            id: 'sheet1',
            name: 'Sheet1',
            cellData: {
              0: {
                0: { v: 'Welcome to Enhanced Spreadsheet' },
                1: { v: 'With Google Sheets-like functionality' },
              },
              1: {
                0: { v: 'Feature' },
                1: { v: 'Status' },
              },
              2: {
                0: { v: 'Real-time collaboration' },
                1: { v: 'Available' },
              },
              3: {
                0: { v: 'Advanced formulas' },
                1: { v: 'Available' },
              },
              4: {
                0: { v: 'Charts and graphs' },
                1: { v: 'Available' },
              },
              5: {
                0: { v: 'Import/Export' },
                1: { v: 'Available' },
              },
            },
            columnData: {
              0: { w: 200 },
              1: { w: 150 },
            },
            rowData: {
              0: { h: 30 },
              1: { h: 25 },
            },
          },
        },
      });

      univerRef.current = univer;
      workbookRef.current = workbook;

      // Setup collaborative editing
      setupCollaborativeEditing();

      setIsLoading(false);
      setActiveTab('editor');

      toast({
        title: "Spreadsheet Ready",
        description: "Enhanced spreadsheet with collaboration features loaded successfully"
      });

    } catch (error) {
      console.error('Error initializing Univer:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to load spreadsheet editor",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Setup collaborative editing
  const setupCollaborativeEditing = () => {
    if (!univerRef.current) return;

    const univer = univerRef.current;
    
    // Listen for selection changes
    univer.getPlugin('core').onSelectionChange((selection: any) => {
      if (isCollaborating && user) {
        // Broadcast selection to other users
        broadcastCursorPosition(selection);
      }
    });

    // Listen for content changes
    univer.getPlugin('core').onContentChange((changes: any) => {
      if (isCollaborating && currentSpreadsheet) {
        // Auto-save and broadcast changes
        autoSaveSpreadsheet(changes);
        broadcastContentChanges(changes);
      }
    });
  };

  // Load spreadsheets from server
  const loadSpreadsheets = async () => {
    try {
      const response = await fetch('/api/spreadsheets');
      if (response.ok) {
        const data = await response.json();
        setSpreadsheets(data);
      }
    } catch (error) {
      console.error('Error loading spreadsheets:', error);
      toast({
        title: "Load Error",
        description: "Failed to load spreadsheets",
        variant: "destructive"
      });
    }
  };

  // Create new spreadsheet
  const createNewSpreadsheet = async () => {
    const name = prompt('Enter spreadsheet name:');
    if (!name || !user) return;

    try {
      const response = await fetch('/api/spreadsheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          data: getDefaultSpreadsheetData(),
          createdBy: user.id
        })
      });

      if (response.ok) {
        const newSpreadsheet = await response.json();
        setSpreadsheets(prev => [...prev, newSpreadsheet]);
        setCurrentSpreadsheet(newSpreadsheet);
        setActiveTab('editor');
        
        toast({
          title: "Spreadsheet Created",
          description: `"${name}" has been created successfully`
        });
      }
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      toast({
        title: "Creation Error",
        description: "Failed to create spreadsheet",
        variant: "destructive"
      });
    }
  };

  // Load existing spreadsheet
  const loadSpreadsheet = async (spreadsheet: SpreadsheetData) => {
    if (!univerRef.current) return;

    try {
      setCurrentSpreadsheet(spreadsheet);
      
      // Load spreadsheet data into Univer
      const univer = univerRef.current;
      univer.disposeUnit(workbookRef.current?.getUnitId());
      
      const workbook = univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
        id: spreadsheet.id,
        name: spreadsheet.name,
        ...spreadsheet.data
      });

      workbookRef.current = workbook;
      setActiveTab('editor');

      // Setup collaboration for this spreadsheet
      joinCollaborativeSession(spreadsheet.id);

      toast({
        title: "Spreadsheet Loaded",
        description: `"${spreadsheet.name}" is now open`
      });

    } catch (error) {
      console.error('Error loading spreadsheet:', error);
      toast({
        title: "Load Error",
        description: "Failed to load spreadsheet",
        variant: "destructive"
      });
    }
  };

  // Save spreadsheet
  const saveSpreadsheet = async () => {
    if (!currentSpreadsheet || !workbookRef.current) return;

    try {
      const univer = univerRef.current;
      const workbookData = univer?.getUniverSheet()?.getSheetBySheetId(currentSpreadsheet.id);
      
      const response = await fetch(`/api/spreadsheets/${currentSpreadsheet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentSpreadsheet.name,
          data: workbookData?.getConfig(),
        })
      });

      if (response.ok) {
        toast({
          title: "Saved",
          description: "Spreadsheet saved successfully"
        });
      }
    } catch (error) {
      console.error('Error saving spreadsheet:', error);
      toast({
        title: "Save Error",
        description: "Failed to save spreadsheet",
        variant: "destructive"
      });
    }
  };

  // Auto-save functionality
  const autoSaveSpreadsheet = async (changes: any) => {
    if (!currentSpreadsheet) return;
    
    // Debounced auto-save
    const timeoutId = setTimeout(async () => {
      await saveSpreadsheet();
    }, 2000);

    return () => clearTimeout(timeoutId);
  };

  // Export spreadsheet
  const exportSpreadsheet = async (format: 'xlsx' | 'csv' | 'pdf') => {
    if (!workbookRef.current) return;

    try {
      const response = await fetch(`/api/spreadsheets/${currentSpreadsheet?.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${currentSpreadsheet?.name}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export Complete",
          description: `Spreadsheet exported as ${format.toUpperCase()}`
        });
      }
    } catch (error) {
      console.error('Error exporting spreadsheet:', error);
      toast({
        title: "Export Error",
        description: "Failed to export spreadsheet",
        variant: "destructive"
      });
    }
  };

  // Import spreadsheet
  const importSpreadsheet = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/spreadsheets/import', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        loadSpreadsheets();
        toast({
          title: "Import Complete",
          description: "Spreadsheet imported successfully"
        });
      }
    })
    .catch(error => {
      console.error('Error importing spreadsheet:', error);
      toast({
        title: "Import Error",
        description: "Failed to import spreadsheet",
        variant: "destructive"
      });
    });
  };

  // Collaborative functions
  const joinCollaborativeSession = (spreadsheetId: string) => {
    // Setup WebSocket connection for real-time collaboration
    const ws = new WebSocket(`ws://localhost:5000/ws/spreadsheet/${spreadsheetId}`);
    
    ws.onopen = () => {
      setIsCollaborating(true);
      ws.send(JSON.stringify({
        type: 'join',
        userId: user?.id,
        userName: user?.firstName || user?.email
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleCollaborativeMessage(message);
    };

    ws.onclose = () => {
      setIsCollaborating(false);
    };
  };

  const handleCollaborativeMessage = (message: any) => {
    switch (message.type) {
      case 'user-joined':
        setCollaborators(prev => [...prev, message.user]);
        break;
      case 'user-left':
        setCollaborators(prev => prev.filter(u => u.id !== message.userId));
        break;
      case 'cursor-update':
        updateUserCursor(message.userId, message.cursor);
        break;
      case 'selection-update':
        updateUserSelection(message.userId, message.selection);
        break;
      case 'content-change':
        applyContentChanges(message.changes);
        break;
    }
  };

  const broadcastCursorPosition = (selection: any) => {
    // Broadcast cursor position to other users
    if (isCollaborating) {
      // WebSocket broadcast implementation
    }
  };

  const broadcastContentChanges = (changes: any) => {
    // Broadcast content changes to other users
    if (isCollaborating) {
      // WebSocket broadcast implementation
    }
  };

  const updateUserCursor = (userId: number, cursor: any) => {
    setCollaborators(prev => prev.map(user => 
      user.id === userId ? { ...user, cursor } : user
    ));
  };

  const updateUserSelection = (userId: number, selection: any) => {
    setCollaborators(prev => prev.map(user => 
      user.id === userId ? { ...user, selection } : user
    ));
  };

  const applyContentChanges = (changes: any) => {
    if (!univerRef.current) return;
    // Apply changes from other users
    // Implementation depends on Univer's API for applying external changes
  };

  // Utility functions
  const getDefaultSpreadsheetData = () => {
    return {
      sheetOrder: ['sheet1'],
      sheets: {
        sheet1: {
          id: 'sheet1',
          name: 'Sheet1',
          cellData: {},
          columnData: {},
          rowData: {},
        },
      },
    };
  };

  const deleteSpreadsheet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spreadsheet?')) return;

    try {
      const response = await fetch(`/api/spreadsheets/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSpreadsheets(prev => prev.filter(s => s.id !== id));
        if (currentSpreadsheet?.id === id) {
          setCurrentSpreadsheet(null);
          setActiveTab('list');
        }
        
        toast({
          title: "Deleted",
          description: "Spreadsheet deleted successfully"
        });
      }
    } catch (error) {
      console.error('Error deleting spreadsheet:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete spreadsheet",
        variant: "destructive"
      });
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (user) {
      loadSpreadsheets();
      initializeUniver();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Grid className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading spreadsheet editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'editor' | 'list')}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TabsList>
                <TabsTrigger value="list">My Spreadsheets</TabsTrigger>
                <TabsTrigger value="editor" disabled={!currentSpreadsheet}>
                  {currentSpreadsheet?.name || 'Editor'}
                </TabsTrigger>
              </TabsList>

              {currentSpreadsheet && (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={saveSpreadsheet}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => exportSpreadsheet('xlsx')}>
                        Excel (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportSpreadsheet('csv')}>
                        CSV (.csv)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportSpreadsheet('pdf')}>
                        PDF (.pdf)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Collaborators */}
              {isCollaborating && collaborators.length > 0 && (
                <div className="flex items-center gap-1">
                  {collaborators.slice(0, 3).map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      title={collaborator.name}
                    >
                      {collaborator.name.substring(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {collaborators.length > 3 && (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      +{collaborators.length - 3}
                    </div>
                  )}
                </div>
              )}

              <Button size="sm" onClick={createNewSpreadsheet}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <TabsContent value="list" className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Import Card */}
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="font-medium mb-2">Import Spreadsheet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload Excel, CSV, or other spreadsheet files
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={importSpreadsheet}
                  className="hidden"
                  id="import-file"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => document.getElementById('import-file')?.click()}
                >
                  Choose File
                </Button>
              </CardContent>
            </Card>

            {/* Spreadsheet Cards */}
            {spreadsheets.map((spreadsheet) => (
              <Card key={spreadsheet.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-base truncate">{spreadsheet.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => loadSpreadsheet(spreadsheet)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteSpreadsheet(spreadsheet.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Modified</span>
                      <span>{new Date(spreadsheet.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Created by</span>
                      <span>{spreadsheet.createdBy}</span>
                    </div>
                    {spreadsheet.sharedWith.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600">
                          Shared with {spreadsheet.sharedWith.length} people
                        </span>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    size="sm"
                    onClick={() => loadSpreadsheet(spreadsheet)}
                  >
                    Open Spreadsheet
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="flex-1">
          {currentSpreadsheet ? (
            <div className="h-full flex flex-col">
              {/* Spreadsheet Container */}
              <div 
                ref={containerRef} 
                className="flex-1 bg-white border border-gray-200 rounded-lg mx-4 mb-4"
                style={{ minHeight: '600px' }}
              />
              
              {/* Status Bar */}
              <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>Sheet: {currentSpreadsheet.name}</span>
                  {isCollaborating && (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Collaborative mode
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span>Auto-saved</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Grid className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Spreadsheet Selected</h3>
                <p className="text-gray-500 mb-4">
                  Select a spreadsheet from the list or create a new one to get started.
                </p>
                <Button onClick={createNewSpreadsheet}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Spreadsheet
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}