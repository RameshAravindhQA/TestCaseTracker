
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, TrendingUp, AlertCircle, CheckCircle, Download, Upload, Search, Edit, Trash2, Calendar, Filter, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NavadhitiProjectForm } from "@/components/navadhiti/navadhiti-project-form";
import { CSVImportDialog } from "@/components/navadhiti/csv-import-dialog";
import { MainLayout } from "@/components/layout/main-layout";

export default function NavadhitiProjectsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/navadhiti-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/navadhiti-projects");
      return res.json();
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number; field: string; value: string }) => {
      await apiRequest("PATCH", `/api/navadhiti-projects/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      toast({ title: "Project updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/navadhiti-projects/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Project deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
    },
    onError: () => {
      toast({ title: "Failed to delete project", variant: "destructive" });
    },
  });

  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || getOverallStatus(project) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeProjects = projects.filter((project: any) => 
    getOverallStatus(project) === "active" || getOverallStatus(project) === "in-progress"
  );

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProject(null);
  };

  const handleStatusUpdate = (projectId: number, field: string, value: string) => {
    updateProjectMutation.mutate({ id: projectId, field, value });
  };

  const getOverallStatus = (project: any) => {
    const avg = (project.activityStatus + project.sprintStatus + project.communicationStatus) / 3;
    if (avg >= 90) return "active";
    if (avg >= 60) return "in-progress";
    if (avg >= 30) return "at-risk";
    return "blocked";
  };

  const getStatusBadge = (activityStatus: number, sprintStatus: number, communicationStatus: number) => {
    const status = getOverallStatus({ activityStatus, sprintStatus, communicationStatus });
    const colors = {
      active: "bg-green-500",
      "in-progress": "bg-yellow-500", 
      "at-risk": "bg-orange-500",
      blocked: "bg-red-500"
    };
    
    return (
      <Badge className={`${colors[status]} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Red": return "bg-red-500";
      case "Amber": return "bg-yellow-500";
      case "Green": return "bg-green-500";
      case "No update": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const exportToPDF = () => {
    // Create CSV content for PDF export
    const headers = [
      "Project Name", "Activity", "Sprint", "Current Issues", "Action Items", 
      "Overall Status", "Activity Status", "Sprint Status", "Communication Status"
    ];
    
    const csvContent = [
      headers.join(","),
      ...filteredProjects.map((project: any) => [
        `"${project.projectName}"`,
        `"${project.overallProjectActivity || ""}"`,
        `"${project.currentSprint || ""}"`,
        `"${project.currentIssues || ""}"`,
        `"${project.immediateActionItems || ""}"`,
        `"${getOverallStatus(project)}"`,
        project.activityStatus || 0,
        project.sprintStatus || 0,
        project.communicationStatus || 0
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `navadhiti-projects-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Export completed", description: "Project data exported successfully" });
  };

  const downloadTemplate = () => {
    const headers = [
      "Project Name", "Overall Project Activity", "Current Sprint", "Current Issues",
      "Weekly Comms", "Immediate Action Items", "Support Required", 
      "Additional Remarks / Inputs", "Activity Status", "Sprint Status", "Communication Status"
    ];

    const csvContent = headers.join(",") + "\n" + 
      "Sample Project,Backend API Development,Sprint 3,Database connection issues,Weekly standup completed,Fix database connectivity,DevOps support for deployment,Need additional developer,75,90,100";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "navadhiti-projects-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-500 rounded-xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Navadhiti Projects</h1>
              <p className="text-muted-foreground">
                Project allocation and activity tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Navadhiti Projects</DialogTitle>
                </DialogHeader>
                <CSVImportDialog
                  onImportSuccess={() => setIsImportOpen(false)}
                  importEndpoint="/api/navadhiti-projects/import"
                />
              </DialogContent>
            </Dialog>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingProject ? "Edit Project" : "Add New Project"}
                  </DialogTitle>
                </DialogHeader>
                <NavadhitiProjectForm
                  project={editingProject}
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingProject(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Project Overview</TabsTrigger>
            <TabsTrigger value="calendar">Active Projects Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Projects ({filteredProjects.length})
                </CardTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="at-risk">At Risk</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Activity</TableHead>
                          <TableHead>Sprint</TableHead>
                          <TableHead>Issues</TableHead>
                          <TableHead>Action Items</TableHead>
                          <TableHead>Status Progress</TableHead>
                          <TableHead>Overall Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProjects.map((project: any) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium max-w-[200px]">
                              <div className="truncate" title={project.projectName}>
                                {project.projectName}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[150px]">
                              <div className="truncate" title={project.overallProjectActivity}>
                                {project.overallProjectActivity || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[120px]">
                              <div className="truncate" title={project.currentSprint}>
                                {project.currentSprint || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="truncate" title={project.currentIssues}>
                                {project.currentIssues || "None"}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="truncate" title={project.immediateActionItems}>
                                {project.immediateActionItems || "None"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs w-16">Activity:</span>
                                  <Progress value={project.activityStatus || 0} className="h-2 flex-1" />
                                  <span className="text-xs w-8">{project.activityStatus || 0}%</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs w-16">Sprint:</span>
                                  <Progress value={project.sprintStatus || 0} className="h-2 flex-1" />
                                  <span className="text-xs w-8">{project.sprintStatus || 0}%</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs w-16">Comms:</span>
                                  <Progress value={project.communicationStatus || 0} className="h-2 flex-1" />
                                  <span className="text-xs w-8">{project.communicationStatus || 0}%</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(
                                project.activityStatus || 0,
                                project.sprintStatus || 0,
                                project.communicationStatus || 0
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(project)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(project.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Active Projects Calendar View ({activeProjects.length})
                </CardTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-40"
                    />
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search active projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Button onClick={exportToPDF} variant="outline">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Overall Project Status</TableHead>
                        <TableHead>Current Sprint Status</TableHead>
                        <TableHead>Current Issues</TableHead>
                        <TableHead>Weekly Comms</TableHead>
                        <TableHead>Immediate Action Items</TableHead>
                        <TableHead>Support Required</TableHead>
                        <TableHead>Additional Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeProjects
                        .filter((project: any) => 
                          project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((project: any) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            {project.projectName}
                          </TableCell>
                          <TableCell>
                            {project.projectLead || "Unassigned"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={project.overallProjectStatus || "No update"}
                              onValueChange={(value) => handleStatusUpdate(project.id, "overallProjectStatus", value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Red">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    Red
                                  </div>
                                </SelectItem>
                                <SelectItem value="Amber">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    Amber
                                  </div>
                                </SelectItem>
                                <SelectItem value="Green">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    Green
                                  </div>
                                </SelectItem>
                                <SelectItem value="No update">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                    No update
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={project.currentSprintStatus || "No update"}
                              onValueChange={(value) => handleStatusUpdate(project.id, "currentSprintStatus", value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Red">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    Red
                                  </div>
                                </SelectItem>
                                <SelectItem value="Amber">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    Amber
                                  </div>
                                </SelectItem>
                                <SelectItem value="Green">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    Green
                                  </div>
                                </SelectItem>
                                <SelectItem value="No update">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                    No update
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="truncate" title={project.currentIssues}>
                              {project.currentIssues || "None"}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="truncate" title={project.weeklyComms}>
                              {project.weeklyComms || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="truncate" title={project.immediateActionItems}>
                              {project.immediateActionItems || "None"}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="truncate" title={project.supportRequired}>
                              {project.supportRequired || "None"}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="truncate" title={project.additionalRemarks}>
                              {project.additionalRemarks || "None"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
