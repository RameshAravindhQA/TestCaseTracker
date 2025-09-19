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
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, Module, TestCase, Bug, Activity, FormattedActivity, User } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ModuleForm } from "@/components/modules/module-form";
import { BugForm } from "@/components/bugs/bug-form";
import { BugTable } from "@/components/bugs/bug-table";
import { ProjectChat } from "@/components/chat/project-chat";
import { TestCaseTable } from "@/components/test-cases/test-case-table";
import { TestCaseForm } from "@/components/test-cases/test-case-form";
import { DeletedTestCaseTable } from "@/components/test-cases/deleted-test-case-table";
import { AITestGenerator } from "@/components/test-cases/ai-test-generator";
import { GitHubConfigForm } from "@/components/github/github-config-form";
import { TestCaseTags } from "@/components/test-cases/test-case-tags";
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
  Edit, Plus, ArrowLeft, Trash, Layers, CheckSquare, Bug as BugIcon, FileText, Loader2, Github, Settings, RefreshCw, Sparkles, Trash2, Users, BarChart3, FileDown, GitBranch, ChevronDown
} from "lucide-react";
import { ProjectExport } from "@/components/project/project-export";
import ProjectCollaborators from "@/components/projects/project-collaborators";
import { GitHubIssueButton } from "@/components/github/github-issue-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

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
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [bugFormOpen, setBugFormOpen] = useState(false);
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false);
  const [deleteTestCaseDialogOpen, setDeleteTestCaseDialogOpen] = useState(false);
  const [deleteBugDialogOpen, setDeleteBugDialogOpen] = useState(false);
  const [viewTestCaseDialogOpen, setViewTestCaseDialogOpen] = useState(false);
  const [viewBugDialogOpen, setViewBugDialogOpen] = useState(false);
  const [selectedDeletedTestCase, setSelectedDeletedTestCase] = useState<TestCase | null>(null);
  const [viewDeletedTestCaseDialogOpen, setViewDeletedTestCaseDialogOpen] = useState(false);
  const [showGitHubConfig, setShowGitHubConfig] = useState(false);
  const [showCreateModule, setShowCreateModule] = useState(false);


  // Selected items for editing/deleting
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [selectedModuleForTestCase, setSelectedModuleForTestCase] = useState<Module | null>(null);

  // Fetch project details
  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Fetch modules
  const { data: modules, isLoading: isModulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/projects/${projectId}/modules`],
    enabled: !!projectId,
  });

  // Fetch test cases
  const { data: testCases, isLoading: isTestCasesLoading } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${projectId}/test-cases`],
    enabled: !!projectId,
  });

  // Fetch bugs
  const { data: bugs, isLoading: isBugsLoading } = useQuery<Bug[]>({
    queryKey: [`/api/projects/${projectId}/bugs`],
    enabled: !!projectId,
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

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Fetch activities
  const { data: activities = [], isLoading: isActivitiesLoading } = useQuery<Activity[]>({
    queryKey: [`/api/projects/${projectId}/activities`],
    enabled: !!projectId,
  });

  // Fetch deleted test cases for this project
  const { data: deletedTestCases = [], isLoading: isDeletedTestCasesLoading } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${projectId}/deleted-test-cases`],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}/deleted-test-cases`);
      return res.json();
    },
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
        style: { backgroundColor: 'darkgreen', color: 'white' },
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
        style: { backgroundColor: 'darkgreen', color: 'white' },
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/deleted-test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activities`] });
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
        style: { backgroundColor: 'darkgreen', color: 'white' },
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
        style: { backgroundColor: 'darkgreen', color: 'white' },
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/deleted-test-cases`] });
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

  // Restore test case mutation
  const restoreTestCaseMutation = useMutation({
    mutationFn: async (testCaseId: number) => {
      const res = await apiRequest("POST", `/api/test-cases/${testCaseId}/restore`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test case restored",
        description: `Test case ${data.testCaseId} has been restored successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/deleted-test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to restore test case: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Permanent delete test case mutation
  const permanentDeleteTestCaseMutation = useMutation({
    mutationFn: async (testCaseId: number) => {
      const res = await apiRequest("DELETE", `/api/test-cases/${testCaseId}/permanent`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test case permanently deleted",
        description: "Test case has been permanently removed from the database",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/deleted-test-cases`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to permanently delete test case: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Bulk restore test cases mutation
  const bulkRestoreTestCasesMutation = useMutation({
    mutationFn: async (testCaseIds: number[]) => {
      // Sequential restoration to ensure all are processed
      const results = [];
      for (const id of testCaseIds) {
        const res = await apiRequest("POST", `/api/test-cases/${id}/restore`);
        results.push(await res.json());
      }
      return { success: true, restored: results.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Test cases restored",
        description: `${data.restored} test case(s) have been restored successfully`,
        style: { backgroundColor: 'darkgreen', color: 'white' },
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/deleted-test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to restore test cases: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Bulk permanent delete test cases mutation
  const bulkPermanentDeleteTestCasesMutation = useMutation({
    mutationFn: async (testCaseIds: number[]) => {
      // Sequential deletion to ensure all are processed
      for (const id of testCaseIds) {
        await apiRequest("DELETE", `/api/test-cases/${id}/permanent`);
      }
      return { success: true, deleted: testCaseIds.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Test cases permanently deleted",
        description: `${data.deleted} test case(s) have been permanently removed from the database`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/deleted-test-cases`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to permanently delete test cases: ${error}`,
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

      // Calculate time ago with proper date validation
      let timeAgo = "Unknown time";
      try {
        // Use timestamp first, then fall back to createdAt, then use current time as fallback
        const dateValue = activity.timestamp || activity.createdAt || new Date().toISOString();
        const parsedDate = new Date(dateValue);

        // Check if the date is valid
        if (!isNaN(parsedDate.getTime()) && parsedDate.getTime() > 0) {
          timeAgo = formatDistance(parsedDate, new Date(), { addSuffix: true });
        } else {
          console.warn('Invalid date found in activity:', activity);
          timeAgo = "Recently";
        }
      } catch (error) {
        console.warn('Error formatting date for activity:', activity, error);
        timeAgo = "Recently";
      }

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
    setBugFormOpen(true);
  };

  const handleRestoreTestCase = (testCase: TestCase) => {
    if (window.confirm(`Are you sure you want to restore test case "${testCase.testCaseId}"?`)) {
      restoreTestCaseMutation.mutate(testCase.id);
    }
  };

  const handlePermanentDeleteTestCase = (testCase: TestCase) => {
    if (window.confirm(`Are you sure you want to permanently delete test case "${testCase.testCaseId}"? This action cannot be undone and will remove all data from the database.`)) {
      permanentDeleteTestCaseMutation.mutate(testCase.id);
    }
  };

  const handleViewDeletedTestCase = (testCase: TestCase) => {
    setSelectedDeletedTestCase(testCase);
    setViewDeletedTestCaseDialogOpen(true);
  };

  const handleBulkRestoreTestCases = (testCaseIds: number[]) => {
    if (testCaseIds.length > 0) {
      bulkRestoreTestCasesMutation.mutate(testCaseIds);
    }
  };

  const handleBulkPermanentDeleteTestCases = (testCaseIds: number[]) => {
    if (testCaseIds.length > 0) {
      bulkPermanentDeleteTestCasesMutation.mutate(testCaseIds);
    }
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

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      // Get all bugs for this project
      const bugsResponse = await apiRequest("GET", `/api/projects/${projectId}/bugs`);
      if (!bugsResponse.ok) {
        throw new Error("Failed to fetch bugs");
      }
      const bugs = await bugsResponse.json();

      if (bugs.length === 0) {
        return { successful: 0, total: 0, message: "No bugs found to sync" };
      }

      // Sync each bug that might have GitHub issues
      const syncPromises = bugs.map(async (bug: any) => {
        try {
          const response = await apiRequest("POST", `/api/github/sync/${bug.id}`);
          if (response.ok) {
            const result = await response.json();
            return { bug: bug.id, success: true, result };
          } else {
            const error = await response.json();
            console.warn(`Failed to sync bug ${bug.bugId} (ID: ${bug.id}):`, error.message);
            return { bug: bug.id, success: false, error: error.message };
          }
        } catch (error) {
          console.warn(`Failed to sync bug ${bug.bugId} (ID: ${bug.id}):`, error);
          return { bug: bug.id, success: false, error: error.message };
        }
      });

      const results = await Promise.allSettled(syncPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      const total = bugs.length;
      const errors = results
        .filter(r => r.status === 'fulfilled' && !r.value?.success)
        .map(r => r.value?.error)
        .filter(Boolean);

      return { successful, total, errors };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bugs`] });

      if (data.total === 0) {
        toast({
          title: "No Bugs to Sync",
          description: data.message || "No bugs found in this project",
          style: { backgroundColor: 'darkgreen', color: 'white' },
        });
      } else {
        toast({
          title: "GitHub Sync Complete",
          description: `Synchronized ${data.successful} out of ${data.total} bugs with GitHub${data.errors?.length ? `. ${data.errors.length} errors occurred.` : ''}`,
          style: { backgroundColor: 'darkgreen', color: 'white' },
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with GitHub",
        variant: "destructive",
      });
    },
  });

  const handleSyncAllGithubIssues = () => {
    syncAllMutation.mutate();
  };

  const syncFromGithubMutation = useMutation({
    mutationFn: async () => {
      // Placeholder for actual implementation to sync from GitHub to system
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ message: "Sync from GitHub to System initiated successfully" });
        }, 1000);
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Sync from GitHub to System",
        description: data.message || "Sync from GitHub to System initiated",
        style: { backgroundColor: 'darkgreen', color: 'white' },
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync from GitHub to System",
        variant: "destructive",
      });
    },
  });

  const handleSyncFromGithub = () => {
    syncFromGithubMutation.mutate();
  };

  const createTestCaseMutation = useMutation({
    mutationFn: async (testCase: TestCase) => {
      const res = await apiRequest("POST", `/api/test-cases`, testCase);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test case created",
        description: "Test case has been created successfully",
        style: { backgroundColor: 'darkgreen', color: 'white' },
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create test case: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Mock current user
  const currentUser = {
    id: "user-1",
    name: "John Doe",
  };

  // Export project handlers
  const handleExportProject = async (format: 'csv' | 'pdf') => {
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/export?format=${format}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${project.name}-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Project exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the project",
        variant: "destructive",
      });
    }
  };

  const generateTestClosureReport = () => {
    try {
      const doc = new jsPDF();
      
      // Calculate actual statistics from system data
      const totalTestCases = testCases?.length || 0;
      const passedTestCases = testCases?.filter(tc => tc.status === 'Pass').length || 0;
      const failedTestCases = testCases?.filter(tc => tc.status === 'Fail').length || 0;
      const blockedTestCases = testCases?.filter(tc => tc.status === 'Blocked').length || 0;
      const notExecutedTestCases = testCases?.filter(tc => tc.status === 'Not Executed').length || 0;
      const passRate = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;

      const totalBugs = bugs?.length || 0;
      const openBugs = bugs?.filter(bug => bug.status === 'Open').length || 0;
      const inProgressBugs = bugs?.filter(bug => bug.status === 'In Progress').length || 0;
      const resolvedBugs = bugs?.filter(bug => bug.status === 'Resolved').length || 0;
      const closedBugs = bugs?.filter(bug => bug.status === 'Closed').length || 0;
      const criticalBugs = bugs?.filter(bug => bug.severity === 'Critical').length || 0;
      const majorBugs = bugs?.filter(bug => bug.severity === 'Major').length || 0;
      const minorBugs = bugs?.filter(bug => bug.severity === 'Minor').length || 0;

      // Current user as test lead - use first user as default since we don't have session info on client
      const currentUser = users?.[0] || { firstName: 'Test', lastName: 'Lead' };

      // **COVER PAGE**
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("TEST CLOSURE REPORT", 105, 50, { align: 'center' });

      doc.setFontSize(18);
      doc.text(project?.name || 'Project Name', 105, 70, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Report ID: TCR-${Date.now().toString().slice(-6)}`, 105, 90, { align: 'center' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 100, { align: 'center' });
      doc.text(`Test Lead: ${currentUser.firstName} ${currentUser.lastName || ''}`, 105, 110, { align: 'center' });

      // Executive Summary with actual data
      doc.setFillColor(240, 248, 255);
      doc.rect(20, 130, 170, 70, 'F');
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('Executive Summary', 25, 145);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Test Cases: ${totalTestCases}`, 25, 160);
      doc.text(`Pass Rate: ${passRate}%`, 25, 170);
      doc.text(`Passed: ${passedTestCases} | Failed: ${failedTestCases} | Blocked: ${blockedTestCases} | Not Executed: ${notExecutedTestCases}`, 25, 180);
      doc.text(`Total Bugs: ${totalBugs} | Open: ${openBugs} | Critical: ${criticalBugs}`, 25, 190);

      // **TEST STATUS CHART VISUALIZATION**
      doc.addPage();
      let yPos = 20;

      // Chart Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("TEST EXECUTION STATUS CHART", 105, yPos, { align: 'center' });
      yPos += 20;

      // Visual chart representation using rectangles
      const chartWidth = 150;
      const chartHeight = 80;
      const chartX = 30;
      const chartY = yPos;

      // Draw chart background
      doc.setFillColor(245, 245, 245);
      doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');

      // Calculate proportions for visual representation
      if (totalTestCases > 0) {
        const passWidth = (passedTestCases / totalTestCases) * chartWidth;
        const failWidth = (failedTestCases / totalTestCases) * chartWidth;
        const blockedWidth = (blockedTestCases / totalTestCases) * chartWidth;
        const notExecutedWidth = (notExecutedTestCases / totalTestCases) * chartWidth;

        let currentX = chartX;
        const barHeight = 40;
        const barY = chartY + 20;

        // Pass - Green
        if (passedTestCases > 0) {
          doc.setFillColor(34, 197, 94);
          doc.rect(currentX, barY, passWidth, barHeight, 'F');
          currentX += passWidth;
        }

        // Fail - Red
        if (failedTestCases > 0) {
          doc.setFillColor(239, 68, 68);
          doc.rect(currentX, barY, failWidth, barHeight, 'F');
          currentX += failWidth;
        }

        // Blocked - Orange
        if (blockedTestCases > 0) {
          doc.setFillColor(251, 146, 60);
          doc.rect(currentX, barY, blockedWidth, barHeight, 'F');
          currentX += blockedWidth;
        }

        // Not Executed - Gray
        if (notExecutedTestCases > 0) {
          doc.setFillColor(156, 163, 175);
          doc.rect(currentX, barY, notExecutedWidth, barHeight, 'F');
        }
      }

      // Chart Legend
      yPos += 90;
      doc.setFontSize(10);
      let legendX = 30;

      doc.setFillColor(34, 197, 94);
      doc.rect(legendX, yPos, 8, 6, 'F');
      doc.text(`Pass (${passedTestCases})`, legendX + 12, yPos + 4);
      legendX += 45;

      doc.setFillColor(239, 68, 68);
      doc.rect(legendX, yPos, 8, 6, 'F');
      doc.text(`Fail (${failedTestCases})`, legendX + 12, yPos + 4);
      legendX += 45;

      doc.setFillColor(251, 146, 60);
      doc.rect(legendX, yPos, 8, 6, 'F');
      doc.text(`Blocked (${blockedTestCases})`, legendX + 12, yPos + 4);
      legendX += 50;

      doc.setFillColor(156, 163, 175);
      doc.rect(legendX, yPos, 8, 6, 'F');
      doc.text(`Not Executed (${notExecutedTestCases})`, legendX + 12, yPos + 4);

      yPos += 20;

      // **MODULE-WISE TEST CASE DETAILS**
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("MODULE-WISE TEST CASE SUMMARY", 14, yPos);
      yPos += 15;

      // Create module-wise test results table
      if (modules && modules.length > 0) {
        const moduleTestResults = modules.map(module => {
          const moduleTestCases = testCases?.filter(tc => tc.moduleId === module.id) || [];
          const total = moduleTestCases.length;
          const passed = moduleTestCases.filter(tc => tc.status === 'Pass').length;
          const failed = moduleTestCases.filter(tc => tc.status === 'Fail').length;
          const blocked = moduleTestCases.filter(tc => tc.status === 'Blocked').length;
          const notExecuted = moduleTestCases.filter(tc => tc.status === 'Not Executed').length;
          const modulePassRate = total > 0 ? Math.round((passed / total) * 100) : 0;
          
          return [
            module.name,
            total.toString(),
            passed.toString(),
            failed.toString(),
            blocked.toString(),
            notExecuted.toString(),
            `${modulePassRate}%`
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Module Name', 'Total', 'Passed', 'Failed', 'Blocked', 'Not Executed', 'Pass Rate']],
          body: moduleTestResults,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 25 },
            6: { cellWidth: 20 }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // **DETAILED MODULE-WISE TEST CASES**
      if (modules && modules.length > 0 && testCases && testCases.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("DETAILED TEST CASES BY MODULE", 14, yPos);
        yPos += 15;

        modules.forEach((module, moduleIndex) => {
          const moduleTestCases = testCases.filter(tc => tc.moduleId === module.id);
          
          if (moduleTestCases.length > 0) {
            // Module header
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`${moduleIndex + 1}. ${module.name} (${moduleTestCases.length} test cases)`, 14, yPos);
            yPos += 10;

            // Test cases table for this module
            const moduleTestCaseData = moduleTestCases.map(tc => [
              tc.testCaseId || `TC-${tc.id}`,
              tc.feature?.substring(0, 30) + (tc.feature?.length > 30 ? '...' : '') || 'N/A',
              tc.status || 'Not Executed',
              tc.priority || 'Medium',
              users?.find(u => u.id === tc.assignedToId)?.firstName || 'Unassigned'
            ]);

            autoTable(doc, {
              startY: yPos,
              head: [['Test Case ID', 'Feature', 'Status', 'Priority', 'Assigned To']],
              body: moduleTestCaseData,
              styles: { fontSize: 8 },
              headStyles: { fillColor: [59, 130, 246] },
              columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 60 },
                2: { cellWidth: 25 },
                3: { cellWidth: 20 },
                4: { cellWidth: 25 }
              }
            });

            yPos = (doc as any).lastAutoTable.finalY + 10;

            // Check if we need a new page
            if (yPos > 250) {
              doc.addPage();
              yPos = 20;
            }
          }
        });
      }

      // **BUG REPORTS BY MODULE**
      if (bugs && bugs.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("BUG REPORTS BY MODULE", 14, yPos);
        yPos += 15;

        // Bug summary by severity
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Bug Summary by Severity", 14, yPos);
        yPos += 10;

        const bugSeverityData = [
          ['Critical', criticalBugs.toString()],
          ['Major', majorBugs.toString()],
          ['Minor', minorBugs.toString()],
          ['Total', totalBugs.toString()]
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Severity', 'Count']],
          body: bugSeverityData,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [239, 68, 68] },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Detailed bug reports
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Detailed Bug Reports", 14, yPos);
        yPos += 10;

        if (modules && modules.length > 0) {
          modules.forEach((module, moduleIndex) => {
            const moduleBugs = bugs.filter(bug => bug.moduleId === module.id);
            
            if (moduleBugs.length > 0) {
              // Module header
              doc.setFontSize(11);
              doc.setFont("helvetica", "bold");
              doc.text(`${moduleIndex + 1}. ${module.name} (${moduleBugs.length} bugs)`, 14, yPos);
              yPos += 8;

              // Bug table for this module
              const moduleBugData = moduleBugs.map(bug => [
                bug.bugId || `BUG-${bug.id}`,
                bug.title?.substring(0, 25) + (bug.title?.length > 25 ? '...' : '') || 'N/A',
                bug.severity || 'Minor',
                bug.priority || 'Medium',
                bug.status || 'Open',
                users?.find(u => u.id === bug.reportedById)?.firstName || 'Unknown',
                bug.dateReported ? new Date(bug.dateReported).toLocaleDateString() : 'N/A'
              ]);

              autoTable(doc, {
                startY: yPos,
                head: [['Bug ID', 'Title', 'Severity', 'Priority', 'Status', 'Reporter', 'Date']],
                body: moduleBugData,
                styles: { fontSize: 7 },
                headStyles: { fillColor: [239, 68, 68] },
                columnStyles: {
                  0: { cellWidth: 20 },
                  1: { cellWidth: 40 },
                  2: { cellWidth: 20 },
                  3: { cellWidth: 20 },
                  4: { cellWidth: 20 },
                  5: { cellWidth: 25 },
                  6: { cellWidth: 20 }
                }
              });

              yPos = (doc as any).lastAutoTable.finalY + 8;

              // Check if we need a new page
              if (yPos > 250) {
                doc.addPage();
                yPos = 20;
              }
            }
          });
        }
      }

      // **CONCLUSION WITH ACTUAL DATA**
      doc.addPage();
      yPos = 20;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("TEST EXECUTION CONCLUSION", 14, yPos);
      yPos += 15;

      // Determine actual testing status based on real data
      const actualReadinessStatus = 
        totalTestCases === 0 ? "NO TEST CASES EXECUTED" :
        passRate >= 95 && criticalBugs === 0 && openBugs === 0 ? "READY FOR PRODUCTION" : 
        passRate >= 90 && criticalBugs === 0 ? "READY WITH MINOR ISSUES" : 
        passRate >= 70 && criticalBugs <= 1 ? "NEEDS CRITICAL ISSUE RESOLUTION" :
        "REQUIRES ADDITIONAL TESTING";

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Project: ${project?.name || 'Unknown Project'}`, 18, yPos);
      yPos += 8;
      doc.text(`Total Modules: ${modules?.length || 0}`, 18, yPos);
      yPos += 8;
      doc.text(`Total Test Cases: ${totalTestCases}`, 18, yPos);
      yPos += 8;
      doc.text(`Test Execution Rate: ${totalTestCases > 0 ? Math.round(((totalTestCases - notExecutedTestCases) / totalTestCases) * 100) : 0}%`, 18, yPos);
      yPos += 8;
      doc.text(`Pass Rate: ${passRate}%`, 18, yPos);
      yPos += 8;
      doc.text(`Total Defects Found: ${totalBugs}`, 18, yPos);
      yPos += 8;
      doc.text(`Critical Defects: ${criticalBugs}`, 18, yPos);
      yPos += 8;
      doc.text(`Open Defects: ${openBugs}`, 18, yPos);
      yPos += 15;

      doc.setFont("helvetica", "bold");
      doc.text(`TESTING STATUS: ${actualReadinessStatus}`, 18, yPos);
      yPos += 8;
      doc.text(`PRODUCTION READINESS: ${actualReadinessStatus}`, 18, yPos);

      // Save the PDF with actual data
      const fileName = `test-closure-report-${project?.name?.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Test Closure Report Generated",
        description: "Comprehensive test closure report with actual system data has been downloaded successfully.",
      });

    } catch (error) {
      console.error('Error generating test closure report:', error);
      toast({
        title: "Error",
        description: "Failed to generate test closure report.",
        variant: "destructive",
      });
    }
  };

  const handleOpenConsolidatedReports = () => {
    navigate(`/reports/consolidated?projectId=${projectId}`);
  };

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
              <Button onClick={handleAddModule}>
                Add Module
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGitHubConfig(true)}
              >
                <Github className="h-4 w-4 mr-2" />
                {githubConfig ? 'Configure GitHub' : 'Setup GitHub'}
              </Button>
              <Button
                onClick={handleSyncAllGithubIssues}
                disabled={syncAllMutation.isPending}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
                {syncAllMutation.isPending ? 'Syncing...' : 'Sync All GitHub Issues'}
              </Button>
              <Button
                onClick={handleSyncFromGithub}
                disabled={syncFromGithubMutation.isPending}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncFromGithubMutation.isPending ? 'animate-spin' : ''}`} />
                {syncFromGithubMutation.isPending ? 'Syncing...' : 'Sync from Github'}
              </Button>

              <Button
                variant="outline"
                onClick={generateTestClosureReport}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export Project Report
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    Export Options
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExportProject('csv')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export Project CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportProject('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export Project PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Project tabs */}
        <Tabs defaultValue="modules" className="space-y-4">
          <TabsList className="grid grid-cols-6 md:w-[600px]">
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
            <TabsTrigger value="deleted-test-cases" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Deleted</span>
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
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
              <div className="flex items-center gap-2">
                <ImportExport
                  projectId={projectId}
                  modules={modules || []}
                  testCases={testCases || []}
                />
                <AITestGenerator
                  projectId={projectId}
                  modules={modules || []}
                  onTestCasesGenerated={(generatedCases) => {
                    // Refresh test cases when new ones are generated
                    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
                  }}
                />
                <Button onClick={() => setTestCaseFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Case
                </Button>
              </div>
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
                users={users || []}
                modules={modules || []}
                projectId={parseInt(projectId!)}
                onView={handleViewBug}
                onEdit={handleEditBug}
                onDelete={handleDeleteBug}
              />
            )}
          </TabsContent>

          {/* Deleted Test Cases Tab */}
          <TabsContent value="deleted-test-cases">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Trash2 className="h-5 w-5" />
                      <span>Deleted Test Cases</span>
                    </CardTitle>
                    <CardDescription>
                      {deletedTestCases.length} deleted test case(s) found
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({
                      queryKey: [`/api/projects/${projectId}/deleted-test-cases`]
                    })}
                    disabled={isDeletedTestCasesLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isDeletedTestCasesLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DeletedTestCaseTable
                  deletedTestCases={deletedTestCases}
                  onRestore={handleRestoreTestCase}
                  onPermanentDelete={handlePermanentDeleteTestCase}
                  onView={handleViewDeletedTestCase}
                  onBulkRestore={handleBulkRestoreTestCases}
                  onBulkPermanentDelete={handleBulkPermanentDeleteTestCases}
                  isLoading={isDeletedTestCasesLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team/Collaborators Tab */}
          <TabsContent value="collaborators">
            {project && (
              <ProjectCollaborators
                projectId={projectId}
                projectName={project.name}
              />
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Recent activities in this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isActivitiesLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No recent activity
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-md">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.userName}</span> {activity.action}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    : selectedBug?.priority === "Minor"
                    ? "border-green-200 bg-green-100 text-green-800"
                    : "outline"
                }>
                  {selectedBug?.priority}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Status</h3><Badge variant={
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

            <div className="flex justify-between items-center">
              <GitHubIssueButton bug={selectedBug} projectId={parseInt(projectId!)} />
              <div className="flex gap-2">
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
                  Edit Bug
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deleted Test Case View Dialog */}
      <Dialog open={viewDeletedTestCaseDialogOpen} onOpenChange={setViewDeletedTestCaseDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Deleted Test Case Details</span>
              <Badge variant="destructive">Deleted</Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedDeletedTestCase?.testCaseId} - {selectedDeletedTestCase?.feature}
            </DialogDescription>
          </DialogHeader>

          {selectedDeletedTestCase && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge variant="outline">{selectedDeletedTestCase.status}</Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Priority</h3>
                  <Badge variant="outline">{selectedDeletedTestCase.priority}</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Test Objective</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedDeletedTestCase.testObjective}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Pre-Conditions</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedDeletedTestCase.preConditions || "None specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Test Steps</h3>
                <pre className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-sans border border-gray-200 rounded-md p-3 bg-gray-50">{selectedDeletedTestCase.testSteps}</pre>
              </div>

              <div>
                <h3 className="text-sm font-medium">Expected Result</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedDeletedTestCase.expectedResult}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Actual Result</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedDeletedTestCase.actualResult || "Not recorded"}</p>
              </div>

              {selectedDeletedTestCase.comments && (
                <div>
                  <h3 className="text-sm font-medium">Comments</h3>
                  <p className="text-sm text-gray-700 mt-1">{selectedDeletedTestCase.comments}</p>
                </div>
              )}

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setViewDeletedTestCaseDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleRestoreTestCase(selectedDeletedTestCase);
                    setViewDeletedTestCaseDialogOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore Test Case
                </Button>
              </div>
            </div>
          )}
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

      {/* AI Generator Dialog */}
      <Dialog open={aiGeneratorOpen} onOpenChange={setAiGeneratorOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Test Generator
            </DialogTitle>
          </DialogHeader>
          <AITestGenerator
            projectId={projectId}
            modules={modules || []}
            onSuccess={() => {
              setAiGeneratorOpen(false);
              queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
            }}
          />
        </DialogContent>
      </Dialog>
      {showGitHubConfig && (
        <GitHubConfigForm
          open={showGitHubConfig}
          onOpenChange={setShowGitHubConfig}
          projectId={projectId}
          config={githubConfig}
        />
      )}
    </MainLayout>
  );
}