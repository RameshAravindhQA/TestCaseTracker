
import React, { useState, useCallback, useRef } from 'react';
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

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

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
      const imgY = 30;

      pdf.text(diagramName || 'Flow Diagram', pdfWidth / 2, 20, { align: 'center' });
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`flow-diagram-${Date.now()}.pdf`);

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

  return (
    <MainLayout>
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
        <Card className="h-[600px]">
          <CardContent className="p-0 h-full">
            <div ref={reactFlowRef} className="h-full w-full">
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
    </MainLayout>
  );
}
