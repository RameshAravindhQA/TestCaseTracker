import { useState, useEffect } from "react";
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
import { TestCase, Module, Tag } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TagInput } from "./tag-input";
import { TagFilter } from "./tag-filter";
import { TestCaseTags } from "./test-case-tags";

// More flexible tag schema that matches various formats
const tagSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string(),
  color: z.string().optional().default("#3b82f6"),
  projectId: z.number().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

const testCaseSchema = z.object({
  testCaseId: z.string().optional(),
  moduleId: z.number(),
  feature: z.string().min(3, { message: "Feature name must be at least 3 characters" }),
  testObjective: z.string().min(3, { message: "Test objective must be at least 3 characters" }),
  preConditions: z.string().optional().nullable(),
  testSteps: z.string().min(3, { message: "Test steps must be at least 3 characters" }),
  expectedResult: z.string().min(3, { message: "Expected result must be at least 3 characters" }),
  actualResult: z.string().optional().nullable(),
  status: z.enum(["Pass", "Fail", "Blocked", "Not Executed"]),
  priority: z.enum(["High", "Medium", "Low"]),
  comments: z.string().optional().nullable(),
  assignedToId: z.number().optional().nullable(),
  // More flexible tag handling that accepts nulls and converts to empty array
  tags: z.union([
    z.array(tagSchema),
    z.null(),
    z.undefined()
  ]).transform(val => val || []),
});

type TestCaseFormValues = z.infer<typeof testCaseSchema>;

interface TestCaseFormProps {
  testCase?: TestCase;
  projectId: number;
  module?: Module;
  modules?: Module[];
  onSuccess?: () => void;
}

export function TestCaseForm({ testCase, projectId, module, modules, onSuccess }: TestCaseFormProps) {
  const { toast } = useToast();
  const isEditing = !!testCase;
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

  const form = useForm<TestCaseFormValues>({
    resolver: zodResolver(testCaseSchema),
    defaultValues: {
      testCaseId: testCase?.testCaseId || "",
      moduleId: testCase?.moduleId || module?.id || (finalModules[0]?.id || 0),
      feature: testCase?.feature || "",
      testObjective: testCase?.testObjective || "",
      preConditions: testCase?.preConditions || "",
      testSteps: testCase?.testSteps || "",
      expectedResult: testCase?.expectedResult || "",
      actualResult: testCase?.actualResult || "",
      status: testCase?.status || "Not Executed",
      priority: testCase?.priority || "Medium",
      comments: testCase?.comments || "",
      assignedToId: testCase?.assignedToId || null,
      tags: (testCase?.tags as Tag[]) || [],
    },
  });

  const createTestCaseMutation = useMutation({
    mutationFn: async (data: TestCaseFormValues) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/test-cases`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Case created",
        description: "Your test case has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to create test case",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const updateTestCaseMutation = useMutation({
    mutationFn: async (data: TestCaseFormValues) => {
      const res = await apiRequest("PUT", `/api/test-cases/${testCase?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Case updated",
        description: "Your test case has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to update test case",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TestCaseFormValues) => {
    if (isEditing) {
      updateTestCaseMutation.mutate(data);
    } else {
      createTestCaseMutation.mutate(data);
    }
  };

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-full">
        <div className="max-h-[70vh] overflow-y-auto pr-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="testCaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Case ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Auto-generated" 
                      {...field}
                      disabled={true} 
                      value={field.value || "Auto-generated"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature</FormLabel>
                  <FormControl>
                    <Input placeholder="Login, Checkout, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="moduleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {finalModules.map((m: Module) => (
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

          <FormField
            control={form.control}
            name="testObjective"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Objective</FormLabel>
                <FormControl>
                  <Input placeholder="What are you testing?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pre-Conditions</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Prerequisites needed before test execution" 
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
            name="testSteps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Steps</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="1. Navigate to login page&#10;2. Enter valid credentials&#10;3. Click login button" 
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
                    placeholder="What should happen if test passes?" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditing && (
            <FormField
              control={form.control}
              name="actualResult"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Result</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What actually happened during testing?" 
                      rows={2}
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <SelectItem value="Not Executed">Not Executed</SelectItem>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
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

        </div>
        <DialogFooter className="mt-4">
          <Button 
            type="submit" 
            disabled={createTestCaseMutation.isPending || updateTestCaseMutation.isPending}
          >
            {isEditing 
              ? (updateTestCaseMutation.isPending ? "Updating..." : "Update Test Case") 
              : (createTestCaseMutation.isPending ? "Creating..." : "Create Test Case")}
          </Button>
        </DialogFooter>
      </form>
    </Form>

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