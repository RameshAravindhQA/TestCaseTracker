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

// Form schema
const timeSheetFormSchema = z.object({
  userId: z.number(),
  projectId: z.coerce.number(), // Use coerce to handle string to number conversion
  customerId: z.number().optional(),
  moduleId: z.number().optional(),
  testCaseId: z.number().optional(),
  bugId: z.number().optional(),
  description: z.string().min(1, "Description is required"),
  workDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  hours: z.number().min(0, "Hours must be at least 0"),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  tags: z.array(z.string()).optional(),
});

type TimeSheetFormValues = z.infer<typeof timeSheetFormSchema>;

// Define TimeSheet interface
interface TimeSheet {
  id: number;
  userId: number;
  projectId: number;
  customerId?: number;
  moduleId?: number;
  testCaseId?: number;
  bugId?: number;
  description: string;
  workDate: string;
  startTime: string;
  endTime: string;
  hours: number;
  status: "Pending" | "Approved" | "Rejected";
  approvedById?: number;
  approvalDate?: string;
  comments?: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
}

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

interface EditTimesheetFormProps {
  timesheet: TimeSheet;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditTimesheetForm({ timesheet, onSuccess, onCancel }: EditTimesheetFormProps) {
  const { toast } = useToast();
  
  // HOTFIX: Helper function to ensure time values have AM/PM
  const ensureTimeHasAmPm = (timeValue: string | undefined): string => {
    if (!timeValue) return "09:00 AM"; // Default fallback
    
    const cleaned = timeValue.trim();
    if (!cleaned) return "09:00 AM";
    
    // Already has AM/PM
    if (cleaned.toUpperCase().includes('AM') || cleaned.toUpperCase().includes('PM')) {
      // Just standardize the format
      return cleaned.replace(/(\d+:\d+)\s*(am|pm|AM|PM)/i, (_, time, ampm) => {
        return `${time} ${ampm.toUpperCase()}`;
      });
    }
    
    // Add AM/PM based on the hour
    if (cleaned.includes(':')) {
      try {
        const [hours] = cleaned.split(':');
        const hour = parseInt(hours, 10);
        // 12+ hours should be PM, before 12 should be AM
        return `${cleaned} ${hour >= 12 ? 'PM' : 'AM'}`;
      } catch (e) {
        // If parsing fails, use safe defaults
        return hour => 12 ? `${cleaned} PM` : `${cleaned} AM`;
      }
    }
    
    // No colon found, default to AM
    return `${cleaned} AM`;
  };

  // Get project name by ID
  const getProjectName = (projectId: number | string) => {
    if (!projectId) return "Unknown Project";

    // If it's a number, search by ID in projects array
    if (typeof projectId === 'number' || !isNaN(Number(projectId))) {
      const numericId = typeof projectId === 'number' ? projectId : Number(projectId);
      const project = projects?.find(p => p.id === numericId);
      if (project) return project.name;
    }

    // If it's a string and not a valid number, or we didn't find a project by ID, return the string value
    return typeof projectId === 'string' && isNaN(Number(projectId)) ? projectId : `Project #${projectId}`;
  };
  const { user } = useAuth();
  const [filteredProjects, setFilteredProjects] = useState<Project[] | null>(null);

  // Process time values to ensure consistent AM/PM format
  const processTimeValue = (timeValue: string | undefined, defaultTime: string, defaultAmPm: 'AM' | 'PM') => {
    if (!timeValue) return `${defaultTime} ${defaultAmPm}`;

    const trimmedValue = timeValue.trim().toUpperCase();

    // Check if it already has AM/PM designation
    if (trimmedValue.endsWith('AM') || trimmedValue.endsWith('PM')) {
      return trimmedValue; // Keep as is if already formatted
    }

    // Add AM/PM based on reasonable defaults (9-11 AM, 12-8 PM)
    if (timeValue.includes(':')) {
      const hour = parseInt(timeValue.split(':')[0], 10);
      // Default to AM for morning hours (1-11), PM for afternoon/evening (12, 13-23)
      const amPm = hour >= 12 ? 'PM' : 'AM';
      return `${timeValue} ${amPm}`;
    }

    // If it's just a number or other format, use default
    return `${timeValue} ${defaultAmPm}`;
  };

  // Form for editing a timesheet
  const form = useForm<TimeSheetFormValues>({
    resolver: zodResolver(timeSheetFormSchema),
    defaultValues: {
      userId: timesheet.userId,
      projectId: timesheet.projectId,
      customerId: timesheet.customerId,
      moduleId: timesheet.moduleId,
      testCaseId: timesheet.testCaseId,
      bugId: timesheet.bugId,
      description: timesheet.description || "",
      workDate: timesheet.workDate ? new Date(timesheet.workDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: timesheet.startTime ? timesheet.startTime.trim().replace(/(\d{1,2}:\d{2})(?:\s*(AM|PM))?/i, (_, time, ampm) => {
        const [hours] = time.split(':');
        return `${time} ${ampm || (parseInt(hours) >= 12 ? 'PM' : 'AM')}`;
      }) : "09:00 AM",
      endTime: timesheet.endTime ? timesheet.endTime.trim().replace(/(\d{1,2}:\d{2})(?:\s*(AM|PM))?/i, (_, time, ampm) => {
        const [hours] = time.split(':');
        return `${time} ${ampm || (parseInt(hours) >= 12 ? 'PM' : 'AM')}`;
      }) : "05:00 PM",
      hours: timesheet.hours || 8,
      status: timesheet.status || "Pending",
      tags: Array.isArray(timesheet.tags) ? [...timesheet.tags] : [],
    },
  });

  // Reset form values when timesheet changes
  useEffect(() => {
    console.log('Timesheet changed, resetting form with:', timesheet);
    if (timesheet) {
      form.reset({
        userId: timesheet.userId,
        projectId: timesheet.projectId,
        customerId: timesheet.customerId,
        moduleId: timesheet.moduleId,
        testCaseId: timesheet.testCaseId,
        bugId: timesheet.bugId,
        description: timesheet.description || "",
        workDate: timesheet.workDate ? new Date(timesheet.workDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: timesheet.startTime || "09:00 AM",
        endTime: timesheet.endTime || "05:00 PM",
        hours: timesheet.hours || 8,
        status: timesheet.status || "Pending",
        tags: Array.isArray(timesheet.tags) ? [...timesheet.tags] : [],
      });
    }
  }, [timesheet]);

  // Reset form with timesheet data when timesheet changes
  useEffect(() => {
    if (timesheet) {
      // Force refetch latest timesheet data
      queryClient.invalidateQueries({ queryKey: [`/api/timesheets/${timesheet.id}`] });

      // Format time values properly - ensure we preserve user-entered time values
      const formatTimeValue = (timeValue: string | null | undefined) => {
        // If no time value was provided, return empty so default will apply
        if (!timeValue || timeValue.trim() === '') return "";
        
        // Strip any extra whitespaces and uppercase for consistent processing
        const cleanTimeValue = timeValue.trim().toUpperCase();
        
        // Check if time already has AM/PM designation
        if (cleanTimeValue.includes('AM') || cleanTimeValue.includes('PM')) {
          // Normalize format with proper spacing and capitalization of AM/PM
          return cleanTimeValue.replace(/(\d+:\d+)\s*(AM|PM|am|pm)/i, (_, time, ampm) => {
            return `${time} ${ampm.toUpperCase()}`;
          });
        }
        
        // Handle times without AM/PM designation
        try {
          // Parse the hour to determine AM/PM
          const [hours, minutes] = cleanTimeValue.split(':');
          const hour = parseInt(hours, 10);
          // Use 12-hour logic: 12+ is PM, before 12 is AM
          const ampm = hour >= 12 ? 'PM' : 'AM';
          return `${hours}:${minutes} ${ampm}`;
        } catch (e) {
          // If we can't parse it properly, return as is with AM (safe default)
          console.error('Time parsing error:', e);
          return `${cleanTimeValue} AM`;
        }
      };

      // Debug logging for troubleshooting
      console.log('Timesheet data being loaded:', {
        id: timesheet.id,
        raw: {
          startTime: timesheet.startTime, 
          endTime: timesheet.endTime
        }
      });
      
      // Get formatted time values, with strong defaults if missing
      const formattedStartTime = formatTimeValue(timesheet.startTime) || "09:00 AM";
      const formattedEndTime = formatTimeValue(timesheet.endTime) || "05:00 PM";
      
      console.log('Formatted times for form:', {
        startTime: formattedStartTime,
        endTime: formattedEndTime
      });
      
      // Reset form with latest data and properly formatted times
      form.reset({
        userId: timesheet.userId,
        projectId: timesheet.projectId,
        customerId: timesheet.customerId,
        moduleId: timesheet.moduleId,
        testCaseId: timesheet.testCaseId,
        bugId: timesheet.bugId,
        description: timesheet.description || "",
        workDate: timesheet.workDate ? new Date(timesheet.workDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        hours: timesheet.hours || 8,
        status: timesheet.status || "Pending",
        tags: Array.isArray(timesheet.tags) ? [...timesheet.tags] : [],
      });
    }
  }, [timesheet?.id, form]);

  // Get all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Get all customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Get all modules
  const { data: modules, isLoading: isLoadingModules } = useQuery<any[]>({
    queryKey: ["/api/modules"],
  });

  // Get project modules
  const [projectModules, setProjectModules] = useState<any[]>([]);

  // Update project modules when project changes
  useEffect(() => {
    const projectId = form.getValues().projectId;
    if (projectId && modules) {
      const filteredModules = modules.filter(module => module.projectId === projectId);
      setProjectModules(filteredModules);
    } else {
      setProjectModules([]);
    }
  }, [form.watch("projectId"), modules]);

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

  // Update timesheet mutation
  const updateTimeSheetMutation = useMutation({
    mutationFn: async (data: TimeSheetFormValues) => {
      try {
        // Ensure basic validations
        if (!data.workDate) {
          throw new Error('Work date is required');
        }

        // Enhanced time processing to ensure consistent format
        const processTimeFormat = (time: string) => {
          if (!time) return null;
          
          // Clean up the input time
          const trimmedTime = time.trim();
          if (!trimmedTime) return null;
          
          console.log('Processing time value:', trimmedTime);

          // Check if time already has AM/PM designation
          if (trimmedTime.toUpperCase().includes('AM') || trimmedTime.toUpperCase().includes('PM')) {
            // Extract and standardize format
            const timeMatch = trimmedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (timeMatch) {
              const [_, hours, minutes, ampm] = timeMatch;
              const formattedTime = `${hours}:${minutes} ${ampm.toUpperCase()}`;
              console.log('Processed time with AM/PM:', formattedTime);
              return formattedTime;
            }
            
            // If regex didn't match but AM/PM is present, try to normalize
            return trimmedTime.replace(/(\d+:\d+)\s*(AM|PM|am|pm)/i, (_, time, ampm) => {
              return `${time} ${ampm.toUpperCase()}`;
            });
          }

          try {
            // Handle time without AM/PM
            const [hours, minutes] = trimmedTime.split(':');
            if (!hours || !minutes) throw new Error('Invalid time format');
            
            const hour = parseInt(hours, 10);
            if (isNaN(hour)) throw new Error('Invalid hour');
            
            const ampm = (hour >= 12) ? 'PM' : 'AM';
            const formattedTime = `${hours}:${minutes} ${ampm}`;
            console.log('Added AM/PM to time:', formattedTime);
            return formattedTime;
          } catch (e) {
            console.error('Time processing error:', e);
            // Return original with AM/PM (safe default)
            return `${trimmedTime} AM`;
          }
        };

        // Process the form's time values
        const rawStartTime = data.startTime || '09:00';
        const rawEndTime = data.endTime || '17:00';
        
        console.log('Raw time values from form:', {
          start: rawStartTime,
          end: rawEndTime
        });
        
        // Log the raw values coming from the form
        console.log('[FORM UPDATE] Raw time values to process:', {
          startTime: rawStartTime,
          endTime: rawEndTime
        });
        
        // Format time values with consistent AM/PM notation - ensure we use the form values
        // Force string coercion to handle any unexpected types
        const startTimeFormatted = processTimeFormat(String(rawStartTime)) || '09:00 AM';
        const endTimeFormatted = processTimeFormat(String(rawEndTime)) || '05:00 PM';
        
        console.log('[FORM UPDATE] Formatted values for API:', {
          startTime: startTimeFormatted,
          endTime: endTimeFormatted
        });
        
        console.log('Formatted times for submission:', {
          raw: { startTime: data.startTime, endTime: data.endTime },
          formatted: { startTime: startTimeFormatted, endTime: endTimeFormatted }
        });

        // Calculate hours if not provided or zero
        const hours = data.hours || calculateHours(startTimeFormatted, endTimeFormatted);

        // Format data properly for the server
        const formattedData = {
          ...data,
          // Ensure all required fields are properly formatted
          userId: Number(data.userId),
          projectId: Number(data.projectId),
          customerId: data.customerId ? Number(data.customerId) : undefined,
          moduleId: data.moduleId ? Number(data.moduleId) : undefined,
          testCaseId: data.testCaseId ? Number(data.testCaseId) : undefined,
          bugId: data.bugId ? Number(data.bugId) : undefined,
          hours: Math.min(Number(hours), 24), // Ensure hours is a reasonable value
          status: data.status || "Pending", // Include the status
          // Add approval information when status changes to Approved
          approvalDate: data.status === "Approved" ? new Date().toISOString() : timesheet.approvalDate,
          approvedById: data.status === "Approved" ? user?.id : timesheet.approvedById,
          // Use our properly formatted time strings
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
          workDate: data.workDate || new Date().toISOString().split('T')[0],
          // Include tags to ensure they get saved properly
          tags: Array.isArray(data.tags) ? data.tags : [],
        };

        console.log('Updating timesheet with data:', formattedData);

        // Prepare the update payload, ensuring all values are included
        const updatePayload = {
          ...formattedData,
          id: timesheet.id, // Include the ID
        };

        // Make the API call
        const res = await apiRequest("PATCH", `/api/timesheets/${timesheet.id}`, updatePayload);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Update API error:', {
            status: res.status,
            statusText: res.statusText,
            error: errorText
          });
          throw new Error(errorText || `Failed to update timesheet: ${res.statusText}`);
        }

        const updatedTimesheet = await res.json();
        console.log('Update successful:', updatedTimesheet);
        return updatedTimesheet;
      } catch (error) {
        console.error('Update timesheet error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      // Invalidate both the list and the specific timesheet
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] }),
        queryClient.invalidateQueries({ queryKey: [`/api/timesheets/${timesheet.id}`] })
      ]);

      toast({
        title: "Success", 
        description: "TimeSheet updated successfully",
      });

      // Close the edit form
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update timesheet",
        variant: "destructive",
      });
    },
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      // Need to provide all required fields for tag creation
      const res = await apiRequest("POST", "/api/tags", {
        name: data.name,
        color: "#3B82F6", // Default blue color
        projectId: form.getValues("projectId") || timesheet?.projectId || 1 // Use current project ID, existing timesheet project, or default
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

      // Add the tag to the form if it's not already there
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

      // Only add the tag if it's not already in the list
      if (tagName && !currentTags.includes(tagName)) {
        form.setValue("tags", [...currentTags, tagName]);
        // Log for debugging
        console.log('Added tag to form:', tagName, 'Current tags:', [...currentTags, tagName]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tag",
        variant: "destructive",
      });
    },
  });

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

  // Calculate hours when start time or end time changes
  const calculateHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;

    // Process times - remove AM/PM for calculation
    let startStr = startTime;
    let endStr = endTime;
    let startIsPM = false;
    let endIsPM = false;

    // Extract AM/PM info from start time
    if (startTime.includes('AM') || startTime.includes('PM')) {
      startIsPM = startTime.toUpperCase().includes('PM');
      startStr = startTime.replace(/\s?(AM|PM)$/i, '');
    }

    // Extract AM/PM info from end time
    if (endTime.includes('AM') || endTime.includes('PM')) {
      endIsPM = endTime.toUpperCase().includes('PM');
      endStr = endTime.replace(/\s?(AM|PM)$/i, '');
    }

    // Create Date objects for calculation
    const start = new Date(`1970-01-01T${startStr}`);
    const end = new Date(`1970-01-01T${endStr}`);

    // Adjust for 12-hour format if needed
    if (startIsPM && start.getHours() < 12) {
      start.setHours(start.getHours() + 12);
    }
    if (endIsPM && end.getHours() < 12) {
      end.setHours(end.getHours() + 12);
    }

    // Handle case where end time is before start time (next day)
    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diff < 0) {
      // Add 24 hours if end time is on the next day
      diff += 24;
    }

    // Make sure we don't go negative
    diff = Math.max(0, diff);

    // Round to nearest 0.5 hour
    return Math.round(diff * 2) / 2;
  };

  // Handle form submission for updating a timesheet
  const onSubmit = (data: TimeSheetFormValues) => {
    try {
      console.log('Form data before processing:', {
        startTime: data.startTime,
        endTime: data.endTime,
        hours: data.hours
      });

      // CRITICAL HOTFIX: Clean up time strings - ensure they have proper AM/PM and formatting
      let startTimeFormatted = data.startTime?.trim() || "09:00";
      let endTimeFormatted = data.endTime?.trim() || "17:00";
      
      // Log raw values for debugging
      console.log('[CRITICAL HOTFIX] Raw time values before processing:', { 
        startTimeFormatted, 
        endTimeFormatted
      });

      // Ensure case-insensitive check for AM/PM
      if (!startTimeFormatted.toUpperCase().includes('AM') && !startTimeFormatted.toUpperCase().includes('PM')) {
        // Check if time has a colon (indicating it's a time string)
        if (startTimeFormatted.includes(':')) {
          // Extract hours to determine AM/PM
          const [hours] = startTimeFormatted.split(':');
          const hour = parseInt(hours, 10);
          startTimeFormatted = `${startTimeFormatted} ${hour >= 12 ? 'PM' : 'AM'}`;
        } else {
          // Default fallback
          startTimeFormatted = `${startTimeFormatted} AM`;
        }
      }

      if (!endTimeFormatted.toUpperCase().includes('AM') && !endTimeFormatted.toUpperCase().includes('PM')) {
        // Check if time has a colon (indicating it's a time string)
        if (endTimeFormatted.includes(':')) {
          // Extract hours to determine AM/PM
          const [hours] = endTimeFormatted.split(':');
          const hour = parseInt(hours, 10);
          endTimeFormatted = `${endTimeFormatted} ${hour >= 12 ? 'PM' : 'AM'}`;
        } else {
          // Default to PM for end time as that's more common
          endTimeFormatted = `${endTimeFormatted} PM`;
        }
      }
      
      // Standardize AM/PM format (ensure uppercase with proper spacing)
      startTimeFormatted = startTimeFormatted.replace(/(\d+:\d+)\s*(am|pm|AM|PM)/i, (_, time, ampm) => {
        return `${time} ${ampm.toUpperCase()}`;
      });
      
      endTimeFormatted = endTimeFormatted.replace(/(\d+:\d+)\s*(am|pm|AM|PM)/i, (_, time, ampm) => {
        return `${time} ${ampm.toUpperCase()}`;
      });
      
      // Log processed values
      console.log('[CRITICAL HOTFIX] Processed time values:', {
        startTimeFormatted,
        endTimeFormatted
      });

      // Calculate hours if not provided
      const calculatedHours = calculateHours(startTimeFormatted, endTimeFormatted);
      const hours = (!data.hours || data.hours === 0) ? calculatedHours : data.hours;

      console.log('Time values after formatting:', {
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        calculatedHours,
        providedHours: data.hours,
        finalHours: hours
      });

      // Ensure date has a valid format in ISO format (YYYY-MM-DD)
      // Make sure it's properly formatted to avoid timezone issues
      if (data.workDate && typeof data.workDate === 'string') {
        // Validate the date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.workDate)) {
          throw new Error('Invalid date format. Expected YYYY-MM-DD');
        }
      }

      // Format data properly for the server
      const formattedData = {
        ...data,
        // Ensure all required fields are properly formatted
        userId: Number(data.userId),
        projectId: Number(data.projectId),
        customerId: data.customerId ? Number(data.customerId) : undefined,
        moduleId: data.moduleId ? Number(data.moduleId) : undefined,
        testCaseId: data.testCaseId ? Number(data.testCaseId) : undefined,
        bugId: data.bugId ? Number(data.bugId) : undefined,
        hours: Math.min(Number(hours), 24), // Ensure hours is a reasonable value
        status: data.status || "Pending", // Include the status
        // Add approval information when status changes to Approved
        approvalDate: data.status === "Approved" ? new Date().toISOString() : timesheet.approvalDate,
        approvedById: data.status === "Approved" ? user?.id : timesheet.approvedById,
        // Use our properly formatted time strings
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        workDate: data.workDate || new Date().toISOString().split('T')[0],
        // Include tags to ensure they get saved properly
        tags: data.tags,
      };

      // CRITICAL HOTFIX: Force proper time format before submission
      // This is a last-resort safeguard to ensure times are properly formatted with AM/PM
      const finalSubmitData = {
        ...formattedData,
        startTime: ensureTimeHasAmPm(formattedData.startTime),
        endTime: ensureTimeHasAmPm(formattedData.endTime)
      };
      
      // Final verification log
      console.log('[CRITICAL HOTFIX] Final timesheet submission data:', {
        startTime: finalSubmitData.startTime,
        endTime: finalSubmitData.endTime
      });

      // Submit with our guaranteed properly formatted data
      updateTimeSheetMutation.mutate(finalSubmitData);
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

  // Set filtered projects on component mount if a customer is selected
  useEffect(() => {
    const customerId = form.getValues().customerId;
    if (customerId) {
      setFilteredProjects(getProjectsByCustomerId(customerId));
    }
  }, [projects, customers]);

  if (isLoadingProjects || isLoadingCustomers || isLoadingTags || isLoadingModules) {
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
                value={field.value?.toString() || "none"}
                onValueChange={(value) => {
                  // Update customer ID
                  field.onChange(value && value !== "none" ? parseInt(value) : undefined);

                  // If customer is selected, update filtered projects
                  if (value && value !== "none") {
                    const customerProjects = getProjectsByCustomerId(parseInt(value));
                    setFilteredProjects(customerProjects);
                  } else {
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
                  <SelectItem value="none">No Customer</SelectItem>
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
                {/* Show current project name if it exists */}
                {field.value && 
                  <div className="text-sm text-muted-foreground mb-2">
                    Current project: {getProjectName(field.value) || `Project #${field.value}`}
                  </div>
                }

                <Select
                  value={field.value?.toString() || ""}
                  onValueChange={(value) => {
                    if (value) {
                      // Let the z.coerce.number() in the schema handle the conversion
                      field.onChange(value);
                    } else {
                      field.onChange(undefined);
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Always show all projects */}
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                    {/* Show filtered projects if different from all projects */}
                    {filteredProjects && filteredProjects.length > 0 && 
                      filteredProjects.some(fp => !projects?.some(p => p.id === fp.id)) && (
                      <>
                        <Separator className="my-2" />
                        <p className="px-2 py-1 text-xs text-muted-foreground">Customer Projects</p>
                        {filteredProjects.map((project) => (
                          !projects?.some(p => p.id === project.id) &&
                          <SelectItem key={`filtered-${project.id}`} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
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
                            // Create a standalone timesheet project
                            const customerId = form.getValues("customerId");

                            // Create project on the server
                            try {
                              // Show loading toast
                              toast({
                                title: "Creating project...",
                                description: "Please wait while we create the project",
                              });

                              // Create project via API
                              apiRequest("POST", "/api/projects", {
                                name: projectName,
                                description: "Created for timesheet use",
                                status: "Active",
                                customerId: customerId !== "none" ? customerId : undefined,
                                createdById: user?.id,
                              })
                              .then(res => {
                                if (!res.ok) {
                                  throw new Error(`Failed to create project: ${res.statusText}`);
                                }
                                return res.json();
                              })
                              .then(newProject => {
                                // Update cache
                                queryClient.invalidateQueries({ queryKey: ["/api/projects"] });

                                // Set in form
                                form.setValue("projectId", newProject.id);

                                toast({
                                  title: "Success",
                                  description: "Project created successfully",
                                });
                              })
                              .catch(error => {
                                console.error('Project creation error:', error);
                                toast({
                                  title: "Error",
                                  description: error.message || "Failed to create project",
                                  variant: "destructive",
                                });
                              });
                            } catch (error) {
                              console.error('Project creation error:', error);
                              toast({
                                title: "Error",
                                description: "Failed to create project",
                                variant: "destructive",
                              });
                            }
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Module section removed as per requirement */}

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
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time" 
                      className="flex-1"
                      value={field.value?.replace(/\s?(AM|PM)$/i, '').trim() || "09:00"}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        if (!timeValue) return;

                        // Get current AM/PM value
                        const currentAmPm = field.value?.toUpperCase().includes('PM') ? 'PM' : 'AM';
                        
                        // Format time in HH:MM format and add AM/PM
                        const [hours, minutes] = timeValue.split(':');
                        const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')} ${currentAmPm}`;

                        // CRITICAL FIX: Set the value with setValue instead of field.onChange
                        // This ensures the value is properly registered with the form
                        form.setValue("startTime", formattedTime, { 
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true 
                        });
                        
                        console.log("[HOTFIX] Start time set to:", formattedTime);

                        // Update hours automatically when time changes
                        const endTime = form.getValues("endTime");
                        if (endTime) {
                          const hours = calculateHours(formattedTime, endTime);
                          form.setValue("hours", hours);
                        }
                      }}
                    />
                    <Select
                      value={field.value?.toUpperCase().includes('PM') ? "PM" : "AM"}
                      onValueChange={(ampm) => {
                        // Get current time without AM/PM
                        let timeValue = field.value?.replace(/\s?(AM|PM)$/i, '').trim() || "09:00";
                        
                        // Add new AM/PM value
                        const newValue = `${timeValue} ${ampm}`;
                        
                        // CRITICAL FIX: Set the value with setValue instead of field.onChange
                        form.setValue("startTime", newValue, { 
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true 
                        });
                        
                        console.log("[HOTFIX] Start time AM/PM updated to:", newValue);

                        // Update hours
                        const endTime = form.getValues("endTime");
                        if (endTime) {
                          const hours = calculateHours(newValue, endTime);
                          form.setValue("hours", hours);
                        }
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="AM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                <FormLabel>End Time</FormLabel>                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      className="flex-1"
                      value={field.value?.replace(/\s?(AM|PM)$/i, '').trim() || "17:00"}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        if (!timeValue) return;

                        // Get current AM/PM value
                        const currentAmPm = field.value?.toUpperCase().includes('PM') ? 'PM' : 'AM';
                        
                        // Format time in HH:MM format and add AM/PM
                        const [hours, minutes] = timeValue.split(':');
                        const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')} ${currentAmPm}`;

                        // CRITICAL FIX: Set the value with setValue instead of field.onChange
                        // This ensures the value is properly registered with the form
                        form.setValue("endTime", formattedTime, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true
                        });
                        
                        console.log("[HOTFIX] End time set to:", formattedTime);

                        // Update hours automatically when time changes
                        const startTime = form.getValues("startTime");
                        if (startTime) {
                          const hours = calculateHours(startTime, formattedTime);
                          form.setValue("hours", hours);
                          console.log("[HOTFIX] Updated hours:", hours, "Start:", startTime, "End:", formattedTime);
                        }
                      }}
                    />
                    <Select
                      value={field.value?.toUpperCase().includes('PM') ? "PM" : "AM"}
                      onValueChange={(ampm) => {
                        // Get current time without AM/PM
                        let timeValue = field.value?.replace(/\s?(AM|PM)$/i, '').trim() || "17:00";
                        
                        // Add new AM/PM value
                        const newValue = `${timeValue} ${ampm}`;
                        
                        // CRITICAL FIX: Set the value with setValue instead of field.onChange
                        form.setValue("endTime", newValue, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true
                        });
                        
                        console.log("[HOTFIX] End time AM/PM updated to:", newValue);

                        // Update hours
                        const startTime = form.getValues("startTime");
                        if (startTime) {
                          const hours = calculateHours(startTime, newValue);
                          form.setValue("hours", hours);
                        }
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  value={field.value || "Pending"}
                  onValueChange={(value) => {
                    field.onChange(value);
                    console.log("Status set to:", value);
                  }}
                  defaultValue="Pending"
                  disabled={timesheet.status === 'Approved'}
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
              {timesheet.status === 'Approved' && (
                <p className="text-xs text-muted-foreground mt-1">
                  This timesheet has been approved and cannot be edited.
                </p>
              )}
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
            disabled={updateTimeSheetMutation.isPending}
          >
            {updateTimeSheetMutation.isPending && (
              <Clock className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </div>
      </form>
            {timesheet.status === 'Approved' && (
        <Badge className="bg-green-500 text-white">Approved</Badge>
      )}

    </Form>
  );
}