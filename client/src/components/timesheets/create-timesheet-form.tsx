import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Plus, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { InlineNavadhitiLoader } from "@/components/ui/navadhiti-loader";

// Form schema
const timeSheetFormSchema = z.object({
  userId: z.number(),
  projectId: z.union([
    z.number({
      required_error: "Project is required",
      invalid_type_error: "Project must be a number",
    }).positive("Project ID must be a positive number")
      .max(2147483647, "Project ID must be a valid database ID"),
    z.string().min(1, "Project is required").transform(val => {
      // If it's a non-numeric project name, just return it as is
      // This allows free-form project names to be submitted
      const num = Number(val);
      if (isNaN(num)) {
        return val; // Return as string if not a valid number
      }

      // Otherwise, if it's a numeric string, validate and convert to number
      if (num <= 0) {
        console.error('Invalid project ID numeric value:', val);
        throw new Error("Project ID must be a positive number");
      }
      if (num > 2147483647) {
        console.error('Project ID too large:', val);
        return val; // Return as string if too large for DB integer
      }
      return num; // Return as number if valid
    })
  ]),
  customerId: z.number().optional(),
  moduleId: z.number().optional(),
  testCaseId: z.number().optional(),
  bugId: z.number().optional(),
  folderId: z.union([
    z.number({
      required_error: "Folder is required",
      invalid_type_error: "Folder must be a number",
    }).positive("Folder ID must be a positive number")
      .max(2147483647, "Folder ID must be a valid database ID"),
    z.string().min(1, "Folder is required").transform(val => {
      const num = Number(val);
      if (isNaN(num) || num <= 0) {
        throw new Error("Folder must be a valid positive number");
      }
      if (num > 2147483647) {
        throw new Error("Folder ID too large for database");
      }
      return num;
    })
  ]),
  description: z.string().min(3, "Description must be at least 3 characters"),
  workDate: z.string().min(1, "Date is required"),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  hours: z.number().min(0, "Hours must be at least 0").max(24, "Hours cannot exceed 24"),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  tags: z.array(z.string()).optional(),
});

type TimeSheetFormValues = z.infer<typeof timeSheetFormSchema>;

// Define Customer interface
interface Customer {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  createdById: number;
  createdAt: string;
}

// Define Project interface
interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdById: number;
  createdAt: string;
}

interface CreateTimesheetFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  selectedFolderId?: number | null;
}

export default function CreateTimesheetForm({ onSuccess, onCancel, selectedFolderId }: CreateTimesheetFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [filteredProjects, setFilteredProjects] = useState<Project[] | null>(null);

  // Form for creating a new timesheet
  const form = useForm<TimeSheetFormValues>({
    resolver: zodResolver(timeSheetFormSchema),
    defaultValues: {
      userId: user?.id,
      description: "",
      workDate: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      status: "Pending", // Default status for new timesheets
      folderId: selectedFolderId || undefined,
      // Make sure projectId is undefined by default to trigger selection requirement
      projectId: undefined,
    },
  });

  // Get all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Get all customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Define tag interface
  interface Tag {
    id: number;
    name: string;
    color: string;
    createdAt: string;
  }

  // Get all tags
  const { data: tags, isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  // Get all folders
  const { data: folders, isLoading: isLoadingFolders } = useQuery<TimeSheetFolder[]>({
    queryKey: ["/api/timesheet-folders"],
  });

  // Interface for TimeSheetFolder
  interface TimeSheetFolder {
    id: number;
    name: string;
    userId: number;
    parentId: number | null;
    path: string;
    createdAt: string;
    updatedAt?: string;
  }

  // Create timesheet mutation
  const createTimeSheetMutation = useMutation({
    mutationFn: async (data: TimeSheetFormValues) => {
      const res = await apiRequest("POST", "/api/timesheets", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "TimeSheet created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      form.reset();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create timesheet",
        variant: "destructive",
      });
    },
  });

  // Ensure a project is always selected when data is available
  useEffect(() => {
    if (projects && projects.length > 0) {
      // Always ensure a project is selected
      const currentProjectId = form.getValues("projectId");

      // Check if we need to select a project (either no project selected or invalid selection)
      if (!currentProjectId || 
          typeof currentProjectId === 'string' && (currentProjectId === '' || isNaN(Number(currentProjectId))) || 
          typeof currentProjectId === 'number' && (isNaN(currentProjectId) || currentProjectId <= 0)) {

        // Auto-select the first project
        const firstProject = projects[0];
        console.log('Auto-selecting first project on load:', firstProject.name, 'with ID:', firstProject.id);

        // Need to use setTimeout to ensure this runs after the form is fully initialized
        setTimeout(() => {
          // Set as string for consistency with our schema
          form.setValue("projectId", String(firstProject.id), { shouldValidate: true });
          console.log('Project set to:', String(firstProject.id), 'with type: string');

          // Set this in direct DOM value too if needed
          const projectSelect = document.querySelector('select[name="projectId"]') as HTMLSelectElement;
          if (projectSelect) {
            projectSelect.value = String(firstProject.id);
          }
        }, 10);
      }
    }
  }, [projects, form]);

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: { name: string; status: string }) => {
      const res = await apiRequest("POST", "/api/customers", {
        ...data,
        createdById: user?.id
      });
      return res.json();
    },
    onSuccess: (newCustomer) => {
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      // Update the customers list
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });

      // Set the customer in the form
      form.setValue("customerId", newCustomer.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  // Create project mutation for timesheet only (doesn't map to global projects)
  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; status: string; customerId?: number }) => {
      try {
        // Create a real project but mark it as a timesheet-specific project
        const res = await apiRequest("POST", "/api/timesheet-projects", {
          name: data.name,
          description: "Created for timesheet use",
          status: data.status,
          customerId: data.customerId ? Number(data.customerId) : undefined,
          createdById: user?.id ? Number(user.id) : undefined,
          isTimeSheetOnly: true // Server should store this flag to filter projects
        });
        return await res.json();
      } catch (error) {
        // If the API endpoint doesn't exist, fallback to the local approach
        console.warn("Timesheet projects API not implemented, using local fallback");
        const localProject = {
          id: Date.now(), // Use timestamp as unique ID to avoid conflicts
          name: data.name,
          description: "Created for timesheet use",
          status: data.status,
          customerId: data.customerId,
          createdById: user?.id,
          createdAt: new Date().toISOString(),
          isTimeSheetOnly: true 
        };

        // Store in a separate timesheet projects cache
        const existingTsProjects = queryClient.getQueryData(["timesheet-projects"]) || [];
        queryClient.setQueryData(["timesheet-projects"], [...existingTsProjects, localProject]);

        return localProject;
      }
    },
    onSuccess: (newProject) => {
      toast({
        title: "Success",
        description: "Project added to timesheet",
      });

      // Set the project in the form
      if (newProject && newProject.id) {
        // Store projectId as string for consistency with our schema
        form.setValue("projectId", String(newProject.id));
        // Update filtered projects if needed
        if (filteredProjects) {
          setFilteredProjects(prev => prev ? [...prev, newProject] : [newProject]);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      // Need to provide all required fields for tag creation
      const projectId = form.getValues("projectId");
      if (!projectId) {
        throw new Error("Please select a project first before adding a tag");
      }
      const res = await apiRequest("POST", "/api/tags", {
        name: data.name,
        color: "#3B82F6", // Default blue color
        projectId: projectId
      });
      return res.json();
    },
    onSuccess: (newTag) => {
      toast({
        title: "Success",
        description: "Tag created successfully",
      });
      // Update the tags list
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });

      // Add the tag to the current tags in form
      const currentTags = form.getValues("tags") || [];

      // Extract the tag name properly based on the response type
      let tagName = '';
      if (typeof newTag === 'string') {
        tagName = newTag;
      } else if (newTag && typeof newTag === 'object') {
        // If it's an object with a name property, use that
        if (newTag.name && typeof newTag.name === 'string') {
          tagName = newTag.name;
        } else {
          // As a fallback, safely convert to string
          try {
            tagName = String(newTag.name || newTag.id || 'New Tag');
          } catch (e) {
            tagName = 'New Tag';
          }
        }
      } else {
        // Fallback for any other case
        tagName = 'New Tag';
      }

      // Add the tag name to form
      form.setValue("tags", [...currentTags, tagName]);

      // Log for debugging
      console.log('Added tag to form:', tagName, 'Current tags:', [...currentTags, tagName]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tag",
        variant: "destructive",
      });
    },
  });

  // Calculate hours when start time or end time changes
  const calculateHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;

    // Validate time format
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      console.error('Invalid time format in calculateHours:', { startTime, endTime });
      return 0; // Return 0 for invalid inputs
    }

    try {
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);

      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid date objects created from times:', { startTime, endTime, start, end });
        return 0;
      }

      // Handle case where end time is before start time (next day)
      let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (diff < 0) {
        // Add 24 hours if end time is on the next day
        diff += 24;
      }

      // Ensure result is within reasonable bounds (0-24 hours)
      const validDiff = Math.max(0, Math.min(diff, 24));

      // Round to nearest 0.5 hour
      return Math.round(validDiff * 2) / 2;
    } catch (error) {
      console.error('Error calculating hours:', error, { startTime, endTime });
      return 0;
    }
  };

  // Handle form submission for creating a timesheet
  const onSubmit = (data: TimeSheetFormValues) => {
    try {
      console.log('Form submission started with data:', data);

      // Validate description length
      if (data.description.length < 3) {
        throw new Error('Description must be at least 3 characters');
      }

      // Calculate hours if not provided
      if (!data.hours || data.hours === 0) {
        data.hours = calculateHours(data.startTime, data.endTime);
      }

      // Ensure date is valid
      if (data.workDate) {
        // Convert to string format if it's a Date object
        if (data.workDate instanceof Date) {
          data.workDate = data.workDate.toISOString().split('T')[0];
        } else if (typeof data.workDate === 'string') {
          // Validate the string date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(data.workDate)) {
            console.error('Invalid date format:', data.workDate);
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
          }
        }
      } else {
        // Default to today if no date provided
        data.workDate = new Date().toISOString().split('T')[0];
      }

      // Ensure time values are valid HH:MM format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

      // Process start time
      if (data.startTime) {
        // Handle Date objects
        if (data.startTime instanceof Date) {
          const hours = data.startTime.getHours().toString().padStart(2, '0');
          const minutes = data.startTime.getMinutes().toString().padStart(2, '0');
          data.startTime = `${hours}:${minutes}`;
        } else if (typeof data.startTime === 'string' && !timeRegex.test(data.startTime)) {
          console.error('Invalid start time format:', data.startTime);
          throw new Error('Start time must be in HH:MM format (e.g., 09:00)');
        }
      } else {
        // Set default
        data.startTime = "09:00";
      }

      // Process end time
      if (data.endTime) {
        // Handle Date objects
        if (data.endTime instanceof Date) {
          const hours = data.endTime.getHours().toString().padStart(2, '0');
          const minutes = data.endTime.getMinutes().toString().padStart(2, '0');
          data.endTime = `${hours}:${minutes}`;
        } else if (typeof data.endTime === 'string' && !timeRegex.test(data.endTime)) {
          console.error('Invalid end time format:', data.endTime);
          throw new Error('End time must be in HH:MM format (e.g., 17:00)');
        }
      } else {
        // Set default
        data.endTime = "17:00";
      }

      // Validate required fields first
      if (!data.projectId) {
        console.error('Missing required project ID');
        throw new Error('Please select a project');
      }

      if (!data.folderId) {
        console.error('Missing required folder ID');
        throw new Error('Please select a folder');
      }

      // Create a clean data object with proper types
      const formattedData: Record<string, any> = {};

      // Set user ID as a number
      if (!user?.id) {
        throw new Error('User is not authenticated');
      }
      formattedData.userId = Number(user.id);

      // Handle description
      formattedData.description = data.description.trim();

      // Handle work date
      formattedData.workDate = data.workDate;

      // Handle time values
      formattedData.startTime = data.startTime;
      formattedData.endTime = data.endTime;

      // Handle hours as a number
      formattedData.hours = Number(data.hours || 0);

      // Handle project ID (with our new schema, it should always be a string for consistency)
      // Convert any project ID to string format for storage
      if (data.projectId === null || data.projectId === undefined) {
        console.error('Missing project identifier');
        throw new Error('Project identifier is required');
      }

      // Convert to string to ensure consistent handling
      formattedData.projectId = String(data.projectId);

      // Log the project being used for debugging
      const numericId = Number(data.projectId);
      if (!isNaN(numericId)) {
        // Check if it exists in our projects list
        const selectedProject = (filteredProjects || projects)?.find(p => p.id === numericId);
        if (selectedProject) {
          console.log('Using existing project:', selectedProject.name, '(ID:', data.projectId, ')');
        } else {
          console.log('Using numeric project ID (no matching record):', data.projectId);
        }
      } else {
        // It's a non-numeric string (project name)
        console.log('Using project name:', data.projectId);
      }

      // Handle folder ID specifically
      const folderIdNum = Number(data.folderId);
      if (isNaN(folderIdNum) || folderIdNum <= 0) {
        console.error('Invalid folder ID format:', data.folderId);
        throw new Error('Invalid folder ID format');
      }
      formattedData.folderId = folderIdNum;

      // Verify folder exists
      const selectedFolder = folders?.find(f => f.id === folderIdNum);
      if (!selectedFolder) {
        console.error('Folder not found with ID:', folderIdNum);
        throw new Error(`Folder with ID ${folderIdNum} not found`);
      }
      console.log('Using folder:', selectedFolder);

      // Handle customer ID if present (as a number or undefined)
      if (data.customerId) {
        const customerIdNum = Number(data.customerId);
        if (!isNaN(customerIdNum) && customerIdNum > 0) {
          const selectedCustomer = customers?.find(c => c.id === customerIdNum);
          if (selectedCustomer) {
            formattedData.customerId = customerIdNum;
            console.log('Using customer:', selectedCustomer);
          } else {
            console.warn('Customer not found with ID:', customerIdNum);
            formattedData.customerId = undefined;
          }
        } else {
          formattedData.customerId = undefined;
        }
      } else {
        formattedData.customerId = undefined;
      }

      // Handle optional IDs
      formattedData.moduleId = data.moduleId || undefined;
      formattedData.testCaseId = data.testCaseId || undefined;
      formattedData.bugId = data.bugId || undefined;

      // Ensure hours is a valid number
      formattedData.hours = Math.min(Number(data.hours) || 0, 24);

      // Remove tags field since it's not in the server schema
      const { tags, ...dataWithoutTags } = formattedData;

      // Log the submission for debugging
      console.log('Final timesheet data to submit:', dataWithoutTags);

      // Submit the data
      createTimeSheetMutation.mutate(dataWithoutTags);
    } catch (error) {
      console.error('Error preparing timesheet data:', error);
      toast({
        title: "Data Error",
        description: error instanceof Error ? error.message : "There was a problem preparing your timesheet data. Please check all fields.",
        variant: "destructive",
      });
    }
  };

  // Get projects by customer ID
  const getProjectsByCustomerId = (customerId: number) => {
    if (!projects || !customers) return [];

    // Filter projects by customer ID
    return projects.filter(project => project.customerId === customerId);
  };

  if (isLoadingProjects || isLoadingCustomers || isLoadingTags) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="mr-2 h-4 w-4 animate-spin" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select
                value={field.value?.toString() || ""}
                onValueChange={(value) => {
                  try {
                    // Log the actual value we're getting
                    console.log('Customer select value:', value, 'typeof:', typeof value);

                    // Special case for 'none'
                    if (value === 'none') {
                      form.setValue("customerId", undefined);
                      setFilteredProjects(null);
                      return;
                    }

                    // Handle blank and null values
                    if (value === null || value === undefined || value === '') {
                      form.setValue("customerId", undefined);
                      setFilteredProjects(null);
                      return;
                    }

                    // Update customer ID with strict validation
                    const parsedValue = parseInt(value, 10);
                    if (isNaN(parsedValue) || parsedValue <= 0) {
                      toast({
                        title: "Invalid customer ID",
                        description: "Please select a valid customer",
                        variant: "destructive"
                      });
                      console.error('Invalid parsed customer ID:', parsedValue, 'from value:', value);
                      form.setValue("customerId", undefined);
                      setFilteredProjects(null);
                      return;
                    }

                    // Set the value explicitly as a number
                    form.setValue("customerId", parsedValue);
                    console.log('Customer ID set to:', parsedValue, 'type:', typeof parsedValue);

                    // Update filtered projects
                    const customerProjects = getProjectsByCustomerId(parsedValue);
                    setFilteredProjects(customerProjects);
                  } catch (error) {
                    console.error('Error parsing customer ID:', error, 'value was:', value);
                    toast({
                      title: "Invalid customer selection",
                      description: "Please select a valid customer",
                      variant: "destructive"
                    });
                    form.setValue("customerId", undefined);
                    setFilteredProjects(null);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                  <Separator className="my-2" />
                  <div className="px-2 py-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        // Open a dialog to add a new customer
                        const customerName = prompt("Enter customer name:");
                        if (customerName) {
                          // Call API to create a new customer
                          createCustomerMutation.mutate({ name: customerName, status: "Active" });
                        }
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Customer
                    </Button>
                  </div>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <div className="space-y-2">
                {/* Dropdown selector for projects */}
                <div className="flex flex-col space-y-2">
                  <div className="flex">
                    <Input 
                      type="text"
                      placeholder="Enter project name or ID"
                      className="flex-1"
                      value={typeof field.value === 'string' ? field.value : field.value?.toString() || ''}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        // With our updated schema, we'll always store as string
                        // to be consistent and prevent integer overflow issues
                        form.setValue("projectId", value);
                      }}
                    />
                  </div>

                  {/* Add dropdown selector as a reference */}
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Or select from existing projects:</p>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => {
                        try {
                          console.log('Project select value:', value);

                          // If no value selected, keep current value
                          if (!value || value === '') {
                            return;
                          }

                          // With our updated schema, we'll always use strings for project IDs
                          // to prevent integer overflow issues and support both IDs and names
                          form.setValue("projectId", value);

                          // For debugging/logging purposes only, we'll still convert to check if it's numeric
                          const numericId = Number(value);

                          // Also get the project name if available
                          const projectList = filteredProjects || projects || [];
                          // Use the same numericId from above
                          const selectedProject = projectList.find(p => p.id === numericId);
                          if (selectedProject) {
                            console.log('Selected project:', selectedProject.name);
                          }
                        } catch (error) {
                          console.error('Error in project selection:', error);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select from existing projects" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(filteredProjects || projects)?.map((project) => (
                          <SelectItem key={project.id} value={String(project.id)}>
                            {project.name} (ID: {project.id})
                          </SelectItem>
                        ))}
                        <Separator className="my-2" />
                        <div className="px-2 py-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              // Open a dialog to add a new project
                              const projectName = prompt("Enter project name:");
                              if (projectName) {
                                // Create a timesheet-specific project
                                const customerId = form.getValues("customerId");
                                createProjectMutation.mutate({
                                  name: projectName,
                                  status: "Active",
                                  customerId: customerId
                                });
                              }
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Project
                          </Button>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="folderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Folder</FormLabel>
              <Select
                value={field.value?.toString() || ""}
                onValueChange={(value) => {
                  try {
                    // Log the actual value we're getting
                    console.log('Folder select value:', value, 'typeof:', typeof value);

                    // Add special handling for blank and null values
                    if (value === null || value === undefined || value === '') {
                      toast({
                        title: "Folder is required",
                        description: "Please select a valid folder",
                        variant: "destructive"
                      });
                      field.onChange(undefined); // Clear the field
                      return;
                    }

                    // Convert the value to a number to ensure proper type
                    const numericId = Number(value);
                    if (isNaN(numericId) || numericId <= 0) {
                      console.error('Invalid folder ID format:', value);
                      toast({
                        title: "Invalid folder ID",
                        description: "Please select a valid folder",
                        variant: "destructive"
                      });
                      field.onChange(undefined);
                      return;
                    }

                    // Find the actual folder object to ensure we have valid data
                    const selectedFolder = folders?.find(
                      folder => folder.id === numericId
                    );

                    if (!selectedFolder) {
                      toast({
                        title: "Invalid folder selection",
                        description: "Please select a valid folder from the list",
                        variant: "destructive"
                      });
                      console.error('Folder not found with id:', numericId, '(original value:', value, ')');
                      field.onChange(undefined);
                      return;
                    }

                    // Store the actual numeric ID
                    const folderId = numericId;
                    console.log('Found folder:', selectedFolder, 'Setting ID:', folderId, '(numeric type)');

                    // Set the value as a NUMBER explicitly
                    form.setValue("folderId", folderId);

                    // Log the final state for debugging
                    setTimeout(() => {
                      const currentValue = form.getValues("folderId");
                      console.log('Folder ID set to:', currentValue, 'type:', typeof currentValue);
                    }, 0);
                  } catch (error) {
                    console.error('Error setting folder ID:', error, 'value was:', value);
                    toast({
                      title: "Invalid folder selection",
                      description: "Please select a valid folder",
                      variant: "destructive"
                    });
                    field.onChange(undefined); // Clear the field
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your work"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="workDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                    onChange={(e) => {
                      // Validate the time format using regex for HH:MM format
                      const timeValue = e.target.value;
                      const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

                      // Process the value
                      field.onChange(timeValue);

                      // Add additional validation to ensure correct format
                      if (timeValue && !timePattern.test(timeValue)) {
                        console.error('Invalid time format detected in start time:', timeValue);
                        // Don't update hours with invalid time format
                        return;
                      }

                      // Update hours automatically when time changes
                      const endTime = form.getValues("endTime");
                      if (endTime && timePattern.test(endTime)) {
                        const hours = calculateHours(timeValue, endTime);
                        form.setValue("hours", hours);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                    onChange={(e) => {
                      // Validate the time format using regex for HH:MM format
                      const timeValue = e.target.value;
                      const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

                      // Process the value
                      field.onChange(timeValue);

                      // Add additional validation to ensure correct format
                      if (timeValue && !timePattern.test(timeValue)) {
                        console.error('Invalid time format detected in end time:', timeValue);
                        // Don't update hours with invalid time format
                        return;
                      }

                      // Update hours automatically when time changes
                      const startTime = form.getValues("startTime");
                      if (startTime && timePattern.test(startTime)) {
                        const hours = calculateHours(startTime, timeValue);
                        form.setValue("hours", hours);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => {
            // Predefined tag options
            const predefinedTags = ["Karamadai", "Bangalore", "WHF", "Others"];

            return (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {predefinedTags.map(tag => (
                      <Button
                        key={tag}
                        type="button"
                        variant={field.value?.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const currentTags = field.value || [];
                          if (currentTags.includes(tag)) {
                            // Remove tag if already selected
                            field.onChange(currentTags.filter(t => t !== tag));
                          } else {
                            // Add tag if not already selected
                            field.onChange([...currentTags, tag]);
                          }
                        }}
                        className="rounded-full h-8"
                      >
                        {tag}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tagName = prompt("Enter custom tag name:");
                        if (tagName && tagName.trim()) {
                          const currentTags = field.value || [];
                          if (!currentTags.includes(tagName.trim())) {
                            field.onChange([...currentTags, tagName.trim()]);
                            // We'll also create it in the system for future use
                            const projectId = form.getValues("projectId");
                            if (projectId) {
                              createTagMutation.mutate({ name: tagName.trim() });
                            }
                          }
                        }
                      }}
                      className="rounded-full h-8"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Custom Tag
                    </Button>
                  </div>

                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <p className="text-sm text-muted-foreground mb-1 w-full">Selected tags:</p>
                      {field.value.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-4 w-4 p-0 hover:bg-transparent" 
                            onClick={() => {
                              const currentTags = field.value || [];
                              field.onChange(currentTags.filter(t => t !== tag));
                            }}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}              
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createTimeSheetMutation.isPending}
          >
            {createTimeSheetMutation.isPending && (
              <Clock className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}