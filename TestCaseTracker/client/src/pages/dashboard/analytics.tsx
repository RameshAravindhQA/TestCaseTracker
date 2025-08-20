
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
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
  const [, navigate] = useLocation();

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Analytics: User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate]);

  // Don't render anything if not authenticated
  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Checking authentication...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null; // This will be handled by the useEffect redirect
  }

  // Fetch users (instead of employees)
  const { data: employees = [], isLoading: isEmployeesLoading, error: employeesError } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/users");
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
        const data = await res.json();
        console.log('Fetched users:', data);
        return data;
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  // Fetch projects
  const { data: allProjects = [], isLoading: isProjectsLoading, error: projectsError } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/projects");
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
        const data = await res.json();
        console.log('Fetched projects:', data);
        return data;
      } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  // Fetch test cases for analytics
  const { data: testCases = [], isLoading: isTestCasesLoading, error: testCasesError } = useQuery({
    queryKey: ["test-cases"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/test-cases");
        if (!res.ok) throw new Error(`Failed to fetch test cases: ${res.status}`);
        const data = await res.json();
        console.log('Fetched test cases:', data);
        return data;
      } catch (error) {
        console.error('Error fetching test cases:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  // Fetch bugs for analytics
  const { data: bugs = [], isLoading: isBugsLoading, error: bugsError } = useQuery({
    queryKey: ["bugs"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/bugs");
        if (!res.ok) throw new Error(`Failed to fetch bugs: ${res.status}`);
        const data = await res.json();
        console.log('Fetched bugs:', data);
        return data;
      } catch (error) {
        console.error('Error fetching bugs:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  const isLoading = isEmployeesLoading || isProjectsLoading || isTestCasesLoading || isBugsLoading;
  const hasErrors = employeesError || projectsError || testCasesError || bugsError;

  // Calculate statistics with fallbacks
  const totalUsers = Array.isArray(employees) ? employees.length : 0;
  const totalProjects = Array.isArray(allProjects) ? allProjects.length : 0;
  const activeProjects = Array.isArray(allProjects) ? allProjects.filter((p: any) => p?.status === 'Active').length : 0;
  const totalTestCases = Array.isArray(testCases) ? testCases.length : 0;
  const totalBugs = Array.isArray(bugs) ? bugs.length : 0;
  
  // Role distribution (instead of department)
  const roleData = Array.isArray(employees) ? employees.reduce((acc: any, user: any) => {
    const role = user?.role || 'Unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {}) : { 'No Data': 1 };

  const roleChartData = Object.entries(roleData).map(([name, value]) => ({
    name,
    value,
    percentage: totalUsers > 0 ? ((value as number) / totalUsers * 100).toFixed(1) : '0'
  }));

  // Bug status distribution
  const bugStatusData = Array.isArray(bugs) && bugs.length > 0 ? bugs.reduce((acc: any, bug: any) => {
    const status = bug?.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) : { 'No Data': 1 };

  const statusChartData = Object.entries(bugStatusData).map(([name, value]) => ({
    name,
    value
  }));

  // Project test case distribution
  const projectTestCaseData = Array.isArray(allProjects) && allProjects.length > 0 ? allProjects.map((project: any) => {
    const projectTestCases = Array.isArray(testCases) ? testCases.filter(
      (tc: any) => tc?.projectId === project?.id
    ) : [];
    const projectBugs = Array.isArray(bugs) ? bugs.filter(
      (bug: any) => bug?.projectId === project?.id
    ) : [];
    return {
      name: project?.name && project.name.length > 15 ? project.name.substring(0, 15) + '...' : project?.name || 'Unnamed Project',
      testCases: projectTestCases.length,
      bugs: projectBugs.length
    };
  }) : [{ name: 'No Projects', testCases: 0, bugs: 0 }];

  // Test case status data
  const testCaseStatusData = Array.isArray(testCases) && testCases.length > 0 ? testCases.reduce((acc: any, tc: any) => {
    const status = tc?.status || 'Not Tested';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) : { 'No Data': 1 };

  const testCaseWorkloadData = Object.entries(testCaseStatusData).map(([name, value]) => ({
    name,
    value,
    percentage: totalTestCases > 0 ? ((value as number) / totalTestCases * 100).toFixed(1) : '0'
  })).sort((a, b) => b.value - a.value);

  // Monthly joining trend (mock data for demo)
  const monthlyJoiningData = [
    { month: 'Jan', employees: 2 },
    { month: 'Feb', employees: 3 },
    { month: 'Mar', employees: 1 },
    { month: 'Apr', employees: 4 },
    { month: 'May', employees: 2 },
    { month: 'Jun', employees: 3 }
  ];

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Loading analytics data...
              </p>
            </div>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state with better information
  if (hasErrors) {
    const errorDetails = [];
    if (employeesError) errorDetails.push(`Users: ${employeesError.message || 'Unknown error'}`);
    if (projectsError) errorDetails.push(`Projects: ${projectsError.message || 'Unknown error'}`);
    if (testCasesError) errorDetails.push(`Test Cases: ${testCasesError.message || 'Unknown error'}`);
    if (bugsError) errorDetails.push(`Bugs: ${bugsError.message || 'Unknown error'}`);

    return (
      <MainLayout>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground text-red-600">
                Error loading analytics data. Please check your connection and try again.
              </p>
            </div>
          </div>
          
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Connection Issues Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Unable to load analytics data. This could be due to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
                <li>Authentication issues - please try logging out and back in</li>
                <li>Server connection problems</li>
                <li>Network connectivity issues</li>
              </ul>
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-medium">Error Details:</p>
                {errorDetails.map((error, index) => (
                  <p key={index} className="text-red-600">• {error}</p>
                ))}
              </div>
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Refresh Page
                </button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Login Again
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into employee allocation and project status
            </p>
          </div>
        </div>

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
              <div className="text-2xl font-bold text-red-500">
                {bugs.filter((bug: any) => bug.status === 'Open').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of {totalBugs} total bugs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {roleChartData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No user data available</p>
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bug Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Bug Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Test Case Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Project Test Case & Bug Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectTestCaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="testCases" fill="#82CA9D" name="Test Cases" />
                  <Bar dataKey="bugs" fill="#FF8042" name="Bugs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Test Case Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Test Case Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={testCaseWorkloadData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {testCaseWorkloadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Project Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Test Coverage Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
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
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
