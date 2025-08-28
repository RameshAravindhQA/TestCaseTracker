import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Eye, Download, Search, CheckCircle, XCircle, AlertCircle, Loader2, Video, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
  testCaseId: string; // Assuming this is the unique identifier for a test case
  feature: string; // Assuming this is a field for test case feature
}

interface RecordingSession {
  id: string; // Unique identifier for the recording session
  status: 'recording' | 'stopped' | 'error';
  testCaseId: number; // Link to the test case being recorded
  startTime: string; // Timestamp of when recording started
  filename?: string; // Name of the generated script file
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
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const { toast } = useToast();

  // Health check function
  const checkAutomationHealth = async () => {
    try {
      console.log('🏥 Checking automation service health...');
      const response = await fetch('/api/automation/health');
      const health = await response.json();
      console.log('🏥 Health check result:', health);
      setHealthStatus(health);
      
      if (health.details?.playwright?.includes('available')) {
        toast({
          title: 'Service Healthy',
          description: 'Automation service and Playwright are working correctly.',
        });
      } else {
        toast({
          title: 'Service Issues Detected',
          description: health.details?.playwright || 'Unknown issue',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      toast({
        title: 'Health Check Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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

      try {
        const response = await fetch(`/api/projects/${selectedProject}/modules`);
        if (!response.ok) throw new Error('Failed to fetch modules');

        const modulesData = await response.json();
        console.log('Fetched modules for automation:', modulesData);

        // Fetch test case counts for each module
        const modulesWithCounts = await Promise.all(
          modulesData.map(async (module: any) => {
            try {
              const testCasesResponse = await fetch(`/api/projects/${selectedProject}/test-cases?moduleId=${module.id}`);
              if (testCasesResponse.ok) {
                const testCases = await testCasesResponse.json();
                return { ...module, testCaseCount: testCases.length };
              }
              return { ...module, testCaseCount: 0 };
            } catch (error) {
              console.error(`Error fetching test case count for module ${module.id}:`, error);
              return { ...module, testCaseCount: 0 };
            }
          })
        );

        return modulesWithCounts;
      } catch (error) {
        console.error('Error fetching modules:', error);
        throw error;
      }
    },
    enabled: !!selectedProject
  });

  // Fetch test cases for selected module
  const testCasesQuery = useQuery({
    queryKey: ['test-cases', selectedProject, selectedModule],
    queryFn: async () => {
      if (!selectedModule || !selectedProject) return [];

      try {
        const response = await fetch(`/api/projects/${selectedProject}/test-cases?moduleId=${selectedModule}`);
        if (!response.ok) {
          console.error('Failed to fetch test cases:', response.status, response.statusText);
          throw new Error('Failed to fetch test cases');
        }

        const cases = await response.json();
        console.log('Fetched test cases for automation:', cases.length, cases);

        // Add mock script status for demonstration
        return cases.map((tc: any) => ({
          ...tc,
          hasScript: Math.random() > 0.5, // Mock script availability
          scriptFile: Math.random() > 0.5 ? `${tc.id}_script.spec.js` : undefined
        }));
      } catch (error) {
        console.error('Error fetching test cases:', error);
        throw error;
      }
    },
    enabled: !!selectedModule && !!selectedProject
  });
  const testCases = testCasesQuery.data || [];


  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: async ({ testCaseId, url }: { testCaseId: string; url: string }) => {
      console.log('🎬 Starting recording for test case:', testCaseId, 'URL:', url);
      
      const testCase = testCases.find(tc => tc.id === parseInt(testCaseId));
      if (!testCase) {
        console.error('❌ Test case not found:', testCaseId);
        throw new Error('Test case not found');
      }

      console.log('📋 Test case found:', testCase.testCaseId, testCase.feature);

      try {
        console.log('📡 Sending recording request...');
        const response = await fetch('/api/automation/start-recording', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            url,
            projectId: selectedProject,
            moduleId: selectedModule,
            testCaseId: parseInt(testCaseId),
          })
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const error = await response.json();
          console.error('❌ Recording request failed:', error);
          throw new Error(error.message || `Failed to start recording (${response.status})`);
        }

        const result = await response.json();
        console.log('✅ Recording request successful:', result);
        return result;
      } catch (fetchError: any) {
        console.error('❌ Network error during recording request:', fetchError);
        throw fetchError;
      }
    },
    onSuccess: (data, { testCaseId }) => {
      toast({
        title: 'Recording Started',
        description: 'Playwright codegen has been launched. Perform your test actions in the browser.',
      });

      // Start polling for recording status
      const recordingId = data.recordingId;
      setCurrentRecording({
        id: recordingId,
        testCaseId: parseInt(testCaseId),
        status: 'recording',
        startTime: new Date().toISOString(),
      });

      // Poll for completion (in real implementation, this would be WebSocket)
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/automation/session/${recordingId}`);
          if (statusResponse.ok) {
            const session = await statusResponse.json();
            if (session.data.status === 'stopped') {
              clearInterval(pollInterval);
              setCurrentRecording(null);
              toast({
                title: 'Recording Completed',
                description: `Test script saved as ${session.data.filename}`,
              });
              // Refetch test cases to update script status
              testCasesQuery.refetch();
            }
          }
        } catch (error) {
          console.error('Error polling recording status:', error);
        }
      }, 2000);

      // Cleanup after 10 minutes
      setTimeout(() => clearInterval(pollInterval), 600000);
    },
    onError: (error: any) => {
      console.error('🚫 Recording mutation error:', error);
      
      let errorMessage = error.message || 'Unknown error occurred';
      let errorTitle = 'Recording Failed';
      
      // Provide specific help for common issues
      if (errorMessage.includes('Playwright is not installed')) {
        errorTitle = 'Playwright Not Installed';
        errorMessage = 'Playwright needs to be installed on the server. Please contact your administrator.';
      } else if (errorMessage.includes('valid URL')) {
        errorTitle = 'Invalid URL';
        errorMessage = 'Please provide a valid URL starting with http:// or https://';
      } else if (errorMessage.includes('not configured')) {
        errorTitle = 'Configuration Error';
        errorMessage = 'Test automation is not properly configured. Please contact your administrator.';
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Handle recording start
  const handleStartRecording = (testCaseId: string) => {
    setIsRecordingDialogOpen(true);
    setSelectedTestCase(testCaseId);
  };

  // Handle URL submission for recording
  const handleRecordingSubmit = () => {
    if (!recordingUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a valid URL to start recording',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedTestCase) {
      toast({
        title: 'No Test Case Selected',
        description: 'Please select a test case first',
        variant: 'destructive',
      });
      return;
    }

    startRecordingMutation.mutate({
      testCaseId: selectedTestCase,
      url: recordingUrl.trim()
    });

    setIsRecordingDialogOpen(false);
    setRecordingUrl('');
  };

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
      testCasesQuery.refetch();
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

  const handleStopRecording = () => {
    if (currentRecording) {
      stopRecordingMutation.mutate(currentRecording.id);
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={checkAutomationHealth}
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Check Health
            </Button>
            {healthStatus && (
              <Badge 
                variant={healthStatus.details?.playwright?.includes('available') ? 'default' : 'destructive'}
              >
                {healthStatus.details?.playwright?.includes('available') ? 'Service OK' : 'Issues Detected'}
              </Badge>
            )}
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
                        className={selectedModule === module.id.toString() ? "bg-blue-50" : "cursor-pointer hover:bg-gray-50"}
                        onClick={() => {
                          console.log('Selecting module:', module.id, module.name);
                          setSelectedModule(module.id.toString());
                        }}
                      >
                        <TableCell className="font-medium">{module.name}</TableCell>
                        <TableCell>{module.description}</TableCell>
                        <TableCell>{module.testCaseCount || 0}</TableCell>
                        <TableCell>
                          <Button
                            variant={selectedModule === module.id.toString() ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Button click - selecting module:', module.id, module.name);
                              setSelectedModule(module.id.toString());
                            }}
                          >
                            {selectedModule === module.id.toString() ? "Selected" : "Select"}
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
              <p className="text-sm text-gray-600">
                Selected Module ID: {selectedModule} | Found {testCases.length} test cases
              </p>
            </CardHeader>
            <CardContent>
              {testCasesQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p>Loading test cases...</p>
                  </div>
                </div>
              ) : testCases.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No test cases found for this module.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Make sure the module has test cases created in the project.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead>Objective</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Script</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testCases.map((testCase: TestCase) => (
                      <TableRow key={testCase.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium">{testCase.testCaseId}</TableCell>
                        <TableCell>
                          <div className="font-medium">{testCase.feature}</div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-gray-600 truncate" title={testCase.testObjective}>
                            {testCase.testObjective || testCase.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {testCase.tags?.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            )) || <span className="text-xs text-gray-400">No tags</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              testCase.status === "Passed" 
                                ? "border-green-200 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-white dark:border-green-700"
                                : testCase.status === "Failed" 
                                ? "border-red-200 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-white dark:border-red-700"
                                : testCase.status === "Blocked" 
                                ? "border-red-200 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-white dark:border-red-700"
                                : "border-gray-200 bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-white dark:border-gray-700"
                            }
                          >
                            {testCase.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              testCase.priority === "High" 
                                ? "border-red-200 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-white dark:border-red-700" 
                                : testCase.priority === "Medium" 
                                ? "border-yellow-200 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-white dark:border-yellow-700" 
                                : "border-green-200 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-white dark:border-green-700"
                            }
                          >
                            {testCase.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {testCase.hasScript ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-mono text-green-600">{testCase.scriptFile}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No script</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Record Button */}
                            <Dialog open={isRecordingDialogOpen && selectedTestCase === testCase.id} onOpenChange={(isOpen) => {
                              setIsRecordingDialogOpen(isOpen);
                              if (!isOpen) {
                                setSelectedTestCase(''); // Clear selection when dialog closes
                                setRecordingUrl(''); // Clear URL input
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={currentRecording?.testCaseId === parseInt(testCase.id)}
                                  onClick={() => handleStartRecording(testCase.id)}
                                >
                                  {currentRecording?.testCaseId === parseInt(testCase.id) ? (
                                    <>
                                      <Square className="h-4 w-4 mr-1" />
                                      Recording...
                                    </>
                                  ) : (
                                    <>
                                      <Video className="h-4 w-4 mr-1" />
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
                                      onClick={() => {
                                        setIsRecordingDialogOpen(false);
                                        setSelectedTestCase('');
                                        setRecordingUrl('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleRecordingSubmit}
                                      disabled={startRecordingMutation.isPending}
                                    >
                                      Start Recording
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Stop Recording Button */}
                            {currentRecording?.testCaseId === parseInt(testCase.id) && (
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
                          {testCase?.title || result.testCaseId}
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