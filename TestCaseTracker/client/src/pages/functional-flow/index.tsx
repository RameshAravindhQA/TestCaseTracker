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
  NodeTypes,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TestCaseNode } from '@/components/functional-flow/nodes/test-case-node';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Save, Download, Upload, FileDown, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/auth';
import { MainLayout } from '@/components/layout/main-layout';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLocation, useSearch } from 'wouter';
import mermaid from 'mermaid';

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

const nodeTypes: NodeTypes = {
  testCaseNode: TestCaseNode,
};

const nodeTypeOptions = {
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

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);

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

  // Load diagram mutation
  const loadDiagramMutation = useMutation({
    mutationFn: async (diagramId: string) => {
      const response = await apiRequest('GET', `/api/flow-diagrams/${diagramId}`);
      if (!response.ok) throw new Error('Failed to load diagram');
      return response.json();
    },
    onSuccess: (diagram: FlowDiagram) => {
      console.log('Loading diagram:', diagram);
      const diagramData = diagram.data || diagram;
      console.log('Diagram data structure:', diagramData);

      if (diagramData.nodes && diagramData.edges) {
        console.log(`Loading ${diagramData.nodes.length} nodes and ${diagramData.edges.length} edges`);
        setNodes(diagramData.nodes);
        setEdges(diagramData.edges);
      } else {
        // Fallback: try to use direct properties
        console.log('Using fallback loading method');
        setNodes(diagram.nodes || initialNodes);
        setEdges(diagram.edges || initialEdges);
      }

      setDiagramName(diagram.name || '');
      setDiagramDescription(diagram.description || '');
      setHasUnsavedChanges(false);
      toast({
        title: 'Success',
        description: 'Flow diagram loaded successfully',
      });
    },
    onError: (error) => {
      console.error('Load diagram error:', error);
      toast({
        title: 'Error',
        description: `Failed to load diagram: ${error}`,
        variant: 'destructive',
      });
    }
  });

  // Save diagram mutation
  const saveDiagramMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDiagram) throw new Error('No diagram selected');

      const diagramData = {
        name: diagramName,
        description: diagramDescription,
        data: {
          nodes,
          edges,
          viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }
        }
      };

      const response = await apiRequest('PUT', `/api/flow-diagrams/${selectedDiagram}`, diagramData);
      if (!response.ok) throw new Error('Failed to save diagram');
      return response.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      toast({
        title: 'Success',
        description: 'Flow diagram saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save diagram: ${error}`,
        variant: 'destructive',
      });
    }
  });

  // Handle changes to track unsaved state
  const handleNodesChange = (changes: any) => {
    onNodesChange(changes);
    if (isEditMode) setHasUnsavedChanges(true);
  };

  const handleEdgesChange = (changes: any) => {
    onEdgesChange(changes);
    if (isEditMode) setHasUnsavedChanges(true);
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSave = () => {
    saveDiagramMutation.mutate();
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (isEditMode) {
        setEdges((eds) => addEdge(params, eds));
        if (!hasUnsavedChanges) setHasUnsavedChanges(true);
      } else {
        toast({ title: 'Info', description: 'Edit mode must be enabled to connect nodes.' });
      }
    },
    [setEdges, isEditMode, hasUnsavedChanges]
  );

  const addNode = () => {
    if (!newNodeLabel.trim()) return;

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'testCaseNode',
      data: { 
        label: newNodeLabel,
        nodeType: newNodeType,
        description: 'Manual node',
        testCaseId: `BEG-${newNodeType.toUpperCase()}-TC-${String(Date.now()).slice(-3)}` // Placeholder, actual numbering handled by backend or generation
      },
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 400 + 100 
      },
      style: {
        backgroundColor: nodeTypeOptions[newNodeType as keyof typeof nodeTypeOptions]?.color || '#3B82F6',
        color: 'white',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '10px',
      },
    };

    setNodes((nds) => nds.concat(newNode));
    setNewNodeLabel('');
    setIsCreateDialogOpen(false);
    if (isEditMode) setHasUnsavedChanges(true);
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

    saveDiagramMutation.mutate();
  };

  const handleLoadDiagram = () => {
    if (selectedDiagram) {
      loadDiagramMutation.mutate(selectedDiagram);
    }
  };

  // Generate flow using Mermaid
  const generateFlowMutation = useMutation({
    mutationFn: async (projectId: string) => {
      // Pass moduleId from URL if available
      const moduleId = urlModuleId ? `?moduleId=${urlModuleId}` : '';
      const response = await apiRequest('POST', `/api/flow-diagrams/generate/${projectId}${moduleId}`, undefined);
      if (!response.ok) throw new Error('Failed to generate flow diagram');
      return response.json();
    },
    onSuccess: (result) => {
      console.log('Generated flow result:', result);
      if (result.success && result.diagram) {
        // Convert the generated diagram data to ReactFlow format
        const diagramData = result.diagram.data || result.diagram;
        console.log('Diagram data:', diagramData);

        if (diagramData.nodes && diagramData.edges) {
          setNodes(diagramData.nodes);
          setEdges(diagramData.edges);
          setDiagramName(result.diagram.name || 'Generated Flow');
          setDiagramDescription(result.diagram.description || 'Auto-generated flow diagram');

          // Refresh the diagrams list to show the newly created diagram
          refetch();

          toast({
            title: 'Success',
            description: `Generated flow with ${result.testCasesCount} test cases`,
          });
        } else {
          console.error('No nodes/edges found in diagram data:', diagramData);
          toast({
            title: 'Warning',
            description: 'Flow generated but no visual data found',
            variant: 'destructive',
          });
        }
      } else {
        console.error('Generation failed or no diagram data:', result);
      }
    },
    onError: (error) => {
      console.error('Generate flow error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate flow diagram',
        variant: 'destructive',
      });
    }
  });

  // Effect to load diagram if diagramId is present in the URL - with proper cleanup
  useEffect(() => {
    if (diagramId && selectedProject && !loadDiagramMutation.isPending) {
      loadDiagramMutation.mutate(diagramId);
    }
  }, [diagramId, selectedProject]);

  // Generate flow when project is selected from URL
  useEffect(() => {
    if (urlProjectId && selectedProject && !diagramId && projects.length > 0 && !generateFlowMutation.isPending) {
      generateFlowMutation.mutate(selectedProject);
    }
  }, [urlProjectId, selectedProject, diagramId, projects]);

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
                  <Button onClick={() => refetch()} variant="outline" className="flex-1">
                    Refresh
                  </Button>
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
                            {Object.entries(nodeTypeOptions).map(([key, type]) => (
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

                <Button 
                  onClick={() => selectedProject && generateFlowMutation.mutate(selectedProject)} 
                  disabled={!selectedProject || generateFlowMutation.isPending}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  {generateFlowMutation.isPending ? 'Generating...' : 'Generate Flow'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Flow Diagram Canvas - Compact Card View */}
          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Flow Diagram</CardTitle>
                  {hasUnsavedChanges && <span className="text-xs text-orange-600">(Unsaved changes)</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditDetailsOpen(true)}
                    disabled={!selectedDiagram}
                    title="Edit diagram details"
                  >
                    ✏️ Edit Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditMode}
                    className={isEditMode ? 'bg-blue-50 border-blue-300' : ''}
                    title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
                  >
                    {isEditMode ? '✓ Editing' : '✏️ Edit'}
                  </Button>
                  {isEditMode && hasUnsavedChanges && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      disabled={saveDiagramMutation.isPending}
                      title="Save changes"
                    >
                      {saveDiagramMutation.isPending ? '💾 Saving...' : '💾 Save'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMaximize}
                    title="Maximize to fullscreen"
                  >
                    🗖 Maximize
                  </Button>
                </div>
              </div>
              {diagramName && (
                <p className="text-sm text-gray-600 mt-1">{diagramName}</p>
              )}
            </CardHeader>
            <CardContent className="p-4 h-[calc(100%-120px)]">
              <div className="bg-white rounded-lg shadow-sm border h-full">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  onInit={setReactFlowInstance}
                  nodeTypes={nodeTypes}
                  nodesDraggable={isEditMode}
                  nodesConnectable={isEditMode}
                  elementsSelectable={isEditMode}
                  fitView
                  className="bg-gray-50 rounded-lg"
                >
                  <Controls />
                  <MiniMap />
                  <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                  <Panel position="top-left">
                    <div className="bg-white p-2 rounded shadow-lg border text-xs">
                      <p className="text-gray-600">
                        {isEditMode ? 'Edit mode: Drag nodes, connect handles' : 'View mode: Click Maximize for full editing'}
                      </p>
                    </div>
                  </Panel>
                </ReactFlow>
              </div>
            </CardContent>
          </Card>

          {/* Maximized Flow Diagram Dialog */}
          <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 text-lg">Flow Diagram - Full View</h3>
                    {hasUnsavedChanges && <span className="text-xs text-orange-600">(Unsaved changes)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditDetailsOpen(true)}
                      disabled={!selectedDiagram}
                      title="Edit diagram details"
                    >
                      ✏️ Edit Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditMode}
                      className={isEditMode ? 'bg-blue-50 border-blue-300' : ''}
                      title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
                    >
                      {isEditMode ? '✓ Editing' : '✏️ Edit'}
                    </Button>
                    {isEditMode && hasUnsavedChanges && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={saveDiagramMutation.isPending}
                        title="Save changes"
                      >
                        {saveDiagramMutation.isPending ? '💾 Saving...' : '💾 Save'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMaximized(false)}
                      title="Exit fullscreen"
                    >
                      🗗 Minimize
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    nodeTypes={nodeTypes}
                    nodesDraggable={isEditMode}
                    nodesConnectable={isEditMode}
                    elementsSelectable={isEditMode}
                    fitView
                    className="bg-gray-50"
                  >
                    <Controls />
                    <MiniMap />
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                    <Panel position="top-left">
                      <div className="bg-white p-3 rounded shadow-lg border">
                        <h3 className="font-semibold text-sm">Flow Diagram - Full Screen</h3>
                        <p className="text-xs text-gray-600">
                          {isEditMode ? 'Edit mode: Drag nodes to move, connect by dragging from node handles' : 'View mode: Enable edit mode to make changes'}
                        </p>
                        {diagramName && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            {diagramName}
                          </p>
                        )}
                      </div>
                    </Panel>
                  </ReactFlow>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Diagram Details Dialog */}
          <Dialog open={isEditDetailsOpen} onOpenChange={setIsEditDetailsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Edit Diagram Details</DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditDetailsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editDiagramName">Diagram Name</Label>
                  <Input
                    id="editDiagramName"
                    value={diagramName}
                    onChange={(e) => setDiagramName(e.target.value)}
                    placeholder="Enter diagram name"
                  />
                </div>
                <div>
                  <Label htmlFor="editDiagramDescription">Description</Label>
                  <Textarea
                    id="editDiagramDescription"
                    value={diagramDescription}
                    onChange={(e) => setDiagramDescription(e.target.value)}
                    placeholder="Enter diagram description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDetailsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedDiagram) {
                        saveDiagramMutation.mutate();
                        setIsEditDetailsOpen(false);
                      }
                    }}
                    disabled={saveDiagramMutation.isPending}
                  >
                    {saveDiagramMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
}