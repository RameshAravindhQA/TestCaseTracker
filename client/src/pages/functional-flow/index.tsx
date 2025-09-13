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
import { Plus, Save, Download, Upload, FileDown, GitBranch, RefreshCw, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/auth';
import { MainLayout } from '@/components/layout/main-layout';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLocation, useSearch } from 'wouter';
import mermaid from 'mermaid';
import { format } from 'date-fns';


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
  const [selectedProject, setSelectedProject] = useState<string>(''); // Renamed from selectedProjectId for clarity within component scope
  const [diagramName, setDiagramName] = useState('');
  const [diagramDescription, setDiagramDescription] = useState('');
  const [selectedDiagram, setSelectedDiagram] = useState<FlowDiagram | undefined>(undefined); // Added state for selected diagram details
  const [selectedDiagramId, setSelectedDiagramId] = useState<string | undefined>(undefined); // State for diagram selection
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(urlProjectId || undefined); // State for project selection, initialized from URL
  const [flowDiagrams, setFlowDiagrams] = useState<FlowDiagram[]>([]); // State to hold fetched diagrams
  const [showDiagramManager, setShowDiagramManager] = useState(false);

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
        const project = projects.find(p => p.id.toString() === urlProjectId.toString());
        if (project) {
          setSelectedProject(project.id);
          setSelectedProjectId(project.id); // Also update the managed state
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
            setSelectedProjectId(diagramData.projectId); // Also update the managed state
            setSelectedDiagram(diagramData); // Set selectedDiagram state
          } catch (error) {
            console.error("Error fetching diagram for auto-selection:", error);
            // Fallback: select the first project if fetching diagram fails
            if (projects.length > 0) {
              setSelectedProject(projects[0].id);
              setSelectedProjectId(projects[0].id); // Also update the managed state
            }
          }
        };
        fetchDiagramAndSetProject();
      } else if (projects.length > 0 && !selectedProjectId) {
        // If no URL params, and no project selected, select the first one
        setSelectedProject(projects[0].id);
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [diagramId, projects, selectedProject, urlProjectId, selectedProjectId]);

  // Fetch flow diagrams for selected project
  const { data: fetchedDiagrams = [], isLoading: diagramsLoading, refetch } = useQuery<FlowDiagram[]>({
    queryKey: ['flow-diagrams', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest('GET', `/api/flow-diagrams?projectId=${selectedProjectId}`);
      if (!response.ok) throw new Error('Failed to fetch diagrams');
      const data = await response.json();
      setFlowDiagrams(data); // Update local state
      return data;
    },
    enabled: !!selectedProjectId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Effect to load diagram if diagramId is present in the URL
  useEffect(() => {
    if (diagramId && selectedProjectId && !loadDiagramMutation.isPending) {
      loadDiagramMutation.mutate(diagramId);
      setSelectedDiagramId(diagramId); // Set selected diagram from URL
    }
  }, [diagramId, selectedProjectId]);

  // Generate flow when project is selected from URL
  useEffect(() => {
    if (urlProjectId && selectedProjectId && !diagramId && projects.length > 0 && !generateFlowMutation.isPending) {
      generateFlowMutation.mutate(selectedProjectId);
    }
  }, [urlProjectId, selectedProjectId, diagramId, projects]);


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
      setSelectedDiagram(diagram); // Set selectedDiagram state
      setHasUnsavedChanges(false);
      setSelectedDiagramId(diagram.id); // Set the currently loaded diagram ID
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
      if (!selectedProject) throw new Error('No project selected');
      const nameToSave = diagramName?.trim() || selectedDiagram?.name?.trim();

      if (!nameToSave) {
        toast({
          title: "Validation Error",
          description: "Please enter a diagram name.",
          variant: "destructive",
        });
        return;
      }

      const diagramDataPayload = {
        name: nameToSave, // Use the validated name
        description: diagramDescription || '',
        data: {
          nodes,
          edges,
          viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }
        }
      };

      let response;
      if (selectedDiagramId) {
        // Update existing diagram
        response = await apiRequest('PUT', `/api/flow-diagrams/${selectedDiagramId}`, diagramDataPayload);
      } else {
        // Create new diagram
        response = await apiRequest('POST', `/api/flow-diagrams`, {
          projectId: selectedProject,
          ...diagramDataPayload,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save diagram');
      }
      return response.json();
    },
    onSuccess: (savedDiagram: FlowDiagram) => {
      setHasUnsavedChanges(false);
      setSelectedDiagramId(savedDiagram.id); // Ensure selectedDiagramId is updated
      setSelectedDiagram(savedDiagram); // Update selectedDiagram state
      refetch(); // Refresh the list of diagrams
      toast({
        title: 'Success',
        description: 'Flow diagram saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save diagram',
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

  // FIX: Export PDF functionality to capture flow diagram
  const exportToPDF = async () => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Look for the flow diagram container
      const flowElement = document.querySelector('.react-flow') ||
                         document.querySelector('[data-testid="rf__wrapper"]') ||
                         document.querySelector('.flow-diagram') ||
                         document.getElementById('flow-diagram-container');

      if (!flowElement) {
        toast({
          title: "Error",
          description: "Flow diagram not found for export. Please create a flow diagram first.",
          variant: "destructive",
        });
        return;
      }

      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(flowElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: flowElement.scrollWidth,
        height: flowElement.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');

      // Add title
      pdf.setFontSize(16);
      // Use selectedProject.name for the title, if available, otherwise use a placeholder
      pdf.text(`Flow Diagram: ${selectedProject?.name || 'Unnamed Project'}`, 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

      const imgWidth = 257; // A4 landscape width in mm minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add the flow diagram image
      pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, Math.min(imgHeight, 170));

      const safeName = (selectedProject?.name || 'diagram').replace(/[^a-z0-9]/gi, '-').toLowerCase();
      pdf.save(`${safeName}-flow-diagram-${Date.now()}.pdf`);

      toast({
        title: "Success",
        description: "Flow diagram exported to PDF successfully",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Error",
        description: "Failed to export flow diagram to PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle loading a diagram
  const loadDiagram = () => {
    if (selectedDiagramId) {
      loadDiagramMutation.mutate(selectedDiagramId);
    } else {
      toast({ title: "Info", description: "Please select a diagram to load." });
    }
  };

  // Function to handle saving a diagram
  const saveDiagram = () => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }
    const nameToSave = diagramName?.trim() || selectedDiagram?.name?.trim();

    if (!nameToSave) {
      toast({
        title: "Validation Error",
        description: "Please enter a diagram name.",
        variant: "destructive",
      });
      return;
    }
    saveDiagramMutation.mutate();
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
          setSelectedDiagramId(result.diagram.id); // Set the newly generated diagram ID
          setSelectedDiagram(result.diagram); // Set the selectedDiagram state

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
        toast({
          title: 'Generation Failed',
          description: result.message || 'Could not generate flow diagram',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Generate flow error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Could not generate flow diagram',
        variant: 'destructive',
      });
    }
  });

  // Mock loadFlowDiagrams for the saveFlowDiagram function to use
  const loadFlowDiagrams = async () => {
    refetch();
  };

  // Define saveFlowDiagram as it was not part of the mutation (replaced by saveDiagramMutation)
  const saveFlowDiagram = async (diagramName: string, description: string) => {
    // This function is now handled by saveDiagramMutation, but keeping this as a fallback if needed.
    // However, the mutation logic is preferred.
    console.warn("saveFlowDiagram called directly, prefer using saveDiagramMutation.");
    saveDiagramMutation.mutate();
  };


  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Functional Flow Diagrams</h1>
        <p className="text-gray-600 mb-6">Create and manage visual workflow diagrams</p>

        {/* Project Selection & Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Selection & Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="project-select" className="text-sm font-medium">
                  Select Project
                </Label>
                <Select value={selectedProjectId || ""} onValueChange={(value) => { setSelectedProjectId(value); setSelectedProject(value); setSelectedDiagram(undefined); setDiagramName(''); setDiagramDescription(''); }}>
                  <SelectTrigger id="project-select">
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="diagram-select" className="text-sm font-medium">
                  Load Existing Diagram
                </Label>
                <Select value={selectedDiagramId || ""} onValueChange={(value) => { setSelectedDiagramId(value); setDiagramName(''); setDiagramDescription(''); }}>
                  <SelectTrigger id="diagram-select">
                    <SelectValue placeholder="Select saved diagram" />
                  </SelectTrigger>
                  <SelectContent>
                    {flowDiagrams?.map((diagram) => (
                      <SelectItem key={diagram.id} value={diagram.id}>
                        {diagram.name} - {diagram.createdAt ? format(new Date(diagram.createdAt), 'MM/dd/yyyy, h:mm a') : 'Unknown date'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={loadDiagram} disabled={!selectedDiagramId}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load Diagram
                </Button>
              </div>

              <div className="flex items-end">
                <Button onClick={() => setShowDiagramManager(true)} variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!selectedProject}>
                <Plus className="w-4 h-4 mr-2" />
                Add Node
              </Button>

              <Button onClick={saveDiagram} disabled={!selectedProject}>
                <Save className="w-4 h-4 mr-2" />
                Save Diagram
              </Button>

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
                  disabled={!selectedDiagramId && !diagramName} // Enable if diagram is loaded or a name is entered
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
                nodeTypes={nodeTypes}
                nodesDraggable={isEditMode}
                nodesConnectable={isEditMode}
                elementsSelectable={isEditMode}
                fitView
                className="bg-gray-50 rounded-lg"
                ref={reactFlowRef}
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
                    disabled={!selectedDiagramId && !diagramName} // Enable if diagram is loaded or a name is entered
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
                  ref={reactFlowRef}
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
                    if (selectedDiagramId || diagramName) { // Allow saving if diagram is loaded or name is entered
                      saveDiagramMutation.mutate();
                      setIsEditDetailsOpen(false);
                    } else {
                      toast({
                        title: "Validation Error",
                        description: "Please enter a diagram name before saving.",
                        variant: "destructive",
                      });
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

        {/* Diagram Manager Dialog (Placeholder for future implementation) */}
        <Dialog open={showDiagramManager} onOpenChange={setShowDiagramManager}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Manage Flow Diagrams</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDiagramManager(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <p>Diagram management features will be implemented here.</p>
              {/* Add features like delete, rename, etc. */}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Node Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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

      </div>
    </MainLayout>
  );
}