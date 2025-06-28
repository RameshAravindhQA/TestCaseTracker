
import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectSelect } from "@/components/ui/project-select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface TraceabilityCell {
  id: string;
  requirementId: string;
  testCaseId: string;
  status: 'covered' | 'partial' | 'not_covered';
  notes?: string;
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  moduleId: string;
}

interface TestCase {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'deprecated';
  moduleId: string;
}

export default function TraceabilityMatrixPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [matrixCells, setMatrixCells] = useState<Record<string, TraceabilityCell>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
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

  // Fetch modules for selected project
  const { data: modules } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "modules"],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/modules`);
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Fetch test cases for selected project
  const { data: projectTestCases } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "test-cases"],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/test-cases`);
      if (!response.ok) throw new Error("Failed to fetch test cases");
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Fetch bugs for selected project (treating as requirements)
  const { data: projectBugs } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "bugs"],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest('GET', `/api/projects/${selectedProjectId}/bugs`);
      if (!response.ok) throw new Error("Failed to fetch bugs");
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Load requirements and test cases when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setIsLoading(true);

      // Convert bugs to requirements format
      const reqs: Requirement[] = projectBugs?.map((bug: any) => ({
        id: `REQ-${bug.id}`,
        title: bug.title || `Requirement ${bug.id}`,
        description: bug.description || bug.stepsToReproduce || '',
        priority: bug.priority?.toLowerCase() || 'medium',
        moduleId: bug.moduleId || 'default'
      })) || [];

      // Convert test cases
      const tcs: TestCase[] = projectTestCases?.map((tc: any) => ({
        id: `TC-${tc.id}`,
        title: tc.feature || tc.scenario || `Test Case ${tc.id}`,
        description: tc.description || tc.testObjective || '',
        status: 'active',
        moduleId: tc.moduleId || 'default'
      })) || [];

      setRequirements(reqs);
      setTestCases(tcs);

      // Initialize matrix cells
      const cells: Record<string, TraceabilityCell> = {};
      reqs.forEach(req => {
        tcs.forEach(tc => {
          const cellId = `${req.id}-${tc.id}`;
          cells[cellId] = {
            id: cellId,
            requirementId: req.id,
            testCaseId: tc.id,
            status: 'not_covered',
          };
        });
      });

      setMatrixCells(cells);
      setIsLoading(false);
    } else {
      // Clear data when no project is selected
      setRequirements([]);
      setTestCases([]);
      setMatrixCells({});
      setIsLoading(false);
    }
  }, [selectedProjectId, projectTestCases, projectBugs]);

  const updateCellStatus = (cellId: string, status: TraceabilityCell['status']) => {
    setMatrixCells(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        status,
      }
    }));
  };

  const getCellStatusBadge = (status: TraceabilityCell['status']) => {
    switch (status) {
      case 'covered':
        return <Badge className="bg-green-100 text-green-800 cursor-pointer">✓</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 cursor-pointer">~</Badge>;
      case 'not_covered':
        return <Badge className="bg-red-100 text-red-800 cursor-pointer">✗</Badge>;
      default:
        return <Badge variant="secondary" className="cursor-pointer">?</Badge>;
    }
  };

  const cycleCellStatus = (cellId: string) => {
    const cell = matrixCells[cellId];
    if (!cell) return;

    let newStatus: TraceabilityCell['status'];
    switch (cell.status) {
      case 'not_covered':
        newStatus = 'covered';
        break;
      case 'covered':
        newStatus = 'partial';
        break;
      case 'partial':
        newStatus = 'not_covered';
        break;
      default:
        newStatus = 'not_covered';
    }

    updateCellStatus(cellId, newStatus);
  };

  const exportToCSV = () => {
    const headers = ['Requirement ID', 'Requirement Title', ...testCases.map(tc => tc.id)];
    const rows = [headers];

    requirements.forEach(req => {
      const row = [req.id, req.title];
      testCases.forEach(tc => {
        const cellId = `${req.id}-${tc.id}`;
        const cell = matrixCells[cellId];
        row.push(cell?.status || 'not_covered');
      });
      rows.push(row);
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

      // Add title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text('Traceability Matrix Report', 14, 20);

      // Add project info
      const project = projects?.find(p => p.id === selectedProjectId);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Project: ${project?.name || 'Unknown'}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);

      // Add coverage summary
      const totalCells = Object.values(matrixCells).length;
      const coveredCells = Object.values(matrixCells).filter(cell => cell.status === 'covered').length;
      const coveragePercent = totalCells > 0 ? Math.round((coveredCells / totalCells) * 100) : 0;

      doc.text(`Coverage: ${coveragePercent}% (${coveredCells}/${totalCells} cells covered)`, 14, 42);

      // Add matrix image
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, 'PNG', 14, 50, imgWidth, imgHeight);

      doc.save(`traceability-matrix-${Date.now()}.pdf`);

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

  // Get current project details
  const currentProject = projects?.find(p => p.id === selectedProjectId);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Traceability Matrix</h1>
              <p className="text-muted-foreground">
                Map requirements to test cases to ensure complete coverage
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={exportToCSV} variant="outline" disabled={!selectedProjectId || requirements.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" disabled={!selectedProjectId || requirements.length === 0}>
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

        {!selectedProjectId ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-500">Please select a project to view the traceability matrix.</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project: {currentProject?.name || 'Unknown Project'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Requirements:</span> {requirements.length}
                  </div>
                  <div>
                    <span className="font-medium">Test Cases:</span> {testCases.length}
                  </div>
                  <div>
                    <span className="font-medium">Modules:</span> {modules?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Matrix Cells:</span> {Object.keys(matrixCells).length}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Summary */}
            {requirements.length > 0 && testCases.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{requirements.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Test Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{testCases.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Coverage Percentage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        (Object.values(matrixCells).filter(cell => cell.status === 'covered').length / 
                         Math.max(Object.values(matrixCells).length, 1)) * 100
                      )}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Partial Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.values(matrixCells).filter(cell => cell.status === 'partial').length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Traceability Matrix Table */}
            {requirements.length > 0 && testCases.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements vs Test Cases Matrix</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Click on cells to cycle through coverage states: ✗ (not covered) → ✓ (covered) → ~ (partial)
                  </p>
                </CardHeader>
                <CardContent>
                  <div ref={matrixRef} className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px] sticky left-0 bg-white z-10">Requirements</TableHead>
                          {testCases.map(tc => (
                            <TableHead key={tc.id} className="text-center min-w-[80px]">
                              <div className="truncate" title={tc.title}>
                                {tc.id}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requirements.map(req => (
                          <TableRow key={req.id}>
                            <TableCell className="sticky left-0 bg-white z-10 border-r">
                              <div className="font-medium">{req.id}</div>
                              <div className="text-sm text-muted-foreground truncate" title={req.title}>
                                {req.title}
                              </div>
                            </TableCell>
                            {testCases.map(tc => {
                              const cellId = `${req.id}-${tc.id}`;
                              const cell = matrixCells[cellId];
                              return (
                                <TableCell key={cellId} className="text-center">
                                  <div
                                    onClick={() => cycleCellStatus(cellId)}
                                    className="flex justify-center"
                                  >
                                    {getCellStatusBadge(cell?.status || 'not_covered')}
                                  </div>
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
                <CardContent className="pt-6 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {requirements.length === 0 && testCases.length === 0 
                      ? "No requirements or test cases found for this project."
                      : requirements.length === 0 
                        ? "No requirements (bugs) found for this project."
                        : "No test cases found for this project."
                    }
                  </p>
                  <div className="mt-4 text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                    <p>Debug Info:</p>
                    <p>Project ID: {selectedProjectId}</p>
                    <p>Modules: {modules?.length || 0}</p>
                    <p>Requirements (Bugs): {requirements.length}</p>
                    <p>Test Cases: {testCases.length}</p>
                    <p>Project Bugs Data: {projectBugs?.length || 0}</p>
                    <p>Project Test Cases Data: {projectTestCases?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Module Coverage Table */}
            {modules && modules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Module Test Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Module</TableHead>
                          <TableHead>Test Cases</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Coverage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modules.map((module: any) => {
                          const moduleTestCases = testCases?.filter((tc: any) => tc.moduleId === module.id) || [];
                          const passedTests = moduleTestCases.filter((tc: any) => tc.status === 'active').length;
                          const coverage = moduleTestCases.length > 0 ? Math.round((passedTests / moduleTestCases.length) * 100) : 0;

                          return (
                            <TableRow key={module.id}>
                              <TableCell>
                                <div className="font-medium">{module.name}</div>
                                <div className="text-sm text-gray-500">{module.description || 'No description'}</div>
                              </TableCell>
                              <TableCell>
                                {moduleTestCases.length === 0 ? (
                                  <div className="text-sm text-gray-500">No test cases</div>
                                ) : (
                                  <div>{moduleTestCases.length} test cases</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={module.status === 'Active' ? 'default' : 'secondary'}>
                                  {module.status || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${coverage >= 70 ? 'bg-green-500' : coverage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${coverage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{coverage}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
