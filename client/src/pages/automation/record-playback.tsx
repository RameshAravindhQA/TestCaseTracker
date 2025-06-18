import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Play, Square, Video, Save, FileCode, AlertCircle, Check, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RecordingState {
  scriptId: string;
  status: 'idle' | 'recording' | 'stopping' | 'completed' | 'error';
  startTime?: number;
  scriptContent?: string;
  error?: string;
}

interface ExecutionState {
  scriptId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: number;
  duration?: number;
  results?: any;
  error?: string;
}

export default function RecordPlaybackComponent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recordingState, setRecordingState] = useState<RecordingState>({
    scriptId: '',
    status: 'idle'
  });
  
  const [executionState, setExecutionState] = useState<ExecutionState>({
    scriptId: '',
    status: 'idle'
  });
  
  const [scriptName, setScriptName] = useState('');
  const [scriptDescription, setScriptDescription] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [scriptType, setScriptType] = useState('playwright');
  
  // Fetch all projects for the project selector
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: async () => {
      // Generate a unique ID for this recording session
      const scriptId = `record-${Date.now()}`;
      
      const response = await apiRequest('POST', '/api/automation/record/start', {
        scriptId
      });
      
      const data = await response.json();
      return { ...data, scriptId };
    },
    onSuccess: (data) => {
      setRecordingState({
        scriptId: data.scriptId,
        status: 'recording',
        startTime: Date.now()
      });
      
      toast({
        title: 'Recording started',
        description: 'A new browser window will open. Perform your test actions there.'
      });
      
      // Start polling for recording status
      startPollingRecordingStatus(data.scriptId);
    },
    onError: (error: any) => {
      setRecordingState({
        scriptId: '',
        status: 'error',
        error: error.message || 'Failed to start recording'
      });
      
      toast({
        title: 'Recording failed',
        description: error.message || 'An error occurred while starting the recording',
        variant: 'destructive'
      });
    }
  });
  
  // Stop recording mutation
  const stopRecordingMutation = useMutation({
    mutationFn: async (scriptId: string) => {
      const response = await apiRequest('POST', `/api/automation/record/stop/${scriptId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      setRecordingState(prev => ({
        ...prev,
        status: 'stopping'
      }));
      
      toast({
        title: 'Stopping recording',
        description: 'Close the browser window to finish recording.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to stop recording',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    }
  });
  
  // Execute script mutation
  const executeScriptMutation = useMutation({
    mutationFn: async () => {
      // Generate a unique ID for this execution session
      const scriptId = `execute-${Date.now()}`;
      
      const response = await apiRequest('POST', '/api/automation/execute', {
        scriptId,
        scriptContent
      });
      
      const data = await response.json();
      return { ...data, scriptId };
    },
    onSuccess: (data) => {
      setExecutionState({
        scriptId: data.scriptId,
        status: 'running',
        startTime: Date.now()
      });
      
      toast({
        title: 'Test execution started',
        description: 'The test is now running in headless mode.'
      });
      
      // Start polling for execution status
      startPollingExecutionStatus(data.scriptId);
    },
    onError: (error: any) => {
      setExecutionState({
        scriptId: '',
        status: 'error',
        error: error.message || 'Failed to execute test'
      });
      
      toast({
        title: 'Test execution failed',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    }
  });
  
  // Save script mutation
  const saveScriptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/automation/scripts', {
        name: scriptName,
        description: scriptDescription,
        scriptContent,
        type: scriptType,
        projectId: selectedProjectId
      });
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/scripts'] });
      
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
  
  // Polling functions
  const startPollingRecordingStatus = (scriptId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/automation/record/status/${scriptId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
          clearInterval(interval);
          setRecordingState({
            scriptId,
            status: 'completed',
            scriptContent: data.scriptContent
          });
          
          // Update the script content
          setScriptContent(data.scriptContent);
          
          toast({
            title: 'Recording completed',
            description: 'The browser session has been recorded successfully.'
          });
        } else if (data.status === 'error') {
          clearInterval(interval);
          setRecordingState({
            scriptId,
            status: 'error',
            error: data.error || 'An error occurred during recording'
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
    }, 2000); // Poll every 2 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  };
  
  const startPollingExecutionStatus = (scriptId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/automation/execute/status/${scriptId}`);
        const data = await response.json();
        
        if (data.status === 'Passed' || data.status === 'Failed' || data.status === 'Error') {
          clearInterval(interval);
          setExecutionState({
            scriptId,
            status: data.status === 'Error' ? 'error' : 'completed',
            results: data.results,
            error: data.status === 'Error' ? data.results?.error : undefined,
            duration: data.results?.duration
          });
          
          toast({
            title: `Test ${data.status}`,
            description: data.status === 'Passed' ? 
              'The test has completed successfully.' : 
              'The test has failed. Check the logs for details.',
            variant: data.status === 'Passed' ? 'default' : 'destructive'
          });
        }
      } catch (error) {
        console.error('Error polling execution status:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  };
  
  // Handlers
  const handleStartRecording = () => {
    startRecordingMutation.mutate();
  };
  
  const handleStopRecording = () => {
    if (recordingState.scriptId) {
      stopRecordingMutation.mutate(recordingState.scriptId);
    }
  };
  
  const handleExecuteScript = () => {
    if (!scriptContent) {
      toast({
        title: 'Script is empty',
        description: 'Please record or write a script before executing.',
        variant: 'destructive'
      });
      return;
    }
    
    executeScriptMutation.mutate();
  };
  
  const handleSaveScript = () => {
    if (!scriptName) {
      toast({
        title: 'Script name required',
        description: 'Please provide a name for the script.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!scriptContent) {
      toast({
        title: 'Script is empty',
        description: 'Please record or write a script before saving.',
        variant: 'destructive'
      });
      return;
    }
    
    saveScriptMutation.mutate();
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recording Card */}
        <Card>
          <CardHeader>
            <CardTitle>Record Browser Actions</CardTitle>
            <CardDescription>
              Record your interactions with a web application to generate a test script.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recordingState.status === 'error' && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Recording Failed</AlertTitle>
                <AlertDescription>
                  {recordingState.error || 'An error occurred during recording'}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-md mb-4">
              {recordingState.status === 'idle' ? (
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Click Start Recording to begin capturing your browser actions.
                  </p>
                </div>
              ) : recordingState.status === 'recording' ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-2 text-primary animate-spin" />
                  <p className="text-sm font-medium text-primary">
                    Recording in progress... Use the browser window that opened.
                  </p>
                </div>
              ) : recordingState.status === 'stopping' ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-2 text-amber-500 animate-spin" />
                  <p className="text-sm font-medium text-amber-500">
                    Stopping recording... Close the browser window to finish.
                  </p>
                </div>
              ) : recordingState.status === 'completed' ? (
                <div className="text-center">
                  <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium text-green-500">
                    Recording completed successfully!
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {recordingState.status === 'idle' ? (
              <Button 
                onClick={handleStartRecording} 
                disabled={startRecordingMutation.isPending}
                className="w-full"
              >
                {startRecordingMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</>
                ) : (
                  <><Video className="mr-2 h-4 w-4" /> Start Recording</>
                )}
              </Button>
            ) : recordingState.status === 'recording' ? (
              <Button 
                variant="destructive" 
                onClick={handleStopRecording} 
                disabled={stopRecordingMutation.isPending}
                className="w-full"
              >
                {stopRecordingMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Stopping...</>
                ) : (
                  <><Square className="mr-2 h-4 w-4" /> Stop Recording</>
                )}
              </Button>
            ) : recordingState.status === 'stopping' ? (
              <Button 
                variant="outline" 
                disabled
                className="w-full"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing Recording...
              </Button>
            ) : (
              <Button 
                onClick={handleStartRecording} 
                disabled={startRecordingMutation.isPending}
                className="w-full"
              >
                <Video className="mr-2 h-4 w-4" /> Record New Script
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Execution Card */}
        <Card>
          <CardHeader>
            <CardTitle>Execute Test</CardTitle>
            <CardDescription>
              Run the recorded script to execute the test in headless mode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {executionState.status === 'error' && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Execution Failed</AlertTitle>
                <AlertDescription>
                  {executionState.error || 'An error occurred during test execution'}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-md mb-4">
              {executionState.status === 'idle' ? (
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Click Execute Test to run the recorded script.
                  </p>
                </div>
              ) : executionState.status === 'running' ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-2 text-primary animate-spin" />
                  <p className="text-sm font-medium text-primary">
                    Test execution in progress...
                  </p>
                </div>
              ) : executionState.status === 'completed' ? (
                <div className="text-center">
                  <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium text-green-500">
                    Test completed successfully!
                  </p>
                  {executionState.duration && (
                    <p className="text-xs text-slate-500 mt-1">
                      Duration: {(executionState.duration / 1000).toFixed(2)}s
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleExecuteScript} 
              disabled={executeScriptMutation.isPending || executionState.status === 'running' || !scriptContent}
              className="w-full"
              variant={!scriptContent ? "outline" : "default"}
            >
              {executeScriptMutation.isPending || executionState.status === 'running' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Executing...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Execute Test</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Script Editor Card */}
      <Card>
        <CardHeader>
          <CardTitle>Script Editor</CardTitle>
          <CardDescription>
            View and edit the generated test script, then save it to your automation library.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="script-name">Script Name</Label>
              <Input 
                id="script-name" 
                placeholder="Enter script name" 
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="script-type">Script Type</Label>
              <Select value={scriptType} onValueChange={setScriptType}>
                <SelectTrigger id="script-type">
                  <SelectValue placeholder="Select script type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="playwright">Playwright</SelectItem>
                  <SelectItem value="selenium">Selenium</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select 
                value={selectedProjectId?.toString() || ''} 
                onValueChange={(value) => setSelectedProjectId(parseInt(value))}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="script-description">Description</Label>
            <Textarea 
              id="script-description" 
              placeholder="Enter script description" 
              value={scriptDescription}
              onChange={(e) => setScriptDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="script-content" className="flex justify-between">
              <span>Script Content</span>
              {recordingState.status === 'completed' && (
                <span className="text-xs text-green-500">Recorded successfully</span>
              )}
            </Label>
            <Textarea 
              id="script-content" 
              placeholder="Script content will appear here after recording" 
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              className="font-mono text-sm"
              rows={15}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSaveScript} 
            disabled={saveScriptMutation.isPending || !scriptName || !scriptContent}
            className="w-full"
            variant="outline"
          >
            {saveScriptMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Script</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}