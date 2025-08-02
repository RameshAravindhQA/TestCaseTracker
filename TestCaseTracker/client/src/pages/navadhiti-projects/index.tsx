
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Upload, Download } from "lucide-react";
import { NavadhitiProjectForm } from "@/components/navadhiti/navadhiti-project-form";
import { CSVImportDialog } from "@/components/navadhiti/csv-import-dialog";

export default function NavadhitiProjectsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/navadhiti-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/navadhiti-projects");
      return res.json();
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

  const filteredProjects = projects.filter((project: any) =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatusBadge = (activityStatus: number, sprintStatus: number, communicationStatus: number) => {
    const allGreen = activityStatus === 100 && sprintStatus === 100 && communicationStatus === 100;
    return (
      <Badge variant={allGreen ? "default" : "secondary"}>
        {allGreen ? "All Clear" : "In Progress"}
      </Badge>
    );
  };

  const downloadTemplate = () => {
    const headers = [
      "Project Name",
      "Overall Project Activity", 
      "Current Sprint",
      "Current Issues",
      "Weekly Comms",
      "Immediate Action Items",
      "Support Required",
      "Additional Remarks / Inputs",
      "Activity Status",
      "Sprint Status", 
      "Communication Status"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Navadhiti Projects</h1>
          <p className="text-muted-foreground">Project allocation and activity tracking</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Projects from CSV</DialogTitle>
              </DialogHeader>
              <CSVImportDialog onClose={() => setIsImportOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
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
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Projects ({filteredProjects.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
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
    </div>
  );
}
