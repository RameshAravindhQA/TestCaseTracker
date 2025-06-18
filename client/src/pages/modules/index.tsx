import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectSelect } from "@/components/ui/project-select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ModuleTable } from "@/components/modules/module-table";
import { ModuleForm } from "@/components/modules/module-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, Module } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Loader2 } from "lucide-react";
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
import { useLocation } from "wouter";

export default function ModulesPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  // Use localStorage to persist selectedProjectId and searchQuery between operations
  const [selectedProjectId, setSelectedProjectId] = useState<number | string>(() => {
    // Try to get saved projectId from localStorage
    const savedProjectId = localStorage.getItem('modules_selectedProjectId');
    return savedProjectId ? JSON.parse(savedProjectId) : "";
  });
  
  const [searchQuery, setSearchQuery] = useState(() => {
    // Try to get saved search query from localStorage
    const savedQuery = localStorage.getItem('modules_searchQuery');
    return savedQuery || "";
  });
  
  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('modules_selectedProjectId', JSON.stringify(selectedProjectId));
    }
  }, [selectedProjectId]);
  
  useEffect(() => {
    localStorage.setItem('modules_searchQuery', searchQuery);
  }, [searchQuery]);
  
  // Fetch projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Fetch modules for selected project
  const { data: modules, isLoading: isModulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/projects/${selectedProjectId}/modules`],
    enabled: !!selectedProjectId,
  });
  
  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const res = await apiRequest("DELETE", `/api/modules/${moduleId}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Module deleted",
        description: "Module has been deleted successfully",
      });
      
      // Ensure sidebar state persists after deletion
      localStorage.setItem('modules_selectedProjectId', JSON.stringify(selectedProjectId));
      localStorage.setItem('modules_searchQuery', searchQuery);
      
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/modules`] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete module: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Handler for edit button
  const handleEdit = (module: Module) => {
    setSelectedModule(module);
    setFormOpen(true);
  };
  
  // Handler for delete button
  const handleDelete = (module: Module) => {
    setSelectedModule(module);
    setDeleteDialogOpen(true);
  };

  // Handler for view test cases button
  const handleViewTestCases = (module: Module) => {
    navigate(`/projects/${module.projectId}?module=${module.id}`);
  };
  
  // Confirm delete handler
  const confirmDelete = () => {
    if (selectedModule) {
      deleteModuleMutation.mutate(selectedModule.id);
      // No need to set localStorage here as it's already done in the mutation's onSuccess callback
    }
  };

  // Filter modules by search query
  const filteredModules = modules?.filter(module => 
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (module.description && module.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Modules</h1>
            <p className="mt-1 text-sm text-gray-600">Manage test modules across all projects</p>
          </div>
          <Button 
            onClick={() => {
              if (!selectedProjectId) {
                toast({
                  title: "No project selected",
                  description: "Please select a project before creating a module",
                  variant: "destructive",
                });
                return;
              }
              setSelectedModule(null);
              setFormOpen(true);
            }} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Module
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <ProjectSelect
              projects={projects}
              isLoading={isProjectsLoading}
              selectedProjectId={selectedProjectId}
              onChange={(value) => setSelectedProjectId(parseInt(value))}
              placeholder="Select a project"
            />
          </div>
          
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search modules..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {!selectedProjectId ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">Please select a project to view its modules</p>
            </CardContent>
          </Card>
        ) : isModulesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredModules.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">
                {searchQuery 
                  ? "No modules found matching your search criteria" 
                  : "No modules found for this project. Create your first module to get started."}
              </p>
              <Button
                onClick={() => {
                  setSelectedModule(null);
                  setFormOpen(true);
                }}
                variant="outline"
                className="mt-4"
              >
                Add Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ModuleTable 
            modules={filteredModules} 
            projectId={Number(selectedProjectId)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewTestCases={handleViewTestCases}
          />
        )}
      </div>
      
      {/* Create/Edit Module Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedModule ? "Edit Module" : "Create New Module"}</DialogTitle>
            <DialogDescription>
              {selectedModule
                ? "Update the module details below."
                : "Fill in the details to create a new module."}
            </DialogDescription>
          </DialogHeader>
          <ModuleForm 
            module={selectedModule || undefined}
            projectId={Number(selectedProjectId)}
            onSuccess={() => {
              // Save sidebar state again when form is closed
              localStorage.setItem('modules_selectedProjectId', JSON.stringify(selectedProjectId));
              localStorage.setItem('modules_searchQuery', searchQuery);
              setFormOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the module "{selectedModule?.name}" and all its test cases.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteModuleMutation.isPending}
            >
              {deleteModuleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Module"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
