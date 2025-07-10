import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectSelect } from "@/components/ui/project-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Github,
  Link,
  Unlink,
  Settings,
  TestTube,
  Bug,
  GitBranch,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Save,
  X
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from 'lucide-react';

interface GitHubConfig {
  id?: number;
  projectId: number;
  repoOwner: string;
  repoName: string;
  accessToken: string;
  webhookUrl?: string;
  isActive: boolean;
  syncBugs: boolean;
  syncTestCases: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function GitHubIntegrationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<GitHubConfig | null>(null);
  const [newConfig, setNewConfig] = useState<Partial<GitHubConfig>>({
    repoOwner: '',
    repoName: '',
    accessToken: '',
    syncBugs: true,
    syncTestCases: true,
    isActive: true
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

  // Fetch GitHub configurations
  const { data: githubConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ["/api/github/configs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/github/configs");
      if (!response.ok) {
        console.log("No GitHub configurations found, returning empty array");
        return [];
      }
      return response.json();
    },
  });

  // Create/Update GitHub config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: GitHubConfig) => {
      const url = editingConfig ? `/api/github/configs/${editingConfig.id}` : "/api/github/configs";
      const method = editingConfig ? "PUT" : "POST";

      const response = await apiRequest(method, url, configData);
      if (!response.ok) throw new Error("Failed to save GitHub configuration");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/configs"] });
      toast({ title: "GitHub configuration saved successfully" });
      setShowConfigDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to save configuration", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete GitHub config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (configId: number) => {
      const response = await apiRequest("DELETE", `/api/github/configs/${configId}`);
      if (!response.ok) throw new Error("Failed to delete GitHub configuration");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/configs"] });
      toast({ title: "GitHub configuration deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete configuration", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (config: Partial<GitHubConfig>) => {
      const response = await apiRequest("POST", "/api/github/test-connection", {
        repoOwner: config.repoOwner,
        repoName: config.repoName,
        accessToken: config.accessToken
      });
      if (!response.ok) throw new Error("Connection test failed");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Connection test successful", description: "GitHub repository is accessible" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Connection test failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Sync from GitHub mutation
  const syncMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("POST", `/api/github/sync-from-github/${projectId}`);
      if (!response.ok) throw new Error("Sync failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Sync completed", 
        description: `Synced ${data.syncedCount} items from GitHub`
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Sync failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setNewConfig({
      repoOwner: '',
      repoName: '',
      accessToken: '',
      syncBugs: true,
      syncTestCases: true,
      isActive: true
    });
    setEditingConfig(null);
  };

  const handleSaveConfig = () => {
    if (!selectedProjectId) {
      toast({ title: "Please select a project", variant: "destructive" });
      return;
    }

    if (!newConfig.repoOwner || !newConfig.repoName || !newConfig.accessToken) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const configData: GitHubConfig = {
      ...newConfig,
      projectId: selectedProjectId,
      id: editingConfig?.id
    } as GitHubConfig;

    saveConfigMutation.mutate(configData);
  };

  const handleEditConfig = (config: GitHubConfig) => {
    setEditingConfig(config);
    setNewConfig(config);
    setSelectedProjectId(config.projectId);
    setShowConfigDialog(true);
  };

  const handleTestConnection = () => {
    if (!newConfig.repoOwner || !newConfig.repoName || !newConfig.accessToken) {
      toast({ title: "Please fill in repository details and access token", variant: "destructive" });
      return;
    }
    testConnectionMutation.mutate(newConfig);
  };

  // Initialize with first project if available
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const currentProject = projects?.find(p => p.id === selectedProjectId);
  const projectConfigs = Array.isArray(githubConfigs) ? 
    githubConfigs.filter((config: GitHubConfig) => config.projectId === selectedProjectId) : [];

  // Debug logging
  console.log('GitHub Integration Debug:', {
    selectedProjectId,
    projects: projects?.length || 0,
    githubConfigs: githubConfigs?.length || 0,
    projectConfigs: projectConfigs.length,
    currentProject: currentProject?.name
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-gray-800 via-gray-700 to-black rounded-xl shadow-lg">
              <Github className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">GitHub Integration</h1>
              <p className="text-muted-foreground">
                Connect your projects to GitHub repositories for seamless issue tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingConfig ? 'Edit GitHub Integration' : 'Add GitHub Integration'}
                  </DialogTitle>
                  <DialogDescription>
                    Connect your project to a GitHub repository to sync issues and test cases.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="repoOwner">Repository Owner</Label>
                      <Input
                        id="repoOwner"
                        placeholder="username or organization"
                        value={newConfig.repoOwner || ''}
                        onChange={(e) => setNewConfig(prev => ({ ...prev, repoOwner: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="repoName">Repository Name</Label>
                      <Input
                        id="repoName"
                        placeholder="repository-name"
                        value={newConfig.repoName || ''}
                        onChange={(e) => setNewConfig(prev => ({ ...prev, repoName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accessToken">GitHub Personal Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={newConfig.accessToken || ''}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Create a token at GitHub Settings → Developer settings → Personal access tokens
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newConfig.syncBugs || false}
                        onChange={(e) => setNewConfig(prev => ({ ...prev, syncBugs: e.target.checked }))}
                      />
                      <span className="text-sm">Sync Bugs as Issues</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newConfig.syncTestCases || false}
                        onChange={(e) => setNewConfig(prev => ({ ...prev, syncTestCases: e.target.checked }))}
                      />
                      <span className="text-sm">Sync Test Cases</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newConfig.isActive || false}
                        onChange={(e) => setNewConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testConnectionMutation.isPending}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingConfig ? 'Update' : 'Create'} Integration
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
              <Github className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-500">Please select a project to manage GitHub integrations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project: {currentProject?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">GitHub Integrations:</span> {projectConfigs.length}
                  </div>
                  <div>
                    <span className="font-medium">Active Connections:</span> {projectConfigs.filter(c => c.isActive).length}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GitHub Configurations */}
            {projectConfigs.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">GitHub Repositories</h2>
                {projectConfigs.map((config: GitHubConfig) => (
                  <Card key={config.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Github className="h-8 w-8 text-gray-600" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium">
                                {config.repoOwner}/{config.repoName}
                              </h3>
                              <Badge variant={config.isActive ? "default" : "secondary"}>
                                {config.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              {config.syncBugs && (
                                <span className="flex items-center">
                                  <Bug className="h-3 w-3 mr-1" />
                                  Bugs
                                </span>
                              )}
                              {config.syncTestCases && (
                                <span className="flex items-center">
                                  <TestTube className="h-3 w-3 mr-1" />
                                  Test Cases
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncMutation.mutate(selectedProjectId)}
                            disabled={syncMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://github.com/${config.repoOwner}/${config.repoName}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditConfig(config)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => config.id && deleteConfigMutation.mutate(config.id)}
                            disabled={deleteConfigMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No GitHub Integrations</h3>
                  <p className="text-gray-500 mb-4">
                    Connect your project to GitHub repositories to sync issues and test cases.
                  </p>
                  <Button onClick={() => setShowConfigDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add GitHub Integration
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Integration Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Setting up GitHub Token</h4>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Go to GitHub Settings → Developer settings</li>
                      <li>Click "Personal access tokens" → "Tokens (classic)"</li>
                      <li>Generate new token with "repo" and "issues" scopes</li>
                      <li>Copy the token and paste it in the form</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Sync bugs as GitHub issues</li>
                      <li>Two-way synchronization</li>
                      <li>Automatic status updates</li>
                      <li>Comment synchronization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}