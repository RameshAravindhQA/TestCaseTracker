import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Trash2, Edit, Plus, Clock, CheckCircle, XCircle, Eye, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/auth';
import { MainLayout } from '@/components/layout/main-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';

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
  const [availableModules, setAvailableModules] = useState([]);
  const [availableTestCases, setAvailableTestCases] = useState([]);

  // Fetch projects with modules and test cases
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      console.log('Projects loaded:', data);
      return data;
    }
  });

    // Fetch modules when project changes
    useEffect(() => {
      if (selectedProject) {
        fetch(`/api/modules?projectId=${selectedProject}`)
          .then(res => res.json())
          .then(data => setAvailableModules(data))
          .catch(err => console.error('Failed to fetch modules:', err));
      } else {
        setAvailableModules([]);
      }
      setSelectedModule('');
    }, [selectedProject]);

    // Fetch test cases when module changes
    useEffect(() => {
      if (selectedModule) {
        fetch(`/api/test-cases?moduleId=${selectedModule}`)
          .then(res => res.json())
          .then(data => setAvailableTestCases(data))
          .catch(err => console.error('Failed to fetch test cases:', err));
      } else {
        setAvailableTestCases([]);
      }
    }, [selectedModule]);

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
  const availableTestCases1 = selectedModuleData?.testCases || [];

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

    const startRecording = () => {
      if (!selectedProject) {
        toast({
          title: "Error",
          description: "Please select a project first.",
          variant: "destructive"
        });
        return;
      }

      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: `Recording browser actions for project: ${projects.find(p => p.id.toString() === selectedProject)?.name || 'Unknown'}`
      });
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 ? (
                      <SelectItem value="no-projects" disabled>
                        No projects found. Please create a project first.
                      </SelectItem>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Module</label>
                <Select 
                  value={selectedModule} 
                  onValueChange={setSelectedModule}
                  disabled={!selectedProject}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModules.length === 0 ? (
                      <SelectItem value="no-modules" disabled>
                        No modules available
                      </SelectItem>
                    ) : (
                      availableModules.map((module) => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          {module.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Test Cases</label>
                <div className="mt-2 p-2 border rounded text-sm">
                  {availableTestCases.length === 0 ? (
                    <span className="text-gray-500">No test cases available</span>
                  ) : (
                    <span className="text-green-600">{availableTestCases.length} test cases available</span>
                  )}
                </div>
              </div>
            </div>
            <Button 
              onClick={startRecording}
              disabled={isRecording || !selectedProject}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
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