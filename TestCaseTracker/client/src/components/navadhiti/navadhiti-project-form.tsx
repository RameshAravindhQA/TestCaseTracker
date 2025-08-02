
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { DialogFooter } from "@/components/ui/dialog";

const navadhitiProjectSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  overallProjectActivity: z.string().optional(),
  currentSprint: z.string().optional(),
  currentIssues: z.string().optional(),
  weeklyComms: z.string().optional(),
  immediateActionItems: z.string().optional(),
  supportRequired: z.string().optional(),
  additionalRemarks: z.string().optional(),
  activityStatus: z.number().min(0).max(100).default(0),
  sprintStatus: z.number().min(0).max(100).default(0),
  communicationStatus: z.number().min(0).max(100).default(0),
});

type NavadhitiProjectFormValues = z.infer<typeof navadhitiProjectSchema>;

interface NavadhitiProjectFormProps {
  project?: any;
  onSuccess?: () => void;
}

export function NavadhitiProjectForm({ project, onSuccess }: NavadhitiProjectFormProps) {
  const { toast } = useToast();
  const isEditing = !!project;

  const form = useForm<NavadhitiProjectFormValues>({
    resolver: zodResolver(navadhitiProjectSchema),
    defaultValues: {
      projectName: project?.projectName || "",
      overallProjectActivity: project?.overallProjectActivity || "",
      currentSprint: project?.currentSprint || "",
      currentIssues: project?.currentIssues || "",
      weeklyComms: project?.weeklyComms || "",
      immediateActionItems: project?.immediateActionItems || "",
      supportRequired: project?.supportRequired || "",
      additionalRemarks: project?.additionalRemarks || "",
      activityStatus: project?.activityStatus || 0,
      sprintStatus: project?.sprintStatus || 0,
      communicationStatus: project?.communicationStatus || 0,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: NavadhitiProjectFormValues) => {
      const res = await apiRequest("POST", "/api/navadhiti-projects", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Project created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: NavadhitiProjectFormValues) => {
      const res = await apiRequest("PUT", `/api/navadhiti-projects/${project?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Project updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    },
  });

  const onSubmit = (data: NavadhitiProjectFormValues) => {
    if (isEditing) {
      updateProjectMutation.mutate(data);
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const getStatusColor = (value: number) => {
    if (value === 100) return "text-green-600";
    if (value >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="projectName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter project name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="overallProjectActivity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overall Project Activity</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe current project activities..."
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
            name="currentSprint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Sprint</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Current sprint details..."
                    rows={3}
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="currentIssues"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Issues (Major challenges or risks)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe any major challenges or risks..."
                  rows={3}
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weeklyComms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weekly Communications</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Weekly communication updates..."
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
            name="immediateActionItems"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Immediate Action Items</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="List immediate action items..."
                    rows={3}
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="supportRequired"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Support Required (Specific requests from stakeholders)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe any support needed from stakeholders..."
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
          name="additionalRemarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Remarks / Inputs</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional remarks or inputs..."
                  rows={3}
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Sliders */}
        <div className="space-y-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Status Tracking</h3>
          
          <FormField
            control={form.control}
            name="activityStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex justify-between">
                  <span>Overall Project Activity Status</span>
                  <span className={`font-bold ${getStatusColor(field.value)}`}>
                    {field.value}%
                  </span>
                </FormLabel>
                <FormControl>
                  <Slider
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sprintStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex justify-between">
                  <span>Current Sprint Status</span>
                  <span className={`font-bold ${getStatusColor(field.value)}`}>
                    {field.value}%
                  </span>
                </FormLabel>
                <FormControl>
                  <Slider
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="communicationStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex justify-between">
                  <span>Communication Status</span>
                  <span className={`font-bold ${getStatusColor(field.value)}`}>
                    {field.value}%
                  </span>
                </FormLabel>
                <FormControl>
                  <Slider
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
