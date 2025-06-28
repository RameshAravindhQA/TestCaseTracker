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
  const [matrixCells, setMatrixCells] = useState<Record<string, TraceabilityCell>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

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

  const { data: apiTestCases } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "test-cases"],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/test-cases`);
      if (!response.ok) throw new Error("Failed to fetch test cases");
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Fetch test cases for selected project
  const { data: projectTestCases } = useQuery({
    queryKey: [`/api/projects/${selectedProjectId}/test-cases`],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest('GET', `/api/projects/${selectedProjectId}/test-cases`);
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

  // Computed testCases from apiTestCases
  const testCases = apiTestCases || [];

  // Load requirements and test cases when project changes
  useEffect(() => {
    if (selectedProjectId && (projectTestCases || apiTestCases) && projectBugs) {
      setIsLoading(true);

      // Convert bugs to requirements format
      const reqs: Requirement[] = projectBugs?.map((bug: any) => ({
        id: `REQ-${bug.id}`,
        title: bug.title || `Requirement ${bug.id}`,
        description: bug.description || bug.stepsToReproduce || '',
        priority: bug.priority?.toLowerCase() || 'medium',
        moduleId: bug.moduleId || 'default'
      })) || [];

      // Use either projectTestCases or apiTestCases, whichever is available
      const testCaseData = projectTestCases || apiTestCases || [];
      const tcs: TestCase[] = testCaseData?.map((tc: any) => ({
        id: `TC-${tc.id}`,
        title: tc.feature || tc.scenario || `Test Case ${tc.id}`,
        description: tc.description || tc.testObjective || '',
        status: 'active',
        moduleId: tc.moduleId || 'default'
      })) || [];

      setRequirements(reqs);

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
    } else if (selectedProjectId) {
      // Clear data when project is selected but no data is available yet
      setRequirements([]);
      setMatrixCells({});
      setIsLoading(false);
    }
  }, [selectedProjectId, projectTestCases, projectBugs, apiTestCases]);

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
        return <Badge className="bg-green-100 text-green-800">Covered</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'not_covered':
        return <Badge className="bg-red-100 text-red-800">Not Covered</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
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

      // Add detailed table on next page if needed
      if (requirements.length > 0 && testCases.length > 0) {
        doc.addPage();

        const tableData = requirements.map(req => {
          const row = [req.id, req.title.substring(0, 30)];
          testCases.forEach(tc => {
            const cellId = `${req.id}-${tc.id}`;
            const cell = matrixCells[cellId];
            row.push(cell?.status === 'covered' ? 'C' : cell?.status === 'partial' ? 'P' : 'N');
          });
          return row;
        });

        const tableHeaders = ['Req ID', 'Title', ...testCases.map(tc => tc.id.substring(0, 8))];

        autoTable(doc, {
          head: [tableHeaders],
          body: tableData,
          startY: 20,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 40 }
          }
        });
      }

      doc.save(`traceability-matrix-${Date.now()}.pdf`);

      toast({
        title: "Export successful",
        description: "Traceability matrix exported to PDF with graphics",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

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
            <Button onClick={exportToCSV} variant="outline" disabled={!selectedProjectId}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" disabled={!selectedProjectId}>
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
        ) : requirements.length === 0 || testCases.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
              <p className="mt-1 text-sm text-gray-500">
                No requirements or test cases found for this project. Create some test cases and bugs to see the matrix.
              </p>
              <div className="mt-4 text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                <p>Debug Info:</p>
                <p>Project ID: {selectedProjectId}</p>
                <p>Modules: {modules?.length || 0}</p>
                <p>Requirements (Bugs): {requirements.length}</p>
                <p>Test Cases: {testCases.length}</p>
                <p>API Test Cases: {apiTestCases?.length || 0}</p>
                <p>Project Test Cases: {projectTestCases?.length || 0}</p>
                <p>Project Bugs: {projectBugs?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {selectedProjectId && modules && modules.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left font-medium">Module</th>
                  <th className="border border-gray-300 p-3 text-left font-medium">Test Cases</th>
                  <th className="border border-gray-300 p-3 text-left font-medium">Status</th>
                  <th className="border border-gray-300 p-3 text-left font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module: any) => {
                  const moduleTestCases = testCases?.filter((tc: any) => tc.moduleId === module.id) || [];
                  const passedTests = moduleTestCases.filter((tc: any) => tc.status === 'Pass').length;
                  const coverage = moduleTestCases.length > 0 ? Math.round((passedTests / moduleTestCases.length) * 100) : 0;

                  return (
                    <tr key={module.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3">
                        <div className="font-medium">{module.name}</div>
                        <div className="text-sm text-gray-500">{module.description || 'No description'}</div>
                      </td>
                      <td className="border border-gray-300 p-3">
                        {moduleTestCases.length === 0 ? (
                          <div className="text-sm text-gray-500">No test cases</div>
                        ) : (
                          <div className="space-y-1">
                            {moduleTestCases.slice(0, 3).map((tc: any) => (
                              <div key={tc.id} className="text-sm">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                  tc.status === 'Pass' ? 'bg-green-500' :
                                  tc.status === 'Fail' ? 'bg-red-500' :
                                  tc.status === 'Blocked' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`}></span>
                                {tc.feature || tc.testCaseId || `Test Case ${tc.id}`}
                              </div>
                            ))}
                            {moduleTestCases.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{moduleTestCases.length - 3} more tests
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 p-3">
                        <Badge variant={module.status === 'Active' ? 'default' : 'secondary'}>
                          {module.status || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${coverage >= 70 ? 'bg-green-500' : coverage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${coverage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{coverage}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {passedTests}/{moduleTestCases.length} tests passed
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Coverage Summary */}
        {selectedProjectId && !isLoading && requirements.length > 0 && (
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
      </div>
    </MainLayout>
  );
}