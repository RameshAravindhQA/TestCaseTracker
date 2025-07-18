import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import CreateTimesheetForm from "@/components/timesheets/create-timesheet-form";
import EditTimesheetForm from "@/components/timesheets/edit-timesheet-form";
import TimeSheetFolderTree from "@/components/timesheets/timesheet-folder-tree";
import { Helmet } from "react-helmet";
import { Clock, Calendar, PlusCircle, ClipboardCheck, ClipboardX, Trash2, Edit, Filter, FileText, Download, Plus, RotateCcw, FolderOpen, MoreHorizontal } from "lucide-react";
// Import jsPDF and autoTable with proper types
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

// Add jsPDF-Autotable augmentation to ensure proper TypeScript support
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// We'll use standard input type='time' instead of a custom time picker
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/shell";
import { DashboardHeader } from "@/components/header";
import DashboardLayout from "@/components/layouts/dashboard-layout";

// Define TimeSheet interface
interface TimeSheet {
  id: number;
  userId: number;
  projectId: number;
  customerId?: number;
  moduleId?: number;
  testCaseId?: number;
  bugId?: number;
  folderId?: number | null;
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
}

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

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdById: number;
  createdAt: string;
}

// Form schema
const timeSheetFormSchema = z.object({
  userId: z.number(),
  projectId: z.number(),
  customerId: z.number().optional(),
  moduleId: z.number().optional(),
  testCaseId: z.number().optional(),
  bugId: z.number().optional(),
  folderId: z.number().min(1, "Folder selection is required"),
  description: z.string().min(1, "Description is required"),
  workDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  hours: z.number().min(0, "Hours must be at least 0"),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
});

type TimeSheetFormValues = z.infer<typeof timeSheetFormSchema>;

export default function TimeSheetsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTimeSheet, setSelectedTimeSheet] = useState<TimeSheet | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<number | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<number | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<Project[] | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedFolderForCreate, setSelectedFolderForCreate] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Get all timesheets
  const { data: timeSheets, isLoading: isLoadingTimeSheets } = useQuery<TimeSheet[]>({
    queryKey: ["/api/timesheets"],
  });

  // Get all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Get all customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

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
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create timesheet",
        variant: "destructive",
      });
    },
  });

  // The updateTimeSheetMutation is now handled in the EditTimesheetForm component


  // Delete timesheet mutation
  const deleteTimeSheetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/timesheets/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "TimeSheet deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete timesheet",
        variant: "destructive",
      });
    },
  });

  // Approve timesheet mutation
  const approveTimeSheetMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        console.log(`Attempting to approve timesheet with ID: ${id}`);

        // First get the current timesheet data
        const currentTimesheet = await apiRequest("GET", `/api/timesheets/${id}`).then(res => res.json());

        // Make the API request with all required data
        const res = await apiRequest("PATCH", `/api/timesheets/${id}`, {
          ...currentTimesheet,
          status: "Approved",
          approvalDate: new Date().toISOString(),
          approvedById: user?.id
        });

        // Check if response is ok before parsing JSON
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Approve error response (status ${res.status}):`, errorText);
          throw new Error(errorText || `Failed with status: ${res.status}`);
        }

        const data = await res.json();
        return data;
      } catch (err) {
        console.error("Approve timesheet error:", err);
        if (err instanceof Error) {
          console.error("Error details:", err.message, err.stack);
        }
        throw err;
      }
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "TimeSheet approved successfully",
      });

      // Force an immediate refetch of data to update counters and status
      // Force immediate data refresh
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/timesheets"], refetchType: "all" }),
        queryClient.refetchQueries({ queryKey: ["/api/timesheets"], type: "all" })
      ]);
    },
    onError: (error: Error) => {
      console.error("Approval mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve timesheet. Please check server logs.",
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

      // If we're in the create dialog, we can set the customer in the form
      if (isCreateDialogOpen) {
        form.setValue("customerId", newCustomer.id);
      } 
      // The edit form now has its own mutation handler in EditTimesheetForm component
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  // Reject timesheet mutation with reason
  const rejectTimeSheetMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      try {
        console.log(`Attempting to reject timesheet with ID: ${id}, reason: ${reason}`);

        // Make the API request with proper data structure
        const res = await apiRequest("PATCH", `/api/timesheets/${id}`, {
          status: "Rejected",
          comments: reason,
          approvalDate: new Date().toISOString(),
          approvedById: user?.id
        });

        // Check if response is ok before parsing JSON
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Reject error response (status ${res.status}):`, errorText);
          throw new Error(errorText || `Failed with status: ${res.status}`);
        }

        console.log("Reject successful, response status:", res.status);
        const data = await res.json();
        console.log("Reject result data:", data);

        return data;
      } catch (err) {
        console.error("Reject timesheet error:", err);
        if (err instanceof Error) {
          console.error("Error details:", err.message, err.stack);
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "TimeSheet rejected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
    },
    onError: (error: Error) => {
      console.error("Reject mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject timesheet. Please check server logs.",
        variant: "destructive",
      });
    },
  });

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
    },
  });

  // We've replaced the inline editForm with the EditTimesheetForm component

  // Calculate hours when start time or end time changes
  const calculateHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    // Handle case where end time is before start time (next day)
    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diff < 0) {
      // Add 24 hours if end time is on the next day
      diff += 24;
    }

    // Round to nearest 0.5 hour
    return Math.round(Math.max(0, diff) * 2) / 2;
  };

  // Handle form submission for creating a timesheet
  const onSubmit = (data: TimeSheetFormValues) => {
    // Calculate hours if not provided
    if (!data.hours || data.hours === 0) {
      data.hours = calculateHours(data.startTime, data.endTime);
    }
    createTimeSheetMutation.mutate(data);
  };

  // Edit form submission is now handled in the EditTimesheetForm component

  // Handle delete timesheet
  const handleDeleteTimeSheet = (id: number) => {
    if (confirm("Are you sure you want to delete this timesheet?")) {
      deleteTimeSheetMutation.mutate(id);
    }
  };

  // Handle approve timesheet
  const handleApproveTimeSheet = (id: number) => {
    if (confirm("Are you sure you want to approve this timesheet?")) {
      approveTimeSheetMutation.mutate(id);
    }
  };

  // Handle reject timesheet
  const handleRejectTimeSheet = (id: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      rejectTimeSheetMutation.mutate({ id, reason });
    }
  };

  // Get current date for default month view
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Group timesheets by month
  const groupTimeSheetsByMonth = (sheets: TimeSheet[] | undefined) => {
    if (!sheets) return {};

    const grouped: { [key: string]: TimeSheet[] } = {};

    sheets.forEach(sheet => {
      const workDate = new Date(sheet.workDate);
      const monthKey = `${workDate.getFullYear()}-${String(workDate.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }

      grouped[monthKey].push(sheet);
    });

    return grouped;
  };

  // Filter timesheets by project, customer, and folder
  const filteredTimeSheets = timeSheets?.filter(timesheet => {
    // Apply project filter if set
    if (currentProject && timesheet.projectId !== currentProject) return false;

    // Apply customer filter if set
    if (currentCustomer && timesheet.customerId !== currentCustomer) return false;

    // Apply folder filter if set
    if (selectedFolderId !== null && timesheet.folderId !== selectedFolderId) return false;

    return true;
  });

  // Group filtered timesheets by month
  const groupedTimeSheets = groupTimeSheetsByMonth(filteredTimeSheets);

  // Get available months
  const availableMonths = Object.keys(groupedTimeSheets).sort().reverse();

  // Get paginated timesheets for the current month
  const getPaginatedTimesheets = (monthKey: string) => {
    const timesheets = groupedTimeSheets[monthKey] || [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return timesheets.slice(startIndex, endIndex);
  };

  // Calculate total pages for current month
  const totalPages = Math.ceil((groupedTimeSheets[currentMonth]?.length || 0) / itemsPerPage);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    // Make sure new page is within bounds
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Format month for display
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  };

  // Handle edit timesheet button click
  const handleEditClick = (timesheet: TimeSheet) => {
    setSelectedTimeSheet(timesheet);
    setIsEditDialogOpen(true);
  };

  // Get project name by ID (handles both numeric and string IDs)
  const getProjectName = (projectId: number | string) => {
    if (!projectId) return "Unknown Project";

    // If it's a number, search by ID in projects array
    if (typeof projectId === 'number' || !isNaN(Number(projectId))) {
      const numericId = typeof projectId === 'number' ? projectId : Number(projectId);
      const project = projects?.find(p => p.id === numericId);
      if (project) return project.name;
    }

    // If it's a string and not a valid number, or we didn't find a project by ID, return the string value
    return typeof projectId === 'string' && isNaN(Number(projectId)) ? projectId : "Unknown Project";
  };

  // Get customer name by ID
  const getCustomerName = (customerId?: number) => {
    if (!customerId) return "";
    const customer = customers?.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  // Get projects by customer ID
  const getProjectsByCustomerId = (customerId: number) => {
    if (!projects || !customers) return [];

    // Get all customer projects
    const customerProjects = projects.filter(project => {
      // Check each timesheet to see if this project is associated with the customer
      return timeSheets?.some(timesheet => 
        timesheet.projectId === project.id && timesheet.customerId === customerId
      );
    });

    return customerProjects;
  };

  // Update filtered projects when customer changes
  useEffect(() => {
    if (currentCustomer) {
      setFilteredProjects(getProjectsByCustomerId(currentCustomer));
    } else {
      setFilteredProjects(null);
    }
  }, [currentCustomer, projects, timeSheets]);

  // Export to PDF function
  const exportToPDF = () => {
    if (!filteredTimeSheets || filteredTimeSheets.length === 0) {
      toast({
        title: "No data",
        description: "There are no time sheets to export",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if jsPDF is properly imported and available
      console.log('PDF Export: Creating jsPDF instance');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Check if autoTable function is available
      if (typeof autoTable !== 'function') {
        console.error('PDF Export: autoTable function not available');
        throw new Error('PDF generation library not fully initialized. Missing autoTable plugin.');
      }

      // Add extra validation for the imported plugin
      console.log('PDF Export: autoTable plugin is available and imported')

      // Add title
      console.log('PDF Export: Adding header content');
      doc.setFontSize(16);
      doc.text("Time Sheets Report", 15, 20);

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 28);
      doc.text(`Total records: ${filteredTimeSheets.length}`, 15, 35);

      // Create a simpler data structure for the table
      console.log('PDF Export: Preparing table data');
      const tableColumn = ["Project", "Description", "Date", "Time", "Hours", "Status"];

      // Create safer row data with fewer columns to avoid width issues
      const tableRows = filteredTimeSheets.map(timesheet => {
        // Safe project name
        const projectName = getProjectName(timesheet.projectId) || "Unknown Project";

        // Safe description (shorter for PDF)
        const safeDescription = (timesheet.description || "No description")
          .replace(/[\n\r]+/g, ' ')
          .substring(0, 60);

        // Safe date formatting
        let formattedDate = "N/A";
        try {
          if (timesheet.workDate) {
            const dateObj = new Date(timesheet.workDate);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString();
            }
          }
        } catch (e) {
          formattedDate = "Invalid Date";
        }

        // Safe time formatting
        let timeRange = "N/A";
        try {
          const startTime = timesheet.startTime || "09:00 AM";
          const endTime = timesheet.endTime || "05:00 PM";
          timeRange = `${startTime} - ${endTime}`;
        } catch (e) {
          timeRange = "Invalid Time";
        }

        // Hours and status
        const hours = typeof timesheet.hours === 'number' ? String(timesheet.hours) : "0";
        const status = timesheet.status || "Pending";

        return [
          projectName,
          safeDescription,
          formattedDate,
          timeRange,
          hours,
          status
        ];
      });

      // Simpler autoTable configuration with fewer customizations to avoid errors
      console.log('PDF Export: Creating table');
      try {
        // Use the autoTable function that was properly imported
        autoTable(doc as any, {
          head: [tableColumn],
          body: tableRows,
          startY: 40,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [50, 50, 200],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
        });
      } catch (tableError) {
        console.error('PDF Export: Error creating table', tableError);
        throw new Error('Failed to generate PDF table. Please try again.');
      }

      // Save the PDF with error handling
      console.log('PDF Export: Saving document');
      try {
        doc.save('timesheets_report.pdf');

        // Show success notification
        toast({
          title: "Success",
          description: "PDF exported successfully",
        });
      } catch (saveError) {
        console.error('PDF Export: Error saving document', saveError);
        throw new Error('Failed to save PDF document.');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "There was an error exporting the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (!filteredTimeSheets || filteredTimeSheets.length === 0) {
      toast({
        title: "No data",
        description: "There are no time sheets to export",
        variant: "destructive"
      });
      return;
    }

    try {
      // Manually create CSV content without using stringify
      const headers = ["ID", "Project", "Customer", "Description", "Date", "Start Time", "End Time", "Hours", "Status"];
      const rows = filteredTimeSheets.map(timesheet => {
        // Format and handle null date values
        let formattedDate = "N/A";
        try {
          formattedDate = timesheet.workDate ? new Date(timesheet.workDate).toLocaleDateString() : "N/A";
        } catch (e) {
          formattedDate = "Invalid Date";
        }

        // Format and handle null time values
        let startTimeFormatted = "null";
        try {
          startTimeFormatted = timesheet.startTime ? 
            timesheet.startTime.includes('T') ? 
              timesheet.startTime.split('T')[1].substring(0, 5) : 
              timesheet.startTime : 
            "null";
        } catch (e) {
          startTimeFormatted = "null";
        }

        let endTimeFormatted = "null";
        try {
          endTimeFormatted = timesheet.endTime ? 
            timesheet.endTime.includes('T') ? 
              timesheet.endTime.split('T')[1].substring(0, 5) : 
              timesheet.endTime : 
            "null";
        } catch (e) {
          endTimeFormatted = "null";
        }

        return [
          timesheet.id,
          getProjectName(timesheet.projectId).replace(/,/g, ' '),
          timesheet.customerId ? getCustomerName(timesheet.customerId).replace(/,/g, ' ') : "-",
          timesheet.description ? timesheet.description.replace(/,/g, ' ') : "-",  // Replace commas and handle null
          formattedDate,
          startTimeFormatted,
          endTimeFormatted,
          timesheet.hours,
          timesheet.status
        ];
      });

      // Generate CSV content manually
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.join(',') + '\n';
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'timesheets_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "CSV exported successfully",
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the CSV. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (isLoadingTimeSheets || isLoadingProjects || isLoadingCustomers) {
    return (
      <DashboardLayout>
        <DashboardShell>
          <DashboardHeader
            heading="Time Sheets"
            text="Manage and track your time entries"
          />
          <div className="flex items-center justify-center p-8">
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            <p>Loading...</p>
          </div>
        </DashboardShell>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Time Sheets | Test Case Tracker</title>
      </Helmet>

      <DashboardShell>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 via-orange-600 to-red-500 rounded-xl shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                Time Sheets
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and track your time entries</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                if (selectedFolderId === null) {
                  toast({
                    title: "Select a folder",
                    description: "Please select a folder before creating a time sheet",
                    variant: "destructive"
                  });
                } else {
                  setIsCreateDialogOpen(true);
                }
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Time Sheet
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTimeSheets?.reduce((acc, timesheet) => acc + timesheet.hours, 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total hours logged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTimeSheets?.filter(t => t.status === "Pending" || t.status === "0" || !t.status).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Time sheets waiting for approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTimeSheets?.filter(t => t.status === "Approved" || t.status === "100").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Approved time sheets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <ClipboardX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTimeSheets?.filter(t => t.status === "Rejected" || t.status === "200").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Rejected time sheets
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
          <div className="md:col-span-2">
            <TimeSheetFolderTree 
              selectedFolderId={selectedFolderId}
              onFolderSelect={(folderId) => {
                setSelectedFolderId(folderId);
                setCurrentPage(1); // Reset to first page when changing folder
              }}
            />
          </div>

          <div className="md:col-span-10">
            <div className="flex flex-wrap gap-2 mb-4">
          <Select
            value={currentCustomer?.toString() || "all"}
            onValueChange={(value) => {
              setCurrentCustomer(value === "all" ? null : parseInt(value));
              setCurrentPage(1); // Reset to first page when changing customer filter
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by customer" />
            </SelectTrigger>            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>{customers?.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentProject?.toString() || "all"}
            onValueChange={(value) => {
              setCurrentProject(value === "all" ? null : parseInt(value));
              setCurrentPage(1); // Reset to first page when changing project filter
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {(filteredProjects || projects)?.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentMonth}
            onValueChange={(value) => {
              setCurrentMonth(value);
              setCurrentPage(1); // Reset to first page when changing month
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.length > 0 ? (
                availableMonths.map((monthKey) => (
                  <SelectItem key={monthKey} value={monthKey}>
                    {formatMonth(monthKey)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={currentMonth}>{formatMonth(currentMonth)}</SelectItem>
              )}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // If month is the only active filter, reset to current month
              if (!currentProject && !currentCustomer && !selectedFolderId) {
                const now = new Date();
                setCurrentMonth(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"));
              } else {
                // Otherwise clear all filters
                setCurrentProject(null);
                setCurrentCustomer(null);
                setSelectedFolderId(null);
                const now = new Date();
                setCurrentMonth(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"));
              }
              // Reset pagination to first page
              setCurrentPage(1);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
            </div>

            <div className="mt-4">
          {Object.keys(groupedTimeSheets).length > 0 ? (
            <div className="space-y-6">
              {/* Display timesheets for the selected month */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    {formatMonth(currentMonth)}
                  </CardTitle>
                  <CardDescription>
                    {groupedTimeSheets[currentMonth]?.length ?? 0} time {(groupedTimeSheets[currentMonth]?.length ?? 0) === 1 ? 'entry' : 'entries'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="rounded-md w-full overflow-x-auto">
                    <div className="grid grid-cols-12 items-center py-1.5 px-2 font-medium bg-muted w-full text-sm">
                      <div className="col-span-3">Project / Customer</div>
                      <div className="col-span-3">Description</div>
                      <div className="col-span-1 text-center">Date</div>
                      <div className="col-span-2 text-center">Time</div>
                      <div className="col-span-1 text-center">Hours</div>
                      <div className="col-span-1 text-center">Status</div>
                      <div className="col-span-1 text-center">Actions</div>
                    </div>

                    {getPaginatedTimesheets(currentMonth).map((timesheet) => (
                      <div key={timesheet.id} className="grid grid-cols-12 items-center py-1 px-2 border-t border-gray-100 hover:bg-gray-50 w-full text-sm gap-x-2">
                        <div className="col-span-3">
                          <div className="font-medium flex items-center gap-1">
                            <span className="truncate">{getProjectName(timesheet.projectId)}</span>
                            <Badge variant="outline" className="bg-slate-100 text-[10px] px-1">
                              Project
                            </Badge>
                          </div>
                          {timesheet.customerId && (
                            <div className="text-[10px] text-muted-foreground">
                              <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px]">
                                {getCustomerName(timesheet.customerId)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="col-span-3">
                          <div className="text-sm line-clamp-2">{timesheet.description}</div>
                          {/* Display Tags */}
                          {timesheet.tags && timesheet.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {timesheet.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="col-span-1 text-sm text-center whitespace-nowrap">
                          {(() => {
                            try {
                              const date = new Date(timesheet.workDate);
                              return date.toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: '2-digit'
                              });
                            } catch (e) {
                              return "Invalid Date";
                            }
                          })()}
                        </div>
                        <div className="col-span-2 text-sm text-center whitespace-nowrap">
                          {(() => {
                            try {
                              const formatTime = (time: string) => {
                                if (!time) return '';

                                // Normalize the time string
                                let cleanTime = time.trim().toUpperCase();

                                // Extract just the time portion if it has AM/PM
                                let ampm = '';
                                if (cleanTime.includes('AM')) {
                                  ampm = 'AM';
                                  cleanTime = cleanTime.replace(/\s*AM$/i, '');
                                } else if (cleanTime.includes('PM')) {
                                  ampm = 'PM';
                                  cleanTime = cleanTime.replace(/\s*PM$/i, '');
                                }

                                // If we don't have AM/PM yet, determine based on hour
                                if (!ampm) {
                                  try {
                                    const [hours] = cleanTime.split(':');
                                    const hour = parseInt(hours);
                                    ampm = hour >= 12 ? 'PM' : 'AM';
                                  } catch (e) {
                                    // Default to AM if we can't parse the hour
                                    ampm = 'AM';
                                  }
                                }

                                // Ensure proper formatting with a space before AM/PM
                                return `${cleanTime} ${ampm}`;
                              };

                              // Get the raw values first for debugging
                              const rawStartTime = timesheet.startTime || "09:00 AM";
                              const rawEndTime = timesheet.endTime || "05:00 PM";

                              // Use the actual values from timesheet or fallback to defaults
                              const startTime = formatTime(rawStartTime);
                              const endTime = formatTime(rawEndTime);

                              console.log('Formatted times:', { 
                                original: { start: timesheet.startTime, end: timesheet.endTime },
                                formatted: { start: startTime, end: endTime }
                              });

                              return startTime && endTime ? `${startTime} - ${endTime}` : 'N/A';
                            } catch (e) {
                              console.error("Error formatting time:", e);
                              return "Invalid Time";
                            }
                          })()}
                        </div>
                        <div className="col-span-1 text-center font-medium">{timesheet.hours ? timesheet.hours : 8}</div>
                        <div className="col-span-1 text-center">
                          <Badge 
                            className={`px-3 py-1 text-sm font-medium ${
                              timesheet.status === "Approved" ? "bg-green-500 text-white hover:bg-green-600" :
                              timesheet.status === "Rejected" ? "bg-red-500 text-white hover:bg-red-600" :
                              "bg-gray-500 text-white hover:bg-gray-600"
                            }`}
                          >
                            {timesheet.status || "Pending"}
                          </Badge>
                        </div>
                        <div className="col-span-1 flex justify-end gap-1">
                          {/* Simplified action buttons with dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">

<DropdownMenuItem onClick={() => handleEditClick(timesheet)}>
  <Edit className="mr-2 h-4 w-4" /> Edit
</DropdownMenuItem>


                              {(timesheet.status === "Pending" || timesheet.status === "0" || !timesheet.status) && user?.role === "Admin" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApproveTimeSheet(timesheet.id)}>
                                    <ClipboardCheck className="mr-2 h-4 w-4" /> Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRejectTimeSheet(timesheet.id)}>
                                    <ClipboardX className="mr-2 h-4 w-4" /> Reject
                                  </DropdownMenuItem>
                                </>
                              )}

                              {(timesheet.status === "Rejected" || timesheet.status === "200") && user?.role === "Admin" && (
                                <DropdownMenuItem onClick={() => handleApproveTimeSheet(timesheet.id)}>
                                  <ClipboardCheck className="mr-2 h-4 w-4" /> Approve
                                </DropdownMenuItem>
                              )}

                              {(timesheet.status === "Approved" || timesheet.status === "100") && user?.role === "Admin" && (
                                <DropdownMenuItem onClick={() => handleRejectTimeSheet(timesheet.id)}>
                                  <ClipboardX className="mr-2 h-4 w-4" /> Reject
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => handleDeleteTimeSheet(timesheet.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage <= 1}
                        >
                          Previous
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                        >
                          Next
                        </Button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, groupedTimeSheets[currentMonth]?.length || 0)}</span> to{" "}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, groupedTimeSheets[currentMonth]?.length || 0)}</span> of{" "}
                            <span className="font-medium">{groupedTimeSheets[currentMonth]?.length || 0}</span> results
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Items per page:</span>
                            <Select
                              value={itemsPerPage.toString()}
                              onValueChange={(value) => {
                                setItemsPerPage(parseInt(value));
                                setCurrentPage(1); // Reset to first page when changing items per page
                              }}
                            >
                              <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={itemsPerPage.toString()} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-l-md"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage <= 1}
                            >
                              <span className="sr-only">Previous</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                              </svg>
                            </Button>

                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              // Show pages around current page
                              let pageNum;
                              if (totalPages <= 5) {
                                // If 5 or fewer pages, show all
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                // If near start, show first 5 pages
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                // If near end, show last 5 pages
                                pageNum = totalPages - 4 + i;
                              } else {
                                // Otherwise show current and 2 on each side
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="icon"
                                  onClick={() => handlePageChange(pageNum)}
                                  aria-current={currentPage === pageNum ? "page" : undefined}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}

                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-r-md"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage >= totalPages}
                            >
                              <span className="sr-only">Next</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                              </svg>
                            </Button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mt-6 text-xl font-semibold">No time sheets found</h2>
              <p className="mb-8 mt-2 text-center text-sm text-muted-foreground sm:max-w-md">
                You haven't created any time sheets yet. Start tracking your time by adding a new time sheet.
              </p>
              <Button 
                onClick={() => {
                  if (selectedFolderId === null) {
                    toast({
                      title: "Select a folder",
                      description: "Please select a folder before creating a time sheet",
                      variant: "destructive"
                    });
                  } else {
                    setIsCreateDialogOpen(true);
                  }
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Time Sheet
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
      </DashboardShell>

      {/* Create Time Sheet Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Time Sheet</DialogTitle>
            <DialogDescription>
              Track your time by adding a new time sheet entry.
            </DialogDescription>
          </DialogHeader>

          <CreateTimesheetForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
            selectedFolderId={selectedFolderId}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Time Sheet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Time Sheet</DialogTitle>
            <DialogDescription>
              Update your time sheet entry.
            </DialogDescription>
          </DialogHeader>

          {selectedTimeSheet && (
            <EditTimesheetForm
              timesheet={selectedTimeSheet}
              onSuccess={() => setIsEditDialogOpen(false)}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
          {/* Removed inline form as it was conflicting with the EditTimesheetForm component */}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}