import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectSelect } from "@/components/ui/project-select";
import { ModuleSelect } from "@/components/ui/module-select";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { BugTable } from "@/components/bugs/bug-table";
import { BugForm } from "@/components/bugs/bug-form";
import { BugImport } from "@/components/bugs/bug-import";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, Module, TestCase, Bug } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Loader2, Copy, Bug as BugIcon } from "lucide-react";
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
import { TestCaseTags } from "@/components/test-cases/test-case-tags";
import { GitHubIssueButton } from "@/components/github/github-issue-button";

export default function BugsPage() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<number | string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Fetch projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch modules for selected project
  const { data: modules, isLoading: isModulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/projects/${selectedProjectId}/modules`],
    enabled: !!selectedProjectId,
  });

  // Fetch bugs for selected project/module
  const { data: bugs, isLoading: isBugsLoading } = useQuery<Bug[]>({
    queryKey: [`/api/projects/${selectedProjectId}/bugs`, { moduleId: selectedModuleId }],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      let url = `/api/projects/${selectedProjectId}/bugs`;
      // Add moduleId as a query parameter if it's set and not "all"
      if (selectedModuleId && selectedModuleId !== "all") {
        url += `?moduleId=${selectedModuleId}`;
      }
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Delete bug mutation
  const deleteBugMutation = useMutation({
    mutationFn: async (bugId: number) => {
      const res = await apiRequest("DELETE", `/api/bugs/${bugId}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bug deleted",
        description: "Bug has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/bugs`] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete bug: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Handler for view button
  const handleView = (bug: Bug) => {
    setSelectedBug(bug);
    setViewDialogOpen(true);
  };

  // Handler for edit button
  const handleEdit = (bug: Bug) => {
    setSelectedBug(bug);
    setFormOpen(true);
  };

  // Handler for making a copy of a bug with all its attachments
  const handleMakeCopy = (bug: Bug) => {
    // Create a new bug object based on the original but with modified properties
    const bugCopy = {
      ...bug,
      id: undefined,         // Remove ID so a new one will be generated
      bugId: undefined,      // Remove bugId so a new one will be generated
      title: `Copy of ${bug.title}`,
      status: "Open",        // Reset status to open for the new copy
      dateReported: undefined // This will be set to current date on server
    };

    setSelectedBug(bugCopy);
    setFormOpen(true);

    toast({
      title: "Created copy of bug",
      description: "You can now edit and save this copy of the bug report.",
    });
  };

  // Handler for delete button
  const handleDelete = (bug: Bug) => {
    setSelectedBug(bug);
    setDeleteDialogOpen(true);
  };

  // Confirm delete handler
  const confirmDelete = () => {
    if (selectedBug) {
      deleteBugMutation.mutate(selectedBug.id);
    }
  };

  // Filter modules by selected project
  const filteredModules = modules?.filter(module => 
    module.projectId === parseInt(selectedProjectId.toString())
  ) || [];

  // Filter bugs by module if module is selected
  const moduleFilteredBugs = selectedModuleId && selectedModuleId !== "all" 
    ? bugs?.filter(bug => bug.moduleId === parseInt(selectedModuleId.toString())) || []
    : bugs || [];

  // Filter bugs by search query and status
  const filteredBugs = moduleFilteredBugs?.filter(bug => {
    const matchesSearch = 
      bug.bugId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bug.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || statusFilter === "all" || bug.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        <div className="py-6 px-4 sm:px-6 lg:px-8 flex-shrink-0">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 via-rose-600 to-pink-500 rounded-xl shadow-lg">
                  <BugIcon className="h-8 w-8 text-white" />
                </div>
                Bug Reports
              </h1>
              <p className="text-gray-600 mt-2">
                Track and manage bug reports
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setFormOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Report Bug
              </Button>

              <BugImport
                projectId={selectedProjectId}
                onImportComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/bugs"] });
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Select
              value={selectedProjectId ? selectedProjectId.toString() : undefined}
              onValueChange={(value) => setSelectedProjectId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedModuleId ? selectedModuleId.toString() : "all"}
              onValueChange={(value) => setSelectedModuleId(value)}
              disabled={!selectedProjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {filteredModules?.map((module) => (
                  <SelectItem key={module.id} value={module.id.toString()}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder="Search bugs..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6 min-h-0">
          {!selectedProjectId ? (
            <Card>
              <CardContent className="pt-6 text-center py-10">
                <BugIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  Please select a project to view bug reports
                </p>
              </CardContent>
            </Card>
          ) : isBugsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <BugTable
              bugs={filteredBugs}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}
        </div>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] w-[95vw]">
            <DialogHeader>
              <DialogTitle>{selectedBug ? "Edit Bug Report" : "Report New Bug"}</DialogTitle>
              <DialogDescription>
                {selectedBug
                  ? "Update the bug report details below."
                  : "Fill in the details to report a new bug."}
              </DialogDescription>
            </DialogHeader>
            <BugForm
              bug={selectedBug || undefined}
              projectId={Number(selectedProjectId)}
              modules={modules}
              onSuccess={() => setFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] w-[95vw]">
            <DialogHeader>
              <DialogTitle>Bug Report Details</DialogTitle>
              <DialogDescription>
                {selectedBug?.bugId} - {selectedBug?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Severity</h3>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full
                      ${selectedBug?.severity === "Critical" ? "bg-red-100 text-red-800" : 
                        selectedBug?.severity === "Major" ? "bg-orange-100 text-orange-800" : 
                        selectedBug?.severity === "Minor" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"}`}>
                      {selectedBug?.severity}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Priority</h3>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full
                      ${selectedBug?.priority === "High" ? "bg-red-100 text-red-800" : 
                        selectedBug?.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"}`}>
                      {selectedBug?.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Status</h3>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full
                    ${selectedBug?.status === "Open" ? "bg-red-100 text-red-800" : 
                      selectedBug?.status === "In Progress" ? "bg-blue-100 text-blue-800" : 
                      selectedBug?.status === "Resolved" ? "bg-green-100 text-green-800" :
                      "bg-gray-100 text-gray-800"}`}>
                    {selectedBug?.status}
                  </span>
                </div>
              </div>

              {selectedBug?.tags && selectedBug.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium">Tags</h3>
                  <div className="mt-1">
                    <TestCaseTags tags={selectedBug.tags} />
                  </div>
                </div>
              )}

              {selectedBug?.environment && (
                <div>
                  <h3 className="text-sm font-medium">Environment</h3>
                  <p className="text-sm text-gray-700 mt-1">{selectedBug.environment}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium">Pre-Conditions</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedBug?.preConditions || "None specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Steps to Reproduce</h3>
                <pre className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-sans border border-gray-200 rounded-md p-3 bg-gray-50">{selectedBug?.stepsToReproduce}</pre>
              </div>

              <div>
                <h3 className="text-sm font-medium">Expected Result</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedBug?.expectedResult}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Actual Result</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedBug?.actualResult}</p>
              </div>

              {selectedBug?.comments && (
                <div>
                  <h3 className="text-sm font-medium">Comments</h3>
                  <p className="text-sm text-gray-700 mt-1">{selectedBug.comments}</p>
                </div>
              )}

              {selectedBug?.attachments && selectedBug.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium">Attachments ({selectedBug.attachments.length})</h3>
                  <div className="mt-2 space-y-2">
                    {selectedBug.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-gray-500">
                            {attachment.type} • {Math.round(attachment.size / 1024)} KB
                          </p>
                        </div>
                        <a
                          href={attachment.data}
                          download={attachment.name}
                          className="text-sm text-blue-600 hover:text-blue-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <GitHubIssueButton bug={selectedBug} projectId={selectedBug?.projectId || 0} />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleMakeCopy(selectedBug!);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Make as Copy
                  </Button>
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleEdit(selectedBug!);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the bug report "{selectedBug?.bugId} - {selectedBug?.title}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteBugMutation.isPending}
              >
                {deleteBugMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Bug Report"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}