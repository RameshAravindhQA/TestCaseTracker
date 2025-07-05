import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, FileSpreadsheet, Save, Download, Upload, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Handsontable integration
let HotTable: any = null;
let Handsontable: any = null;

try {
  const HandsontableModule = require('handsontable/dist/handsontable.full.min.js');
  const HandsontableReact = require('@handsontable/react');
  
  Handsontable = HandsontableModule.default || HandsontableModule;
  HotTable = HandsontableReact.HotTable;
  
  // Register plugins
  Handsontable.plugins.registerPlugin('autoColumnSize', require('handsontable/plugins/autoColumnSize'));
  Handsontable.plugins.registerPlugin('contextMenu', require('handsontable/plugins/contextMenu'));
  Handsontable.plugins.registerPlugin('copyPaste', require('handsontable/plugins/copyPaste'));
  Handsontable.plugins.registerPlugin('undoRedo', require('handsontable/plugins/undoRedo'));
} catch (error) {
  console.log('Handsontable not available, using fallback table');
}

interface Project {
  id: number;
  name: string;
  description: string;
}

interface Spreadsheet {
  id: number;
  name: string;
  projectId: number;
  createdById: number;
  data: any[][];
  columns: string[];
  createdAt: string;
  updatedAt: string;
}

export function HandsontableIntegration() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<Spreadsheet | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('');
  const [spreadsheetData, setSpreadsheetData] = useState<any[][]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Refs
  const hotTableRef = useRef<any>(null);
  
  // Queries
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user
  });

  const { data: spreadsheets = [], isLoading: spreadsheetsLoading, refetch: refetchSpreadsheets } = useQuery<Spreadsheet[]>({
    queryKey: ['/api/spreadsheets', selectedProject?.id],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/spreadsheets?projectId=${selectedProject.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch spreadsheets');
      return response.json();
    },
    enabled: !!selectedProject && !!user
  });

  // Mutations
  const createSpreadsheetMutation = useMutation({
    mutationFn: async (data: { name: string; projectId: number }) => {
      const response = await apiRequest('POST', '/api/spreadsheets', {
        name: data.name,
        projectId: data.projectId,
        data: [
          ['A', 'B', 'C', 'D', 'E'],
          ['', '', '', '', ''],
          ['', '', '', '', ''],
          ['', '', '', '', ''],
          ['', '', '', '', '']
        ],
        columns: ['Column A', 'Column B', 'Column C', 'Column D', 'Column E']
      });
      return response.json();
    },
    onSuccess: () => {
      refetchSpreadsheets();
      setShowCreateDialog(false);
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

  const saveSpreadsheetMutation = useMutation({
    mutationFn: async (data: { id: number; data: any[][] }) => {
      const response = await apiRequest('PATCH', `/api/spreadsheets/${data.id}`, {
        data: data.data
      });
      return response.json();
    },
    onSuccess: () => {
      setHasChanges(false);
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

  const deleteSpreadsheetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/spreadsheets/${id}`);
    },
    onSuccess: () => {
      refetchSpreadsheets();
      setSelectedSpreadsheet(null);
      setSpreadsheetData([]);
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

  // Handlers
  const handleSpreadsheetSelect = (spreadsheet: Spreadsheet) => {
    setSelectedSpreadsheet(spreadsheet);
    setSpreadsheetData(spreadsheet.data || []);
    setColumns(spreadsheet.columns || []);
    setHasChanges(false);
  };

  const handleDataChange = (changes: any) => {
    if (changes && hotTableRef.current) {
      const newData = hotTableRef.current.hotInstance.getData();
      setSpreadsheetData(newData);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    if (selectedSpreadsheet && spreadsheetData.length > 0) {
      saveSpreadsheetMutation.mutate({
        id: selectedSpreadsheet.id,
        data: spreadsheetData
      });
    }
  };

  const handleDelete = () => {
    if (selectedSpreadsheet && confirm('Are you sure you want to delete this spreadsheet?')) {
      deleteSpreadsheetMutation.mutate(selectedSpreadsheet.id);
    }
  };

  const handleExport = () => {
    if (selectedSpreadsheet && spreadsheetData.length > 0) {
      const csvContent = spreadsheetData.map(row => 
        row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedSpreadsheet.name}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Login Required</h3>
            <p className="text-gray-500">Please log in to access spreadsheets</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Spreadsheets</h1>
            {selectedProject && (
              <Badge variant="outline">
                Project: {selectedProject.name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedSpreadsheet && hasChanges && (
              <Button 
                onClick={handleSave} 
                disabled={saveSpreadsheetMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
            
            {selectedSpreadsheet && (
              <>
                <Button 
                  onClick={handleExport} 
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                
                <Button 
                  onClick={handleDelete} 
                  variant="outline"
                  disabled={deleteSpreadsheetMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-4">
          {/* Project Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project
            </label>
            <Select 
              value={selectedProject?.id.toString() || ''} 
              onValueChange={(value) => {
                const project = projects.find(p => p.id === parseInt(value));
                setSelectedProject(project || null);
                setSelectedSpreadsheet(null);
                setSpreadsheetData([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
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

          {/* Spreadsheets List */}
          {selectedProject && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Spreadsheets</h3>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Spreadsheet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Spreadsheet Name
                        </label>
                        <Input
                          value={newSpreadsheetName}
                          onChange={(e) => setNewSpreadsheetName(e.target.value)}
                          placeholder="Enter spreadsheet name"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => createSpreadsheetMutation.mutate({
                            name: newSpreadsheetName,
                            projectId: selectedProject.id
                          })}
                          disabled={!newSpreadsheetName.trim() || createSpreadsheetMutation.isPending}
                        >
                          Create
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {spreadsheetsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading spreadsheets...</p>
                </div>
              ) : spreadsheets.length > 0 ? (
                <div className="space-y-2">
                  {spreadsheets.map((spreadsheet) => (
                    <Card 
                      key={spreadsheet.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedSpreadsheet?.id === spreadsheet.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSpreadsheetSelect(spreadsheet)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {spreadsheet.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(spreadsheet.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileSpreadsheet className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No spreadsheets found</p>
                  <p className="text-xs text-gray-400">Create your first spreadsheet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Area */}
        <div className="flex-1 p-4">
          {selectedSpreadsheet ? (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>{selectedSpreadsheet.name}</span>
                  {hasChanges && (
                    <Badge variant="outline" className="text-orange-600">
                      Unsaved changes
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                {HotTable && Handsontable ? (
                  <div className="h-full" style={{ height: 'calc(100vh - 300px)' }}>
                    <HotTable
                      ref={hotTableRef}
                      data={spreadsheetData}
                      colHeaders={columns}
                      rowHeaders={true}
                      width="100%"
                      height="100%"
                      stretchH="all"
                      contextMenu={true}
                      manualColumnResize={true}
                      manualRowResize={true}
                      copyPaste={true}
                      undoRedo={true}
                      autoColumnSize={true}
                      minRows={20}
                      minCols={10}
                      afterChange={handleDataChange}
                      licenseKey="non-commercial-and-evaluation"
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 border-r text-left text-xs font-medium text-gray-500">Row</th>
                            {columns.map((col, index) => (
                              <th key={index} className="px-4 py-2 border-r text-left text-xs font-medium text-gray-500">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {spreadsheetData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t">
                              <td className="px-4 py-2 border-r bg-gray-50 text-xs text-gray-500">
                                {rowIndex + 1}
                              </td>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 border-r">
                                  <Input
                                    value={cell || ''}
                                    onChange={(e) => {
                                      const newData = [...spreadsheetData];
                                      newData[rowIndex][cellIndex] = e.target.value;
                                      setSpreadsheetData(newData);
                                      setHasChanges(true);
                                    }}
                                    className="border-0 p-0 text-sm h-auto"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Basic Mode:</strong> Handsontable is not available. Using simplified table editor.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : selectedProject ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Spreadsheet</h3>
                <p className="text-gray-500">Choose a spreadsheet from the sidebar or create a new one</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Project</h3>
                <p className="text-gray-500">Choose a project to view its spreadsheets</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}