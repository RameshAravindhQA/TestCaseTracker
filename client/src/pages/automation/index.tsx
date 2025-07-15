import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/main-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ProjectSelect } from "@/components/ui/project-select";
import {
  Play,
  Square,
  RotateCcw,
  Settings,
  FileText,
  Download,
  Calendar,
  AlertTriangle,
  Zap,
  TestTube,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Code
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface AutomationScript {
  id: number;
  name: string;
  description: string;
  projectId: number;
  scriptContent: string;
  scriptType: 'playwright' | 'selenium' | 'custom';
  status: 'active' | 'inactive' | 'draft';
  lastExecuted?: string;
  lastResult?: 'passed' | 'failed' | 'error';
  executionTime?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  tags: string[];
}

interface ExecutionResult {
  id: number;
  scriptId: number;
  status: 'running' | 'passed' | 'failed' | 'error';
  startTime: string;
  endTime?: string;
  duration?: number;
  output: string;
  errorMessage?: string;
  screenshots?: string[];
}

interface Project {
  id: number;
  name: string;
}

export default function AutomationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [selectedScript, setSelectedScript] = useState<AutomationScript | null>(null);
  const [executionResults, setExecutionResults] = useState<ExecutionResult | null>(null);
  const [newScript, setNewScript] = useState({
    name: '',
    description: '',
    scriptType: 'playwright' as const,
    scriptContent: '',
    tags: [] as string[]
  });

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  // Fetch automation scripts
  const { data: scripts, isLoading: scriptsLoading } = useQuery<AutomationScript[]>({
    queryKey: ["/api/automation/scripts", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest("GET", `/api/automation/scripts?projectId=${selectedProjectId}`);
      if (!response.ok) {
        console.log("No automation scripts found");
        return [];
      }
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Create script mutation
  const createScriptMutation = useMutation({
    mutationFn: async (scriptData: any) => {
      const response = await apiRequest("POST", "/api/automation/scripts", {
        ...scriptData,
        projectId: selectedProjectId
      });
      if (!response.ok) throw new Error("Failed to create script");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation/scripts", selectedProjectId] });
      toast({ title: "Automation script created successfully" });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create script", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Execute script mutation
  const executeScriptMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      const response = await apiRequest("POST", `/api/automation/scripts/${scriptId}/execute`);
      if (!response.ok) throw new Error("Failed to execute script");
      return response.json();
    },
    onSuccess: (data) => {
      setExecutionResults(data);
      setShowExecutionDialog(true);
      queryClient.invalidateQueries({ queryKey: ["/api/automation/scripts", selectedProjectId] });
      toast({ title: "Script execution started" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to execute script", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/automation/start-recording", {
        projectId: selectedProjectId
      });
      if (!response.ok) throw new Error("Failed to start recording");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Recording started", 
        description: "Browser opened for recording. Perform your actions and stop when done."
      });
      if (data.recordingUrl) {
        window.open(data.recordingUrl, '_blank');
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to start recording", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setNewScript({
      name: '',
      description: '',
      scriptType: 'playwright',
      scriptContent: '',
      tags: []
    });
  };

  const handleCreateScript = () => {
    if (!selectedProjectId || !newScript.name.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createScriptMutation.mutate(newScript);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      error: 'secondary',
      running: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-500 rounded-xl shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Test Automation</h1>
              <p className="text-muted-foreground">
                Record, manage, and execute automated browser tests with Playwright
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => startRecordingMutation.mutate()}
              disabled={!selectedProjectId || startRecordingMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Script
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Automation Script</DialogTitle>
                  <DialogDescription>
                    Create a new automation script for your project
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="script-name">Script Name</Label>
                      <Input
                        id="script-name"
                        placeholder="Login test script"
                        value={newScript.name}
                        onChange={(e) => setNewScript(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="script-type">Script Type</Label>
                      <Select
                        value={newScript.scriptType}
                        onValueChange={(value: any) => setNewScript(prev => ({ ...prev, scriptType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="playwright">Playwright</SelectItem>
                          <SelectItem value="selenium">Selenium</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="script-description">Description</Label>
                    <Textarea
                      id="script-description"
                      placeholder="Describe what this script tests..."
                      value={newScript.description}
                      onChange={(e) => setNewScript(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="script-content">Script Content</Label>
                    <Textarea
                      id="script-content"
                      placeholder="Paste your Playwright/Selenium script here..."
                      value={newScript.scriptContent}
                      onChange={(e) => setNewScript(prev => ({ ...prev, scriptContent: e.target.value }))}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateScript} disabled={createScriptMutation.isPending}>
                    {createScriptMutation.isPending ? "Creating..." : "Create Script"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <ProjectSelect
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              projects={projects || []}
            />
          </div>
        </div>

        {!selectedProjectId ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-500">Please select a project to manage automation scripts.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="scripts" className="space-y-6">
            <TabsList>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
              <TabsTrigger value="executions">Execution History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="scripts" className="space-y-6">
              {scriptsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : scripts?.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No automation scripts</h3>
                    <p className="text-gray-500 mb-4">
                      Get started by creating your first automation script or recording a new test.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Script
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => startRecordingMutation.mutate()}
                        disabled={startRecordingMutation.isPending}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scripts?.map((script) => (
                    <Card key={script.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-base truncate">{script.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{script.description}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {getStatusIcon(script.lastResult || 'unknown')}
                            {getStatusBadge(script.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {script.scriptType}
                          </Badge>
                          {script.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          {script.lastExecuted && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                Last run: {new Date(script.lastExecuted).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {script.executionTime && (
                            <div className="flex items-center gap-2">
                              <Zap className="h-3 w-3" />
                              <span>
                                Duration: {script.executionTime}ms
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => executeScriptMutation.mutate(script.id)}
                            disabled={executeScriptMutation.isPending}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Run
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="executions">
              <Card>
                <CardHeader>
                  <CardTitle>Execution History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Execution history will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Automation Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Browser Configuration</h3>
                      <p className="text-sm text-gray-600">Configure default browser settings for automation scripts.</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Execution Environment</h3>
                      <p className="text-sm text-gray-600">Set up environment variables and configuration for script execution.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Execution Results Dialog */}
        <Dialog open={showExecutionDialog} onOpenChange={setShowExecutionDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Script Execution Results</DialogTitle>
            </DialogHeader>
            {executionResults && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(executionResults.status)}
                    <span className="font-medium">Status: {executionResults.status}</span>
                  </div>
                  {executionResults.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Duration: {executionResults.duration}ms</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Output</Label>
                  <Textarea
                    value={executionResults.output}
                    readOnly
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                {executionResults.errorMessage && (
                  <div>
                    <Label>Error</Label>
                    <Textarea
                      value={executionResults.errorMessage}
                      readOnly
                      className="min-h-[100px] font-mono text-sm text-red-600"
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowExecutionDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}