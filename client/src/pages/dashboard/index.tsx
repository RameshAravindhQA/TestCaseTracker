import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/ui/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { playSound } from "@/utils/sound-effects";
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Bug,
  TestTube,
  FolderOpen,
  Plus,
  BarChart3,
  BookOpen,
  FileText,
  HelpCircle,
  Download,
  Target,
  Zap
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Project, TestCase, Bug as BugType } from "@shared/schema";
import { WelcomeDialog } from "@/components/ui/welcome-dialog";

export function DashboardPage() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setTimeout(() => {
        setShowWelcome(true);
      }, 1000);
    }
  }, []);

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  // Fetch projects with real-time updates
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  // Fetch test cases with real-time updates
  const { data: testCases } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/test-cases");
      if (!response.ok) throw new Error("Failed to fetch test cases");
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Fetch bugs with real-time updates
  const { data: bugs } = useQuery<BugType[]>({
    queryKey: ["/api/bugs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bugs");
      if (!response.ok) throw new Error("Failed to fetch bugs");
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  // Fetch recent activities
  const { data: activities } = useQuery({
    queryKey: ["/api/activities?limit=5"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/activities?limit=5");
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  // Generate real-time data based only on actual test cases and bugs
  const generateRealTimeData = () => {
    if (!testCases || testCases.length === 0) {
      return { testExecutionData: [], bugTrendData: [] };
    }

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const testExecutionData = last7Days.map((date, index) => {
      const dayTestCases = testCases.filter(tc => {
        const tcDate = new Date(tc.updatedAt || tc.createdAt);
        return tcDate.toDateString() === date.toDateString();
      });

      const pass = dayTestCases.filter(tc => tc.status === 'Pass').length;
      const fail = dayTestCases.filter(tc => tc.status === 'Fail').length;
      const blocked = dayTestCases.filter(tc => tc.status === 'Blocked').length;
      const notExecuted = dayTestCases.filter(tc => tc.status === 'Not Executed').length;

      return {
        name: index === 6 ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pass: pass,
        fail: fail,
        blocked: blocked,
        notExecuted: notExecuted,
        tests: pass + fail + blocked + notExecuted
      };
    });

    const bugTrendData = last7Days.map((date, index) => {
      const dayBugs = bugs ? bugs.filter(bug => {
        const bugDate = new Date(bug.dateReported);
        return bugDate.toDateString() === date.toDateString();
      }) : [];

      const critical = dayBugs.filter(bug => bug.severity === 'Critical').length;
      const major = dayBugs.filter(bug => bug.severity === 'Major').length;
      const minor = dayBugs.filter(bug => bug.severity === 'Minor').length;
      const trivial = dayBugs.filter(bug => bug.severity === 'Trivial').length;

      return {
        name: index === 6 ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        critical: critical,
        major: major,
        minor: minor,
        trivial: trivial,
        discovered: critical + major + minor + trivial,
        resolved: dayBugs.filter(bug => bug.status === 'Resolved' || bug.status === 'Closed').length
      };
    });

    return { testExecutionData, bugTrendData };
  };

  const { testExecutionData, bugTrendData } = generateRealTimeData();

  // Calculate statistics
  const totalProjects = projects?.length || 0;
  const totalTestCases = testCases?.length || 0;
  const openBugs = bugs?.filter(bug => bug.status !== 'Resolved' && bug.status !== 'Closed').length || 0;

  const passedTests = testCases?.filter(tc => tc.status === 'Pass').length || 0;
  const totalExecutedTests = testCases?.filter(tc => tc.status !== 'Not Executed').length || 0;
  const passRate = totalExecutedTests > 0 ? Math.round((passedTests / totalExecutedTests) * 100) : 0;

  // Test status distribution data
  const testStatusData = [
    { name: 'Passed', value: testCases?.filter(tc => tc.status === 'Pass').length || 0, color: '#10b981' },
    { name: 'Failed', value: testCases?.filter(tc => tc.status === 'Fail').length || 0, color: '#ef4444' },
    { name: 'Blocked', value: testCases?.filter(tc => tc.status === 'Blocked').length || 0, color: '#f59e0b' },
    { name: 'Not Executed', value: testCases?.filter(tc => tc.status === 'Not Executed').length || 0, color: '#6b7280' }
  ];

  // Bug severity distribution data
  const bugSeverityData = [
    { name: 'Critical', value: bugs?.filter(bug => bug.severity === 'Critical').length || 0, color: '#dc2626' },
    { name: 'Major', value: bugs?.filter(bug => bug.severity === 'Major').length || 0, color: '#ea580c' },
    { name: 'Minor', value: bugs?.filter(bug => bug.severity === 'Minor').length || 0, color: '#facc15' },
    { name: 'Trivial', value: bugs?.filter(bug => bug.severity === 'Trivial').length || 0, color: '#22c55e' }
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your testing projects and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              playSound('click');
              window.location.href = '/user-guide';
            }}
            onMouseEnter={() => playSound('hover')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            User Guide Documentation
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              playSound('click');
              window.location.href = '/projects';
            }}
            onMouseEnter={() => playSound('hover')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Active testing projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTestCases}</div>
            <p className="text-xs text-muted-foreground">Total test cases created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Bugs</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openBugs}</div>
            <p className="text-xs text-muted-foreground">Unresolved issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate}%</div>
            <p className="text-xs text-muted-foreground">Test success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Real-time Project Health
            </CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleTimeString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {testExecutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={testExecutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="pass" stroke="#10b981" strokeWidth={2} name="Passed" />
                  <Line type="monotone" dataKey="fail" stroke="#ef4444" strokeWidth={2} name="Failed" />
                  <Line type="monotone" dataKey="blocked" stroke="#f59e0b" strokeWidth={2} name="Blocked" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No test execution data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Bug Discovery & Resolution
            </CardTitle>
            <CardDescription>Combined test and bug metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {bugTrendData.length > 0 && bugTrendData.some(d => d.discovered > 0 || d.resolved > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bugTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="discovered" stroke="#ef4444" strokeWidth={2} name="Discovered" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No bug data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {testStatusData.map((status) => (
                <div key={status.name} className="text-center">
                  <div className="text-2xl font-bold mb-1" style={{ color: status.color }}>
                    {status.value}
                  </div>
                  <div className="text-sm text-gray-600">{status.name}</div>
                  <div className="text-xs text-gray-500">
                    {totalTestCases > 0 ? Math.round((status.value / totalTestCases) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bug Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bugSeverityData.map((severity) => (
                <div key={severity.name} className="text-center">
                  <div className="text-2xl font-bold mb-1" style={{ color: severity.color }}>
                    {severity.value}
                  </div>
                  <div className="text-sm text-gray-600">{severity.name}</div>
                  <div className="text-xs text-gray-500">
                    {bugs && bugs.length > 0 ? Math.round((severity.value / bugs.length) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

        {/* User Guide Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-500 rounded-xl shadow-lg">
                    <HelpCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>User Documentation</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download comprehensive guides to help you get the most out of the system
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3"
                  onClick={() => window.open('/api/user-guide/download/quick-start', '_blank')}
                >
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="text-center">
                    <div className="font-medium">Quick Start Guide</div>
                    <div className="text-sm text-muted-foreground">Basic setup and navigation</div>
                  </div>
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3"
                  onClick={() => window.open('/api/user-guide/download/test-management', '_blank')}
                >
                  <Target className="h-8 w-8 text-green-500" />
                  <div className="text-center">
                    <div className="font-medium">Test Management Guide</div>
                    <div className="text-sm text-muted-foreground">Creating and managing test cases</div>
                  </div>
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3"
                  onClick={() => window.open('/api/user-guide/download/bug-tracking', '_blank')}
                >
                  <Zap className="h-8 w-8 text-red-500" />
                  <div className="text-center">
                    <div className="font-medium">Bug Tracking Guide</div>
                    <div className="text-sm text-muted-foreground">Bug reporting and management</div>
                  </div>
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3"
                  onClick={() => window.open('/api/user-guide/download/automation', '_blank')}
                >
                  <Zap className="h-8 w-8 text-purple-500" />
                  <div className="text-center">
                    <div className="font-medium">Automation Guide</div>
                    <div className="text-sm text-muted-foreground">Test automation with Playwright</div>
                  </div>
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3"
                  onClick={() => window.open('/api/user-guide/download/complete', '_blank')}
                >
                  <FileText className="h-8 w-8 text-orange-500" />
                  <div className="text-center">
                    <div className="font-medium">Complete User Manual</div>
                    <div className="text-sm text-muted-foreground">Comprehensive documentation</div>
                  </div>
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3"
                  onClick={() => window.open('/api/user-guide/download/admin', '_blank')}
                >
                  <Users className="h-8 w-8 text-indigo-500" />
                  <div className="text-center">
                    <div className="font-medium">Admin Guide</div>
                    <div className="text-sm text-muted-foreground">System administration</div>
                  </div>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
         {/* Welcome Dialog */}
        <WelcomeDialog
          open={showWelcome}
          onOpenChange={setShowWelcome}
        />
      </div>
    </MainLayout>
  );
}
```