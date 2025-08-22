import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, Users, Briefcase, Search, Filter, X, ChevronDown, CheckCircle2, Clock, UserCheck, BookOpen, AlertCircle, Send, Download, FileType, Grid3X3, List, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";
import { NavadhitiProjectForm } from "@/components/navadhiti/navadhiti-project-form";
import { StatusReviewDialog } from "@/components/navadhiti/status-review-dialog";
import { CsvImportDialog } from "@/components/navadhiti/csv-import-dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import Papa from 'papaparse';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface NavadhitiProject {
  id: number;
  projectName: string;
  clientName: string;
  projectType: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  description: string;
  assignedEmployees: number[];
  technologies: string[];
  budget: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  projectImage?: string; // Added for project image
  currentSprint?: string; // Added for status review
  currentIssues?: string; // Added for status review
  weeklyComms?: string; // Added for status review
  immediateActionItems?: string; // Added for status review
  supportRequired?: string; // Added for status review
  additionalRemarks?: string; // Added for status review
}

// Helper function to calculate days worked
function calculateDaysWorked(startDate: string | null, endDate: string | null): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(); // If no end date, use today
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0; // Ensure non-negative result
}

function TableIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3h18v8H3z" />
      <path d="M3 13h18v8H3z" />
      <path d="M7 3v18" />
      <path d="M17 3v18" />
    </svg>
  );
}

export default function NavadhitiProjectsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<NavadhitiProject | null>(null);
  const [viewingProject, setViewingProject] = useState<NavadhitiProject | null>(null); // For viewing project details
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false); // State for the view dialog
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("projects");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusReviewData, setStatusReviewData] = useState<any[]>([]);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusUpdateProject, setStatusUpdateProject] = useState<NavadhitiProject | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'table' | 'projects' | 'employees'>('card');

  // Resource Allocation Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [technologyFilter, setTechnologyFilter] = useState<string[]>([]);
  const [statusEmployeeFilter, setStatusEmployeeFilter] = useState<string>("all");
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null); // State for selected project in allocation dialog
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [allocationRole, setAllocationRole] = useState("");
  const [allocationStartDate, setAllocationStartDate] = useState("");
  const [allocationEndDate, setAllocationEndDate] = useState("");
  const [resourceViewMode, setResourceViewMode] = useState<'card' | 'list' | 'table' | 'status'>('card');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isEndDateDialogOpen, setIsEndDateDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any>(null);
  const [newEndDate, setNewEndDate] = useState('');

  // Fetch projects
  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/navadhiti-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/navadhiti-projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      // FIX: Ensure fetched data adheres to NavadhitiProject interface, handling potential missing fields
      const formattedData = data.map((project: any) => ({
        ...project,
        id: project.id || 0,
        projectName: project.projectName || 'N/A',
        clientName: project.clientName || 'N/A',
        projectType: project.projectType || 'N/A',
        status: project.status || 'Active',
        priority: project.priority || 'Medium',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        description: project.description || '',
        assignedEmployees: project.assignedEmployees || [],
        technologies: project.technologies || [],
        budget: project.budget || 0,
        completionPercentage: project.completionPercentage || 0,
        createdAt: project.createdAt || '',
        updatedAt: project.updatedAt || '',
        projectImage: project.projectImage || undefined, // Ensure projectImage is handled
        currentSprint: project.currentSprint || 'N/A',
        currentIssues: project.currentIssues || 'None',
        weeklyComms: project.weeklyComms || 'Not Set',
        immediateActionItems: project.immediateActionItems || 'None',
        supportRequired: project.supportRequired || 'None',
        additionalRemarks: project.additionalRemarks || 'None',
      }));
      return formattedData;
    },
  });

  // Filter projects based on search and status
  const filteredProjects = projects.filter((project: NavadhitiProject) => {
    const matchesSearch = searchTerm === "" || 
      project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Fetch employees for resource allocation
  const { data: employeesData = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
    enabled: activeTab === "resourceAllocation" || activeTab === "dashboardAnalytics" // Ensure employees are fetched for dashboard too
  });

  // Fetch employee project mappings
  const { data: employeeProjectsData = [] } = useQuery({
    queryKey: ["/api/employee-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employee-projects");
      if (!res.ok) throw new Error("Failed to fetch employee projects");
      return res.json();
    },
    enabled: activeTab === "resourceAllocation" || activeTab === "dashboardAnalytics" // Ensure employee projects are fetched for dashboard too
  });

  // Fetch employee project history
  const { data: employeeProjectHistory = [] } = useQuery({
    queryKey: ["/api/employee-projects-history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employee-projects-history");
      if (!res.ok) throw new Error("Failed to fetch employee project history");
      return res.json();
    },
    enabled: isManageDialogOpen // Fetch history only when the manage dialog is open
  });

  // Fetch technology options
  const { data: technologyOptions = [] } = useQuery({
    queryKey: ["/api/technology-options"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/technology-options");
      return res.json();
    },
    enabled: activeTab === "resourceAllocation"
  });

  // Fetch department options
  const { data: departmentOptions = [] } = useQuery({
    queryKey: ["/api/department-options"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/department-options");
      return res.json();
    },
    enabled: activeTab === "resourceAllocation" || activeTab === "dashboardAnalytics" // Ensure department options are fetched for dashboard too
  });

  // Create allocation mutation
  const allocateEmployeesMutation = useMutation({
    mutationFn: async (allocationData: any) => {
      const res = await apiRequest("POST", "/api/employee-projects", allocationData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Employees allocated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-projects"] });
      setIsAllocationDialogOpen(false);
      setSelectedEmployees([]);
      setSelectedProject(null);
      setAllocationRole("");
      setAllocationStartDate("");
      setAllocationEndDate("");
    },
    onError: () => {
      toast({ title: "Failed to allocate employees", variant: "destructive" });
    },
  });

  // Unoccupy employee mutation
  const unoccupyEmployeeMutation = useMutation({
    mutationFn: async (allocationId: number) => {
      const res = await apiRequest("DELETE", `/api/employee-projects/${allocationId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Employee unoccupied successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-projects-history"] }); // Invalidate history as well
    },
    onError: () => {
      toast({ title: "Failed to unoccupy employee", variant: "destructive" });
    },
  });

  // Update employee project allocation mutation (for end date, etc.)
  const updateEmployeeProjectMutation = useMutation({
    mutationFn: async ({ allocationId, ...data }: { allocationId: number; endDate: string }) => {
      const res = await apiRequest("PUT", `/api/employee-projects/${allocationId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Project allocation updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-projects-history"] }); // Invalidate history as well
    },
    onError: () => {
      toast({ title: "Failed to update project allocation", variant: "destructive" });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/navadhiti-projects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Project updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      setIsDialogOpen(false);
      setEditingProject(null);
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/navadhiti-projects", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Project created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      // FIX: The dialog should close and editingProject should be reset after successful creation.
      setIsDialogOpen(false);
      setEditingProject(null);
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });

  // Filter employees based on selected criteria
  const filteredEmployees = employeesData.filter((employee: any) => {
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    const matchesTechnology = technologyFilter.length === 0 || 
      (employee.technologies && employee.technologies.some((tech: string) => technologyFilter.includes(tech)));

    const allocation = employeeProjectsData.find((ep: any) => ep.employeeId === employee.id && ep.isActive);
    const employeeStatus = allocation ? 
      (allocation.status === 'active' ? 'occupied' : 
       allocation.status === 'learning' ? 'learning' : 
       allocation.status === 'leave' ? 'onLeave' : 'available') : 'available';

    const matchesStatus = statusEmployeeFilter === "all" || employeeStatus === statusEmployeeFilter;

    const matchesSearch = searchTerm === "" || 
      `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.employeeId}`
        .toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDepartment && matchesTechnology && matchesStatus && matchesSearch;
  });

  const handleEmployeeSelect = (employeeId: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  const handleAllocateEmployees = () => {
    if (selectedEmployees.length === 0 || !selectedProject) {
      toast({ title: "Please select employees and project", variant: "destructive" });
      return;
    }

    if (!allocationRole) {
      toast({ title: "Please specify a role", variant: "destructive" });
      return;
    }

    // Create allocations for each selected employee
    selectedEmployees.forEach(employeeId => {
      allocateEmployeesMutation.mutate({
        employeeId,
        projectId: selectedProject,
        projectType: 'navadhiti',
        role: allocationRole,
        startDate: allocationStartDate || null,
        endDate: allocationEndDate || null,
        isActive: true,
        status: 'active'
      });
    });
  };

  const getEmployeeStatus = (employee: any) => {
    const allocation = employeeProjectsData.find((ep: any) => ep.employeeId === employee.id && ep.isActive);
    if (!allocation) return 'available';

    switch (allocation.status) {
      case 'active': return 'occupied';
      case 'learning': return 'learning';
      case 'leave': return 'onLeave';
      default: return 'available';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'learning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'onLeave': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'occupied': return 'Occupied';
      case 'learning': return 'Learning';
      case 'onLeave': return 'On Leave';
      case 'available': return 'Available';
      default: return 'Unknown';
    }
  };

  // Export Status Review to CSV
  const exportStatusReviewToCSV = () => {
    if (!projects || projects.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no projects to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = projects.map((project: any) => ({
        projectName: project.projectName,
        clientName: project.clientName,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
        endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
        completionPercentage: project.completionPercentage || 0,
        teamSize: project.assignedEmployees?.length || 0,
        budget: project.budget || 0,
        description: project.description || '',
        technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies || ''
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `project_status_review_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: "Status review data exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Error exporting status review data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export Status Review to PDF
  const exportStatusReviewToPDF = () => {
    if (!projects || projects.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no projects to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF('landscape');

      // Add title
      doc.setFontSize(18);
      doc.text('Project Status Review Report', 14, 20);

      // Add metadata
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 30);
      doc.text(`Review Date: ${selectedDate ? format(selectedDate, 'PPP') : 'Current Date'}`, 14, 35);
      doc.text(`Total Projects: ${projects.length}`, 14, 40);

      // Status summary
      const statusCounts = {
        Active: projects.filter((p: any) => p.status === 'Active').length,
        Completed: projects.filter((p: any) => p.status === 'Completed').length,
        'On Hold': projects.filter((p: any) => p.status === 'On Hold').length,
        Cancelled: projects.filter((p: any) => p.status === 'Cancelled').length,
      };

      doc.text(`Active: ${statusCounts.Active} | Completed: ${statusCounts.Completed} | On Hold: ${statusCounts['On Hold']} | Cancelled: ${statusCounts.Cancelled}`, 14, 45);

      // Prepare table data
      const tableData = projects.map((project: any) => [
        project.projectName,
        project.clientName,
        project.status,
        project.priority,
        project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : 'Not set',
        project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : 'Ongoing',
        `${project.completionPercentage || 0}%`,
        `${project.assignedEmployees?.length || 0}`,
        project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'
      ]);

      // Add table
      autoTable(doc, {
        head: [['Project', 'Client', 'Status', 'Priority', 'Start Date', 'End Date', 'Progress', 'Team', 'Budget']],
        body: tableData,
        startY: 55,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 60, 60] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 15 },
          7: { cellWidth: 10 },
          8: { cellWidth: 20 }
        }
      });

      // Save PDF
      doc.save(`project_status_review_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: "Export successful",
        description: "Status review report exported to PDF",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Error exporting status review report to PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handler for the "Manage" button click
  const handleManageEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setIsManageDialogOpen(true);
  };

  // Handler for managing employee projects (used in employee cards)
  const handleManageEmployeeProjects = (employee: any) => {
    const employeeAllocations = employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive);
    if (employeeAllocations.length > 1) {
      setSelectedEmployee(employee);
      setIsManageDialogOpen(true);
    } else if (employeeAllocations.length === 1) {
      // If only one allocation, show option to unoccupy or add more projects
      setSelectedEmployee(employee);
      setIsManageDialogOpen(true);
    } else {
      // If no allocations, open allocation dialog
      setSelectedEmployees([employee.id]);
      setIsAllocationDialogOpen(true);
    }
  };

  // Handler for Allocate to Project button
  const handleAllocateToProject = (employee: any) => {
    setSelectedEmployees([employee.id]);
    setIsAllocationDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-500 rounded-xl shadow-lg">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Navadhiti Projects</h1>
              <p className="text-muted-foreground">
                Manage projects and resource allocation
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="statusReview" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Status Review
            </TabsTrigger>
            <TabsTrigger value="resourceAllocation" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Resource Allocation
            </TabsTrigger>
            <TabsTrigger value="dashboardAnalytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Dashboard Analytics
            </TabsTrigger>
          </TabsList>

          {/* Resource Allocation Tab */}
          <TabsContent value="resourceAllocation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Resource Allocation Dashboard
                </CardTitle>
                <CardDescription>
                  Allocate employees to projects based on department, skills, and availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <Label htmlFor="search" className="text-sm font-medium">Search Employees</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by name, email, ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departmentOptions.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="technologies" className="text-sm font-medium">Technologies</Label>
                    <MultiSelect
                      options={technologyOptions.map((tech: any) => ({
                        label: tech.name,
                        value: tech.name
                      }))}
                      selected={technologyFilter}
                      onChange={setTechnologyFilter}
                      placeholder="Select technologies..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                    <Select value={statusEmployeeFilter} onValueChange={setStatusEmployeeFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="onLeave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={resourceViewMode} onValueChange={(value) => setResourceViewMode(value as any)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select view mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Card View</SelectItem>
                      <SelectItem value="list">List View</SelectItem>
                      <SelectItem value="table">Table View</SelectItem>
                      <SelectItem value="status">Status Dashboard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selection Summary */}
                {selectedEmployees.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          {selectedEmployees.length} employee(s) selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedEmployees([])}
                        >
                          Clear Selection
                        </Button>
                        <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Send className="h-4 w-4 mr-2" />
                              Allocate to Project
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Allocate Employees to Project</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Project</Label>
                                <Select value={selectedProject?.toString() || ""} onValueChange={(value) => setSelectedProject(parseInt(value))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select project..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {projects.map((project: any) => (
                                      <SelectItem key={project.id} value={project.id.toString()}>
                                        {project.projectName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Role</Label>
                                <Input
                                  placeholder="e.g., Frontend Developer, Project Manager"
                                  value={allocationRole}
                                  onChange={(e) => setAllocationRole(e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Start Date</Label>
                                  <Input
                                    type="date"
                                    value={allocationStartDate}
                                    onChange={(e) => setAllocationStartDate(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>End Date</Label>
                                  <Input
                                    type="date"
                                    value={allocationEndDate}
                                    onChange={(e) => setAllocationEndDate(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsAllocationDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleAllocateEmployees}>
                                  Allocate {selectedEmployees.length} Employee(s)
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employee Display based on view mode */}
                {resourceViewMode === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredEmployees.map((employee: any) => {
                    const status = getEmployeeStatus(employee);
                    const allocation = employeeProjectsData.find((ep: any) => ep.employeeId === employee.id && ep.isActive);
                    const project = allocation ? projects.find((p: any) => p.id === allocation.projectId) : null;

                    return (
                      <Card key={employee.id} className={`relative transition-all duration-200 hover:shadow-lg ${
                        selectedEmployees.includes(employee.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedEmployees.includes(employee.id)}
                                onCheckedChange={(checked) => handleEmployeeSelect(employee.id, checked as boolean)}
                                disabled={status === 'occupied'}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {employee.profilePicture ? (
                                    <img
                                      src={employee.profilePicture}
                                      alt={`${employee.firstName} ${employee.lastName}`}
                                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                                      {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-semibold text-sm">{employee.firstName} {employee.lastName}</h3>
                                    <p className="text-xs text-gray-600">{employee.employeeId}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Badge className={`text-xs ${getStatusColor(status)}`}>
                              {getStatusLabel(status)}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{employee.department || 'N/A'}</span>
                            </div>

                            {employee.technologies && employee.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {employee.technologies.slice(0, 3).map((tech: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                                    {tech}
                                  </Badge>
                                ))}
                                {employee.technologies.length > 3 && (
                                  <Badge variant="outline" className="text-xs px-2 py-0">
                                    +{employee.technologies.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {project && (
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    Current: {project.projectName}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Role: {allocation?.role || 'N/A'}
                                  </div>
                                  {allocation?.startDate && (
                                    <div className="text-gray-500 dark:text-gray-500 mt-1">
                                      Since: {new Date(allocation.startDate).toLocaleDateString()}
                                    </div>
                                  )}
                                  {allocation?.endDate && (
                                    <div className="text-gray-500 dark:text-gray-500">
                                      Until: {new Date(allocation.endDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Show all project allocations - compact layout */}
                              {employeeProjectsData
                                .filter((ep: any) => ep.employeeId === employee.id && ep.isActive)
                                .slice(0, 1) // Show only first allocation to save space
                                .map((allocation: any, index: number) => {
                                  const allocatedProject = projects.find((p: any) => p.id === allocation.projectId);
                                  return allocatedProject ? (
                                    <div key={index} className="mt-1 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-xs border border-blue-200 dark:border-blue-800">
                                      <div className="font-medium text-blue-900 dark:text-blue-100 truncate">
                                        {allocatedProject.projectName}
                                      </div>
                                      <div className="text-blue-700 dark:text-blue-300 text-xs truncate">
                                        {allocation.role}
                                      </div>
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs">Allocation:</span>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={allocation.allocation || 100}
                                          className="w-12 h-4 text-xs text-center"
                                          onChange={(e) => {
                                            const newAllocation = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                            updateEmployeeProjectMutation.mutate({ 
                                              allocationId: allocation.id, 
                                              allocation: newAllocation
                                            });
                                          }}
                                        />
                                        <span className="text-xs">%</span>
                                      </div>
                                    </div>
                                  ) : null;
                                })}

                              {/* Show additional project count if more than 1 */}
                              {employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive).length > 1 && (
                                <div className="mt-1 text-xs text-gray-500">
                                  +{employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive).length - 1} more projects
                                </div>
                              )}

                              {/* Show if employee has no current allocations */}
                              {status === 'available' && (
                                <div className="mt-1 p-1.5 bg-green-50 dark:bg-green-900/20 rounded text-xs border border-green-200 dark:border-green-800">
                                  <div className="text-green-700 dark:text-green-300 font-medium text-center">
                                    Available
                                  </div>
                                </div>
                              )}

                              <div className="mt-2 flex gap-1">
                                {status === 'available' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs h-7"
                                    onClick={() => handleAllocateToProject(employee)}
                                  >
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Quick Allocate
                                  </Button>
                                ) : (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs h-7"
                                      onClick={() => {
                                        const employeeAllocations = employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive);
                                        if (employeeAllocations.length > 1) {
                                          handleManageEmployee(employee);
                                        } else if (allocation && confirm('Are you sure you want to unoccupy this employee?')) {
                                          unoccupyEmployeeMutation.mutate(allocation.id);
                                        }
                                      }}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      {employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive).length > 1 ? 'Manage' : 'Unoccupy'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs h-7"
                                      onClick={() => handleAllocateToProject(employee)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Project
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    );
                  })}
                </div>
                )}

                {/* List View */}
                {resourceViewMode === 'list' && (
                  <div className="space-y-3">
                    {filteredEmployees.map((employee: any) => {
                      const status = getEmployeeStatus(employee);
                      const allocation = employeeProjectsData.find((ep: any) => ep.employeeId === employee.id && ep.isActive);
                      const project = allocation ? projects.find((p: any) => p.id === allocation.projectId) : null;

                      return (
                        <Card key={employee.id} className={`p-4 ${selectedEmployees.includes(employee.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={selectedEmployees.includes(employee.id)}
                                onCheckedChange={(checked) => handleEmployeeSelect(employee.id, checked as boolean)}
                                disabled={status === 'occupied'}
                              />
                              {employee.profilePicture ? (
                                <img
                                  src={employee.profilePicture}
                                  alt={`${employee.firstName} ${employee.lastName}`}
                                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                  {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold">{employee.firstName} {employee.lastName}</h3>
                                <p className="text-sm text-gray-600">{employee.employeeId} • {employee.department}</p>
                                {project && (
                                  <p className="text-sm text-blue-600">Current: {project.projectName}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`text-xs ${getStatusColor(status)}`}>
                                {getStatusLabel(status)}
                              </Badge>
                              {status === 'available' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAllocateToProject(employee)}
                                >
                                  Quick Allocate
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (allocation && confirm('Are you sure you want to unoccupy this employee?')) {
                                      unoccupyEmployeeMutation.mutate(allocation.id);
                                    }
                                  }}
                                >
                                  Unoccupy
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Table View */}
                {resourceViewMode === 'table' && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Technologies</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Current Project</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee: any) => {
                          const status = getEmployeeStatus(employee);
                          const allocation = employeeProjectsData.find((ep: any) => ep.employeeId === employee.id && ep.isActive);
                          const project = allocation ? projects.find((p: any) => p.id === allocation.projectId) : null;

                          return (
                            <TableRow key={employee.id} className={selectedEmployees.includes(employee.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedEmployees.includes(employee.id)}
                                  onCheckedChange={(checked) => handleEmployeeSelect(employee.id, checked as boolean)}
                                  disabled={status === 'occupied'}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {employee.profilePicture ? (
                                    <img
                                      src={employee.profilePicture}
                                      alt={`${employee.firstName} ${employee.lastName}`}
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                      {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                                    <div className="text-sm text-gray-500">{employee.employeeId}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{employee.department}</TableCell>
                              <TableCell>
                                {employee.technologies && employee.technologies.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {employee.technologies.slice(0, 2).map((tech: string, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {tech}
                                      </Badge>
                                    ))}
                                    {employee.technologies.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{employee.technologies.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">None</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${getStatusColor(status)}`}>
                                  {getStatusLabel(status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {project ? (
                                  <div>
                                    <div className="font-medium">{project.projectName}</div>
                                    <div className="text-sm text-gray-500">{allocation?.role}</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Not assigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {status === 'available' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAllocateToProject(employee)}
                                  >
                                    Allocate
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const employeeAllocations = employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive);
                                      if (employeeAllocations.length > 1) {
                                        handleManageEmployee(employee);
                                      } else if (allocation && confirm('Are you sure you want to unoccupy this employee?')) {
                                        unoccupyEmployeeMutation.mutate(allocation.id);
                                      }
                                    }}
                                  >
                                    {employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive).length > 1 ? 'Manage' : 'Unoccupy'}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Status Dashboard View */}
                {resourceViewMode === 'status' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Employee Status Dashboard</h3>
                        <p className="text-sm text-gray-500">Detailed employee allocation and performance analytics</p>
                      </div>

                      <div className="space-y-4">
                        {filteredEmployees.map((employee: any) => {
                          const status = getEmployeeStatus(employee);
                          const allocation = employeeProjectsData.find((ep: any) => ep.employeeId === employee.id && ep.isActive);
                          const project = allocation ? projects.find((p: any) => p.id === allocation.projectId) : null;
                          const employeeProjects = employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id);
                          const completionPercentage = project?.completionPercentage || (status === 'available' ? 0 : Math.floor(Math.random() * 100) + 1);

                          // Determine status color and progress
                          const getStatusInfo = (status: string, percentage: number) => {
                            if (status === 'available') {
                              return { color: 'bg-green-500', label: 'Available', bgColor: 'bg-green-100 text-green-800' };
                            } else if (percentage >= 80) {
                              return { color: 'bg-blue-500', label: 'Ahead', bgColor: 'bg-blue-100 text-blue-800' };
                            } else if (percentage >= 60) {
                              return { color: 'bg-green-500', label: 'On Track', bgColor: 'bg-green-100 text-green-800' };
                            } else if (percentage >= 40) {
                              return { color: 'bg-yellow-500', label: 'At Risk', bgColor: 'bg-yellow-100 text-yellow-800' };
                            } else {
                              return { color: 'bg-red-500', label: 'At Risk', bgColor: 'bg-red-100 text-red-800' };
                            }
                          };

                          const statusInfo = getStatusInfo(status, completionPercentage);

                          return (
                            <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <div className="flex items-center gap-4 flex-1">
                                <Checkbox
                                  checked={selectedEmployees.includes(employee.id)}
                                  onCheckedChange={(checked) => handleEmployeeSelect(employee.id, checked as boolean)}
                                  disabled={status === 'occupied'}
                                />

                                {/* Employee Avatar and Info */}
                                <div className="flex items-center gap-3">
                                  {employee.profilePicture ? (
                                    <img
                                      src={employee.profilePicture}
                                      alt={`${employee.firstName} ${employee.lastName}`}
                                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                      {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                    </div>
                                  )}

                                  <div>
                                    <div className="font-semibold text-sm">{employee.firstName} {employee.lastName}</div>
                                    <div className="text-xs text-gray-500">{employee.employeeId} • {employee.department}</div>
                                  </div>
                                </div>

                                {/* Project and Date Info */}
                                <div className="flex-1 min-w-0 max-w-xs">
                                  {project ? (
                                    <div>
                                      <div className="font-medium text-sm truncate">{project.projectName}</div>
                                      <div className="text-xs text-gray-500">
                                        {allocation?.startDate && new Date(allocation.startDate).toLocaleDateString('en-GB', { 
                                          day: '2-digit', 
                                          month: 'short', 
                                          year: 'numeric' 
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="font-medium text-sm text-green-600">Available</div>
                                      <div className="text-xs text-gray-500">Ready for assignment</div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="flex items-center gap-4 min-w-0 flex-1 max-w-md">
                                <div className="flex-1 max-w-xs">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Progress</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={project?.completionPercentage || completionPercentage}
                                      className="w-16 h-6 text-xs text-center"
                                      onChange={(e) => {
                                        const newPercentage = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                        updateProjectMutation.mutate({ 
                                          id: project?.id, 
                                          data: { completionPercentage: newPercentage }
                                        });
                                      }}
                                    />
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div 
                                      className={`h-2.5 rounded-full transition-all duration-300 ${statusInfo.color}`}
                                      style={{ width: `${project?.completionPercentage || completionPercentage}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <Badge className={`text-xs font-medium px-3 py-1 ${statusInfo.bgColor} border-0`}>
                                  {statusInfo.label}
                                </Badge>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  {status === 'available' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-8 px-3"
                                      onClick={() => handleAllocateToProject(employee)}
                                    >
                                      <UserCheck className="h-3 w-3 mr-1" />
                                      Allocate
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-8 px-3"
                                      onClick={() => {
                                        if (allocation && confirm('Are you sure you want to unoccupy this employee?')) {
                                          unoccupyEmployeeMutation.mutate(allocation.id);
                                        }
                                      }}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Unoccupy
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {filteredEmployees.length === 0 && (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No employees found
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Try adjusting your filters to see more employees.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Projects Management
                    </CardTitle>
                    <CardDescription>Create and manage your Navadhiti projects</CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={() => {
                          setEditingProject(null);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingProject ?"Edit Project" : "Create New Project"}
                        </DialogTitle>
                      </DialogHeader>
                      <NavadhitiProjectForm
                        project={editingProject}
                        onSubmit={(data) => {
                          if (editingProject) {
                            updateProjectMutation.mutate({ id: editingProject.id, data });
                          } else {
                            createProjectMutation.mutate(data);
                          }
                        }}
                        onCancel={() => {
                          setIsDialogOpen(false);
                          setEditingProject(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters and Search */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <Label htmlFor="project-search" className="text-sm font-medium">Search Projects</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="project-search"
                        placeholder="Search by name, client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority-filter" className="text-sm font-medium">Priority</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('card')}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none border-x"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="rounded-l-none"
                    >
                      <TableIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Projects Display */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading projects...</p>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No projects found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Get started by creating your first Navadhiti project.
                    </p>
                    <Button 
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Card View */}
                    {viewMode === 'card' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.filter(project => project && project.id).map((project: NavadhitiProject) => {
                          const leadEmployee = employeesData.find((emp: any) => 
                            project.assignedEmployees?.includes(emp.id)
                          );

                          return (
                            <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
                              <CardHeader className="relative p-6">
                                <div className="flex items-center justify-center mb-4">
                                  <div className="relative">
                                    {project.projectImage ? (
                                      <img 
                                        src={project.projectImage} 
                                        alt={`${project.projectName} logo`}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                      />
                                    ) : (
                                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg">
                                        <span className="text-white text-2xl font-bold">
                                          {project.projectName?.charAt(0)?.toUpperCase() || 'P'}
                                        </span>
                                      </div>
                                    )}
                                    <div className="absolute -top-2 -right-2">
                                      <Badge 
                                        variant={project.status === 'Active' ? 'default' : 'secondary'}
                                        className={`${
                                          project.status === 'Active' 
                                            ? 'bg-green-500 hover:bg-green-600' 
                                            : project.status === 'Completed'
                                            ? 'bg-blue-500 hover:bg-blue-600'
                                            : project.status === 'On Hold'
                                            ? 'bg-yellow-500 hover:bg-yellow-600'
                                            : 'bg-red-500 hover:bg-red-600'
                                        } text-white text-xs`}
                                      >
                                        {project.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Project Name</Label>
                                    <CardTitle className="text-lg font-semibold line-clamp-1 mt-1">
                                      {project.projectName}
                                    </CardTitle>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Customer Name</Label>
                                    <CardDescription className="mt-1 font-medium">
                                      {project.clientName}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'} - 
                                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                                  </span>
                                </div>

                                {/* Technologies */}
                                {project.technologies && project.technologies.length > 0 && (
                                  <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Tech</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {project.technologies.slice(0, 3).map((tech, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {tech}
                                        </Badge>
                                      ))}
                                      {project.technologies.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{project.technologies.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Project Lead */}
                                {leadEmployee && (
                                  <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Lead</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      {leadEmployee.profilePicture ? (
                                        <img
                                          src={leadEmployee.profilePicture}
                                          alt={`${leadEmployee.firstName} ${leadEmployee.lastName}`}
                                          className="h-6 w-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                          {leadEmployee.firstName?.charAt(0)}{leadEmployee.lastName?.charAt(0)}
                                        </div>
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {leadEmployee.firstName} {leadEmployee.lastName}
                                      </Badge>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {project.assignedEmployees?.length || 0} members
                                    </span>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingProject(project);
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setViewingProject(project);
                                        setIsViewDialogOpen(true);
                                      }}
                                    >
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    {/* List View */}
                    {viewMode === 'list' && (
                      <div className="space-y-4">
                        {filteredProjects.filter(project => project && project.id).map((project: NavadhitiProject) => {
                          const leadEmployee = employeesData.find((emp: any) => 
                            project.assignedEmployees?.includes(emp.id)
                          );

                          return (
                            <Card key={project.id} className="hover:shadow-md transition-shadow duration-200">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {project.projectImage ? (
                                      <img 
                                        src={project.projectImage} 
                                        alt={`${project.projectName} logo`}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                        <span className="text-white text-lg font-bold">
                                          {project.projectName?.charAt(0)?.toUpperCase() || 'P'}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <h3 className="font-semibold text-lg">{project.projectName}</h3>
                                      <p className="text-gray-600">{project.clientName}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {project.status}
                                        </Badge>
                                        <span className="text-sm text-gray-500">
                                          {project.assignedEmployees?.length || 0} members
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingProject(project);
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setViewingProject(project);
                                        setIsViewDialogOpen(true);
                                      }}
                                    >
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    {/* Table View */}
                    {viewMode === 'table' && (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Project</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Team</TableHead>
                              <TableHead>Technologies</TableHead>
                              <TableHead>Progress</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProjects.filter(project => project && project.id).map((project: NavadhitiProject) => (
                              <TableRow key={project.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {project.projectImage ? (
                                      <img 
                                        src={project.projectImage} 
                                        alt={`${project.projectName} logo`}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">
                                          {project.projectName?.charAt(0)?.toUpperCase() || 'P'}
                                        </span>
                                      </div>
                                    )}
                                    <span className="font-medium">{project.projectName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{project.clientName}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{project.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{project.priority}</Badge>
                                </TableCell>
                                <TableCell>{project.assignedEmployees?.length || 0} members</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${project.completionPercentage || 0}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      {project.completionPercentage || 0}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingProject(project);
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setViewingProject(project);
                                        setIsViewDialogOpen(true);
                                      }}
                                    >
                                      View
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statusReview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Status Review Dashboard
                    </CardTitle>
                    <CardDescription>Review project status and progress with detailed analytics</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => exportStatusReviewToCSV()}
                      disabled={isExporting || !projects?.length}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => exportStatusReviewToPDF()}
                      disabled={isExporting || !projects?.length}
                    >
                      <FileType className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Calendar and Date Filter Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Review Calendar
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <Label>Review Date</Label>
                          <Input
                            type="date"
                            value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Selected: {selectedDate ? format(selectedDate, 'PPP') : 'No date selected'}</p>
                          <p className="mt-1">Total Projects: {projects.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-green-600 font-medium">Active</p>
                            <p className="text-xl font-bold text-green-700">
                              {projects.filter(p => p.status === 'Active').length}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Completed</p>
                            <p className="text-xl font-bold text-blue-700">
                              {projects.filter(p => p.status === 'Completed').length}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="text-sm text-yellow-600 font-medium">On Hold</p>
                            <p className="text-xl font-bold text-yellow-700">
                              {projects.filter(p => p.status === 'On Hold').length}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="text-sm text-red-600 font-medium">Cancelled</p>
                            <p className="text-xl font-bold text-red-700">
                              {projects.filter(p => p.status === 'Cancelled').length}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Status Review Table */}
                <div className="border rounded-lg">
                  <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Project Status Overview
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Lead</TableHead>
                          <TableHead>Overall Project Status</TableHead>
                          <TableHead>Current Sprint Status</TableHead>
                          <TableHead>Current Issues</TableHead>
                          <TableHead>Weekly Comms</TableHead>
                          <TableHead>Immediate Action Items</TableHead>
                          <TableHead>Support Required</TableHead>
                          <TableHead>Additional Remarks</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center">
                                <Calendar className="h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-gray-500">No projects found</p>
                                <p className="text-sm text-gray-400 mt-1">Create your first project to see status reviews</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          projects.map((project: any) => {
                            const leadEmployee = employeesData.find((emp: any) => 
                              project.assignedEmployees?.includes(emp.id)
                            );

                            return (
                              <TableRow key={project.id}>
                                <TableCell className="font-medium">{project.clientName}</TableCell>
                                <TableCell>{project.projectName}</TableCell>
                                <TableCell>
                                  {leadEmployee ? `${leadEmployee.firstName} ${leadEmployee.lastName}` : 'Not Assigned'}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    className={
                                      project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                      project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                      project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }
                                  >
                                    {project.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {(() => {
                                      // Handle predefined status colors and active status
                                      const getSprintStatusBadge = (status: string, projectStatus: string) => {
                                        // If project is active, show based on currentSprint
                                        if (projectStatus === 'Active') {
                                          switch (status) {
                                            case 'green':
                                              return (
                                                <Badge className="bg-green-500 text-white border-green-600">
                                                  On Track
                                                </Badge>
                                              );
                                            case 'amber':
                                            case 'At Risk':
                                              return (
                                                <Badge className="bg-amber-500 text-white border-amber-600">
                                                  At Risk
                                                </Badge>
                                              );
                                            case 'red':
                                            case 'Blocked':
                                              return (
                                                <Badge className="bg-red-500 text-white border-red-600">
                                                  Blocked
                                                </Badge>
                                              );
                                            case 'On Track':
                                              return (
                                                <Badge className="bg-green-500 text-white border-green-600">
                                                  On Track
                                                </Badge>
                                              );
                                            default:
                                              return (
                                                <Badge className="bg-green-500 text-white border-green-600">
                                                  {status || 'Active'}
                                                </Badge>
                                              );
                                          }
                                        } else {
                                          // For non-active projects, show project status
                                          switch (projectStatus) {
                                            case 'Completed':
                                              return (
                                                <Badge className="bg-blue-500 text-white border-blue-600">
                                                  Completed
                                                </Badge>
                                              );
                                            case 'On Hold':
                                              return (
                                                <Badge className="bg-yellow-500 text-white border-yellow-600">
                                                  On Hold
                                                </Badge>
                                              );
                                            case 'Cancelled':
                                              return (
                                                <Badge className="bg-red-500 text-white border-red-600">
                                                  Cancelled
                                                </Badge>
                                              );
                                            default:
                                              return (
                                                <Badge variant="outline">
                                                  {status || 'Not Set'}
                                                </Badge>
                                              );
                                          }
                                        }
                                      };

                                      return getSprintStatusBadge(project.currentSprint, project.status);
                                    })()}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-32 truncate">
                                  {project.currentIssues || 'None'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge className={`${
                                      project.weeklyComms === 'At Risk' ? 'bg-amber-500 text-white' :
                                      project.weeklyComms === 'On Track' ? 'bg-green-500 text-white' :
                                      project.weeklyComms === 'Blocked' ? 'bg-red-500 text-white' :
                                      'bg-gray-500 text-white'
                                    }`}>
                                      {project.weeklyComms || 'Not Set'}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-32 truncate">
                                  {project.immediateActionItems || 'None'}
                                </TableCell>
                                <TableCell className="max-w-32 truncate">
                                  {project.supportRequired || 'None'}
                                </TableCell>
                                <TableCell className="max-w-40 truncate">
                                  {project.additionalRemarks || 'None'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setStatusUpdateProject(project);
                                      setIsStatusDialogOpen(true);
                                    }}
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    Update
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Analytics Tab */}
          <TabsContent value="dashboardAnalytics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Dashboard Analytics
                    </CardTitle>
                    <CardDescription>
                      Comprehensive analytics and insights for Navadhiti projects
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Label htmlFor="analytics-view" className="text-sm font-medium">View by:</Label>
                    <Select value={viewMode === 'employees' ? 'employees' : 'projects'} onValueChange={(value) => setViewMode(value as 'card' | 'list' | 'table' | 'projects' | 'employees')}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select view type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="projects">Projects Dashboard</SelectItem>
                        <SelectItem value="employees">Employees Dashboard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500 rounded-full">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Projects</p>
                        <p className="text-2xl font-bold text-blue-700">{projects.length}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500 rounded-full">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Active Projects</p>
                        <p className="text-2xl font-bold text-green-700">
                          {projects.filter(p => p.status === 'Active').length}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500 rounded-full">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Total Employees</p>
                        <p className="text-2xl font-bold text-purple-700">{employeesData.length}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500 rounded-full">
                        <UserCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Occupied Employees</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {employeeProjectsData.filter((ep: any) => ep.isActive && ep.status === 'active').length}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Project Status Distribution */}
                  <Card>
                    <CardHeader className="pb-4 text-center">
                      <CardTitle className="text-lg">Project Status Distribution</CardTitle>
                      <CardDescription>Overview of all project statuses</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Active', value: projects.filter(p => p.status === 'Active').length, color: '#10b981' },
                              { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: '#3b82f6' },
                              { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length, color: '#f59e0b' },
                              { name: 'Cancelled', value: projects.filter(p => p.status === 'Cancelled').length, color: '#ef4444' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Active', value: projects.filter(p => p.status === 'Active').length, color: '#10b981' },
                              { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: '#3b82f6' },
                              { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length, color: '#f59e0b' },
                              { name: 'Cancelled', value: projects.filter(p => p.status === 'Cancelled').length, color: '#ef4444' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Department Distribution */}
                  <Card>
                    <CardHeader className="pb-4 text-center">
                      <CardTitle className="text-lg">Employee Department Distribution</CardTitle>
                      <CardDescription>Total vs occupied employees by department</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={departmentOptions.map((dept: any) => ({
                            department: dept.name,
                            employees: employeesData.filter((emp: any) => emp.department === dept.name).length,
                            occupied: employeeProjectsData.filter((ep: any) => 
                              ep.isActive && 
                              ep.status === 'active' && 
                              employeesData.find((emp: any) => emp.id === ep.employeeId && emp.department === dept.name)
                            ).length
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="department" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="employees" fill="#8884d8" name="Total Employees" />
                          <Bar dataKey="occupied" fill="#82ca9d" name="Occupied Employees" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Individual Projects Dashboard */}
                {(viewMode === 'projects' || viewMode === 'card' || viewMode === 'list' || viewMode === 'table') && viewMode !== 'employees' && (
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <CardTitle className="text-lg">Individual Project Status Dashboard</CardTitle>
                          <CardDescription>Detailed project progress and team allocation with status indicators</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">View:</Label>
                          <div className="flex border rounded-md">
                            <Button
                              variant={viewMode === 'card' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setViewMode('card')}
                              className="rounded-r-none px-3"
                            >
                              <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={viewMode === 'list' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setViewMode('list')}
                              className="rounded-none border-x px-3"
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={viewMode === 'table' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setViewMode('table')}
                              className="rounded-l-none px-3"
                            >
                              <TableIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Search and Filter Controls for Project Dashboard */}
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="project-dashboard-search" className="text-sm font-medium">Search Projects</Label>
                            <div className="relative mt-1">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="project-dashboard-search"
                                placeholder="Search by name, client..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="project-status-filter" className="text-sm font-medium">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="All Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="On Hold">On Hold</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="project-priority-filter" className="text-sm font-medium">Priority</Label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="All Priorities" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="project-technologies-filter" className="text-sm font-medium">Technologies</Label>
                            <MultiSelect
                              options={technologyOptions.map((tech: any) => ({
                                label: tech.name,
                                value: tech.name
                              }))}
                              selected={technologyFilter}
                              onChange={setTechnologyFilter}
                              placeholder="Select technologies..."
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      {/* Card View for Projects */}
                      {viewMode === 'card' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredProjects.map((project: any) => {
                            const projectEmployees = employeeProjectsData.filter((ep: any) => 
                              ep.projectId === project.id && ep.isActive
                            );
                            const teamSize = projectEmployees.length;
                            const completionPercentage = project.completionPercentage || 0;

                            // Determine project health color
                            const getProjectHealthInfo = (completion: number, status: string) => {
                              if (status === 'Completed') {
                                return { 
                                  bgColor: 'bg-blue-500', 
                                  textColor: 'text-blue-700', 
                                  borderColor: 'border-blue-500',
                                  label: 'Completed',
                                  healthStatus: 'Project Finished'
                                };
                              } else if (status === 'Cancelled') {
                                return { 
                                  bgColor: 'bg-gray-500', 
                                  textColor: 'text-gray-700', 
                                  borderColor: 'border-gray-500',
                                  label: 'Cancelled',
                                  healthStatus: 'Project Cancelled'
                                };
                              } else if (status === 'On Hold') {
                                return { 
                                  bgColor: 'bg-yellow-500', 
                                  textColor: 'text-yellow-700', 
                                  borderColor: 'border-yellow-500',
                                  label: 'On Hold',
                                  healthStatus: 'Project Paused'
                                };
                              } else if (completion >= 80) {
                                return { 
                                  bgColor: 'bg-green-500', 
                                  textColor: 'text-green-700', 
                                  borderColor: 'border-green-500',
                                  label: 'Excellent Progress',
                                  healthStatus: 'On Track'
                                };
                              } else if (completion >= 50) {
                                return { 
                                  bgColor: 'bg-orange-500', 
                                  textColor: 'text-orange-700', 
                                  borderColor: 'border-orange-500',
                                  label: 'Good Progress',
                                  healthStatus: 'Moderate Progress'
                                };
                              } else if (completion >= 25) {
                                return { 
                                  bgColor: 'bg-yellow-500', 
                                  textColor: 'text-yellow-700', 
                                  borderColor: 'border-yellow-500',
                                  label: 'Slow Progress',
                                  healthStatus: 'Behind Schedule'
                                };
                              } else {
                                return { 
                                  bgColor: 'bg-red-500', 
                                  textColor: 'text-red-700', 
                                  borderColor: 'border-red-500',
                                  label: 'Needs Attention',
                                  healthStatus: 'Critical'
                                };
                              }
                            };

                            const projectHealthInfo = getProjectHealthInfo(completionPercentage, project.status);

                            return (
                              <Card key={project.id} className={`relative p-4 hover:shadow-lg transition-all duration-300 border-l-4 ${projectHealthInfo.borderColor}`}>
                                {/* Project Header */}
                                <div className="flex items-center space-x-3 mb-4">
                                  {project.projectImage ? (
                                    <img 
                                      src={project.projectImage} 
                                      alt={`${project.projectName} logo`}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center border-2 border-gray-200">
                                      <span className="text-white text-lg font-bold">
                                        {project.projectName?.charAt(0)?.toUpperCase() || 'P'}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                      {project.projectName}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                      {project.clientName}
                                    </p>
                                  </div>
                                </div>

                                {/* Project Details */}
                                <div className="mb-4 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Status:</span>
                                    <Badge variant="outline" className="text-xs">
                                      {project.status}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Team Size:</span>
                                    <span className="text-xs font-medium">{teamSize} members</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Priority:</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {project.priority}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Progress Status */}
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      Project Progress
                                    </span>
                                    <Badge className={`text-xs font-semibold px-2 py-1 ${projectHealthInfo.textColor} bg-opacity-20`} style={{
                                      backgroundColor: projectHealthInfo.bgColor.replace('bg-', '').includes('gray') ? '#F3F4F6' : 
                                                      projectHealthInfo.bgColor.includes('red') ? '#FEF2F2' : 
                                                      projectHealthInfo.bgColor.includes('yellow') ? '#FFFBEB' : 
                                                      projectHealthInfo.bgColor.includes('orange') ? '#FFF7ED' : 
                                                      projectHealthInfo.bgColor.includes('green') ? '#F0FDF4' : '#EBF8FF'
                                    }}>
                                      {completionPercentage}%
                                    </Badge>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="relative mb-3">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                                      <div 
                                        className={`${projectHealthInfo.bgColor} h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-center`}
                                        style={{ width: `${completionPercentage}%` }}
                                      >
                                        {completionPercentage > 20 && (
                                          <span className="text-xs font-medium text-white">
                                            {completionPercentage}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {completionPercentage <= 20 && completionPercentage > 0 && (
                                      <span className="absolute right-2 top-0 text-xs font-medium text-gray-600 leading-4">
                                        {completionPercentage}%
                                      </span>
                                    )}
                                  </div>

                                  {/* Status Information */}
                                  <div className="space-y-1 mb-3">
                                    <div className={`text-xs font-semibold ${projectHealthInfo.textColor}`}>
                                      {projectHealthInfo.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      Health: {projectHealthInfo.healthStatus}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      Duration: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                                    </div>

                                    {/* Team Members Section */}
                                    {project.assignedEmployees && project.assignedEmployees.length > 0 && (
                                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                          Team Members
                                        </div>
                                        <div className="flex -space-x-2 overflow-hidden">
                                          {project.assignedEmployees.slice(0, 5).map((employeeId: number, index: number) => {
                                            const employee = employeesData.find((emp: any) => emp.id === employeeId);
                                            return employee ? (
                                              <div key={index} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-300 overflow-hidden">
                                                {employee.profilePicture ? (
                                                  <img
                                                    src={employee.profilePicture}
                                                    alt={`${employee.firstName} ${employee.lastName}`}
                                                    className="h-full w-full object-cover"
                                                    title={`${employee.firstName} ${employee.lastName}`}
                                                  />
                                                ) : (
                                                  <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                                    {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                                  </div>
                                                )}
                                              </div>
                                            ) : null;
                                          })}
                                          {project.assignedEmployees.length > 5 && (
                                            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-500 flex items-center justify-center text-white text-xs font-medium">
                                              +{project.assignedEmployees.length - 5}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs h-7"
                                      onClick={() => {
                                        setViewingProject(project);
                                        setIsViewDialogOpen(true);
                                      }}
                                    >
                                      View Details
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs h-7"
                                      onClick={() => {
                                        setEditingProject(project);
                                        setActiveTab("projects");
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      {/* List View for Projects */}
                      {viewMode === 'list' && (
                        <div className="space-y-4">
                          {filteredProjects.map((project: any) => {
                            const projectEmployees = employeeProjectsData.filter((ep: any) => 
                              ep.projectId === project.id && ep.isActive
                            );
                            const teamSize = projectEmployees.length;
                            const completionPercentage = project.completionPercentage || 0;

                            // Determine project health color
                            const getProjectHealthInfo = (completion: number, status: string) => {
                              if (status === 'Completed') {
                                return { 
                                  bgColor: 'bg-blue-500', 
                                  textColor: 'text-blue-700', 
                                  borderColor: 'border-blue-500',
                                  label: 'Completed',
                                  healthStatus: 'Project Finished'
                                };
                              } else if (status === 'Cancelled') {
                                return { 
                                  bgColor: 'bg-gray-500', 
                                  textColor: 'text-gray-700', 
                                  borderColor: 'border-gray-500',
                                  label: 'Cancelled',
                                  healthStatus: 'Project Cancelled'
                                };
                              } else if (status === 'On Hold') {
                                return { 
                                  bgColor: 'bg-yellow-500', 
                                  textColor: 'text-yellow-700', 
                                  borderColor: 'border-yellow-500',
                                  label: 'On Hold',
                                  healthStatus: 'Project Paused'
                                };
                              } else if (completion >= 80) {
                                return { 
                                  bgColor: 'bg-green-500', 
                                  textColor: 'text-green-700', 
                                  borderColor: 'border-green-500',
                                  label: 'Excellent Progress',
                                  healthStatus: 'On Track'
                                };
                              } else if (completion >= 50) {
                                return { 
                                  bgColor: 'bg-orange-500', 
                                  textColor: 'text-orange-700', 
                                  borderColor: 'border-orange-500',
                                  label: 'Good Progress',
                                  healthStatus: 'Moderate Progress'
                                };
                              } else if (completion >= 25) {
                                return { 
                                  bgColor: 'bg-yellow-500', 
                                  textColor: 'text-yellow-700', 
                                  borderColor: 'border-yellow-500',
                                  label: 'Slow Progress',
                                  healthStatus: 'Behind Schedule'
                                };
                              } else {
                                return { 
                                  bgColor: 'bg-red-500', 
                                  textColor: 'text-red-700', 
                                  borderColor: 'border-red-500',
                                  label: 'Needs Attention',
                                  healthStatus: 'Critical'
                                };
                              }
                            };

                            const projectHealthInfo = getProjectHealthInfo(completionPercentage, project.status);

                            return (
                              <Card key={project.id} className={`p-4 hover:shadow-md transition-all duration-200 border-l-4 ${projectHealthInfo.borderColor}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 flex-1">
                                    {/* Project Image */}
                                    {project.projectImage ? (
                                      <img 
                                        src={project.projectImage} 
                                        alt={`${project.projectName} logo`}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center border-2 border-gray-200">
                                        <span className="text-white text-xl font-bold">
                                          {project.projectName?.charAt(0)?.toUpperCase() || 'P'}
                                        </span>
                                      </div>
                                    )}

                                    {/* Project Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                          {project.projectName}
                                        </h4>
                                        <Badge variant="outline" className="text-xs">
                                          {project.status}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          {project.priority}
                                        </Badge>
                                      </div>

                                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                                        Client: {project.clientName}
                                      </p>

                                      <div className="flex items-center gap-6">
                                        <div className="text-sm text-gray-600">
                                          Team: {teamSize} members
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          Duration: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                                        </div>
                                      </div>

                                      {/* Team Members */}
                                      {project.assignedEmployees && project.assignedEmployees.length > 0 && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-xs text-gray-500">Team:</span>
                                          <div className="flex -space-x-1">
                                            {project.assignedEmployees.slice(0, 4).map((employeeId: number, index: number) => {
                                              const employee = employeesData.find((emp: any) => emp.id === employeeId);
                                              return employee ? (
                                                <div key={index} className="h-6 w-6 rounded-full ring-2 ring-white bg-gray-300 overflow-hidden">
                                                  {employee.profilePicture ? (
                                                    <img
                                                      src={employee.profilePicture}
                                                      alt={`${employee.firstName} ${employee.lastName}`}
                                                      className="h-full w-full object-cover"
                                                      title={`${employee.firstName} ${employee.lastName}`}
                                                    />
                                                  ) : (
                                                    <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                                      {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : null;
                                            })}
                                            {project.assignedEmployees.length > 4 && (
                                              <div className="h-6 w-6 rounded-full ring-2 ring-white bg-gray-500 flex items-center justify-center text-white text-xs font-medium">
                                                +{project.assignedEmployees.length - 4}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Progress and Actions */}
                                  <div className="flex items-center gap-6">
                                    {/* Progress Section */}
                                    <div className="text-center min-w-32">
                                      <div className="mb-2">
                                        <Badge className={`text-xs font-semibold px-2 py-1 ${projectHealthInfo.textColor} bg-opacity-20`} style={{
                                          backgroundColor: projectHealthInfo.bgColor.replace('bg-', '').includes('gray') ? '#F3F4F6' : 
                                                          projectHealthInfo.bgColor.includes('red') ? '#FEF2F2' : 
                                                          projectHealthInfo.bgColor.includes('yellow') ? '#FFFBEB' : 
                                                          projectHealthInfo.bgColor.includes('orange') ? '#FFF7ED' : '#F0FDF4'
                                        }}>
                                          {completionPercentage}%
                                        </Badge>
                                      </div>

                                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-3 mx-auto mb-1">
                                        <div 
                                          className={`${projectHealthInfo.bgColor} h-3 rounded-full transition-all duration-500`}
                                          style={{ width: `${completionPercentage}%` }}
                                        />
                                      </div>

                                      <div className={`text-xs font-medium ${projectHealthInfo.textColor}`}>
                                        {projectHealthInfo.label}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setViewingProject(project);
                                          setIsViewDialogOpen(true);
                                        }}
                                      >
                                        View Details
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingProject(project);
                                          setActiveTab("projects");
                                          setIsDialogOpen(true);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      {/* Table View for Projects */}
                      {viewMode === 'table' && (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Team Size</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Health Status</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Technologies</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredProjects.map((project: any) => {
                                const projectEmployees = employeeProjectsData.filter((ep: any) => 
                                  ep.projectId === project.id && ep.isActive
                                );
                                const teamSize = projectEmployees.length;
                                const completionPercentage = project.completionPercentage || 0;

                                // Determine project health color
                                const getProjectHealthInfo = (completion: number, status: string) => {
                                  if (status === 'Completed') {
                                    return { 
                                      bgColor: 'bg-blue-500', 
                                      textColor: 'text-blue-700', 
                                      borderColor: 'border-blue-500',
                                      label: 'Completed',
                                      healthStatus: 'Project Finished'
                                    };
                                  } else if (status === 'Cancelled') {
                                    return { 
                                      bgColor: 'bg-gray-500', 
                                      textColor: 'text-gray-700', 
                                      borderColor: 'border-gray-500',
                                      label: 'Cancelled',
                                      healthStatus: 'Project Cancelled'
                                    };
                                  } else if (status === 'On Hold') {
                                    return { 
                                      bgColor: 'bg-yellow-500', 
                                      textColor: 'text-yellow-700', 
                                      borderColor: 'border-yellow-500',
                                      label: 'On Hold',
                                      healthStatus: 'Project Paused'
                                    };
                                  } else if (completion >= 80) {
                                    return { 
                                      bgColor: 'bg-green-500', 
                                      textColor: 'text-green-700', 
                                      borderColor: 'border-green-500',
                                      label: 'Excellent Progress',
                                      healthStatus: 'On Track'
                                    };
                                  } else if (completion >= 50) {
                                    return { 
                                      bgColor: 'bg-orange-500', 
                                      textColor: 'text-orange-700', 
                                      borderColor: 'border-orange-500',
                                      label: 'Good Progress',
                                      healthStatus: 'Moderate Progress'
                                    };
                                  } else if (completion >= 25) {
                                    return { 
                                      bgColor: 'bg-yellow-500', 
                                      textColor: 'text-yellow-700', 
                                      borderColor: 'border-yellow-500',
                                      label: 'Slow Progress',
                                      healthStatus: 'Behind Schedule'
                                    };
                                  } else {
                                    return { 
                                      bgColor: 'bg-red-500', 
                                      textColor: 'text-red-700', 
                                      borderColor: 'border-red-500',
                                      label: 'Needs Attention',
                                      healthStatus: 'Critical'
                                    };
                                  }
                                };

                                const projectHealthInfo = getProjectHealthInfo(completionPercentage, project.status);

                                return (
                                  <TableRow key={project.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        {project.projectImage ? (
                                          <img 
                                            src={project.projectImage} 
                                            alt={`${project.projectName} logo`}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">
                                              {project.projectName?.charAt(0)?.toUpperCase() || 'P'}
                                            </span>
                                          </div>
                                        )}
                                        <div>
                                          <div className="font-medium">{project.projectName}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{project.clientName}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{project.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">{project.priority}</Badge>
                                    </TableCell>
                                    <TableCell>{teamSize} members</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`${projectHealthInfo.bgColor} h-2 rounded-full`}
                                            style={{ width: `${completionPercentage}%` }}
                                          />
                                        </div>
                                        <span className="text-sm text-gray-600">
                                          {completionPercentage}%
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`text-xs font-semibold px-2 py-1 ${projectHealthInfo.textColor} bg-opacity-20`} style={{
                                        backgroundColor: projectHealthInfo.bgColor.replace('bg-', '').includes('gray') ? '#F3F4F6' : 
                                                        projectHealthInfo.bgColor.includes('red') ? '#FEF2F2' : 
                                                        projectHealthInfo.bgColor.includes('yellow') ? '#FFFBEB' : 
                                                        projectHealthInfo.bgColor.includes('orange') ? '#FFF7ED' : '#F0FDF4'
                                      }}>
                                        {projectHealthInfo.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm text-gray-600">
                                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {project.technologies && project.technologies.length > 0 ? (
                                          project.technologies.slice(0, 2).map((tech, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {tech}
                                            </Badge>
                                          ))
                                        ) : (
                                          <span className="text-gray-400">None</span>
                                        )}
                                        {project.technologies && project.technologies.length > 2 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{project.technologies.length - 2}
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setViewingProject(project);
                                            setIsViewDialogOpen(true);
                                          }}
                                        >
                                          View
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingProject(project);
                                            setActiveTab("projects");
                                            setIsDialogOpen(true);
                                          }}
                                        >
                                          Edit
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Empty State */}
                      {filteredProjects.length === 0 && (
                        <div className="text-center py-12">
                          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No projects found
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            {projects.length === 0 
                              ? "Create your first Navadhiti project to see detailed analytics."
                              : "No projects match your current filters. Try adjusting your search criteria."}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Individual Employee Dashboard */}
                {viewMode === 'employees' && (
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <CardTitle className="text-lg">Individual Employee Dashboard</CardTitle>
                          <CardDescription>Detailed employee allocation and performance analytics with progress indicators</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">View:</Label>
                          <div className="flex border rounded-md">
                            <Button
                              variant={resourceViewMode === 'card' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setResourceViewMode('card')}
                              className="rounded-r-none px-3"
                            >
                              <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={resourceViewMode === 'list' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setResourceViewMode('list')}
                              className="rounded-none border-x px-3"
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={resourceViewMode === 'table' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setResourceViewMode('table')}
                              className="rounded-l-none px-3"
                            >
                              <TableIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Search and Filter Controls for Employee Dashboard */}
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="employee-search" className="text-sm font-medium">Search Employees</Label>
                            <div className="relative mt-1">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="employee-search"
                                placeholder="Search by name, email, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="employee-dept-filter" className="text-sm font-medium">Department</Label>
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="All Departments" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departmentOptions.map((dept: any) => (
                                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="employee-status-filter" className="text-sm font-medium">Status</Label>
                            <Select value={statusEmployeeFilter} onValueChange={setStatusEmployeeFilter}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="All Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="occupied">Occupied</SelectItem>
                                <SelectItem value="learning">Learning</SelectItem>
                                <SelectItem value="onLeave">On Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Card View for Employees */}
                      {resourceViewMode === 'card' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {filteredEmployees.map((employee: any) => {
                            // Calculate occupation percentage more accurately
                            const allocations = employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive);
                            const navadhitiAllocations = allocations.filter((allocation: any) => {
                              return projects.some((p: any) => p.id === allocation.projectId);
                            });

                            // Calculate percentage based on number of active projects (assuming each project = 25-50% allocation)
                            const baseAllocation = 40; // Base percentage per project
                            const occupationPercentage = Math.min(navadhitiAllocations.length * baseAllocation, 100);

                            // Determine color and status based on occupation percentage
                            const getOccupationInfo = (percentage: number) => {
                              if (percentage === 0) {
                                return { 
                                  bgColor: 'bg-gray-300', 
                                  textColor: 'text-gray-700', 
                                  borderColor: 'border-gray-400',
                                  label: 'Available',
                                  status: 'Not Occupied'
                                };
                              } else if (percentage <= 10) {
                                return { 
                                  bgColor: 'bg-red-500', 
                                  textColor: 'text-red-700', 
                                  borderColor: 'border-red-500',
                                  label: 'Under-utilized',
                                  status: '10% Occupied'
                                };
                              } else if (percentage <= 50) {
                                return { 
                                  bgColor: 'bg-yellow-500', 
                                  textColor: 'text-yellow-700', 
                                  borderColor: 'border-yellow-500',
                                  label: 'Moderate',
                                  status: '50% Occupied'
                                };
                              } else if (percentage <= 80) {
                                return { 
                                  bgColor: 'bg-orange-500', 
                                  textColor: 'text-orange-700', 
                                  borderColor: 'border-orange-500',
                                  label: 'Good Load',
                                  status: '80% Occupied'
                                };
                              } else {
                                return { 
                                  bgColor: 'bg-green-500', 
                                  textColor: 'text-green-700', 
                                  borderColor: 'border-green-500',
                                  label: 'Fully Occupied',
                                  status: '100% Occupied'
                                };
                              }
                            };

                            const occupationInfo = getOccupationInfo(occupationPercentage);

                            return (
                              <Card key={employee.id} className={`relative p-4 hover:shadow-lg transition-all duration-300 border-l-4 ${occupationInfo.borderColor}`}>
                                {/* Employee Header */}
                                <div className="flex items-center space-x-3 mb-4">
                                  <Avatar className="h-12 w-12 border-2 border-gray-200">
                                    <AvatarImage src={employee.profilePicture} alt={`${employee.firstName} ${employee.lastName}`} />
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg">
                                      {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                      {employee.firstName} {employee.lastName}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                      {employee.employeeId} • {employee.department}
                                    </p>
                                  </div>
                                </div>

                                {/* Current Projects */}
                                <div className="mb-4 space-y-2">
                                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                    Current Projects
                                  </h5>
                                  {navadhitiAllocations.length > 0 ? (
                                    <div className="space-y-1">
                                      {navadhitiAllocations.slice(0, 2).map((allocation: any) => {
                                        const project = projects.find((p: any) => p.id === allocation.projectId);
                                        return project ? (
                                          <div key={allocation.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                            <div className="font-medium text-xs text-blue-800 dark:text-blue-200 truncate">
                                              {project.projectName}
                                            </div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400">
                                              {allocation.role || 'Team Member'}
                                            </div>
                                          </div>
                                        ) : null;
                                      })}
                                      {navadhitiAllocations.length > 2 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                          +{navadhitiAllocations.length - 2} more
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                                      <div className="text-xs text-gray-600 dark:text-gray-400 text-center italic">
                                        Available for new projects
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Occupation Status */}
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      Allocation Status
                                    </span>
                                    <Badge className={`text-xs font-semibold px-2 py-1 ${occupationInfo.textColor} bg-opacity-20`} style={{
                                      backgroundColor: occupationInfo.bgColor.replace('bg-', '').includes('gray') ? '#F3F4F6' : 
                                                      occupationInfo.bgColor.includes('red') ? '#FEF2F2' : 
                                                      occupationInfo.bgColor.includes('yellow') ? '#FFFBEB' : 
                                                      occupationInfo.bgColor.includes('orange') ? '#FFF7ED' : '#F0FDF4'
                                    }}>
                                      {occupationPercentage}%
                                    </Badge>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="relative mb-3">
                                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                      <div 
                                        className={`${occupationInfo.bgColor} h-3 rounded-full transition-all duration-500 ease-out flex items-center justify-center`}
                                        style={{ width: `${occupationPercentage}%` }}
                                      >
                                        {occupationPercentage > 30 && (
                                          <span className="text-xs font-medium text-white">
                                            {occupationPercentage}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {occupationPercentage <= 30 && occupationPercentage > 0 && (
                                      <span className="absolute right-2 top-0 text-xs font-medium text-gray-600 leading-4">
                                        {occupationPercentage}%
                                      </span>
                                    )}
                                  </div>

                                  {/* Status Information */}
                                  <div className="space-y-1 mb-3">
                                    <div className={`text-xs font-semibold ${occupationInfo.textColor}`}>
                                      {occupationInfo.label}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      Active Projects: {navadhitiAllocations.length}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      Status: {occupationInfo.status}
                                    </div>
                                  </div>

                                  {/* Action Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs h-8 mt-2"
                                    onClick={() => handleManageEmployeeProjects(employee)}
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    {navadhitiAllocations.length > 0 ? 'Manage Projects' : 'Allocate to Project'}
                                  </Button>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      {/* List View for Employees */}
                      {resourceViewMode === 'list' && (
                        <div className="space-y-3">
                          {filteredEmployees.map((employee: any) => {
                            // Calculate occupation percentage more accurately
                            const allocations = employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive);
                            const navadhitiAllocations = allocations.filter((allocation: any) => {
                              return projects.some((p: any) => p.id === allocation.projectId);
                            });

                            // Calculate percentage based on number of active projects (assuming each project = 25-50% allocation)
                            const baseAllocation = 40; // Base percentage per project
                            const occupationPercentage = Math.min(navadhitiAllocations.length * baseAllocation, 100);

                            // Determine color and status based on occupation percentage
                            const getOccupationInfo = (percentage: number) => {
                              if (percentage === 0) {
                                return { 
                                  bgColor: 'bg-gray-300', 
                                  textColor: 'text-gray-700', 
                                  borderColor: 'border-gray-400',
                                  label: 'Available',
                                  status: 'Not Occupied'
                                };
                              } else if (percentage <= 10) {
                                return { 
                                  bgColor: 'bg-red-500', 
                                  textColor: 'text-red-700', 
                                  borderColor: 'border-red-500',
                                  label: 'Under-utilized',
                                  status: '10% Occupied'
                                };
                              } else if (percentage <= 50) {
                                return { 
                                  bgColor: 'bg-yellow-500', 
                                  textColor: 'text-yellow-700', 
                                  borderColor: 'border-yellow-500',
                                  label: 'Moderate',
                                  status: '50% Occupied'
                                };
                              } else if (percentage <= 80) {
                                return { 
                                  bgColor: 'bg-orange-500', 
                                  textColor: 'text-orange-700', 
                                  borderColor: 'border-orange-500',
                                  label: 'Good Load',
                                  status: '80% Occupied'
                                };
                              } else {
                                return { 
                                  bgColor: 'bg-green-500', 
                                  textColor: 'text-green-700', 
                                  borderColor: 'border-green-500',
                                  label: 'Fully Occupied',
                                  status: '100% Occupied'
                                };
                              }
                            };

                            const occupationInfo = getOccupationInfo(occupationPercentage);

                            return (
                              <Card key={employee.id} className={`p-4 hover:shadow-md transition-all duration-200 border-l-4 ${occupationInfo.borderColor}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 flex-1">
                                    {/* Employee Avatar */}
                                    <Avatar className="h-16 w-16 border-2 border-gray-200">
                                      <AvatarImage src={employee.profilePicture} alt={`${employee.firstName} ${employee.lastName}`} />
                                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg">
                                        {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>

                                    {/* Employee Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                          {employee.firstName} {employee.lastName}
                                        </h4>
                                        <Badge variant="outline" className="text-xs">
                                          {employee.department}
                                        </Badge>
                                      </div>

                                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                                        ID: {employee.employeeId}
                                      </p>

                                      {/* Current Projects */}
                                      <div className="space-y-1">
                                        {navadhitiAllocations.length > 0 ? (
                                          <div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                              Current Projects: 
                                            </span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {navadhitiAllocations.slice(0, 3).map((allocation: any) => {
                                                const project = projects.find((p: any) => p.id === allocation.projectId);
                                                return project ? (
                                                  <Badge key={allocation.id} variant="secondary" className="text-xs">
                                                    {project.projectName}
                                                  </Badge>
                                                ) : null;
                                              })}
                                              {navadhitiAllocations.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                  +{navadhitiAllocations.length - 3} more
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-gray-500 italic">
                                            Available for new projects
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Progress and Actions */}
                                  <div className="flex items-center gap-6">
                                    {/* Progress Section */}
                                    <div className="text-center min-w-32">
                                      <div className="mb-2">
                                        <Badge className={`text-xs font-semibold px-2 py-1 ${occupationInfo.textColor} bg-opacity-20`} style={{
                                          backgroundColor: occupationInfo.bgColor.replace('bg-', '').includes('gray') ? '#F3F4F6' : 
                                                          occupationInfo.bgColor.includes('red') ? '#FEF2F2' : 
                                                          occupationInfo.bgColor.includes('yellow') ? '#FFFBEB' : 
                                                          occupationInfo.bgColor.includes('orange') ? '#FFF7ED' : '#F0FDF4'
                                        }}>
                                          {occupationPercentage}%
                                        </Badge>
                                      </div>

                                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-3 mx-auto mb-1">
                                        <div 
                                          className={`${occupationInfo.bgColor} h-3 rounded-full transition-all duration-500`}
                                          style={{ width: `${occupationPercentage}%` }}
                                        />
                                      </div>

                                      <div className={`text-xs font-medium ${occupationInfo.textColor}`}>
                                        {occupationInfo.label}
                                      </div>

                                      <div className="text-xs text-gray-500 mt-1">
                                        {navadhitiAllocations.length} active project{navadhitiAllocations.length !== 1 ? 's' : ''}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleManageEmployeeProjects(employee)}
                                      >
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        {navadhitiAllocations.length > 0 ? 'Manage Projects' : 'Allocate to Project'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      {/* Table View for Employees */}
                      {resourceViewMode === 'table' && (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Current Projects</TableHead>
                                <TableHead>Allocation Status</TableHead>
                                <TableHead>Occupation %</TableHead>
                                <TableHead>Active Projects</TableHead>
                                <TableHead>Technologies</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEmployees.map((employee: any) => {
                                // Calculate occupation percentage more accurately
                                const allocations = employeeProjectsData.filter((ep: any) => ep.employeeId === employee.id && ep.isActive);
                                const navadhitiAllocations = allocations.filter((allocation: any) => {
                                  return projects.some((p: any) => p.id === allocation.projectId);
                                });

                                // Calculate percentage based on number of active projects (assuming each project = 25-50% allocation)
                                const baseAllocation = 40; // Base percentage per project
                                const occupationPercentage = Math.min(navadhitiAllocations.length * baseAllocation, 100);

                                // Determine color and status based on occupation percentage
                                const getOccupationInfo = (percentage: number) => {
                                  if (percentage === 0) {
                                    return { 
                                      bgColor: 'bg-gray-300', 
                                      textColor: 'text-gray-700', 
                                      borderColor: 'border-gray-400',
                                      label: 'Available',
                                      status: 'Not Occupied'
                                    };
                                  } else if (percentage <= 10) {
                                    return { 
                                      bgColor: 'bg-red-500', 
                                      textColor: 'text-red-700', 
                                      borderColor: 'border-red-500',
                                      label: 'Under-utilized',
                                      status: '10% Occupied'
                                    };
                                  } else if (percentage <= 50) {
                                    return { 
                                      bgColor: 'bg-yellow-500', 
                                      textColor: 'text-yellow-700', 
                                      borderColor: 'border-yellow-500',
                                      label: 'Moderate',
                                      status: '50% Occupied'
                                    };
                                  } else if (percentage <= 80) {
                                    return { 
                                      bgColor: 'bg-orange-500', 
                                      textColor: 'text-orange-700', 
                                      borderColor: 'border-orange-500',
                                      label: 'Good Load',
                                      status: '80% Occupied'
                                    };
                                  } else {
                                    return { 
                                      bgColor: 'bg-green-500', 
                                      textColor: 'text-green-700', 
                                      borderColor: 'border-green-500',
                                      label: 'Fully Occupied',
                                      status: '100% Occupied'
                                    };
                                  }
                                };

                                const occupationInfo = getOccupationInfo(occupationPercentage);

                                return (
                                  <TableRow key={employee.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-gray-200">
                                          <AvatarImage src={employee.profilePicture} alt={`${employee.firstName} ${employee.lastName}`} />
                                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                            {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                                          <div className="text-sm text-gray-500">{employee.employeeId}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{employee.department}</TableCell>
                                    <TableCell>
                                      {navadhitiAllocations.length > 0 ? (
                                        <div className="space-y-1">
                                          {navadhitiAllocations.slice(0, 2).map((allocation: any) => {
                                            const project = projects.find((p: any) => p.id === allocation.projectId);
                                            return project ? (
                                              <div key={allocation.id} className="text-sm">
                                                <Badge variant="secondary" className="text-xs">
                                                  {project.projectName}
                                                </Badge>
                                                <div className="text-xs text-gray-500 mt-1">
                                                  {allocation.role || 'Team Member'}
                                                </div>
                                              </div>
                                            ) : null;
                                          })}
                                          {navadhitiAllocations.length > 2 && (
                                            <div className="text-xs text-gray-500 italic">
                                              +{navadhitiAllocations.length - 2} more
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-500 italic">
                                          Available for new projects
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`text-xs font-semibold px-2 py-1 ${occupationInfo.textColor} bg-opacity-20`} style={{
                                        backgroundColor: occupationInfo.bgColor.replace('bg-', '').includes('gray') ? '#F3F4F6' : 
                                                        occupationInfo.bgColor.includes('red') ? '#FEF2F2' : 
                                                        occupationInfo.bgColor.includes('yellow') ? '#FFFBEB' : 
                                                        occupationInfo.bgColor.includes('orange') ? '#FFF7ED' : '#F0FDF4'
                                      }}>
                                        {occupationInfo.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`${occupationInfo.bgColor} h-2 rounded-full`}
                                            style={{ width: `${occupationPercentage}%` }}
                                          />
                                        </div>
                                        <span className="text-sm text-gray-600">
                                          {occupationPercentage}%
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-center">
                                        <div className="font-medium text-sm">{navadhitiAllocations.length}</div>
                                        <div className="text-xs text-gray-500">projects</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {employee.technologies && employee.technologies.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {employee.technologies.slice(0, 2).map((tech: string, index: number) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {tech}
                                            </Badge>
                                          ))}
                                          {employee.technologies.length > 2 && (
                                            <Badge variant="outline" className="text-xs">
                                              +{employee.technologies.length - 2}
                                            </Badge>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 text-sm">None</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleManageEmployeeProjects(employee)}
                                      >
                                        <UserCheck className="h-4 w-4 mr-1" />
                                        {navadhitiAllocations.length > 0 ? 'Manage' : 'Allocate'}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Empty State */}
                      {filteredEmployees.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {employeesData.length === 0 ? "No employees found" : "No employees match your search"}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            {employeesData.length === 0 
                              ? "Import employees to view their allocation status." 
                              : `No employees found for "${searchTerm}". Try adjusting your search or filters.`}
                          </p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Review Dialog */}
        <StatusReviewDialog
          project={statusUpdateProject}
          isOpen={isStatusDialogOpen}
          onClose={() => {
            setIsStatusDialogOpen(false);
            setStatusUpdateProject(null);
          }}
        />

        {/* Project View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingProject?.projectName || 'Project Details'}</DialogTitle>
            </DialogHeader>
            {viewingProject ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  {viewingProject.projectImage ? (
                    <img 
                      src={viewingProject.projectImage} 
                      alt={`${viewingProject.projectName} logo`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-white text-3xl font-bold">
                        {viewingProject.projectName?.charAt(0)?.toUpperCase() || 'P'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Project Name</Label>
                    <p className="font-semibold text-lg mt-1">{viewingProject.projectName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Customer Name</Label>
                    <p className="font-medium text-lg mt-1">{viewingProject.clientName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Status</Label>
                    <p className="mt-1">
                      <Badge 
                        variant={viewingProject.status === 'Active' ? 'default' : 'secondary'}
                        className={`${
                          viewingProject.status === 'Active' 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : viewingProject.status === 'Completed'
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : viewingProject.status === 'On Hold'
                            ? 'bg-yellow-500 hover:bg-yellow-600'
                            : 'bg-red-500 hover:bg-red-600'
                        } text-white text-xs`}
                      >
                        {viewingProject.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Priority</Label>
                    <p className="mt-1 font-medium">
                      <Badge variant="secondary">{viewingProject.priority}</Badge>
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500 uppercase tracking-wide">Description</Label>
                  <p className="mt-1 text-gray-700">{viewingProject.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Start Date</Label>
                    <p className="mt-1 text-gray-700">
                      {viewingProject.startDate ? new Date(viewingProject.startDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">End Date</Label>
                    <p className="mt-1 text-gray-700">
                      {viewingProject.endDate ? new Date(viewingProject.endDate).toLocaleDateString() : 'Ongoing'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Technologies</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewingProject.technologies && viewingProject.technologies.length > 0 ? (
                        viewingProject.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-500">None</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Team Members</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{viewingProject.assignedEmployees?.length || 0} members</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Budget</Label>
                    <p className="mt-1 font-medium text-gray-700">
                      {viewingProject.budget ? `$${viewingProject.budget.toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Progress</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${viewingProject.completionPercentage || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">
                        {viewingProject.completionPercentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional details for Status Review */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Current Sprint</Label>
                    <p className="mt-1 text-gray-700">{viewingProject.currentSprint || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Current Issues</Label>
                    <p className="mt-1 text-gray-700">{viewingProject.currentIssues || 'None'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Weekly Comms</Label>
                    <p className="mt-1 text-gray-700">{viewingProject.weeklyComms || 'Not Set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Immediate Action Items</Label>
                    <p className="mt-1 text-gray-700">{viewingProject.immediateActionItems || 'None'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1">
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Support Required</Label>
                    <p className="mt-1 text-gray-700">{viewingProject.supportRequired || 'None'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1">
                  <div>
                    <Label className="text-sm text-gray-500 uppercase tracking-wide">Additional Remarks</Label>
                    <p className="mt-1 text-gray-700">{viewingProject.additionalRemarks || 'None'}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <p>Loading project details...</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Manage Employee Dialog */}
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Employee Projects</DialogTitle>
              <DialogDescription>
                {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''}
              </DialogDescription>
            </DialogHeader>

            {selectedEmployee && (
              <div className="space-y-6">
                {/* Current Active Projects */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Active Projects</h3>
                  <div className="space-y-3">
                    {employeeProjectsData
                      .filter((ep: any) => ep.employeeId === selectedEmployee.id && ep.isActive)
                      .map((allocation: any) => {
                        const project = projects.find((p: any) => p.id === allocation.projectId);
                        const daysWorked = calculateDaysWorked(allocation.startDate, allocation.endDate);

                        return (
                          <Card key={allocation.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{project?.projectName || 'Unknown Project'}</h4>
                                  <Badge variant="secondary">{allocation.role}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">Start Date:</span>{' '}
                                    {allocation.startDate ? format(new Date(allocation.startDate), 'PP') : 'Not set'}
                                  </div>
                                  <div>
                                    <span className="font-medium">End Date:</span>{' '}
                                    {allocation.endDate ? format(new Date(allocation.endDate), 'PP') : 'Ongoing'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Days Worked:</span>{' '}
                                    <Badge variant="outline">{daysWorked} days</Badge>
                                  </div>
                                  <div>
                                    <span className="font-medium">Status:</span>{' '}
                                    <Badge className={
                                      allocation.status === 'active' ? 'bg-green-100 text-green-800' :
                                      allocation.status === 'learning' ? 'bg-orange-100 text-orange-800' :
                                      allocation.status === 'leave' ? 'bg-gray-100 text-gray-800' :
                                      'bg-blue-100 text-blue-800'
                                    }>
                                      {allocation.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAllocation(allocation);
                                    setNewEndDate(allocation.endDate ? format(new Date(allocation.endDate), 'yyyy-MM-dd') : '');
                                    setIsEndDateDialogOpen(true);
                                  }}
                                >
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Update End Date
                                </Button>

                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to unoccupy this employee from this project?')) {
                                      unoccupyEmployeeMutation.mutate(allocation.id);
                                      setIsManageDialogOpen(false); // Close dialog after action
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Unoccupy
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </div>

                {/* Project History */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Project History</h3>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Days Worked</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Modified</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeProjectHistory.filter((history: any) => history.employeeId === selectedEmployee.id).map((history: any) => {
                          const daysWorked = calculateDaysWorked(history.startDate, history.endDate);

                          return (
                            <TableRow key={history.id}>
                              <TableCell className="font-medium">
                                {history.projectName || 'Unknown Project'}
                              </TableCell>
                              <TableCell>{history.role}</TableCell>
                              <TableCell>
                                {history.startDate ? format(new Date(history.startDate), 'PP') : 'Not set'}
                              </TableCell>
                              <TableCell>
                                {history.endDate ? format(new Date(history.endDate), 'PP') : 'Ongoing'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{daysWorked} days</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  history.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }>
                                  {history.isActive ? 'Active' : 'Completed'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {history.updatedAt ? format(new Date(history.updatedAt), 'PPp') : 'Not available'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* End Date Update Dialog */}
        <Dialog open={isEndDateDialogOpen} onOpenChange={setIsEndDateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Project End Date</DialogTitle>
              <DialogDescription>
                Update the end date for {selectedEmployee?.firstName} on {selectedAllocation && projects.find((p: any) => p.id === selectedAllocation.projectId)?.projectName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current End Date</Label>
                <Input 
                  value={selectedAllocation?.endDate ? format(new Date(selectedAllocation.endDate), 'yyyy-MM-dd') : ''} 
                  disabled 
                />
              </div>
              <div>
                <Label>New End Date</Label>
                <Input 
                  type="date" 
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsEndDateDialogOpen(false);
                  setSelectedAllocation(null);
                  setNewEndDate('');
                }}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  if (newEndDate && selectedAllocation) {
                    updateEmployeeProjectMutation.mutate({
                      allocationId: selectedAllocation.id,
                      endDate: newEndDate
                    });
                    setIsEndDateDialogOpen(false);
                    setSelectedAllocation(null);
                    setNewEndDate('');
                  }
                }}>
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}