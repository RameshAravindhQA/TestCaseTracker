
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid, List, Users, Plus, Filter, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  technologies: string[];
  status: 'Available' | 'Occupied' | 'Busy';
  avatar?: string;
}

interface Project {
  id: number;
  name: string;
  status: string;
  description?: string;
}

interface EmployeeProject {
  id: number;
  employeeId: number;
  projectId: number;
  role: string;
  allocation: number; // percentage
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'On Hold';
}

interface ResourceAllocation {
  employee: Employee;
  projects: Array<{
    project: Project;
    allocation: EmployeeProject;
  }>;
  totalAllocation: number;
}

const ResourceAllocationPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'list'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    projectId: '',
    role: '',
    allocation: 50,
    startDate: '',
    endDate: ''
  });

  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async (): Promise<Employee[]> => {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    }
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Fetch employee projects
  const { data: employeeProjects = [] } = useQuery({
    queryKey: ['employee-projects'],
    queryFn: async (): Promise<EmployeeProject[]> => {
      const response = await fetch('/api/employee-projects');
      if (!response.ok) throw new Error('Failed to fetch employee projects');
      return response.json();
    }
  });

  // Fetch departments and technologies
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await fetch('/api/department-options');
      if (!response.ok) throw new Error('Failed to fetch departments');
      return response.json();
    }
  });

  // Assign employee to project mutation
  const assignEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/employee-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to assign employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-projects'] });
      toast({ title: 'Success', description: 'Employee assigned to project successfully!' });
      setIsAssignDialogOpen(false);
      setAssignmentForm({
        projectId: '',
        role: '',
        allocation: 50,
        startDate: '',
        endDate: ''
      });
    },
    onError: () => {
      toast({ 
        title: 'Error', 
        description: 'Failed to assign employee to project',
        variant: 'destructive'
      });
    }
  });

  // Process resource allocation data
  const resourceAllocations: ResourceAllocation[] = employees.map(employee => {
    const empProjects = employeeProjects
      .filter(ep => ep.employeeId === employee.id)
      .map(ep => ({
        project: projects.find(p => p.id === ep.projectId)!,
        allocation: ep
      }))
      .filter(item => item.project);

    const totalAllocation = empProjects.reduce((sum, item) => sum + item.allocation.allocation, 0);

    return {
      employee,
      projects: empProjects,
      totalAllocation
    };
  });

  // Filter allocations
  const filteredAllocations = resourceAllocations.filter(allocation => {
    const employee = allocation.employee;
    const matchesSearch = searchTerm === '' || 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === '' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === '' || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Occupied': return 'bg-yellow-100 text-yellow-800';
      case 'Busy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAllocationColor = (allocation: number) => {
    if (allocation <= 50) return 'bg-green-500';
    if (allocation <= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleAssign = () => {
    if (!selectedEmployee || !assignmentForm.projectId || !assignmentForm.role) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    assignEmployeeMutation.mutate({
      employeeId: selectedEmployee.id,
      projectId: parseInt(assignmentForm.projectId),
      role: assignmentForm.role,
      allocation: assignmentForm.allocation,
      startDate: assignmentForm.startDate,
      endDate: assignmentForm.endDate || null,
      status: 'Active'
    });
  };

  // Card View Component
  const CardView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredAllocations.map(allocation => (
        <Card key={allocation.employee.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={allocation.employee.avatar} />
                <AvatarFallback>
                  {allocation.employee.firstName[0]}{allocation.employee.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-sm font-medium">
                  {allocation.employee.firstName} {allocation.employee.lastName}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{allocation.employee.employeeId}</p>
              </div>
              <Badge className={getStatusColor(allocation.employee.status)}>
                {allocation.employee.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Department</p>
                <p className="text-xs text-muted-foreground">{allocation.employee.department}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Technologies</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {allocation.employee.technologies?.slice(0, 3).map(tech => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {allocation.employee.technologies?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{allocation.employee.technologies.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Allocation</p>
                  <span className="text-sm font-medium">{allocation.totalAllocation}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getAllocationColor(allocation.totalAllocation)}`}
                    style={{ width: `${Math.min(allocation.totalAllocation, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Current Projects ({allocation.projects.length})</p>
                <div className="space-y-1">
                  {allocation.projects.slice(0, 2).map(item => (
                    <div key={item.project.id} className="text-xs p-2 bg-gray-50 rounded">
                      <p className="font-medium">{item.project.name}</p>
                      <p className="text-muted-foreground">{item.allocation.role} - {item.allocation.allocation}%</p>
                    </div>
                  ))}
                  {allocation.projects.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{allocation.projects.length - 2} more projects</p>
                  )}
                </div>
              </div>

              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setSelectedEmployee(allocation.employee);
                  setIsAssignDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Table View Component
  const TableView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Technologies</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAllocations.map(allocation => (
              <TableRow key={allocation.employee.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={allocation.employee.avatar} />
                      <AvatarFallback className="text-xs">
                        {allocation.employee.firstName[0]}{allocation.employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{allocation.employee.firstName} {allocation.employee.lastName}</p>
                      <p className="text-sm text-muted-foreground">{allocation.employee.employeeId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{allocation.employee.department}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {allocation.employee.technologies?.slice(0, 2).map(tech => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {allocation.employee.technologies?.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{allocation.employee.technologies.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(allocation.employee.status)}>
                    {allocation.employee.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getAllocationColor(allocation.totalAllocation)}`}
                        style={{ width: `${Math.min(allocation.totalAllocation, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm">{allocation.totalAllocation}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {allocation.projects.slice(0, 2).map(item => (
                      <div key={item.project.id} className="text-xs">
                        <span className="font-medium">{item.project.name}</span>
                        <span className="text-muted-foreground"> ({item.allocation.allocation}%)</span>
                      </div>
                    ))}
                    {allocation.projects.length > 2 && (
                      <p className="text-xs text-muted-foreground">+{allocation.projects.length - 2} more</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedEmployee(allocation.employee);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // List View Component
  const ListView = () => (
    <div className="space-y-4">
      {filteredAllocations.map(allocation => (
        <Card key={allocation.employee.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={allocation.employee.avatar} />
                  <AvatarFallback>
                    {allocation.employee.firstName[0]}{allocation.employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{allocation.employee.firstName} {allocation.employee.lastName}</h3>
                    <Badge className={getStatusColor(allocation.employee.status)}>
                      {allocation.employee.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">ID</p>
                      <p className="font-medium">{allocation.employee.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{allocation.employee.department}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Allocation</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getAllocationColor(allocation.totalAllocation)}`}
                            style={{ width: `${Math.min(allocation.totalAllocation, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium">{allocation.totalAllocation}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Projects</p>
                      <p className="font-medium">{allocation.projects.length} active</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">Technologies</p>
                    <div className="flex flex-wrap gap-1">
                      {allocation.employee.technologies?.map(tech => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {allocation.projects.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Current Projects</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {allocation.projects.map(item => (
                          <div key={item.project.id} className="text-xs p-2 bg-gray-50 rounded">
                            <p className="font-medium">{item.project.name}</p>
                            <p className="text-muted-foreground">{item.allocation.role} - {item.allocation.allocation}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                size="sm"
                onClick={() => {
                  setSelectedEmployee(allocation.employee);
                  setIsAssignDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (employeesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resource Allocation Dashboard</h1>
        <p className="text-muted-foreground">
          Manage employees in project-based resource allocation, skills, and availability
        </p>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Occupied">Occupied</SelectItem>
                  <SelectItem value="Busy">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Users className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAllocations.length} of {resourceAllocations.length} employees
        </p>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'card' && <CardView />}
      {viewMode === 'table' && <TableView />}
      {viewMode === 'list' && <ListView />}

      {/* Assign Project Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Assign Project to {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Project</Label>
              <Select value={assignmentForm.projectId} onValueChange={(value) => 
                setAssignmentForm(prev => ({ ...prev, projectId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={assignmentForm.role}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Frontend Developer, QA Engineer"
              />
            </div>

            <div>
              <Label htmlFor="allocation">Allocation Percentage</Label>
              <Input
                id="allocation"
                type="number"
                min="1"
                max="100"
                value={assignmentForm.allocation}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, allocation: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={assignmentForm.startDate}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={assignmentForm.endDate}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={assignEmployeeMutation.isPending}>
                {assignEmployeeMutation.isPending ? 'Assigning...' : 'Assign Project'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourceAllocationPage;
