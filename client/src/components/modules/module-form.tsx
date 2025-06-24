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
import { Module } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { DialogFooter } from "@/components/ui/dialog";

const moduleSchema = z.object({
  name: z.string().min(3, { message: "Module name must be at least 3 characters" }),
  description: z.string().optional(),
  status: z.enum(["Active", "Completed", "On Hold"]),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

interface ModuleFormProps {
  module?: Module;
  projectId: number;
  onSuccess?: () => void;
}

export function ModuleForm({ module, projectId, onSuccess }: ModuleFormProps) {
  const { toast } = useToast();
  const isEditing = !!module;

  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: module?.name || "",
      description: module?.description || "",
      status: module?.status || "Active",
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/modules`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Module created",
        description: "Your module has been created successfully.",
      });
      // Store the project ID in localStorage for persistence
      localStorage.setItem('modules_selectedProjectId', JSON.stringify(projectId));

      // Ensure we preserve the search query
      const savedQuery = localStorage.getItem('modules_searchQuery') || "";
      localStorage.setItem('modules_searchQuery', savedQuery);

      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/modules`] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to create module",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const res = await apiRequest("PUT", `/api/modules/${module?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Module updated",
        description: "Your module has been updated successfully.",
      });
      // Store the project ID in localStorage for persistence
      localStorage.setItem('modules_selectedProjectId', JSON.stringify(projectId));

      // Ensure we preserve the search query
      const savedQuery = localStorage.getItem('modules_searchQuery') || "";
      localStorage.setItem('modules_searchQuery', savedQuery);

      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/modules`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to update module",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ModuleFormValues) => {
    if (isEditing) {
      updateModuleMutation.mutate(data);
    } else {
      createModuleMutation.mutate(data);
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
              <FormLabel>Module Name</FormLabel>
              <FormControl>
                <Input placeholder="Authentication Module" {...field} />
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
                  placeholder="Brief description of the module" 
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
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module status">
                      {field.value && (
                        <div className="flex items-center">
                          <span 
                            className={`h-2 w-2 rounded-full mr-2 ${
                              field.value === "Active" 
                                ? "bg-blue-500" 
                                : field.value === "Completed" 
                                ? "bg-green-500" 
                                : "bg-yellow-500"
                            }`}
                          />
                          {field.value}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full mr-2 bg-blue-500"></span>
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="Completed">
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full mr-2 bg-green-500"></span>
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="On Hold">
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full mr-2 bg-yellow-500"></span>
                      On Hold
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button 
            type="submit" 
            disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
          >
            {isEditing 
              ? (updateModuleMutation.isPending ? "Updating..." : "Update Module") 
              : (createModuleMutation.isPending ? "Creating..." : "Create Module")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}