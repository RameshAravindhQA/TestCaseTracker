
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, TestTube } from "lucide-react";

const githubConfigSchema = z.object({
  projectId: z.number().min(1, "Please select a project"),
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
  projectId?: number;
  config?: any;
}

export function GitHubConfigForm({ open, onOpenChange, projectId, config }: GitHubConfigFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<GitHubConfigFormData>({
    resolver: zodResolver(githubConfigSchema),
    defaultValues: {
      projectId: projectId || config?.projectId || 0,
      repoOwner: config?.repoOwner || "",
      repoName: config?.repoName || "",
      accessToken: config?.accessToken || "",
      webhookSecret: config?.webhookSecret || "",
      isActive: config?.isActive !== undefined ? config.isActive : true,
    },
  });

  // Fetch projects for the dropdown
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

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: Partial<GitHubConfigFormData>) => {
      const response = await fetch('/api/github/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          accessToken: data.accessToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Connection test failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Successful",
        description: "GitHub repository connection is working correctly",
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

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: GitHubConfigFormData) => {
      const url = config ? `/api/github/config/${config.id}` : '/api/github/config';
      const method = config ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save configuration');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: config ? "Configuration Updated" : "Configuration Created",
        description: config ? "GitHub integration updated successfully" : "GitHub integration created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['github-configs'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GitHubConfigFormData) => {
    saveConfigMutation.mutate(data);
  };

  const handleTestConnection = () => {
    const formData = form.getValues();
    if (!formData.repoOwner || !formData.repoName || !formData.accessToken) {
      toast({
        title: "Missing Information",
        description: "Please fill in repository owner, name, and access token before testing",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate(formData);
  };

  // Reset form when dialog opens/closes or config changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        projectId: projectId || config?.projectId || 0,
        repoOwner: config?.repoOwner || "",
        repoName: config?.repoName || "",
        accessToken: config?.accessToken || "",
        webhookSecret: config?.webhookSecret || "",
        isActive: config?.isActive !== undefined ? config.isActive : true,
      });
    }
  }, [open, config, projectId, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {config ? "Edit GitHub Integration" : "Setup GitHub Integration"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="repoOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository Owner</FormLabel>
                    <FormControl>
                      <Input placeholder="username or organization" {...field} />
                    </FormControl>
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
            </div>

            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Access Token</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="ghp_xxxxxxxxxxxx" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Personal access token with repository access permissions
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
                      placeholder="Webhook secret for security" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional secret for webhook validation
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

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnectionMutation.isPending}
                className="flex-1"
              >
                {testConnectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
              
              <Button
                type="submit"
                disabled={saveConfigMutation.isPending}
                className="flex-1"
              >
                {saveConfigMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {config ? "Update" : "Create"} Integration
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
