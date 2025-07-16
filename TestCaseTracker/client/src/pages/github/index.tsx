import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, Github, Plus, Settings, Trash2, CheckCircle, AlertCircle, Info, ExternalLink } from "lucide-react";
import { GitHubConfigForm } from "@/components/github/github-config-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface GitHubIntegration {
  id: number;
  projectId: number;
  projectName: string;
  repoUrl: string;
  accessToken: string;
  webhookUrl?: string;
  isEnabled: boolean;
  createdAt: string;
  connectionStatus?: 'connected' | 'error' | 'testing' | 'unknown';
}

export default function GitHubIntegrationPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<GitHubIntegration | null>(null);

  const { toast } = useToast();

  // Fetch GitHub integrations
  const { data: integrations, isLoading } = useQuery(
    ['/api/github/integrations'],
    async () => {
      const response = await fetch('/api/github/integrations', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub integrations');
      }
      return response.json();
    }
  );

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (integration: GitHubIntegration) => {
      const response = await fetch('/api/github/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          repoUrl: integration.repoUrl,
          accessToken: integration.accessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Connection test failed');
      }

      return response.json();
    },
    onSuccess: (data, integration) => {
      toast({
        title: "Connection Test Successful",
        description: `Successfully connected to ${integration.repoUrl}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github/integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/github/integrations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete integration');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GitHub integration deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github/integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">GitHub Integration</h1>
            <p className="text-muted-foreground">
              Connect your projects to GitHub repositories for automated issue tracking and documentation.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        </div>

        {/* GitHub Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              GitHub Integration Information
            </CardTitle>
            <CardDescription>
              Learn how to set up and use GitHub integration effectively
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Prerequisites:</strong> You need a GitHub Personal Access Token with repository access to connect your projects.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Features</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Automatic issue creation from bug reports</li>
                  <li>• Sync test case status with GitHub issues</li>
                  <li>• Webhook integration for real-time updates</li>
                  <li>• Link commits to test cases</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Setup Guide</h4>
                <ol className="text-sm space-y-1 text-muted-foreground">
                  <li>1. Create a GitHub Personal Access Token</li>
                  <li>2. Grant repository and issues permissions</li>
                  <li>3. Add integration with repository URL</li>
                  <li>4. Test connection to verify setup</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  GitHub Token Guide
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Integrations List */}
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <Card className="col-span-3">
              <CardContent>Loading integrations...</CardContent>
            </Card>
          ) : integrations?.length === 0 ? (
            <Card className="col-span-3">
              <CardContent>No GitHub integrations found.</CardContent>
            </Card>
          ) : (
            integrations?.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <CardTitle>{integration.projectName}</CardTitle>
                  <CardDescription>{integration.repoUrl}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnectionMutation.mutate(integration)}
                          disabled={testConnectionMutation.isPending}
                        >
                          {testConnectionMutation.isPending ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Test Connection
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingIntegration(integration);
                            setShowAddForm(true);
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteIntegrationMutation.mutate(integration.id)}
                          disabled={deleteIntegrationMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add/Edit GitHub Integration Form */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
            <div className="flex items-center justify-center min-h-screen">
              <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">
                  {editingIntegration ? 'Edit GitHub Integration' : 'Add GitHub Integration'}
                </h2>
                <GitHubConfigForm
                  editingIntegration={editingIntegration}
                  onClose={() => {
                    setShowAddForm(false);
                    setEditingIntegration(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}