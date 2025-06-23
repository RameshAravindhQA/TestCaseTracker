
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const githubConfigSchema = z.object({
  repoOwner: z.string().min(1, "Repository owner is required"),
  repoName: z.string().min(1, "Repository name is required"),
  accessToken: z.string().min(1, "GitHub access token is required"),
  webhookSecret: z.string().optional(),
  isActive: z.boolean().default(true),
});

type GitHubConfigFormData = z.infer<typeof githubConfigSchema>;

interface GitHubConfigFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  config?: any;
}

export function GitHubConfigForm({
  open,
  onOpenChange,
  projectId,
  config,
}: GitHubConfigFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<GitHubConfigFormData>({
    resolver: zodResolver(githubConfigSchema),
    defaultValues: {
      repoOwner: config?.repoOwner || "",
      repoName: config?.repoName || "",
      accessToken: config?.accessToken || "",
      webhookSecret: config?.webhookSecret || "",
      isActive: config?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: GitHubConfigFormData) => {
      const url = config 
        ? `/api/github/config/${config.id}`
        : `/api/github/config`;
      
      const method = config ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save GitHub configuration');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: config 
          ? "GitHub configuration updated successfully" 
          : "GitHub configuration created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['github-config'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testConnection = useMutation({
    mutationFn: async (data: GitHubConfigFormData) => {
      const response = await fetch('/api/github/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Connection test failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GitHub connection test successful!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GitHubConfigFormData) => {
    mutation.mutate(data);
  };

  const handleTestConnection = () => {
    const formData = form.getValues();
    testConnection.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Update' : 'Configure'} GitHub Integration
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="repoOwner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="github-username or org-name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The GitHub username or organization name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repoName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository Name</FormLabel>
                  <FormControl>
                    <Input placeholder="repository-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Access Token</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Personal access token with 'repo' and 'issues' permissions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Secret (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="webhook-secret" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Secret for validating GitHub webhooks
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Integration</FormLabel>
                    <FormDescription>
                      Allow creating GitHub issues from bugs
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnection.isPending}
                className="flex-1"
              >
                {testConnection.isPending ? "Testing..." : "Test Connection"}
              </Button>
              
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending 
                  ? "Saving..." 
                  : config 
                    ? "Update" 
                    : "Save"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
