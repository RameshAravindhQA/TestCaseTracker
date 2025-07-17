import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Github, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface GitHubIntegration {
  id: number;
  projectId: number;
  projectName: string;
  repoUrl: string;
  accessToken: string;
  webhookUrl?: string;
  isEnabled: boolean;
  createdAt: string;
}

interface GitHubConfigFormProps {
  editingIntegration?: GitHubIntegration | null;
  onClose: () => void;
}

export function GitHubConfigForm({ editingIntegration, onClose }: GitHubConfigFormProps) {
  const [formData, setFormData] = useState({
    projectId: '',
    username: '',
    repository: '',
    accessToken: '',
    webhookSecret: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Fetch projects for dropdown
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    }
  });

  // Set form data when editing
  useEffect(() => {
    if (editingIntegration) {
      const urlParts = editingIntegration.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      setFormData({
        projectId: editingIntegration.projectId.toString(),
        username: urlParts ? urlParts[1] : '',
        repository: urlParts ? urlParts[2] : '',
        accessToken: '', // Don't prefill token for security
        webhookSecret: '',
        isActive: editingIntegration.isEnabled
      });
    }
  }, [editingIntegration]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingIntegration 
        ? `/api/github/integrations/${editingIntegration.id}`
        : '/api/github/integrations';

      const method = editingIntegration ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          projectId: parseInt(data.projectId),
          repoUrl: `https://github.com/${data.username}/${data.repository}`,
          accessToken: data.accessToken,
          webhookSecret: data.webhookSecret || undefined,
          isActive: data.isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save GitHub integration');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `GitHub integration ${editingIntegration ? 'updated' : 'created'} successfully`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github/integrations'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    if (!formData.username) {
      newErrors.username = 'GitHub username is required';
    }

    if (!formData.repository) {
      newErrors.repository = 'Repository name is required';
    }

    if (!formData.accessToken && !editingIntegration) {
      newErrors.accessToken = 'Access token is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You'll need a GitHub Personal Access Token with repository and issues permissions. 
          <a 
            href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline ml-1"
          >
            Learn how to create one →
          </a>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="projectId">Project *</Label>
          <Select 
            value={formData.projectId} 
            onValueChange={(value) => handleInputChange('projectId', value)}
            disabled={!!editingIntegration}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectId && (
            <p className="text-sm text-red-600 mt-1">{errors.projectId}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">GitHub Username *</Label>
            <Input
              id="username"
              type="text"
              placeholder="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
            />
            {errors.username && (
              <p className="text-sm text-red-600 mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <Label htmlFor="repository">Repository Name *</Label>
            <Input
              id="repository"
              type="text"
              placeholder="repository-name"
              value={formData.repository}
              onChange={(e) => handleInputChange('repository', e.target.value)}
            />
            {errors.repository && (
              <p className="text-sm text-red-600 mt-1">{errors.repository}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="accessToken">
              Personal Access Token {editingIntegration ? '(leave empty to keep current)' : '*'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="accessToken"
                type="password"
                placeholder={editingIntegration ? "Enter new token or leave empty" : "ghp_xxxxxxxxxxxxxxxxxxxx"}
                value={formData.accessToken}
                onChange={(e) => handleInputChange('accessToken', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!formData.username || !formData.repository || !formData.accessToken) {
                    toast({
                      title: "Missing Information",
                      description: "Please fill in username, repository, and access token before testing",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  try {
                    const response = await fetch('/api/github/test-connection', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        repoUrl: `https://github.com/${formData.username}/${formData.repository}`,
                        accessToken: formData.accessToken,
                      }),
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "Connection Successful",
                        description: "GitHub connection test passed!",
                        variant: "success",
                      });
                    } else {
                      const error = await response.text();
                      toast({
                        title: "Connection Failed",
                        description: error || "Failed to connect to GitHub",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Test Failed",
                      description: "Network error occurred",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!formData.username || !formData.repository || !formData.accessToken}
              >
                Test Connection
              </Button>
            </div>
            {errors.accessToken && (
              <p className="text-sm text-red-600 mt-1">{errors.accessToken}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Generate at GitHub Settings → Developer settings → Personal access tokens
              <br />
              <strong>Required permissions:</strong> repo, issues, pull_requests
            </p>
          </div>

          <div>
            <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
            <Input
              id="webhookSecret"
              type="password"
              placeholder="Optional webhook secret for secure communication"
              value={formData.webhookSecret}
              onChange={(e) => handleInputChange('webhookSecret', e.target.value)}
            />
          </div>
        </div>

        

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
          />
          <Label htmlFor="isActive">Enable Integration</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={saveMutation.isPending}
          className="flex items-center gap-2"
        >
          {saveMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <Github className="h-4 w-4" />
          {editingIntegration ? 'Update Integration' : 'Create Integration'}
        </Button>
      </div>
    </form>
  );
}