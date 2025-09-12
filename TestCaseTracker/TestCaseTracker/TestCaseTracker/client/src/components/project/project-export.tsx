import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Download, FileType } from "lucide-react";
import * as XLSX from 'xlsx';
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

import Papa from 'papaparse';

interface ProjectExportProps {
  projectId: number;
  projectName: string;
}

export function ProjectExport({ projectId, projectName }: ProjectExportProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Generate a formatted date string for file names
  const getFormattedDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Export project to multi-sheet Excel file
  const exportToExcel = async () => {
    if (!projectId) {
      toast({
        title: "Export error",
        description: "Project ID is required",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Fetch data needed for the export
      const [projectRes, modulesRes, testCasesRes, bugsRes, statsRes] = await Promise.all([
        apiRequest("GET", `/api/projects/${projectId}`),
        apiRequest("GET", `/api/projects/${projectId}/modules`),
        apiRequest("GET", `/api/projects/${projectId}/test-cases`),
        apiRequest("GET", `/api/projects/${projectId}/bugs`),
        apiRequest("GET", `/api/dashboard/stats?projectId=${projectId}`),
      ]);

      const project = await projectRes.json();
      const modules = await modulesRes.json();
      const testCases = await testCasesRes.json();
      const bugs = await bugsRes.json();
      const stats = await statsRes.json();

      // Create workbook with summary sheet
      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Project Export Summary'],
        [''],
        ['Project Name:', project?.name || 'Unknown Project'],
        ['Description:', project?.description || 'N/A'],
        ['Export Date:', new Date().toLocaleDateString()],
        [''],
        ['Statistics:'],
        ['Total Test Cases:', stats.totalTestCases || 0],
        ['Passed Test Cases:', stats.passedTestCases || 0],
        ['Failed Test Cases:', stats.failedTestCases || 0],
        ['Pending Test Cases:', stats.pendingTestCases || 0],
        ['Total Bugs:', stats.totalBugs || 0],
        ['Open Bugs:', stats.openBugs || 0],
        ['Closed Bugs:', stats.closedBugs || 0],
        ['Total Modules:', modules.length || 0],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Add a sheet for all test cases
      if (testCases.length > 0) {
        const allTestCasesData = testCases.map(tc => ({
          'Test Case ID': tc.testCaseId,
          'Feature': tc.feature,
          'Status': tc.status,
          'Priority': tc.priority,
          'Module': modules.find(m => m.id === tc.moduleId)?.name || 'Unknown',
          'Objective': tc.testObjective,
          'Test Steps': tc.testSteps,
          'Expected Result': tc.expectedResult,
          'Actual Result': tc.actualResult || '',
          'Pre-Conditions': tc.preConditions || '',
          'Comments': tc.comments || '',
        }));

        const allTestCasesSheet = XLSX.utils.json_to_sheet(allTestCasesData);
        XLSX.utils.book_append_sheet(wb, allTestCasesSheet, 'All Test Cases');
      }

      // Add a sheet for all bugs
      if (bugs.length > 0) {
        const allBugsData = bugs.map(bug => ({
          'Bug ID': bug.bugId,
          'Title': bug.title,
          'Status': bug.status,
          'Severity': bug.severity,
          'Priority': bug.priority,
          'Module': modules.find(m => m.id === bug.moduleId)?.name || 'Unknown',
          'Reported Date': format(new Date(bug.dateReported), 'yyyy-MM-dd'),
          'Steps to Reproduce': bug.stepsToReproduce,
          'Expected Result': bug.expectedResult,
          'Actual Result': bug.actualResult,
          'Environment': bug.environment || '',
          'Pre-Conditions': bug.preConditions || '',
          'Comments': bug.comments || '',
        }));

        const allBugsSheet = XLSX.utils.json_to_sheet(allBugsData);
        XLSX.utils.book_append_sheet(wb, allBugsSheet, 'Bug Reports');
      }

      // Create sheets for each module's test cases
      if (modules && modules.length > 0) {
        for (const module of modules) {
          const moduleTestCases = testCases.filter(tc => tc.moduleId === module.id);

          if (moduleTestCases.length > 0) {
            const moduleData = moduleTestCases.map(tc => ({
              'Test Case ID': tc.testCaseId || '',
              'Feature': tc.feature || '',
              'Status': tc.status || 'Pending',
              'Priority': tc.priority || 'Medium',
              'Objective': tc.testObjective || '',
              'Test Steps': tc.testSteps || '',
              'Expected Result': tc.expectedResult || '',
              'Actual Result': tc.actualResult || '',
              'Pre-Conditions': tc.preConditions || '',
              'Comments': tc.comments || '',
            }));

            const moduleSheet = XLSX.utils.json_to_sheet(moduleData);
            // Truncate module name to avoid Excel sheet name limitations
            const safeModuleName = (module.name || 'Unknown Module').substring(0, 30);
            XLSX.utils.book_append_sheet(wb, moduleSheet, safeModuleName);
          }
        }
      }

      // If no modules, create a single sheet with all test cases
      if (!modules || modules.length === 0) {
        if (testCases && testCases.length > 0) {
          const allTestCasesData = testCases.map(tc => ({
            'Test Case ID': tc.testCaseId || '',
            'Feature': tc.feature || '',
            'Status': tc.status || 'Pending',
            'Priority': tc.priority || 'Medium',
            'Objective': tc.testObjective || '',
            'Test Steps': tc.testSteps || '',
            'Expected Result': tc.expectedResult || '',
            'Actual Result': tc.actualResult || '',
            'Pre-Conditions': tc.preConditions || '',
            'Comments': tc.comments || '',
          }));

          const testCasesSheet = XLSX.utils.json_to_sheet(allTestCasesData);
          XLSX.utils.book_append_sheet(wb, testCasesSheet, 'All Test Cases');
        }
      }

      // Generate Excel file
      const dateStr = getFormattedDate();
      const fileName = `${projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-export-${dateStr}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast({
        title: "Export successful",
        description: "Project data has been exported to Excel with multiple sheets.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the project data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    if (!projectId) {
        toast({
            title: "Export error",
            description: "Project ID is required",
            variant: "destructive",
        });
        return;
    }

    setIsExporting(true);

    try {
        // Fetch data needed for the export
        const [projectRes, modulesRes, testCasesRes, bugsRes] = await Promise.all([
            apiRequest("GET", `/api/projects/${projectId}`),
            apiRequest("GET", `/api/projects/${projectId}/modules`),
            apiRequest("GET", `/api/projects/${projectId}/test-cases`),
            apiRequest("GET", `/api/projects/${projectId}/bugs`),
        ]);

        const project = await projectRes.json();
        const modules = await modulesRes.json();
        const testCases = await testCasesRes.json();
        const bugs = await bugsRes.json();

        // Prepare project data
        const projectData = {
            project: {
                name: project.name,
                description: project.description || '',
                status: project.status,
                createdAt: project.createdAt,
                createdById: project.createdById
            },
            modules: modules.map(module => ({
                id: module.id,
                name: module.name,
                description: module.description || '',
                status: module.status,
                projectId: module.projectId,
                createdAt: module.createdAt
            })),
            testCases: testCases.map(tc => ({
                id: tc.id,
                testCaseId: tc.testCaseId || '',
                moduleId: tc.moduleId,
                moduleName: modules.find(m => m.id === tc.moduleId)?.name || '',
                feature: tc.feature,
                testObjective: tc.testObjective,
                preConditions: tc.preConditions || '',
                testSteps: tc.testSteps,
                expectedResult: tc.expectedResult,
                actualResult: tc.actualResult || '',
                status: tc.status,
                priority: tc.priority,
                tags: Array.isArray(tc.tags) ? tc.tags.join(';') : tc.tags || '',
                createdById: tc.createdById,
                assignedToId: tc.assignedToId,
                createdAt: tc.createdAt,
                updatedAt: tc.updatedAt
            })),
            bugs: bugs.map(bug => ({
                id: bug.id,
                bugId: bug.bugId || '',
                title: bug.title,
                description: bug.description || '',
                stepsToReproduce: bug.stepsToReproduce,
                expectedResult: bug.expectedResult,
                actualResult: bug.actualResult,
                severity: bug.severity,
                priority: bug.priority,
                status: bug.status,
                environment: bug.environment || '',
                projectId: bug.projectId,
                moduleId: bug.moduleId,
                moduleName: modules.find(m => m.id === bug.moduleId)?.name || '',
                testCaseId: bug.testCaseId,
                reportedById: bug.reportedById,
                assignedToId: bug.assignedToId,
                dateReported: bug.dateReported,
                updatedAt: bug.updatedAt
            }))
        };

        // Create CSV content
        const csvContent = [
            '# Project Export Data',
            `# Project: ${project.name}`,
            `# Exported on: ${new Date().toLocaleString()}`,
            '',
            '## Project Information',
            Papa.unparse([projectData.project]),
            '',
            '## Modules',
            Papa.unparse(projectData.modules),
            '',
            '## Test Cases',
            Papa.unparse(projectData.testCases),
            '',
            '## Bug Reports',
            Papa.unparse(projectData.bugs)
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Export Successful",
            description: "Project data has been exported to CSV successfully.",
        });
    } catch (error) {
        console.error('Export error:', error);
        toast({
            title: "Export Failed",
            description: "Failed to export project data to CSV.",
            variant: "destructive",
        });
    } finally {
        setIsExporting(false);
    }
};


  // Export project to PDF - Test Closure Report
  const exportToPDF = async () => {
    if (!projectId) {
      toast({
        title: "Export error",
        description: "Project ID is required",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Fetch data needed for the export
      const [projectRes, modulesRes, testCasesRes, bugsRes] = await Promise.all([
        apiRequest("GET", `/api/projects/${projectId}`),
        apiRequest("GET", `/api/projects/${projectId}/modules`),
        apiRequest("GET", `/api/projects/${projectId}/test-cases`),
        apiRequest("GET", `/api/projects/${projectId}/bugs`),
      ]);

      const project = await projectRes.json();
      const modules = await modulesRes.json();
      const testCases = await testCasesRes.json();
      const bugs = await bugsRes.json();

      const doc = new jsPDF();

      // Calculate test case statistics
      const testCaseStats = {
        total: testCases.length,
        passed: testCases.filter(tc => tc.status === "Pass").length,
        failed: testCases.filter(tc => tc.status === "Fail").length,
        blocked: testCases.filter(tc => tc.status === "Blocked").length,
        notExecuted: testCases.filter(tc => tc.status === "Not Executed").length,
      };

      const bugStats = {
        total: bugs.length,
        open: bugs.filter(bug => bug.status === "Open").length,
        inProgress: bugs.filter(bug => bug.status === "In Progress").length,
        resolved: bugs.filter(bug => bug.status === "Resolved").length,
        closed: bugs.filter(bug => bug.status === "Closed").length,
        critical: bugs.filter(bug => bug.severity === "Critical").length,
        major: bugs.filter(bug => bug.severity === "Major").length,
      };

      const passRate = testCaseStats.total > 0 ? Math.round((testCaseStats.passed / testCaseStats.total) * 100) : 0;

      // Cover page
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text("TEST CLOSURE REPORT", 105, 50, { align: 'center' });

      doc.setFontSize(20);
      doc.text(project.name, 105, 70, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 90, { align: 'center' });
      doc.text(`Status: ${project.status}`, 105, 100, { align: 'center' });

      if (project.description) {
        doc.setFontSize(10);
        doc.text("Description:", 14, 120);
        const splitDescription = doc.splitTextToSize(project.description, 180);
        doc.text(splitDescription, 14, 130);
      }

      // Add new page for executive summary
      doc.addPage();
      let currentY = 20;
      const lineSpacing = 5;

      // Executive Summary
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("EXECUTIVE SUMMARY", 14, currentY);
      currentY += 15;

      // Project overview box
      doc.setFillColor(240, 248, 255);
      doc.rect(14, currentY, 180, 45, 'F');

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('Project Overview', 18, currentY + 10);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Project Name: ${project.name}`, 18, currentY + 20);
      doc.text(`Total Modules: ${modules.length}`, 18, currentY + 25);
      doc.text(`Total Test Cases: ${testCaseStats.total}`, 18, currentY + 30);
      doc.text(`Test Pass Rate: ${passRate}%`, 18, currentY + 35);
      doc.text(`Total Bugs: ${bugStats.total} (Open: ${bugStats.open}, Resolved: ${bugStats.resolved})`, 18, currentY + 40);

      currentY += 55;

      // Test Execution Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Test Execution Summary", 14, currentY);
      currentY += 10;

      // Test case status chart representation
      const chartWidth = 160;
      const chartHeight = 20;
      let chartX = 14;

      if (testCaseStats.total > 0) {
        const passWidth = (testCaseStats.passed / testCaseStats.total) * chartWidth;
        const failWidth = (testCaseStats.failed / testCaseStats.total) * chartWidth;
        const blockedWidth = (testCaseStats.blocked / testCaseStats.total) * chartWidth;
        const notExecutedWidth = (testCaseStats.notExecuted / testCaseStats.total) * chartWidth;

        // Pass - Green
        if (passWidth > 0) {
          doc.setFillColor(34, 197, 94);
          doc.rect(chartX, currentY, passWidth, chartHeight, 'F');
          chartX += passWidth;
        }

        // Fail - Red
        if (failWidth > 0) {
          doc.setFillColor(239, 68, 68);
          doc.rect(chartX, currentY, failWidth, chartHeight, 'F');
          chartX += failWidth;
        }

        // Blocked - Orange
        if (blockedWidth > 0) {
          doc.setFillColor(251, 146, 60);
          doc.rect(chartX, currentY, blockedWidth, chartHeight, 'F');
          chartX += blockedWidth;
        }

        // Not Executed - Gray
        if (notExecutedWidth > 0) {
          doc.setFillColor(156, 163, 175);
          doc.rect(chartX, currentY, notExecutedWidth, chartHeight, 'F');
        }
      }

      currentY += 30;

      // Legend
      doc.setFontSize(9);
      let legendX = 14;

      doc.setFillColor(34, 197, 94);
      doc.rect(legendX, currentY, 8, 6, 'F');
      doc.text(`Pass (${testCaseStats.passed})`, legendX + 12, currentY + 4);
      legendX += 50;

      doc.setFillColor(239, 68, 68);
      doc.rect(legendX, currentY, 8, 6, 'F');
      doc.text(`Fail (${testCaseStats.failed})`, legendX + 12, currentY + 4);
      legendX += 50;

      doc.setFillColor(251, 146, 60);
      doc.rect(legendX, currentY, 8, 6, 'F');
      doc.text(`Blocked (${testCaseStats.blocked})`, legendX + 12, currentY + 4);
      legendX += 60;

      doc.setFillColor(156, 163, 175);
      doc.rect(legendX, currentY, 8, 6, 'F');
      doc.text(`Not Executed (${testCaseStats.notExecuted})`, legendX + 12, currentY + 4);

      currentY += 20;

      // Modules Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Modules Summary", 14, currentY);
      currentY += 10;

      modules.forEach((module, index) => {
        const moduleTestCases = testCases.filter(tc => tc.moduleId === module.id);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`${index + 1}. ${module.name} - ${moduleTestCases.length} test cases`, 18, currentY);
        currentY += 5;
      });

      // Add new page for detailed tables
      doc.addPage();
      currentY = 20;

      // Add project information
      doc.text(`Status: ${project.status}`, 14, currentY);
      currentY += lineSpacing;

      // Add description if available
      if (project.description) {
        doc.text(`Description: ${project.description}`, 14, currentY);
        currentY += lineSpacing;
      }

      // Add generation date
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, currentY);
      currentY += lineSpacing;

      // Add counts
      doc.text(`Total Modules: ${modules.length}`, 14, currentY);
      currentY += lineSpacing;

      doc.text(`Total Test Cases: ${testCases.length}`, 14, currentY);
      currentY += lineSpacing;

      doc.text(`Total Bugs: ${bugs.length}`, 14, currentY);
      currentY += lineSpacing + 5;

      // Add status counts
      const statusCounts = {
        Pass: testCases.filter(tc => tc.status === 'Pass').length,
        Fail: testCases.filter(tc => tc.status === 'Fail').length,
        Blocked: testCases.filter(tc => tc.status === 'Blocked').length,
        'Not Executed': testCases.filter(tc => tc.status === 'Not Executed').length,
      };

      // Calculate pass rate
      const passRate = testCases.length > 0
        ? Math.round((statusCounts.Pass / testCases.length) * 100)
        : 0;

      doc.text(`Test Case Status:`, 14, currentY);
      currentY += lineSpacing;
      doc.text(`Pass: ${statusCounts.Pass} (${passRate}%) | Fail: ${statusCounts.Fail} | Blocked: ${statusCounts.Blocked} | Not Executed: ${statusCounts['Not Executed']}`, 14, currentY);
      currentY += lineSpacing + 10;

      // Add modules section
      doc.setFontSize(14);
      doc.text("Modules", 14, currentY);
      currentY += lineSpacing + 5;

      // Add modules table
      if (modules.length > 0) {
        const modulesData = modules.map(module => [
          module.name,
          module.description || '',
          module.status,
          testCases.filter(tc => tc.moduleId === module.id).length.toString(),
          bugs.filter(bug => bug.moduleId === module.id).length.toString(),
        ]);

        autoTable(doc, {
          head: [['Module Name', 'Description', 'Status', 'Test Cases', 'Bugs']],
          body: modulesData,
          startY: currentY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [60, 60, 60] },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add test cases section
      doc.setFontSize(14);
      doc.text("Test Cases", 14, currentY);
      currentY += lineSpacing + 5;

      // Add test cases table (all test cases)
      if (testCases.length > 0) {
        const testCasesData = testCases.map(tc => [
          tc.testCaseId,
          tc.feature,
          modules.find(m => m.id === tc.moduleId)?.name || 'Unknown',
          tc.status,
          tc.priority,
        ]);

        autoTable(doc, {
          head: [['ID', 'Feature', 'Module', 'Status', 'Priority']],
          body: testCasesData,
          startY: currentY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
          didDrawPage: (data) => {
            // If we're at the end of a page, add header info to the new page
            doc.setFontSize(10);
            doc.text(`Project: ${project.name} - Test Cases`, data.settings.margin.left, 10);
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add bugs section
      doc.setFontSize(14);
      doc.text("Bug Reports", 14, currentY);
      currentY += lineSpacing + 5;

      // Add bugs table
      if (bugs.length > 0) {
        const bugsData = bugs.map(bug => [
          bug.bugId,
          bug.title,
          modules.find(m => m.id === bug.moduleId)?.name || 'Unknown',
          bug.status,
          bug.severity,
          bug.priority,
        ]);

        autoTable(doc, {
          head: [['ID', 'Title', 'Module', 'Status', 'Severity', 'Priority']],
          body: bugsData,
          startY: currentY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [220, 53, 69] },
          didDrawPage: (data) => {
            // If we're at the end of a page, add header info to the new page
            doc.setFontSize(10);
            doc.text(`Project: ${project.name} - Bug Reports`, data.settings.margin.left, 10);
          }
        });
      }

      // Create a descriptive filename
      const dateStr = getFormattedDate();
      const safeName = project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `${safeName}-project-report-${dateStr}.pdf`;

      // Save PDF
      doc.save(filename);

      toast({
        title: "Export successful",
        description: "Project report has been exported to PDF.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the project report.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={exportToExcel}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export Project CSV
      </Button>
      <Button
        variant="outline"
        onClick={exportToPDF}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        <FileType className="h-4 w-4" />
        Export Project PDF
      </Button>
    </div>
  );
}