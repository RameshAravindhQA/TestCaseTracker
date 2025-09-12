
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface ProjectMappingDialogProps {
  employee: any;
  onClose: () => void;
}

export function ProjectMappingDialog({ employee, onClose }: ProjectMappingDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [role, setRole] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects/mapping-options"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects/mapping-options");
      return res.json();
    },
  });

  const { data: navadhitiProjects = [] } = useQuery({
    queryKey: ["/api/navadhiti-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/navadhiti-projects");
      return res.json();
    },
  });

  // Combine both project types
  const allProjects = [
    ...projects.map((p: any) => ({ ...p, type: 'regular' })),
    ...navadhitiProjects.map((p: any) => ({ ...p, type: 'navadhiti', name: p.projectName }))
  ];

  const { data: employeeProjects = [], refetch } = useQuery({
    queryKey: [`/api/employees/${employee.id}/projects`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/employees/${employee.id}/projects`);
      return res.json();
    },
  });

  const createMappingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/employee-projects", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Project mapping created successfully" });
      refetch();
      // Reset form
      setSelectedProjectId("");
      setRole("");
      setStartDate("");
      setEndDate("");
    },
    onError: () => {
      toast({ title: "Failed to create project mapping", variant: "destructive" });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employee-projects/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Project mapping removed successfully" });
      refetch();
    },
    onError: () => {
      toast({ title: "Failed to remove project mapping", variant: "destructive" });
    },
  });

  const handleAddMapping = () => {
    if (!selectedProjectId || !role) {
      toast({ title: "Please select a project and role", variant: "destructive" });
      return;
    }

    const [projectType, projectId] = selectedProjectId.split('-');
    
    createMappingMutation.mutate({
      employeeId: employee.id,
      projectId: parseInt(projectId),
      projectType: projectType,
      role,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: true,
    });
  };

  const handleDeleteMapping = (id: number) => {
    if (confirm("Are you sure you want to remove this project mapping?")) {
      deleteMappingMutation.mutate(id);
    }
  };

  const getProjectName = (projectId: number, projectType?: string) => {
    if (projectType === 'navadhiti') {
      const project = navadhitiProjects.find((p: any) => p.id === projectId);
      return project?.projectName ? `${project.projectName} (Navadhiti)` : `Navadhiti Project ${projectId}`;
    }
    const project = projects.find((p: any) => p.id === projectId);
    return project?.name || `Project ${projectId}`;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Project Mappings - {employee.firstName} {employee.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Mapping */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Add Project Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Project</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProjects.map((project: any) => (
                      <SelectItem key={`${project.type}-${project.id}`} value={`${project.type}-${project.id}`}>
                        {project.name} {project.type === 'navadhiti' ? '(Navadhiti)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Role</label>
                <Input
                  placeholder="e.g., Frontend Developer, QA Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <Button
              className="mt-4"
              onClick={handleAddMapping}
              disabled={createMappingMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Assignment
            </Button>
          </div>

          {/* Current Mappings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Project Assignments</h3>
            {employeeProjects.length === 0 ? (
              <p className="text-muted-foreground">No project assignments found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeProjects.map((mapping: any) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">
                        {getProjectName(mapping.projectId, mapping.projectType)}
                      </TableCell>
                      <TableCell>{mapping.role || "N/A"}</TableCell>
                      <TableCell>
                        {mapping.startDate
                          ? new Date(mapping.startDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {mapping.endDate
                          ? new Date(mapping.endDate).toLocaleDateString()
                          : "Ongoing"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mapping.isActive ? "default" : "secondary"}>
                          {mapping.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMapping(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
