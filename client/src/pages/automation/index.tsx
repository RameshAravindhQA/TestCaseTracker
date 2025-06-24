
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Plus, Video, Play, Square, Download, Trash, Edit, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Project, Module, TestCase, AutomationScript } from "@/types";
import { ProjectSelect } from "@/components/ui/project-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecordingSession {
  id: string;
  testCaseId?: number;
  url: string;
  status: 'idle' | 'recording' | 'completed' | 'error';
  scriptContent?: string;
  startTime?: Date;
  endTime?: Date;
}

interface PlaybackSession {
  id: string;
  scriptId: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  results?: any;
  startTime?: Date;
  endTime?: Date;
}

export default function AutomationPage() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | number>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | number>("");
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | number>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<AutomationScript | null>(null);
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);
  const [playbackDialogOpen, setPlaybackDialogOpen] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [scriptName, setScriptName] = useState('');
  const [scriptDescription, setScriptDescription] = useState('');
  const [recordingSessions, setRecordingSessions] = useState<Map<string, RecordingSession>>(new Map());
  const [playbackSessions, setPlaybackSessions] = useState<Map<string, PlaybackSession>>(new Map());

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
      if (selectedModuleId && selectedModuleId !== "all" && typeof selectedModuleId === "number") {
        url += `?moduleId=${selectedModuleId}`;
      }
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Fetch automation scripts
  const { data: scripts, isLoading: isScriptsLoading, refetch: refetchScripts } = useQuery<AutomationScript[]>({
    queryKey: ["/api/automation/scripts", selectedProjectId],
    enabled: !!selectedProjectId,
  });

  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: async ({ url, testCaseId }: { url: string; testCaseId?: number }) => {
      const sessionId = `record-${Date.now()}`;
      
      const response = await apiRequest('POST', '/api/automation/record/start', {
        sessionId,
        url,
        testCaseId,
        engine: 'playwright'
      });
      
      return { sessionId, ...(await response.json()) };
    },
    onSuccess: (data) => {
      const session: RecordingSession = {
        id: data.sessionId,
        testCaseId: data.testCaseId,
        url: recordingUrl,
        status: 'recording',
        startTime: new Date()
      };
      
      setRecordingSessions(prev => new Map(prev.set(data.sessionId, session)));
      setRecordingDialogOpen(false);
      
      toast({
        title: 'Recording started',
        description: 'A new browser window has opened. Perform your test actions there.'
      });
      
      // Start polling for recording status
      pollRecordingStatus(data.sessionId);
    },
    onError: (error: any) => {
      toast({
        title: 'Recording failed',
        description: error.message || 'Failed to start recording',
        variant: 'destructive'
      });
    }
  });

  // Execute script mutation
  const executeScriptMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      const sessionId = `execute-${Date.now()}`;
      
      const response = await apiRequest('POST', `/api/automation/scripts/${scriptId}/execute`, {
        sessionId
      });
      
      return { sessionId, scriptId, ...(await response.json()) };
    },
    onSuccess: (data) => {
      const session: PlaybackSession = {
        id: data.sessionId,
        scriptId: data.scriptId,
        status: 'running',
        startTime: new Date()
      };
      
      setPlaybackSessions(prev => new Map(prev.set(data.sessionId, session)));
      
      toast({
        title: 'Test execution started',
        description: 'The automation script is now running.'
      });
      
      // Start polling for execution status
      pollPlaybackStatus(data.sessionId);
    },
    onError: (error: any) => {
      toast({
        title: 'Execution failed',
        description: error.message || 'Failed to execute script',
        variant: 'destructive'
      });
    }
  });

  // Save script mutation
  const saveScriptMutation = useMutation({
    mutationFn: async ({ name, description, scriptContent, testCaseId }: {
      name: string;
      description: string;
      scriptContent: string;
      testCaseId?: number;
    }) => {
      const response = await apiRequest('POST', '/api/automation/scripts', {
        name,
        description,
        scriptContent,
        type: 'playwright',
        projectId: selectedProjectId,
        testCaseId
      });
      
      return await response.json();
    },
    onSuccess: () => {
      refetchScripts();
      toast({
        title: 'Script saved',
        description: 'The automation script has been saved successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save script',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    }
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
      refetchScripts();
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

  const pollRecordingStatus = (sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/automation/record/status/${sessionId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
          clearInterval(interval);
          setRecordingSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
              session.status = 'completed';
              session.scriptContent = data.scriptContent;
              session.endTime = new Date();
              updated.set(sessionId, session);
            }
            return updated;
          });
          
          toast({
            title: 'Recording completed',
            description: 'Your test actions have been recorded successfully.'
          });
        } else if (data.status === 'error') {
          clearInterval(interval);
          setRecordingSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
              session.status = 'error';
              session.endTime = new Date();
              updated.set(sessionId, session);
            }
            return updated;
          });
          
          toast({
            title: 'Recording failed',
            description: data.error || 'An error occurred during recording',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error polling recording status:', error);
      }
    }, 2000);
  };

  const pollPlaybackStatus = (sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/automation/execute/status/${sessionId}`);
        const data = await response.json();
        
        if (data.status === 'completed' || data.status === 'error') {
          clearInterval(interval);
          setPlaybackSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
              session.status = data.status === 'error' ? 'error' : 'completed';
              session.results = data.results;
              session.endTime = new Date();
              updated.set(sessionId, session);
            }
            return updated;
          });
          
          toast({
            title: `Test ${data.status}`,
            description: data.status === 'completed' ? 
              'The test has completed successfully.' : 
              'The test failed. Check the results for details.',
            variant: data.status === 'completed' ? 'default' : 'destructive'
          });
        }
      } catch (error) {
        console.error('Error polling execution status:', error);
      }
    }, 2000);
  };

  const handleStartRecording = () => {
    if (!recordingUrl) {
      toast({
        title: 'URL required',
        description: 'Please enter a URL to start recording.',
        variant: 'destructive'
      });
      return;
    }

    startRecordingMutation.mutate({
      url: recordingUrl,
      testCaseId: selectedTestCaseId ? Number(selectedTestCaseId) : undefined
    });
  };

  const handlePlayScript = (script: AutomationScript) => {
    executeScriptMutation.mutate(script.id);
  };

  const handleSaveRecording = (sessionId: string) => {
    const session = recordingSessions.get(sessionId);
    if (!session || !session.scriptContent) {
      toast({
        title: 'No recording data',
        description: 'Cannot save script without recording data.',
        variant: 'destructive'
      });
      return;
    }

    if (!scriptName) {
      toast({
        title: 'Script name required',
        description: 'Please provide a name for the script.',
        variant: 'destructive'
      });
      return;
    }

    saveScriptMutation.mutate({
      name: scriptName,
      description: scriptDescription,
      scriptContent: session.scriptContent,
      testCaseId: session.testCaseId
    });
  };

  const handleDelete = (script: AutomationScript) => {
    setSelectedScript(script);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedScript) {
      deleteScriptMutation.mutate(selectedScript.id);
    }
  };

  const filteredTestCases = testCases?.filter(testCase => {
    if (!selectedModuleId || selectedModuleId === "all") return true;
    return testCase.moduleId === Number(selectedModuleId);
  }) || [];

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Automation</h1>
            <p className="mt-1 text-sm text-gray-600">Record, manage and execute automated test scripts</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setRecordingDialogOpen(true)} variant="outline" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Start Recording
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ProjectSelect
            projects={projects}
            isLoading={isProjectsLoading}
            selectedProjectId={selectedProjectId}
            onChange={(value) => {
              setSelectedProjectId(parseInt(value));
              setSelectedModuleId("");
              setSelectedTestCaseId("");
            }}
          />
          
          <Select
            value={selectedModuleId ? selectedModuleId.toString() : "all"}
            onValueChange={(value) => {
              setSelectedModuleId(value === "all" ? "all" : parseInt(value));
              setSelectedTestCaseId("");
            }}
            disabled={!selectedProjectId}
          >
            <SelectTrigger>
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules?.map((module) => (
                <SelectItem key={module.id} value={module.id.toString()}>
                  {module.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedTestCaseId ? selectedTestCaseId.toString() : "none"}
            onValueChange={(value) => setSelectedTestCaseId(value === "none" ? "" : parseInt(value))}
            disabled={!selectedProjectId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select test case (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific test case</SelectItem>
              {filteredTestCases?.map((testCase) => (
                <SelectItem key={testCase.id} value={testCase.id.toString()}>
                  {testCase.testCaseId} - {testCase.feature}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="scripts" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="recordings">Active Recordings</TabsTrigger>
            <TabsTrigger value="executions">Active Executions</TabsTrigger>
          </TabsList>

          <TabsContent value="scripts">
            <Card>
              <CardHeader>
                <CardTitle>Automation Scripts</CardTitle>
              </CardHeader>
              <CardContent>
                {isScriptsLoading ? (
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </div>
                ) : scripts?.length === 0 ? (
                  <p className="text-center text-gray-500">No automation scripts found. Start by recording a new script.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="p-3 text-left">Name</th>
                          <th className="p-3 text-left">Type</th>
                          <th className="p-3 text-left">Test Case</th>
                          <th className="p-3 text-left">Status</th>
                          <th className="p-3 text-left">Last Run</th>
                          <th className="p-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scripts?.map((script) => (
                          <tr key={script.id} className="border-b">
                            <td className="p-3">{script.name}</td>
                            <td className="p-3">{script.type}</td>
                            <td className="p-3">
                              {script.testCaseId ? 
                                testCases?.find(tc => tc.id === script.testCaseId)?.testCaseId || 'Unknown' 
                                : 'General'
                              }
                            </td>
                            <td className="p-3">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                script.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {script.status}
                              </div>
                            </td>
                            <td className="p-3">{script.lastRunDate ? new Date(script.lastRunDate).toLocaleString() : 'Never'}</td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handlePlayScript(script)}
                                  className="h-8 w-8"
                                  title="Execute Script"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDelete(script)}>
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recordings">
            <Card>
              <CardHeader>
                <CardTitle>Active Recording Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {recordingSessions.size === 0 ? (
                  <p className="text-center text-gray-500">No active recording sessions.</p>
                ) : (
                  <div className="space-y-4">
                    {Array.from(recordingSessions.entries()).map(([sessionId, session]) => (
                      <div key={sessionId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Recording Session</h4>
                            <p className="text-sm text-gray-600">URL: {session.url}</p>
                            <p className="text-sm text-gray-600">Status: {session.status}</p>
                          </div>
                          <div className="flex gap-2">
                            {session.status === 'completed' && (
                              <>
                                <Input
                                  placeholder="Script name"
                                  value={scriptName}
                                  onChange={(e) => setScriptName(e.target.value)}
                                  className="w-40"
                                />
                                <Button
                                  onClick={() => handleSaveRecording(sessionId)}
                                  disabled={saveScriptMutation.isPending}
                                  size="sm"
                                >
                                  {saveScriptMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Save Script"
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="executions">
            <Card>
              <CardHeader>
                <CardTitle>Active Execution Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {playbackSessions.size === 0 ? (
                  <p className="text-center text-gray-500">No active execution sessions.</p>
                ) : (
                  <div className="space-y-4">
                    {Array.from(playbackSessions.entries()).map(([sessionId, session]) => (
                      <div key={sessionId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Execution Session</h4>
                            <p className="text-sm text-gray-600">Script ID: {session.scriptId}</p>
                            <p className="text-sm text-gray-600">Status: {session.status}</p>
                            {session.results && (
                              <p className="text-sm text-gray-600">
                                Duration: {session.results.duration || 'N/A'}ms
                              </p>
                            )}
                          </div>
                          {session.status === 'running' && (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recording Dialog */}
        <Dialog open={recordingDialogOpen} onOpenChange={setRecordingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Browser Recording</DialogTitle>
              <DialogDescription>
                Enter the URL where you want to start recording your browser interactions. 
                This will create an automated test script based on your actions.
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
              <Button onClick={handleStartRecording} disabled={startRecordingMutation.isPending}>
                {startRecordingMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</>
                ) : (
                  <><Video className="mr-2 h-4 w-4" /> Start Recording</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
      </div>
    </MainLayout>
  );
}
