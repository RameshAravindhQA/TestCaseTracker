import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Activity,
  Calendar,
  Target,
  Award,
  Clock,
  AlertCircle,
  PlusCircle,
  X
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface AnalyticsData {
  users: any[];
  projects: any[];
  testCases: any[];
  bugs: any[];
}

interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalTestCases: number;
  totalBugs: number;
  openBugs: number;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
}

interface Project {
  id: number;
  name: string;
  projectName: string;
  status: string;
}

// Error Boundary Component
class AnalyticsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Analytics Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              The analytics dashboard encountered an error. Please refresh the page or try again later.
              <br />
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AnalyticsDashboard() {
  console.log('🔍 Analytics Dashboard - Component rendering started');

  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isAssigningProject, setIsAssigningProject] = React.useState<Employee | null>(null);

  // Early return with loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading analytics...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Early return for unauthenticated users
  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Alert className="w-96">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please log in to view analytics dashboard.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  console.log('🔍 Analytics Dashboard - Auth state:', {
    user: user ? { id: user.id, email: user.email, role: user.role } : null,
    authLoading
  });

  // Fetch users with detailed error handling
  const { 
    data: employees = [], 
    isLoading: isEmployeesLoading, 
    error: employeesError,
    refetch: refetchEmployees 
  } = useQuery<Employee[], Error>({
    queryKey: ["analytics-users"],
    queryFn: async () => {
      console.log('🔍 Analytics - Fetching users...');
      try {
        const res = await apiRequest("GET", "/api/users");
        console.log('🔍 Analytics - Users API response status:', res.status);

        if (!res.ok) {
          throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('🔍 Analytics - Fetched users:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('🔍 Analytics - Error fetching users:', error);
        throw error; // Re-throw to be caught by the query error handler
      }
    },
    retry: 2,
    staleTime: 30000,
    enabled: !!user && !authLoading,
  });

  // Fetch projects
  const { 
    data: allProjects = [], 
    isLoading: isProjectsLoading, 
    error: projectsError,
    refetch: refetchProjects 
  } = useQuery<Project[], Error>({
    queryKey: ["analytics-projects"],
    queryFn: async () => {
      console.log('🔍 Analytics - Fetching projects...');
      try {
        const res = await apiRequest("GET", "/api/projects");
        console.log('🔍 Analytics - Projects API response status:', res.status);

        if (!res.ok) {
          throw new Error(`Failed to fetch projects: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('🔍 Analytics - Fetched projects:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('🔍 Analytics - Error fetching projects:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 30000,
    enabled: !!user && !authLoading,
  });

  // Fetch test cases
  const { 
    data: testCases = [], 
    isLoading: isTestCasesLoading, 
    error: testCasesError,
    refetch: refetchTestCases 
  } = useQuery({
    queryKey: ["analytics-test-cases"],
    queryFn: async () => {
      console.log('🔍 Analytics - Fetching test cases...');
      try {
        const res = await apiRequest("GET", "/api/test-cases");
        console.log('🔍 Analytics - Test cases API response status:', res.status);

        if (!res.ok) {
          throw new Error(`Failed to fetch test cases: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('🔍 Analytics - Fetched test cases:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('🔍 Analytics - Error fetching test cases:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 30000,
    enabled: !!user && !authLoading,
  });

  // Fetch bugs
  const { 
    data: bugs = [], 
    isLoading: isBugsLoading, 
    error: bugsError,
    refetch: refetchBugs 
  } = useQuery({
    queryKey: ["analytics-bugs"],
    queryFn: async () => {
      console.log('🔍 Analytics - Fetching bugs...');
      try {
        const res = await apiRequest("GET", "/api/bugs");
        console.log('🔍 Analytics - Bugs API response status:', res.status);

        if (!res.ok) {
          throw new Error(`Failed to fetch bugs: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('🔍 Analytics - Fetched bugs:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('🔍 Analytics - Error fetching bugs:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 30000,
    enabled: !!user && !authLoading,
  });

  // Fetch project assignments for current employee allocation calculations
  const { data: projectAssignments = [] } = useQuery({
    queryKey: ["project-assignments"],
    queryFn: async () => {
      console.log('🔍 Analytics - Fetching project assignments...');
      try {
        const res = await apiRequest("GET", "/api/project-assignments");
        if (!res.ok) {
          throw new Error(`Failed to fetch project assignments: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('🔍 Analytics - Fetched project assignments:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('🔍 Analytics - Error fetching project assignments:', error);
        return [];
      }
    },
    enabled: !!user && !authLoading,
  });

  // Mutation for assigning a project
  const assignProjectMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      console.log('🔍 Analytics - Assigning project:', assignmentData);
      const res = await apiRequest('POST', '/api/project-assignments', assignmentData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to assign project: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      console.log('🔍 Analytics - Project assignment successful');
      queryClient.invalidateQueries({ queryKey: ["project-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-users"] }); // Invalidate users to potentially update allocation summaries if added
      setIsAssigningProject(null); // Close the form
    },
    onError: (error: any) => {
      console.error('🔍 Analytics - Project assignment failed:', error);
      // Optionally show an error message to the user
    },
  });

  // Calculate statistics safely
  const stats: DashboardStats = React.useMemo(() => {
    const totalUsers = employees?.length || 0;
    const totalProjects = allProjects?.length || 0;
    const activeProjects = allProjects?.filter((p: any) => p?.status === 'Active')?.length || 0;
    const totalTestCases = testCases?.length || 0;
    const totalBugs = bugs?.length || 0;
    const openBugs = bugs?.filter((bug: any) => bug?.status === 'Open')?.length || 0;

    console.log('🔍 Analytics - Calculated stats:', {
      totalUsers,
      totalProjects,
      activeProjects,
      totalTestCases,
      totalBugs,
      openBugs
    });

    return {
      totalUsers,
      totalProjects,
      activeProjects,
      totalTestCases,
      totalBugs,
      openBugs
    };
  }, [employees, allProjects, testCases, bugs]);

  // Role distribution calculation
  const roleChartData = React.useMemo(() => {
    if (!employees || employees.length === 0) return [];

    const roleData = employees.reduce((acc: any, user: any) => {
      const role = user?.role || 'Unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(roleData).map(([name, value]) => ({
      name,
      value,
      percentage: stats.totalUsers > 0 ? ((value as number) / stats.totalUsers * 100).toFixed(1) : '0'
    }));
  }, [employees, stats.totalUsers]);

  // Bug status distribution
  const statusChartData = React.useMemo(() => {
    if (!bugs || bugs.length === 0) return [];

    const bugStatusData = bugs.reduce((acc: any, bug: any) => {
      const status = bug?.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(bugStatusData).map(([name, value]) => ({
      name,
      value
    }));
  }, [bugs]);

  // Project distribution
  const projectTestCaseData = React.useMemo(() => {
    if (!allProjects || allProjects.length === 0) return [];

    return allProjects.map((project: any) => {
      const projectTestCases = testCases?.filter((tc: any) => tc?.projectId === project?.id) || [];
      const projectBugs = bugs?.filter((bug: any) => bug?.projectId === project?.id) || [];

      return {
        name: project?.name && project.name.length > 15 
          ? project.name.substring(0, 15) + '...' 
          : project?.name || 'Unnamed Project',
        testCases: projectTestCases.length,
        bugs: projectBugs.length
      };
    });
  }, [allProjects, testCases, bugs]);

  console.log('🔍 Analytics - Computed chart data:', {
    roleChartData: roleChartData.length,
    statusChartData: statusChartData.length,
    projectTestCaseData: projectTestCaseData.length
  });

  // Error handling for any errors
  const hasErrors = employeesError || projectsError || testCasesError || bugsError;
  const isAnyLoading = isEmployeesLoading || isProjectsLoading || isTestCasesLoading || isBugsLoading;

  console.log('🔍 Analytics - Loading and error states:', {
    authLoading,
    isEmployeesLoading,
    isProjectsLoading,
    isTestCasesLoading,
    isBugsLoading,
    isAnyLoading,
    hasErrors: !!hasErrors,
    employeesError: employeesError?.message,
    projectsError: projectsError?.message,
    testCasesError: testCasesError?.message,
    bugsError: bugsError?.message
  });

  // Main render - always show the layout and content
  return (
    <AnalyticsErrorBoundary>
      <MainLayout>
        <div className="space-y-6 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Comprehensive insights into system usage and project status
              </p>
            </div>
            {hasErrors && (
              <Button 
                variant="outline" 
                onClick={() => {
                  refetchEmployees();
                  refetchProjects();
                  refetchTestCases();
                  refetchBugs();
                }}
              >
                Retry
              </Button>
            )}
          </div>

          {/* Handle API errors */}
          {hasErrors && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Data Loading Issues</AlertTitle>
              <AlertDescription>
                Some data could not be loaded. The dashboard will show available information.
                <br />
                <span className="text-sm text-muted-foreground">
                  {employeesError && `Users: ${employeesError.message}. `}
                  {projectsError && `Projects: ${projectsError.message}. `}
                  {testCasesError && `Test Cases: ${testCasesError.message}. `}
                  {bugsError && `Bugs: ${bugsError.message}.`}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Main content */}
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Registered users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProjects}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeProjects} active projects
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTestCases}</div>
                    <p className="text-xs text-muted-foreground">
                      Total test cases
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Bugs</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{stats.openBugs}</div>
                    <p className="text-xs text-muted-foreground">
                      Out of {stats.totalBugs} total bugs
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Role Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution by Role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {roleChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={roleChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percentage }) => `${name}: ${percentage}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {roleChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No user data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bug Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Bug Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {statusChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statusChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No bug data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Distribution */}
              {projectTestCaseData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Project Test Case & Bug Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectTestCaseData.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="testCases" fill="#6BCF7F" name="Test Cases" />
                          <Bar dataKey="bugs" fill="#FF6B6B" name="Bugs" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Employee Project Allocation Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">Project Allocations</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setIsAssigningProject(null)}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Allocation
                  </Button>
                </CardHeader>
                <CardContent>
                  {isAssigningProject && (
                    <div className="mb-4 p-4 border border-muted rounded-md">
                      <ProjectAssignmentForm
                        employee={isAssigningProject}
                        projects={allProjects}
                        onAssign={(assignment) => assignProjectMutation.mutate(assignment)}
                        onCancel={() => setIsAssigningProject(null)}
                        employeeProjects={projectAssignments.filter(pa => pa.employeeId === isAssigningProject.id)}
                      />
                    </div>
                  )}
                  <ScrollArea className="h-[300px] w-full">
                    {employees.length > 0 ? (
                      employees.map((emp) => {
                        const employeeAssignments = projectAssignments.filter(pa => pa.employeeId === emp.id && pa.isActive);
                        const totalAllocation = employeeAssignments.reduce((sum, assignment) => sum + (assignment.allocation || 0), 0);

                        return (
                          <div key={emp.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={emp.profilePictureUrl || ''} alt={emp.firstName} />
                                <AvatarFallback className="text-lg">
                                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                                <p className="text-sm text-muted-foreground">{emp.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{totalAllocation}% Allocated</p>
                              <p className="text-xs text-muted-foreground">{employeeAssignments.length} active projects</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsAssigningProject(emp)}
                              disabled={assignProjectMutation.isPending}
                            >
                              Manage Projects
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No employee data available to show allocations.</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Data Loading States */}
              {isAnyLoading && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Loading analytics data...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Debug Information (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-sm">Debug Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs space-y-1">
                      <p>Auth User: {user ? `${user.email} (${user.role})` : 'None'}</p>
                      <p>Users: {employees.length} loaded, {isEmployeesLoading ? 'Loading...' : (employeesError ? 'Error' : 'Ready')}</p>
                      <p>Projects: {allProjects.length} loaded, {isProjectsLoading ? 'Loading...' : (projectsError ? 'Error' : 'Ready')}</p>
                      <p>Test Cases: {testCases.length} loaded, {isTestCasesLoading ? 'Loading...' : (testCasesError ? 'Error' : 'Ready')}</p>
                      <p>Bugs: {bugs.length} loaded, {isBugsLoading ? 'Loading...' : (bugsError ? 'Error' : 'Ready')}</p>
                      <p>Project Assignments: {projectAssignments.length} loaded, {assignProjectMutation.isPending ? 'Saving...' : 'Ready'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </MainLayout>
    </AnalyticsErrorBoundary>
  );
}

// Project Assignment Form Component
const ProjectAssignmentForm: React.FC<{
  employee: Employee;
  projects: Project[];
  onAssign: (assignment: any) => void;
  onCancel: () => void;
  employeeProjects: any[];
}> = ({ employee, projects, onAssign, onCancel, employeeProjects }) => {
  const [selectedProject, setSelectedProject] = React.useState('');
  const [role, setRole] = React.useState('');
  const [allocation, setAllocation] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject || !role || !allocation || !startDate) {
      return;
    }

    onAssign({
      employeeId: employee.id,
      projectId: parseInt(selectedProject),
      projectType: 'regular', // Assuming 'regular' for now, adjust if needed
      role,
      allocation: parseInt(allocation),
      startDate,
      endDate: endDate || undefined, // Send undefined if no end date
      status: 'active', // Default status
      isActive: true // Default active status
    });
  };

  const calculateCurrentAllocation = (employeeId: number) => {
    // Filter assignments for the specific employee that are active and not completed
    const employeeProjectsData = employeeProjects.filter((ep: any) => ep.employeeId === employeeId && ep.isActive);
    return employeeProjectsData
      .filter((p: any) => p.status !== 'Completed')
      .reduce((total: number, project: any) => total + (project.allocation || 0), 0);
  };

  const currentAllocation = calculateCurrentAllocation(employee.id);
  const newTotalAllocation = currentAllocation + parseInt(allocation || '0');
  const isOverAllocated = newTotalAllocation > 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Employee</Label>
        <div className="flex items-center space-x-2 p-2 bg-muted rounded">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {employee.firstName?.[0]}{employee.lastName?.[0]}
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
                {project.name || project.projectName}
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
        <Button type="submit" className="flex-1" disabled={isOverAllocated || !selectedProject || !role || !allocation || !startDate}>
          Assign Project
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};