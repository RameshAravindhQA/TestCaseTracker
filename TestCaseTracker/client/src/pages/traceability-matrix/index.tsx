import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectSelect } from "@/components/ui/project-select";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Project, Module } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Check, 
  ChevronDown, 
  Download, 
  Edit, 
  FileText, 
  FileType, 
  Palette, 
  Plus, 
  Save, 
  Settings, 
  Trash, 
  X,
  Tag,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomMarker {
  id: string;
  markerId: string;
  label: string;
  color: string;
  type: string;
  projectId: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

interface MatrixCell {
  id: string;
  rowModuleId: number;
  colModuleId: number;
  projectId: number;
  value: string;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export default function TraceabilityMatrixPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [customMarkers, setCustomMarkers] = useState<CustomMarker[]>([]);
  const [matrixCells, setMatrixCells] = useState<Record<string, MatrixCell>>({});
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isMarkerDialogOpen, setIsMarkerDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<CustomMarker | null>(null);
  const [newMarker, setNewMarker] = useState({
    label: '',
    color: '#4F46E5',
    type: 'custom'
  });
  const matrixRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  // Initialize with first project if available
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      console.log('Auto-selecting first project:', projects[0].id);
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch modules for selected project
  const { data: projectModules } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "modules"],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/modules`);
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Fetch custom markers for selected project
  const { data: projectMarkers } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "matrix/markers"],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      try {
        const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/markers`);
        if (!response.ok) {
          console.log("No matrix markers found, returning empty array");
          return [];
        }
        return response.json();
      } catch (error) {
        console.log("Error fetching markers:", error);
        return [];
      }
    },
    enabled: !!selectedProjectId,
  });

  // Fetch matrix cells for selected project
  const { data: projectCells } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "matrix/cells"],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      try {
        const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/cells`);
        if (!response.ok) {
          console.log("No matrix cells found, returning empty array");
          return [];
        }
        return response.json();
      } catch (error) {
        console.log("Error fetching cells:", error);
        return [];
      }
    },
    enabled: !!selectedProjectId,
  });

  // Mutations for CRUD operations
  const createMarkerMutation = useMutation({
    mutationFn: async (markerData: any) => {
      const response = await apiRequest("POST", "/api/custom-markers", markerData);
      if (!response.ok) throw new Error("Failed to create marker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "matrix/markers"] });
      toast({ title: "Marker created successfully" });
      setIsMarkerDialogOpen(false);
      resetMarkerForm();
    },
    onError: () => {
      toast({ title: "Failed to create marker", variant: "destructive" });
    }
  });

  const updateMarkerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/custom-markers/${id}`, data);
      if (!response.ok) throw new Error("Failed to update marker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "matrix/markers"] });
      toast({ title: "Marker updated successfully" });
      setIsMarkerDialogOpen(false);
      setEditingMarker(null);
      resetMarkerForm();
    },
    onError: () => {
      toast({ title: "Failed to update marker", variant: "destructive" });
    }
  });

  const deleteMarkerMutation = useMutation({
    mutationFn: async (markerId: string) => {
      const response = await apiRequest("DELETE", `/api/custom-markers/${markerId}`);
      if (!response.ok) throw new Error("Failed to delete marker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "matrix/markers"] });
      toast({ title: "Marker deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete marker", variant: "destructive" });
    }
  });

  const updateCellMutation = useMutation({
    mutationFn: async (cellData: any) => {
      const response = await apiRequest("POST", "/api/matrix-cells", cellData);
      if (!response.ok) throw new Error("Failed to update cell");
      return response.json();
    },
    onSuccess: (data) => {
      // Update local state with the returned data from server
      const key = `${data.rowModuleId}-${data.colModuleId}`;
      setMatrixCells(prev => ({
        ...prev,
        [key]: data
      }));
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "matrix/cells"] });
    },
    onError: (error) => {
      toast({ 
        title: "Save failed", 
        description: "Failed to save matrix cell", 
        variant: "destructive" 
      });
      // Revert optimistic update by refetching
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "matrix/cells"] });
    }
  });

  // Load data when project changes
  useEffect(() => {
    console.log('Traceability Matrix Debug:', {
      selectedProjectId,
      projectModules: projectModules?.length || 0,
      projectMarkers: projectMarkers?.length || 0,
      projectCells: projectCells?.length || 0,
      projects: projects?.length || 0
    });

    if (selectedProjectId) {
      setModules(Array.isArray(projectModules) ? projectModules : []);
      setCustomMarkers(Array.isArray(projectMarkers) ? projectMarkers : []);

      // Convert cells array to object for easier lookup
      const cellsObj: Record<string, MatrixCell> = {};
      if (Array.isArray(projectCells)) {
        projectCells.forEach((cell: MatrixCell) => {
          const key = `${cell.rowModuleId}-${cell.colModuleId}`;
          cellsObj[key] = cell;
        });
      }
      setMatrixCells(cellsObj);
    } else {
      setModules([]);
      setCustomMarkers([]);
      setMatrixCells({});
    }
  }, [selectedProjectId, projectModules, projectMarkers, projectCells]);

  const resetMarkerForm = () => {
    setNewMarker({
      label: '',
      color: '#4F46E5',
      type: 'custom'
    });
  };

  const handleCreateMarker = () => {
    if (!selectedProjectId || !newMarker.label.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const markerId = `MARKER-${Date.now()}`;
    const markerData = {
      markerId,
      label: newMarker.label,
      color: newMarker.color,
      type: newMarker.type,
      projectId: selectedProjectId,
      createdById: 1 // Replace with actual user ID
    };

    createMarkerMutation.mutate(markerData);
  };

  const handleUpdateMarker = () => {
    if (!editingMarker || !newMarker.label.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    updateMarkerMutation.mutate({
      id: editingMarker.id,
      data: {
        label: newMarker.label,
        color: newMarker.color,
        type: newMarker.type
      }
    });
  };

  const handleEditMarker = (marker: CustomMarker) => {
    setEditingMarker(marker);
    setNewMarker({
      label: marker.label,
      color: marker.color,
      type: marker.type
    });
    setIsMarkerDialogOpen(true);
  };

  const handleDeleteMarker = (markerId: string) => {
    if (window.confirm("Are you sure you want to delete this marker?")) {
      deleteMarkerMutation.mutate(markerId);
    }
  };

  const handleCellValueChange = (rowModuleId: number, colModuleId: number, value: string) => {
    if (!selectedProjectId) return;

    const key = `${rowModuleId}-${colModuleId}`;

    // Optimistically update local state immediately for better UX
    setMatrixCells(prev => {
      const newCells = { ...prev };

      if (value === 'no-marker' || value === '') {
        // Remove the cell if no marker is selected
        delete newCells[key];
      } else {
        // Update or create the cell
        newCells[key] = {
          ...prev[key],
          id: prev[key]?.id || `cell-${Date.now()}`,
          rowModuleId,
          colModuleId,
          projectId: selectedProjectId,
          value: value,
          createdById: 1,
          createdAt: prev[key]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      return newCells;
    });

    // Auto-save to backend with proper persistence
    const cellData = {
      rowModuleId,
      colModuleId,
      projectId: selectedProjectId,
      value: value === 'no-marker' ? '' : value,
      createdById: 1 // Replace with actual user ID
    };

    updateCellMutation.mutate(cellData);

    toast({ 
      title: "Matrix updated", 
      description: "Changes saved to database",
      duration: 1000 
    });
  };

  const getCellContent = (rowModuleId: number, colModuleId: number) => {
    const key = `${rowModuleId}-${colModuleId}`;
    const cell = matrixCells[key];

    if (!cell || !cell.value || cell.value === 'no-marker') return null;

    const marker = customMarkers.find(m => m.markerId === cell.value);
    if (!marker) return null;

    return (
      <div
        className="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer"
        style={{ backgroundColor: marker.color }}
        title={marker.label}
      />
    );
  };

  const exportToCSV = () => {
    const headers = ['Row Module', 'Column Module', 'Marker'];
    const rows = [headers];

    modules.forEach(rowModule => {
      modules.forEach(colModule => {
        const key = `${rowModule.id}-${colModule.id}`;
        const cell = matrixCells[key];
        const marker = cell ? customMarkers.find(m => m.markerId === cell.value) : null;

        rows.push([
          rowModule.name,
          colModule.name,
          marker ? marker.label : 'No marker'
        ]);
      });
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'traceability-matrix.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Traceability matrix exported to CSV",
    });
  };

  const exportToPDF = async () => {
    if (!matrixRef.current) return;

    try {
      const canvas = await html2canvas(matrixRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text('Module Traceability Matrix', 14, 20);

      const project = projects?.find(p => p.id === selectedProjectId);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Project: ${project?.name || 'Unknown'}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, 'PNG', 14, 50, imgWidth, imgHeight);
      doc.save(`module-traceability-matrix-${Date.now()}.pdf`);

      toast({
        title: "Export successful",
        description: "Traceability matrix exported to PDF",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const currentProject = projects?.find(p => p.id === selectedProjectId);

  // Save matrix mutation
  const saveMatrixMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/traceability-matrix/save", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          matrixData: Object.entries(matrixCells).map(([key, cell]) => {
            const [rowModuleId, colModuleId] = key.split('-').map(Number);
            return {
              rowModuleId,
              colModuleId,
              markerId: cell.value,
            };
          }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save matrix');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Matrix Saved",
        description: "Traceability matrix has been saved to database",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "matrix/cells"] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveMatrix = () => {
    if (!selectedProjectId) {
      toast({
        title: "No Project Selected",
        description: "Please select a project before saving the matrix",
        variant: "destructive",
      });
      return;
    }
    saveMatrixMutation.mutate();
  };

  // Show loading state
  if (projectsLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!selectedProjectId || !projects || projects.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Module Traceability Matrix</h1>
                <p className="text-muted-foreground">
                  Map module relationships using custom markers with colors
                </p>
              </div>
            </div>
            <ProjectSelect
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              projects={projects || []}
            />
          </div>
          <Card>
            <CardContent className="pt-4 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {!projects || projects.length === 0 ? 'No Projects Available' : 'No Project Selected'}
              </h3>
              <p className="text-gray-500">
                {!projects || projects.length === 0 
                  ? 'Please create a project first to use the traceability matrix.'
                  : 'Please select a project to view the traceability matrix.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 min-h-screen overflow-hidden overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Module Traceability Matrix</h1>
              <p className="text-muted-foreground">
                Map module relationships using custom markers with colors
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
              <Dialog open={isMarkerDialogOpen} onOpenChange={setIsMarkerDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Markers
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMarker ? 'Edit Marker' : 'Create Marker'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="label" className="text-right">
                        Label
                      </Label>
                      <Input
                        id="label"
                        value={newMarker.label}
                        onChange={(e) => setNewMarker(prev => ({ ...prev, label: e.target.value }))}
                        className="col-span-3"
                        placeholder="Marker Label"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="color" className="text-right">
                        Color
                      </Label>
                      <Input
                        type="color"
                        id="color"
                        value={newMarker.color}
                        onChange={(e) => setNewMarker(prev => ({ ...prev, color: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={editingMarker ? handleUpdateMarker : handleCreateMarker}>
                      {editingMarker ? 'Update Marker' : 'Create Marker'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            <Button 
                variant="default" 
                size="sm"
                onClick={handleSaveMatrix}
                disabled={saveMatrixMutation.isPending}
              >
                {saveMatrixMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save to DB
              </Button>
            <Button onClick={exportToCSV} variant="outline" disabled={!selectedProjectId || modules.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" disabled={!selectedProjectId || modules.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <ProjectSelect
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              projects={projects || []}
            />
          </div>
        </div>

        {!selectedProjectId || !projects || projects.length === 0 ? (
          <Card>
            <CardContent className="pt-4 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {!projects || projects.length === 0 ? 'No Projects Available' : 'No Project Selected'}
              </h3>
              <p className="text-gray-500">
                {!projects || projects.length === 0 
                  ? 'Please create a project first to use the traceability matrix.'
                  : 'Please select a project to view the traceability matrix.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project: {currentProject?.name || 'Unknown Project'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Modules:</span> {modules.length}
                  </div>
                  <div>
                    <span className="font-medium">Custom Markers:</span> {customMarkers.length}
                  </div>
                  <div>
                    <span className="font-medium">Matrix Cells:</span> {Object.keys(matrixCells).length}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Marker Display */}
            {customMarkers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Markers</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select a marker and click on matrix cells to assign it. Changes are automatically saved to database.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {customMarkers.map((marker) => (
                      <div
                        key={marker.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedMarkerId === marker.markerId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedMarkerId(
                          selectedMarkerId === marker.markerId ? null : marker.markerId
                        )}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: marker.color }}
                        />
                        <span className="text-sm font-medium">{marker.label}</span>
                      </div>
                    ))}
                  </div>
                  {selectedMarkerId && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      <strong>Selected:</strong> {customMarkers.find(m => m.markerId === selectedMarkerId)?.label} - 
                      Click on matrix cells to assign this marker
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Module Traceability Matrix */}
            {modules.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Module-to-Module Traceability Matrix</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select a marker above, then click on matrix cells to assign relationships. All changes are saved to database.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto border rounded-lg" ref={matrixRef}>
                    <Table className="matrix-table">
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-[120px] sticky left-0 bg-gray-50 z-10 border-r-2 border-gray-200 font-semibold">
                            <div className="flex items-center gap-1 px-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs">Modules</span>
                            </div>
                          </TableHead>
                          {modules.map(module => (
                            <TableHead key={module.id} className="text-center w-[60px] bg-gray-50 border-r border-gray-200 p-1">
                              <div className="h-24 flex items-center justify-center">
                                <div className="transform rotate-270 whitespace-nowrap font-medium text-xs" title={module.name}>
                                  {module.name}
                                </div>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modules.map((rowModule, rowIndex) => (
                          <TableRow key={rowModule.id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                            <TableCell className="sticky left-0 bg-inherit z-10 border-r-2 border-gray-200 p-1 text-center">
                              <div className="flex items-center justify-center gap-1 px-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div className="font-medium text-xs truncate max-w-[80px]" title={rowModule.name}>
                                  {rowModule.name}
                                </div>
                              </div>
                            </TableCell>
                            {modules.map(colModule => {
                              const key = `${rowModule.id}-${colModule.id}`;
                              const cell = matrixCells[key];
                              const isDisabled = rowModule.id === colModule.id;

                              return (
                                <TableCell key={colModule.id} className="text-center p-1 border-r border-gray-200 w-[80px]">
                                  {isDisabled ? (
                                    <div className="h-8 flex items-center justify-center bg-gray-100 rounded">
                                      <X className="h-3 w-3 text-gray-400" />
                                    </div>
                                  ) : (
                                    <Select
                                      value={cell?.value || 'no-marker'}
                                      onValueChange={(value) => handleCellValueChange(rowModule.id, colModule.id, value)}
                                    >
                                      <SelectTrigger className="h-8 w-full border-dashed text-xs">
                                        <SelectValue>
                                          {cell?.value && cell.value !== 'no-marker' ? (
                                            <div className="flex items-center gap-1">
                                              <div
                                                className="w-3 h-3 rounded-full border"
                                                style={{ 
                                                  backgroundColor: customMarkers.find(m => m.markerId === cell.value)?.color || '#ccc'
                                                }}
                                              />
                                              <span className="text-xs">
                                                {customMarkers.find(m => m.markerId === cell.value)?.label || '...'}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400 text-xs">...</span>
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="no-marker">
                                          <span className="text-gray-400">No marker</span>
                                        </SelectItem>
                                        {customMarkers.map(marker => (
                                          <SelectItem key={marker.markerId} value={marker.markerId}>
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="w-3 h-3 rounded-full border"
                                                style={{ backgroundColor: marker.color }}
                                              />
                                              <span className="text-xs">{marker.label}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No modules available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No modules found for this project. Please add modules first to create a traceability matrix.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}