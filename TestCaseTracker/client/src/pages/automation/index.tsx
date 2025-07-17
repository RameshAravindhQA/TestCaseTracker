import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Trash2, Edit, Plus, Clock, CheckCircle, XCircle, Eye, Download, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/auth';
import { MainLayout } from '@/components/layout/main-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

interface Recording {
  filename: string;
  createdAt: string;
  size: number;
}

interface RecordingSession {
  sessionId: string;
  status: 'starting' | 'recording' | 'stopped' | 'error';
  filename: string;
  startTime: string;
}

export default function AutomationPage() {
  const [url, setUrl] = useState('');
  const [projectId, setProjectId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [testCaseId, setTestCaseId] = useState('');
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<string>('');
  const [recordingContent, setRecordingContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession && currentSession.status === 'recording') {
      interval = setInterval(() => {
        checkRecordingStatus(currentSession.sessionId);
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession]);

  const loadRecordings = async () => {
    try {
      const response = await fetch('/api/automation/recordings');
      if (response.ok) {
        const data = await response.json();
        setRecordings(data);
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const startRecording = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL to record",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/automation/start-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          projectId: projectId || undefined,
          moduleId: moduleId || undefined,
          testCaseId: testCaseId || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSession({
          sessionId: data.sessionId,
          status: 'recording',
          filename: data.filename,
          startTime: new Date().toISOString()
        });

        toast({
          title: "Recording Started",
          description: "Playwright browser opened. Start interacting with the page.",
        });
      } else {
        throw new Error(data.message || 'Failed to start recording');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || 'Failed to start recording',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording1 = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/automation/stop-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSession(null);
        loadRecordings();

        toast({
          title: "Recording Stopped",
          description: `Test script saved as ${data.filename}`,
        });
      } else {
        throw new Error(data.message || 'Failed to stop recording');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || 'Failed to stop recording',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkRecordingStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/automation/recording-status/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentSession(prev => prev ? { ...prev, status: data.status } : null);

        if (data.status === 'stopped' || data.status === 'error') {
          loadRecordings();
          if (data.status === 'error') {
            toast({
              title: "Recording Error",
              description: "Recording process encountered an error",
              variant: "destructive"
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to check recording status:', error);
    }
  };

  const viewRecording = async (filename: string) => {
    try {
      const response = await fetch(`/api/automation/recordings/${filename}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRecording(filename);
        setRecordingContent(data.content);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load recording content",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recording':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'stopped':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      recording: 'default',
      stopped: 'secondary',
      error: 'destructive',
      starting: 'outline'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

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

    const stopRecording = () => {
      if (!currentSession) return;

      setIsLoading(true);
      stopRecording1();
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
          <CardTitle>Test Automation - Playwright Recording</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="url">Target URL *</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={!!currentSession}
              />
            </div>
            <div>
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Optional"
                disabled={!!currentSession}
              />
            </div>
            <div>
              <Label htmlFor="moduleId">Module ID</Label>
              <Input
                id="moduleId"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                placeholder="Optional"
                disabled={!!currentSession}
              />
            </div>
            <div>
              <Label htmlFor="testCaseId">Test Case ID</Label>
              <Input
                id="testCaseId"
                value={testCaseId}
                onChange={(e) => setTestCaseId(e.target.value)}
                placeholder="Optional"
                disabled={!!currentSession}
              />
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {!currentSession ? (
              <Button
                onClick={startRecording}
                disabled={isLoading || !url}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                disabled={isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Recording
              </Button>
            )}

            {currentSession && (
              <div className="flex items-center gap-2">
                {getStatusBadge(currentSession.status)}
                <span className="text-sm text-muted-foreground">
                  {currentSession.filename}
                </span>
              </div>
            )}
          </div>

          {currentSession && currentSession.status === 'recording' && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800">
                <strong>Recording in progress:</strong> A Playwright browser window should have opened. 
                Interact with the page to record your test steps. Click "Stop Recording" when finished.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recorded Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {recordings.length === 0 ? (
            <p className="text-muted-foreground">No recordings found. Start recording to create test scripts.</p>
          ) : (
            <div className="space-y-2">
              {recordings.map((recording) => (
                <div
                  key={recording.filename}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{recording.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(recording.createdAt).toLocaleString()} • {Math.round(recording.size / 1024)}KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewRecording(recording.filename)}
                  >
                    View Code
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRecording && recordingContent && (
        <Card>
          <CardHeader>
            <CardTitle>Recording Content - {selectedRecording}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={recordingContent}
              readOnly
              className="font-mono text-sm h-96"
            />
          </CardContent>
        </Card>
      )}
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