import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitHubConfigForm } from "@/components/github/github-config-form";
import { Github, Settings, ExternalLink, Plus, Edit, ArrowLeft, Minimize2, Maximize2, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function GitHubIntegrationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Fetch all GitHub configurations
  const { data: githubConfigs, isLoading } = useQuery({
    queryKey: ['github-configs'],
    queryFn: async () => {
      const response = await fetch('/api/github/configs');
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub configurations');
      }
      return response.json();
    },
  });

  // Fetch all projects for the dropdown
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    },
  });

  // Sync GitHub to System mutation
  const syncGitHubToSystemMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/github/sync/github-to-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync from GitHub');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Successful",
        description: `Synced ${data.syncedCount || 0} items from GitHub to system`,
      });
      queryClient.invalidateQueries({ queryKey: ['github-configs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync System to GitHub mutation
  const syncSystemToGitHubMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/github/sync/system-to-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync to GitHub');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Successful", 
        description: `Synced ${data.syncedCount || 0} items from system to GitHub`,
      });
      queryClient.invalidateQueries({ queryKey: ['github-configs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getProjectName = (projectId: number) => {
    const project = projects?.find((p: any) => p.id === projectId);
    return project?.name || `Project ${projectId}`;
  };

  const handleEditConfig = (config: any) => {
    setSelectedConfig(config);
    setShowConfigForm(true);
  };

  const handleCreateNew = () => {
    setSelectedConfig(null);
    setShowConfigForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation and control buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">GitHub Integration</h1>
            <p className="text-muted-foreground">
              Manage GitHub integrations for your projects to create and sync issues automatically.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => syncGitHubToSystemMutation.mutate()}
            disabled={syncGitHubToSystemMutation.isPending}
            className="flex items-center gap-2"
          >
            {syncGitHubToSystemMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            GitHub → System
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => syncSystemToGitHubMutation.mutate()}
            disabled={syncSystemToGitHubMutation.isPending}
            className="flex items-center gap-2"
          >
            {syncSystemToGitHubMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            System → GitHub
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand view" : "Minimize view"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Overview Cards - conditionally rendered based on minimized state */}
      {!isMinimized && (
        <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <Github className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {githubConfigs?.filter((config: any) => config.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {githubConfigs?.length || 0} total configurations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Projects</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(githubConfigs?.map((config: any) => config.projectId))?.size || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Projects with GitHub integration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(githubConfigs?.map((config: any) => `${config.repoOwner}/${config.repoName}`))?.size || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique repositories connected
            </p>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>GitHub Configurations</CardTitle>
          <CardDescription>
            Manage GitHub integrations for your projects. Each project can have one active GitHub integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading configurations...</div>
            </div>
          ) : githubConfigs?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Github className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No GitHub Integrations</h3>
              <p className="text-muted-foreground mb-4">
                Get started by setting up your first GitHub integration.
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Setup GitHub Integration
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {githubConfigs?.map((config: any) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      {getProjectName(config.projectId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        <span>{config.repoOwner}/{config.repoName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://github.com/${config.repoOwner}/${config.repoName}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.isActive ? "default" : "secondary"}>
                        {config.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(config.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditConfig(config)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* GitHub Configuration Form */}
      <GitHubConfigForm
        open={showConfigForm}
        onOpenChange={setShowConfigForm}
        projectId={selectedConfig?.projectId || 0}
        config={selectedConfig}
      />
    </div>
  );
}