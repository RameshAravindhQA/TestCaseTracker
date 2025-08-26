
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Eye, Download, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  testCaseCount: number;
}

interface TestCase {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  hasScript: boolean;
  scriptFile?: string;
}

interface RecordingSession {
  sessionId: string;
  status: 'recording' | 'stopped' | 'error';
  testCaseId: string;
}

interface ExecutionResult {
  id: string;
  testCaseId: string;
  status: 'running' | 'completed' | 'failed';
  steps: Array<{
    step: string;
    status: 'passed' | 'failed' | 'skipped';
    error?: string;
    screenshot?: string;
  }>;
  report: string;
}

export default function AutomationPage() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedTestCase, setSelectedTestCase] = useState<string>('');
  const [recordingUrl, setRecordingUrl] = useState<string>('');
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState<boolean>(false);
  const [currentRecording, setCurrentRecording] = useState<RecordingSession | null>(null);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const { toast } = useToast();

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Fetch modules for selected project
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['modules', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/modules?projectId=${selectedProject}`);
      if (!response.ok) throw new Error('Failed to fetch modules');
      return response.json();
    },
    enabled: !!selectedProject
  });

  // Fetch test cases for selected module
  const { data: testCases = [], isLoading: testCasesLoading } = useQuery({
    queryKey: ['test-cases', selectedModule],
    queryFn: async () => {
      if (!selectedModule) return [];
      const response = await fetch(`/api/test-cases?moduleId=${selectedModule}`);
      if (!response.ok) throw new Error('Failed to fetch test cases');
      // Add mock script status for demonstration
      const cases = await response.json();
      return cases.map((tc: any) => ({
        ...tc,
        hasScript: Math.random() > 0.5, // Mock script availability
        scriptFile: Math.random() > 0.5 ? `${tc.id}_script.spec.js` : undefined
      }));
    },
    enabled: !!selectedModule
  });

  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: async (data: { testCaseId: string; url: string }) => {
      const response = await fetch('/api/automation/start-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          url: data.url,
          projectId: selectedProject,
          moduleId: selectedModule,
          testCaseId: data.testCaseId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start recording');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCurrentRecording({
        sessionId: data.sessionId,
        status: 'recording',
        testCaseId: selectedTestCase
      });
      setIsRecordingDialogOpen(false);
      toast({
        title: 'Recording Started',
        description: 'Playwright browser opened. Interact with the page to record your test steps.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Recording Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Stop recording mutation
  const stopRecordingMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch('/api/automation/stop-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to stop recording');
      }

      return response.json();
    },
    onSuccess: () => {
      setCurrentRecording(null);
      toast({
        title: 'Recording Stopped',
        description: 'Test script has been generated and saved.',
      });
      // Refetch test cases to update script status
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: 'Stop Recording Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Execute test mutation
  const executeTestMutation = useMutation({
    mutationFn: async (testCaseId: string) => {
      const testCase = testCases.find(tc => tc.id === testCaseId);
      if (!testCase?.scriptFile) {
        throw new Error('No script file found for this test case');
      }

      const response = await fetch('/api/automation/execute-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          filename: testCase.scriptFile,
          testCaseId: testCaseId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute test');
      }

      return response.json();
    },
    onSuccess: (data, testCaseId) => {
      toast({
        title: 'Test Execution Started',
        description: 'Your test is now running. Results will appear below.',
      });

      // Mock execution result for demonstration
      setTimeout(() => {
        const mockResult: ExecutionResult = {
          id: `exec_${Date.now()}`,
          testCaseId,
          status: Math.random() > 0.3 ? 'completed' : 'failed',
          steps: [
            {
              step: 'Navigate to URL',
              status: 'passed'
            },
            {
              step: 'Click login button',
              status: 'passed'
            },
            {
              step: 'Fill username field',
              status: Math.random() > 0.2 ? 'passed' : 'failed',
              error: Math.random() > 0.2 ? undefined : 'Element not found: input[name="username"]'
            },
            {
              step: 'Submit form',
              status: 'passed'
            }
          ],
          report: 'Test execution completed with 3/4 steps passed successfully.'
        };

        setExecutionResults(prev => [...prev, mockResult]);

        toast({
          title: mockResult.status === 'completed' ? 'Test Passed' : 'Test Failed',
          description: mockResult.report,
          variant: mockResult.status === 'completed' ? 'default' : 'destructive'
        });
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: 'Execution Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleStartRecording = () => {
    if (!recordingUrl) {
      toast({
        title: 'URL Required',
        description: 'Please enter a valid URL to start recording.',
        variant: 'destructive',
      });
      return;
    }

    try {
      new URL(recordingUrl);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL (e.g., https://example.com).',
        variant: 'destructive',
      });
      return;
    }

    startRecordingMutation.mutate({
      testCaseId: selectedTestCase,
      url: recordingUrl
    });
  };

  const handleStopRecording = () => {
    if (currentRecording) {
      stopRecordingMutation.mutate(currentRecording.sessionId);
    }
  };

  const getExecutionResultsForTestCase = (testCaseId: string) => {
    return executionResults.filter(result => result.testCaseId === testCaseId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Reset selections when project changes
  useEffect(() => {
    setSelectedModule('');
    setSelectedTestCase('');
  }, [selectedProject]);

  // Reset test case selection when module changes
  useEffect(() => {
    setSelectedTestCase('');
  }, [selectedModule]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test Automation</h1>
            <p className="text-muted-foreground">Record and execute automated test scripts</p>
          </div>
        </div>

        {/* Step 1: Project Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-md">
              <Label htmlFor="project-select">Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
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
          </CardContent>
        </Card>

        {/* Step 2: Module List */}
        {selectedProject && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Available Modules</CardTitle>
            </CardHeader>
            <CardContent>
              {modulesLoading ? (
                <div>Loading modules...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Test Cases</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((module: Module) => (
                      <TableRow
                        key={module.id}
                        className={selectedModule === module.id ? "bg-blue-50" : "cursor-pointer hover:bg-gray-50"}
                        onClick={() => setSelectedModule(module.id)}
                      >
                        <TableCell className="font-medium">{module.name}</TableCell>
                        <TableCell>{module.description}</TableCell>
                        <TableCell>{module.testCaseCount || 0}</TableCell>
                        <TableCell>
                          <Button
                            variant={selectedModule === module.id ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModule(module.id);
                            }}
                          >
                            {selectedModule === module.id ? "Selected" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Test Cases with Record/Play */}
        {selectedModule && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              {testCasesLoading ? (
                <div>Loading test cases...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Case</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Script File</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testCases.map((testCase: TestCase) => (
                      <TableRow key={testCase.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{testCase.title}</div>
                            <div className="text-sm text-gray-500">{testCase.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={testCase.priority === 'High' ? 'destructive' : 'secondary'}>
                            {testCase.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{testCase.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {testCase.hasScript ? (
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              <span className="text-sm font-mono">{testCase.scriptFile}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No script</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Record Button */}
                            <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={currentRecording?.testCaseId === testCase.id}
                                  onClick={() => setSelectedTestCase(testCase.id)}
                                >
                                  {currentRecording?.testCaseId === testCase.id ? (
                                    <>
                                      <Square className="h-4 w-4 mr-1" />
                                      Recording...
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-4 h-4 rounded-full bg-red-500 mr-1" />
                                      Record
                                    </>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Start Recording - {testCase.title}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="recording-url">Website URL</Label>
                                    <Input
                                      id="recording-url"
                                      type="url"
                                      placeholder="https://example.com"
                                      value={recordingUrl}
                                      onChange={(e) => setRecordingUrl(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsRecordingDialogOpen(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleStartRecording}
                                      disabled={startRecordingMutation.isPending}
                                    >
                                      Start Recording
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Stop Recording Button */}
                            {currentRecording?.testCaseId === testCase.id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleStopRecording}
                                disabled={stopRecordingMutation.isPending}
                              >
                                <Square className="h-4 w-4 mr-1" />
                                Stop
                              </Button>
                            )}

                            {/* Play Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!testCase.hasScript || executeTestMutation.isPending}
                              onClick={() => executeTestMutation.mutate(testCase.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Play
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Execution Reports */}
        {executionResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Execution Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executionResults.map((result) => {
                  const testCase = testCases.find(tc => tc.id === result.testCaseId);
                  return (
                    <Card key={result.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {testCase?.title}
                          <Badge 
                            variant={result.status === 'completed' ? 'default' : 'destructive'}
                            className={result.status === 'completed' ? 'bg-green-500' : ''}
                          >
                            {result.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold mb-2">Step-by-Step Results:</h4>
                            <div className="space-y-2">
                              {result.steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                  {getStatusIcon(step.status)}
                                  <span className="flex-1">{step.step}</span>
                                  {step.error && (
                                    <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
                                      {step.error}
                                    </span>
                                  )}
                                  {step.screenshot && (
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Summary:</h4>
                            <p className="text-sm text-gray-600">{result.report}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
