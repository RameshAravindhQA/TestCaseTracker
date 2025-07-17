import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { DialogFooter } from "@/components/ui/dialog";

const projectSchema = z.object({
  name: z.string().min(1, { message: "Project name is required" }).max(100, { message: "Project name must be less than 100 characters" }),
  description: z.string().optional(),
  status: z.enum(["Active", "Completed", "On Hold"]),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
  onSuccess?: () => void;
}

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const { toast } = useToast();
  const isEditing = !!project;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      status: project?.status || "Active",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating project with data:', data);
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Project creation error:', error);
      toast({
        title: "Failed to create project",
        description: error.message || "An error occurred while creating the project",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const res = await apiRequest("PUT", `/api/projects/${project?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project?.id}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to update project",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    try {
      // Auto-generate prefix from project name (first 3 letters, uppercase)
      const cleanName = data.name.replace(/[^a-zA-Z]/g, '');
      let prefix = cleanName.substring(0, 3).toUpperCase();

      // If we don't have 3 letters, pad with 'X' or use 'DEF' if completely empty
      if (prefix.length === 0) {
        prefix = 'DEF';
      } else if (prefix.length < 3) {
        prefix = prefix.padEnd(3, 'X');
      }

      const formattedData = {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        status: data.status,
        prefix,
      };

      console.log('Submitting project with prefix:', prefix, 'for project:', data.name);

      if (isEditing) {
        updateProjectMutation.mutate(formattedData);
      } else {
        createProjectMutation.mutate(formattedData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Form Error",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="E-Commerce Website Redesign" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the project" 
                  rows={3}
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button 
            type="submit" 
            disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
          >
            {isEditing 
              ? (updateProjectMutation.isPending ? "Updating..." : "Update Project") 
              : (createProjectMutation.isPending ? "Creating..." : "Create Project")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}