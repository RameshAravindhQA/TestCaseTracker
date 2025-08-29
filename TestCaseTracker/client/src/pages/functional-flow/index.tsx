import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Save, Download, Upload, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/auth';
import { MainLayout } from '@/components/layout/main-layout';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLocation, useSearch } from 'wouter';

interface Project {
  id: string;
  name: string;
}

interface FlowDiagram {
  id: string;
  name: string;
  description: string;
  projectId: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 5 },
  },
];

const initialEdges: Edge[] = [];

const nodeTypes = {
  start: { label: 'Start Node', color: '#10B981' },
  process: { label: 'Process', color: '#3B82F6' },
  decision: { label: 'Decision', color: '#F59E0B' },
  end: { label: 'End Node', color: '#EF4444' },
  input: { label: 'Input', color: '#8B5CF6' },
  output: { label: 'Output', color: '#06B6D4' },
};

export default function FunctionalFlowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [diagramName, setDiagramName] = useState('');
  const [diagramDescription, setDiagramDescription] = useState('');
  const [selectedDiagram, setSelectedDiagram] = useState<string>('');
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState('process');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const diagramId = searchParams.get('diagramId') || undefined;
  const urlProjectId = searchParams.get('projectId');
  const urlModuleId = searchParams.get('moduleId');


  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Auto-select project from URL parameters or diagramId
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      if (urlProjectId) {
        // Auto-select project from URL parameter
        const projectId = urlProjectId.toString();
        const project = projects.find(p => p.id.toString() === projectId);
        if (project) {
          setSelectedProject(project.id);
          console.log(`Auto-selected project: ${project.name} (ID: ${project.id})`);
        }
      } else if (diagramId) {
        // Fetch the diagram to get the associated project ID
        const fetchDiagramAndSetProject = async () => {
          try {
            const response = await apiRequest('GET', `/api/flow-diagrams/${diagramId}`);
            if (!response.ok) throw new Error('Failed to fetch diagram details');
            const diagramData: FlowDiagram = await response.json();
            setSelectedProject(diagramData.projectId);
          } catch (error) {
            console.error("Error fetching diagram for auto-selection:", error);
            // Fallback: select the first project if fetching diagram fails
            if (projects.length > 0) {
              setSelectedProject(projects[0].id);
            }
          }
        };
        fetchDiagramAndSetProject();
      }
    }
  }, [diagramId, projects, selectedProject, urlProjectId]);

  // Fetch flow diagrams for selected project
  const { data: diagrams = [], isLoading: diagramsLoading, refetch } = useQuery({
    queryKey: ['flow-diagrams', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await apiRequest('GET', `/api/flow-diagrams?projectId=${selectedProject}`);
      if (!response.ok) throw new Error('Failed to fetch diagrams');
      return response.json();
    },
    enabled: !!selectedProject
  });

  // Save diagram mutation
  const saveDiagramMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; projectId: string; nodes: Node[]; edges: Edge[] }) => {
      const response = await apiRequest('POST', '/api/flow-diagrams', data);
      if (!response.ok) throw new Error('Failed to save diagram');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Flow diagram saved successfully',
      });
      refetch();
      setIsSaveDialogOpen(false);
      setDiagramName('');
      setDiagramDescription('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save diagram: ${error}`,
        variant: 'destructive',
      });
    }
  });

  // Load diagram mutation
  const loadDiagramMutation = useMutation({
    mutationFn: async (diagramId: string) => {
      const response = await apiRequest('GET', `/api/flow-diagrams/${diagramId}`);
      if (!response.ok) throw new Error('Failed to load diagram');
      return response.json();
    },
    onSuccess: (diagram: FlowDiagram) => {
      setNodes(diagram.nodes || initialNodes);
      setEdges(diagram.edges || initialEdges);
      setDiagramName(diagram.name || '');
      setDiagramDescription(diagram.description || '');
      toast({
        title: 'Success',
        description: 'Flow diagram loaded successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to load diagram: ${error}`,
        variant: 'destructive',
      });
    }
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = () => {
    if (!newNodeLabel.trim()) return;

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'default',
      data: { 
        label: newNodeLabel,
        nodeType: newNodeType 
      },
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 400 + 100 
      },
      style: {
        backgroundColor: nodeTypes[newNodeType as keyof typeof nodeTypes]?.color || '#3B82F6',
        color: 'white',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '10px',
      },
    };

    setNodes((nds) => nds.concat(newNode));
    setNewNodeLabel('');
    setIsCreateDialogOpen(false);
  };

  const exportToPDF = async () => {
    if (!reactFlowRef.current) return;

    try {
      const canvas = await html2canvas(reactFlowRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 60; // Increased to make room for header

      // Get selected project name
      const selectedProjectName = projects.find((p: Project) => p.id === selectedProject)?.name || 'Unknown Project';

      // Add header with project details
      pdf.setFontSize(16);
      pdf.text('TestCaseTracker - Functional Flow Diagram', pdfWidth / 2, 15, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`Project: ${selectedProjectName}`, 20, 30);
      pdf.text(`Diagram: ${diagramName || 'Untitled Flow'}`, 20, 40);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);

      if (diagramDescription) {
        pdf.text(`Description: ${diagramDescription}`, 20, 55);
      }

      // Add a line separator
      pdf.line(20, 58, pdfWidth - 20, 58);

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${selectedProjectName}_${diagramName || 'flow-diagram'}_${Date.now()}.pdf`);

      toast({
        title: 'Success',
        description: 'Flow diagram exported to PDF successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export diagram to PDF',
        variant: 'destructive',
      });
    }
  };

  const handleSaveDiagram = () => {
    if (!selectedProject || !diagramName.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a project and enter a diagram name',
        variant: 'destructive',
      });
      return;
    }

    saveDiagramMutation.mutate({
      name: diagramName,
      description: diagramDescription,
      projectId: selectedProject,
      nodes,
      edges,
    });
  };

  const handleLoadDiagram = () => {
    if (selectedDiagram) {
      loadDiagramMutation.mutate(selectedDiagram);
    }
  };

  // Effect to load diagram if diagramId is present in the URL
  useEffect(() => {
    if (diagramId && selectedProject) {
      loadDiagramMutation.mutate(diagramId);
    }
  }, [diagramId, selectedProject, loadDiagramMutation]);

  // Fetch test cases for flow generation
  const { data: testCases = [] } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/test-cases`, { moduleId: urlModuleId }],
    queryFn: async () => {
      if (!selectedProject) return [];
      let url = `/api/projects/${selectedProject}/test-cases`;
      if (urlModuleId && urlModuleId !== "all") {
        url += `?moduleId=${urlModuleId}`;
      }
      const response = await apiRequest('GET', url);
      if (!response.ok) throw new Error('Failed to fetch test cases');
      return response.json();
    },
    enabled: !!selectedProject && !!urlProjectId
  });

  // Auto-generate flow diagram when project is selected from URL
  useEffect(() => {
    if (urlProjectId && selectedProject && !diagramId && projects.length > 0 && testCases.length > 0) {
      const generateFlowForProject = async () => {
        try {
          console.log(`Auto-generating flow diagram for project ${selectedProject} with ${testCases.length} test cases`);
          
          const project = projects.find(p => p.id === selectedProject);
          if (!project) return;

          // Generate a flow diagram name
          const timestamp = new Date().toLocaleString();
          const generatedName = `${project.name} - Test Cases Flow (${timestamp})`;
          
          // Create nodes for test cases
          const flowNodes: Node[] = [];
          const flowEdges: Edge[] = [];

          // Start node
          const startNode: Node = {
            id: 'start-1',
            type: 'default',
            data: { label: `${project.name} Test Flow Start` },
            position: { x: 250, y: 50 },
            style: {
              backgroundColor: '#10B981',
              color: 'white',
              border: '2px solid #059669',
              borderRadius: '8px',
              padding: '10px',
              fontWeight: 'bold',
            },
          };
          flowNodes.push(startNode);

          // Group test cases by feature
          const testCasesByFeature: { [key: string]: typeof testCases } = {};
          testCases.forEach(testCase => {
            const feature = testCase.feature || 'General';
            if (!testCasesByFeature[feature]) {
              testCasesByFeature[feature] = [];
            }
            testCasesByFeature[feature].push(testCase);
          });

          let yPosition = 150;
          let lastNodeId = 'start-1';

          // Create nodes for each feature group
          Object.entries(testCasesByFeature).forEach(([feature, cases], index) => {
            const featureNodeId = `feature-${index}`;
            const featureNode: Node = {
              id: featureNodeId,
              type: 'default',
              data: { 
                label: `${feature}\n(${cases.length} test cases)`,
                description: `Feature: ${feature}`
              },
              position: { x: 250, y: yPosition },
              style: {
                backgroundColor: '#3B82F6',
                color: 'white',
                border: '2px solid #2563EB',
                borderRadius: '8px',
                padding: '15px',
                minWidth: '200px',
                textAlign: 'center',
              },
            };
            flowNodes.push(featureNode);

            // Connect to previous node
            flowEdges.push({
              id: `${lastNodeId}-to-${featureNodeId}`,
              source: lastNodeId,
              target: featureNodeId,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#374151', strokeWidth: 2 },
            });

            lastNodeId = featureNodeId;
            yPosition += 120;

            // Create test case nodes for this feature
            cases.forEach((testCase, testIndex) => {
              const testNodeId = `test-${testCase.id}`;
              const xOffset = (testIndex - (cases.length - 1) / 2) * 180;
              
              const testNode: Node = {
                id: testNodeId,
                type: 'default',
                data: { 
                  label: testCase.testCaseId,
                  description: testCase.testObjective || testCase.feature
                },
                position: { x: 250 + xOffset, y: yPosition },
                style: {
                  backgroundColor: getStatusColor(testCase.status),
                  color: 'white',
                  border: '2px solid #374151',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '12px',
                  minWidth: '120px',
                  textAlign: 'center',
                },
              };
              flowNodes.push(testNode);

              // Connect test case to feature
              flowEdges.push({
                id: `${featureNodeId}-to-${testNodeId}`,
                source: featureNodeId,
                target: testNodeId,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#6B7280', strokeWidth: 1 },
              });
            });

            yPosition += 100;
          });

          // End node
          const endNode: Node = {
            id: 'end-1',
            type: 'default',
            data: { label: 'Test Execution Complete' },
            position: { x: 250, y: yPosition },
            style: {
              backgroundColor: '#EF4444',
              color: 'white',
              border: '2px solid #DC2626',
              borderRadius: '8px',
              padding: '10px',
              fontWeight: 'bold',
            },
          };
          flowNodes.push(endNode);

          // Connect last feature to end
          flowEdges.push({
            id: `${lastNodeId}-to-end-1`,
            source: lastNodeId,
            target: 'end-1',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#374151', strokeWidth: 2 },
          });

          // Set the nodes and edges
          setNodes(flowNodes);
          setEdges(flowEdges);
          setDiagramName(generatedName);
          setDiagramDescription(`Auto-generated flow diagram showing ${testCases.length} test cases organized by feature for ${project.name}`);

          toast({
            title: 'Flow Diagram Generated',
            description: `Generated flow diagram with ${testCases.length} test cases for ${project.name}`,
          });

        } catch (error) {
          console.error('Error auto-generating flow diagram:', error);
          toast({
            title: 'Generation Error',
            description: 'Failed to auto-generate flow diagram',
            variant: 'destructive',
          });
        }
      };

      generateFlowForProject();
    }
  }, [urlProjectId, selectedProject, diagramId, projects, testCases, setNodes, setEdges, toast]);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return '#10B981';
      case 'Fail': return '#EF4444';
      case 'Blocked': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <MainLayout>
      <div className="h-screen w-full bg-gray-100 overflow-hidden overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-600">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Functional Flow Diagrams</h1>
              <p className="text-muted-foreground">Create and manage visual workflow diagrams</p>
            </div>
          </div>

          {/* Project Selection and Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Project Selection & Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="project">Select Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project: Project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProject && (
                  <div>
                    <Label htmlFor="diagram">Load Existing Diagram</Label>
                    <Select value={selectedDiagram} onValueChange={setSelectedDiagram}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a diagram" />
                      </SelectTrigger>
                      <SelectContent>
                        {diagrams.map((diagram: FlowDiagram) => (
                          <SelectItem key={diagram.id} value={diagram.id}>
                            {diagram.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {selectedDiagram && (
                    <Button onClick={handleLoadDiagram} className="flex-1">
                      Load Diagram
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedProject}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Node
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Node</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nodeLabel">Node Label</Label>
                        <Input
                          id="nodeLabel"
                          value={newNodeLabel}
                          onChange={(e) => setNewNodeLabel(e.target.value)}
                          placeholder="Enter node label"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nodeType">Node Type</Label>
                        <Select value={newNodeType} onValueChange={setNewNodeType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(nodeTypes).map(([key, type]) => (
                              <SelectItem key={key} value={key}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={addNode} className="w-full">
                        Add Node
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedProject}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Diagram
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Flow Diagram</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="diagramName">Diagram Name</Label>
                        <Input
                          id="diagramName"
                          value={diagramName}
                          onChange={(e) => setDiagramName(e.target.value)}
                          placeholder="Enter diagram name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="diagramDescription">Description</Label>
                        <Textarea
                          id="diagramDescription"
                          value={diagramDescription}
                          onChange={(e) => setDiagramDescription(e.target.value)}
                          placeholder="Enter diagram description"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleSaveDiagram} className="w-full" disabled={saveDiagramMutation.isPending}>
                        {saveDiagramMutation.isPending ? 'Saving...' : 'Save Diagram'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button onClick={exportToPDF} disabled={!selectedProject}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Flow Diagram Canvas */}
          <Card className="min-h-[600px] flex-1">
            <CardContent className="p-4 h-full">
              <div ref={reactFlowRef} className="h-[550px] w-full border rounded-lg">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  fitView
                  attributionPosition="bottom-left"
                >
                  <Controls />
                  <MiniMap />
                  <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                  <Panel position="top-left">
                    <div className="bg-white p-2 rounded shadow-lg border">
                      <h3 className="font-semibold text-sm">Flow Diagram</h3>
                      <p className="text-xs text-gray-600">
                        Drag nodes to move, click to select, connect by dragging from node handles
                      </p>
                    </div>
                  </Panel>
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}