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
import { Download, FileType, Loader2, LayoutGrid } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { BugReportSummary } from "@/components/reports/bug-report-summary";
import { useLocation } from "wouter";
import { EnhancedBugSummary } from "@/components/reports/enhanced-bug-summary";

export default function ReportsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [testStatusData, setTestStatusData] = useState<any[]>([]);
  const [bugSeverityData, setBugSeverityData] = useState<any[]>([]);
  const [bugStatusData, setBugStatusData] = useState<any[]>([]);
  const [testPriorityData, setTestPriorityData] = useState<any[]>([]);

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
  }, [testCases, bugs]);

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
      const testCasesCSV = Papa.unparse(testCases);
      const bugsCSV = Papa.unparse(bugs);

      // Create a ZIP file with multiple CSVs
      // Since we can't directly create ZIP files in the browser, we'll create separate downloads

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

      // Dashboard Statistics Section
      doc.addPage();
      doc.setFontSize(16);
      doc.text("DASHBOARD STATISTICS", 14, 20);

      const passedCount = testCases.filter(tc => tc.status === "Pass").length;
      const failedCount = testCases.filter(tc => tc.status === "Fail").length;
      const blockedCount = testCases.filter(tc => tc.status === "Blocked").length;
      const notExecutedCount = testCases.filter(tc => tc.status === "Not Executed").length;
      const passRate = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;

      const openBugsCount = bugs.filter(bug => bug.status === "Open").length;
      const inProgressBugsCount = bugs.filter(bug => bug.status === "In Progress").length;
      const resolvedBugsCount = bugs.filter(bug => bug.status === "Resolved").length;
      const closedBugsCount = bugs.filter(bug => bug.status === "Closed").length;

      const criticalBugs = bugs.filter(bug => bug.severity === "Critical").length;
      const majorBugs = bugs.filter(bug => bug.severity === "Major").length;
      const minorBugs = bugs.filter(bug => bug.severity === "Minor").length;
      const trivialBugs = bugs.filter(bug => bug.severity === "Trivial").length;

      // Overall Statistics Table
      autoTable(doc, {
        startY: 30,
        head: [["Metric", "Value", "Percentage"]],
        body: [
          ["Total Test Cases", testCases.length.toString(), "100%"],
          ["Passed Test Cases", passedCount.toString(), `${Math.round((passedCount / testCases.length) * 100)}%`],
          ["Failed Test Cases", failedCount.toString(), `${Math.round((failedCount / testCases.length) * 100)}%`],
          ["Blocked Test Cases", blockedCount.toString(), `${Math.round((blockedCount / testCases.length) * 100)}%`],
          ["Not Executed", notExecutedCount.toString(), `${Math.round((notExecutedCount / testCases.length) * 100)}%`],
          ["Overall Pass Rate", passRate + "%", "-"],
          ["", "", ""],
          ["Total Bugs", bugs.length.toString(), "100%"],
          ["Open Bugs", openBugsCount.toString(), bugs.length > 0 ? `${Math.round((openBugsCount / bugs.length) * 100)}%` : "0%"],
          ["In Progress Bugs", inProgressBugsCount.toString(), bugs.length > 0 ? `${Math.round((inProgressBugsCount / bugs.length) * 100)}%` : "0%"],
          ["Resolved Bugs", resolvedBugsCount.toString(), bugs.length > 0 ? `${Math.round((resolvedBugsCount / bugs.length) * 100)}%` : "0%"],
          ["Closed Bugs", closedBugsCount.toString(), bugs.length > 0 ? `${Math.round((closedBugsCount / bugs.length) * 100)}%` : "0%"],
          ["", "", ""],
          ["Critical Bugs", criticalBugs.toString(), bugs.length > 0 ? `${Math.round((criticalBugs / bugs.length) * 100)}%` : "0%"],
          ["Major Bugs", majorBugs.toString(), bugs.length > 0 ? `${Math.round((majorBugs / bugs.length) * 100)}%` : "0%"],
          ["Minor Bugs", minorBugs.toString(), bugs.length > 0 ? `${Math.round((minorBugs / bugs.length) * 100)}%` : "0%"],
          ["Trivial Bugs", trivialBugs.toString(), bugs.length > 0 ? `${Math.round((trivialBugs / bugs.length) * 100)}%` : "0%"],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 }
        }
      });

      // Modules Section
      if (modules && modules.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text("MODULES OVERVIEW", 14, 20);

        const moduleData = modules.map(module => {
          const moduleTestCases = testCases.filter(tc => tc.moduleId === module.id);
          const moduleBugs = bugs.filter(bug => bug.moduleId === module.id);
          const modulePassedTests = moduleTestCases.filter(tc => tc.status === "Pass").length;
          const modulePassRate = moduleTestCases.length > 0 ? Math.round((modulePassedTests / moduleTestCases.length) * 100) : 0;

          return [
            module.name,
            module.description || "No description",
            moduleTestCases.length.toString(),
            `${modulePassRate}%`,
            moduleBugs.length.toString(),
            moduleBugs.filter(bug => bug.status === "Open").length.toString()
          ];
        });

        autoTable(doc, {
          startY: 30,
          head: [['Module Name', 'Description', 'Test Cases', 'Pass Rate', 'Total Bugs', 'Open Bugs']],
          body: moduleData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 45 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 }
          }
        });

        // Detailed Module Analysis
        modules.forEach((module, moduleIndex) => {
          const moduleTestCases = testCases.filter(tc => tc.moduleId === module.id);
          const moduleBugs = bugs.filter(bug => bug.moduleId === module.id);

          if (moduleTestCases.length > 0 || moduleBugs.length > 0) {
            doc.addPage();
            doc.setFontSize(14);
            doc.text(`MODULE: ${module.name}`, 14, 20);

            doc.setFontSize(10);
            doc.text(`Description: ${module.description || "No description"}`, 14, 30);

            let yPosition = 40;

            // Module Test Cases
            if (moduleTestCases.length > 0) {
              doc.setFontSize(12);
              doc.text("Test Cases", 14, yPosition);
              yPosition += 5;

              const moduleTestCaseData = moduleTestCases.map(tc => [
                tc.testCaseId || tc.id.toString(),
                tc.feature || tc.scenario || "No feature",
                tc.status,
                tc.priority,
                tc.assignedTo ? users?.find(u => u.id === tc.assignedTo)?.name || "Unassigned" : "Unassigned"
              ]);

              autoTable(doc, {
                startY: yPosition,
                head: [['ID', 'Feature/Scenario', 'Status', 'Priority', 'Assignee']],
                body: moduleTestCaseData,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [34, 197, 94] },
                columnStyles: {
                  0: { cellWidth: 25 },
                  1: { cellWidth: 60 },
                  2: { cellWidth: 30 },
                  3: { cellWidth: 25 },
                  4: { cellWidth: 30 }
                }
              });

              yPosition = (doc as any).lastAutoTable.finalY + 10;
            }

            // Module Bugs
            if (moduleBugs.length > 0) {
              if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
              }

              doc.setFontSize(12);
              doc.text("Bug Reports", 14, yPosition);
              yPosition += 5;

              const moduleBugData = moduleBugs.map(bug => [
                bug.bugId || bug.id.toString(),
                bug.title,
                bug.severity,
                bug.status,
                bug.assignedTo ? users?.find(u => u.id === bug.assignedTo)?.name || "Unassigned" : "Unassigned"
              ]);

              autoTable(doc, {
                startY: yPosition,
                head: [['ID', 'Title', 'Severity', 'Status', 'Assignee']],
                body: moduleBugData,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [239, 68, 68] },
                columnStyles: {
                  0: { cellWidth: 25 },
                  1: { cellWidth: 60 },
                  2: { cellWidth: 25 },
                  3: { cellWidth: 30 },
                  4: { cellWidth: 30 }
                }
              });
            }
          }
        });
      }

      // Complete Test Cases List
      doc.addPage();
      doc.setFontSize(16);
      doc.text("ALL TEST CASES", 14, 20);

      const testCaseData = testCases.map(tc => [
        tc.testCaseId || tc.id.toString(),
        modules?.find(m => m.id === tc.moduleId)?.name || "No Module",
        tc.feature || tc.scenario || "No feature",
        tc.status,
        tc.priority
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['ID', 'Module', 'Feature/Scenario', 'Status', 'Priority']],
        body: testCaseData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 60 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 }
        }
      });

      // Complete Bug Reports List
      doc.addPage();
      doc.setFontSize(16);
      doc.text("ALL BUG REPORTS", 14, 20);

      const bugData = bugs.map(bug => [
        bug.bugId || bug.id.toString(),
        modules?.find(m => m.id === bug.moduleId)?.name || "No Module",
        bug.title,
        bug.severity,
        bug.status
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['ID', 'Module', 'Title', 'Severity', 'Status']],
        body: bugData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 60 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 }
        }
      });

      // Summary and Recommendations
      doc.addPage();
      doc.setFontSize(16);
      doc.text("SUMMARY & RECOMMENDATIONS", 14, 20);

      doc.setFontSize(10);
      let summaryY = 35;

      doc.text(`Project ${selectedProject.name} Analysis:`, 14, summaryY);
      summaryY += 10;

      doc.text(`• Overall test execution is ${passRate}% complete with ${passedCount} tests passed out of ${testCases.length}.`, 14, summaryY);
      summaryY += 8;

      if (failedCount > 0) {
        doc.text(`• ${failedCount} test cases have failed and require attention.`, 14, summaryY);
        summaryY += 8;
      }

      if (blockedCount > 0) {
        doc.text(`• ${blockedCount} test cases are currently blocked and need resolution.`, 14, summaryY);
        summaryY += 8;
      }

      doc.text(`• There are ${bugs.length} total bugs reported with ${openBugsCount} still open.`, 14, summaryY);
      summaryY += 8;

      if (criticalBugs > 0) {
        doc.text(`• ${criticalBugs} critical bugs require immediate attention.`, 14, summaryY);
        summaryY += 8;
      }

      doc.text(`• Bug resolution rate: ${bugs.length > 0 ? Math.round(((resolvedBugsCount + closedBugsCount) / bugs.length) * 100) : 0}%`, 14, summaryY);

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

  // Count UI bugs (bugs with type or category UI)
  const uiBugs = bugs?.filter(bug => 
    (bug.type && bug.type.toLowerCase().includes('ui')) || 
    (bug.category && bug.category.toLowerCase().includes('ui')) ||
    (bug.tags && (bug.tags as any[]).some(tag => 
      typeof tag === 'string' 
        ? tag.toLowerCase().includes('ui') 
        : tag?.name?.toLowerCase().includes('ui')
    ))
  ).length || 0;

  // Count minor and major bugs
  const minorBugs = bugs?.filter(bug => bug.severity === "Minor" || bug.severity === "Trivial").length || 0;
  const majorBugs = bugs?.filter(bug => bug.severity === "Major" || bug.severity === "Critical").length || 0;

  const passRate = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;

  const handleConsolidatedReports = () => {
    setLocation("/reports/consolidated");
  };

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
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

            <div className="grid gap-6">
            {/* Project Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
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
                  Real-time Progress Dashboard
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Test Case Progress Bar */}<div>                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Test Case Execution Progress</span>
                      <span className="text-sm text-gray-500">{passRate}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(passedTestCases / totalTestCases) * 100}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-600 h-3 absolute top-0 transition-all duration-1000 ease-out"
                        style={{ 
                          left: `${(passedTestCases / totalTestCases) * 100}%`,
                          width: `${(failedTestCases / totalTestCases) * 100}%` 
                        }}
                      />
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 absolute top-0 transition-all duration-1000 ease-out"
                        style={{ 
                          left: `${((passedTestCases + failedTestCases) / totalTestCases) * 100}%`,
                          width: `${(blockedTestCases / totalTestCases) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Passed: {passedTestCases}</span>
                      <span>Failed: {failedTestCases}</span>
                      <span>Blocked: {blockedTestCases}</span>
                      <span>Not Executed: {notExecutedTestCases}</span>
                    </div>
                  </div>

                  {/* Bug Resolution Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Bug Resolution Progress</span>
                      <span className="text-sm text-gray-500">
                        {totalBugs > 0 ? Math.round(((resolvedBugs + closedBugs) / totalBugs) * 100) : 0}% Resolved
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${totalBugs > 0 ? ((resolvedBugs + closedBugs) / totalBugs) * 100 : 0}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 absolute top-0 transition-all duration-1000 ease-out"
                        style={{ 
                          left: `${totalBugs > 0 ? ((resolvedBugs + closedBugs) / totalBugs) * 100 : 0}%`,
                          width: `${totalBugs > 0 ? (inProgressBugs / totalBugs) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Resolved: {resolvedBugs + closedBugs}</span>
                      <span>In Progress: {inProgressBugs}</span>
                      <span>Open: {openBugs}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Test Execution Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {testStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={testStatusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                          {testStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No test case data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Case Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {testStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={testStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ percentage }) => `${percentage}%`}
                        >
                          {testStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No test case data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Test case stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Case Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {testStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={testStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {testStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No test case data available</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <div className="w-full grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <p className="font-medium dark:text-white">Passed</p>
                      <p className="text-gray-500 dark:text-gray-400">{passedTestCases}</p>
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">Failed</p>
                      <p className="text-gray-500 dark:text-gray-400">{failedTestCases}</p>
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">Blocked</p>
                      <p className="text-gray-500 dark:text-gray-400">{blockedTestCases}</p>
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">Not Executed</p>
                      <p className="text-gray-500 dark:text-gray-400">{notExecutedTestCases}</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Case Priority</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {testPriorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={testPriorityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {testPriorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No test case data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>



            {/* Bug stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bug Severity</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {bugSeverityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bugSeverityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {bugSeverityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No bug data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bug Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {bugStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bugStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {bugStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No bug data available</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <div className="w-full grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <p className="font-medium dark:text-white">Open</p>
                      <p className="text-gray-500 dark:text-gray-400">{openBugs}</p>
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">In Progress</p>
                      <p className="text-gray-500 dark:text-gray-400">{inProgressBugs}</p>
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">Resolved</p>
                      <p className="text-gray-500 dark:text-gray-400">{resolvedBugs}</p>
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">Closed</p>
                      <p className="text-gray-500 dark:text-gray-400">{closedBugs}</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  );
}