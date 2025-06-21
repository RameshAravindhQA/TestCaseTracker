import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TestCase, Bug, Project, User, Module } from "@/types";
import { Save, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Clock, Filter, Activity, Target, Maximize2, Minimize2, X, Download, Eye, Edit, Calendar, User as UserIcon, Tag, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { BarChart3 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TestCaseForm } from "@/components/test-cases/test-case-form";
import { BugForm } from "@/components/bugs/bug-form";
import { TestCaseTags } from "@/components/test-cases/test-case-tags";

interface ConsolidatedReportsProps {
  selectedProjectId?: number;
  projectId?: number;
  onClose?: () => void;
}

export function ConsolidatedReports({ selectedProjectId, projectId, onClose }: ConsolidatedReportsProps) {
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [statusUpdateQueue, setStatusUpdateQueue] = useState<{[key: string]: {id: number, type: 'testcase' | 'bug', status: string}}>({});
  const [isFullScreen, setIsFullScreen] = useState(true);
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
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const currentProjectId = selectedProjectId || projectId;

  // Fetch project data
  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${currentProjectId}`],
    enabled: !!currentProjectId,
  });

  // Fetch modules
  const { data: modules } = useQuery<Module[]>({
    queryKey: [`/api/projects/${currentProjectId}/modules`],
    enabled: !!currentProjectId,
  });

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch test cases
  const { data: testCases, isLoading: isTestCasesLoading } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${currentProjectId}/test-cases`],
    enabled: !!currentProjectId,
  });

  // Fetch bugs
  const { data: bugs, isLoading: isBugsLoading } = useQuery<Bug[]>({
    queryKey: [`/api/projects/${currentProjectId}/bugs`],
    enabled: !!currentProjectId,
  });

  // Update test case status mutation
  const updateTestCaseMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      try {
        const res = await apiRequest("PATCH", `/api/test-cases/${id}`, { status });
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
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProjectId}/test-cases`] });
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
        const res = await apiRequest("PATCH", `/api/bugs/${id}`, { status });
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
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProjectId}/bugs`] });
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

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, type, status }: { itemId: string, type: 'testcase' | 'bug', status: string }) => {
      const id = itemId.split('-')[1];
      if (type === 'testcase') {
        const response = await apiRequest('PUT', `/api/test-cases/${id}`, { status });
        return response.json();
      } else {
        const response = await apiRequest('PUT', `/api/bugs/${id}`, { status });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProjectId}/test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProjectId}/bugs`] });
      toast({
        title: "Status Updated",
        description: "Item status has been updated successfully.",
      });
      setEditingItem(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update item status.",
        variant: "destructive",
      });
    },
  });

  // Calculate metrics
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

  const totalTestCases = testCases?.length || 0;
  const passedTestCases = testCases?.filter(tc => tc.status === "Pass").length || 0;
  const totalBugs = bugs?.length || 0;
  const resolvedBugs = bugs?.filter(bug => bug.status === "Resolved").length || 0;
  const closedBugs = bugs?.filter(bug => bug.status === "Closed").length || 0;

  const passRate = metrics.testCases.total > 0 
    ? Math.round((metrics.testCases.passed / metrics.testCases.total) * 100) 
    : 0;

  // Combined data for unified view
  const combinedData = [
    ...(testCases?.map(tc => ({
      id: `tc-${tc.id}`,
      type: 'testcase' as const,
      title: tc.feature || tc.scenario || 'Untitled Test Case',
      module: modules?.find(m => m.id === tc.moduleId)?.name || 'No Module',
      status: tc.status,
      priority: tc.priority,
      assignee: users?.find(u => u.id === tc.assignedTo)?.name || 'Unassigned',
      createdAt: tc.createdAt,
      description: tc.description || '',
      progress: tc.status === 'Pass' ? 100 : tc.status === 'Fail' ? 0 : tc.status === 'Blocked' ? 25 : 50,
      originalData: tc
    })) || []),
    ...(bugs?.map(bug => ({
      id: `bug-${bug.id}`,
      type: 'bug' as const,
      title: bug.title,
      module: modules?.find(m => m.id === bug.moduleId)?.name || 'No Module',
      status: bug.status,
      priority: bug.priority,
      assignee: users?.find(u => u.id === bug.assignedTo)?.name || 'Unassigned',
      createdAt: bug.createdAt,
      description: bug.description || '',
      progress: bug.status === 'Resolved' ? 100 : bug.status === 'Closed' ? 100 : bug.status === 'In Progress' ? 50 : 0,
      severity: bug.severity,
      originalData: bug
    })) || [])
  ];

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
        toast({
          title: "Status updated",
          description: `Test case status updated to ${newStatus}`,
        });
      } else if (type === 'bug') {
        await updateBugMutation.mutateAsync({ id: numericId, status: newStatus });
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
        case 'Pass': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
        case 'Fail': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
        case 'Blocked': return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300';
        case 'Not Executed': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
        default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
      }
    } else {
      switch (status) {
        case 'Open': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
        case 'In Progress': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
        case 'Resolved': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
        case 'Closed': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300';
        default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'High': return 'bg-gradient-to-r from-red-400 to-red-500 text-white';
      case 'Medium': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black';
      case 'Low': return 'bg-gradient-to-r from-green-400 to-green-500 text-white';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  const handleOpenConsolidatedReports = () => {
    navigate(`/reports/consolidated?projectId=${currentProjectId}`);
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
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProjectId}/test-cases`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProjectId}/bugs`] });
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

  if (isTestCasesLoading || isBugsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${isFullScreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''} flex flex-col h-full overflow-hidden`}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Consolidated Reports - {project?.name}
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive project overview and status management</p>
          </div>
          <div className="flex gap-2">
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
            <Button variant="outline" size="sm" onClick={() => setIsFullScreen(!isFullScreen)}>
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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

        {/* Enhanced Stats Bar with Gradients */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Items
            </div>
            <div className="text-2xl font-bold text-blue-900">{combinedData.length}</div>
            <div className="text-xs text-blue-700 mt-1">
              {testCases?.length || 0} test cases, {bugs?.length || 0} bugs
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Test Pass Rate
            </div>
            <div className="text-2xl font-bold text-green-900">{passRate}%</div>
            <div className="text-xs text-green-700 mt-1">
              {passedTestCases} of {totalTestCases} passed
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Open Bugs
            </div>
            <div className="text-2xl font-bold text-red-900">{metrics.bugs.open}</div>
            <div className="text-xs text-red-700 mt-1">
              {metrics.bugs.critical} critical, {metrics.bugs.major} major
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-600 font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {metrics.bugs.inProgress + metrics.testCases.blocked}
            </div>
            <div className="text-xs text-purple-700 mt-1">
              Active work items
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
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Title/Feature</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100">
                  <TableCell>
                    <Badge variant="outline" className={item.type === 'testcase' ? 'border-blue-200 text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100' : 'border-red-200 text-red-700 bg-gradient-to-r from-red-50 to-red-100'}>
                      {item.type === 'testcase' ? 'Test Case' : 'Bug'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-gradient-to-r from-gray-100 to-gray-200">{item.module}</Badge>
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
                      onValueChange={(value) => handleIndividualStatusUpdate(item.id, value)}
                    >
                      <SelectTrigger className={`w-32 border-0 ${getStatusColor(item.status, item.type)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {item.type === 'testcase' ? (
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
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewItem(item)}
                        title="View Details"
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        title="Edit Item"
                        className="hover:bg-green-50 hover:text-green-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteItem(item)}
                        title="Delete Item"
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </div>

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
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProjectId}/test-cases`] });
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
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProjectId}/bugs`] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}