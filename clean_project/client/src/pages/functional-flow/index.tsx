import { MainLayout } from "@/components/layout/main-layout";
import { FlowDesigner } from "@/components/functional-flow/flow-designer";
import { SelectProject } from "@/components/functional-flow/select-project";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, GitBranch, FileDown, FilePlus, Save } from "lucide-react";
import { FlowDiagram, FlowDiagramData } from "@/../../shared/functional-flow-types";
import { useToast } from "@/hooks/use-toast";

export default function FunctionalFlowPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [currentFlowId, setCurrentFlowId] = useState<number | null>(null);
  const [flowData, setFlowData] = useState<FlowDiagramData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Fetch flow diagrams for selected project
  const {
    data: flows,
    isLoading: isFlowsLoading,
    isError: isFlowsError,
    refetch: refetchFlows
  } = useQuery<FlowDiagram[]>({
    queryKey: ['/api/flow-diagrams', selectedProjectId],
    enabled: !!selectedProjectId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Handle project selection
  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId);
    setCurrentFlowId(null);
    setFlowData(null);
  };

  // Handle flow diagram selection
  const handleFlowSelect = (flow: FlowDiagram) => {
    setCurrentFlowId(flow.id);
    setFlowData(flow.data as FlowDiagramData);
  };

  // Handle save flow diagram
  const handleSaveFlow = async (name: string, description: string) => {
    if (!selectedProjectId || !flowData) {
      toast({
        title: "Error",
        description: "Project or flow data missing",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/flow-diagrams', {
        method: currentFlowId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentFlowId,
          name,
          description,
          projectId: selectedProjectId,
          data: flowData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save flow diagram');
      }

      const savedFlow = await response.json();
      setCurrentFlowId(savedFlow.id);

      toast({
        title: "Success",
        description: "Flow diagram saved successfully",
      });

      refetchFlows();
    } catch (error) {
      console.error('Error saving flow diagram:', error);
      toast({
        title: "Error",
        description: "Failed to save flow diagram",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle export flow diagram as PDF
  const handleExportPDF = async () => {
    if (!flowData) {
      toast({
        title: "Error",
        description: "No flow data to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Export logic will be implemented in the FlowDesigner component
      const success = await window.flowDesignerRef?.exportPDF();

      if (success) {
        toast({
          title: "Success",
          description: "Flow diagram exported as PDF",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting flow diagram:', error);
      toast({
        title: "Error",
        description: "Failed to export flow diagram",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle flow data change from designer
  const handleFlowDataChange = (data: FlowDiagramData) => {
    setFlowData(data);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-500 rounded-xl shadow-lg">
                  <GitBranch className="h-8 w-8 text-white" />
                </div>
                Functional Flow Designer
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Design and visualize functional workflows and processes</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                disabled={!flowData} 
                onClick={handleExportPDF}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Export as PDF
              </Button>
              {/* Other export options can be added here */}
            </div>
          </div>

          {/* Project Selection */}
          <SelectProject onSelect={handleProjectSelect} selectedId={selectedProjectId} />

          {selectedProjectId && (
            <Tabs defaultValue="designer" className="w-full">
              <TabsList className="w-full max-w-md mx-auto">
                <TabsTrigger value="designer" className="flex-1">Designer</TabsTrigger>
                <TabsTrigger value="flowList" className="flex-1">Saved Flows</TabsTrigger>
              </TabsList>

              <TabsContent value="designer" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl">Flow Designer</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button 
                        onClick={() => {
                          // Show save dialog - will be implemented in the designer component
                          window.flowDesignerRef?.showSaveDialog();
                        }}
                        disabled={!flowData}
                        variant="default"
                        className="flex items-center gap-2"
                      >
                        <Save size={16} />
                        Save Flow
                      </Button>
                      <Button 
                        onClick={() => {
                          setCurrentFlowId(null);
                          setFlowData(null);
                          // Reset the designer - will be implemented in the designer component
                          window.flowDesignerRef?.resetDesigner();
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FilePlus size={16} />
                        New Flow
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md h-[700px] bg-gray-50">
                      <FlowDesigner 
                        projectId={selectedProjectId} 
                        flowData={flowData}
                        onChange={handleFlowDataChange}
                        onSave={handleSaveFlow}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flowList" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Saved Flow Diagrams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isFlowsLoading ? (
                      <div className="flex justify-center p-4">Loading saved flows...</div>
                    ) : isFlowsError ? (
                      <div className="text-red-500 p-4">Failed to load flow diagrams</div>
                    ) : flows && flows.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {flows.map((flow) => (
                          <Card 
                            key={flow.id} 
                            className={`cursor-pointer hover:shadow-md transition-shadow ${
                              currentFlowId === flow.id ? 'border-primary border-2' : ''
                            }`}
                            onClick={() => handleFlowSelect(flow)}
                          >
                            <CardContent className="p-4">
                              <div className="font-medium">{flow.name}</div>
                              <div className="text-sm text-gray-500 mt-1">{flow.description}</div>
                              <div className="text-xs text-gray-400 mt-2">
                                Version: {flow.version || '1.0'}
                              </div>
                              <div className="flex justify-end mt-2">
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Download flow as JSON
                                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
                                        JSON.stringify(flow.data, null, 2)
                                      );
                                      const downloadAnchorNode = document.createElement('a');
                                      downloadAnchorNode.setAttribute("href", dataStr);
                                      downloadAnchorNode.setAttribute("download", `${flow.name}.json`);
                                      document.body.appendChild(downloadAnchorNode);
                                      downloadAnchorNode.click();
                                      downloadAnchorNode.remove();
                                    }}
                                  >
                                    <FileDown size={14} />
                                    JSON
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // First select the flow to load it
                                      handleFlowSelect(flow);
                                      // Then export as PDF - with slight delay to ensure flow is loaded
                                      setTimeout(() => {
                                        handleExportPDF();
                                      }, 100);
                                    }}
                                  >
                                    <Download size={14} />
                                    PDF
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-gray-500">No saved flow diagrams</p>
                        <Button 
                          className="mt-2"
                          onClick={() => {
                            setCurrentFlowId(null);
                            setFlowData(null);
                            // Reset designer and switch to designer tab
                            window.flowDesignerRef?.resetDesigner();
                            const designerTab = document.querySelector('[data-state="inactive"][value="designer"]') as HTMLElement;
                            if (designerTab) {
                              designerTab.click();
                            }
                          }}
                        >
                          Create New Flow
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

// Add window interface extension for the flow designer reference
declare global {
  interface Window {
    flowDesignerRef?: {
      showSaveDialog: () => void;
      resetDesigner: () => void;
      exportPDF: () => Promise<boolean>;
    };
  }
}