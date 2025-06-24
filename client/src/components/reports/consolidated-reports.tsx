import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Project, TestCase, Bug, Module } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ProjectSelect } from "@/components/ui/project-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Bug as BugIcon, 
  TestTube,
  Download,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Save,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  BarChart3,
  Target
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TestCaseForm } from "@/components/test-cases/test-case-form";
import { BugForm } from "@/components/bugs/bug-form";
import { TestCaseTags } from "@/components/test-cases/test-case-tags";
import { Input } from "@/components/ui/input";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "next-auth/types";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import Papa from 'csv-parse';
import { cn } from "@/lib/utils";

interface ConsolidatedReportsProps {
  selectedProjectId?: number;
  projectId?: number;
  onClose?: () => void;
}

export function ConsolidatedReports({ selectedProjectId, projectId, onClose }: ConsolidatedReportsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [statusUpdateQueue, setStatusUpdateQueue] = useState<{[key: string]: {id: number, type: 'testcase' | 'bug', status: string}}>({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [, navigate] = useLocation();
  const [viewTestCaseDialogOpen, setViewTestCaseDialogOpen] = useState(false);
  const [editTestCaseDialogOpen, setEditTestCaseDialogOpen] = useState(false);
  const [editBugDialogOpen, setEditBugDialogOpen] = useState(false);
  const [selectedItemForView, setSelectedItemForView] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<{ id: number; type: 'testcase' | 'bug'; status: string } | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');

  const currentProjectId = selectedProjectId || projectId;

  // Fetch all projects first
  const { data: allProjects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  // Use the first project if no currentProjectId is provided
  const effectiveProjectId = currentProjectId || (allProjects && allProjects.length > 0 ? allProjects[0].id : undefined);

  // Auto-select first project for better UX
  React.useEffect(() => {
    if (allProjects && allProjects.length > 0 && !currentProjectId) {
      console.log("Auto-selecting first project:", allProjects[0].id);
    }
  }, [allProjects, currentProjectId]);

  // Debug logging for project ID resolution
  console.log("ConsolidatedReports Debug:", {
    selectedProjectId,
    projectId,
    currentProjectId,
    effectiveProjectId,
    allProjectsCount: allProjects?.length || 0,
    isProjectsLoading
  });

  // Fetch project data
  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${effectiveProjectId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${effectiveProjectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      return response.json();
    },
    enabled: !!effectiveProjectId,
  });

  // Fetch modules
  const { data: modules } = useQuery<Module[]>({
    queryKey: [`/api/projects/${effectiveProjectId}/modules`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${effectiveProjectId}/modules");
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
    enabled: !!effectiveProjectId,
  });

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch test cases
  const { data: testCases, isLoading: isTestCasesLoading, error: testCasesError, refetch: refetchTestCases } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${effectiveProjectId}/test-cases`],
    queryFn: async () => {
      if (!effectiveProjectId) {
        console.log("No effective project ID for test cases");
        return [];
      }
      console.log(`Fetching test cases for project ${effectiveProjectId}`);
      try {
        const response = await apiRequest("GET", `/api/projects/${effectiveProjectId}/test-cases`);
        if (!response.ok) {
          console.error(`Failed to fetch test cases: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error(`Error details: ${errorText}`);
          throw new Error(`Failed to fetch test cases: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Successfully fetched ${data.length} test cases:`, data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Test cases fetch error:', error);
        throw error;
      }
    },
    enabled: !!effectiveProjectId,
    retry: 2,
    staleTime: 0, // Always fresh data
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Fetch bugs
  const { data: bugs, isLoading: isBugsLoading, error: bugsError, refetch: refetchBugs } = useQuery<Bug[]>({
    queryKey: [`/api/projects/${effectiveProjectId}/bugs`],
    queryFn: async () => {
      if (!effectiveProjectId) {
        console.log("No effective project ID for bugs");
        return [];
      }
      console.log(`Fetching bugs for project ${effectiveProjectId}`);
      try {
        const response = await apiRequest("GET", `/api/projects/${effectiveProjectId}/bugs`);
        if (!response.ok) {
          console.error(`Failed to fetch bugs: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error(`Error details: ${errorText}`);
          throw new Error(`Failed to fetch bugs: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Successfully fetched ${data.length} bugs:`, data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Bugs fetch error:', error);
        throw error;
      }
    },
    enabled: !!effectiveProjectId,
    retry: 2,
    staleTime: 0, // Always fresh data
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Update test case status mutation
  const updateTestCaseMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      try {
        const res = await apiRequest("PUT", `/api/test-cases/${id}`, { status });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to update test case: ${res.status} - ${errorText}`);
        }
        return res.json();
      } catch (error: any) {
        console.error('Test case update error:', error);
        throw new Error(`Failed to update test case: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/test-cases`] });
      toast({
        title: "Status updated",
        description: "Test case status updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Test case update error:', error);
      toast({
        title: "Update failed",
        description: `Failed to update test case: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update bug status mutation
  const updateBugMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      try {
        const res = await apiRequest("PUT", `/api/bugs/${id}`, { status });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to update bug: ${res.status} - ${errorText}`);
        }
        return res.json();
      } catch (error: any) {
        console.error('Bug update error:', error);
        throw new Error(`Failed to update bug: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/bugs`] });
      toast({
        title: "Status updated",
        description: "Bug status updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Bug update error:', error);
      toast({
        title: "Update failed",
        description: `Failed to update bug: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // GitHub sync mutation
  const syncWithGithubMutation = useMutation({
    mutationFn: async (bugId: number) => {
      const response = await apiRequest("POST", `/api/github/sync/${bugId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to sync: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/bugs`] });
      toast({
        title: "GitHub Sync Successful",
        description: data.newStatus ? 
          `Bug status updated from ${data.previousStatus} to ${data.newStatus}` :
          "Bug status is already in sync",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with GitHub",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating status with proper error handling
  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, type, status }: { itemId: string, type: 'testcase' | 'bug', status: string }) => {
      const id = itemId.split('-')[1];
      console.log(`Updating ${type} ${id} to status: ${status}`);

      try {
        let response;
        if (type === 'testcase') {
          response = await apiRequest('PUT', `/api/test-cases/${id}`, { status });
        } else {
          response = await apiRequest('PUT', `/api/bugs/${id}`, { status });
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Status update failed for ${type} ${id}:`, errorText);
          throw new Error(`Failed to update ${type}: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`Successfully updated ${type} ${id}:`, result);
        return result;
      } catch (error) {
        console.error(`API call failed for ${type} ${id}:`, error);
        throw error;
      }
    },
    onMutate: async ({ itemId, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: [`/api/projects/${effectiveProjectId}/test-cases`] });
      await queryClient.cancelQueries({ queryKey: [`/api/projects/${effectiveProjectId}/bugs`] });

      // Return a context object with the snapshotted value
      return { itemId, status };
    },
    onSuccess: (_, variables) => {
      console.log(`Successfully updated ${variables.type} ${variables.itemId} to ${variables.status}`);
      // Force refetch to get the latest data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/bugs`] });
      toast({
        title: "Status Updated",
        description: `${variables.type === 'testcase' ? 'Test case' : 'Bug'} status has been updated to ${variables.status}.`,
      });
      setEditingItem(null);
    },
    onError: (error: any, variables) => {
      console.error(`Failed to update ${variables.type} ${variables.itemId}:`, error);
      // Revert the optimistic update
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/bugs`] });
      toast({
        title: "Update Failed",
        description: `Failed to update ${variables.type === 'testcase' ? 'test case' : 'bug'} status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for exporting to PDF
  const exportToPDFMutation = useMutation({
    mutationFn: async () => {
      // Dummy implementation, replace with actual API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ ok: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Consolidated report exported to PDF.",
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export consolidated report.",
        variant: "destructive",
      });
    },
  });

   // Update test case status mutation
  const updateTestCaseStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PUT', `/api/test-cases/${id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Test case status updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/test-cases`, selectedProjectId] });
      setStatusUpdateDialog(false);
      setEditingItem(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update test case status: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update bug status mutation
  const updateBugStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PUT', `/api/bugs/${id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Bug status updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/bugs`, selectedProjectId] });
      setStatusUpdateDialog(false);
      setEditingItem(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update bug status: ${error}`,
        variant: "destructive",
      });
    },
  });

    // Status update mutation
    const updateStatusMutationNew = useMutation({
      mutationFn: async ({ id, type, status }: { id: number, type: 'testCase' | 'bug', status: string }) => {
        const endpoint = type === 'testCase' ? `/api/test-cases/${id}` : `/api/bugs/${id}`;
        return apiRequest('PUT', endpoint, { status });
      },
      onSuccess: () => {
        toast({
          title: "Status Updated",
          description: "Item status has been updated successfully.",
        });
        // Refresh the data
        if (selectedProjectId) {
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/test-cases`] });
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/bugs`] });
        }
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to update status: ${error}`,
          variant: "destructive",
        });
      },
    });

  // Calculate metrics with debug logging
  const metrics = {
    testCases: {
      total: testCases?.length || 0,
      passed: testCases?.filter(tc => tc.status === "Pass").length || 0,
      failed: testCases?.filter(tc => tc.status === "Fail").length || 0,
      blocked: testCases?.filter(tc => tc.status === "Blocked").length || 0,
      notExecuted: testCases?.filter(tc => tc.status === "Not Executed").length || 0,
    },
    bugs: {
      total: bugs?.length || 0,
      open: bugs?.filter(bug => bug.status === "Open").length || 0,
      inProgress: bugs?.filter(bug => bug.status === "In Progress").length || 0,
      resolved: bugs?.filter(bug => bug.status === "Resolved").length || 0,
      closed: bugs?.filter(bug => bug.status === "Closed").length || 0,
      critical: bugs?.filter(bug => bug.severity === "Critical").length || 0,
      major: bugs?.filter(bug => bug.severity === "Major").length || 0,
    }
  };

  // Debug logging for metrics
  console.log("Consolidated Reports Metrics:", {
    testCases: {
      data: testCases,
      metrics: metrics.testCases
    },
    bugs: {
      data: bugs,
      metrics: metrics.bugs
    },
    errors: {
      testCasesError,
      bugsError
    }
  });

  const totalTestCases = testCases?.length || 0;
  const passedTestCases = testCases?.filter(tc => tc.status === "Pass").length || 0;
  const totalBugs = bugs?.length || 0;
  const resolvedBugs = bugs?.filter(bug => bug.status === "Resolved").length || 0;
  const closedBugs = bugs?.filter(bug => bug.status === "Closed").length || 0;

  const passRate = metrics.testCases.total > 0 
    ? Math.round((metrics.testCases.passed / metrics.testCases.total) * 100) 
    : 0;

  // Combined data for unified view with better error handling
  const combinedData = React.useMemo(() => {
    console.log('Creating combined data...', {
      testCases: testCases?.length || 0,
      bugs: bugs?.length || 0,
      testCasesData: testCases,
      bugsData: bugs,
      modules: modules?.length || 0,
      users: users?.length || 0
    });

    const testCaseItems = Array.isArray(testCases) ? testCases.map(tc => {
      console.log('Processing test case:', tc);
      return {
        id: `tc-${tc.id}`,
        type: 'testcase' as const,
        title: tc.feature || tc.scenario || tc.title || `Test Case ${tc.id}`,
        module: modules?.find(m => m.id === tc.moduleId)?.name || 'No Module',
        status: tc.status || 'Not Executed',
        priority: tc.priority || 'Medium',
        assignee: users?.find(u => u.id === tc.assignedTo)?.name || 'Unassigned',
        createdAt: tc.createdAt || new Date().toISOString(),
        description: tc.description || '',
        progress: tc.status === 'Pass' ? 100 : tc.status === 'Fail' ? 0 : tc.status === 'Blocked' ? 25 : 50,
        originalData: tc
      };
    }) : [];

    const bugItems = Array.isArray(bugs) ? bugs.map(bug => {
      console.log('Processing bug:', bug);
      return {
        id: `bug-${bug.id}`,
        type: 'bug' as const,
        title: bug.title || `Bug ${bug.id}`,
        module: modules?.find(m => m.id === bug.moduleId)?.name || 'No Module',
        status: bug.status || 'Open',
        priority: bug.priority || 'Medium',
        assignee: users?.find(u => u.id === bug.assignedTo)?.name || 'Unassigned',
        createdAt: bug.createdAt || bug.dateReported || new Date().toISOString(),
        description: bug.description || '',
        progress: bug.status === 'Resolved' ? 100 : bug.status === 'Closed' ? 100 : bug.status === 'In Progress' ? 50 : 0,
        severity: bug.severity || 'Medium',
        originalData: bug
      };
    }) : [];

    const combined = [...testCaseItems, ...bugItems];

    console.log("Combined Data Created:", {
      testCaseItems: testCaseItems.length,
      bugItems: bugItems.length,
      total: combined.length,
      sampleItems: combined.slice(0, 3)
    });

    return combined;
  }, [testCases, bugs, modules, users]);

  // Filter combined data
  const filteredData = combinedData.filter(item => {
    const statusMatch = filterStatus === "all" || item.status === filterStatus;
    const priorityMatch = filterPriority === "all" || item.priority === filterPriority;
    const moduleMatch = filterModule === "all" || item.module === filterModule || item.module === 'No Module';
    const searchMatch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignee.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === "all" || 
      (item.type === 'bug' && item.severity === severityFilter) ||
      (item.type === 'testcase');

    return statusMatch && priorityMatch && moduleMatch && searchMatch && matchesSeverity;
  });

  // Add event listeners for export actions
  useEffect(() => {
    const handleExportCSV = () => exportToCSV();
    const handleExportPDF = () => exportToPDF();

    window.addEventListener('exportCSV', handleExportCSV);
    window.addEventListener('exportPDF', handleExportPDF);

    return () => {
      window.removeEventListener('exportCSV', handleExportCSV);
      window.removeEventListener('exportPDF', handleExportPDF);
    };
  }, [filteredData, project]);

  // Handle status updates
  const handleStatusUpdate = (id: string, newStatus: string) => {
    const [type, itemId] = id.split('-');
    setStatusUpdateQueue(prev => ({
      ...prev,
      [id]: { id: parseInt(itemId), type: type as 'testcase' | 'bug', status: newStatus }
    }));
    setHasUnsavedChanges(true);
  };

  // Handle individual status update (immediate save)
  const handleIndividualStatusUpdate = async (id: string, newStatus: string) => {
    const [type, itemId] = id.split('-');
    const numericId = parseInt(itemId);

    if (!numericId || isNaN(numericId)) {
      toast({
        title: "Update failed",
        description: "Invalid item ID",
        variant: "destructive",
      });
      return;
    }

    try {
      if (type === 'testcase') {
        await updateTestCaseMutation.mutateAsync({ id: numericId, status: newStatus });
        // Force immediate refetch and cache invalidation
        await refetchTestCases();
        await queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/test-cases`] });
        toast({
          title: "Status updated",
          description: `Test case status updated to ${newStatus}`,
        });
      } else if (type === 'bug') {
        await updateBugMutation.mutateAsync({ id: numericId, status: newStatus });
        // Force immediate refetch and cache invalidation
        await refetchBugs();
        await queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/bugs`] });
        toast({
          title: "Status updated",
          description: `Bug status updated to ${newStatus}`,
        });
      } else {
        throw new Error('Invalid item type');
      }
    } catch (error: any) {
      console.error(`Failed to update ${type} ${numericId}:`, error);
      // Error toast is already shown in mutation onError
    }
  };

  // Save all changes
  const saveAllChanges = async () => {
    if (!statusUpdateQueue || Object.keys(statusUpdateQueue).length === 0) return;

    const updates = Object.values(statusUpdateQueue);
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        if (update.type === 'testcase') {
          await updateTestCaseMutation.mutateAsync({ id: update.id, status: update.status });
        } else {
          await updateBugMutation.mutateAsync({ id: update.id, status: update.status });
        }
        successCount++;
      } catch (error: any) {
        console.error(`Failed to update ${update.type} ${update.id}:`, error);
        errorCount++;
        // Don't show individual error toasts here since they're handled in mutation onError
      }
    }

    setStatusUpdateQueue({});
    setHasUnsavedChanges(false);

    if (successCount > 0) {
      toast({
        title: "Changes saved",
        description: `Successfully updated ${successCount} items${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: successCount > 0 && errorCount === 0 ? "default" : "destructive",
      });
    } else if (errorCount > 0) {
      toast({
        title: "Update failed",
        description: `Failed to update ${errorCount} items. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Handle bulk operations
  const handleBulkStatusUpdate = () => {
    if (!bulkStatus || selectedItems.length === 0) return;

    selectedItems.forEach(itemId => {
      handleStatusUpdate(itemId, bulkStatus);
    });

    setSelectedItems([]);
    setBulkStatus("");
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === 'testcase') {
      switch (status) {
        case 'Pass': return 'bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
        case 'Fail': return 'bg-gradient-to-r from-red-500 via-rose-600 to-pink-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
        case 'Blocked': return 'bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
        case 'Not Executed': return 'bg-gradient-to-r from-slate-500 via-gray-600 to-zinc-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
        default: return 'bg-gradient-to-r from-slate-500 via-gray-600 to-zinc-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
      }
    } else {
      switch (status) {
        case 'Open': return 'bg-gradient-to-r from-red-600 via-rose-700 to-pink-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
        case 'In Progress': return 'bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
        case 'Resolved': return 'bg-gradient-to-r from-emerald-600 via-green-700 to-teal-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
        case 'Closed': return 'bg-gradient-to-r from-purple-600 via-violet-700 to-indigo-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
        default: return 'bg-gradient-to-r from-slate-600 via-gray-700 to-zinc-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-gradient-to-r from-red-600 via-rose-700 to-pink-600 text-white border-0 font-bold shadow-xl hover:shadow-2xl transition-all duration-300';
      case 'High': return 'bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 text-white border-0 font-bold shadow-lg hover:shadow-xl transition-all duration-300';
      case 'Medium': return 'bg-gradient-to-r from-yellow-500 via-amber-600 to-orange-500 text-white border-0 font-bold shadow-lg hover:shadow-xl transition-all duration-300';
      case 'Low': return 'bg-gradient-to-r from-lime-500 via-green-600 to-emerald-500 text-white border-0 font-bold shadow-lg hover:shadow-xl transition-all duration-300';
      default: return 'bg-gradient-to-r from-slate-500 via-gray-600 to-zinc-500 text-white border-0 font-bold shadow-lg hover:shadow-xl transition-all duration-300';
    }
  };

  const handleOpenConsolidatedReports = () => {
    navigate(`/reports/consolidated?projectId=${effectiveProjectId}`);
  };

  // Handle view item in dialog
  const handleViewItem = (item: any) => {
    setSelectedItemForView(item);
    setViewTestCaseDialogOpen(true);
  };

  // Handle edit item in dialog
  const handleEditItem = (item: any) => {
    setSelectedItemForView(item);
    if (item.type === 'testcase') {
      setEditTestCaseDialogOpen(true);
    } else {
      setEditBugDialogOpen(true);
    }
  };

  const handleStatusEdit = (item: any) => {
    const [type, itemId] = item.id.split('-');
    setEditingItem({
      id: parseInt(itemId),
      type: type as 'testcase' | 'bug',
      status: item.status
    });
    setNewStatus(item.status);
    setStatusUpdateDialog(true);
  };

  const handleStatusUpdateNew = async (item: any, status: string) => {
    const [type, itemId] = item.id.split('-');
    const id = parseInt(itemId);

    if (isNaN(id)) {
      toast({
        title: "Error",
        description: "Invalid item ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateStatusMutationNew.mutateAsync({
        id: id,
        type: type === 'testcase' ? 'testCase' : 'bug',
        status: status,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleStatusUpdate = () => {
    if (!editingItem || !newStatus) return;

    if (editingItem.type === 'testcase') {
      updateTestCaseStatusMutation.mutate({
        id: editingItem.id,
        status: newStatus
      });
    } else if (editingItem.type === 'bug') {
      updateBugStatusMutation.mutate({
        id: editingItem.id,
        status: newStatus
      });
    }
  };

  // Delete mutations
  const deleteTestCaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/test-cases/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete test case");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/test-cases`] });
      toast({
        title: "Test case deleted",
        description: "Test case has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete test case.",
        variant: "destructive",
      });
    },
  });

  const deleteBugMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/bugs/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete bug");
      }
      return res.json();
        },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/bugs`] });
      toast({
        title: "Bug deleted",
        description: "Bug has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete bug.",
        variant: "destructive",
      });
    },
  });

  // Handle delete item
  const handleDeleteItem = async (item: any) => {
    if (!confirm(`Are you sure you want to delete this ${item.type === 'testcase' ? 'test case' : 'bug'}?`)) {
      return;
    }

    const [type, itemId] = item.id.split('-');
    const numericId = parseInt(itemId);

    try {
      if (type === 'testcase') {
        await deleteTestCaseMutation.mutateAsync(numericId);
      } else if (type === 'bug') {
        await deleteBugMutation.mutateAsync(numericId);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const csvData = filteredData.map(item => ({
        Type: item.type === 'testcase' ? 'Test Case' : 'Bug',
        Module: item.module,
        'Title/Feature': item.title,
        Priority: item.priority,
        Status: item.status,
        Progress: `${item.progress}%`,
        Created: new Date(item.createdAt).toLocaleDateString(),
        Description: item.description
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `consolidated-report-${project?.name?.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Export successful",
        description: "Consolidated report exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export consolidated report",
        variant: "destructive",
      });
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title with better formatting
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(`Consolidated Report`, 14, 20);

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`${project?.name || 'Project'}`, 14, 30);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);

      // Add executive summary box
      doc.setFillColor(240, 248, 255);
      doc.rect(14, 45, 180, 35, 'F');
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('Executive Summary', 18, 55);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let yPos = 62;
      doc.text(`Total Test Cases: ${metrics.testCases.total}`, 18, yPos);
      yPos += 5;
      doc.text(`Test Pass Rate: ${passRate}%`, 18, yPos);
      yPos += 5;
      doc.text(`Total Bugs: ${metrics.bugs.total}`, 18, yPos);
      yPos += 5;
      doc.text(`Open Bugs: ${metrics.bugs.open}`, 18, yPos);

      // Add visual charts section
      yPos = 90;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('Test Status Distribution', 14, yPos);

      // Create a simple chart representation
      yPos += 10;
      const chartWidth = 160;
      const chartHeight = 20;

      // Test case status chart
      const passWidth = (metrics.testCases.passed / metrics.testCases.total) * chartWidth;
      const failWidth = (metrics.testCases.failed / metrics.testCases.total) * chartWidth;
      const blockedWidth = (metrics.testCases.blocked / metrics.testCases.total) * chartWidth;
      const notExecutedWidth = (metrics.testCases.notExecuted / metrics.testCases.total) * chartWidth;

      let currentX = 14;

      // Pass - Green
      if (passWidth > 0) {
        doc.setFillColor(34, 197, 94);
        doc.rect(currentX, yPos, passWidth, chartHeight, 'F');
        currentX += passWidth;
      }

      // Fail - Red
      if (failWidth > 0) {
        doc.setFillColor(239, 68, 68);
        doc.rect(currentX, yPos, failWidth, chartHeight, 'F');
        currentX += failWidth;
      }

      // Blocked - Orange
      if (blockedWidth > 0) {
        doc.setFillColor(251, 146, 60);
        doc.rect(currentX, yPos, blockedWidth, chartHeight, 'F');
        currentX += blockedWidth;
      }

      // Not Executed - Gray
      if (notExecutedWidth > 0) {
        doc.setFillColor(156, 163, 175);
        doc.rect(currentX, yPos, notExecutedWidth, chartHeight, 'F');
      }

      // Add legend
      yPos += 30;
      doc.setFontSize(9);
      let legendX = 14;

      // Pass legend
      doc.setFillColor(34, 197, 94);
      doc.rect(legendX, yPos, 8, 6, 'F');
      doc.text(`Pass (${metrics.testCases.passed})`, legendX + 12, yPos + 4);
      legendX += 50;

      // Fail legend
      doc.setFillColor(239, 68, 68);
      doc.rect(legendX, yPos, 8, 6, 'F');
      doc.text(`Fail (${metrics.testCases.failed})`, legendX + 12, yPos + 4);
      legendX += 50;

      // Blocked legend
      doc.setFillColor(251, 146, 60);
      doc.rect(legendX, yPos, 8, 6, 'F');
      doc.text(`Blocked (${metrics.testCases.blocked})`, legendX + 12, yPos + 4);
      legendX += 60;

      // Not Executed legend
      doc.setFillColor(156, 163, 175);
      doc.rect(legendX, yPos, 8, 6, 'F');
      doc.text(`Not Executed (${metrics.testCases.notExecuted})`, legendX + 12, yPos + 4);

      // Bug severity distribution
      yPos += 25;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('Bug Severity Distribution', 14, yPos);

      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Critical: ${metrics.bugs.critical}`, 14, yPos);
      doc.text(`Major: ${metrics.bugs.major}`, 70, yPos);
      doc.text(`Total Open: ${metrics.bugs.open}`, 120, yPos);

      yPos += 15;

      // Add table
      const tableData = filteredData.map(item => [
        item.type === 'testcase' ? 'Test Case' : 'Bug',
        item.module,
        item.title.substring(0, 30) + (item.title.length > 30 ? '...' : ''),
        item.priority,
        item.status,
        `${item.progress}%`,
        new Date(item.createdAt).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Type', 'Module', 'Title/Feature', 'Priority', 'Status', 'Progress', 'Created']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 15 },
          6: { cellWidth: 20 }
        }
      });

      doc.save(`consolidated-report-${project?.name?.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`);

      toast({
        title: "Export successful",
        description: "Consolidated report exported to PDF",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export consolidated report",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project first.",
        variant: "destructive",
      });
      return;
    }

    exportToPDFMutation.mutate();
  };

  // Show loading state only when actually loading critical data
  if (isProjectsLoading || (effectiveProjectId && (isTestCasesLoading || isBugsLoading))) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">Loading consolidated reports...</p>
          <p className="text-xs text-gray-500 mt-1">
            Project ID: {effectiveProjectId || 'Not available'} | 
            Projects Loading: {isProjectsLoading ? 'Yes' : 'No'} | 
            Test Cases Loading: {isTestCasesLoading ? 'Yes' : 'No'} | 
            Bugs Loading: {isBugsLoading ? 'Yes' : 'No'} |
            Projects Count: {allProjects?.length || 0}
          </p>
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show error if no project can be loaded
  if (!effectiveProjectId && !isProjectsLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-center py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-yellow-800 font-semibold">No Project Available</h3>
            <div className="mt-2 text-sm text-yellow-600">
              <p>No projects found or project ID not provided.</p>
              <p className="mt-2">Debug Info:</p>
              <ul className="text-xs mt-1">
                <li>Selected Project ID: {selectedProjectId || 'None'}</li>
                <li>Project ID Prop: {projectId || 'None'}</li>
                <li>Available Projects: {allProjects?.length || 0}</li>
                <li>Projects Loading: {isProjectsLoading ? 'Yes' : 'No'}</li>
              </ul>
            </div>
            <div className="mt-4">
              <Button onClick={() => navigate('/projects')} className="mr-2">
                Go to Projects
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if data fetching failed
  if (testCasesError || bugsError) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
            <div className="mt-2 text-sm text-red-600">
              {testCasesError && <p>Test Cases: {testCasesError.message}</p>}
              {bugsError && <p>Bugs: {bugsError.message}</p>}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Project ID: {effectiveProjectId} | Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state if users data is still loading
  if (!users) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${isFullScreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''} flex flex-col h-full overflow-hidden ${isMinimized ? 'h-auto' : ''}`}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Consolidated Reports - {project?.name}
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive project overview and status management</p>
            <div className="text-xs text-gray-500 mt-1">
              Project ID: {effectiveProjectId} | Test Cases: {testCases?.length || 0} | Bugs: {bugs?.length || 0} | 
              Loading: TC({isTestCasesLoading ? 'Yes' : 'No'}), B({isBugsLoading ? 'Yes' : 'No'}) |
              Errors: {testCasesError ? 'TC-Error' : ''} {bugsError ? 'B-Error' : ''}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('Manual refresh triggered');
                refetchTestCases();
                refetchBugs();
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/test-cases`] });
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/bugs`] });
              }}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
            {hasUnsavedChanges && (
              <Button onClick={saveAllChanges} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes ({Object.keys(statusUpdateQueue).length})
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand view" : "Shrink view"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Exit fullscreen" : "Fullscreen view"}
            >
              {isFullScreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <Button onClick={handleOpenConsolidatedReports} className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Consolidated Reports
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Bar with Darker Advanced Gradients */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative overflow-hidden bg-gradient-to-br from-slate-800 via-gray-900 to-black p-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border border-gray-700"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="text-sm text-gray-300 font-medium flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                  <Target className="h-4 w-4 text-blue-400" />
                </div>
                Total Items
              </div>
              <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">{combinedData.length}</div>
              <div className="text-xs text-gray-400">
                {testCases?.length || 0} test cases, {bugs?.length || 0} bugs
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full group-hover:from-blue-400/30"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-70"></div>
            </div>
          </motion.div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 p-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border border-emerald-700">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="text-sm text-gray-300 font-medium flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
                Test Pass Rate
              </div>
              <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">{passRate}%</div>
              <div className="text-xs text-gray-400">
                {passedTestCases} of {totalTestCases} passed
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full group-hover:from-emerald-400/30"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 opacity-70"></div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-red-900 via-rose-900 to-pink-900 p-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border border-red-700">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="text-sm text-gray-300 font-medium flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                Open Bugs
              </div>
              <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">{metrics.bugs.open}</div>
              <div className="text-xs text-gray-400">
                {metrics.bugs.critical} critical, {metrics.bugs.major} major
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/20 to-transparent rounded-bl-full group-hover:from-red-400/30"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 opacity-70"></div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900 p-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border border-purple-700">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="text-sm text-gray-300 font-medium flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                In Progress
              </div>
              <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                {metrics.bugs.inProgress + metrics.testCases.blocked}
              </div>
              <div className="text-xs text-gray-400">
                Active work items
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full group-hover:from-purple-400/30"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 opacity-70"></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-2"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pass">Pass</SelectItem>
              <SelectItem value="Fail">Fail</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
              <SelectItem value="Not Executed">Not Executed</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules?.map(module => (
                <SelectItem key={module.id} value={module.name}>
                  {module.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="Major">Major</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      {!isMinimized && (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800">
              <TableRow className="border-0">
                <TableHead className="text-white font-semibold">Type</TableHead>
                <TableHead className="text-white font-semibold">Module</TableHead>
                <TableHead className="text-white font-semibold">Title/Feature</TableHead>
                <TableHead className="text-white font-semibold">Priority</TableHead>
                <TableHead className="text-white font-semibold">Status</TableHead>
                <TableHead className="text-white font-semibold">Progress</TableHead>
                <TableHead className="text-white font-semibold">Created</TableHead>
                <TableHead className="text-white font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 transition-all duration-300 border-b border-gray-100">
                  <TableCell>
                    <Badge variant="outline" className={item.type === 'testcase' 
                      ? 'border-0 text-white font-semibold bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 shadow-md hover:shadow-lg transition-all duration-300' 
                      : 'border-0 text-white font-semibold bg-gradient-to-r from-red-500 via-rose-600 to-pink-600 shadow-md hover:shadow-lg transition-all duration-300'}>
                      {item.type === 'testcase' ? 'Test Case' : 'Bug'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-gradient-to-r from-slate-200 via-gray-300 to-slate-200 text-slate-700 font-medium border-0 shadow-sm">{item.module}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate font-medium">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {item.description.substring(0, 100)}...
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                      <Select
                        value={item.status}
                        onValueChange={(newStatus) => {
                          console.log('Status change triggered:', { item: item.id, newStatus, currentStatus: item.status });
                          if (newStatus !== item.status) {
                            updateStatusMutation.mutate({
                              itemId: item.id,
                              type: item.type as 'testcase' | 'bug',
                              status: newStatus
                            });
                          }
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className={`w-32 border-0 ${getStatusColor(item.status, item.type)}`}>
                          <SelectValue placeholder={item.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {item.type === 'testcase' ? (
                            <>
                              <SelectItem value="Pass" className="bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-gradient-to-r focus:from-emerald-600 focus:via-green-700 focus:to-teal-600">Pass</SelectItem>
                              <SelectItem value="Fail" className="bg-gradient-to-r from-red-500 via-rose-600 to-pink-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-gradient-to-r focus:from-red-600 focus:via-rose-700 focus:to-pink-600">Fail</SelectItem>
                              <SelectItem value="Blocked" className="bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-gradient-to-r focus:from-orange-600 focus:via-amber-700 focus:to-yellow-600">Blocked</SelectItem>
                              <SelectItem value="Not Executed" className="bg-gradient-to-r from-slate-500 via-gray-600 to-zinc-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-gradient-to-r focus:from-slate-600 focus:via-gray-700 focus:to-zinc-600">Not Executed</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="Open" className="bg-gradient-to-r from-red-600 via-rose-700 to-pink-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-gradient-to-r focus:from-red-700 focus:via-rose-800 focus:to-pink-700">Open</SelectItem>
                              <SelectItem value="In Progress" className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-gradient-to-r focus:from-blue-700 focus:via-indigo-800 focus:to-purple-700">In Progress</SelectItem>
                              <SelectItem value="Resolved" className="bg-gradient-to-r from-emerald-600 via-green-700 to-teal-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-gradient-to-r focus:from-emerald-700 focus:via-green-800 focus:to-teal-700">Resolved</SelectItem>
                              <SelectItem value="Closed" className="bg-gradient-to-r from-purple-600 via-violet-700 to-indigo-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-gradient-to-r focus:from-purple-700 focus:via-violet-800 focus:to-indigo-700">Closed</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={item.progress} className="w-16 h-2" />
                      <span className="text-xs text-gray-600">{item.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewItem(item)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                             onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusEdit(item)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteItem(item)}>
                            <X className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredData.length === 0 && (
            <div className="text-center py-16">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl opacity-50"></div>
                <div className="relative z-10 p-8">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <AlertTriangle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No items found</h3>
                  <p className="text-gray-600 mb-4">
                    {combinedData.length === 0 
                      ? "No test cases or bugs have been created for this project yet." 
                      : "Try adjusting your filters or search query to see more results."
                    }
                  </p>
                  <div className="text-sm text-gray-500 mt-2 space-y-1 bg-gray-100 p-4 rounded-lg">
                    <div className="font-semibold">Debug Information:</div>
                    <div>• Project ID: {effectiveProjectId}</div>
                    <div>• Project Name: {project?.name || 'Not loaded'}</div>
                    <div>• Test Cases Raw: {JSON.stringify(testCases?.slice(0, 2)) || 'None'}</div>
                    <div>• Bugs Raw: {JSON.stringify(bugs?.slice(0, 2)) || 'None'}</div>
                    <div>• Test Cases Count: {Array.isArray(testCases) ? testCases.length : 'Not array - ' + typeof testCases}</div>
                    <div>• Bugs Count: {Array.isArray(bugs) ? bugs.length : 'Not array - ' + typeof bugs}</div>
                    <div>• Combined Data: {combinedData.length}</div>
                    <div>• Filtered Data: {filteredData.length}</div>
                    <div>• Modules: {modules?.length || 0}</div>
                    <div>• Users: {users?.length || 0}</div>
                    <div>• Loading States: Projects({isProjectsLoading ? 'Y' : 'N'}), TestCases({isTestCasesLoading ? 'Y' : 'N'}), Bugs({isBugsLoading ? 'Y' : 'N'})</div>
                    <div>• Errors: TestCases({testCasesError?.message || 'None'}), Bugs({bugsError?.message || 'None'})</div>
                    <div>• Current Filters: Status({filterStatus}), Priority({filterPriority}), Module({filterModule}), Search({searchQuery})</div>
                  </div>
                  {combinedData.length === 0 && (
                    <div className="mt-6">
                      <Button onClick={() => navigate('/test-cases')} className="mr-2">
                        Create Test Case
                      </Button>
                      <Button onClick={() => navigate('/bugs')} variant="outline">
                        Report Bug
                      </Button>
                      <Button 
                        onClick={() => {
                          refetchTestCases();
                          refetchBugs();
                        }} 
                        variant="outline" 
                        className="ml-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Loading
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* View Test Case Dialog */}
      <Dialog open={viewTestCaseDialogOpen} onOpenChange={setViewTestCaseDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItemForView?.type === 'testcase' ? 'Test Case Details' : 'Bug Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedItemForView?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedItemForView && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Title/Feature</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedItemForView.title}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Module</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedItemForView.module}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedItemForView.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge variant="outline" className={getStatusColor(selectedItemForView.status, selectedItemForView.type)}>
                    {selectedItemForView.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Priority</h3>
                  <Badge className={getPriorityColor(selectedItemForView.priority)}>
                    {selectedItemForView.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Assignee</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedItemForView.assignee}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Created</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {new Date(selectedItemForView.createdAt).toLocaleDateString()}
                </p>
              </div>

              {selectedItemForView.originalData?.tags && (selectedItemForView.originalData.tags as any[])?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium">Tags</h3>
                  <div className="mt-2">
                    <TestCaseTags 
                      tags={selectedItemForView.originalData.tags as any[]} 
                      limit={10} 
                    />
                  </div>
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
                    handleEditItem(selectedItemForView);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Test Case Dialog */}
      <Dialog open={editTestCaseDialogOpen} onOpenChange={setEditTestCaseDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Test Case</DialogTitle>
            <DialogDescription>
              Update the test case details below.
            </DialogDescription>
          </DialogHeader>
          {selectedItemForView?.type === 'testcase' && (
            <TestCaseForm 
              testCase={selectedItemForView.originalData}
              projectId={Number(currentProjectId)}
              modules={modules || []}
              onSuccess={() => {
                setEditTestCaseDialogOpen(false);
                // Refresh data
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/test-cases`] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bug Dialog */}
      <Dialog open={editBugDialogOpen} onOpenChange={setEditBugDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Bug</DialogTitle>
            <DialogDescription>
              Update the bug details below.
            </DialogDescription>
          </DialogHeader>
          {selectedItemForView?.type === 'bug' && (
            <BugForm 
              bug={selectedItemForView.originalData}
              projectId={Number(currentProjectId)}
              modules={modules || []}
              onSuccess={() => {
                setEditBugDialogOpen(false);
                // Refresh data
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${effectiveProjectId}/bugs`] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

            {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Update the status for this {editingItem?.type === 'testcase' ? 'test case' : 'bug'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {editingItem?.type === 'testcase' ? (
                    <>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                      <SelectItem value="Not Executed">Not Executed</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdate}
              disabled={updateTestCaseStatusMutation.isPending || updateBugStatusMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateTestCaseStatusMutation.isPending || updateBugStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}