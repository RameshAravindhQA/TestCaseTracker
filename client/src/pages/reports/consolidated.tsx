import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import { ProjectSelect } from '../../components/ui/project-select';
import { TestCaseForm } from '../../components/test-cases/test-case-form';
import { BugForm } from '../../components/bugs/bug-form';
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Minimize2, Maximize2, Eye, Edit, MoreHorizontal, Trash, ArrowLeft, Download, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

interface ConsolidatedItem {
  id: number;
  type: 'Test Case' | 'Bug';
  moduleId: number;
  moduleName: string;
  title: string;
  priority: string;
  status: string;
  created: string;
  progress: number;
  severity?: string;
  originalData?: any;
}

interface UpdateStatusRequest {
  id: number;
  type: 'testcase' | 'bug';
  status: string;
}

export default function ConsolidatedReports() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConsolidatedItem | null>(null);
  

  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Auto-select first project if none selected
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  // Fetch modules for selected project
  const { data: modules = [] } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/modules`],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/projects/${selectedProject}/modules`);
      if (!response.ok) throw new Error('Failed to fetch modules');
      return response.json();
    },
    enabled: !!selectedProject
  });

  // Fetch test cases for selected project
  const { data: testCases = [], isLoading: isTestCasesLoading, refetch: refetchTestCases } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/test-cases`],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/projects/${selectedProject}/test-cases`);
      if (!response.ok) throw new Error('Failed to fetch test cases');
      const data = await response.json();
      return data;
    },
    enabled: !!selectedProject,
    refetchInterval: 30000,
  });

  // Fetch bugs for selected project
  const { data: bugs = [], isLoading: isBugsLoading, refetch: refetchBugs } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/bugs`],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/projects/${selectedProject}/bugs`);
      if (!response.ok) throw new Error('Failed to fetch bugs');
      const data = await response.json();
      return data;
    },
    enabled: !!selectedProject,
    refetchInterval: 30000,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, type, status }: UpdateStatusRequest) => {
      const endpoint = type === 'testcase' ? `/api/test-cases/${id}` : `/api/bugs/${id}`;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Status update failed:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          console.warn('Non-JSON response received:', await response.text());
          return { success: true };
        }
      } catch (error) {
        console.error('Status update error:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Refresh both data sources to get updated status
      refetchTestCases();
      refetchBugs();
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/bugs`] });
      toast({
        title: 'Success',
        description: `${variables.type === 'testcase' ? 'Test case' : 'Bug'} status updated successfully`
      });
    },
    onError: (error: any) => {
      console.error('Update status mutation error:', error);
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message || 'Unknown error occurred'}`,
        variant: 'destructive'
      });
    }
  });

  // Delete mutations
  const deleteTestCaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/test-cases/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete test case');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/test-cases`] });
      toast({ title: 'Success', description: 'Test case deleted successfully' });
    }
  });

  const deleteBugMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/bugs/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete bug');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/bugs`] });
      toast({ title: 'Success', description: 'Bug deleted successfully' });
    }
  });

  // Combine and process data
  const consolidatedData: ConsolidatedItem[] = React.useMemo(() => {
    const testCaseItems: ConsolidatedItem[] = testCases.map((tc: any) => ({
      id: tc.id,
      type: 'Test Case' as const,
      moduleId: tc.moduleId,
      moduleName: modules.find((m: any) => m.id === tc.moduleId)?.name || 'Unknown',
      title: tc.feature || tc.scenario || tc.title || `Test Case ${tc.id}`,
      priority: tc.priority || 'Medium',
      status: tc.status || 'Not Executed',
      created: new Date(tc.createdAt).toLocaleDateString(),
      progress: tc.status === 'Pass' ? 100 : tc.status === 'Fail' ? 0 : tc.status === 'Blocked' ? 25 : 50,
      originalData: tc
    }));

    const bugItems: ConsolidatedItem[] = bugs.map((bug: any) => ({
      id: bug.id,
      type: 'Bug' as const,
      moduleId: bug.moduleId,
      moduleName: modules.find((m: any) => m.id === bug.moduleId)?.name || 'Unknown',
      title: bug.title || `Bug ${bug.id}`,
      priority: bug.priority || 'Medium',
      status: bug.status || 'Open',
      created: new Date(bug.createdAt || bug.dateReported).toLocaleDateString(),
      progress: bug.status === 'Closed' ? 100 : bug.status === 'Resolved' ? 75 : bug.status === 'In Progress' ? 50 : 0,
      severity: bug.severity,
      originalData: bug
    }));

    return [...testCaseItems, ...bugItems];
  }, [testCases, bugs, modules]);

  // Filter data
  const filteredData = consolidatedData.filter(item => {
    const matchesModule = selectedModule === 'all' || item.moduleId === parseInt(selectedModule);
    const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || 
      (item.type === 'Bug' && item.severity === selectedSeverity);
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesModule && matchesPriority && matchesStatus && matchesSeverity && matchesSearch;
  });

  // Calculate statistics
  const totalItems = consolidatedData.length;
  const testPassRate = testCases.length > 0 ? 
    Math.round((testCases.filter((tc: any) => tc.status === 'Pass').length / testCases.length) * 100) : 0;
  const openBugs = bugs.filter((bug: any) => bug.status === 'Open').length;
  const inProgressItems = consolidatedData.filter(item => 
    item.status === 'In Progress' || item.status === 'Blocked'
  ).length;

  const handleStatusChange = async (item: ConsolidatedItem, newStatus: string) => {
    const type = item.type === 'Test Case' ? 'testcase' : 'bug';
    try {
      await updateStatusMutation.mutateAsync({ id: item.id, type, status: newStatus });
      toast({
        title: 'Success',
        description: `${item.type} status updated to ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message || 'Please try again'}`,
        variant: 'destructive'
      });
    }
  };

  const saveAllChanges = async () => {
    for (const [key, status] of Object.entries(pendingStatusUpdates)) {
      const [type, idStr] = key.split('-');
      const id = parseInt(idStr);
      const item = consolidatedData.find(i => i.id === id && i.type === (type === 'Test' ? 'Test Case' : 'Bug'));
      if (item) {
        await saveStatusChange(item, status, key);
      }
    }
  };

  const handleBulkStatusUpdate = (newStatus: string) => {
    selectedItems.forEach(itemId => {
      const item = consolidatedData.find(i => i.id === itemId);
      if (item) {
        handleStatusChange(item, newStatus);
      }
    });
    setSelectedItems([]);
  };

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(filteredData.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const refreshData = () => {
    refetchTestCases();
    refetchBugs();
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/test-cases`] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/bugs`] });
  };

  const handleView = (item: ConsolidatedItem) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const handleEdit = (item: ConsolidatedItem) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  const handleDelete = async (item: ConsolidatedItem) => {
    if (!confirm(`Are you sure you want to delete this ${item.type.toLowerCase()}?`)) return;

    try {
      if (item.type === 'Test Case') {
        await deleteTestCaseMutation.mutateAsync(item.id);
      } else {
        await deleteBugMutation.mutateAsync(item.id);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = filteredData.map(item => ({
        Type: item.type,
        Module: item.moduleName,
        'Title/Feature': item.title,
        Priority: item.priority,
        Status: item.status,
        Progress: `${item.progress}%`,
        Created: item.created,
        Severity: item.severity || 'N/A'
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `consolidated-report-${Date.now()}.csv`);
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

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(`Consolidated Report`, 14, 20);

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      const project = projects.find(p => p.id === selectedProject);
      doc.text(`${project?.name || 'Project'}`, 14, 30);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);

      // Add summary
      doc.setFillColor(240, 248, 255);
      doc.rect(14, 45, 180, 35, 'F');
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('Executive Summary', 18, 55);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let yPos = 62;
      doc.text(`Total Items: ${totalItems}`, 18, yPos);
      yPos += 5;
      doc.text(`Test Pass Rate: ${testPassRate}%`, 18, yPos);
      yPos += 5;
      doc.text(`Total Bugs: ${bugs.length}`, 18, yPos);
      yPos += 5;
      doc.text(`Open Bugs: ${openBugs}`, 18, yPos);

      yPos = 90;

      // Add table
      const tableData = filteredData.map(item => [
        item.type,
        item.moduleName,
        item.title.substring(0, 30) + (item.title.length > 30 ? '...' : ''),
        item.priority,
        item.status,
        `${item.progress}%`,
        item.created
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

      doc.save(`consolidated-report-${Date.now()}.pdf`);

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

  const goBack = () => {
    window.history.back();
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === 'Test Case') {
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

  if (isProjectsLoading || (selectedProject && (isTestCasesLoading || isBugsLoading))) {
    return (
      <div className="space-y-4 p-6">
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">Loading consolidated reports...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 w-full rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            className="text-black"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-black">
              Consolidated Reports
            </h1>
            <p className="text-gray-600 mt-1">Complete project overview and status management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
            className="text-black"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToPDF}
            className="text-black"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            className="text-black"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
        </div>
      </div>

      {/* Enhanced Stats Cards with Gradients */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20"></div>
          <div className="relative z-10">
            <div className="text-sm text-white/90 font-medium flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                <Target className="h-4 w-4 text-white" />
              </div>
              Total Items
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">{totalItems}</div>
            <div className="text-xs text-white/80">
              {testCases.length} test cases, {bugs.length} bugs
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-teal-500 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20"></div>
          <div className="relative z-10">
            <div className="text-sm text-white/90 font-medium flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              Test Pass Rate
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">{testPassRate}%</div>
            <div className="text-xs text-white/80">
              {testCases.filter((tc: any) => tc.status === 'Pass').length} of {testCases.length} passed
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 via-rose-600 to-pink-500 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20"></div>
          <div className="relative z-10">
            <div className="text-sm text-white/90 font-medium flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              Open Bugs
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">{openBugs}</div>
            <div className="text-xs text-white/80">
              {bugs.filter((bug: any) => bug.severity === 'Critical').length} critical, {bugs.filter((bug: any) => bug.severity === 'Major').length} major
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-500 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20"></div>
          <div className="relative z-10">
            <div className="text-sm text-white/90 font-medium flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                <Clock className="h-4 w-4 text-white" />
              </div>
              In Progress
            </div>
            <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">{inProgressItems}</div>
            <div className="text-xs text-white/80">
              Active work items
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium text-black mb-2 block">Project</label>
              <ProjectSelect
                value={selectedProject}
                onValueChange={setSelectedProject}
                projects={projects}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-black mb-2 block">Search Items</label>
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-black mb-2 block">All Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="text-black">
                  <SelectValue />
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
            </div>
            <div>
              <label className="text-sm font-medium text-black mb-2 block">All Priority</label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-black mb-2 block">All Modules</label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map((module: any) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-black mb-2 block">All Severity</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Major">Major</SelectItem>
                  <SelectItem value="Minor">Minor</SelectItem>
                  <SelectItem value="Trivial">Trivial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-black">{selectedItems.length} items selected</span>
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-48 text-black">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pass">Mark as Pass</SelectItem>
                  <SelectItem value="Fail">Mark as Fail</SelectItem>
                  <SelectItem value="Blocked">Mark as Blocked</SelectItem>
                  <SelectItem value="In Progress">Mark as In Progress</SelectItem>
                  <SelectItem value="Resolved">Mark as Resolved</SelectItem>
                  <SelectItem value="Closed">Mark as Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearSelection} className="text-black">Clear Selection</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-black">Project Items ({filteredData.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllItems} className="text-black">
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection} className="text-black">
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-black">
                  <Checkbox
                    checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllItems();
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="text-black">Type</TableHead>
                <TableHead className="text-black">Module</TableHead>
                <TableHead className="text-black">Title/Feature</TableHead>
                <TableHead className="text-black">Priority</TableHead>
                <TableHead className="text-black">Status</TableHead>
                <TableHead className="text-black">Progress</TableHead>
                <TableHead className="text-black">Created</TableHead>
                <TableHead className="text-black">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => {
                const currentStatus = item.status;

                return (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'Test Case' ? 'default' : 'destructive'} className="text-white">
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-black">
                        {item.moduleName}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-medium text-black">{item.title}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          item.priority === 'Critical' ? 'destructive' :
                          item.priority === 'High' ? 'destructive' :
                          item.priority === 'Medium' ? 'default' : 'secondary'
                        }
                        className="text-white"
                      >
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Select 
                          value={currentStatus} 
                          onValueChange={(value) => handleStatusChange(item, value)}
                        >
                          <SelectTrigger className={`w-32 border-0 ${getStatusColor(currentStatus, item.type)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {item.type === 'Test Case' ? (
                              <>
                                <SelectItem value="Not Executed" className="bg-gradient-to-r from-slate-500 via-gray-600 to-zinc-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">Not Executed</SelectItem>
                                <SelectItem value="Pass" className="bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">Pass</SelectItem>
                                <SelectItem value="Fail" className="bg-gradient-to-r from-red-500 via-rose-600 to-pink-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">Fail</SelectItem>
                                <SelectItem value="Blocked" className="bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-500 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">Blocked</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="Open" className="bg-gradient-to-r from-red-600 via-rose-700 to-pink-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">Open</SelectItem>
                                <SelectItem value="In Progress" className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">In Progress</SelectItem>
                                <SelectItem value="Resolved" className="bg-gradient-to-r from-emerald-600 via-green-700 to-teal-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">Resolved</SelectItem>
                                <SelectItem value="Closed" className="bg-gradient-to-r from-purple-600 via-violet-700 to-indigo-600 text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">Closed</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={item.progress} className="w-16 h-2" />
                        <span className="text-xs text-black">{item.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-black">{item.created}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-black">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleView(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(item)} className="text-red-600">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-black mb-2">No items found</h3>
              <p className="text-gray-600">
                {consolidatedData.length === 0 
                  ? "No test cases or bugs have been created for this project yet." 
                  : "Try adjusting your filters or search query to see more results."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-black">
              {selectedItem?.type === 'Test Case' ? 'Test Case Details' : 'Bug Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-black">Title</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedItem.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-black">Module</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedItem.moduleName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-black">Priority</h3>
                  <Badge variant="outline" className="mt-1">{selectedItem.priority}</Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-black">Status</h3>
                  <Badge variant="outline" className="mt-1">{selectedItem.status}</Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-black">Created</h3>
                <p className="text-sm text-gray-700 mt-1">{selectedItem.created}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-black">
              Edit {selectedItem?.type === 'Test Case' ? 'Test Case' : 'Bug'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && selectedItem.type === 'Test Case' && (
            <TestCaseForm 
              testCase={selectedItem.originalData}
              projectId={selectedProject!}
              modules={modules}
              onSuccess={() => {
                setEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/test-cases`] });
              }}
            />
          )}
          {selectedItem && selectedItem.type === 'Bug' && (
            <BugForm 
              bug={selectedItem.originalData}
              projectId={selectedProject!}
              modules={modules}
              onSuccess={() => {
                setEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/bugs`] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}