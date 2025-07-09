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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

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

interface TestCaseSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  projectId: number;
  onTestCaseSelect?: (testCase: TestCase | null) => void;
}

function TestCaseSelector({ value, onChange, projectId, onTestCaseSelect }: TestCaseSelectorProps) {
  const { data: testCases } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${projectId}/test-cases`],
  });

  const selectedTestCase = testCases?.find(tc => tc.id === value);

  return (
    <div className="space-y-2">
      <Select
        value={value?.toString() || ""}
        onValueChange={(val) => {
          const testCaseId = val === "none" ? null : parseInt(val);
          onChange(testCaseId);
          const testCase = testCases?.find(tc => tc.id === testCaseId);
          onTestCaseSelect?.(testCase || null);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a test case to link (optional)" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value="none">No test case mapping</SelectItem>
          {testCases?.map((testCase) => (
            <SelectItem key={testCase.id} value={testCase.id.toString()}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {testCase.testCaseId}
                  </span>
                  <span className="truncate max-w-[200px]">{testCase.feature}</span>
                </div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button 
                      type="button"
                      className="ml-2 text-blue-500 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" side="left">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{testCase.testCaseId}</Badge>
                        <Badge variant={testCase.status === "Pass" ? "default" : testCase.status === "Fail" ? "destructive" : "secondary"}>
                          {testCase.status}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{testCase.feature}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{testCase.testObjective}</p>
                      </div>
                      {testCase.preConditions && (
                        <div>
                          <span className="text-xs font-medium">Pre-conditions:</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{testCase.preConditions}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-medium">Priority:</span>
                        <Badge variant="outline" className="ml-1 text-xs">{testCase.priority}</Badge>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTestCase && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Linked to: {selectedTestCase.testCaseId}
            </span>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
            <div><strong>Feature:</strong> {selectedTestCase.feature}</div>
            <div><strong>Objective:</strong> {selectedTestCase.testObjective}</div>
            <div><strong>Status:</strong> {selectedTestCase.status}</div>
            <div><strong>Priority:</strong> {selectedTestCase.priority}</div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2 italic">
            Related fields will be auto-populated from this test case.
          </p>
        </div>
      )}
    </div>
  );
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
                <div className="flex items-center gap-2">
                  <FormLabel>Pre-Conditions</FormLabel>
                  {testCase && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      From Test Case
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Textarea 
                    placeholder="Prerequisites needed before reproducing the bug" 
                    rows={2}
                    {...field} 
                    value={field.value || ""}
                    className={testCase ? "border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800" : ""}
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
                <div className="flex items-center gap-2">
                  <FormLabel>Steps to Reproduce</FormLabel>
                  {testCase && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      From Test Case
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Textarea 
                    placeholder="1. Navigate to login page&#10;2. Enter invalid credentials&#10;3. Click login button" 
                    rows={4}
                    {...field}
                    className={testCase ? "border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800" : ""}
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
                <div className="flex items-center gap-2">
                  <FormLabel>Expected Result</FormLabel>
                  {testCase && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      From Test Case
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Textarea 
                    placeholder="What should have happened" 
                    rows={2}
                    {...field}
                    className={testCase ? "border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800" : ""}
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

          {/* Test Case Mapping Section */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FormLabel className="text-base font-semibold">Test Case Mapping</FormLabel>
                <div className="group relative">
                  <button type="button" className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Map this bug to an existing test case to auto-fill details
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("testCaseId", null);
                  form.setValue("moduleId", null);
                  form.setValue("preConditions", "");
                  form.setValue("stepsToReproduce", "");
                  form.setValue("expectedResult", "");
                }}
                className="text-xs px-2 py-1 h-auto"
              >
                Clear Mapping
              </Button>
            </div>

            {testCase ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Mapped to Test Case: {testCase.testCaseId}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <div><strong>Feature:</strong> {testCase.feature}</div>
                  <div><strong>Objective:</strong> {testCase.testObjective}</div>
                  {testCase.module && <div><strong>Module:</strong> {testCase.module.name}</div>}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can link this bug to a test case to automatically populate related fields, or create a standalone bug report.
                </p>
                
                {/* Test Case Selection */}
                <FormField
                  control={form.control}
                  name="testCaseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Link to Test Case (Optional)</FormLabel>
                      <TestCaseSelector
                        value={field.value}
                        onChange={field.onChange}
                        projectId={projectId}
                        onTestCaseSelect={(selectedTestCase) => {
                          if (selectedTestCase) {
                            form.setValue("moduleId", selectedTestCase.moduleId);
                            form.setValue("preConditions", selectedTestCase.preConditions || "");
                            form.setValue("stepsToReproduce", selectedTestCase.testSteps || "");
                            form.setValue("expectedResult", selectedTestCase.expectedResult || "");
                          }
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
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