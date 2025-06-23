
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GitHubIssueButtonProps {
  bug: any;
  projectId: number;
}

export function GitHubIssueButton({ bug, projectId }: GitHubIssueButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Check if GitHub is configured for this project
  const { data: githubConfig } = useQuery({
    queryKey: ['github-config', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/github/config/${projectId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch GitHub config');
      return response.json();
    },
  });

  // Check if issue already exists for this bug
  const { data: existingIssue } = useQuery({
    queryKey: ['github-issue', bug.id],
    queryFn: async () => {
      const response = await fetch(`/api/github/issues/bug/${bug.id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch GitHub issue');
      return response.json();
    },
    enabled: !!githubConfig,
  });

  const createIssueMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bugId: bug.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create GitHub issue');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "GitHub Issue Created",
        description: `Issue #${data.githubIssueNumber} created successfully`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(data.githubUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        ),
      });
      queryClient.invalidateQueries({ queryKey: ['github-issue', bug.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Issue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncIssueMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/github/issues/${existingIssue.id}/sync`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync GitHub issue');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue Synced",
        description: "GitHub issue status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['github-issue', bug.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!githubConfig || !githubConfig.isActive) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled>
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>GitHub integration not configured for this project</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (existingIssue) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(existingIssue.githubUrl, '_blank')}
        >
          <Github className="h-4 w-4 mr-2" />
          Issue #{existingIssue.githubIssueNumber}
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => syncIssueMutation.mutate()}
                disabled={syncIssueMutation.isPending}
              >
                <AlertCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync issue status with GitHub</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirmDialog(true)}
        disabled={createIssueMutation.isPending}
      >
        <Github className="h-4 w-4 mr-2" />
        {createIssueMutation.isPending ? "Creating..." : "Create Issue"}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create GitHub Issue</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new issue in the configured GitHub repository for bug "{bug.title}".
              The issue will include all bug details and be automatically linked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                createIssueMutation.mutate();
                setShowConfirmDialog(false);
              }}
            >
              Create Issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
