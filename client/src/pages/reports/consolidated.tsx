
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
import { toast } from '../../hooks/use-toast';
import { ProjectSelect } from '../../components/ui/project-select';
import { ModuleSelect } from '../../components/ui/module-select';

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
}

interface UpdateStatusRequest {
  id: number;
  type: 'testcase' | 'bug';
  status: string;
}

export default function ConsolidatedReports() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Fetch modules for selected project
  const { data: modules = [] } = useQuery({
    queryKey: ['modules', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/projects/${selectedProject}/modules`);
      if (!response.ok) throw new Error('Failed to fetch modules');
      return response.json();
    },
    enabled: !!selectedProject
  });

  // Fetch test cases for selected project
  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/projects/${selectedProject}/test-cases`);
      if (!response.ok) throw new Error('Failed to fetch test cases');
      return response.json();
    },
    enabled: !!selectedProject
  });

  // Fetch bugs for selected project
  const { data: bugs = [] } = useQuery({
    queryKey: ['bugs', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/projects/${selectedProject}/bugs`);
      if (!response.ok) throw new Error('Failed to fetch bugs');
      return response.json();
    },
    enabled: !!selectedProject
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, type, status }: UpdateStatusRequest) => {
      const endpoint = type === 'testcase' ? `/api/test-cases/${id}` : `/api/bugs/${id}`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error(`Failed to update ${type} status`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['testCases', selectedProject] });
      queryClient.invalidateQueries({ queryKey: ['bugs', selectedProject] });
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
    const testCaseItems: ConsolidatedItem[] = testCases.map((tc: any) => ({
      id: tc.id,
      type: 'Test Case' as const,
      moduleId: tc.moduleId,
      moduleName: modules.find((m: any) => m.id === tc.moduleId)?.name || 'Unknown',
      title: tc.feature,
      priority: tc.priority,
      status: tc.status,
      created: new Date(tc.createdAt).toLocaleDateString(),
      progress: tc.status === 'Pass' ? 100 : tc.status === 'Fail' ? 0 : 50
    }));

    const bugItems: ConsolidatedItem[] = bugs.map((bug: any) => ({
      id: bug.id,
      type: 'Bug' as const,
      moduleId: bug.moduleId,
      moduleName: modules.find((m: any) => m.id === bug.moduleId)?.name || 'Unknown',
      title: bug.title,
      priority: bug.priority,
      status: bug.status,
      created: new Date(bug.dateReported).toLocaleDateString(),
      progress: bug.status === 'Closed' ? 100 : bug.status === 'Resolved' ? 75 : bug.status === 'In Progress' ? 50 : 0
    }));

    return [...testCaseItems, ...bugItems];
  }, [testCases, bugs, modules]);

  // Filter data
  const filteredData = consolidatedData.filter(item => {
    const matchesModule = selectedModule === 'all' || item.moduleId === parseInt(selectedModule);
    const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || 
      (item.type === 'Bug' && bugs.find((b: any) => b.id === item.id)?.severity === selectedSeverity);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Consolidated Reports</h1>
          <p className="text-muted-foreground">
            {selectedProject ? projects.find((p: any) => p.id === selectedProject)?.name : 'Select a project'} - 
            Complete project overview and status management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export CSV</Button>
          <Button variant="outline">Export PDF</Button>
          <Button>Print</Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testPassRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Bugs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{openBugs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card>
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Project Items</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllItems}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
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
                <TableRow key={`${item.type}-${item.id}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'Test Case' ? 'default' : 'destructive'}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.moduleName}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant={
                      item.priority === 'High' ? 'destructive' : 
                      item.priority === 'Medium' ? 'default' : 'secondary'
                    }>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={item.status} 
                      onValueChange={(value) => handleStatusChange(item, value)}
                    >
                      <SelectTrigger className="w-32">
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
                    <div className="w-24">
                      <Progress value={item.progress} className="h-2" />
                      <span className="text-xs text-muted-foreground">{item.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.created}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">👁️</Button>
                      <Button variant="ghost" size="sm">📝</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
