import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { ProjectSelect } from "@/components/ui/project-select";
import { ModuleSelect } from "@/components/ui/module-select";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Project, TestCase, Bug, Module } from "@/types";
import { Download, FileType, Loader2, LayoutGrid, FileBarChart, FileText, BarChart3, TrendingUp, Activity, Eye } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { BugReportSummary } from "@/components/reports/bug-report-summary";
import { useLocation } from "wouter";
import { EnhancedBugSummary } from "@/components/reports/enhanced-bug-summary";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [testStatusData, setTestStatusData] = useState<any[]>([]);
  const [bugSeverityData, setBugSeverityData] = useState<any[]>([]);
  const [bugStatusData, setBugStatusData] = useState<any[]>([]);
  const [testPriorityData, setTestPriorityData] = useState<any[]>([]);

  // Dialog states for chart data
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [chartDialogData, setChartDialogData] = useState<{
    title: string;
    type: 'testStatus' | 'bugSeverity' | 'bugStatus';
    items: any[];
  } | null>(null);

  // Fetch projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch test cases for selected project/module
  const { data: testCases, isLoading: isTestCasesLoading } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${selectedProjectId}/test-cases`, { moduleId: selectedModuleId }],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      let url = `/api/projects/${selectedProjectId}/test-cases`;
      // Add moduleId as a query parameter if it's set and not "all"
      if (selectedModuleId && selectedModuleId !== "all") {
        url += `?moduleId=${selectedModuleId}`;
      }
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Fetch bugs for selected project/module
  const { data: bugs, isLoading: isBugsLoading } = useQuery<Bug[]>({
    queryKey: [`/api/projects/${selectedProjectId}/bugs`, { moduleId: selectedModuleId }],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      let url = `/api/projects/${selectedProjectId}/bugs`;
      // Add moduleId as a query parameter if it's set and not "all"
      if (selectedModuleId && selectedModuleId !== "all") {
        url += `?moduleId=${selectedModuleId}`;
      }
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Fetch modules for selected project
  const { data: modules, isLoading: isModulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/projects/${selectedProjectId}/modules`],
    enabled: !!selectedProjectId,
  });

  // Dashboard stats for pass rate
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Selected project
  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  // Process the data for charts when dependencies change
  useEffect(() => {
    if (testCases && testCases.length > 0) {
      // Test status chart data
      const statusCounts: Record<string, number> = {};
      testCases.forEach(tc => {
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
        percentage: Math.round((count / testCases.length) * 100),
        color: statusColors[status] || "#6b7280"
      }));

      setTestStatusData(newTestStatusData);

      // Test priority chart data
      const priorityCounts: Record<string, number> = {};
      testCases.forEach(tc => {
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
        percentage: Math.round((count / testCases.length) * 100),
        color: priorityColors[priority] || "#6b7280"
      }));

      setTestPriorityData(newTestPriorityData);
    } else {
      setTestStatusData([]);
      setTestPriorityData([]);
    }

    if (bugs && bugs.length > 0) {
      // Bug severity chart data
      const severityCounts: Record<string, number> = {};
      bugs.forEach(bug => {
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
        percentage: Math.round((count / bugs.length) * 100),
        color: severityColors[severity] || "#6b7280"
      }));

      setBugSeverityData(newBugSeverityData);

      // Bug status chart data
      const statusCounts: Record<string, number> = {};
      bugs.forEach(bug => {
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
        percentage: Math.round((count / bugs.length) * 100),
        color: statusColors[status] || "#6b7280"
      }));

      setBugStatusData(newBugStatusData);
    } else {
      setBugSeverityData([]);
      setBugStatusData([]);
    }
  }, [testCases, bugs, selectedModuleId]);

  // Chart click handlers
  const handleTestStatusClick = (data: any) => {
    if (!testCases) return;

    const filteredTestCases = testCases.filter(tc => 
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
    if (!bugs) return;

    const filteredBugs = bugs.filter(bug => 
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
    if (!bugs) return;

    const filteredBugs = bugs.filter(bug => 
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

  // Export as CSV
  const exportToCSV = () => {
    if (!selectedProject || !testCases || !bugs) {
      toast({
        title: "Export error",
        description: "No project selected or data not loaded yet",
        variant: "destructive",
      });
      return;
    }

    try {
      // Project summary data
      const summaryData = [{
        Project: selectedProject.name,
        Description: selectedProject.description || "",
        Status: selectedProject.status,
        "Total Test Cases": testCases.length,
        "Passed Test Cases": testCases.filter(tc => tc.status === "Pass").length,
        "Failed Test Cases": testCases.filter(tc => tc.status === "Fail").length,
        "Blocked Test Cases": testCases.filter(tc => tc.status === "Blocked").length,
        "Not Executed Test Cases": testCases.filter(tc => tc.status === "Not Executed").length,
        "Total Bugs": bugs.length,
        "Open Bugs": bugs.filter(bug => bug.status === "Open").length,
        "In Progress Bugs": bugs.filter(bug => bug.status === "In Progress").length,
        "Resolved Bugs": bugs.filter(bug => bug.status === "Resolved").length,
        "Closed Bugs": bugs.filter(bug => bug.status === "Closed").length,
      }];

      // Generate CSV
      const summaryCSV = Papa.unparse(summaryData);

      // Download summary CSV
      downloadCSV(summaryCSV, `${selectedProject.name}-summary-${Date.now()}.csv`);

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

  // Helper function to download CSV
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export as PDF with comprehensive project report
  const exportToPDF = () => {
    if (!selectedProject || !testCases || !bugs) {
      toast({
        title: "Export error",
        description: "No project selected or data not loaded yet",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();

      // Cover Page
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text("PROJECT REPORT", 105, 50, { align: 'center' });

      doc.setFontSize(20);
      doc.text(selectedProject.name, 105, 70, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 90, { align: 'center' });
      doc.text(`Status: ${selectedProject.status}`, 105, 100, { align: 'center' });

      if (selectedProject.description) {
        doc.setFontSize(10);
        doc.text("Description:", 14, 120);
        const splitDescription = doc.splitTextToSize(selectedProject.description, 180);
        doc.text(splitDescription, 14, 130);
      }

      // Save PDF
      const safeName = selectedProject.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      doc.save(`${safeName}-comprehensive-report-${Date.now()}.pdf`);

      toast({
        title: "Export successful",
        description: "Comprehensive project report has been exported to PDF",
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export comprehensive report to PDF",
        variant: "destructive",
      });
    }
  };

  // Is loading any data
  const isLoading = isProjectsLoading || 
    (!!selectedProjectId && (isTestCasesLoading || isBugsLoading || isModulesLoading));

  // Calculate summary metrics
  const totalTestCases = testCases?.length || 0;
  const passedTestCases = testCases?.filter(tc => tc.status === "Pass").length || 0;
  const failedTestCases = testCases?.filter(tc => tc.status === "Fail").length || 0;
  const blockedTestCases = testCases?.filter(tc => tc.status === "Blocked").length || 0;
  const notExecutedTestCases = testCases?.filter(tc => tc.status === "Not Executed").length || 0;

  const totalBugs = bugs?.length || 0;
  const openBugs = bugs?.filter(bug => bug.status === "Open").length || 0;
  const inProgressBugs = bugs?.filter(bug => bug.status === "In Progress").length || 0;
  const resolvedBugs = bugs?.filter(bug => bug.status === "Resolved").length || 0;
  const closedBugs = bugs?.filter(bug => bug.status === "Closed").length || 0;

  const passRate = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;

  const handleConsolidatedReports = () => {
    setLocation("/reports/consolidated");
  };

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <FileBarChart className="h-6 w-6" />
              Reports
            </h1>
            <p className="mt-1 text-sm text-gray-600">Generate and export project reports</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <ProjectSelect
                projects={projects}
                isLoading={isProjectsLoading}
                selectedProjectId={selectedProjectId || ""}
                onChange={(value) => {
                  setSelectedProjectId(value ? parseInt(value) : null);
                  setSelectedModuleId("all");
                }}
                placeholder="Select a project"
                className="w-[200px]"
              />

              <ModuleSelect
                modules={modules}
                isLoading={isModulesLoading}
                selectedModuleId={selectedModuleId}
                onChange={(value) => setSelectedModuleId(value)}
                disabled={!selectedProjectId || isModulesLoading}
                placeholder="All modules"
                className="w-[200px]"
                includeAllOption={true}
              />
            </div>

            {selectedProjectId && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex items-center gap-2"
                  onClick={handleConsolidatedReports}
                  disabled={isLoading}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Consolidated Reports
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={exportToCSV}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={exportToPDF}
                  disabled={isLoading}
                >
                  <FileType className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            )}
          </div>
        </div>

        {!selectedProjectId ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">Please select a project to view and generate reports</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Bug Summary */}
            {selectedProject && (
              <EnhancedBugSummary
                bugs={bugs || []}
                modules={modules || []}
                projectName={selectedProject.name}
                className="mb-6"
              />
            )}

            {/* Project Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Project Overview
                </CardTitle>
                <CardDescription>
                  Summary statistics for {selectedProject?.name || "selected project"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Test Cases</h3>
                    <p className="text-2xl font-semibold dark:text-white">{totalTestCases}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bugs</h3>
                    <p className="text-2xl font-semibold dark:text-white">{totalBugs}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Modules</h3>
                    <p className="text-2xl font-semibold dark:text-white">{modules?.length || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pass Rate</h3>
                    <p className="text-2xl font-semibold dark:text-white">{passRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Status Overview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Progress Dashboard
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Test Case Execution Progress</h3>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Passed</span>
                        <span>{passedTestCases}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Failed</span>
                        <span>{failedTestCases}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Blocked</span>
                        <span>{blockedTestCases}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Passed: {passedTestCases}, Failed: {failedTestCases}, Blocked: {blockedTestCases}, Not Executed: {notExecutedTestCases}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Bug Resolution Progress</h3>
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Resolved</span>
                        <span>{resolvedBugs + closedBugs}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>In Progress</span>
                        <span>{inProgressBugs}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Resolved: {resolvedBugs + closedBugs}, In Progress: {inProgressBugs}, Open: {openBugs}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test case stats */}
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
                <CardFooter>
                  <div className="grid grid-cols-2 gap-4 w-full text-sm">
                    <div className="text-center">
                      <span className="font-medium">Passed</span>
                      <div className="text-green-600">{passedTestCases}</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">Failed</span>
                      <div className="text-red-600">{failedTestCases}</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">Blocked</span>
                      <div className="text-yellow-600">{blockedTestCases}</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">Not Executed</span>
                      <div className="text-gray-600">{notExecutedTestCases}</div>
                    </div>
                  </div>
                </CardFooter>
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
                <CardFooter>
                  <div className="grid grid-cols-2 gap-4 w-full text-sm">
                    <div className="text-center">
                      <span className="font-medium">Open</span>
                      <div className="text-red-600">{openBugs}</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">In Progress</span>
                      <div className="text-blue-600">{inProgressBugs}</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">Resolved</span>
                      <div className="text-green-600">{resolvedBugs}</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">Closed</span>
                      <div className="text-gray-600">{closedBugs}</div>
                    </div>
                  </div>
                </CardFooter>
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
                              {modules?.find(m => m.id === item.moduleId)?.name || 'Unknown'}
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
                              {modules?.find(m => m.id === item.moduleId)?.name || 'Unknown'}
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
    </div>
  );
}