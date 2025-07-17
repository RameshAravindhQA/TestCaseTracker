import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MainLayout } from "@/components/ui/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
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
  Eye
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
import { SoundDebug } from '@/components/sound-debug'

export function DashboardPage() {
  const { user } = useAuth();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [projectsDialogOpen, setProjectsDialogOpen] = useState(false);
  const [testCasesDialogOpen, setTestCasesDialogOpen] = useState(false);
  const [bugsDialogOpen, setBugsDialogOpen] = useState(false);
  const [passRateDialogOpen, setPassRateDialogOpen] = useState(false);
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
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Statistics Cards with Interactive Dialogs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Dialog open={projectsDialogOpen} onOpenChange={setProjectsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Click to view details
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Projects Overview</DialogTitle>
              <DialogDescription>
                Detailed view of all your testing projects
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Test Cases</TableHead>
                    <TableHead>Bugs</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects?.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.description || 'No description'}</TableCell>
                      <TableCell>
                        {testCases?.filter(tc => tc.projectId === project.id).length || 0}
                      </TableCell>
                      <TableCell>
                        {bugs?.filter(bug => bug.projectId === project.id).length || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={testCasesDialogOpen} onOpenChange={setTestCasesDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
                <TestTube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTestCases}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Click to view details
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Test Cases Overview</DialogTitle>
              <DialogDescription>
                Detailed view of test cases by project
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Test Case Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testCases?.map((testCase) => {
                    const project = projects?.find(p => p.id === testCase.projectId);
                    return (
                      <TableRow key={testCase.id}>
                        <TableCell>{project?.name || 'Unknown'}</TableCell>
                        <TableCell className="font-medium">{testCase.title}</TableCell>
                        <TableCell>
                          <Badge variant={testCase.status === 'Pass' ? 'default' : testCase.status === 'Fail' ? 'destructive' : 'secondary'}>
                            {testCase.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{testCase.priority}</Badge>
                        </TableCell>
                        <TableCell>{new Date(testCase.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={bugsDialogOpen} onOpenChange={setBugsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Bugs</CardTitle>
                <Bug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openBugs}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Click to view details
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Open Bugs Overview</DialogTitle>
              <DialogDescription>
                Detailed view of all unresolved bugs
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Bug Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bugs?.filter(bug => bug.status !== 'Resolved' && bug.status !== 'Closed').map((bug) => {
                    const project = projects?.find(p => p.id === bug.projectId);
                    return (
                      <TableRow key={bug.id}>
                        <TableCell>{project?.name || 'Unknown'}</TableCell>
                        <TableCell className="font-medium">{bug.title}</TableCell>
                        <TableCell>
                          <Badge variant={bug.severity === 'Critical' ? 'destructive' : bug.severity === 'Major' ? 'destructive' : 'secondary'}>
                            {bug.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{bug.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(bug.dateReported).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={passRateDialogOpen} onOpenChange={setPassRateDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{passRate}%</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Click to view details
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Test Pass Rate Details</DialogTitle>
              <DialogDescription>
                Breakdown of test execution results
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                  <div className="text-sm text-green-700">Passed Tests</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {testCases?.filter(tc => tc.status === 'Fail').length || 0}
                  </div>
                  <div className="text-sm text-red-700">Failed Tests</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {testCases?.filter(tc => tc.status === 'Blocked').length || 0}
                  </div>
                  <div className="text-sm text-yellow-700">Blocked Tests</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {testCases?.filter(tc => tc.status === 'Not Executed').length || 0}
                  </div>
                  <div className="text-sm text-gray-700">Not Executed</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Overall Progress</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${passRate}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {passRate}% of tests are passing ({passedTests} out of {totalExecutedTests} executed)
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
    </MainLayout>
  );
}