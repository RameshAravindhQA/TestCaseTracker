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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return response.json();
    },
  });

  // Fetch modules for selected project
  const { data: modules } = useQuery<Module[]>({
    queryKey: [`/api/modules`, selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest('GET', `/api/modules?projectId=${selectedProjectId}`);
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Load requirements and test cases when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadMatrixData();
    }
  }, [selectedProjectId]);

  const loadMatrixData = async () => {
    if (!selectedProjectId) return;

    setIsLoading(true);
    try {
      // Load requirements (mock data for now)
      const mockRequirements: Requirement[] = [
        { id: 'REQ-001', title: 'User Authentication', description: 'Users must be able to log in', priority: 'high', moduleId: 'auth' },
        { id: 'REQ-002', title: 'Data Validation', description: 'All inputs must be validated', priority: 'medium', moduleId: 'validation' },
        { id: 'REQ-003', title: 'Error Handling', description: 'System must handle errors gracefully', priority: 'high', moduleId: 'core' },
      ];

      // Load test cases (mock data for now)
      const mockTestCases: TestCase[] = [
        { id: 'TC-001', title: 'Login with valid credentials', description: 'Test successful login', status: 'active', moduleId: 'auth' },
        { id: 'TC-002', title: 'Login with invalid credentials', description: 'Test failed login', status: 'active', moduleId: 'auth' },
        { id: 'TC-003', title: 'Input validation test', description: 'Test input validation', status: 'active', moduleId: 'validation' },
      ];

      setRequirements(mockRequirements);
      setTestCases(mockTestCases);

      // Initialize matrix cells
      const cells: Record<string, TraceabilityCell> = {};
      mockRequirements.forEach(req => {
        mockTestCases.forEach(tc => {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load traceability matrix data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const exportMatrix = () => {
    // Create CSV export
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
            <Button onClick={exportMatrix} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Matrix
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
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No project selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a project to view the traceability matrix.
              </p>
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
                Loading requirements and test cases for the selected project...
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Requirements vs Test Cases Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Requirements</TableHead>
                      {testCases.map(testCase => (
                        <TableHead key={testCase.id} className="min-w-[120px] text-center">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{testCase.id}</span>
                            <span className="text-xs text-muted-foreground truncate" title={testCase.title}>
                              {testCase.title}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requirements.map(requirement => (
                      <TableRow key={requirement.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{requirement.id}</span>
                            <span className="text-sm text-muted-foreground">
                              {requirement.title}
                            </span>
                            <Badge 
                              variant={requirement.priority === 'high' ? 'destructive' : 
                                     requirement.priority === 'medium' ? 'default' : 'secondary'}
                              className="w-fit"
                            >
                              {requirement.priority}
                            </Badge>
                          </div>
                        </TableCell>
                        {testCases.map(testCase => {
                          const cellId = `${requirement.id}-${testCase.id}`;
                          const cell = matrixCells[cellId];

                          return (
                            <TableCell key={cellId} className="text-center">
                              <div className="flex justify-center">
                                <button
                                  onClick={() => {
                                    const statuses: TraceabilityCell['status'][] = ['not_covered', 'partial', 'covered'];
                                    const currentIndex = statuses.indexOf(cell?.status || 'not_covered');
                                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                                    updateCellStatus(cellId, nextStatus);
                                  }}
                                  className="cursor-pointer"
                                >
                                  {getCellStatusBadge(cell?.status || 'not_covered')}
                                </button>
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
        )}

        {/* Coverage Summary */}
        {selectedProjectId && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                     Object.values(matrixCells).length) * 100
                  )}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}