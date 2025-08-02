
<old_str>import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Building,
  Star,
  Clock,
  CheckCircle,
  Grid3X3,
  List,
  Table
} from 'lucide-react';

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  skills: string[];
  status: 'Available' | 'Occupied' | 'On Leave';
  joinDate: string;
  profilePicture?: string;
  location?: string;
  projects?: EmployeeProject[];
}

interface EmployeeProject {
  id: number;
  projectId: number;
  projectName: string;
  role: string;
  allocation: number; // percentage
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'On Hold';
}

interface Project {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

const ResourceAllocationPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'list'>('card');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchProjects();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const employeesData = await response.json();
        
        // Fetch project assignments for each employee
        const employeesWithProjects = await Promise.all(
          employeesData.map(async (employee: Employee) => {
            try {
              const projectsResponse = await fetch(`/api/employee-projects?employeeId=${employee.id}`);
              if (projectsResponse.ok) {
                const projects = await projectsResponse.json();
                return { ...employee, projects };
              }
              return { ...employee, projects: [] };
            } catch (error) {
              console.error(`Error fetching projects for employee ${employee.id}:`, error);
              return { ...employee, projects: [] };
            }
          })
        );
        
        setEmployees(employeesWithProjects);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleAssignProject = async (assignment: {
    employeeId: number;
    projectId: number;
    role: string;
    allocation: number;
    startDate: string;
    endDate?: string;
  }) => {
    try {
      const response = await fetch('/api/employee-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project assigned successfully",
        });
        fetchEmployees(); // Refresh data
        setIsAssignDialogOpen(false);
      } else {
        throw new Error('Failed to assign project');
      }
    } catch (error) {
      console.error('Error assigning project:', error);
      toast({
        title: "Error",
        description: "Failed to assign project",
        variant: "destructive",
      });
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-500';
      case 'Occupied': return 'bg-orange-500';
      case 'On Leave': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateTotalAllocation = (projects: EmployeeProject[] = []) => {
    return projects
      .filter(p => p.status === 'Active')
      .reduce((total, project) => total + project.allocation, 0);
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredEmployees.map((employee) => {
        const totalAllocation = calculateTotalAllocation(employee.projects);
        const isOverAllocated = totalAllocation > 100;
        
        return (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employee.profilePicture} />
                  <AvatarFallback>
                    {employee.firstName[0]}{employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {employee.position}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(employee.status)}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Building className="h-3 w-3 mr-1" />
                  {employee.department}
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 mr-1" />
                  <span className="truncate">{employee.email}</span>
                </div>

                {employee.location && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {employee.location}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Allocation</span>
                    <span className={`text-xs font-bold ${isOverAllocated ? 'text-red-500' : 'text-green-500'}`}>
                      {totalAllocation}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isOverAllocated ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                    />
                  </div>
                </div>

                {employee.projects && employee.projects.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Active Projects</span>
                    {employee.projects
                      .filter(p => p.status === 'Active')
                      .slice(0, 2)
                      .map((project) => (
                        <div key={project.id} className="flex justify-between items-center text-xs">
                          <span className="truncate">{project.projectName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {project.allocation}%
                          </Badge>
                        </div>
                      ))}
                    {employee.projects.filter(p => p.status === 'Active').length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{employee.projects.filter(p => p.status === 'Active').length - 2} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium">Employee</th>
            <th className="text-left p-3 font-medium">Department</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Allocation</th>
            <th className="text-left p-3 font-medium">Active Projects</th>
            <th className="text-left p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee) => {
            const totalAllocation = calculateTotalAllocation(employee.projects);
            const isOverAllocated = totalAllocation > 100;
            
            return (
              <tr key={employee.id} className="border-t hover:bg-muted/25">
                <td className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.profilePicture} />
                      <AvatarFallback className="text-xs">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {employee.position}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm">{employee.department}</td>
                <td className="p-3">
                  <Badge variant="secondary" className={`${getStatusColor(employee.status)} text-white text-xs`}>
                    {employee.status}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${isOverAllocated ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isOverAllocated ? 'text-red-500' : 'text-green-500'}`}>
                      {totalAllocation}%
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="space-y-1">
                    {employee.projects
                      ?.filter(p => p.status === 'Active')
                      .slice(0, 2)
                      .map((project) => (
                        <div key={project.id} className="text-xs">
                          {project.projectName} ({project.allocation}%)
                        </div>
                      ))}
                    {employee.projects && employee.projects.filter(p => p.status === 'Active').length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{employee.projects.filter(p => p.status === 'Active').length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setIsAssignDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredEmployees.map((employee) => {
        const totalAllocation = calculateTotalAllocation(employee.projects);
        const isOverAllocated = totalAllocation > 100;
        
        return (
          <Card key={employee.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={employee.profilePicture} />
                    <AvatarFallback>
                      {employee.firstName[0]}{employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(employee.status)}`} />
                      <Badge variant="secondary" className="text-xs">
                        {employee.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {employee.position}
                      </div>
                      <div className="flex items-center">
                        <Building className="h-3 w-3 mr-1" />
                        {employee.department}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {employee.email}
                      </div>
                      {employee.location && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {employee.location}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Allocation</span>
                        <span className={`text-sm font-bold ${isOverAllocated ? 'text-red-500' : 'text-green-500'}`}>
                          {totalAllocation}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${isOverAllocated ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                        />
                      </div>
                    </div>

                    {employee.projects && employee.projects.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Active Projects</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {employee.projects
                            .filter(p => p.status === 'Active')
                            .map((project) => (
                              <div key={project.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                                <span className="text-sm truncate">{project.projectName}</span>
                                <div className="flex items-center space-x-1">
                                  <Badge variant="outline" className="text-xs">
                                    {project.role}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {project.allocation}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Assign Project
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Allocation</h1>
          <p className="text-muted-foreground">
            Manage employee project assignments and workload distribution
          </p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
                <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                <SelectItem value="DevOps">DevOps</SelectItem>
                <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                <SelectItem value="Project Management">Project Management</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none border-x"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>

        {viewMode === 'card' && renderCardView()}
        {viewMode === 'table' && renderTableView()}
        {viewMode === 'list' && renderListView()}
      </div>

      {/* Project Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Project</DialogTitle>
          </DialogHeader>
          
          {selectedEmployee && (
            <ProjectAssignmentForm
              employee={selectedEmployee}
              projects={projects}
              onAssign={handleAssignProject}
              onCancel={() => setIsAssignDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Project Assignment Form Component
const ProjectAssignmentForm: React.FC<{
  employee: Employee;
  projects: Project[];
  onAssign: (assignment: any) => void;
  onCancel: () => void;
}> = ({ employee, projects, onAssign, onCancel }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [role, setRole] = useState('');
  const [allocation, setAllocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !role || !allocation || !startDate) {
      return;
    }

    onAssign({
      employeeId: employee.id,
      projectId: parseInt(selectedProject),
      role,
      allocation: parseInt(allocation),
      startDate,
      endDate: endDate || undefined,
    });
  };

  const currentAllocation = calculateTotalAllocation(employee.projects);
  const newTotalAllocation = currentAllocation + parseInt(allocation || '0');
  const isOverAllocated = newTotalAllocation > 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Employee</Label>
        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {employee.firstName[0]}{employee.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {employee.firstName} {employee.lastName}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project">Project</Label>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g., Frontend Developer, QA Engineer"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allocation">Allocation %</Label>
        <Input
          id="allocation"
          type="number"
          min="1"
          max="100"
          value={allocation}
          onChange={(e) => setAllocation(e.target.value)}
          placeholder="e.g., 50"
          required
        />
        {allocation && (
          <div className="text-xs">
            <span className="text-muted-foreground">Current: {currentAllocation}%</span>
            <span className={`ml-2 ${isOverAllocated ? 'text-red-500' : 'text-green-500'}`}>
              New Total: {newTotalAllocation}%
            </span>
            {isOverAllocated && (
              <span className="block text-red-500">⚠️ This will over-allocate the employee</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Assign Project
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ResourceAllocationPage;</old_str>
<new_str>import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Building,
  Star,
  Clock,
  CheckCircle,
  Grid3X3,
  List,
  Table
} from 'lucide-react';

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  skills: string[];
  status: 'Available' | 'Occupied' | 'On Leave';
  joinDate: string;
  profilePicture?: string;
  location?: string;
  projects?: EmployeeProject[];
}

interface EmployeeProject {
  id: number;
  projectId: number;
  projectName: string;
  role: string;
  allocation: number; // percentage
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'On Hold';
}

interface Project {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

const ResourceAllocationPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'list'>('card');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchProjects();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const employeesData = await response.json();
        
        // Fetch project assignments for each employee
        const employeesWithProjects = await Promise.all(
          employeesData.map(async (employee: Employee) => {
            try {
              const projectsResponse = await fetch(`/api/employee-projects?employeeId=${employee.id}`);
              if (projectsResponse.ok) {
                const projects = await projectsResponse.json();
                return { ...employee, projects };
              }
              return { ...employee, projects: [] };
            } catch (error) {
              console.error(`Error fetching projects for employee ${employee.id}:`, error);
              return { ...employee, projects: [] };
            }
          })
        );
        
        setEmployees(employeesWithProjects);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleAssignProject = async (assignment: {
    employeeId: number;
    projectId: number;
    role: string;
    allocation: number;
    startDate: string;
    endDate?: string;
  }) => {
    try {
      const response = await fetch('/api/employee-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project assigned successfully",
        });
        fetchEmployees(); // Refresh data
        setIsAssignDialogOpen(false);
      } else {
        throw new Error('Failed to assign project');
      }
    } catch (error) {
      console.error('Error assigning project:', error);
      toast({
        title: "Error",
        description: "Failed to assign project",
        variant: "destructive",
      });
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-500';
      case 'Occupied': return 'bg-orange-500';
      case 'On Leave': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateTotalAllocation = (projects: EmployeeProject[] = []) => {
    return projects
      .filter(p => p.status === 'Active')
      .reduce((total, project) => total + project.allocation, 0);
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredEmployees.map((employee) => {
        const totalAllocation = calculateTotalAllocation(employee.projects);
        const isOverAllocated = totalAllocation > 100;
        
        return (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employee.profilePicture} />
                  <AvatarFallback>
                    {employee.firstName[0]}{employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {employee.position}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(employee.status)}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Building className="h-3 w-3 mr-1" />
                  {employee.department}
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 mr-1" />
                  <span className="truncate">{employee.email}</span>
                </div>

                {employee.location && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {employee.location}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Allocation</span>
                    <span className={`text-xs font-bold ${isOverAllocated ? 'text-red-500' : 'text-green-500'}`}>
                      {totalAllocation}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isOverAllocated ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                    />
                  </div>
                </div>

                {employee.projects && employee.projects.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Active Projects</span>
                    {employee.projects
                      .filter(p => p.status === 'Active')
                      .slice(0, 2)
                      .map((project) => (
                        <div key={project.id} className="flex justify-between items-center text-xs">
                          <span className="truncate">{project.projectName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {project.allocation}%
                          </Badge>
                        </div>
                      ))}
                    {employee.projects.filter(p => p.status === 'Active').length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{employee.projects.filter(p => p.status === 'Active').length - 2} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium">Employee</th>
            <th className="text-left p-3 font-medium">Department</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Allocation</th>
            <th className="text-left p-3 font-medium">Active Projects</th>
            <th className="text-left p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee) => {
            const totalAllocation = calculateTotalAllocation(employee.projects);
            const isOverAllocated = totalAllocation > 100;
            
            return (
              <tr key={employee.id} className="border-t hover:bg-muted/25">
                <td className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.profilePicture} />
                      <AvatarFallback className="text-xs">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {employee.position}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm">{employee.department}</td>
                <td className="p-3">
                  <Badge variant="secondary" className={`${getStatusColor(employee.status)} text-white text-xs`}>
                    {employee.status}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${isOverAllocated ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isOverAllocated ? 'text-red-500' : 'text-green-500'}`}>
                      {totalAllocation}%
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="space-y-1">
                    {employee.projects
                      ?.filter(p => p.status === 'Active')
                      .slice(0, 2)
                      .map((project) => (
                        <div key={project.id} className="text-xs">
                          {project.projectName} ({project.allocation}%)
                        </div>
                      ))}
                    {employee.projects && employee.projects.filter(p => p.status === 'Active').length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{employee.projects.filter(p => p.status === 'Active').length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setIsAssignDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredEmployees.map((employee) => {
        const totalAllocation = calculateTotalAllocation(employee.projects);
        const isOverAllocated = totalAllocation > 100;
        
        return (
          <Card key={employee.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={employee.profilePicture} />
                    <AvatarFallback>
                      {employee.firstName[0]}{employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(employee.status)}`} />
                      <Badge variant="secondary" className="text-xs">
                        {employee.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {employee.position}
                      </div>
                      <div className="flex items-center">
                        <Building className="h-3 w-3 mr-1" />
                        {employee.department}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {employee.email}
                      </div>
                      {employee.location && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {employee.location}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Allocation</span>
                        <span className={`text-sm font-bold ${isOverAllocated ? 'text-red-500' : 'text-green-500'}`}>
                          {totalAllocation}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${isOverAllocated ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                        />
                      </div>
                    </div>

                    {employee.projects && employee.projects.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Active Projects</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {employee.projects
                            .filter(p => p.status === 'Active')
                            .map((project) => (
                              <div key={project.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                                <span className="text-sm truncate">{project.projectName}</span>
                                <div className="flex items-center space-x-1">
                                  <Badge variant="outline" className="text-xs">
                                    {project.role}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {project.allocation}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Assign Project
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Allocation</h1>
          <p className="text-muted-foreground">
            Manage employee project assignments and workload distribution
          </p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
                <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                <SelectItem value="DevOps">DevOps</SelectItem>
                <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                <SelectItem value="Project Management">Project Management</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none border-x"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>

        {viewMode === 'card' && renderCardView()}
        {viewMode === 'table' && renderTableView()}
        {viewMode === 'list' && renderListView()}
      </div>

      {/* Project Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Project</DialogTitle>
          </DialogHeader>
          
          {selectedEmployee && (
            <ProjectAssignmentForm
              employee={selectedEmployee}
              projects={projects}
              onAssign={handleAssignProject}
              onCancel={() => setIsAssignDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Project Assignment Form Component
const ProjectAssignmentForm: React.FC<{
  employee: Employee;
  projects: Project[];
  onAssign: (assignment: any) => void;
  onCancel: () => void;
}> = ({ employee, projects, onAssign, onCancel }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [role, setRole] = useState('');
  const [allocation, setAllocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !role || !allocation || !startDate) {
      return;
    }

    onAssign({
      employeeId: employee.id,
      projectId: parseInt(selectedProject),
      role,
      allocation: parseInt(allocation),
      startDate,
      endDate: endDate || undefined,
    });
  };

  const calculateTotalAllocation = (projects: EmployeeProject[] = []) => {
    return projects
      .filter(p => p.status === 'Active')
      .reduce((total, project) => total + project.allocation, 0);
  };

  const currentAllocation = calculateTotalAllocation(employee.projects);
  const newTotalAllocation = currentAllocation + parseInt(allocation || '0');
  const isOverAllocated = newTotalAllocation > 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Employee</Label>
        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {employee.firstName[0]}{employee.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {employee.firstName} {employee.lastName}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project">Project</Label>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g., Frontend Developer, QA Engineer"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allocation">Allocation %</Label>
        <Input
          id="allocation"
          type="number"
          min="1"
          max="100"
          value={allocation}
          onChange={(e) => setAllocation(e.target.value)}
          placeholder="e.g., 50"
          required
        />
        {allocation && (
          <div className="text-xs">
            <span className="text-muted-foreground">Current: {currentAllocation}%</span>
            <span className={`ml-2 ${isOverAllocated ? 'text-red-500' : 'text-green-500'}`}>
              New Total: {newTotalAllocation}%
            </span>
            {isOverAllocated && (
              <span className="block text-red-500">⚠️ This will over-allocate the employee</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Assign Project
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ResourceAllocationPage;</new_str>
