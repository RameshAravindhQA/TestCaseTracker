import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectTable } from "@/components/projects/project-table";
import { ProjectImport } from "@/components/project/project-import";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, FolderOpen } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProjectForm } from "@/components/projects/project-form";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function ProjectsPage() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [location] = useLocation();

  // Check if we should open the form automatically (from dashboard)
  useEffect(() => {
    // Check if the URL has ?new=true query parameter
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('new') === 'true') {
      setSelectedProject(null);
      setFormOpen(true);
    }
  }, [location]);

  // Fetch projects
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await apiRequest("DELETE", `/api/projects/${projectId}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete project: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Handler for edit button
  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setFormOpen(true);
  };

  // Handler for delete button
  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  // Confirm delete handler
  const confirmDelete = () => {
    if (selectedProject) {
      deleteProjectMutation.mutate(selectedProject.id);
    }
  };

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-500 rounded-xl shadow-lg">
              <FolderOpen className="h-8 w-8 text-white" />
            </div>
            Projects
          </h1>
            <p className="mt-1 text-sm text-gray-600">Manage your testing projects</p>
          </div>
          <div className="flex gap-2">
            <ProjectImport />
            <Button onClick={() => {
              setSelectedProject(null);
              setFormOpen(true);
            }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ProjectTable 
            projects={projects || []} 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Create/Edit Project Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProject ? "Edit Project" : "Create New Project"}</DialogTitle>
            <DialogDescription>
              {selectedProject
                ? "Update the project details below."
                : "Fill in the details to create a new project."}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm 
            project={selectedProject || undefined}
            onSuccess={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{selectedProject?.name}" and all its test cases, modules, and bugs.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}