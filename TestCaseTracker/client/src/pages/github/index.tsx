
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Settings, ExternalLink, Edit, Trash2, Github, Users, GitBranch } from "lucide-react";

interface GitHubIntegration {
  id: number;
  projectId: number;
  repositoryUrl: string;
  accessToken: string;
  webhookUrl?: string;
  isActive: boolean;
  lastSync?: string;
  owner: string;
  repo: string;
  createdAt: string;
  updatedAt: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export default function GitHubIntegrationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<GitHubIntegration | null>(null);
  const [newIntegration, setNewIntegration] = useState({
    repositoryUrl: "",
    accessToken: "",
    webhookUrl: ""
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects').then(res => res.json())
  });

  // Fetch GitHub integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/github/integrations'],
    queryFn: () => apiRequest('GET', '/api/github/integrations').then(res => res.json())
  });

  // Fetch GitHub issues for selected project
  const { data: githubIssues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ['/api/github/issues', selectedProjectId],
    queryFn: () => selectedProjectId ? 
      apiRequest('GET', `/api/github/issues?projectId=${selectedProjectId}`).then(res => res.json()) : 
      Promise.resolve([]),
    enabled: !!selectedProjectId
  });

  // Create integration mutation
  const createIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/github/integrations', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GitHub integration created successfully"
      });
      setIsAddingIntegration(false);
      setNewIntegration({ repositoryUrl: "", accessToken: "", webhookUrl: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/github/integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create integration",
        variant: "destructive"
      });
    }
  });

  // Update integration mutation
  const updateIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/github/integrations/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GitHub integration updated successfully"
      });
      setEditingIntegration(null);
      queryClient.invalidateQueries({ queryKey: ['/api/github/integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update integration",
        variant: "destructive"
      });
    }
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/github/integrations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GitHub integration deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github/integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete integration",
        variant: "destructive"
      });
    }
  });

  // Sync issues mutation
  const syncIssuesMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      const response = await apiRequest('POST', `/api/github/integrations/${integrationId}/sync`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GitHub issues synchronized successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github/issues'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync issues",
        variant: "destructive"
      });
    }
  });

  const handleCreateIntegration = () => {
    if (!selectedProjectId || !newIntegration.repositoryUrl || !newIntegration.accessToken) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createIntegrationMutation.mutate({
      projectId: selectedProjectId,
      ...newIntegration
    });
  };

  const handleUpdateIntegration = (integration: GitHubIntegration) => {
    updateIntegrationMutation.mutate(integration);
  };

  const handleDeleteIntegration = (id: number) => {
    if (confirm("Are you sure you want to delete this GitHub integration?")) {
      deleteIntegrationMutation.mutate(id);
    }
  };

  const handleSyncIssues = (integrationId: number) => {
    syncIssuesMutation.mutate(integrationId);
  };

  const getProjectIntegrations = (projectId: number) => {
    return integrations.filter(integration => integration.projectId === projectId);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">GitHub Integration</h1>
            <p className="text-muted-foreground">
              Connect your projects to GitHub repositories for seamless issue tracking
            </p>
          </div>
          <Button onClick={() => setIsAddingIntegration(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Select Project
              </CardTitle>
              <CardDescription>
                Choose a project to view GitHub integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedProjectId?.toString()} onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* GitHub Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                GitHub Integrations
                {selectedProjectId && (
                  <Badge variant="secondary">
                    {getProjectIntegrations(selectedProjectId).length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Active GitHub repository connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProjectId ? (
                <div className="space-y-3">
                  {getProjectIntegrations(selectedProjectId).map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{integration.owner}/{integration.repo}</div>
                        <div className="text-sm text-muted-foreground">
                          {integration.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncIssues(integration.id)}
                          disabled={syncIssuesMutation.isPending}
                        >
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIntegration(integration)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteIntegration(integration.id)}
                          disabled={deleteIntegrationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getProjectIntegrations(selectedProjectId).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No GitHub integrations found for this project
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a project to view integrations
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* GitHub Issues */}
        {selectedProjectId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                GitHub Issues
                <Badge variant="secondary">{githubIssues.length}</Badge>
              </CardTitle>
              <CardDescription>
                Issues from connected GitHub repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {issuesLoading ? (
                <div className="text-center py-8">Loading issues...</div>
              ) : githubIssues.length > 0 ? (
                <div className="space-y-4">
                  {githubIssues.map((issue: GitHubIssue) => (
                    <div key={issue.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">#{issue.number} {issue.title}</h3>
                            <Badge variant={issue.state === 'open' ? 'default' : 'secondary'}>
                              {issue.state}
                            </Badge>
                          </div>
                          {issue.body && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {issue.body.substring(0, 200)}...
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                            <span>Updated: {new Date(issue.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {issue.labels.map((label) => (
                            <Badge key={label.name} variant="outline" style={{ backgroundColor: `#${label.color}20` }}>
                              {label.name}
                            </Badge>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(issue.html_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No GitHub issues found
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Integration Dialog */}
        <Dialog open={isAddingIntegration} onOpenChange={setIsAddingIntegration}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add GitHub Integration</DialogTitle>
              <DialogDescription>
                Connect a GitHub repository to this project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project">Project</Label>
                <Select value={selectedProjectId?.toString()} onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
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
              <div>
                <Label htmlFor="repositoryUrl">Repository URL</Label>
                <Input
                  id="repositoryUrl"
                  placeholder="https://github.com/owner/repo"
                  value={newIntegration.repositoryUrl}
                  onChange={(e) => setNewIntegration({ ...newIntegration, repositoryUrl: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="GitHub personal access token"
                  value={newIntegration.accessToken}
                  onChange={(e) => setNewIntegration({ ...newIntegration, accessToken: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-app.com/webhook"
                  value={newIntegration.webhookUrl}
                  onChange={(e) => setNewIntegration({ ...newIntegration, webhookUrl: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingIntegration(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateIntegration} disabled={createIntegrationMutation.isPending}>
                  {createIntegrationMutation.isPending ? "Creating..." : "Create Integration"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Integration Dialog */}
        <Dialog open={!!editingIntegration} onOpenChange={(open) => !open && setEditingIntegration(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit GitHub Integration</DialogTitle>
              <DialogDescription>
                Update GitHub integration settings
              </DialogDescription>
            </DialogHeader>
            {editingIntegration && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editRepositoryUrl">Repository URL</Label>
                  <Input
                    id="editRepositoryUrl"
                    value={editingIntegration.repositoryUrl}
                    onChange={(e) => setEditingIntegration({ ...editingIntegration, repositoryUrl: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editAccessToken">Access Token</Label>
                  <Input
                    id="editAccessToken"
                    type="password"
                    value={editingIntegration.accessToken}
                    onChange={(e) => setEditingIntegration({ ...editingIntegration, accessToken: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editWebhookUrl">Webhook URL</Label>
                  <Input
                    id="editWebhookUrl"
                    value={editingIntegration.webhookUrl || ''}
                    onChange={(e) => setEditingIntegration({ ...editingIntegration, webhookUrl: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingIntegration(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleUpdateIntegration(editingIntegration)} disabled={updateIntegrationMutation.isPending}>
                    {updateIntegrationMutation.isPending ? "Updating..." : "Update Integration"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
