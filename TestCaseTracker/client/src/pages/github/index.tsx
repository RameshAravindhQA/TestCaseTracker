
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
import { Plus, Settings, ExternalLink, Edit, Trash2, Github, Users, GitBranch, Eye, TestTube, CheckCircle, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  project?: {
    id: number;
    name: string;
  };
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

export default function GitHubIntegrationPage() {
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<GitHubIntegration | null>(null);
  const [formData, setFormData] = useState({
    projectId: "",
    repositoryUrl: "",
    accessToken: "",
    webhookUrl: "",
    isActive: true
  });
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch GitHub integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/github/integrations'],
    queryFn: async () => {
      const response = await fetch('/api/github/integrations');
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub integrations');
      }
      return response.json();
    },
  });

  // Fetch projects for the dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    },
  });

  // Create integration mutation
  const createIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      if (window.soundManager) {
        await window.soundManager.playSound('crud');
      }
      
      const response = await fetch('/api/github/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create integration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GitHub integration created successfully"
      });
      setIsAddingIntegration(false);
      resetForm();
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
      if (window.soundManager) {
        await window.soundManager.playSound('crud');
      }
      
      const response = await fetch(`/api/github/integrations/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update integration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GitHub integration updated successfully"
      });
      setEditingIntegration(null);
      resetForm();
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
      if (window.soundManager) {
        await window.soundManager.playSound('crud');
      }
      
      const response = await fetch(`/api/github/integrations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete integration');
      }
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

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (integration: GitHubIntegration) => {
      const response = await fetch('/api/github/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryUrl: integration.repositoryUrl,
          accessToken: integration.accessToken,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Connection test failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Test",
        description: "GitHub connection is working correctly",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      projectId: "",
      repositoryUrl: "",
      accessToken: "",
      webhookUrl: "",
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.repositoryUrl || !formData.accessToken) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...formData,
      projectId: parseInt(formData.projectId),
    };

    if (editingIntegration) {
      updateIntegrationMutation.mutate({ ...submitData, id: editingIntegration.id });
    } else {
      createIntegrationMutation.mutate(submitData);
    }
  };

  const handleEdit = (integration: GitHubIntegration) => {
    setEditingIntegration(integration);
    setFormData({
      projectId: integration.projectId.toString(),
      repositoryUrl: integration.repositoryUrl,
      accessToken: integration.accessToken,
      webhookUrl: integration.webhookUrl || "",
      isActive: integration.isActive
    });
    setIsAddingIntegration(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this GitHub integration?')) {
      deleteIntegrationMutation.mutate(id);
    }
  };

  const handleTestConnection = (integration: GitHubIntegration) => {
    setTestingConnection(integration.id);
    testConnectionMutation.mutate(integration);
    setTimeout(() => setTestingConnection(null), 3000);
  };

  const parseRepoUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    return match ? { owner: match[1], repo: match[2].replace('.git', '') } : null;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Github className="h-8 w-8" />
              GitHub Integration
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect your projects to GitHub repositories for seamless issue tracking and automation
            </p>
          </div>
          <Button onClick={() => setIsAddingIntegration(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        </div>

        {/* GitHub Integrations Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrationsLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : integrations.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Github className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No GitHub Integrations</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Get started by connecting your first GitHub repository
                  </p>
                  <Button onClick={() => setIsAddingIntegration(true)} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Integration
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            integrations.map((integration: GitHubIntegration) => {
              const repoInfo = parseRepoUrl(integration.repositoryUrl);
              return (
                <Card key={integration.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Github className="h-5 w-5 text-gray-600" />
                        <div>
                          <CardTitle className="text-lg">{repoInfo?.repo || 'Repository'}</CardTitle>
                          <CardDescription className="text-sm">
                            {repoInfo?.owner}/{repoInfo?.repo}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={integration.isActive ? "default" : "secondary"}>
                        {integration.isActive ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {integration.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Project</Label>
                        <p className="font-medium">{integration.project?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Last Sync</Label>
                        <p className="font-medium">
                          {integration.lastSync ? new Date(integration.lastSync).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Repository URL</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={integration.repositoryUrl} 
                          readOnly 
                          className="text-xs"
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(integration.repositoryUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {integration.webhookUrl && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Webhook URL</Label>
                        <Input 
                          value={integration.webhookUrl} 
                          readOnly 
                          className="text-xs"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleTestConnection(integration)}
                        disabled={testingConnection === integration.id}
                        className="flex-1"
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        {testingConnection === integration.id ? 'Testing...' : 'Test'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(integration)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(integration.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Add/Edit Integration Dialog */}
        <Dialog open={isAddingIntegration} onOpenChange={setIsAddingIntegration}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                {editingIntegration ? 'Edit GitHub Integration' : 'Add GitHub Integration'}
              </DialogTitle>
              <DialogDescription>
                Connect a GitHub repository to your project for automated issue tracking
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repositoryUrl">Repository URL *</Label>
                <Input
                  id="repositoryUrl"
                  value={formData.repositoryUrl}
                  onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                  placeholder="https://github.com/username/repository"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token *</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Personal access token with repository access permissions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://your-app.com/webhook"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Enable Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow creating GitHub issues from bugs
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddingIntegration(false);
                  setEditingIntegration(null);
                  resetForm();
                }} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createIntegrationMutation.isPending || updateIntegrationMutation.isPending}
                  className="flex-1"
                >
                  {editingIntegration ? 'Update' : 'Create'} Integration
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
