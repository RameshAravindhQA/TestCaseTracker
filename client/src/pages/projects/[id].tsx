import { useState, useEffect, useTransition } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ModuleTable } from "@/components/modules/module-table";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, Module, TestCase, Bug, Activity, FormattedActivity } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ModuleForm } from "@/components/modules/module-form";
import { ModuleTable } from "@/components/modules/module-table";
import { TestCaseTable } from "@/components/test-cases/test-case-table";
import { BugTable } from "@/components/bugs/bug-table";
import { GitHubConfigForm } from "@/components/github/github-config-form";
import { TestCaseForm } from "@/components/test-cases/test-case-form";
import { TestCaseTags } from "@/components/test-cases/test-case-tags";
import { BugForm } from "@/components/bugs/bug-form";
import { ImportExport } from "@/components/test-cases/import-export";
import { format, formatDistance } from "date-fns";
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
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { 
  Edit, Plus, ArrowLeft, Trash, Layers, CheckSquare, Bug as BugIcon, FileText, Loader2, Github, Settings
} from "lucide-react";
import { ProjectExport } from "@/components/project/project-export";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = parseInt(id);

  // Add useTransition hook to handle suspense
  const [isPending, startTransition] = useTransition();

  // State for dialogs
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [testCaseFormOpen, setTestCaseFormOpen] = useState(false);
  const [bugFormOpen, setBugFormOpen] = useState(false);
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false);
  const [deleteTestCaseDialogOpen, setDeleteTestCaseDialogOpen] = useState(false);
  const [deleteBugDialogOpen, setDeleteBugDialogOpen] = useState(false);
  const [viewTestCaseDialogOpen, setViewTestCaseDialogOpen] = useState(false);
  const [viewBugDialogOpen, setViewBugDialogOpen] = useState(false);

  // Selected items for editing/deleting
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [selectedModuleForTestCase, setSelectedModuleForTestCase] = useState<Module | null>(null);
  const [showGitHubConfig, setShowGitHubConfig] = useState(false);

  // Fetch project details
  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });

  // Fetch modules
  const { data: modules, isLoading: isModulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/projects/${projectId}/modules`],
  });

  // Fetch test cases
  const { data: testCases, isLoading: isTestCasesLoading } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${projectId}/test-cases`],
  });

  // Fetch bugs
  const { data: bugs, isLoading: isBugsLoading } = useQuery<Bug[]>({
    queryKey: [`/api/projects/${projectId}/bugs`],
  });

    // Fetch GitHub config
  const { data: githubConfig } = useQuery({
    queryKey: ["github-config", project?.id],
    queryFn: async () => {
      const response = await fetch(`/api/github/config/${project?.id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch GitHub config");
      return response.json();
    },
    enabled: !!project?.id,
  });

  // Fetch activities
  const { data: activities, isLoading: isActivitiesLoading } = useQuery<Activity[]>({
    queryKey: [`/api/projects/${projectId}/activities`],
  });

  // Delete mutations
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
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/modules`] });
      setDeleteModuleDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete module: ${error}`,
        variant: "destructive",
      });
    },
  });

  const deleteTestCaseMutation = useMutation({
    mutationFn: async (testCaseId: number) => {
      const res = await apiRequest("DELETE", `/api/test-cases/${testCaseId}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test case deleted",
        description: "Test case has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
      setDeleteTestCaseDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete test case: ${error}`,
        variant: "destructive",
      });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bugs`] });
      setDeleteBugDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete bug: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete multiple test cases mutation
  const deleteMultipleTestCasesMutation = useMutation({
    mutationFn: async (testCaseIds: number[]) => {
      // Sequential deletion to ensure all are processed
      for (const id of testCaseIds) {
        await apiRequest("DELETE", `/api/test-cases/${id}`, undefined);
      }
      return { success: true };
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Test cases deleted",
        description: `${variables.length} test case(s) have been deleted successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activities`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete test cases: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Format activities for display
  const formatActivities = (activities: Activity[]): FormattedActivity[] => {
    return activities.map(activity => {
      let iconColor = "bg-primary-100";
      let iconName = "default";
      let formattedMessage = "";

      // Set icon color and name based on action and entity type
      if (activity.action.includes("created")) {
        iconColor = "bg-primary-100";
        iconName = "created";
      } else if (activity.action.includes("updated")) {
        iconColor = "bg-indigo-100";
        iconName = "updated";
      } else if (activity.action.includes("deleted")) {
        iconColor = "bg-red-100";
        iconName = "deleted";
      } else if (activity.action.includes("reported")) {
        iconColor = "bg-red-100";
        iconName = "reported";
      } else if (activity.action.includes("marked as")) {
        if (activity.action.includes("Resolved") || activity.action.includes("Closed")) {
          iconColor = "bg-green-100";
          iconName = "marked as Resolved";
        } else {
          iconColor = "bg-yellow-100";
          iconName = activity.action;
        }
      }

      // Format message based on entity type
      switch (activity.entityType) {
        case "project":
          formattedMessage = `<span class="font-medium text-gray-900">${activity.details.userName || "A user"}</span> ${activity.action} project <span class="font-medium text-gray-900">${activity.details.projectName}</span>`;
          break;
        case "module":
          formattedMessage = `<span class="font-medium text-gray-900">${activity.details.userName || "A user"}</span> ${activity.action} module <span class="font-medium text-gray-900">${activity.details.moduleName}</span>`;
          break;
        case "testCase":
          formattedMessage = `<span class="font-medium text-gray-900">${activity.details.userName || "A user"}</span> ${activity.action} test case <span class="font-medium text-gray-900">${activity.details.feature || activity.details.testCaseId}</span>`;
          break;
        case "bug":
          formattedMessage = `<span class="font-medium text-gray-900">${activity.details.userName || "A user"}</span> ${activity.action} bug <span class="font-medium text-gray-900">${activity.details.title || activity.details.bugId}</span>`;
          break;
        case "projectMember":
          formattedMessage = `<span class="font-medium text-gray-900">${activity.details.userName || "A user"}</span> ${activity.action} member <span class="font-medium text-gray-900">${activity.details.memberName || "someone"}</span> to project`;
          break;
        default:
          formattedMessage = `<span class="font-medium text-gray-900">${activity.details.userName || "A user"}</span> ${activity.action} a ${activity.entityType}`;
      }

      // Calculate time ago
      const timeAgo = formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true });

      return {
        ...activity,
        formattedMessage,
        iconColor,
        iconName,
        timeAgo
      };
    });
  };

  // Module handlers
  const handleAddModule = () => {
    setSelectedModule(null);
    setModuleFormOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setModuleFormOpen(true);
  };

  const handleDeleteModule = (module: Module) => {
    setSelectedModule(module);
    setDeleteModuleDialogOpen(true);
  };

  const handleViewTestCases = (module: Module) => {
    setSelectedModuleForTestCase(module);
  };

  // Test case handlers
  const handleAddTestCase = () => {
    setSelectedTestCase(null);
    setTestCaseFormOpen(true);
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setTestCaseFormOpen(true);
  };

  const handleDeleteTestCase = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setDeleteTestCaseDialogOpen(true);
  };

  const handleViewTestCase = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setViewTestCaseDialogOpen(true);
  };

  // Bug handlers
  const handleAddBug = () => {
    setSelectedBug(null);
    setBugFormOpen(true);
  };

  const handleEditBug = (bug: Bug) => {
    setSelectedBug(bug);
    setBugFormOpen(true);
  };

  const handleDeleteBug = (bug: Bug) => {
    setSelectedBug(bug);
    setDeleteBugDialogOpen(true);
  };

  const handleViewBug = (bug: Bug) => {
    // Show the bug in dialog instead of navigating to avoid the back navigation issue
    setSelectedBug(bug);
    setViewBugDialogOpen(true);
  };

  const handleReportBug = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setSelectedBug(null);
    setBugFormOpen(true);
  };

  // Handler for multiple deletion
  const handleDeleteMultipleTestCases = (ids: number[]) => {
    if (ids.length > 0) {
      // Confirm deletion with user
      if (window.confirm(`Are you sure you want to delete ${ids.length} test case(s)? This action cannot be undone.`)) {
        deleteMultipleTestCasesMutation.mutate(ids);
      }
    }
  };

  // Filter test cases by module if a module is selected
  const filteredTestCases = selectedModuleForTestCase
    ? testCases?.filter(tc => tc.moduleId === selectedModuleForTestCase.id) || []
    : testCases || [];

  // Format activities
  const formattedActivities = activities ? formatActivities(activities) : [];

  // Store the current path as referrer for bug navigation
  useEffect(() => {
    // Store project path as referrer for navigation back from bug pages
    sessionStorage.setItem('bugReferrer', `/projects/${projectId}`);
  }, [projectId]);

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Project header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/projects")}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {project?.status && (
              <StatusBadge status={project.status} />
            )}
          </div>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {isProjectLoading ? "Loading..." : project?.name}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {project?.description || "No description provided"}
              </p>

              {project && (
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                  {project.startDate && (
                    <div>
                      <span className="font-medium">Start Date:</span>{" "}
                      {format(new Date(project.startDate), "MMM d, yyyy")}
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <span className="font-medium">End Date:</span>{" "}
                      {format(new Date(project.endDate), "MMM d, yyyy")}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {format(new Date(project.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedModule(null);
                  navigate(`/projects/edit/${projectId}`);
                }}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Project
              </Button>
              <Button onClick={() => setShowCreateModule(true)}>
                Add Module
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowGitHubConfig(true)}
              >
                <Github className="h-4 w-4 mr-2" />
                {githubConfig ? 'Configure GitHub' : 'Setup GitHub'}
              </Button>

              {project && (
                <ProjectExport 
                  projectId={projectId} 
                  projectName={project.name} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Project tabs */}
        <Tabs defaultValue="modules" className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-[400px]">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Modules</span>
            </TabsTrigger>
            <TabsTrigger value="test-cases" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Test Cases</span>
            </TabsTrigger>
            <TabsTrigger value="bugs" className="flex items-center gap-2">
              <BugIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Bugs</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Modules Tab */}
          <TabsContent value="modules">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium">
                {selectedModuleForTestCase
                  ? `Test Cases for ${selectedModuleForTestCase.name}`
                  : "Modules"
                }
              </h2>

              <Button
                onClick={selectedModuleForTestCase ? handleAddTestCase : handleAddModule}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {selectedModuleForTestCase ? "Add Test Case" : "Add Module"}
              </Button>
            </div>

            {selectedModuleForTestCase ? (
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedModuleForTestCase(null)}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Modules
                </Button>

                {isTestCasesLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredTestCases.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-500">No test cases found for this module.</p>
                      <Button
                        onClick={handleAddTestCase}
                        variant="outline"
                        className="mt-4"
                      >
                        Add Test Case
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="mb-4">
                      <ImportExport
                        projectId={projectId}
                        moduleId={selectedModuleForTestCase.id}
                        testCases={filteredTestCases}
                        projectName={project?.name}
                        moduleName={selectedModuleForTestCase.name}
                      />
                    </div>
                    <TestCaseTable
                      testCases={filteredTestCases}
                      onEdit={handleEditTestCase}
                      onDelete={handleDeleteTestCase}
                      onView={handleViewTestCase}
                      onReportBug={handleReportBug}
                      onDeleteMultiple={handleDeleteMultipleTestCases}
                    />
                  </>
                )}
              </div>
            ) : (
              <>
                {isModulesLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (modules?.length || 0) === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-500">No modules found. Create your first module to get started.</p>
                      <Button
                        onClick={handleAddModule}
                        variant="outline"
                        className="mt-4"
                      >
                        Add Module
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <ModuleTable
                    modules={modules || []}
                    projectId={projectId}
                    onEdit={handleEditModule}
                    onDelete={handleDeleteModule}
                    onViewTestCases={handleViewTestCases}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Test Cases Tab */}
          <TabsContent value="test-cases">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium">All Test Cases</h2>
              <Button
                onClick={handleAddTestCase}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Test Case
              </Button>
            </div>

            {isTestCasesLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (testCases?.length || 0) === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No test cases found. Create your first test case to get started.</p>
                  <Button
                    onClick={handleAddTestCase}
                    variant="outline"
                    className="mt-4"
                  >
                    Add Test Case
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-4">
                  <ImportExport
                    projectId={projectId}
                    testCases={testCases || []}
                    projectName={project?.name}
                  />
                </div>
                <TestCaseTable
                  testCases={testCases || []}
                  onEdit={handleEditTestCase}
                  onDelete={handleDeleteTestCase}
                  onView={handleViewTestCase}
                  onReportBug={handleReportBug}
                  onDeleteMultiple={handleDeleteMultipleTestCases}
                />
              </>
            )}
          </TabsContent>

          {/* Bugs Tab */}
          <TabsContent value="bugs">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium">Bug Reports</h2>
              <Button
                onClick={handleAddBug}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Report Bug
              </Button>
            </div>

            {isBugsLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (bugs?.length || 0) === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No bug reports found.</p>
                  <Button
                    onClick={handleAddBug}
                    variant="outline"
                    className="mt-4"
                  >
                    Report Bug
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <BugTable
                bugs={bugs || []}
                onEdit={handleEditBug}
                onDelete={handleDeleteBug}
                onView={handleViewBug}
              />
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
                <CardDescription>Recent activities in this project</CardDescription>
              </CardHeader>
              <CardContent>
                {isActivitiesLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : formattedActivities.length === 0 ? (
                  <p className="text-center text-gray-500">No activities found for this project.</p>
                ) : (
                  <RecentActivity activities={formattedActivities} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Module Form Dialog */}
      <Dialog open={moduleFormOpen} onOpenChange={setModuleFormOpen}>
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
            projectId={projectId}
            onSuccess={() => setModuleFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Test Case Form Dialog */}
      <Dialog open={testCaseFormOpen} onOpenChange={setTestCaseFormOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedTestCase ? "Edit Test Case" : "Create New Test Case"}</DialogTitle>
            <DialogDescription>
              {selectedTestCase
                ? "Update the test case details below."
                : "Fill in the details to create a new test case."}
            </DialogDescription>
          </DialogHeader>
          <TestCaseForm 
            testCase={selectedTestCase || undefined}
            projectId={projectId}
            module={selectedModuleForTestCase || undefined}
            modules={modules || []}
            onSuccess={() => setTestCaseFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Bug Form Dialog */}
      <Dialog open={bugFormOpen} onOpenChange={setBugFormOpen}>
        <DialogContent className="sm:max-w-[700px]">
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
            projectId={projectId}
            testCase={selectedTestCase || undefined}
            modules={modules || []}
            onSuccess={() => setBugFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Test Case Dialog */}
      <Dialog open={viewTestCaseDialogOpen} onOpenChange={setViewTestCaseDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Test Case Details</DialogTitle>
            <DialogDescription>
              {selectedTestCase?.testCaseId} - {selectedTestCase?.feature}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Test Objective</h3>
              <p className="text-sm text-gray-700 mt-1">{selectedTestCase?.testObjective}</p>
            </div>

            {selectedTestCase?.tags && (selectedTestCase.tags as any[])?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium">Tags</h3>
                <div className="mt-2">
                  <TestCaseTags 
                    tags={selectedTestCase.tags as any[]} 
                    limit={10} 
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">Status</h3>
                <Badge variant={
                  selectedTestCase?.status === "Pass" 
                    ? "default" 
                    : selectedTestCase?.status === "Fail" 
                    ? "destructive" 
                    : selectedTestCase?.status === "Blocked"
                    ? "secondary"
                    : "outline"
                }>
                  {selectedTestCase?.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium">Priority</h3>
                <Badge variant="outline" className={
                  selectedTestCase?.priority === "High" 
                    ? "border-red-200 bg-red-100 text-red-800" 
                    : selectedTestCase?.priority === "Medium" 
                    ? "border-yellow-200 bg-yellow-100 text-yellow-800" 
                    : "border-green-200 bg-green-100 text-green-800"
                }>
                  {selectedTestCase?.priority}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Pre-Conditions</h3>
              <p className="text-sm text-gray-700 mt-1">{selectedTestCase?.preConditions || "None specified"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium">Test Steps</h3>
              <pre className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-sans">{selectedTestCase?.testSteps}</pre>
            </div>

            <div>
              <h3 className="text-sm font-medium">Expected Result</h3>
              <p className="text-sm text-gray-700 mt-1">{selectedTestCase?.expectedResult}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium">Actual Result</h3>
              <p className="text-sm text-gray-700 mt-1">{selectedTestCase?.actualResult || "Not recorded"}</p>
            </div>

            {selectedTestCase?.comments && (
              <div>
                <h3 className="text-sm font-medium">Comments</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedTestCase.comments}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setViewTestCaseDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setViewTestCaseDialogOpen(false);
                  handleEditTestCase(selectedTestCase!);
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setViewTestCaseDialogOpen(false);
                  handleReportBug(selectedTestCase!);
                }}
              >
                Report Bug
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Bug Dialog */}
      <Dialog open={viewBugDialogOpen} onOpenChange={setViewBugDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
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
                <Badge variant={
                  selectedBug?.severity === "Critical" 
                    ? "destructive" 
                    : selectedBug?.severity === "Major" 
                    ? "default" 
                    : selectedBug?.severity === "Minor"
                    ? "secondary"
                    : "outline"
                }>
                  {selectedBug?.severity}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium">Priority</h3>
                <Badge variant="outline" className={
                  selectedBug?.priority === "High" 
                    ? "border-red-200 bg-red-100 text-red-800" 
                    : selectedBug?.priority === "Medium" 
                    ? "border-yellow-200 bg-yellow-100 text-yellow-800" 
                    : "border-green-200 bg-green-100 text-green-800"
                }>
                  {selectedBug?.priority}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Status</h3>
              <Badge variant={
                selectedBug?.status === "Open" 
                  ? "destructive" 
                  : selectedBug?.status === "In Progress" 
                  ? "default" 
                  : selectedBug?.status === "Resolved"
                  ? "secondary"
                  : "outline"
              }>
                {selectedBug?.status}
              </Badge>
            </div>

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
              <pre className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-sans">{selectedBug?.stepsToReproduce}</pre>
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

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setViewBugDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setViewBugDialogOpen(false);
                  handleEditBug(selectedBug!);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Module Confirmation Dialog */}
      <AlertDialog open={deleteModuleDialogOpen} onOpenChange={setDeleteModuleDialogOpen}>
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
              onClick={() => selectedModule && deleteModuleMutation.mutate(selectedModule.id)}
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

      {/* Delete Test Case Confirmation Dialog */}
      <AlertDialog open={deleteTestCaseDialogOpen} onOpenChange={setDeleteTestCaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the test case "{selectedTestCase?.testCaseId} - {selectedTestCase?.feature}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTestCase && deleteTestCaseMutation.mutate(selectedTestCase.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTestCaseMutation.isPending}
            >
              {deleteTestCaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Test Case"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Bug Confirmation Dialog */}
      <AlertDialog open={deleteBugDialogOpen} onOpenChange={setDeleteBugDialogOpen}>
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
              onClick={() => selectedBug && deleteBugMutation.mutate(selectedBug.id)}
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
      <GitHubConfigForm
        open={showGitHubConfig}
        onOpenChange={setShowGitHubConfig}
        projectId={projectId}
        config={githubConfig}
      />
    </MainLayout>
  );
}