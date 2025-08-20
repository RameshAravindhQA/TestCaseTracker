import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
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
  Clock
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsDashboard() {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch users
  const { data: employees = [], isLoading: isEmployeesLoading, error: employeesError } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/users");
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
        const data = await res.json();
        console.log('Analytics - Fetched users:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Analytics - Error fetching users:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Fetch projects
  const { data: allProjects = [], isLoading: isProjectsLoading, error: projectsError } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/projects");
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
        const data = await res.json();
        console.log('Analytics - Fetched projects:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Analytics - Error fetching projects:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
    enabled: !!user,
  });

  // Fetch test cases
  const { data: testCases = [], isLoading: isTestCasesLoading, error: testCasesError } = useQuery({
    queryKey: ["test-cases"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/test-cases");
        if (!res.ok) throw new Error(`Failed to fetch test cases: ${res.status}`);
        const data = await res.json();
        console.log('Analytics - Fetched test cases:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Analytics - Error fetching test cases:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
    enabled: !!user,
  });

  // Fetch bugs
  const { data: bugs = [], isLoading: isBugsLoading, error: bugsError } = useQuery({
    queryKey: ["bugs"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/bugs");
        if (!res.ok) throw new Error(`Failed to fetch bugs: ${res.status}`);
        const data = await res.json();
        console.log('Analytics - Fetched bugs:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Analytics - Error fetching bugs:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
    enabled: !!user,
  });

  // Calculate statistics
  const totalUsers = employees.length;
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter((p: any) => p?.status === 'Active').length;
  const totalTestCases = testCases.length;
  const totalBugs = bugs.length;
  const openBugs = bugs.filter((bug: any) => bug?.status === 'Open').length;

  // Role distribution
  const roleData = employees.reduce((acc: any, user: any) => {
    const role = user?.role || 'Unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const roleChartData = Object.entries(roleData).map(([name, value]) => ({
    name,
    value,
    percentage: totalUsers > 0 ? ((value as number) / totalUsers * 100).toFixed(1) : '0'
  }));

  // Bug status distribution
  const bugStatusData = bugs.reduce((acc: any, bug: any) => {
    const status = bug?.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(bugStatusData).map(([name, value]) => ({
    name,
    value
  }));

  // Project distribution
  const projectTestCaseData = allProjects.map((project: any) => {
    const projectTestCases = testCases.filter((tc: any) => tc?.projectId === project?.id);
    const projectBugs = bugs.filter((bug: any) => bug?.projectId === project?.id);
    return {
      name: project?.name && project.name.length > 15 ? project.name.substring(0, 15) + '...' : project?.name || 'Unnamed Project',
      testCases: projectTestCases.length,
      bugs: projectBugs.length
    };
  });

  // Test case status data
  const testCaseStatusData = testCases.reduce((acc: any, tc: any) => {
    const status = tc?.status || 'Not Tested';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const testCaseWorkloadData = Object.entries(testCaseStatusData).map(([name, value]) => ({
    name,
    value,
    percentage: totalTestCases > 0 ? ((value as number) / totalTestCases * 100).toFixed(1) : '0'
  })).sort((a, b) => b.value - a.value);

  // Always render the layout, handle loading and auth states inside
  return (
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
        </div>

        {/* Handle authentication loading */}
        {authLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-lg">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Handle not authenticated */}
        {!authLoading && !user && (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Please log in to view analytics dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main content when authenticated */}
        {!authLoading && user && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
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
                  <div className="text-2xl font-bold">{totalProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeProjects} active projects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTestCases}</div>
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
                  <div className="text-2xl font-bold text-red-500">{openBugs}</div>
                  <p className="text-xs text-muted-foreground">
                    Out of {totalBugs} total bugs
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

            {/* Data Loading States */}
            {(isEmployeesLoading || isProjectsLoading || isTestCasesLoading || isBugsLoading) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Loading analytics data...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}