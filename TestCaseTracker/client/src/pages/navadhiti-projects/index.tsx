import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, Users, Briefcase, Search, Filter, X, ChevronDown, CheckCircle2, Clock, UserCheck, BookOpen, AlertCircle, Send, Download, FileType, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("projects");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusReviewData, setStatusReviewData] = useState<any[]>([]);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedProjectForStatus, setSelectedProjectForStatus] = useState<any>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [statusUpdateProject, setStatusUpdateProject] = useState<NavadhitiProject | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'table'>('card');

  // Resource Allocation Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [technologyFilter, setTechnologyFilter] = useState<string[]>([]);
  const [statusEmployeeFilter, setStatusEmployeeFilter] = useState<string>("all");
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [allocationRole, setAllocationRole] = useState("");
  const [allocationStartDate, setAllocationStartDate] = useState("");
  const [allocationEndDate, setAllocationEndDate] = useState("");

  // Fetch projects
  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/navadhiti-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/navadhiti-projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      console.log('Fetched projects:', data); // Debug log
      return data;
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
    enabled: activeTab === "resourceAllocation"
  });

  // Fetch employee project mappings
  const { data: employeeProjectsData = [] } = useQuery({
    queryKey: ["/api/employee-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employee-projects");
      if (!res.ok) throw new Error("Failed to fetch employee projects");
      return res.json();
    },
    enabled: activeTab === "resourceAllocation"
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
    enabled: activeTab === "resourceAllocation"
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
    },
    onError: () => {
      toast({ title: "Failed to unoccupy employee", variant: "destructive" });
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
          <TabsList className="grid w-full grid-cols-3">
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

                {/* Employee Grid */}
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
                                </div>
                              )}

                              <div className="mt-2 flex gap-1">
                                {status === 'available' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs h-7"
                                    onClick={() => {
                                      setSelectedEmployees([employee.id]);
                                      setIsAllocationDialogOpen(true);
                                    }}
                                  >
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Quick Allocate
                                  </Button>
                                ) : (
                                  <div className="flex gap-1 w-full">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs h-7"
                                      onClick={() => {
                                        if (allocation && confirm('Are you sure you want to unoccupy this employee?')) {
                                          // Call mutation to unoccupy employee
                                          unoccupyEmployeeMutation.mutate(allocation.id);
                                        }
                                      }}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Unoccupy
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs h-7"
                                      onClick={() => {
                                        setSelectedEmployees([employee.id]);
                                        setIsAllocationDialogOpen(true);
                                      }}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
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
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
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

                {/* Projects Grid */}
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
                                    // View project details logic
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
                                  <Badge variant="outline">
                                    {project.currentSprint || 'Not Set'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-32 truncate">
                                  {project.currentIssues || 'None'}
                                </TableCell>
                                <TableCell className="max-w-32 truncate">
                                  {project.weeklyComms || 'Not Set'}
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
      </div>
    </MainLayout>
  );
}