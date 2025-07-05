import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Save, 
  FileSpreadsheet, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Settings,
  AlertCircle,
  RotateCcw,
  Grid
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';

// Dynamic import for Handsontable to handle loading issues
let HotTable: any = null;
let Handsontable: any = null;

// Attempt to load Handsontable
try {
  const handsontableModule = require('@handsontable/react');
  const handsontableCore = require('handsontable');
  HotTable = handsontableModule.HotTable;
  Handsontable = handsontableCore.default || handsontableCore;
  
  // Import CSS
  require('handsontable/dist/handsontable.full.min.css');
  
  console.log('✅ Handsontable loaded successfully');
} catch (error) {
  console.warn('⚠️ Handsontable not available:', error);
}

interface Spreadsheet {
  id: number;
  name: string;
  projectId: number;
  data: any[][];
  columns: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

interface Project {
  id: number;
  name: string;
}

interface SpreadsheetFixedProps {
  projectId?: number;
}

export function SpreadsheetFixed({ projectId }: SpreadsheetFixedProps) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hotTableRef = useRef<any>(null);

  // State management
  const [selectedProject, setSelectedProject] = useState<number | null>(projectId || null);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<Spreadsheet | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('');
  const [editSpreadsheetName, setEditSpreadsheetName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [handsontableAvailable, setHandsontableAvailable] = useState(false);

  // Sample data for demo/fallback
  const [spreadsheetData, setSpreadsheetData] = useState([
    ['Name', 'Age', 'Department', 'Salary', 'Status'],
    ['John Doe', 30, 'Engineering', 75000, 'Active'],
    ['Jane Smith', 28, 'Marketing', 65000, 'Active'],
    ['Bob Johnson', 35, 'Sales', 70000, 'Active'],
    ['Alice Brown', 32, 'HR', 68000, 'Active'],
    ['Charlie Wilson', 29, 'Engineering', 72000, 'Active']
  ]);

  // Check Handsontable availability
  useEffect(() => {
    const checkHandsontable = () => {
      if (HotTable && Handsontable) {
        setHandsontableAvailable(true);
        console.log('✅ Handsontable components ready');
      } else {
        setHandsontableAvailable(false);
        console.warn('⚠️ Handsontable not available, using fallback table');
      }
      setIsLoaded(true);
    };

    checkHandsontable();
  }, []);

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user && isAuthenticated
  });

  // Fetch spreadsheets for selected project
  const { data: spreadsheets = [], isLoading: spreadsheetsLoading } = useQuery<Spreadsheet[]>({
    queryKey: ['/api/spreadsheets', selectedProject],
    enabled: !!selectedProject && !!user && isAuthenticated
  });

  // Create spreadsheet mutation
  const createSpreadsheetMutation = useMutation({
    mutationFn: async (data: { name: string; projectId: number }) => {
      const response = await apiRequest('POST', '/api/spreadsheets', {
        ...data,
        data: [['Column A', 'Column B', 'Column C'], ['', '', ''], ['', '', '']],
        columns: ['Column A', 'Column B', 'Column C']
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spreadsheets'] });
      setIsCreateDialogOpen(false);
      setNewSpreadsheetName('');
      toast({
        title: "Success",
        description: "Spreadsheet created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create spreadsheet",
        variant: "destructive"
      });
    }
  });

  // Update spreadsheet mutation
  const updateSpreadsheetMutation = useMutation({
    mutationFn: async (data: { id: number; name?: string; data?: any[][] }) => {
      const response = await apiRequest('PATCH', `/api/spreadsheets/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spreadsheets'] });
      toast({
        title: "Success",
        description: "Spreadsheet saved successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save spreadsheet",
        variant: "destructive"
      });
    }
  });

  // Delete spreadsheet mutation
  const deleteSpreadsheetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/spreadsheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spreadsheets'] });
      setSelectedSpreadsheet(null);
      toast({
        title: "Success",
        description: "Spreadsheet deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete spreadsheet",
        variant: "destructive"
      });
    }
  });

  const handleCreateSpreadsheet = () => {
    if (!newSpreadsheetName.trim() || !selectedProject) {
      toast({
        title: "Error",
        description: "Please enter a name and select a project",
        variant: "destructive"
      });
      return;
    }

    createSpreadsheetMutation.mutate({
      name: newSpreadsheetName.trim(),
      projectId: selectedProject
    });
  };

  const handleSaveSpreadsheet = () => {
    if (!selectedSpreadsheet) return;

    const currentData = handsontableAvailable && hotTableRef.current?.hotInstance 
      ? hotTableRef.current.hotInstance.getData()
      : spreadsheetData;

    updateSpreadsheetMutation.mutate({
      id: selectedSpreadsheet.id,
      data: currentData
    });
  };

  const handleDataChange = (changes: any, source: any) => {
    if (source === 'loadData') return;
    
    // Auto-save after changes
    if (selectedSpreadsheet && changes) {
      const timer = setTimeout(() => {
        handleSaveSpreadsheet();
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  };

  // Loading state
  if (authLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to access spreadsheets</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Spreadsheet</h3>
          <p className="text-gray-500 mb-4">{loadError}</p>
          <Button onClick={() => setLoadError(null)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spreadsheets</h1>
          <p className="text-gray-600">Create and manage spreadsheets for your projects</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {!handsontableAvailable && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Basic Table Mode
            </Badge>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Spreadsheet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Spreadsheet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project</label>
                  <Select 
                    value={selectedProject?.toString()} 
                    onValueChange={(value) => setSelectedProject(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project: Project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Spreadsheet Name</label>
                  <Input
                    placeholder="Enter spreadsheet name"
                    value={newSpreadsheetName}
                    onChange={(e) => setNewSpreadsheetName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleCreateSpreadsheet} 
                  className="w-full"
                  disabled={createSpreadsheetMutation.isPending}
                >
                  {createSpreadsheetMutation.isPending ? 'Creating...' : 'Create Spreadsheet'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Project Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select 
                value={selectedProject?.toString()} 
                onValueChange={(value) => setSelectedProject(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project to view spreadsheets" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: Project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProject && (
              <Badge variant="outline">
                {spreadsheets.length} spreadsheet{spreadsheets.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spreadsheets List */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Spreadsheets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {spreadsheetsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading spreadsheets...</p>
              </div>
            ) : spreadsheets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {spreadsheets.map((spreadsheet: Spreadsheet) => (
                  <Card 
                    key={spreadsheet.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedSpreadsheet?.id === spreadsheet.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSpreadsheet(spreadsheet)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{spreadsheet.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Created {new Date(spreadsheet.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {spreadsheet.data?.length || 0} rows × {spreadsheet.columns?.length || 0} columns
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this spreadsheet?')) {
                              deleteSpreadsheetMutation.mutate(spreadsheet.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Spreadsheets</h3>
                <p className="text-gray-500">Create your first spreadsheet to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spreadsheet Editor */}
      {selectedSpreadsheet && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Grid className="h-5 w-5 mr-2" />
                {selectedSpreadsheet.name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button onClick={handleSaveSpreadsheet} disabled={updateSpreadsheetMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateSpreadsheetMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!handsontableAvailable && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Handsontable is not available. Using basic table view. For full spreadsheet functionality, 
                  please ensure Handsontable is properly installed.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="border rounded-lg overflow-hidden">
              {handsontableAvailable && HotTable ? (
                <HotTable
                  ref={hotTableRef}
                  data={selectedSpreadsheet.data || spreadsheetData}
                  colHeaders={true}
                  rowHeaders={true}
                  contextMenu={true}
                  manualColumnResize={true}
                  manualRowResize={true}
                  filters={true}
                  dropdownMenu={true}
                  height={400}
                  width="100%"
                  afterChange={handleDataChange}
                  licenseKey="non-commercial-and-evaluation"
                  settings={{
                    columnSorting: true,
                    sortIndicator: true,
                    autoWrapRow: true,
                    autoWrapCol: true
                  }}
                />
              ) : (
                <div className="p-6">
                  <div className="mb-4 text-center">
                    <p className="text-gray-600 mb-4">
                      Basic table view (Handsontable not available)
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr>
                          {(selectedSpreadsheet.data?.[0] || spreadsheetData[0])?.map((header: string, index: number) => (
                            <th key={index} className="border border-gray-300 p-2 bg-gray-100 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedSpreadsheet.data || spreadsheetData)?.slice(1).map((row: any[], rowIndex: number) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {row.map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className="border border-gray-300 p-2">
                                <input
                                  type="text"
                                  value={cell || ''}
                                  onChange={(e) => {
                                    const newData = [...(selectedSpreadsheet.data || spreadsheetData)];
                                    newData[rowIndex + 1][cellIndex] = e.target.value;
                                    setSpreadsheetData(newData);
                                  }}
                                  className="w-full border-none outline-none bg-transparent"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Section when no project selected */}
      {!selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Grid className="h-5 w-5 mr-2" />
              Demo Spreadsheet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select a project above to create and manage spreadsheets. This is a demo view.
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-lg overflow-hidden">
              {handsontableAvailable && HotTable ? (
                <HotTable
                  data={spreadsheetData}
                  colHeaders={true}
                  rowHeaders={true}
                  contextMenu={true}
                  manualColumnResize={true}
                  manualRowResize={true}
                  height={300}
                  width="100%"
                  readOnly={true}
                  licenseKey="non-commercial-and-evaluation"
                />
              ) : (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr>
                          {spreadsheetData[0]?.map((header: any, index: number) => (
                            <th key={index} className="border border-gray-300 p-2 bg-gray-100 font-medium">
                              {String(header)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {spreadsheetData.slice(1).map((row: any[], rowIndex: number) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {row.map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className="border border-gray-300 p-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}