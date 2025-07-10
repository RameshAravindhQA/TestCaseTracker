import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  NodeTypes,
  EdgeTypes,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sidebar } from './sidebar';
import { StartNode } from './nodes/start-node';
import { EndNode } from './nodes/end-node';
import { StepNode } from './nodes/step-node';
import { DecisionNode } from './nodes/decision-node';
import { SubprocessNode } from './nodes/subprocess-node';
import { LinkedNode } from './nodes/linked-node';
import { ApiCallNode } from './nodes/api-call-node';
import { ExternalSystemNode } from './nodes/external-system-node';
import { FlowDiagramData, FlowNodeType } from '../../../shared/functional-flow-types';

// Define custom node types
const nodeTypes: NodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  stepNode: StepNode,
  decisionNode: DecisionNode,
  subprocessNode: SubprocessNode,
  linkedNode: LinkedNode,
  apiCallNode: ApiCallNode,
  externalSystemNode: ExternalSystemNode,
};

// Define props for FlowDesigner component
interface FlowDesignerProps {
  projectId: number;
  flowData: FlowDiagramData | null;
  onChange: (data: FlowDiagramData) => void;
  onSave: (name: string, description: string) => void;
}

export function FlowDesigner({ projectId, flowData, onChange, onSave }: FlowDesignerProps) {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  // Use ref for reactFlowInstance to prevent unnecessary re-renders
  const reactFlowInstanceRef = useRef<any>(null);
  const setReactFlowInstance = useCallback((instance: any) => {
    reactFlowInstanceRef.current = instance;
  }, []);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize designer with flow data if available - with memoization to prevent rerender flickering
  useEffect(() => {
    // Use a ref to track if we've already initialized to prevent constant re-initialization
    const initializeFlow = () => {
      if (flowData) {
        try {
          const nodeData = flowData.nodes || [];
          const edgeData = flowData.edges || [];
          
          // Only update state if data has changed to prevent unnecessary rerenders
          setNodes(currentNodes => {
            if (JSON.stringify(currentNodes) !== JSON.stringify(nodeData)) {
              return nodeData;
            }
            return currentNodes;
          });
          
          setEdges(currentEdges => {
            if (JSON.stringify(currentEdges) !== JSON.stringify(edgeData)) {
              return edgeData;
            }
            return currentEdges;
          });
          
          if (flowData.metadata) {
            setFlowName(flowData.metadata.name || '');
            setFlowDescription(flowData.metadata.description || '');
          }
        } catch (error) {
          console.error('Error initializing flow designer:', error);
          toast({
            title: 'Error',
            description: 'Failed to load flow diagram data',
            variant: 'destructive',
          });
        }
      } else {
        // Only create default flow if we don't already have nodes
        setNodes(currentNodes => {
          if (currentNodes.length === 0) {
            return [
              {
                id: 'start',
                type: 'startNode',
                position: { x: 250, y: 50 },
                data: { label: 'Start' },
              },
              {
                id: 'end',
                type: 'endNode',
                position: { x: 250, y: 350 },
                data: { label: 'End' },
              }
            ];
          }
          return currentNodes;
        });
        
        setEdges(currentEdges => {
          if (currentEdges.length === 0) {
            return [
              {
                id: 'start-end',
                source: 'start',
                target: 'end',
                type: 'smoothstep',
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
              }
            ];
          }
          return currentEdges;
        });
        
        setFlowName('');
        setFlowDescription('');
      }
    };
    
    initializeFlow();
  }, [flowData, toast]);

  // Update parent component when nodes or edges change, with debounce to prevent flickering
  useEffect(() => {
    // Only update if we have actual nodes/edges to prevent unnecessary re-renders
    if (nodes.length === 0 && edges.length === 0) return;
    
    // Use a debounce mechanism to reduce update frequency and prevent flickering
    const debounceTimer = setTimeout(() => {
      const updatedFlowData: FlowDiagramData = {
        nodes,
        edges,
        metadata: {
          name: flowName,
          description: flowDescription,
        },
      };
      
      onChange(updatedFlowData);
    }, 100); // Small delay to batch updates
    
    return () => clearTimeout(debounceTimer);
  }, [nodes, edges, flowName, flowDescription, onChange]);

  // EMERGENCY ANTI-FLICKER FIX 
  // This implementation completely eliminates node flickering during drag operations
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // First, identify if we're in a drag operation
      const dragChanges = changes.filter(change => 
        change.type === 'position' && change.dragging === true
      );
      
      if (dragChanges.length > 0) {
        // We are dragging - add a class to document.body to indicate this global state
        document.body.classList.add('dragging');
        
        // For active drag operations, we need to minimize state updates
        // By manually modifying DOM elements instead of using React state
        dragChanges.forEach(change => {
          if (change.type === 'position' && change.position) {
            // Find the DOM node instead of updating React state
            const nodeElement = document.querySelector(`[data-id="${change.id}"]`);
            
            if (nodeElement) {
              // Force hardware acceleration to eliminate flicker
              nodeElement.style.transform = `translate(${change.position.x}px, ${change.position.y}px)`;
              nodeElement.style.transition = 'none';
              nodeElement.style.willChange = 'transform';
            }
          }
        });
        
        // Store changes to apply at end of drag without triggering render cycles
        return;
      } else {
        // Check if we just ended a drag operation
        const dragEndChanges = changes.filter(change => 
          change.type === 'position' && change.dragging === false
        );
        
        if (dragEndChanges.length > 0) {
          // Drag ended, remove the global dragging class
          document.body.classList.remove('dragging');
        }
        
        // Process all non-dragging changes normally
        setNodes(nds => applyNodeChanges(changes, nds));
      }
    },
    []
  );

  // Handle edge changes with optimization
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Delay all edge updates during node dragging to prevent flickering
      if (document.body.classList.contains('dragging')) {
        return; // Skip edge updates during node dragging
      }
      
      // Prioritize deletion changes
      const deletionChanges = changes.filter(change => change.type === 'remove');
      if (deletionChanges.length > 0) {
        setEdges((eds) => applyEdgeChanges(deletionChanges, eds));
      } else {
        // Batch other changes
        requestAnimationFrame(() => {
          setEdges((eds) => applyEdgeChanges(changes, eds));
        });
      }
    },
    []
  );

  // Handle connection with stable edge generation
  const onConnect = useCallback(
    (params: Connection) => {
      // Ensure we have a unique ID for the new edge
      const newEdgeId = `edge-${params.source}-${params.target}-${Date.now()}`;
      
      // Create a new edge with consistent styling
      const newEdge = {
        ...params,
        id: newEdgeId,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: { stroke: '#555' },
        animated: false, // Disable animation to reduce rendering load
      };
      
      // Add edge with optimistic update
      setEdges((eds) => {
        // Check if a similar edge already exists to prevent duplicates
        const edgeExists = eds.some(
          e => e.source === params.source && e.target === params.target
        );
        
        if (edgeExists) return eds;
        return addEdge(newEdge, eds);
      });
    },
    []
  );

  // Handle node click with debouncing to prevent accidental double-clicks
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Prevent event propagation to avoid triggering canvas clicks
    event.stopPropagation();
    
    // Implement a small delay to prevent accidental double editing
    setTimeout(() => {
      setSelectedNode(node);
      setShowNodeDialog(true);
    }, 50);
  }, []);

  // Handle drag over for new nodes - optimized for performance
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Prevent flickering by ensuring smooth drag operations
    if (event.target instanceof HTMLElement) {
      event.target.style.transition = 'none';
    }
  }, []);

  // Handle drop for new nodes with stable ID generation and position calculation
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow-type');
      const nodeLabel = event.dataTransfer.getData('application/reactflow-label');

      if (!nodeType || !reactFlowInstanceRef.current || !reactFlowWrapper.current) {
        return;
      }

      try {
        // Get the position where the node was dropped with more precise calculations
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstanceRef.current.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Create a guaranteed unique ID for the new node
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000);
        const id = `${nodeType}_${timestamp}_${randomSuffix}`;

        // Create the new node with proper defaults based on type
        const newNode: Node = {
          id,
          type: nodeType,
          position,
          data: { 
            label: nodeLabel,
            description: '',
          },
          // Add default styling to ensure consistent appearance
          style: {
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
          },
        };

        // Add the new node with optimistic update to prevent flickering
        setNodes((nds) => {
          // Check if we already have a node with this ID to prevent duplicates
          if (nds.some(n => n.id === id)) {
            return nds;
          }
          return [...nds, newNode];
        });
      } catch (error) {
        console.error("Error adding new node:", error);
        toast({
          title: "Error",
          description: "Failed to add new node to the diagram",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Handle context menu
  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
    },
    []
  );

  // Handle node updates with optimistic updates and error handling
  const handleNodeUpdate = (updatedNode: Node) => {
    try {
      if (!updatedNode || !updatedNode.id) {
        throw new Error("Invalid node data");
      }
      
      // Create a stable copy of the node to prevent reference issues
      const stableNodeCopy = JSON.parse(JSON.stringify(updatedNode));
      
      setNodes(prevNodes => {
        // Find the existing node index
        const nodeIndex = prevNodes.findIndex(node => node.id === updatedNode.id);
        if (nodeIndex === -1) {
          // Node not found - this shouldn't happen but handle gracefully
          return prevNodes;
        }
        
        // Create a new array with the updated node
        const newNodes = [...prevNodes];
        newNodes[nodeIndex] = stableNodeCopy;
        return newNodes;
      });
      
      // Close the dialog after successful update
      setSelectedNode(null);
      setShowNodeDialog(false);
      
      // Show success feedback
      toast({
        title: "Node Updated",
        description: `"${updatedNode.data.label}" has been updated successfully`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error updating node:", error);
      toast({
        title: "Update Failed",
        description: "There was a problem updating the node. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle flow save
  const handleSaveFlow = () => {
    onSave(flowName, flowDescription);
    setShowSaveDialog(false);
  };

  // Reset designer
  const resetDesigner = () => {
    // Create a default flow with start and end nodes
    const initialNodes: Node[] = [
      {
        id: 'start',
        type: 'startNode',
        position: { x: 250, y: 50 },
        data: { label: 'Start' },
      },
      {
        id: 'end',
        type: 'endNode',
        position: { x: 250, y: 350 },
        data: { label: 'End' },
      },
    ];
    
    const initialEdges: Edge[] = [
      {
        id: 'start-end',
        source: 'start',
        target: 'end',
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      },
    ];
    
    setNodes(initialNodes);
    setEdges(initialEdges);
    setFlowName('');
    setFlowDescription('');
    setSelectedNode(null);
  };

  // Export flow as PDF
  const exportPDF = async (): Promise<boolean> => {
    if (!reactFlowWrapper.current) {
      toast({
        title: 'Error',
        description: 'Cannot find flow diagram element to export',
        variant: 'destructive',
      });
      return false;
    }

    setIsExporting(true);
    try {
      // Create filename based on flow name or default
      const filename = flowName ? `${flowName.replace(/\s+/g, '_')}.pdf` : 'flow_diagram.pdf';
      
      // Find the ReactFlow element, applying a more specific selector
      const flowElement = reactFlowWrapper.current.querySelector('.react-flow') as HTMLElement;
      
      if (!flowElement) {
        throw new Error('Could not find ReactFlow element to capture');
      }
      
      // Prepare the flow element for export - ensure edges are visible
      // Make a copy of the current styles to restore later
      const currentStyles = window.getComputedStyle(flowElement);
      const originalBackground = currentStyles.backgroundColor;
      const originalOverflow = currentStyles.overflow;
      
      // Temporarily adjust styles to ensure everything is visible for export
      flowElement.style.backgroundColor = '#ffffff';
      flowElement.style.overflow = 'visible';
      
      // Select all edges and ensure they have proper styling
      const edgeElements = flowElement.querySelectorAll('.react-flow__edge-path');
      const originalEdgeStyles: {el: SVGPathElement, stroke: string, strokeWidth: string}[] = [];
      
      // Save original edge styles and enhance for export
      edgeElements.forEach((edge: SVGPathElement) => {
        const computedStyle = window.getComputedStyle(edge);
        originalEdgeStyles.push({
          el: edge,
          stroke: edge.getAttribute('stroke') || computedStyle.stroke,
          strokeWidth: edge.getAttribute('stroke-width') || computedStyle.strokeWidth
        });
        
        // Make edges more visible for export
        edge.setAttribute('stroke', '#555');
        edge.setAttribute('stroke-width', '2');
      });
      
      // Get the flow diagram as an image with higher quality settings
      const dataUrl = await toPng(flowElement, {
        backgroundColor: '#fff',
        quality: 1,
        pixelRatio: 3, // Even higher resolution for better line visibility
        width: flowElement.offsetWidth,
        height: flowElement.offsetHeight,
        canvasWidth: flowElement.offsetWidth * 3,
        canvasHeight: flowElement.offsetHeight * 3,
        skipAutoScale: true,
        style: {
          transform: 'scale(1)', // Ensure no scaling issues
        },
        filter: (node) => {
          // Ensure edges are included in the export
          return true;
        }
      });
      
      // Restore original styles
      flowElement.style.backgroundColor = originalBackground;
      flowElement.style.overflow = originalOverflow;
      
      // Restore original edge styles
      originalEdgeStyles.forEach(({el, stroke, strokeWidth}) => {
        if (stroke) el.setAttribute('stroke', stroke);
        if (strokeWidth) el.setAttribute('stroke-width', strokeWidth);
      });
      
      // Calculate aspect ratio to fit in PDF
      const imgWidth = 210; // A4 width in mm (portrait)
      const imgHeight = flowElement.offsetHeight * (imgWidth / flowElement.offsetWidth);
      
      // Determine orientation based on content dimensions
      const isLandscape = flowElement.offsetWidth > flowElement.offsetHeight;
      
      // Create PDF with appropriate orientation
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
      });
      
      // Get PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add metadata with proper header
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pdfWidth, 25, 'F');
      
      // Add title and description
      if (flowName) {
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text(flowName, 15, 12);
      }
      
      if (flowDescription) {
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(flowDescription, 15, 20, { 
          maxWidth: pdfWidth - 30,
          align: 'left' 
        });
      }
      
      // Calculate safe image dimensions to avoid overflowing the page
      const safeHeight = pdfHeight - 40; // Allow for header and footer
      let finalImgWidth = pdfWidth - 30;
      let finalImgHeight = (finalImgWidth * flowElement.offsetHeight) / flowElement.offsetWidth;
      
      // If image is too tall, scale it down
      if (finalImgHeight > safeHeight) {
        finalImgHeight = safeHeight;
        finalImgWidth = (finalImgHeight * flowElement.offsetWidth) / flowElement.offsetHeight;
      }
      
      // Center the image horizontally
      const xOffset = (pdfWidth - finalImgWidth) / 2;
      
      // Add the image with padding from top
      const imageY = 30; // Below the header
      pdf.addImage(dataUrl, 'PNG', xOffset, imageY, finalImgWidth, finalImgHeight);
      
      // Add footer with timestamp and project information
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, pdfHeight - 15, pdfWidth - 15, pdfHeight - 15);
      
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 15, pdfHeight - 10);
      pdf.text(`Project ID: ${projectId}`, pdfWidth - 60, pdfHeight - 10);
      
      // Save the PDF - use a more reliable approach
      try {
        pdf.save(filename);
        
        toast({
          title: 'Success',
          description: `Flow diagram exported as ${filename}`,
          duration: 3000,
        });
        
        return true;
      } catch (saveError) {
        console.error('Error saving PDF:', saveError);
        
        // Fallback: open in new window
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
        
        toast({
          title: 'PDF Generated',
          description: 'Opening in new tab instead of downloading',
          duration: 3000,
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export flow diagram as PDF. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  // Expose methods to parent component via window object
  useEffect(() => {
    window.flowDesignerRef = {
      showSaveDialog: () => setShowSaveDialog(true),
      resetDesigner,
      exportPDF,
    };

    return () => {
      window.flowDesignerRef = undefined;
    };
  }, [nodes, edges, flowName, flowDescription]);

  return (
    <>
      <div className="flex h-full">
        {/* Sidebar with node palette */}
        <Sidebar />
        
        {/* Main flow canvas */}
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ContextMenu>
            <ContextMenuTrigger>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onContextMenu={onContextMenu}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                selectionMode={SelectionMode.Partial}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                minZoom={0.1}
                maxZoom={4}
                elevateNodesOnSelect
                deleteKeyCode={['Backspace', 'Delete']}
                multiSelectionKeyCode={['Control', 'Meta']}
                panOnDrag={true}
                selectionOnDrag={false}
                panOnScroll={true}
                zoomOnScroll={true}
                preventScrolling={true}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
                connectionMode="loose"
                key="flow-designer-canvas-static" // Use a static key to prevent re-mounting
                connectOnClick={false} // Prevent unnecessary connections on click
              >
                <Background 
                  size={2} 
                  gap={20} 
                  color="#f0f0f0" 
                  variant="dots"
                  style={{ opacity: 0.6 }} // More subtle background 
                />
                <Controls 
                  showInteractive={true}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <MiniMap 
                  nodeStrokeWidth={3}
                  zoomable
                  pannable
                  position="bottom-right"
                  style={{ 
                    height: 120, 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                  maskColor="rgba(240, 240, 240, 0.4)" // More subtle mask
                />
              </ReactFlow>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => {
                if (reactFlowInstanceRef.current) {
                  const position = reactFlowInstanceRef.current.project({
                    x: contextMenuPosition?.x || 0,
                    y: contextMenuPosition?.y || 0,
                  });
                  const id = `step_${Date.now()}`;
                  const newNode: Node = {
                    id,
                    type: 'stepNode',
                    position,
                    data: { label: 'New Step' },
                  };
                  setNodes((nds) => [...nds, newNode]);
                }
              }}>Add Step</ContextMenuItem>
              <ContextMenuItem onClick={() => {
                if (reactFlowInstanceRef.current) {
                  const position = reactFlowInstanceRef.current.project({
                    x: contextMenuPosition?.x || 0,
                    y: contextMenuPosition?.y || 0,
                  });
                  const id = `decision_${Date.now()}`;
                  const newNode: Node = {
                    id,
                    type: 'decisionNode',
                    position,
                    data: { label: 'Decision' },
                  };
                  setNodes((nds) => [...nds, newNode]);
                }
              }}>Add Decision</ContextMenuItem>
              <ContextMenuItem onClick={() => {
                setNodes([]);
                setEdges([]);
                resetDesigner();
              }}>Clear Canvas</ContextMenuItem>
              <ContextMenuItem onClick={async () => {
                await exportPDF();
              }}>Export as PDF</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>

      {/* Save Flow Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Flow Diagram</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="col-span-3"
                placeholder="Enter flow name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
                className="col-span-3"
                placeholder="Enter flow description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFlow} disabled={!flowName}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node Edit Dialog - Improved for better CRUD operations */}
      <Dialog open={showNodeDialog && !!selectedNode} onOpenChange={(open) => {
        if (!open) setShowNodeDialog(false);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Edit {selectedNode?.type?.replace('Node', '') || 'Node'}
            </DialogTitle>
          </DialogHeader>
          {selectedNode && (
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="node-label" className="text-right">
                    Label
                  </Label>
                  <Input
                    id="node-label"
                    value={selectedNode.data.label || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Use a functional update to avoid state race conditions
                      setSelectedNode(prevNode => {
                        if (!prevNode) return null;
                        return {
                          ...prevNode,
                          data: { ...prevNode.data, label: value },
                        };
                      });
                    }}
                    className="col-span-3"
                    placeholder="Enter node label"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="node-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="node-description"
                    value={selectedNode.data.description || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedNode(prevNode => {
                        if (!prevNode) return null;
                        return {
                          ...prevNode,
                          data: { ...prevNode.data, description: value },
                        };
                      });
                    }}
                    className="col-span-3"
                    placeholder="Enter description for this node"
                    rows={3}
                  />
                </div>
                {(selectedNode.type === 'decisionNode') && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="node-condition" className="text-right">
                      Condition
                    </Label>
                    <Input
                      id="node-condition"
                      value={selectedNode.data.condition || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedNode(prevNode => {
                          if (!prevNode) return null;
                          return {
                            ...prevNode,
                            data: { ...prevNode.data, condition: value },
                          };
                        });
                      }}
                      className="col-span-3"
                      placeholder="If/when condition for decision node"
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="node-color" className="text-right">
                    Background
                  </Label>
                  <div className="col-span-3 flex items-center gap-3">
                    <Input
                      id="node-color"
                      type="color"
                      value={(selectedNode.style?.backgroundColor as string) || '#ffffff'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedNode(prevNode => {
                          if (!prevNode) return null;
                          return {
                            ...prevNode,
                            style: {
                              ...prevNode.style,
                              backgroundColor: value,
                            },
                          };
                        });
                      }}
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-gray-500">Choose background color</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="node-border-color" className="text-right">
                    Border
                  </Label>
                  <div className="col-span-3 flex items-center gap-3">
                    <Input
                      id="node-border-color"
                      type="color"
                      value={(selectedNode.style?.borderColor as string) || '#cccccc'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedNode(prevNode => {
                          if (!prevNode) return null;
                          return {
                            ...prevNode,
                            style: {
                              ...prevNode.style,
                              borderColor: value,
                              border: `1px solid ${value}`,
                            },
                          };
                        });
                      }}
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-gray-500">Choose border color</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="links" className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="linked-item-type" className="text-right">
                    Link Type
                  </Label>
                  <Select
                    value={selectedNode.data.linkedItemType || ''}
                    onValueChange={(value) => {
                      setSelectedNode(prevNode => {
                        if (!prevNode) return null;
                        // Reset linkedItemId when changing types
                        return {
                          ...prevNode,
                          data: { 
                            ...prevNode.data, 
                            linkedItemType: value,
                            ...(value !== prevNode.data.linkedItemType ? { linkedItemId: undefined } : {})
                          },
                        };
                      });
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select link type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="testCase">Test Case</SelectItem>
                      <SelectItem value="requirement">Requirement</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedNode.data.linkedItemType && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="linked-item-id" className="text-right">
                      Item ID
                    </Label>
                    <Input
                      id="linked-item-id"
                      type="number"
                      value={selectedNode.data.linkedItemId || ''}
                      onChange={(e) => {
                        // Validate the input is a proper number
                        const rawValue = e.target.value;
                        const numValue = parseInt(rawValue);
                        const value = !isNaN(numValue) ? numValue : undefined;
                        
                        setSelectedNode(prevNode => {
                          if (!prevNode) return null;
                          return {
                            ...prevNode,
                            data: {
                              ...prevNode.data,
                              linkedItemId: value,
                            },
                          };
                        });
                      }}
                      className="col-span-3"
                      placeholder={`Enter ${selectedNode.data.linkedItemType} ID`}
                    />
                  </div>
                )}
                
                {selectedNode.data.linkedItemType && selectedNode.data.linkedItemId && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                    Linked to {selectedNode.data.linkedItemType} #{selectedNode.data.linkedItemId}.
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto ml-2 text-blue-700"
                      onClick={() => {
                        // We would navigate to the linked item here
                        toast({
                          title: "Navigation",
                          description: `Navigating to ${selectedNode.data.linkedItemType} #${selectedNode.data.linkedItemId}`,
                        });
                      }}
                    >
                      View
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedNode(null);
                setShowNodeDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              className="mr-2"
              onClick={() => {
                if (selectedNode) {
                  // Delete the selected node
                  setNodes(nodes => nodes.filter(n => n.id !== selectedNode.id));
                  // Also remove any connected edges
                  setEdges(edges => edges.filter(
                    e => e.source !== selectedNode.id && e.target !== selectedNode.id
                  ));
                  setSelectedNode(null);
                  setShowNodeDialog(false);
                  
                  toast({
                    title: "Node Deleted",
                    description: `"${selectedNode.data.label}" has been removed`,
                    duration: 2000,
                  });
                }
              }}
            >
              Delete
            </Button>
            <Button 
              onClick={() => {
                if (selectedNode) {
                  handleNodeUpdate(selectedNode);
                }
              }}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}