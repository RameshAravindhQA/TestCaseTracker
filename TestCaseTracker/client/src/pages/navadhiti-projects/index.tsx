import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavadhitiProjectForm } from "@/components/navadhiti/navadhiti-project-form";
import { CSVImportDialog } from "@/components/navadhiti/csv-import-dialog";
import { StatusReviewDialog } from "@/components/navadhiti/status-review-dialog";
import { Plus, MoreHorizontal, Edit, Trash2, Upload, Download, Filter, Search, Calendar, DollarSign, Users, TrendingUp, FileText, Building } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { ColorPicker } from "@/components/ui/color-picker";

interface NavadhitiProject {
  id: number;
  projectName: string;
  projectLead: string;
  overallProjectActivity: string;
  currentSprint: string;
  currentIssues: string;
  weeklyCommunications: string;
  immediateActionItems: string;
  supportRequired: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  teamSize?: number;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  customer?: string;
  projectImage?: string;
  clientName?: string;
}

// Status helper functions - moved to top level to avoid initialization issues
const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'in progress':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'on hold':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getOverallStatus = (project: NavadhitiProject): string => {
  if (!project) return 'Unknown';

  // Calculate overall status based on project data
  const hasIssues = project.currentIssues && project.currentIssues.trim() !== '';
  const needsSupport = project.supportRequired && project.supportRequired.trim() !== '';

  if (project.status === 'Completed') return 'Completed';
  if (project.status === 'Cancelled') return 'Cancelled';
  if (project.status === 'On Hold') return 'On Hold';

  if (hasIssues || needsSupport) return 'At Risk';
  if (project.status === 'Active' || project.status === 'In Progress') return 'On Track';

  return 'In Progress';
};

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

  // Fetch status reviews for selected date
  const { data: statusReviews = [] } = useQuery({
    queryKey: ["/api/navadhiti-projects/status-reviews", selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/navadhiti-projects/status-reviews?date=${selectedDate.toISOString().split('T')[0]}`);
      if (!res.ok) throw new Error("Failed to fetch status reviews");
      return res.json();
    },
    enabled: activeTab === "statusReview"
  });

  // Fetch projects
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["/api/navadhiti-projects"],
    queryFn: async () => {
      console.log("Fetching Navadhiti projects...");
      const res = await apiRequest("GET", "/api/navadhiti-projects");
      if (!res.ok) {
        throw new Error(`Failed to fetch projects: ${res.status}`);
      }
      const data = await res.json();
      console.log("Navadhiti projects data:", data);
      return data;
    },
  });

  // Filtered projects using useMemo to prevent re-computation issues
  const filteredProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) {
      console.log("No projects data or not an array:", projects);
      return [];
    }

    return projects.filter((project: NavadhitiProject) => {
      const matchesSearch = project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.projectLead?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || 
                           getOverallStatus(project).toLowerCase() === statusFilter.toLowerCase();

      const matchesPriority = priorityFilter === "all" || 
                             project.priority?.toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, searchTerm, statusFilter, priorityFilter]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/navadhiti-projects/${id}`);
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Project deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete project", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleEdit = (project: NavadhitiProject) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
  };

  const exportToCSV = () => {
    if (!projects.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = [
      "Project Name", "Project Lead", "Status", "Priority", "Start Date", 
      "End Date", "Budget", "Team Size", "Current Sprint", "Current Issues",
      "Weekly Communications", "Action Items", "Support Required"
    ];

    const csvContent = [
      headers.join(","),
      ...projects.map((project: NavadhitiProject) => [
        `"${project.projectName || ''}"`,
        `"${project.projectLead || ''}"`,
        `"${project.status || ''}"`,
        `"${project.priority || ''}"`,
        `"${project.startDate || ''}"`,
        `"${project.endDate || ''}"`,
        `"${project.budget || ''}"`,
        `"${project.teamSize || ''}"`,
        `"${project.currentSprint || ''}"`,
        `"${project.currentIssues || ''}"`,
        `"${project.weeklyCommunications || ''}"`,
        `"${project.immediateActionItems || ''}"`,
        `"${project.supportRequired || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `navadhiti-projects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Projects exported successfully" });
  };

  const exportStatusReviewToPDF = () => {
    if (!statusReviews.length) {
      toast({ title: "No status review data to export", variant: "destructive" });
      return;
    }

    // Create PDF content as HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Project Status Review - ${selectedDate.toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
            .green { background-color: #10b981; }
            .amber { background-color: #f59e0b; }
            .red { background-color: #ef4444; }
            .gray { background-color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Project Status Review</h1>
            <p class="date">Date: ${selectedDate.toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Project Name</th>
                <th>Project Lead</th>
                <th>Overall Status</th>
                <th>Sprint Status</th>
                <th>Weekly Comms</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${statusReviews.map(review => `
                <tr>
                  <td>${review.customerName || 'N/A'}</td>
                  <td>${review.projectName}</td>
                  <td>${review.projectLead || 'N/A'}</td>
                  <td><span class="status-badge ${review.overallProjectStatus}">${review.overallProjectStatusLabel || review.overallProjectStatus}</span></td>
                  <td><span class="status-badge ${review.currentSprintStatus}">${review.currentSprintStatusLabel || review.currentSprintStatus}</span></td>
                  <td><span class="status-badge ${review.weeklyComms}">${review.weeklyCommsLabel || review.weeklyComms}</span></td>
                  <td>${review.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create and download PDF
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `status-review-${selectedDate.toISOString().split('T')[0]}.html`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Status review exported successfully" });
  };

  const handleStatusUpdate = (projectId: number) => {
    setStatusUpdateProject(projects.find(p => p.id === projectId) || null);
    setIsStatusDialogOpen(true);
  };

  const handleExportPDF = () => {
    setExportingPDF(true);

    // Create a simple PDF export
    const printContent = `
      <html>
        <head>
          <title>Navadhiti Projects Status Review - ${selectedDate.toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .status-badge { padding: 4px 8px; border-radius: 4px; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Navadhiti Projects Status Review</h1>
            <h2>Date: ${selectedDate.toLocaleDateString()}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Project Name</th>
                <th>Project Lead</th>
                <th>Overall Status</th>
                <th>Sprint Status</th>
                <th>Weekly Communications</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProjects.map(project => `
                <tr>
                  <td>${project.customer || 'N/A'}</td>
                  <td>${project.projectName}</td>
                  <td>${project.projectLead || 'N/A'}</td>
                  <td>${project.overallStatus || 'No Update'}</td>
                  <td>${project.sprintStatus || 'No Update'}</td>
                  <td>${project.weeklyComms || 'No Update'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
        setExportingPDF(false);
      };
    } else {
      setExportingPDF(false);
      toast({
        title: "Error",
        description: "Could not open print window. Please check your browser settings.",
        variant: "destructive",
      });
    }
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!projects.length) return { total: 0, active: 0, completed: 0, atRisk: 0 };

    return {
      total: projects.length,
      active: projects.filter((p: NavadhitiProject) => p.status === 'Active').length,
      completed: projects.filter((p: NavadhitiProject) => p.status === 'Completed').length,
      atRisk: projects.filter((p: NavadhitiProject) => getOverallStatus(p) === 'At Risk').length,
    };
  }, [projects]);

  if (error) {
    console.error("Error loading Navadhiti projects:", error);
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error Loading Projects</h3>
              <p className="text-muted-foreground mt-2">
                {error instanceof Error ? error.message : "An unexpected error occurred"}
              </p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] })}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="statusReview">Status Review</TabsTrigger>
          </TabsList>
          <TabsContent value="projects">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Navadhiti Projects</h1>
                <p className="text-muted-foreground">Manage and track project activities</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => setIsCsvDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProject ? "Edit Project" : "Add New Project"}
                      </DialogTitle>
                    </DialogHeader>
                    <NavadhitiProjectForm
                      project={editingProject}
                      onSuccess={handleDialogClose}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">At Risk</p>
                        <p className="text-2xl font-bold text-red-600">{stats.atRisk}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="on track">On Track</SelectItem>
                      <SelectItem value="at risk">At Risk</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Projects Table */}
            <Card>
              <CardHeader>
                <CardTitle>Projects ({filteredProjects.length})</CardTitle>
                <CardDescription>
                  Manage your Navadhiti project portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading projects...</p>
                    </div>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {projects.length === 0 ? "No projects found. Create your first project!" : "No projects match your filters."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Created Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProjects.map((project: NavadhitiProject) => (
                          <TableRow key={project.id}>
                            <TableCell>
                              {project.projectImage ? (
                                <img
                                  src={project.projectImage}
                                  alt={project.projectName}
                                  className="w-12 h-12 object-cover rounded-lg border"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-6 w-6 text-gray-400"
                                  >
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {project.projectName}
                            </TableCell>
                            <TableCell>{project.clientName || project.customer || 'N/A'}</TableCell>
                            <TableCell>
                              {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(project.status)}
                              >
                                {project.status || 'Active'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(project)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(project.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CSV Import Dialog */}
            <Dialog open={isCsvDialogOpen} onOpenChange={setIsCsvDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import CSV</DialogTitle>
                </DialogHeader>
                <CSVImportDialog onClose={() => setIsCsvDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </TabsContent>
          <TabsContent value="statusReview">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Status Review</h2>
                  <p className="text-muted-foreground">Review project status for selected date</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleExportPDF}
                    disabled={exportingPDF}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {exportingPDF ? "Exporting..." : "Export PDF"}
                  </Button>
                </div>
              </div>

              {/* Date Selection */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium">Select Review Date:</label>
                      <DatePicker
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="mt-1"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {statusReviews.length} reviews found for {selectedDate.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Projects Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Projects</CardTitle>
                  <CardDescription>Click on a project to update its status</CardDescription>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No projects available</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project Image</TableHead>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Project Lead</TableHead>
                            <TableHead>Overall Status</TableHead>
                            <TableHead>Sprint Status</TableHead>
                            <TableHead>Weekly Comms</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projects.map((project: NavadhitiProject) => {
                            const review = statusReviews.find(r => r.projectId === project.id);
                            return (
                              <TableRow key={project.id}>
                                <TableCell>
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {project.projectImage ? (
                                      <img 
                                        src={project.projectImage} 
                                        alt={project.projectName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Building className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{project.clientName || project.customer || 'N/A'}</TableCell>
                                <TableCell className="font-medium">{project.projectName}</TableCell>
                                <TableCell>{project.projectLead || 'N/A'}</TableCell>
                                <TableCell>
                                  {review ? (
                                    <Badge variant="outline" className="text-white" style={{backgroundColor: review.overallProjectStatusColor || '#6b7280'}}>
                                      {review.overallProjectStatusLabel}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">No Update</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {review ? (
                                    <Badge variant="outline" className="text-white" style={{backgroundColor: review.currentSprintStatusColor || '#6b7280'}}>
                                      {review.currentSprintStatusLabel}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">No Update</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {review ? (
                                    <Badge variant="outline" className="text-white" style={{backgroundColor: review.weeklyCommsColor || '#6b7280'}}>
                                      {review.weeklyCommsLabel}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">No Update</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProjectForStatus(project);
                                      setIsStatusDialogOpen(true);
                                    }}
                                  >
                                    Update Status
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status Review Dialog */}
            <StatusReviewDialog
              isOpen={isStatusDialogOpen}
              onClose={() => {
                setIsStatusDialogOpen(false);
                setSelectedProjectForStatus(null);
              }}
              project={selectedProjectForStatus}
              selectedDate={selectedDate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}