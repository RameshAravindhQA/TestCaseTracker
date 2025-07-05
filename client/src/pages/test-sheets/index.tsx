import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectSelect } from "@/components/ui/project-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Project } from "@/types";

interface TestSheet {
  id: number;
  name: string;
  projectId: number;
  data: {
    cells: { [key: string]: any };
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
import { 
  Plus, 
  FileSpreadsheet, 
  Copy, 
  Trash, 
  Download,
  Upload,
  Eye,
  Edit,
  Users,
  Calendar,
  MoreHorizontal
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TestSheetEditor from "@/components/test-sheets/test-sheet-editor";
import { GoogleSheetsEnhanced } from "@/components/test-sheets/google-sheets-enhanced";
import { format } from "date-fns";
import { OnlyOfficeEditor } from "@/components/onlyoffice/onlyoffice-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function TestSheetsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<TestSheet | null>(null);
  const [newSheetName, setNewSheetName] = useState("");
  const [duplicateSheetName, setDuplicateSheetName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects, isLoading: isProjectsLoading, error: projectsError } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/projects');
        const data = await response.json();
        console.log('Projects loaded:', data);
        return data;
      } catch (error) {
        console.error('Error loading projects:', error);
        throw error;
      }
    },
  });

  useEffect(() => {
    console.log('TestSheetsPage - Auth state:', { user, authLoading });
    if (!authLoading && user) {
      loadTestSheets();
    } else if (!authLoading && !user) {
      setIsLoading(false);
      setError('Please log in to view test sheets');
    }
  }, [user, authLoading]);

  const loadTestSheets = async () => {
    try {
      console.log('Loading test sheets...');
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/test-sheets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('Test sheets response:', response.status);

      if (response.ok) {
        const sheets = await response.json();
        console.log('Loaded test sheets:', sheets);
      } else {
        const errorText = await response.text();
        console.error('Failed to load test sheets:', response.status, errorText);
        setError(`Failed to load test sheets: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading test sheets:', error);
      setError('Error loading test sheets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch test sheets for selected project
  const { data: testSheets, isLoading: isTestSheetsLoading } = useQuery<TestSheet[]>({
    queryKey: [`/api/test-sheets`, selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      try {
        const response = await apiRequest('GET', `/api/test-sheets?projectId=${selectedProjectId}`);
        const data = await response.json();
        console.log('Test sheets loaded:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading test sheets:', error);
        return [];
      }
    },
    enabled: !!selectedProjectId,
  });

  // Create test sheet mutation
  const createTestSheetMutation = useMutation({
    mutationFn: async (data: { name: string; projectId: number }) => {
      const sheetData = {
        name: data.name,
        projectId: data.projectId,
        data: {
          cells: {},
          rows: 100,
          cols: 26, // A-Z
        },
        metadata: {
          version: 1,
          lastModifiedBy: 0, // Will be set by server
          collaborators: [],
          chartConfigs: [],
          namedRanges: [],
        },
      };

      return apiRequest('POST', '/api/test-sheets', sheetData);
    },
    onSuccess: () => {
      toast({
        title: "Test sheet created",
        description: "Your new test sheet has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/test-sheets`, selectedProjectId] });
      setCreateDialogOpen(false);
      setNewSheetName("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create test sheet: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Duplicate test sheet mutation
  const duplicateTestSheetMutation = useMutation({
    mutationFn: async (data: { id: number; name: string }) => {
      return apiRequest('POST', `/api/test-sheets/${data.id}/duplicate`, { name: data.name });
    },
    onSuccess: () => {
      toast({
        title: "Test sheet duplicated",
        description: "Test sheet has been duplicated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/test-sheets`, selectedProjectId] });
      setDuplicateDialogOpen(false);
      setDuplicateSheetName("");
      setSelectedSheet(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to duplicate test sheet: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete test sheet mutation
  const deleteTestSheetMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/test-sheets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Test sheet deleted",
        description: "Test sheet has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/test-sheets`, selectedProjectId] });
      setDeleteDialogOpen(false);
      setSelectedSheet(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete test sheet: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateSheet = () => {
    if (!selectedProjectId || !newSheetName.trim()) return;

    createTestSheetMutation.mutate({
      name: newSheetName.trim(),
      projectId: selectedProjectId,
    });
  };

  const handleDuplicateSheet = () => {
    if (!selectedSheet || !duplicateSheetName.trim()) return;

    duplicateTestSheetMutation.mutate({
      id: selectedSheet.id,
      name: duplicateSheetName.trim(),
    });
  };

  const handleDeleteSheet = () => {
    if (!selectedSheet) return;

    deleteTestSheetMutation.mutate(selectedSheet.id);
  };

  const handleViewSheet = (sheet: TestSheet) => {
    setSelectedSheet(sheet);
    setEditorOpen(true);
  };

  const handleEditSheet = (sheet: TestSheet) => {
    setSelectedSheet(sheet);
    setEditorOpen(true);
  };

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <MainLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading test sheets...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadTestSheets} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-500 rounded-xl shadow-lg">
              <FileSpreadsheet className="h-8 w-8 text-white" />
            </div>
            Test Sheets
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage Excel-like test sheets for your projects
          </p>
        </div>

        {/* Project Selection */}
        <div className="mb-6">
          <Label htmlFor="project-select" className="text-sm font-medium text-gray-700">
            Select Project
          </Label>
          <div className="mt-1 max-w-md">
            {isProjectsLoading ? (
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ) : projectsError ? (
              <div className="text-red-600 text-sm">Error loading projects</div>
            ) : (
              <ProjectSelect
                projects={projects}
                isLoading={isProjectsLoading}
                selectedProjectId={selectedProjectId || ""}
                onChange={(value) => setSelectedProjectId(Number(value))}
                placeholder="Choose a project to view test sheets"
              />
            )}
          </div>
        </div>

        {selectedProjectId && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {selectedProject?.name} - Test Sheets
                </h2>
                <p className="text-sm text-gray-600">
                  {testSheets?.length || 0} test sheet(s)
                </p>
              </div>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Test Sheet
              </Button>
            </div>

            <Tabs defaultValue="spreadsheets" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="spreadsheets" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Test Spreadsheets
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  ONLYOFFICE Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="spreadsheets" className="mt-6">
                {/* Test Sheets Grid */}
                {isTestSheetsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : testSheets?.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No test sheets</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new test sheet.
                      </p>
                      <div className="mt-6">
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Test Sheet
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testSheets?.map((sheet) => (
                      <Card key={sheet.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                          <div className="flex-1">
                            <CardTitle className="text-base font-medium truncate">
                              {sheet.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                v{sheet.metadata.version}
                              </Badge>
                              {sheet.metadata.collaborators.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {sheet.metadata.collaborators.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewSheet(sheet)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditSheet(sheet)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedSheet(sheet);
                                  setDuplicateSheetName(`${sheet.name} (Copy)`);
                                  setDuplicateDialogOpen(true);
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSheet(sheet);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Updated {format(new Date(sheet.updatedAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-3 w-3" />
                              <span>
                                {sheet.data.rows} rows × {sheet.data.cols} columns
                              </span>
                            </div>
                          </div>
                          <Button 
                            className="w-full mt-4" 
                            variant="outline"
                            onClick={() => handleViewSheet(sheet)}
                          >
                            Open Sheet
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <OnlyOfficeEditor />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Create Sheet Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Test Sheet</DialogTitle>
            <DialogDescription>
              Create a new test sheet for {selectedProject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sheet-name">Sheet Name</Label>
              <Input
                id="sheet-name"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="Enter sheet name"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSheet}
              disabled={!newSheetName.trim() || createTestSheetMutation.isPending}
            >
              {createTestSheetMutation.isPending ? "Creating..." : "Create Sheet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Sheet Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Test Sheet</DialogTitle>
            <DialogDescription>
              Create a copy of "{selectedSheet?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="duplicate-sheet-name">New Sheet Name</Label>
              <Input
                id="duplicate-sheet-name"
                value={duplicateSheetName}
                onChange={(e) => setDuplicateSheetName(e.target.value)}
                placeholder="Enter new sheet name"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDuplicateSheet}
              disabled={!duplicateSheetName.trim() || duplicateTestSheetMutation.isPending}
            >
              {duplicateTestSheetMutation.isPending ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the test sheet "{selectedSheet?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSheet}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTestSheetMutation.isPending}
            >
              {deleteTestSheetMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Google Sheets Editor */}
      {editorOpen && selectedSheet && (
        <div className="fixed inset-0 z-50 bg-white">
          <GoogleSheetsEnhanced
            selectedSheet={selectedSheet}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: [`/api/test-sheets`, selectedProjectId] });
            }}
            onClose={() => setEditorOpen(false)}
          />
        </div>
      )}
    </MainLayout>
  );
}