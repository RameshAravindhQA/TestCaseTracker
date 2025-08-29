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

  // Auto-generate flow diagram when project is selected from URL
  useEffect(() => {
    if (urlProjectId && selectedProject && !diagramId && projects.length > 0) {
      const generateFlowForProject = async () => {
        try {
          console.log(`Auto-generating flow diagram for project ${selectedProject}`);

          const project = projects.find(p => p.id === selectedProject);
          if (!project) return;

          // Generate a flow diagram name
          const timestamp = new Date().toLocaleString();
          const generatedName = `${project.name} - Test Cases Flow (${timestamp})`;

          // Create basic nodes for the project
          const startNode: Node = {
            id: 'start-1',
            type: 'startNode',
            data: { label: `${project.name} Test Flow` },
            position: { x: 250, y: 50 },
          };

          const projectNode: Node = {
            id: 'project-1',
            type: 'stepNode',
            data: { 
              label: project.name,
              description: project.description || 'Project test cases overview'
            },
            position: { x: 250, y: 150 },
          };

          const endNode: Node = {
            id: 'end-1',
            type: 'endNode',
            data: { label: 'Test Completion' },
            position: { x: 250, y: 250 },
          };

          const initialNodes = [startNode, projectNode, endNode];

          const initialEdges: Edge[] = [
            {
              id: 'e1-2',
              source: 'start-1',
              target: 'project-1',
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            {
              id: 'e2-3',
              source: 'project-1',
              target: 'end-1',
              markerEnd: { type: MarkerType.ArrowClosed },
            },
          ];

          // Set the nodes and edges
          setNodes(initialNodes);
          setEdges(initialEdges);
          setDiagramName(generatedName);
          setDiagramDescription(`Auto-generated flow diagram for ${project.name} test cases`);

          toast({
            title: 'Flow Diagram Generated',
            description: `Generated flow diagram for ${project.name}`,
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
  }, [urlProjectId, selectedProject, diagramId, projects, setNodes, setEdges, toast]);

  // Handle diagram loading errors
  useEffect(() => {
    if (diagramError && diagramId) {
      toast({
        title: 'Flow Diagram Not Found',
        description: 'The requested flow diagram could not be found. Creating a new diagram.',
        variant: 'destructive',
      });
      // Clear the diagram ID from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('diagramId');
      window.history.replaceState({}, '', url.toString());
    }
  }, [diagramError, diagramId, toast]);

  // Initialize designer with flow data if available - with memoization to prevent rerender flickering
  useEffect(() => {
    // Use a ref to track if we've already initialized to prevent constant re-initialization
    const initializeFlow = () => {
      if (flowData) {
        try {
          const nodeData = flowData.nodes || [];
          const edgeData = flowData.edges || [];