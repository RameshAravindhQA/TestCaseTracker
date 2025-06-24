import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TestCase, CSVTestCase } from "@/types";
import { Download, Upload, FileType } from "lucide-react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ImportExportProps {
  projectId: number;
  moduleId?: number;
  testCases: TestCase[];
  projectName?: string;
  moduleName?: string;
}

export function ImportExport({ projectId, moduleId, testCases, projectName, moduleName }: ImportExportProps) {
  const { toast } = useToast();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Generate a formatted date string for file names
  const getFormattedDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Import mutation
  const importTestCasesMutation = useMutation({
    mutationFn: async (testCases: CSVTestCase[]) => {
      const promises = testCases.map((testCase) => {
        // Handle module ID more carefully
        let finalModuleId: number | null = null;

        // If a module ID is provided in props, use that as it's pre-validated
        if (moduleId) {
          finalModuleId = moduleId;
        } 
        // Otherwise try to use the one from the CSV
        else if (testCase.moduleId) {
          try {
            const parsedId = parseInt(testCase.moduleId.toString());
            if (!isNaN(parsedId)) {
              finalModuleId = parsedId;
            }
          } catch (e) {
            // If parsing fails, leave finalModuleId as null
            console.error('Invalid module ID format:', testCase.moduleId);
          }
        }

        // If we still don't have a valid module ID, the request will fail
        // The server should handle this with proper validation
        return apiRequest("POST", `/api/projects/${projectId}/test-cases`, {
          ...testCase,
          moduleId: finalModuleId,
          projectId,
        });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Test cases have been imported successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
      setIsImportOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Export as CSV with ALL data
  const exportToCSV = () => {
    try {
      // Format test cases for CSV with ALL fields
      const csvData = testCases.map(testCase => ({
        testCaseId: testCase.testCaseId,
        moduleId: testCase.moduleId.toString(),
        feature: testCase.feature,
        testObjective: testCase.testObjective,
        preConditions: testCase.preConditions || "",
        testSteps: testCase.testSteps,
        expectedResult: testCase.expectedResult,
        actualResult: testCase.actualResult || "",
        status: testCase.status,
        priority: testCase.priority,
        severity: testCase.severity || "",
        assignedTo: testCase.assignedTo || "",
        createdBy: testCase.createdBy || "",
        createdAt: testCase.createdAt ? new Date(testCase.createdAt).toISOString() : "",
        updatedAt: testCase.updatedAt ? new Date(testCase.updatedAt).toISOString() : "",
        tags: testCase.tags || "",
        automationStatus: testCase.automationStatus || "",
        estimatedTime: testCase.estimatedTime || "",
        actualTime: testCase.actualTime || "",
        comments: testCase.comments || "",
        attachments: testCase.attachments ? JSON.stringify(testCase.attachments) : "",
        version: testCase.version || "",
        environment: testCase.environment || "",
        relatedBugs: testCase.relatedBugs ? JSON.stringify(testCase.relatedBugs) : "",
        relatedRequirements: testCase.relatedRequirements ? JSON.stringify(testCase.relatedRequirements) : "",
      }));

      // Generate CSV
      const csv = Papa.unparse(csvData);

      // Create download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);

      // Create a descriptive filename with project and module (if available)
      const dateStr = getFormattedDate();
      const projectStr = projectName ? projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : `project-${projectId}`;
      const moduleStr = moduleName && moduleId ? `-${moduleName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}` : '';
      const filename = `test-cases-${projectStr}${moduleStr}-${dateStr}.csv`;

      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: "Test cases have been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export test cases to CSV.",
        variant: "destructive",
      });
    }
  };

  // Export as PDF
  const exportToPDF = async () => {
    try {
      // Fetch bugs for this project/module if available
      let bugs: any[] = [];
      try {
        const queryParams = moduleId ? `?moduleId=${moduleId}` : '';
        const response = await apiRequest('GET', `/api/projects/${projectId}/bugs${queryParams}`);
        bugs = await response.json();
      } catch (error) {
        console.error('Failed to fetch bugs for PDF report:', error);
        // Continue without bugs
      }

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("Test Cases Report", 14, 20);

      // Add metadata
      doc.setFontSize(10);

      let currentY = 30;
      const lineSpacing = 5;

      // Add project information
      if (projectName) {
        doc.text(`Project: ${projectName}`, 14, currentY);
      } else {
        doc.text(`Project ID: ${projectId}`, 14, currentY);
      }
      currentY += lineSpacing;

      // Add module information if available
      if (moduleId) {
        if (moduleName) {
          doc.text(`Module: ${moduleName}`, 14, currentY);
        } else {
          doc.text(`Module ID: ${moduleId}`, 14, currentY);
        }
        currentY += lineSpacing;
      }

      // Add generation date
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, currentY);
      currentY += lineSpacing;

      // Add test case count
      doc.text(`Total Test Cases: ${testCases.length}`, 14, currentY);
      currentY += lineSpacing + 5; // Add extra space before table

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

      doc.text(`Status Summary:`, 14, currentY);
      currentY += lineSpacing;
      doc.text(`Pass: ${statusCounts.Pass} (${passRate}%) | Fail: ${statusCounts.Fail} | Blocked: ${statusCounts.Blocked} | Not Executed: ${statusCounts['Not Executed']}`, 14, currentY);
      currentY += lineSpacing + 5;

      // Add bugs count if available
      if (bugs.length > 0) {
        doc.text(`Bug Reports: ${bugs.length}`, 14, currentY);
        currentY += lineSpacing + 5;
      }

      // Test Cases section
      doc.setFontSize(14);
      doc.text("Test Cases", 14, currentY);
      currentY += lineSpacing + 5;

      // Prepare table data with ONLY ID, Feature, Objective, Tags, Status, Priority
      const tableData = testCases.map(tc => [
        tc.testCaseId,
        tc.feature,
        tc.testObjective,
        tc.tags || '',
        tc.status,
        tc.priority
      ]);

      // Add test cases table
      autoTable(doc, {
        head: [['Test Case ID', 'Feature', 'Objective', 'Tags', 'Status', 'Priority']],
        body: tableData,
        startY: currentY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }, // Primary color
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 60 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 }
        }
      });

      // Add bug reports section if there are bugs
      if (bugs.length > 0) {
        // Get the current y position after the test case table
        currentY = (doc as any).lastAutoTable.finalY + 20;

        // Start a new page if near the bottom
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(14);
        doc.text("Bug Reports", 14, currentY);
        currentY += lineSpacing + 5;

        // Prepare bug table data
        const bugTableData = bugs.map(bug => [
          bug.bugId,
          bug.title,
          bug.status,
          bug.severity,
          bug.priority
        ]);

        // Add bug table
        autoTable(doc, {
          head: [['Bug ID', 'Title', 'Status', 'Severity', 'Priority']],
          body: bugTableData,
          startY: currentY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [220, 53, 69] }, // Red color for bugs
        });
      }

      // Create a descriptive filename with project and module (if available)
      const dateStr = getFormattedDate();
      const projectStr = projectName ? projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : `project-${projectId}`;
      const moduleStr = moduleName && moduleId ? `-${moduleName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}` : '';
      const filename = `test-cases-${projectStr}${moduleStr}-${dateStr}.pdf`;

      // Save PDF
      doc.save(filename);

      toast({
        title: "Export successful",
        description: "Test cases and bug reports have been exported to PDF.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export test cases to PDF.",
        variant: "destructive",
      });
    }
  };

  // Download template for CSV imports
  const downloadTemplateCSV = async () => {
    try {
      // Get project prefix for template
      let projectPrefix = 'BEG';
      try {
        const projectResponse = await apiRequest('GET', `/api/projects/${projectId}`);
        const projectData = await projectResponse.json();
        projectPrefix = projectData.prefix || 'BEG';
      } catch (error) {
        console.warn('Could not fetch project prefix, using default:', error);
      }

      // Create template with all required columns and example data
      // Clearly marking REQUIRED vs OPTIONAL fields in the headers
      const templateData = [
        {
          testCaseId: `${projectPrefix}-REG-TC-001 (OPTIONAL - Generated automatically if not provided)`,
          moduleId: moduleId ? moduleId.toString() + " (REQUIRED - Current module ID is set automatically)" : "(REQUIRED - Module ID number)",
          feature: "Login Feature (REQUIRED)",
          testObjective: "Verify user can login with valid credentials (REQUIRED)",
          testSteps: "1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click login button (REQUIRED)",
          expectedResult: "User should be logged in and redirected to dashboard (REQUIRED)",
          actualResult: "(OPTIONAL - Results after execution)",
          status: "Not Executed (REQUIRED - Valid values: Not Executed, Pass, Fail, Blocked)",
          priority: "High (REQUIRED - Valid values: High, Medium, Low)",
          preConditions: "User account exists (OPTIONAL)",
          severity: "Medium (OPTIONAL - Valid values: Critical, Major, Minor, Trivial)",
          tags: "regression,smoke (OPTIONAL - comma separated)",
          automationStatus: "Not Automated (OPTIONAL - Valid values: Not Automated, Automated, In Progress)",
          estimatedTime: "30 minutes (OPTIONAL)",
          actualTime: "(OPTIONAL)",
          comments: "Example test case - replace with real data (OPTIONAL)",
          environment: "Production (OPTIONAL)",
          version: "1.0 (OPTIONAL)",
          attachments: "(OPTIONAL - Will be ignored in CSV import)",
          relatedBugs: "(OPTIONAL - Will be processed during import)"
        },
        {
          testCaseId: `${projectPrefix}-REG-TC-002`,
          moduleId: moduleId ? moduleId.toString() : "",
          feature: "Registration",
          testObjective: "Verify new user registration with valid information",
          testSteps: "1. Navigate to registration page\n2. Fill all required fields\n3. Click register button",
          expectedResult: "User account should be created and user should be logged in",
          actualResult: "",
          status: "Not Executed",
          priority: "Medium",
          preConditions: "User doesn't have an account",
          severity: "Major",
          tags: "regression",
          automationStatus: "Not Automated",
          estimatedTime: "45 minutes",
          actualTime: "",
          comments: "Example test case - replace with real data",
          environment: "Development",
          version: "1.0",
          attachments: "",
          relatedBugs: ""
        }
      ];

      // Add more information at the top of the CSV file as comments
      let csvText = `# Test Case Import Template for ${projectName || 'Project'}\n`;
      csvText += '# Generated on ' + new Date().toLocaleString() + '\n';
      csvText += '#\n# REQUIRED FIELDS:\n';
      csvText += '# - moduleId: Must be a valid module ID in the current project\n';
      csvText += '# - feature: Brief name of the feature being tested\n';
      csvText += '# - testObjective: What the test is trying to verify\n';
      csvText += '# - testSteps: Step-by-step instructions to execute the test\n';
      csvText += '# - expectedResult: What should happen when the test is passed\n';
      csvText += '# - status: Must be one of: "Not Executed", "Pass", "Fail", "Blocked"\n';
      csvText += '# - priority: Must be one of: "High", "Medium", "Low"\n';
      csvText += '#\n# TEST CASE ID FORMAT:\n';
      csvText += `# - testCaseId: Must follow format ${projectPrefix}-[MODULE]-TC-### (e.g., ${projectPrefix}-REG-TC-001)\n`;
      csvText += `# - PROJECT PREFIX: ${projectPrefix} (automatically applied)\n`;
      csvText += '# - MODULE PREFIX: 3-letter abbreviation of module name (e.g., REG for Registration)\n';
      csvText += '# - TC-###: Sequential test case number with 3 digits (001, 002, etc.)\n';
      csvText += '#\n# The template below contains example data. Please replace with your actual test cases.\n';
      csvText += '#\n';

      // Generate CSV and append our comments
      const csv = Papa.unparse(templateData);
      csvText += csv;

      // Create download link
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);

      // Create a descriptive filename
      const dateStr = getFormattedDate();
      const projectStr = projectName ? projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : `project-${projectId}`;
      const moduleStr = moduleName && moduleId ? `-${moduleName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}` : '';
      const filename = `test-cases-template-${projectStr}${moduleStr}-${dateStr}.csv`;

      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Template downloaded",
        description: "CSV template has been downloaded. Fill it with your test cases and import.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to generate template.",
        variant: "destructive",
      });
    }
  };

  // Download template for Excel imports
  const downloadTemplateExcel = () => {
    toast({
      title: "Excel template",
      description: "For Excel imports, please use the CSV template and save it as Excel format (.xlsx).",
    });
    downloadTemplateCSV();
  };

  // Handle file import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Just validate the file exists - we'll parse it when the user clicks "Import"
    toast({
      title: "File selected",
      description: `Selected ${file.name}. Click Import to continue.`,
    });
  };

  return (
    <>
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
        <Button
          variant="outline"
          onClick={exportToCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={exportToPDF}
          className="flex items-center gap-2"
        >
          <FileType className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Test Cases</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file with test cases. The file should have columns for feature, testObjective, testSteps, expectedResult, and moduleId.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="secondary" 
                onClick={downloadTemplateCSV}
                className="flex items-center gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Download CSV Template
              </Button>
              <Button 
                variant="secondary" 
                onClick={downloadTemplateExcel}
                className="flex items-center gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Download Excel Template
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file-upload">Select File (CSV, Excel)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                ref={fileRef}
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setIsImportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={importTestCasesMutation.isPending}
              onClick={() => {
                if (fileRef.current?.files?.length) {
                  // If a file is already selected, start import
                  const file = fileRef.current.files[0];
                  Papa.parse<CSVTestCase>(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results: Papa.ParseResult<CSVTestCase>) => {
                      const parsedData = results.data;

                      // Validate required fields
                      const invalidRows = parsedData.filter(
                        row => !row.feature || !row.testObjective || !row.testSteps || !row.expectedResult || !row.moduleId
                      );

                      if (invalidRows.length > 0) {
                        toast({
                          title: "Invalid file data",
                          description: `Found ${invalidRows.length} rows with missing required fields.`,
                          variant: "destructive",
                        });
                        return;
                      }

                      // Validate module IDs against available modules
                      // Use the current module ID from props if provided
                      const selectedModuleId = moduleId;
                      const validModuleIds = new Set<string>(); // Will be populated if we need to fetch modules

                      // Fetch valid module IDs for current project
                      const validateModuleIds = async () => {
                        try {
                          // If a specific module is provided in props, use it for strict validation
                          if (selectedModuleId) {
                            // Add the module ID from props to valid list
                            validModuleIds.add(selectedModuleId.toString());

                            // Strictly validate ALL rows have matching module IDs
                            const invalidModules = parsedData.filter(row => {
                              // Skip rows with missing moduleId - they'll be fixed later
                              if (!row.moduleId) return false;

                              // Check if the moduleId matches the selected module
                              return row.moduleId.toString() !== selectedModuleId.toString();
                            });

                            // If any rows have non-matching module IDs, show error and reject
                            if (invalidModules.length > 0) {
                              toast({
                                title: "Module ID mismatch",
                                description: `Found ${invalidModules.length} test cases with module IDs that don't match the current module. This operation only supports importing to the current module (ID: ${selectedModuleId}).`,
                                variant: "destructive",
                              });
                              return false;
                            }

                            // All valid, ensure all rows use the correct module ID
                            parsedData.forEach(row => {
                              row.moduleId = selectedModuleId.toString();
                            });

                            return true;
                          }

                          // Otherwise, fetch modules and validate
                          const response = await apiRequest(`/api/projects/${projectId}/modules`);
                          const modules = await response.json();

                          if (Array.isArray(modules)) {
                            if (modules.length === 0) {
                              toast({
                                title: "No modules found",
                                description: "This project doesn't have any modules. Please create a module first.",
                                variant: "destructive",
                              });
                              return false;
                            }

                            // Add all valid module IDs to the set
                            modules.forEach(module => {
                              validModuleIds.add(module.id.toString());
                            });

                            // If CSV has moduleId column, validate or correct those values
                            const firstModuleId = modules[0].id.toString();
                            let correctedModuleCount = 0;

                            parsedData.forEach(row => {
                              // If moduleId is missing or invalid, use the first module
                              if (!row.moduleId || !validModuleIds.has(row.moduleId.toString())) {
                                row.moduleId = firstModuleId;
                                correctedModuleCount++;
                              }
                            });

                            if (correctedModuleCount > 0) {
                              toast({
                                title: "Module IDs corrected",
                                description: `Corrected ${correctedModuleCount} rows with missing or invalid module IDs.`,
                              });
                            }

                            return true;
                          } else {
                            toast({
                              title: "Module validation failed",
                              description: "Could not retrieve modules from the server.",
                              variant: "destructive",
                            });
                            return false;
                          }
                        } catch (error) {
                          toast({
                            title: "Module validation failed",
                            description: `${error}`,
                            variant: "destructive",
                          });
                          return false;
                        }
                      };

                      // Check if modules are valid before proceeding
                      const modulesValid = await validateModuleIds();
                      if (!modulesValid) return;

                      // Get project and module information for validation
                      const project = await apiRequest('GET', `/api/projects/${projectId}`);
                      const projectData = await project.json();
                      const projectPrefix = projectData.prefix || 'DEF';

                      let currentModule = null;
                      if (moduleId) {
                        const moduleResponse = await apiRequest('GET', `/api/modules/${moduleId}`);
                        currentModule = await moduleResponse.json();
                      }

                      // Check for test case IDs that already exist in current test cases
                      const existingTestCaseIds = new Set(
                        Array.isArray(testCases) ? testCases.map(tc => tc?.testCaseId) : []
                      );
                      const duplicateIds: string[] = [];
                      const invalidFormatIds: string[] = [];
                      const newTestCases: CSVTestCase[] = [];

                      // Function to validate test case ID format
                      const validateTestCaseIdFormat = (testCaseId: string, modulePrefix: string): boolean => {
                        if (!testCaseId) return false;

                        // Expected format: PROJECT-MODULE-TC-###
                        const expectedPattern = new RegExp(`^${projectPrefix}-${modulePrefix}-TC-\\d{3}$`);
                        return expectedPattern.test(testCaseId);
                      };

                      // Function to get module prefix from module name
                      const getModulePrefix = (moduleName: string): string => {
                        const cleanModuleName = moduleName.replace(/[^a-zA-Z]/g, '');
                        let prefix = cleanModuleName.substring(0, 3).toUpperCase();
                        if (prefix.length < 3) {
                          prefix = prefix.padEnd(3, 'X');
                        }
                        return prefix;
                      };

                      // Process each row and separate duplicates from new test cases
                      parsedData.forEach((row, index) => {
                        let modulePrefix = 'MOD'; // Default

                        // Get module prefix from current module or try to determine from test case ID
                        if (currentModule) {
                          modulePrefix = getModulePrefix(currentModule.name);
                        } else if (row.testCaseId) {
                          // Try to extract module prefix from existing test case ID
                          const parts = row.testCaseId.split('-');
                          if (parts.length >= 3) {
                            modulePrefix = parts[1];
                          }
                        }

                        // Add generated testCaseId if missing
                        if (!row.testCaseId) {
                          // Find the highest existing number for this format
                          const prefixPattern = new RegExp(`^${projectPrefix}-${modulePrefix}-TC-(\\d+)$`);
                          const existingNumbers = Array.from(existingTestCaseIds)
                            .filter(id => id && prefixPattern.test(id))
                            .map(id => {
                              const match = id.match(prefixPattern);
                              return match ? parseInt(match[1], 10) : 0;
                            })
                            .filter(num => !isNaN(num));

                          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
                          row.testCaseId = `${projectPrefix}-${modulePrefix}-TC-${String(nextNumber).padStart(3, '0')}`;

                          // Add to existing set to avoid duplicates within this import
                          existingTestCaseIds.add(row.testCaseId);
                        } else {
                          // Validate existing test case ID format
                          if (!validateTestCaseIdFormat(row.testCaseId, modulePrefix)) {
                            invalidFormatIds.push(row.testCaseId);
                            return; // Skip this row
                          }
                        }

                        // Sanitize and standardize data
                        // Enforce status values
                        const validStatuses = ['Not Executed', 'Pass', 'Fail', 'Blocked'];
                        if (!validStatuses.includes(row.status)) {
                          row.status = 'Not Executed'; // Default to Not Executed for invalid statuses
                        }

                        // Enforce priority values
                        const validPriorities = ['High', 'Medium', 'Low'];
                        if (!validPriorities.includes(row.priority)) {
                          row.priority = 'Medium'; // Default to Medium for invalid priorities
                        }

                        // Ensure moduleId is valid if using the one from CSV
                        if (!moduleId && row.moduleId && !validModuleIds.has(row.moduleId)) {
                          // If we're here the validation earlier would have caught it,
                          // but this is an extra safety measure
                          toast({
                            title: "Invalid module ID corrected",
                            description: `Row ${index + 1}: Module ID ${row.moduleId} was invalid and has been corrected.`,
                          });

                          // Take the first valid module ID if available, otherwise mark as invalid
                          const firstValidModuleId = validModuleIds.size > 0 ? 
                            Array.from(validModuleIds)[0] : undefined;

                          if (firstValidModuleId) {
                            row.moduleId = firstValidModuleId;
                          } else {
                            // If no valid modules available, we should not get here due to earlier validation
                            return;
                          }
                        }

                        // Check if test case ID already exists
                        if (existingTestCaseIds.has(row.testCaseId)) {
                          duplicateIds.push(row.testCaseId);
                        } else {
                          newTestCases.push(row);
                          // Add to set to catch duplicates within the import file itself
                          existingTestCaseIds.add(row.testCaseId);
                        }
                      });

                      // Show validation errors
                      if (invalidFormatIds.length > 0) {
                        toast({
                          title: "Invalid test case ID format",
                          description: `${invalidFormatIds.length} test cases have invalid ID format. Expected format: ${projectPrefix}-[MODULE]-TC-### (e.g., ${projectPrefix}-REG-TC-001). Invalid IDs: ${invalidFormatIds.slice(0, 3).join(", ")}${invalidFormatIds.length > 3 ? ` and ${invalidFormatIds.length - 3} more` : ''}.`,
                          variant: "destructive",
                        });
                      }

                      // Warn about duplicate test case IDs
                      if (duplicateIds.length > 0) {
                        toast({
                          title: "Duplicate test case IDs",
                          description: `Skipped ${duplicateIds.length} test cases with IDs that already exist: ${duplicateIds.slice(0, 3).join(", ")}${duplicateIds.length > 3 ? ` and ${duplicateIds.length - 3} more` : ''}.`,
                        });
                      }

                      if (newTestCases.length === 0) {
                        const totalSkipped = duplicateIds.length + invalidFormatIds.length;
                        toast({
                          title: "No test cases to import",
                          description: totalSkipped > 0 
                            ? `All ${totalSkipped} test cases were skipped due to validation errors.`
                            : "All test case IDs already exist in the system.",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Import valid test cases
                      toast({
                        title: "Importing test cases",
                        description: `Importing ${newTestCases.length} new test cases...`,
                      });
                      importTestCasesMutation.mutate(newTestCases);
                    },
                    error: (error: Error) => {
                      toast({
                        title: "CSV parsing failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  });
                } else {
                  // If no file is selected yet, trigger the file input click
                  fileRef.current?.click();
                }
              }}
            >
              {importTestCasesMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}