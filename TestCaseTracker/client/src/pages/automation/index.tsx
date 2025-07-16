import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Play, Square, FileText, Download, Upload, Eye, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AutomationScript {
  id: string;
  name: string;
  description: string;
  projectId: string;
  moduleId: string;
  testCaseIds: string[];
  script: string;
  status: 'draft' | 'ready' | 'running' | 'completed' | 'failed';
  lastRun?: Date;
  results?: {
    success: boolean;
    steps: Array<{
      step: string;
      status: 'passed' | 'failed' | 'skipped';
      screenshot?: string;
      timestamp: Date;
    }>;
    report: string;
  };
}

interface Project {
  id: string;
  name: string;
  modules: Array<{
    id: string;
    name: string;
    testCases: Array<{
      id: string;
      title: string;
      description: string;
    }>;
  }>;
}

export default function AutomationPage() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingScript, setRecordingScript] = useState<string>('');
  const [editingScript, setEditingScript] = useState<AutomationScript | null>(null);

  // Fetch projects with modules and test cases
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/automation'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects/automation');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Fetch automation scripts
  const { data: scripts = [], isLoading: isScriptsLoading, refetch: refetchScripts } = useQuery<AutomationScript[]>({
    queryKey: ['/api/automation/scripts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/automation/scripts');
      if (!response.ok) throw new Error('Failed to fetch scripts');
      return response.json();
    }
  });

  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: async (data: { projectId: string; moduleId: string; testCaseIds: string[] }) => {
      const response = await apiRequest('POST', '/api/automation/start-recording', data);
      if (!response.ok) throw new Error('Failed to start recording');
      return response.json();
    },
    onSuccess: (data) => {
      setIsRecording(true);
      setRecordingScript(data.sessionId);
      toast({
        title: 'Recording Started',
        description: 'Browser opened for recording. Close the browser to stop recording.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to start recording: ${error}`,
        variant: 'destructive',
      });
    }
  });

  // Stop recording mutation
  const stopRecordingMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('POST', '/api/automation/stop-recording', { sessionId });
      if (!response.ok) throw new Error('Failed to stop recording');
      return response.json();
    },
    onSuccess: (data) => {
      setIsRecording(false);
      setRecordingScript('');
      toast({
        title: 'Recording Stopped',
        description: 'Script generated and saved successfully.',
      });
      refetchScripts();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to stop recording: ${error}`,
        variant: 'destructive',
      });
    }
  });

  // Execute script mutation
  const executeScriptMutation = useMutation({
    mutationFn: async (scriptId: string) => {
      const response = await apiRequest('POST', `/api/automation/execute/${scriptId}`);
      if (!response.ok) throw new Error('Failed to execute script');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Script Execution Started',
        description: 'The automation script is now running.',
      });
      refetchScripts();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to execute script: ${error}`,
        variant: 'destructive',
      });
    }
  });

  // Delete script mutation
  const deleteScriptMutation = useMutation({
    mutationFn: async (scriptId: string) => {
      const response = await apiRequest('DELETE', `/api/automation/scripts/${scriptId}`);
      if (!response.ok) throw new Error('Failed to delete script');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Script Deleted',
        description: 'The automation script has been deleted.',
      });
      refetchScripts();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete script: ${error}`,
        variant: 'destructive',
      });
    }
  });

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const selectedModuleData = selectedProjectData?.modules.find(m => m.id === selectedModule);
  const availableTestCases = selectedModuleData?.testCases || [];

  const handleStartRecording = () => {
    if (!selectedProject || !selectedModule || selectedTestCases.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select a project, module, and at least one test case.',
        variant: 'destructive',
      });
      return;
    }

    startRecordingMutation.mutate({
      projectId: selectedProject,
      moduleId: selectedModule,
      testCaseIds: selectedTestCases
    });
  };

  const handleStopRecording = () => {
    if (recordingScript) {
      stopRecordingMutation.mutate(recordingScript);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-yellow-500';
      case 'ready': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test Automation</h1>
            <p className="text-muted-foreground">Record, manage, and execute automated test scripts</p>
          </div>
        </div>

        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="record">Record Script</TabsTrigger>
            <TabsTrigger value="scripts">Manage Scripts</TabsTrigger>
            <TabsTrigger value="reports">Execution Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Record New Automation Script</CardTitle>
                <CardDescription>
                  Select project, module, and test cases to record automated interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Project</Label>
                    <Select value={selectedProject?.toString()} onValueChange={(value) => setSelectedProject(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select project to automate" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="module">Module</Label>
                    <Select value={selectedModule} onValueChange={setSelectedModule} disabled={!selectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProjectData?.modules.map(module => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Test Cases</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                    {availableTestCases.map(testCase => (
                      <div key={testCase.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={testCase.id}
                          checked={selectedTestCases.includes(testCase.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTestCases([...selectedTestCases, testCase.id]);
                            } else {
                              setSelectedTestCases(selectedTestCases.filter(id => id !== testCase.id));
                            }
                          }}
                        />
                        <Label htmlFor={testCase.id} className="text-sm">
                          {testCase.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button onClick={handleStartRecording} className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button onClick={handleStopRecording} variant="destructive" className="flex items-center gap-2">
                      <Square className="w-4 h-4" />
                      Stop Recording
                    </Button>
                  )}
                </div>

                {isRecording && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                      Recording in progress... Perform your test actions in the opened browser.
                      Close the browser window to stop recording and save the script.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scripts" className="space-y-4">
            <div className="grid gap-4">
              {scripts.map(script => (
                <Card key={script.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {script.name}
                        <Badge className={getStatusColor(script.status)}>
                          {script.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{script.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeScriptMutation.mutate(script.id)}
                        disabled={script.status === 'running'}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Script Details: {script.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Script Code</Label>
                              <Textarea
                                value={script.script}
                                readOnly
                                className="min-h-[300px] font-mono text-sm"
                              />
                            </div>
                            <div>
                              <Label>Test Cases</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {script.testCaseIds.map(id => (
                                  <Badge key={id} variant="secondary">{id}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteScriptMutation.mutate(script.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4">
              {scripts.filter(script => script.results).map(script => (
                <Card key={script.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {script.name}
                      <Badge className={script.results?.success ? 'bg-green-500' : 'bg-red-500'}>
                        {script.results?.success ? 'Passed' : 'Failed'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Last run: {script.lastRun ? new Date(script.lastRun).toLocaleString() : 'Never'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Natural Language Report</Label>
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm">{script.results?.report}</p>
                        </div>
                      </div>
                      <div>
                        <Label>Step-by-Step Results</Label>
                        <div className="mt-2 space-y-2">
                          {script.results?.steps.map((step, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <Badge className={step.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}>
                                {step.status}
                              </Badge>
                              <span className="text-sm">{step.step}</span>
                              {step.screenshot && (
                                <Button size="sm" variant="outline">
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}