import React, { useState, useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

// Register all Handsontable modules
Handsontable.plugins.registerPlugin(require('handsontable/plugins').registerAllPlugins);
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
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Register Handsontable's modules
const registerAllModules = Handsontable.plugins.registerAllPlugins;

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

interface HandsOnTableSpreadsheetProps {
  projectId?: number;
}

export function HandsOnTableSpreadsheet({ projectId }: HandsOnTableSpreadsheetProps) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Enhanced debugging state
  const [debugInfo, setDebugInfo] = useState({
    componentMounted: false,
    authChecked: false,
    userLoaded: false,
    spreadsheetInitialized: false,
    projectSelected: false,
    dataLoaded: false,
    handsontableReady: false
  });
  
  console.log('🔄 SPREADSHEET RENDER:', {
    timestamp: new Date().toISOString(),
    user: user ? { id: user.id, email: user.email } : null,
    authLoading,
    isAuthenticated,
    projectId,
    debugInfo
  });

  const queryClient = useQueryClient();
  const hotTableRef = useRef<any>(null);

  const [selectedProject, setSelectedProject] = useState<number | null>(projectId || null);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<Spreadsheet | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('');
  const [editSpreadsheetName, setEditSpreadsheetName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Default data for new spreadsheets
  const defaultData = [
    ['Feature', 'Test Case ID', 'Priority', 'Status', 'Assigned To', 'Comments'],
    ['Login', 'TC-001', 'High', 'Not Executed', 'Ramesh', ''],
    ['Registration', 'TC-002', 'Medium', 'Not Executed', 'Amog', ''],
    ['Dashboard', 'TC-003', 'Low', 'Not Executed', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', '']
  ];

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !selectedProject
  });

  // Fetch spreadsheets for selected project
  const { data: spreadsheets = [], refetch: refetchSpreadsheets, isLoading } = useQuery<Spreadsheet[]>({
    queryKey: ['/api/projects', selectedProject, 'spreadsheets'],
    enabled: !!selectedProject,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/projects/${selectedProject}/spreadsheets`);
      return response.json();
    }
  });

  // Create spreadsheet mutation
  const createSpreadsheetMutation = useMutation({
    mutationFn: async (data: { name: string; projectId: number; data: any[][]; columns: string[] }) => {
      const response = await apiRequest('POST', `/api/projects/${data.projectId}/spreadsheets`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Spreadsheet created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewSpreadsheetName('');
      refetchSpreadsheets();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create spreadsheet",
        variant: "destructive",
      });
    }
  });

  // Update spreadsheet mutation
  const updateSpreadsheetMutation = useMutation({
    mutationFn: async (data: { id: number; name?: string; data?: any[][]; columns?: string[] }) => {
      const response = await apiRequest('PUT', `/api/spreadsheets/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Spreadsheet updated successfully",
      });
      refetchSpreadsheets();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update spreadsheet",
        variant: "destructive",
      });
    }
  });

  // Delete spreadsheet mutation
  const deleteSpreadsheetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/spreadsheets/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Spreadsheet deleted successfully",
      });
      setSelectedSpreadsheet(null);
      refetchSpreadsheets();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete spreadsheet",
        variant: "destructive",
      });
    }
  });

  const handleCreateSpreadsheet = () => {
    if (!newSpreadsheetName.trim() || !selectedProject) {
      toast({
        title: "Error",
        description: "Please provide a spreadsheet name and select a project",
        variant: "destructive",
      });
      return;
    }

    createSpreadsheetMutation.mutate({
      name: newSpreadsheetName,
      projectId: selectedProject,
      data: defaultData,
      columns: defaultData[0] as string[]
    });
  };

  const handleSaveSpreadsheet = () => {
    if (!selectedSpreadsheet || !hotTableRef.current) return;

    const hotInstance = hotTableRef.current.hotInstance;
    const data = hotInstance.getData();
    const columns = data[0] || [];

    updateSpreadsheetMutation.mutate({
      id: selectedSpreadsheet.id,
      data: data,
      columns: columns
    });
  };

  const handleRenameSpreadsheet = () => {
    if (!selectedSpreadsheet || !editSpreadsheetName.trim()) return;

    updateSpreadsheetMutation.mutate({
      id: selectedSpreadsheet.id,
      name: editSpreadsheetName
    });
    setIsEditDialogOpen(false);
    setEditSpreadsheetName('');
  };

  const handleDeleteSpreadsheet = (spreadsheet: Spreadsheet) => {
    if (confirm(`Are you sure you want to delete "${spreadsheet.name}"?`)) {
      deleteSpreadsheetMutation.mutate(spreadsheet.id);
    }
  };

  const handleOpenEditDialog = (spreadsheet: Spreadsheet) => {
    setEditSpreadsheetName(spreadsheet.name);
    setIsEditDialogOpen(true);
  };

  const exportToCSV = () => {
    if (!hotTableRef.current) return;

    const hotInstance = hotTableRef.current.hotInstance;
    const csvData = hotInstance.getData();

    const csvContent = csvData.map((row: any[]) => 
      row.map((cell: any) => `"${cell || ''}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedSpreadsheet?.name || 'spreadsheet'}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Enhanced debug logging function
  const logDebugInfo = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      component: 'HandsOnTableSpreadsheet',
      auth: {
        user: user ? { id: user.id, email: user.email, firstName: user.firstName } : null,
        authLoading,
        isAuthenticated
      },
      data: {
        projectId,
        selectedProject,
        spreadsheetsCount: spreadsheets.length,
        selectedSpreadsheet: selectedSpreadsheet?.id,
        projectsCount: projects.length,
        isLoading,
        loadError
      },
      state: {
        isLoaded,
        debugInfo
      },
      localStorage: {
        auth: localStorage.getItem('isAuthenticated'),
        user: localStorage.getItem('user') ? 'present' : 'none',
        spreadsheets: localStorage.getItem('spreadsheets') ? 'present' : 'none'
      },
      route: window.location.pathname
    };
    
    console.log('🐛 SPREADSHEET DEBUG STATE:', debugData);
    
    // Also log to a global debug object for easier inspection
    if (typeof window !== 'undefined') {
      (window as any).spreadsheetDebug = debugData;
      console.log('💾 Debug data saved to window.spreadsheetDebug');
    }
    
    return debugData;
  };

  // Enhanced initialization with better auth and state handling
  useEffect(() => {
    console.log('🔄 SPREADSHEET INIT: Starting initialization');
    console.log('🔄 SPREADSHEET AUTH STATE:', {
      user: user ? { id: user.id, email: user.email } : null,
      authLoading,
      isAuthenticated,
      projectId,
      localStorage: {
        auth: localStorage.getItem('isAuthenticated'),
        user: localStorage.getItem('user') ? 'present' : 'none',
        spreadsheets: localStorage.getItem('spreadsheets') ? 'present' : 'none'
      }
    });

    setDebugInfo(prev => ({ 
      ...prev, 
      componentMounted: true, 
      authChecked: true,
      userLoaded: !!user,
      projectSelected: !!projectId || !!selectedProject
    }));

    // Don't wait for authLoading if we have stored auth data
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    const hasStoredAuth = storedAuth === 'true' && storedUser;

    if (authLoading && !hasStoredAuth) {
      console.log('🔄 SPREADSHEET AUTH: Still loading and no stored auth, waiting...');
      return;
    }

    // If we have stored auth but no user yet, proceed with initialization
    if (!user && hasStoredAuth) {
      console.log('🔄 SPREADSHEET AUTH: No API user yet but have stored auth, proceeding with stored data');
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('📦 SPREADSHEET: Using stored user data temporarily:', parsedUser.firstName);
      } catch (error) {
        console.warn('⚠️ SPREADSHEET: Failed to parse stored user, waiting for API');
        return;
      }
    }

    if (!user && !hasStoredAuth) {
      console.log('❌ SPREADSHEET AUTH: No user and no stored auth');
      return;
    }

    const loadSpreadsheets = async () => {
      if (!selectedProject) {
        console.warn('No project selected, cannot load spreadsheets');
        return;
      }

      try {
        console.log('Fetching spreadsheets for project:', selectedProject);
        await refetchSpreadsheets();
      } catch (error) {
        console.error('Failed to fetch spreadsheets:', error);
        toast({
          title: "Error",
          description: "Failed to load spreadsheets",
          variant: "destructive"
        });
      }
    };

    console.log('✅ SPREADSHEET: User authenticated, loading spreadsheets');
    loadSpreadsheets();
    setDebugInfo(prev => ({ ...prev, spreadsheetInitialized: true }));
  }, [user, authLoading]);

    // Create a 20x10 grid with empty cells
    const initialData = Array(20).fill(null).map(() => Array(10).fill(''));

  const hotSettings = {
        data: selectedSpreadsheet?.data || initialData,
        colHeaders: true,
        rowHeaders: true,
        stretchH: 'all',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: "non-commercial-and-evaluation",
        contextMenu: true,
        manualColumnResize: true,
        manualRowResize: true,
        filters: true,
        dropdownMenu: true,
        height: 500,
        width: "100%",
        columns: selectedSpreadsheet?.columns?.map(col => ({ data: col })) || undefined,
        columnSorting: true,
        sortIndicator: true,
    };
  // Enhanced authentication guard with better recovery options
  if (!user && !authLoading && !isAuthenticated) {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    
    // If we have stored auth but no user context, show a different message
    if (storedAuth === 'true' && storedUser) {
      console.log('⚠️ SPREADSHEET: Auth state mismatch detected, showing recovery options');
      
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="text-yellow-600 text-lg">🔄 Restoring Session</div>
            <p className="text-gray-600">Reconnecting your authentication...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <div className="space-y-2">
              <Button 
                onClick={logDebugInfo}
                variant="outline"
                size="sm"
              >
                🐛 Debug Info
              </Button>
              <Button 
                onClick={() => {
                  console.log('🔄 SPREADSHEET: Force reload attempt');
                  window.location.reload();
                }}
                size="sm"
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg">⚠️ Authentication Required</div>
          <p className="text-gray-600">Please log in to access spreadsheets</p>
          <div className="space-y-2">
            <Button 
              onClick={logDebugInfo}
              variant="outline"
              size="sm"
            >
              🐛 Debug Info
            </Button>
            <Button 
              onClick={() => {
                console.log('🔄 SPREADSHEET: Manual auth refresh attempt');
                window.location.reload();
              }}
              size="sm"
              variant="outline"
            >
              Refresh Page
            </Button>
            <Button 
              onClick={() => {
                console.log('🔄 SPREADSHEET: Clearing auth and redirecting to login');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                localStorage.removeItem('isAuthenticated');
                window.location.href = '/login';
              }}
              size="sm"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading spreadsheets...</p>
          <Button 
            onClick={logDebugInfo}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            🐛 Debug Info
          </Button>
        </div>
      </div>
    );
  }

  // If no project is selected, show project selector
  if (!selectedProject) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Spreadsheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Project</label>
            <Select onValueChange={(value) => setSelectedProject(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project to manage spreadsheets" />
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
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Spreadsheet Loading Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Failed to load the spreadsheet component. This might be due to missing dependencies or network issues.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Alternative Options:</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                <li>Use the simple spreadsheet editor instead</li>
                <li>Try the basic table view for your data</li>
                <li>Import/export CSV files directly</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  // Force load anyway for basic functionality
                  setLoadError(false);
                  setIsLoaded(true);
                }} 
                variant="default"
              >
                Use Basic Mode
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading Spreadsheet Component...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing spreadsheet...</p>

          {/* Auto-continue after 2 seconds */}
          <div className="mt-4">
            <Button 
              onClick={() => setIsLoaded(true)}
              variant="outline"
              size="sm"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with spreadsheet list and controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Spreadsheets
              <Badge variant="outline">
                {projects.find(p => p.id === selectedProject)?.name}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProject(null)}
              >
                Change Project
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
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
                      <label className="text-sm font-medium mb-2 block">Spreadsheet Name</label>
                      <Input
                        value={newSpreadsheetName}
                        onChange={(e) => setNewSpreadsheetName(e.target.value)}
                        placeholder="Enter spreadsheet name"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateSpreadsheet}
                        disabled={createSpreadsheetMutation.isPending}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={() => setShowNewSpreadsheetDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Spreadsheet
            </Button>
            <Button 
              onClick={logDebugInfo}
              variant="outline"
              size="sm"
              title="Debug Info"
            >
              🐛
            </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Spreadsheet List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {spreadsheets.map((spreadsheet) => (
              <Card 
                key={spreadsheet.id} 
                className={`cursor-pointer transition-colors ${
                  selectedSpreadsheet?.id === spreadsheet.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSpreadsheet(spreadsheet)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{spreadsheet.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Updated {new Date(spreadsheet.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditDialog(spreadsheet);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSpreadsheet(spreadsheet);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No spreadsheets message */}
          {spreadsheets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No spreadsheets found for this project.</p>
              <p className="text-sm">Create your first spreadsheet to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spreadsheet Editor */}
      {selectedSpreadsheet && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>{selectedSpreadsheet.name}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveSpreadsheet}
                  disabled={updateSpreadsheetMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
            {typeof HotTable !== 'undefined' ? (
              <HotTable
                ref={hotTableRef}
                data={selectedSpreadsheet.data}
                colHeaders={true}
                rowHeaders={true}
                stretchH="all"
                autoWrapRow={true}
                autoWrapCol={true}
                licenseKey="non-commercial-and-evaluation"
                contextMenu={true}
                manualColumnResize={true}
                manualRowResize={true}
                filters={true}
                dropdownMenu={true}
                height={500}
                width="100%"
                settings={{
                  columns: selectedSpreadsheet.columns?.map(col => ({ data: col })) || undefined,
                  columnSorting: true,
                  sortIndicator: true,
                  beforeChange: function(changes: any, source: any) {
                    // Optional: Add validation logic here
                  }
                }}
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-4">
                  Handsontable component is not available. Using basic table view.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        {selectedSpreadsheet.columns?.map((col, index) => (
                          <th key={index} className="border border-gray-300 p-2 bg-gray-100">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSpreadsheet.data?.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 p-2">
                              <input
                                type="text"
                                value={cell || ''}
                                onChange={(e) => {
                                  // Handle cell value changes
                                  const newData = [...selectedSpreadsheet.data];
                                  newData[rowIndex + 1][cellIndex] = e.target.value;
                                  // Update selectedSpreadsheet data
                                }}
                                className="w-full border-none outline-none"
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Spreadsheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Spreadsheet Name</label>
              <Input
                value={editSpreadsheetName}
                onChange={(e) => setEditSpreadsheetName(e.target.value)}
                placeholder="Enter new name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleRenameSpreadsheet}
                disabled={updateSpreadsheetMutation.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}