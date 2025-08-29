import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { TestCaseTable } from "@/components/test-cases/test-case-table";
import { TestCaseForm } from "@/components/test-cases/test-case-form";
import { TestCaseTags } from "@/components/test-cases/test-case-tags";
import { BugForm } from "@/components/bugs/bug-form";
import { ImportExport } from "@/components/test-cases/import-export";
import { ProjectSelect } from "@/components/ui/project-select";
import { ModuleSelect } from "@/components/ui/module-select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, Module, TestCase, Bug } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Loader2, TestTube, FileDown, FileUp, FileText, GitBranch } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TestCasesPage() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [bugFormOpen, setBugFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<number | string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);

  // Fetch projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch modules for selected project
  const { data: modules, isLoading: isModulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/projects/${selectedProjectId}/modules`],
    enabled: !!selectedProjectId,
  });

  // Fetch test cases for selected project/module
  const { data: testCases, isLoading: isTestCasesLoading } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${selectedProjectId}/test-cases`, { moduleId: selectedModuleId }],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      let url = `/api/projects/${selectedProjectId}/test-cases`;
      // Add moduleId as a query parameter if it's set to a number (not "all" or empty)
      if (selectedModuleId && selectedModuleId !== "all" && typeof selectedModuleId === "number") {
        url += `?moduleId=${selectedModuleId}`;
      }
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Delete test case mutation
  const deleteTestCaseMutation = useMutation({
    mutationFn: async (testCaseId: number) => {
      const res = await apiRequest("DELETE", `/api/test-cases/${testCaseId}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test case deleted",
        description: "Test case has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/test-cases`] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete test case: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete multiple test cases mutation
  const deleteMultipleTestCasesMutation = useMutation({
    mutationFn: async (testCaseIds: number[]) => {
      // Sequential deletion to ensure all are processed
      for (const id of testCaseIds) {
        await apiRequest("DELETE", `/api/test-cases/${id}`, undefined);
      }
      return { success: true };
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Test cases deleted",
        description: `${variables.length} test case(s) have been deleted successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/test-cases`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete test cases: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Handler for view button
  const handleView = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setViewDialogOpen(true);
  };

  // Handler for edit button
  const handleEdit = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setFormOpen(true);
  };

  // Handler for delete button
  const handleDelete = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setDeleteDialogOpen(true);
  };

  // Handler for report bug button
  const handleReportBug = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setBugFormOpen(true);
  };

  // Confirm delete handler
  const confirmDelete = () => {
    if (selectedTestCase) {
      deleteTestCaseMutation.mutate(selectedTestCase.id);
    }
  };

  // Handler for multiple deletion
  const handleDeleteMultiple = (ids: number[]) => {
    if (ids.length > 0) {
      // Confirm deletion with user
      if (window.confirm(`Are you sure you want to delete ${ids.length} test case(s)? This action cannot be undone.`)) {
        deleteMultipleTestCasesMutation.mutate(ids);
      }
    }
  };

  // Handler for generating flow diagram
  const handleGenerateFlowDiagram = async () => {
    if (!selectedProjectId) {
      toast({
        title: "No project selected",
        description: "Please select a project first.",
        variant: "destructive",
      });
      return;
    }

    if (filteredTestCases.length === 0) {
      toast({
        title: "No test cases found",
        description: "Please add test cases to generate a flow diagram.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingFlow(true);
    try {
      // Generate Mermaid flow diagram code from current test cases
      let mermaidCode = 'flowchart TD\n';

      // Start node
      mermaidCode += '    A[Start Testing] --> B[Setup Environment]\n';

      // Add test case nodes
      filteredTestCases.forEach((testCase, index) => {
        const nodeId = `TC${index + 1}`;
        const nextNodeId = index < filteredTestCases.length - 1 ? `TC${index + 2}` : 'END';
        const prevNodeId = index === 0 ? 'B' : `TC${index}`;

        // Sanitize test case title for Mermaid
        const sanitizedTitle = testCase.testCaseId?.replace(/[^a-zA-Z0-9\s]/g, '') || `Test Case ${index + 1}`;

        mermaidCode += `    ${prevNodeId} --> ${nodeId}["${sanitizedTitle}"]\n`;

        // Add status-based styling and flow
        if (testCase.status === 'Pass') {
          mermaidCode += `    ${nodeId} --> ${nodeId}_PASS[✓ Passed]\n`;
          mermaidCode += `    ${nodeId}_PASS --> ${nextNodeId === 'END' ? 'END' : nextNodeId}\n`;
        } else if (testCase.status === 'Fail') {
          mermaidCode += `    ${nodeId} --> ${nodeId}_FAIL[✗ Failed]\n`;
          mermaidCode += `    ${nodeId}_FAIL --> ${nextNodeId === 'END' ? 'END' : nextNodeId}\n`;
        } else {
          if (nextNodeId !== 'END') {
            mermaidCode += `    ${nodeId} --> ${nextNodeId}\n`;
          } else {
            mermaidCode += `    ${nodeId} --> END\n`;
          }
        }
      });

      // End node
      mermaidCode += '    END[Testing Complete]\n\n';

      // Add styling
      mermaidCode += '    classDef passStyle fill:#d4edda,stroke:#155724,color:#155724\n';
      mermaidCode += '    classDef failStyle fill:#f8d7da,stroke:#721c24,color:#721c24\n';
      mermaidCode += '    classDef startEndStyle fill:#e7f3ff,stroke:#0056b3,color:#0056b3\n';
      mermaidCode += '    classDef testCaseStyle fill:#fff3cd,stroke:#856404,color:#856404\n';

      // Apply styles to nodes
      mermaidCode += '    class A,B,END startEndStyle\n';
      filteredTestCases.forEach((testCase, index) => {
        const nodeId = `TC${index + 1}`;
        mermaidCode += `    class ${nodeId} testCaseStyle\n`;
        if (testCase.status === 'Pass') {
          mermaidCode += `    class ${nodeId}_PASS passStyle\n`;
        } else if (testCase.status === 'Fail') {
          mermaidCode += `    class ${nodeId}_FAIL failStyle\n`;
        }
      });

      // Create a modal dialog to show the Mermaid diagram
      const mermaidDialog = document.createElement('div');
      mermaidDialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;

      const dialogContent = document.createElement('div');
      dialogContent.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
        position: relative;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;

      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        border: none;
        background: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 5px;
      `;
      closeButton.onclick = () => document.body.removeChild(mermaidDialog);

      const title = document.createElement('h2');
      title.textContent = `Test Case Flow Diagram (${filteredTestCases.length} cases)`;
      title.style.cssText = 'margin: 0 0 20px 0; color: #333; padding-right: 30px;';

      const mermaidContainer = document.createElement('div');
      mermaidContainer.id = 'mermaid-flow-container';
      mermaidContainer.style.cssText = `
        min-height: 400px; 
        width: 100%; 
        border: 1px solid #e0e0e0; 
        border-radius: 4px; 
        padding: 15px;
        background: #fafafa;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const loadingIndicator = document.createElement('div');
      loadingIndicator.textContent = 'Generating diagram...';
      loadingIndicator.style.cssText = 'color: #666; font-style: italic;';
      mermaidContainer.appendChild(loadingIndicator);

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'margin-top: 15px; display: flex; gap: 10px;';

      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy Mermaid Code';
      copyButton.style.cssText = `
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      copyButton.onclick = () => {
        navigator.clipboard.writeText(mermaidCode);
        toast({
          title: "Copied!",
          description: "Mermaid code copied to clipboard",
        });
      };

      const openInEditorButton = document.createElement('button');
      openInEditorButton.textContent = 'Open in Flow Editor';
      openInEditorButton.style.cssText = `
        background: #28a745;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      openInEditorButton.onclick = () => {
        // Close the dialog and open flow editor
        document.body.removeChild(mermaidDialog);
        const params = new URLSearchParams();
        params.set('projectId', selectedProjectId.toString());
        if (selectedModuleId && selectedModuleId !== "all") {
          params.set('moduleId', selectedModuleId.toString());
        }
        const url = `/functional-flow?${params.toString()}`;
        window.open(url, '_blank');
      };

      buttonContainer.appendChild(copyButton);
      buttonContainer.appendChild(openInEditorButton);

      const codeSection = document.createElement('details');
      codeSection.style.cssText = 'margin-top: 20px;';

      const codeSummary = document.createElement('summary');
      codeSummary.textContent = 'View Mermaid Code';
      codeSummary.style.cssText = 'cursor: pointer; font-weight: bold; color: #333; margin-bottom: 10px;';

      const codeBlock = document.createElement('pre');
      codeBlock.style.cssText = `
        background: #f5f5f5;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 12px;
        border: 1px solid #ddd;
        margin-top: 10px;
      `;
      codeBlock.textContent = mermaidCode;

      codeSection.appendChild(codeSummary);
      codeSection.appendChild(codeBlock);

      dialogContent.appendChild(closeButton);
      dialogContent.appendChild(title);
      dialogContent.appendChild(mermaidContainer);
      dialogContent.appendChild(buttonContainer);
      dialogContent.appendChild(codeSection);
      mermaidDialog.appendChild(dialogContent);
      document.body.appendChild(mermaidDialog);

      // Import and render Mermaid dynamically
      const mermaid = await import('mermaid');
      await mermaid.default.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        }
      });

      try {
        // Clear loading indicator
        mermaidContainer.innerHTML = '';

        const { svg } = await mermaid.default.render('generated-flow-diagram', mermaidCode);
        mermaidContainer.innerHTML = svg;

        // Style the SVG for better appearance
        const svgElement = mermaidContainer.querySelector('svg');
        if (svgElement) {
          svgElement.style.cssText = 'max-width: 100%; height: auto;';
        }

      } catch (renderError) {
        console.error('Mermaid render error:', renderError);
        mermaidContainer.innerHTML = `
          <div style="color: red; padding: 20px; text-align: center;">
            <p><strong>Error rendering diagram</strong></p>
            <p style="margin-top: 10px; font-size: 14px;">The diagram code has been generated but there was an issue rendering it visually. You can still copy the Mermaid code and use it elsewhere.</p>
          </div>
        `;
      }

      toast({
        title: "Flow diagram generated!",
        description: `Created flow diagram with ${filteredTestCases.length} test cases`,
      });

    } catch (error) {
      console.error("Error generating flow diagram:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate flow diagram. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlow(false);
    }
  };

  // Filter test cases by search query and status
  const filteredTestCases = testCases?.filter(testCase => {
    // Filter by search query
    const matchesSearch = 
      testCase.testCaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testCase.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testCase.testObjective.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by status
    const matchesStatus = statusFilter === "all" || testCase.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  // Filter modules by selected project
  const filteredModules = modules?.filter(module => 
    module.projectId === parseInt(selectedProjectId.toString())
  ) || [];

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 min-h-screen overflow-hidden overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-600">
        <div className="h-full flex flex-col">
          <div className="py-6 px-4 sm:px-6 lg:px-8 flex-shrink-0">
            <div className="mb-6 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl shadow-lg">
                    <TestTube className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Test Cases</h1>
                    <p className="text-muted-foreground mt-1">Manage test cases across all projects</p>
                  </div>
                </div>
              </div>

              {selectedProjectId && (
                <div className="flex gap-2 ml-4">
                  <ImportExport
                    projectId={Number(selectedProjectId)}
                    moduleId={selectedModuleId ? Number(selectedModuleId) : undefined}
                    testCases={filteredTestCases}
                    projectName={projects?.find(p => p.id === Number(selectedProjectId))?.name}
                    moduleName={selectedModuleId && selectedModuleId !== "all" ? 
                      modules?.find(m => m.id === Number(selectedModuleId))?.name : undefined}
                  />

                  <Button
                    variant="outline"
                    onClick={handleGenerateFlowDiagram}
                    className="flex items-center gap-2"
                    disabled={!selectedProjectId || isGeneratingFlow}
                    title="Generate Flow Diagram from Test Cases"
                  >
                    {isGeneratingFlow ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <GitBranch className="h-4 w-4" />
                    )}
                    {isGeneratingFlow ? 'Generating...' : 'Generate Flow'}
                  </Button>

                  <Button 
                    onClick={() => {
                      if (!selectedProjectId) {
                        toast({
                          title: "No project selected",
                          description: "Please select a project before creating a test case",
                          variant: "destructive",
                        });
                        return;
                      }
                      setSelectedTestCase(null);
                      setFormOpen(true);
                    }} 
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Test Case
                  </Button>
                </div>
              )}
            </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="md:col-span-2">
              <ProjectSelect
                projects={projects}
                isLoading={isProjectsLoading}
                selectedProjectId={selectedProjectId}
                onChange={(value) => {
                  setSelectedProjectId(parseInt(value));
                  setSelectedModuleId("");
                }}
              />
            </div>

            <div className="md:col-span-2">
              <ModuleSelect
                modules={filteredModules}
                isLoading={isModulesLoading}
                selectedModuleId={selectedModuleId}
                onChange={(value) => setSelectedModuleId(value ? parseInt(value) : "")}
                disabled={!selectedProjectId || isModulesLoading}
                placeholder="All modules"
                includeAllOption={true}
              />
            </div>

            <div className="md:col-span-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder="Search test cases..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="md:col-span-1">
              <Select 
                value={statusFilter} 
                defaultValue="all"
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pass">Pass</SelectItem>
                  <SelectItem value="Fail">Fail</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Not Executed">Not Executed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
  </div>
          <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6 min-h-0">
          {!selectedProjectId ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">Please select a project to view its test cases</p>
              </CardContent>
            </Card>
          ) : isTestCasesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTestCases.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">
                  {searchQuery 
                    ? "No test cases found matching your search criteria" 
                    : "No test cases found. Create your first test case to get started."}
                </p>
                <Button
                  onClick={() => {
                    setSelectedTestCase(null);
                    setFormOpen(true);
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Add Test Case
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TestCaseTable 
              testCases={filteredTestCases} 
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onReportBug={handleReportBug}
              onDeleteMultiple={handleDeleteMultiple}
            />
          )}
          </div>
        </div>

        {/* Create/Edit Test Case Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] w-[95vw]">
            <DialogHeader>
              <DialogTitle>{selectedTestCase ? "Edit Test Case" : "Create New Test Case"}</DialogTitle>
              <DialogDescription>
                {selectedTestCase
                  ? "Update the test case details below."
                  : "Fill in the details to create a new test case."}
              </DialogDescription>
            </DialogHeader>
            <TestCaseForm 
              testCase={selectedTestCase || undefined}
              projectId={Number(selectedProjectId)}
              modules={modules}
              onSuccess={() => setFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* View Test Case Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] w-[95vw]">
            <DialogHeader>
              <DialogTitle>Test Case Details</DialogTitle>
              <DialogDescription>
                {selectedTestCase?.testCaseId} - {selectedTestCase?.feature}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Test Objective</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedTestCase?.testObjective}</p>
              </div>

              {selectedTestCase?.tags && (selectedTestCase.tags as any[])?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium">Tags</h3>
                  <div className="mt-2">
                    <TestCaseTags 
                      tags={selectedTestCase.tags as any[]}
                      className="animate-transition"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <div className="mt-1">
                    <span className={`px-2 py-1.5 text-xs font-semibold rounded-full inline-flex items-center animate-transition
                      ${selectedTestCase?.status === "Pass" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                        selectedTestCase?.status === "Fail" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : 
                        selectedTestCase?.status === "Blocked" ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
                      <span className={`w-2 h-2 rounded-full mr-1.5 
                        ${selectedTestCase?.status === "Pass" ? "bg-green-500" : 
                          selectedTestCase?.status === "Fail" ? "bg-red-500" : 
                          selectedTestCase?.status === "Blocked" ? "bg-orange-500" :
                          "bg-gray-500"} 
                        ${selectedTestCase?.status === "Pass" ? "" : "animate-pulse-subtle"}`}>
                      </span>
                      {selectedTestCase?.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Priority</h3>
                  <div className="mt-1">
                    <span className={`px-2 py-1.5 text-xs font-semibold rounded-full inline-flex items-center animate-transition
                      ${selectedTestCase?.priority === "High" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : 
                        selectedTestCase?.priority === "Medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}`}>
                      <span className={`w-2 h-2 rounded-full mr-1.5 
                        ${selectedTestCase?.priority === "High" ? "bg-red-500" : 
                          selectedTestCase?.priority === "Medium" ? "bg-yellow-500" :
                          "bg-green-500"}`}>
                      </span>
                      {selectedTestCase?.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Pre-Conditions</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedTestCase?.preConditions || "None specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Test Steps</h3>
                <pre className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap font-sans border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-800">{selectedTestCase?.testSteps}</pre>
              </div>

              <div>
                <h3 className="text-sm font-medium">Expected Result</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedTestCase?.expectedResult}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Actual Result</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedTestCase?.actualResult || "Not recorded"}</p>
              </div>

              {selectedTestCase?.comments && (
                <div>
                  <h3 className="text-sm font-medium">Comments</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedTestCase.comments}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEdit(selectedTestCase!);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleReportBug(selectedTestCase!);
                  }}
                >
                  Report Bug
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bug Report Dialog */}
        <Dialog open={bugFormOpen} onOpenChange={setBugFormOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] w-[95vw]">
            <DialogHeader>
              <DialogTitle>Report Bug</DialogTitle>
              <DialogDescription>
                Report a bug related to this test case
              </DialogDescription>
            </DialogHeader>
            <BugForm 
              projectId={Number(selectedProjectId)}
              testCase={selectedTestCase || undefined}
              modules={modules}
              onSuccess={() => setBugFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the test case "{selectedTestCase?.testCaseId} - {selectedTestCase?.feature}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteTestCaseMutation.isPending}
              >
                {deleteTestCaseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Test Case"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}