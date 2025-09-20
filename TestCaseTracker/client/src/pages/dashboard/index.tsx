import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Eye,
  FileText,
  Download,
  Filter,
  Loader2
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
import { motion } from 'framer-motion';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ProjectsTable } from '@/components/dashboard/projects-table';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TestStatusChart } from '@/components/dashboard/test-status-chart';
import { BugSeverityChart } from '@/components/dashboard/bug-severity-chart';
import { TestStatusCounts } from '@/components/dashboard/test-status-counts';
import MotionGraphicsShowcase from '@/components/ui/motion-graphics-showcase';
import { TrackerReports } from '@/components/project-tracker/tracker-reports';
import { 
  ScrollTriggeredSection, 
  ParallaxBackground, 
  InteractiveCard,
  MorphingText,
  FloatingElements
} from '@/components/ui/advanced-animations';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

export function DashboardPage() {
  const { user } = useAuth();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [projectsDialogOpen, setProjectsDialogOpen] = useState(false);
  const [testCasesDialogOpen, setTestCasesDialogOpen] = useState(false);
  const [bugsDialogOpen, setBugsDialogOpen] = useState(false);
  const [passRateDialogOpen, setPassRateDialogOpen] = useState(false);
  
  // Testing Reports Tab States
  const [selectedReportProjectId, setSelectedReportProjectId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [testStatusData, setTestStatusData] = useState<any[]>([]);
  const [bugSeverityData, setBugSeverityData] = useState<any[]>([]);
  const [bugStatusData, setBugStatusData] = useState<any[]>([]);
  const [testPriorityData, setTestPriorityData] = useState<any[]>([]);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [chartDialogData, setChartDialogData] = useState<{
    title: string;
    type: 'testStatus' | 'bugSeverity' | 'bugStatus';
    items: any[];
  } | null>(null);

  // Fetch projects with real-time updates
  const { data: projects, isLoading: isProjectsLoading, error: projectsError } = useQuery<Project[]>({
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
  const { data: testCases, isLoading: isTestCasesLoading, error: testCasesError } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/test-cases");
      if (!response.ok) throw new Error("Failed to fetch test cases");
      const data = await response.json();
      console.log('Dashboard - Fetched test cases:', data);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Fetch bugs with real-time updates
  const { data: bugs, isLoading: isBugsLoading, error: bugsError } = useQuery<BugType[]>({
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

  // Fetch modules for selected project (for testing reports)
  const { data: modules, isLoading: isModulesLoading } = useQuery({
    queryKey: [`/api/projects/${selectedReportProjectId}/modules`],
    queryFn: async () => {
      if (!selectedReportProjectId) return [];
      const response = await apiRequest("GET", `/api/projects/${selectedReportProjectId}/modules`);
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
    enabled: !!selectedReportProjectId,
  });

  // Fetch users
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch test cases for selected project/module (for testing reports)
  const { data: reportTestCases, isLoading: isReportTestCasesLoading } = useQuery({
    queryKey: [`/api/projects/${selectedReportProjectId}/test-cases`, { moduleId: selectedModuleId }],
    enabled: !!selectedReportProjectId,
    queryFn: async () => {
      let url = `/api/projects/${selectedReportProjectId}/test-cases`;
      if (selectedModuleId && selectedModuleId !== "all") {
        url += `?moduleId=${selectedModuleId}`;
      }
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch test cases");
      return response.json();
    },
  });

  // Fetch bugs for selected project/module (for testing reports)
  const { data: reportBugs, isLoading: isReportBugsLoading } = useQuery({
    queryKey: [`/api/projects/${selectedReportProjectId}/bugs`, { moduleId: selectedModuleId }],
    enabled: !!selectedReportProjectId,
    queryFn: async () => {
      let url = `/api/projects/${selectedReportProjectId}/bugs`;
      if (selectedModuleId && selectedModuleId !== "all") {
        url += `?moduleId=${selectedModuleId}`;
      }
      const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error("Failed to fetch bugs");
      return response.json();
    },
  });

  // Calculate project-wise statistics
  const getProjectStats = () => {
    console.log('Dashboard Debug:', {
      projects: projects?.length || 0,
      testCases: testCases?.length || 0,
      bugs: bugs?.length || 0,
      projectsData: projects,
      testCasesData: testCases,
      bugsData: bugs
    });

    if (!projects) return [];

    return projects.map(project => {
      const projectTestCases = testCases?.filter(tc => tc.projectId === project.id) || [];
      const projectBugs = bugs?.filter(bug => bug.projectId === project.id) || [];
      const passedTests = projectTestCases.filter(tc => tc.status === 'Pass').length;
      const totalExecuted = projectTestCases.filter(tc => tc.status !== 'Not Executed').length;
      const passRate = totalExecuted > 0 ? Math.round((passedTests / totalExecuted) * 100) : 0;

      return {
        ...project,
        testCaseCount: projectTestCases.length,
        bugCount: projectBugs.filter(bug => bug.status !== 'Resolved' && bug.status !== 'Closed').length,
        passRate: passRate,
        moduleCount: [...new Set(projectTestCases.map(tc => tc.moduleId))].filter(Boolean).length
      };
    });
  };

  const projectStats = getProjectStats();

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

  // Chart click handlers for testing reports
  const handleTestStatusClick = (data: any) => {
    if (!reportTestCases) return;

    const filteredTestCases = reportTestCases.filter((tc: any) => 
      tc.status === data.name && 
      (selectedModuleId === "all" || tc.moduleId === parseInt(selectedModuleId))
    );

    setChartDialogData({
      title: `Test Cases - ${data.name}`,
      type: 'testStatus',
      items: filteredTestCases
    });
    setChartDialogOpen(true);
  };

  const handleBugSeverityClick = (data: any) => {
    if (!reportBugs) return;

    const filteredBugs = reportBugs.filter((bug: any) => 
      bug.severity === data.name && 
      (selectedModuleId === "all" || bug.moduleId === parseInt(selectedModuleId))
    );

    setChartDialogData({
      title: `Bugs - ${data.name} Severity`,
      type: 'bugSeverity',
      items: filteredBugs
    });
    setChartDialogOpen(true);
  };

  const handleBugStatusClick = (data: any) => {
    if (!reportBugs) return;

    const filteredBugs = reportBugs.filter((bug: any) => 
      bug.status === data.name && 
      (selectedModuleId === "all" || bug.moduleId === parseInt(selectedModuleId))
    );

    setChartDialogData({
      title: `Bugs - ${data.name}`,
      type: 'bugStatus',
      items: filteredBugs
    });
    setChartDialogOpen(true);
  };

  // Export functions for testing reports
  const exportToCSV = () => {
    if (!selectedReportProjectId || !reportTestCases || !reportBugs) {
      toast({
        title: "Export error",
        description: "No project selected or data not loaded yet",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedProject = projects?.find(p => p.id === selectedReportProjectId);
      const summaryData = [{
        Project: selectedProject?.name || "Unknown",
        Description: selectedProject?.description || "",
        Status: selectedProject?.status || "Active",
        "Total Test Cases": reportTestCases.length,
        "Passed Test Cases": reportTestCases.filter((tc: any) => tc.status === "Pass").length,
        "Failed Test Cases": reportTestCases.filter((tc: any) => tc.status === "Fail").length,
        "Blocked Test Cases": reportTestCases.filter((tc: any) => tc.status === "Blocked").length,
        "Not Executed Test Cases": reportTestCases.filter((tc: any) => tc.status === "Not Executed").length,
        "Total Bugs": reportBugs.length,
        "Open Bugs": reportBugs.filter((bug: any) => bug.status === "Open").length,
        "In Progress Bugs": reportBugs.filter((bug: any) => bug.status === "In Progress").length,
        "Resolved Bugs": reportBugs.filter((bug: any) => bug.status === "Resolved").length,
        "Closed Bugs": reportBugs.filter((bug: any) => bug.status === "Closed").length,
      }];

      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(summaryData[0]).join(",") + "\n" +
        summaryData.map(row => Object.values(row).join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${selectedProject?.name || 'project'}-summary-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: "Project summary has been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data to CSV",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    toast({
      title: "PDF Export",
      description: "PDF export functionality will be implemented soon",
    });
  };

  // Calculate statistics
  const totalProjects = projects?.length || 0;
  const totalTestCases = testCases?.length || 0;
  const openBugs = bugs?.filter(bug => bug.status !== 'Resolved' && bug.status !== 'Closed').length || 0;

  // Debug logging
  console.log('Dashboard Debug - Data Summary:', {
    totalProjects,
    totalTestCases,
    testCasesData: testCases,
    projectsData: projects,
    openBugs,
    isTestCasesLoading,
    testCasesError: testCasesError?.message
  });

  const passedTests = testCases?.filter(tc => tc.status === 'Pass').length || 0;
  const totalExecutedTests = testCases?.filter(tc => tc.status !== 'Not Executed').length || 0;
  const passRate = totalExecutedTests > 0 ? Math.round((passedTests / totalExecutedTests) * 100) : 0;

  useEffect(() => {
    // Check if welcome dialog should be shown
    const shouldShowWelcome = sessionStorage.getItem('showWelcomeDialog');
    if (shouldShowWelcome === 'true') {
      setShowWelcomeDialog(true);
      sessionStorage.removeItem('showWelcomeDialog');
    }
  }, []);

  // Process chart data for testing reports
  useEffect(() => {
    if (reportTestCases && reportTestCases.length > 0) {
      // Test status chart data
      const statusCounts: Record<string, number> = {};
      reportTestCases.forEach((tc: any) => {
        statusCounts[tc.status] = (statusCounts[tc.status] || 0) + 1;
      });

      const statusColors: Record<string, string> = {
        "Pass": "#10b981",
        "Fail": "#ef4444",
        "Blocked": "#f59e0b",
        "Not Executed": "#6b7280"
      };

      const newTestStatusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        percentage: Math.round((count / reportTestCases.length) * 100),
        color: statusColors[status] || "#6b7280"
      }));

      setTestStatusData(newTestStatusData);

      // Test priority chart data
      const priorityCounts: Record<string, number> = {};
      reportTestCases.forEach((tc: any) => {
        priorityCounts[tc.priority] = (priorityCounts[tc.priority] || 0) + 1;
      });

      const priorityColors: Record<string, string> = {
        "High": "#ef4444",
        "Medium": "#f59e0b",
        "Low": "#10b981"
      };

      const newTestPriorityData = Object.entries(priorityCounts).map(([priority, count]) => ({
        name: priority,
        value: count,
        percentage: Math.round((count / reportTestCases.length) * 100),
        color: priorityColors[priority] || "#6b7280"
      }));

      setTestPriorityData(newTestPriorityData);
    } else {
      setTestStatusData([]);
      setTestPriorityData([]);
    }

    if (reportBugs && reportBugs.length > 0) {
      // Bug severity chart data
      const severityCounts: Record<string, number> = {};
      reportBugs.forEach((bug: any) => {
        severityCounts[bug.severity] = (severityCounts[bug.severity] || 0) + 1;
      });

      const severityColors: Record<string, string> = {
        "Critical": "#ef4444",
        "Major": "#f59e0b",
        "Minor": "#fbbf24",
        "Trivial": "#10b981"
      };

      const newBugSeverityData = Object.entries(severityCounts).map(([severity, count]) => ({
        name: severity,
        value: count,
        percentage: Math.round((count / reportBugs.length) * 100),
        color: severityColors[severity] || "#6b7280"
      }));

      setBugSeverityData(newBugSeverityData);

      // Bug status chart data
      const statusCounts: Record<string, number> = {};
      reportBugs.forEach((bug: any) => {
        statusCounts[bug.status] = (statusCounts[bug.status] || 0) + 1;
      });

      const statusColors: Record<string, string> = {
        "Open": "#ef4444",
        "In Progress": "#3b82f6",
        "Resolved": "#10b981",
        "Closed": "#6b7280"
      };

      const newBugStatusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        percentage: Math.round((count / reportBugs.length) * 100),
        color: statusColors[status] || "#6b7280"
      }));

      setBugStatusData(newBugStatusData);
    } else {
      setBugSeverityData([]);
      setBugStatusData([]);
    }
  }, [reportTestCases, reportBugs, selectedModuleId]);

  return (
    <MainLayout>
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of your testing projects and comprehensive reports</p>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard Overview
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Project Reports & Analytics
            </TabsTrigger>
            <TabsTrigger value="testing-reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Testing Reports & Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">{/* Dashboard Overview Content */}

        {/* Statistics Cards with Interactive Dialogs */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

            <Dialog open={projectsDialogOpen} onOpenChange={setProjectsDialogOpen}>
              <DialogTrigger asChild>
                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <Card className="cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 border-2 hover:border-blue-200">
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
                </motion.div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Projects Overview</DialogTitle>
                  <DialogDescription>
                    Detailed view of all your testing projects
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                  {projectStats && projectStats.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Created Date</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectStats.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{user?.firstName} {user?.lastName}</TableCell>
                            <TableCell>{project.description || 'No description'}</TableCell>
                            <TableCell>
                              <Badge variant="default">{project.status || 'Active'}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {isProjectsLoading ? 'Loading projects...' : 'No projects found'}
                      </p>
                      {projectsError && (
                        <p className="text-red-500 text-sm mt-2">
                          Error: {projectsError.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>


            <Dialog open={testCasesDialogOpen} onOpenChange={setTestCasesDialogOpen}>
              <DialogTrigger asChild>
                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <Card className="cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 border-2 hover:border-blue-200">
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
                </motion.div>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Test Cases Overview</DialogTitle>
                  <DialogDescription>
                    Test cases breakdown by project with module count and detailed test case list
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  {/* Project Summary Table */}
                  {projectStats && projectStats.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Project Summary</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Project Name</TableHead>
                              <TableHead>Module Count</TableHead>
                              <TableHead>Total Test Cases</TableHead>
                              <TableHead>Pass Rate</TableHead>
                              <TableHead>Status Distribution</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {projectStats.map((project) => {
                              const projectTestCases = testCases?.filter(tc => tc.projectId === project.id) || [];
                              const passCount = projectTestCases.filter(tc => tc.status === 'Pass').length;
                              const failCount = projectTestCases.filter(tc => tc.status === 'Fail').length;
                              const blockedCount = projectTestCases.filter(tc => tc.status === 'Blocked').length;
                              const notExecutedCount = projectTestCases.filter(tc => tc.status === 'Not Executed').length;

                              return (
                                <TableRow key={project.id}>
                                  <TableCell className="font-medium">{project.name}</TableCell>
                                  <TableCell>{project.moduleCount}</TableCell>
                                  <TableCell>{projectTestCases.length}</TableCell>
                                  <TableCell>
                                    <Badge variant={project.passRate >= 80 ? 'default' : project.passRate >= 60 ? 'secondary' : 'destructive'}>
                                      {project.passRate}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1 text-xs flex-wrap">
                                      <span className="text-green-600">P:{passCount}</span>
                                      <span className="text-red-600">F:{failCount}</span>
                                      <span className="text-yellow-600">B:{blockedCount}</span>
                                      <span className="text-gray-600">NE:{notExecutedCount}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>


                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {isTestCasesLoading ? 'Loading test cases...' : 'No test cases found'}
                      </p>
                      {testCasesError && (
                        <p className="text-red-500 text-sm mt-2">
                          Error: {testCasesError.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>


            <Dialog open={bugsDialogOpen} onOpenChange={setBugsDialogOpen}>
              <DialogTrigger asChild>
                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <Card className="cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 border-2 hover:border-blue-200">
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
                </motion.div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Open Bugs Overview</DialogTitle>
                  <DialogDescription>
                    Bug count breakdown by project
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Open Bug Count</TableHead>
                        <TableHead>Critical</TableHead>
                        <TableHead>Major</TableHead>
                        <TableHead>Minor</TableHead>
                        <TableHead>Trivial</TableHead>
                        <TableHead>Total Bugs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectStats?.map((project) => {
                        const projectBugs = bugs?.filter(bug => bug.projectId === project.id) || [];
                        const openBugs = projectBugs.filter(bug => bug.status !== 'Resolved' && bug.status !== 'Closed');
                        const criticalCount = openBugs.filter(bug => bug.severity === 'Critical').length;
                        const majorCount = openBugs.filter(bug => bug.severity === 'Major').length;
                        const minorCount = openBugs.filter(bug => bug.severity === 'Minor').length;
                        const trivialCount = openBugs.filter(bug => bug.severity === 'Trivial').length;

                        return (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>
                              <Badge variant={openBugs.length > 5 ? 'destructive' : openBugs.length > 0 ? 'secondary' : 'default'}>
                                {openBugs.length}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-red-600 font-medium">{criticalCount}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-orange-600 font-medium">{majorCount}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-yellow-600 font-medium">{minorCount}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-green-600 font-medium">{trivialCount}</span>
                            </TableCell>
                            <TableCell>{projectBugs.length}</TableCell>
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
                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <Card className="cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 border-2 hover:border-blue-200">
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
                </motion.div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Pass Rate by Project</DialogTitle>
                  <DialogDescription>
                    Test pass percentage breakdown by project
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Pass Percentage</TableHead>
                        <TableHead>Passed Tests</TableHead>
                        <TableHead>Failed Tests</TableHead>
                        <TableHead>Blocked Tests</TableHead>
                        <TableHead>Total Executed</TableHead>
                        <TableHead>Progress Bar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectStats?.map((project) => {
                        const projectTestCases = testCases?.filter(tc => tc.projectId === project.id) || [];
                        const passedCount = projectTestCases.filter(tc => tc.status === 'Pass').length;
                        const failedCount = projectTestCases.filter(tc => tc.status === 'Fail').length;
                        const blockedCount = projectTestCases.filter(tc => tc.status === 'Blocked').length;
                        const executedCount = projectTestCases.filter(tc => tc.status !== 'Not Executed').length;

                        return (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>
                              <Badge variant={project.passRate >= 80 ? 'default' : project.passRate >= 60 ? 'secondary' : 'destructive'}>
                                {project.passRate}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-green-600 font-medium">{passedCount}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-red-600 font-medium">{failedCount}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-yellow-600 font-medium">{blockedCount}</span>
                            </TableCell>
                            <TableCell>{executedCount}</TableCell>
                            <TableCell>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${project.passRate}%` }}
                                ></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>

        </motion.div>

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
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Project Tracker Reports */}
            <TrackerReports 
              projects={projects || []} 
              features={[]}
              subFeatures={[]}
            />
          </TabsContent>

          <TabsContent value="testing-reports" className="space-y-6">
            {/* Testing Reports & Analytics */}
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Testing Reports & Analytics</h2>
                  <p className="text-muted-foreground mt-1">Generate comprehensive testing reports and analytics</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <select
                    value={selectedReportProjectId || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedReportProjectId(value ? parseInt(value) : null);
                      setSelectedModuleId("all");
                    }}
                    className="px-3 py-2 border rounded-md text-sm bg-white"
                  >
                    <option value="">Select a project</option>
                    {projects?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    disabled={!selectedReportProjectId || isModulesLoading}
                    className="px-3 py-2 border rounded-md text-sm bg-white disabled:bg-gray-100"
                  >
                    <option value="all">All modules</option>
                    {modules?.map((module: any) => (
                      <option key={module.id} value={module.id}>
                        {module.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedReportProjectId && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={exportToCSV}
                      disabled={isReportTestCasesLoading || isReportBugsLoading}
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={exportToPDF}
                      disabled={isReportTestCasesLoading || isReportBugsLoading}
                    >
                      <FileText className="h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {!selectedReportProjectId ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">Please select a project to view testing reports and analytics</p>
                </CardContent>
              </Card>
            ) : (isReportTestCasesLoading || isReportBugsLoading) ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Project Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Project Overview
                    </CardTitle>
                    <CardDescription>
                      Summary statistics for {projects?.find(p => p.id === selectedReportProjectId)?.name || "selected project"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Test Cases</h3>
                        <p className="text-2xl font-semibold dark:text-white">{reportTestCases?.length || 0}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bugs</h3>
                        <p className="text-2xl font-semibold dark:text-white">{reportBugs?.length || 0}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Modules</h3>
                        <p className="text-2xl font-semibold dark:text-white">{modules?.length || 0}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pass Rate</h3>
                        <p className="text-2xl font-semibold dark:text-white">
                          {reportTestCases?.length > 0 ? 
                            Math.round((reportTestCases.filter((tc: any) => tc.status === "Pass").length / reportTestCases.length) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Test case and bug stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Case Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        {testStatusData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={testStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={handleTestStatusClick}
                                style={{ cursor: 'pointer' }}
                              >
                                {testStatusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-gray-500 mt-20">No test case data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Test Case Priority</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        {testPriorityData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={testPriorityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {testPriorityData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-gray-500 mt-20">No test case data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bug stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bug Severity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        {bugSeverityData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={bugSeverityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={handleBugSeverityClick}
                                style={{ cursor: 'pointer' }}
                              >
                                {bugSeverityData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-gray-500 mt-20">No bug data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Bug Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        {bugStatusData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={bugStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={handleBugStatusClick}
                                style={{ cursor: 'pointer' }}
                              >
                                {bugStatusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-gray-500 mt-20">No bug data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Chart Data Dialog */}
            <Dialog open={chartDialogOpen} onOpenChange={setChartDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {chartDialogData?.title}
                  </DialogTitle>
                  <DialogDescription>
                    Detailed view of {chartDialogData?.items.length || 0} items
                  </DialogDescription>
                </DialogHeader>

                {chartDialogData && (
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {chartDialogData.type === 'testStatus' ? (
                            <>
                              <TableHead>Feature</TableHead>
                              <TableHead>Module</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead>Title</TableHead>
                              <TableHead>Module</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chartDialogData.items.map((item, index) => (
                          <TableRow key={index}>
                            {chartDialogData.type === 'testStatus' ? (
                              <>
                                <TableCell>{item.feature || item.title}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {modules?.find((m: any) => m.id === item.moduleId)?.name || 'Unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={item.priority === 'High' ? 'destructive' : 'secondary'}>
                                    {item.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={item.status === 'Pass' ? 'default' : 'destructive'}>
                                    {item.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>{item.title}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {modules?.find((m: any) => m.id === item.moduleId)?.name || 'Unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={item.severity === 'Critical' ? 'destructive' : 'secondary'}>
                                    {item.severity}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={item.priority === 'High' ? 'destructive' : 'secondary'}>
                                    {item.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={item.status === 'Open' ? 'destructive' : 'default'}>
                                    {item.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{new Date(item.dateReported || item.createdAt).toLocaleDateString()}</TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

        </Tabs>
      {/* Welcome Dialog */}
        {showWelcomeDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Welcome to the Dashboard!
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  This is a quick tour of the dashboard. You can see your projects, test cases, and bugs.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowWelcomeDialog(false)}
                  className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  Okay!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
    </MainLayout>
  );
}