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
import { useToast } from '../../hooks/use-toast';
import { ProjectSelect } from '../../components/ui/project-select';
import { ModuleSelect } from '../../components/ui/module-select';
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Minimize2, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
      console.log(`Fetching test cases for project ${selectedProject}`);
      const response = await fetch(`/api/projects/${selectedProject}/test-cases`);
      if (!response.ok) throw new Error('Failed to fetch test cases');
      const data = await response.json();
      console.log(`Fetched ${data.length} test cases:`, data);
      return data;
    },
    enabled: !!selectedProject,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch bugs for selected project
  const { data: bugs = [], isLoading: isBugsLoading, refetch: refetchBugs } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/bugs`],
    queryFn: async () => {
      if (!selectedProject) return [];
      console.log(`Fetching bugs for project ${selectedProject}`);
      const response = await fetch(`/api/projects/${selectedProject}/bugs`);
      if (!response.ok) throw new Error('Failed to fetch bugs');
      const data = await response.json();
      console.log(`Fetched ${data.length} bugs:`, data);
      return data;
    },
    enabled: !!selectedProject,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, type, status }: UpdateStatusRequest) => {
      const endpoint = type === 'testcase' ? `/api/test-cases/${id}` : `/api/bugs/${id}`;
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error(`Failed to update ${type} status`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/test-cases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/bugs`] });
      toast({
        title: 'Success',
        description: `${variables.type === 'testcase' ? 'Test case' : 'Bug'} status updated successfully`
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Combine and process data
  const consolidatedData: ConsolidatedItem[] = React.useMemo(() => {
    console.log('Processing consolidated data...', {
      testCasesCount: testCases.length,
      bugsCount: bugs.length,
      modulesCount: modules.length
    });

    const testCaseItems: ConsolidatedItem[] = testCases.map((tc: any) => ({
      id: tc.id,
      type: 'Test Case' as const,
      moduleId: tc.moduleId,
      moduleName: modules.find((m: any) => m.id === tc.moduleId)?.name || 'Unknown',
      title: tc.feature || tc.scenario || tc.title || `Test Case ${tc.id}`,
      priority: tc.priority || 'Medium',
      status: tc.status || 'Not Executed',
      created: new Date(tc.createdAt).toLocaleDateString(),
      progress: tc.status === 'Pass' ? 100 : tc.status === 'Fail' ? 0 : tc.status === 'Blocked' ? 25 : 50
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
      severity: bug.severity
    }));

    const combined = [...testCaseItems, ...bugItems];
    console.log('Combined data created:', combined.length, 'items');
    return combined;
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

  const handleStatusChange = (item: ConsolidatedItem, newStatus: string) => {
    const type = item.type === 'Test Case' ? 'testcase' : 'bug';
    updateStatusMutation.mutate({ id: item.id, type, status: newStatus });
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

  if (isProjectsLoading || (selectedProject && (isTestCasesLoading || isBugsLoading))) {
    return (
      <div className="space-y-4 p-4">
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
              Consolidated Reports - {projects.find(p => p.id === selectedProject)?.name || 'Loading...'}
            </h1>
            <p className="text-gray-600 mt-1">Complete project overview and status management</p>
            <div className="text-xs text-gray-500 mt-1">
              Real-time data | Test Cases: {testCases.length} | Bugs: {bugs.length} | Combined: {consolidatedData.length}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Export CSV</Button>
              <Button variant="outline" size="sm">Export PDF</Button>
              <Button>Print</Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand view" : "Minimize view"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Exit fullscreen" : "Fullscreen view"}
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Bar with Advanced Gradients */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full group-hover:from-white/20"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 opacity-50"></div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-teal-500 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full group-hover:from-white/20"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-teal-300 via-green-300 to-emerald-300 opacity-50"></div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 via-rose-600 to-pink-500 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full group-hover:from-white/20"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 via-rose-300 to-red-300 opacity-50"></div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-500 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full group-hover:from-white/20"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 opacity-50"></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium">Project</label>
            <ProjectSelect
              value={selectedProject}
              onValueChange={setSelectedProject}
              projects={projects}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Search Items</label>
            <Input
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">All Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
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
            <label className="text-sm font-medium">All Priority</label>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
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
            <label className="text-sm font-medium">All Modules</label>
            <ModuleSelect
              value={selectedModule}
              onValueChange={setSelectedModule}
              modules={modules}
              includeAll={true}
            />
          </div>
          <div>
            <label className="text-sm font-medium">All Severity</label>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger>
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
      </div>

      {/* Main Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto p-4">
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{selectedItems.length} items selected</span>
                  <Select onValueChange={handleBulkStatusUpdate}>
                    <SelectTrigger className="w-48">
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
                  <Button variant="outline" onClick={clearSelection}>Clear Selection</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Project Items ({filteredData.length})</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllItems} className="text-white border-white hover:bg-white hover:text-black">
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection} className="text-white border-white hover:bg-white hover:text-black">
                    Clear All
                  </Button>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800">
                <TableRow className="border-0">
                  <TableHead className="text-white font-semibold">
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
                {filteredData.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 transition-all duration-300 border-b border-gray-100">
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge className={item.type === 'Test Case' 
                        ? 'border-0 text-white font-semibold bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 shadow-md hover:shadow-lg transition-all duration-300' 
                        : 'border-0 text-white font-semibold bg-gradient-to-r from-red-500 via-rose-600 to-pink-600 shadow-md hover:shadow-lg transition-all duration-300'}>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gradient-to-r from-slate-200 via-gray-300 to-slate-200 text-slate-700 font-medium border-0 shadow-sm">
                        {item.moduleName}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge className={
                        item.priority === 'Critical' ? 'bg-gradient-to-r from-red-600 via-rose-700 to-pink-600 text-white border-0 font-bold shadow-xl' :
                        item.priority === 'High' ? 'bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 text-white border-0 font-bold shadow-lg' :
                        item.priority === 'Medium' ? 'bg-gradient-to-r from-yellow-500 via-amber-600 to-orange-500 text-white border-0 font-bold shadow-lg' :
                        'bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 text-white border-0 font-bold shadow-lg'
                      }>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={item.status} 
                        onValueChange={(value) => handleStatusChange(item, value)}
                      >
                        <SelectTrigger className={`w-32 border-0 ${
                          item.type === 'Test Case' ? (
                            item.status === 'Pass' ? 'bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 text-white border-0 font-semibold shadow-lg' :
                            item.status === 'Fail' ? 'bg-gradient-to-r from-red-500 via-rose-600 to-pink-500 text-white border-0 font-semibold shadow-lg' :
                            item.status === 'Blocked' ? 'bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-500 text-white border-0 font-semibold shadow-lg' :
                            'bg-gradient-to-r from-slate-500 via-gray-600 to-zinc-500 text-white border-0 font-semibold shadow-lg'
                          ) : (
                            item.status === 'Open' ? 'bg-gradient-to-r from-red-600 via-rose-700 to-pink-600 text-white border-0 font-semibold shadow-lg' :
                            item.status === 'In Progress' ? 'bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 text-white border-0 font-semibold shadow-lg' :
                            item.status === 'Resolved' ? 'bg-gradient-to-r from-emerald-600 via-green-700 to-teal-600 text-white border-0 font-semibold shadow-lg' :
                            item.status === 'Closed' ? 'bg-gradient-to-r from-purple-600 via-violet-700 to-indigo-600 text-white border-0 font-semibold shadow-lg' :
                            'bg-gradient-to-r from-slate-600 via-gray-700 to-zinc-600 text-white border-0 font-semibold shadow-lg'
                          )
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {item.type === 'Test Case' ? (
                            <>
                              <SelectItem value="Not Executed">Not Executed</SelectItem>
                              <SelectItem value="Pass">Pass</SelectItem>
                              <SelectItem value="Fail">Fail</SelectItem>
                              <SelectItem value="Blocked">Blocked</SelectItem>
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
                        <Progress value{item.progress} className="w-16 h-2" />
                        <span className="text-xs text-gray-600">{item.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{item.created}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">👁️</Button>
                        <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-600">📝</Button>
                      </div>
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
                      {consolidatedData.length === 0 
                        ? "No test cases or bugs have been created for this project yet." 
                        : "Try adjusting your filters or search query to see more results."
                      }
                    </p>
                    <div className="text-sm text-gray-500 mt-2 space-y-1 bg-gray-100 p-4 rounded-lg">
                      <div className="font-semibold">Debug Information:</div>
                      <div>• Project: {projects.find(p => p.id === selectedProject)?.name || 'Not selected'}</div>
                      <div>• Test Cases: {testCases.length}</div>
                      <div>• Bugs: {bugs.length}</div>
                      <div>• Combined Data: {consolidatedData.length}</div>
                      <div>• Filtered Data: {filteredData.length}</div>
                      <div>• Current Filters: Status({selectedStatus}), Priority({selectedPriority}), Module({selectedModule}), Search({searchTerm})</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}