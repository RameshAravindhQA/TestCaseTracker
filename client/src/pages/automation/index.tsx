import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Plus, Video, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, Module, AutomationScript } from "@/types";
import { ProjectSelect } from "@/components/ui/project-select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleTable } from "@/components/modules/module-table";
import { TestCaseTable } from "@/components/test-cases/test-case-table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { Loader2 } from "lucide-react";


export default function AutomationPage() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | number>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | number>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<AutomationScript | null>(null);
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingInfo, setRecordingInfo] = useState<{
    testCaseId: number;
    testCaseName: string;
  } | null>(null);

  const handleStartRecording = (testCase: TestCase) => {
    setRecordingInfo({
      testCaseId: testCase.id,
      testCaseName: testCase.testCaseId
    });
    setRecordingDialogOpen(true);
  };

  const handlePlayScript = async (script: AutomationScript) => {
    try {
      const response = await apiRequest('POST', `/api/automation/scripts/${script.id}/execute`);
      if (response.ok) {
        toast({
          title: 'Script execution started',
          description: 'The test script is now running'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute script',
        variant: 'destructive'
      });
    }
  };

  const startRecording = async () => {
    if (!selectedScript) return;

    setRecordingDialogOpen(true);
  };

  const beginRecording = async () => {
    if (!recordingUrl || (!selectedScript && !recordingInfo)) return;

    setIsRecording(true);
    try {
      const response = await apiRequest('POST', `/api/automation/record/start`, {
        scriptId: selectedScript?.id,
        testCaseId: recordingInfo?.testCaseId,
        url: recordingUrl,
        windowState: 'maximized',
        engine: 'playwright'
      });

      if (response.ok) {
        setRecordingDialogOpen(false);
        // Open a new maximized window with the recording URL
        const width = window.screen.width;
        const height = window.screen.height;
        const windowFeatures = `width=${width},height=${height},left=0,top=0,toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes`;
        window.open(recordingUrl, '_blank', windowFeatures);

        toast({
          title: 'Recording started',
          description: 'Recording your actions in the new browser window'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start recording',
        variant: 'destructive'
      });
      setIsRecording(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState(""); 
  const [statusFilter, setStatusFilter] = useState("all"); 


  // Fetch projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch modules for selected project
  const { data: modules, isLoading: isModulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/projects/${selectedProjectId}/modules`],
    enabled: !!selectedProjectId,
  });

  // Fetch automation scripts
  const { data: scripts, isLoading: isScriptsLoading } = useQuery<AutomationScript[]>({
    queryKey: ["/api/automation/scripts", selectedProjectId],
    enabled: !!selectedProjectId,
  });

  // Delete script mutation
  const deleteScriptMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      const res = await apiRequest("DELETE", `/api/automation/scripts/${scriptId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Script deleted",
        description: "Automation script has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/automation/scripts", selectedProjectId] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete script: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (script: AutomationScript) => {
    setSelectedScript(script);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedScript) {
      deleteScriptMutation.mutate(selectedScript.id);
    }
  };

  // Fetch test cases for selected project/module
  const { data: testCases, isLoading: isTestCasesLoading } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${selectedProjectId}/test-cases`, { moduleId: selectedModuleId }],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      let url = `/api/projects/${selectedProjectId}/test-cases`;
      if (selectedModuleId && selectedModuleId !== "all" && typeof selectedModuleId === "number") {
        url += `?moduleId=${selectedModuleId}`;
      }
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Filter test cases based on search query and status
  const filteredTestCases = testCases?.filter(testCase => {
    const matchesSearch = 
      testCase.testCaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testCase.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testCase.testObjective.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || testCase.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  interface TestCase {
    testCaseId: string;
    feature: string;
    testObjective: string;
    status: string;
    // Add other properties as needed
  }


  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Automation</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your test automation scripts</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => {}} variant="outline" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Start Recording
            </Button>
            <Button onClick={() => {}} variant="outline" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Play Recording
            </Button>
            <Button onClick={() => {}} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Script
            </Button>
          </div>
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
        </div>

        <Tabs defaultValue="scripts" className="mt-6">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
          </TabsList>

          <TabsContent value="scripts">
            <Card>
              <CardContent className="p-6">
                {isScriptsLoading ? (
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </div>
                ) : scripts?.length === 0 ? (
                  <p className="text-center">No automation scripts found.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Last Run</th>
                        <th className="p-3 text-left">Duration</th>
                        <th className="p-3 text-left">Scripts</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scripts?.map((script) => (
                        <tr key={script.id} className="border-b">
                          <td className="p-3">{script.name}</td>
                          <td className="p-3">{script.type}</td>
                          <td className="p-3">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              script.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {script.status}
                            </div>
                          </td>
                          <td className="p-3">{script.lastRunDate ? new Date(script.lastRunDate).toLocaleString() : '-'}</td>
                          <td className="p-3">{script.lastRunDuration ? `${script.lastRunDuration}s` : '-'}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleStartRecording(script)}
                                className="h-8 w-8"
                              >
                                <Video className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePlayScript(script)}
                                className="h-8 w-8"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDelete(script)}>
                                  <Trash className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules">
            {modules && (
              <ModuleTable
                modules={modules}
                projectId={Number(selectedProjectId)}
                onEdit={() => {}}
                onDelete={() => {}}
                onViewTestCases={() => {}}
              />
            )}
          </TabsContent>

          <TabsContent value="testcases">
            {selectedProjectId && (
              <TestCaseTable
                testCases={filteredTestCases} 
                onEdit={() => {}}
                onDelete={() => {}}
                onView={() => {}}
                onReportBug={() => {}}
                isLoading={isTestCasesLoading} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                statusFilter={statusFilter} 
                setStatusFilter={setStatusFilter}
                onStartRecording={(testCase) => {
                  setSelectedScript(null);
                  setRecordingDialogOpen(true);
                  // Store test case info for recording
                  setRecordingInfo({
                    testCaseId: testCase.id,
                    testCaseName: testCase.testCaseId
                  });
                }}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the automation script "{selectedScript?.name}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteScriptMutation.isPending}
              >
                {deleteScriptMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Script"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Recording Dialog */}
        <Dialog open={recordingDialogOpen} onOpenChange={setRecordingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Browser Automation Recording</DialogTitle>
              <DialogDescription>
                Enter the URL where you want to start recording your browser interactions. This will create an automated test script based on your actions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setRecordingDialogOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={beginRecording} disabled={isRecording}>
                {isRecording ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...</>
                ) : (
                  <><Video className="mr-2 h-4 w-4" /> Start Recording</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}