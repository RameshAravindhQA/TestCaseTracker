import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitHubConfigForm } from "@/components/github/github-config-form";
import { Github, Settings, ExternalLink, Plus, Edit, ArrowLeft, Minimize2, Maximize2, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

export default function GitHubIntegrationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Fetch projects
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch GitHub configurations
  const { data: configs = [], isLoading: isConfigsLoading, refetch: refetchConfigs } = useQuery({
    queryKey: ["/api/github/configs"],
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

  // Sync from GitHub for specific project mutation
  const syncFromGitHubMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await fetch(`/api/github/sync-from-github/${projectId}`, {
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
        title: "Sync from GitHub Successful",
        description: `Synced ${data.syncedCount || 0} out of ${data.totalIssues || 0} GitHub issues`,
      });
      refetchConfigs();
    },
    onError: (error: Error) => {
      toast({
        title: "Sync from GitHub Failed",
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
    setEditingConfig(config);
    setIsConfigDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingConfig(null);
    setIsConfigDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Header with navigation and control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-lg">
                    <Github className="h-8 w-8 text-white" />
                  </div>
                  GitHub Integration
                </h1>
                <p className="text-muted-foreground mt-2">
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
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>GitHub Configurations</CardTitle>
          <CardDescription>
            Manage GitHub integrations for your projects. Each project can have one active GitHub integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConfigsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading configurations...</div>
            </div>
          ) : configs?.length === 0 ? (
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
                {configs?.map((config: any) => (
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConfig(config)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncFromGitHubMutation.mutate(config.projectId)}
                          disabled={syncFromGitHubMutation.isPending}
                        >
                          {syncFromGitHubMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Sync from GitHub
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

      {/* GitHub Configuration Form */}
          <GitHubConfigForm
            open={isConfigDialogOpen}
            onOpenChange={setIsConfigDialogOpen}
            projectId={editingConfig?.projectId || 0}
            config={editingConfig}
          />
        </div>
      </div>
    </MainLayout>
  );
}