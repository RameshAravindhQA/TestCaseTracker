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
import { Bug, TestCase, Module, FileAttachment, Tag } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { EnhancedFileUpload } from "@/components/ui/enhanced-file-upload";
import { TagInput } from "@/components/test-cases/tag-input";
import { TagFilter } from "@/components/test-cases/tag-filter";
import { useEffect, useState } from "react";

const bugSchema = z.object({
  bugId: z.string().optional(),
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  severity: z.enum(["Critical", "Major", "Minor", "Trivial"]),
  priority: z.enum(["High", "Medium", "Low"]),
  environment: z.string().optional().nullable(),
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]),
  preConditions: z.string().optional().nullable(),
  stepsToReproduce: z.string().min(3, { message: "Steps to reproduce must be at least 3 characters" }),
  expectedResult: z.string().min(3, { message: "Expected result must be at least 3 characters" }),
  actualResult: z.string().min(3, { message: "Actual result must be at least 3 characters" }),
  comments: z.string().optional().nullable(),
  moduleId: z.number().optional().nullable(),
  testCaseId: z.number().optional().nullable(),
  assignedToId: z.number().optional().nullable(),
  // More flexible tag handling that accepts different formats and handles nulls
  tags: z.union([
    z.array(z.object({
      id: z.union([z.string(), z.number()]).optional(),
      name: z.string(),
      color: z.string().optional().default("#3b82f6"),
      projectId: z.number().optional(),
      createdAt: z.union([z.string(), z.date()]).optional(),
    })),
    z.null(),
    z.undefined()
  ]).transform(val => val || []),
  // Remove validation for attachments - any array is acceptable
  attachments: z.any().optional().default([]),
});

type BugFormValues = z.infer<typeof bugSchema>;

interface BugFormProps {
  bug?: Bug;
  projectId: number;
  testCase?: TestCase;
  module?: Module;
  modules?: Module[];
  onSuccess?: () => void;
}

export function BugForm({ bug, projectId, testCase, module, modules, onSuccess }: BugFormProps) {
  const { toast } = useToast();
  const isEditing = !!bug;
  
  // New state for tag creation
  const [isTagCreatorOpen, setIsTagCreatorOpen] = useState(false);
  const [newTags, setNewTags] = useState<Tag[]>([]);
  
  // Listen for tag creator events
  useEffect(() => {
    const handleOpenTagCreator = () => {
      setIsTagCreatorOpen(true);
    };
    
    window.addEventListener('openTagCreator', handleOpenTagCreator);
    
    return () => {
      window.removeEventListener('openTagCreator', handleOpenTagCreator);
    };
  }, []);

  // Fetch modules if not provided
  const { data: fetchedModules } = useQuery<Module[]>({
    queryKey: [`/api/projects/${projectId}/modules`],
    enabled: !modules && !module,
  });

  const finalModules: Module[] = modules || fetchedModules || [];

  const form = useForm<BugFormValues>({
    resolver: zodResolver(bugSchema),
    defaultValues: {
      bugId: bug?.bugId || "",
      title: bug?.title || "",
      severity: bug?.severity || "Major",
      priority: bug?.priority || "Medium",
      environment: bug?.environment || "",
      status: bug?.status || "Open",
      preConditions: bug?.preConditions || testCase?.preConditions || "",
      stepsToReproduce: bug?.stepsToReproduce || testCase?.testSteps || "",
      expectedResult: bug?.expectedResult || testCase?.expectedResult || "",
      actualResult: bug?.actualResult || testCase?.actualResult || "",
      comments: bug?.comments || "",
      moduleId: bug?.moduleId || testCase?.moduleId || module?.id || null,
      testCaseId: bug?.testCaseId || testCase?.id || null,
      assignedToId: bug?.assignedToId || null,
      tags: bug?.tags || [],
      attachments: bug?.attachments || [],
    },
  });

  const createBugMutation = useMutation({
    mutationFn: async (data: BugFormValues) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/bugs`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bug reported",
        description: "Your bug has been reported successfully. All information has been saved to the system.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bugs`] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to report bug",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const updateBugMutation = useMutation({
    mutationFn: async (data: BugFormValues) => {
      const res = await apiRequest("PUT", `/api/bugs/${bug?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Changes saved",
        description: "The bug has been updated successfully. Your changes have been saved to the system.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bugs`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to update bug",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BugFormValues) => {
    if (isEditing) {
      updateBugMutation.mutate(data);
    } else {
      createBugMutation.mutate(data);
    }
  };

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="max-h-[70vh] overflow-y-auto pr-4 pb-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bug Title</FormLabel>
                <FormControl>
                  <Input placeholder="Brief description of the bug" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                      <SelectItem value="Minor">Minor</SelectItem>
                      <SelectItem value="Trivial">Trivial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="environment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Environment</FormLabel>
                <FormControl>
                  <Input placeholder="Browser, OS, device, etc." {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditing && (
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
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="preConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pre-Conditions</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Prerequisites needed before reproducing the bug" 
                    rows={2}
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
            name="stepsToReproduce"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Steps to Reproduce</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="1. Navigate to login page&#10;2. Enter invalid credentials&#10;3. Click login button" 
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedResult"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Result</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="What should have happened" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actualResult"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Result</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="What actually happened" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {finalModules.length > 0 && (
            <FormField
              control={form.control}
              name="moduleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    defaultValue={field.value?.toString()}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a module (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {finalModules.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comments</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any additional notes or comments" 
                    rows={2}
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
            name="tags"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Tags</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTagCreatorOpen(true)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    + Create New Tag
                  </Button>
                </div>
                <FormControl>
                  <TagFilter
                    selectedTags={field.value || []}
                    onTagSelect={field.onChange}
                    projectId={projectId}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="attachments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attachments & Media</FormLabel>
                <FormControl>
                  <EnhancedFileUpload
                    value={field.value as FileAttachment[]}
                    onChange={field.onChange}
                    maxFiles={10}
                    maxSize={50 * 1024 * 1024} // 50MB
                    screenshotRequired={false} // Make screenshot optional
                    isCopyMode={!isEditing && !!bug} // Enable copy mode for "Make as Copy" scenario
                    copySourceId={bug?.id} // Source bug ID to copy attachments from
                    entityType="bug"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button 
            type="submit" 
            disabled={createBugMutation.isPending || updateBugMutation.isPending}
          >
            {isEditing 
              ? (updateBugMutation.isPending ? "Updating..." : "Update Bug") 
              : (createBugMutation.isPending ? "Reporting..." : "Report Bug")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
    
    {/* Tag Creator Dialog */}
    <Dialog open={isTagCreatorOpen} onOpenChange={setIsTagCreatorOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Tags</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <TagInput
            tags={newTags}
            onChange={setNewTags}
            max={10}
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsTagCreatorOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Save tags to backend
              if (newTags.length > 0) {
                const createTagsMutation = async () => {
                  try {
                    // Create tags on the server - prepare valid tags for API
                    const validTags = newTags.map(tag => ({
                      name: tag.name,
                      color: tag.color
                    }));
                    
                    const response = await fetch(
                      `/api/projects/${projectId}/tags`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(validTags)
                      }
                    );
                    
                    if (response.ok) {
                      const savedTags = await response.json();
                      
                      // Update form with new tags
                      const currentTags = form.getValues("tags") || [];
                      form.setValue("tags", [...currentTags, ...savedTags]);
                      
                      // Invalidate tags cache
                      queryClient.invalidateQueries({ 
                        queryKey: [`/api/projects/${projectId}/tags`]
                      });
                      
                      // Reset new tags
                      setNewTags([]);
                      
                      // Close dialog
                      setIsTagCreatorOpen(false);
                      
                      // Show success message
                      toast({
                        title: "Tags created",
                        description: `${savedTags.length} ${savedTags.length === 1 ? 'tag has' : 'tags have'} been created successfully.`,
                      });
                      
                      // Dispatch event to notify other components that tags were updated
                      window.dispatchEvent(new Event('tagsUpdated'));
                    } else {
                      throw new Error("Failed to create tags");
                    }
                  } catch (error) {
                    toast({
                      title: "Failed to create tags",
                      description: `${error}`,
                      variant: "destructive",
                    });
                  }
                };
                
                createTagsMutation();
              } else {
                setIsTagCreatorOpen(false);
              }
            }}
          >
            Save Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}