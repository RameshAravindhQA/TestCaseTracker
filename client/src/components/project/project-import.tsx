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
import { Download, Upload } from "lucide-react";
import Papa from "papaparse";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Define CSV Project type
interface CSVProject {
  name: string;
  description: string;
  status: string;
  client?: string;
  tags?: string;
  version?: string;
  repository?: string;
  priority?: string;
  budget?: string;
  teamMembers?: string;
}

interface ProjectImportProps {}

export function ProjectImport({}: ProjectImportProps) {
  const { toast } = useToast();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Generate a formatted date string for file names
  const getFormattedDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Import mutation
  const importProjectsMutation = useMutation({
    mutationFn: async (projects: CSVProject[]) => {
      const promises = projects.map((project) => {
        return apiRequest("POST", "/api/projects", project);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Projects have been imported successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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

  // Download template for CSV imports
  const downloadTemplateCSV = (templateType = 'project') => {
    try {
      let templateData = [];
      let testCaseHeaderTemplate = [];
      let filename = '';
      
      if (templateType === 'project') {
        // Project template
        templateData = [
          {
            name: "Project Name (REQUIRED)",
            description: "Project Description (REQUIRED)",
            status: "Active (REQUIRED - Valid values: Active, On Hold, Completed, Cancelled)",
            client: "Client Name (OPTIONAL)",
            tags: "tag1,tag2,tag3 (OPTIONAL - comma separated)",
            version: "1.0 (OPTIONAL)",
            repository: "https://github.com/example/repo (OPTIONAL)",
            priority: "High (OPTIONAL - Valid values: High, Medium, Low)",
            budget: "10000 (OPTIONAL)",
            teamMembers: "John Doe, Jane Smith (OPTIONAL - comma separated)"
          },
          {
            name: "Second Example Project",
            description: "This is another example project to demonstrate CSV format",
            status: "On Hold",
            client: "Example Corp",
            tags: "frontend,api,documentation",
            version: "2.0",
            repository: "https://github.com/example/project2",
            priority: "Medium",
            budget: "15000",
            teamMembers: "Alice Johnson, Bob Williams"
          }
        ];
        
        // Add test case template headers in second sheet
        testCaseHeaderTemplate = [
          {
            testCaseId: "TC-ID (OPTIONAL - Generated automatically if not provided)",
            moduleId: "MODULE ID (REQUIRED)",
            feature: "FEATURE NAME (REQUIRED)",
            testObjective: "TEST OBJECTIVE (REQUIRED)",
            testSteps: "TEST STEPS (REQUIRED)",
            expectedResult: "EXPECTED RESULT (REQUIRED)",
            actualResult: "ACTUAL RESULT (OPTIONAL)",
            status: "STATUS (REQUIRED - Valid values: Not Executed, Pass, Fail, Blocked)",
            priority: "PRIORITY (REQUIRED - Valid values: High, Medium, Low)",
            preConditions: "PRE-CONDITIONS (OPTIONAL)",
            severity: "SEVERITY (OPTIONAL - Valid values: Critical, Major, Minor, Trivial)",
            tags: "TAGS (OPTIONAL - comma separated)",
            assignedTo: "ASSIGNED TO (OPTIONAL)",
            createdBy: "CREATED BY (OPTIONAL)",
            automationStatus: "AUTOMATION STATUS (OPTIONAL - Yes, No)"
          }
        ];
        
        filename = `project-import-template-${getFormattedDate()}.csv`;
      } 
      else if (templateType === 'module') {
        // Module template
        templateData = [
          {
            name: "Module Name (REQUIRED)",
            description: "Module Description (REQUIRED)",
            status: "Active (REQUIRED - Valid values: Active, On Hold, Completed)",
            projectId: projectId.toString() + " (REQUIRED - Current project ID is set automatically)"
          },
          {
            name: "Authentication Module",
            description: "Handles all authentication related functionality",
            status: "Active",
            projectId: projectId.toString()
          },
          {
            name: "Dashboard Module",
            description: "Manages all dashboard components and data visualization",
            status: "On Hold",
            projectId: projectId.toString()
          }
        ];
        filename = `module-import-template-${getFormattedDate()}.csv`;
      }
      else if (templateType === 'testcase') {
        // Test Case template
        templateData = [
          {
            testCaseId: "TC-001 (OPTIONAL - Generated automatically if not provided)",
            moduleId: "(REQUIRED - Module ID number)",
            feature: "Login Feature (REQUIRED)",
            testObjective: "Verify user can login with valid credentials (REQUIRED)",
            testSteps: "1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click login button (REQUIRED)",
            expectedResult: "User should be logged in and redirected to dashboard (REQUIRED)",
            actualResult: "(OPTIONAL - Results after execution)",
            status: "Not Executed (REQUIRED - Valid values: Not Executed, Pass, Fail, Blocked)",
            priority: "High (REQUIRED - Valid values: High, Medium, Low)",
            preConditions: "User account exists (OPTIONAL)",
            severity: "Medium (OPTIONAL - Valid values: Critical, Major, Minor, Trivial)",
            tags: "regression,smoke (OPTIONAL - comma separated)"
          },
          {
            testCaseId: "TC-002",
            moduleId: "",
            feature: "Registration",
            testObjective: "Verify new user registration with valid information",
            testSteps: "1. Navigate to registration page\n2. Fill all required fields\n3. Click register button",
            expectedResult: "User account should be created and user should be logged in",
            actualResult: "",
            status: "Not Executed",
            priority: "Medium",
            preConditions: "User doesn't have an account",
            severity: "Major",
            tags: "regression"
          }
        ];
        filename = `testcase-import-template-${getFormattedDate()}.csv`;
      }
      
      // Generate CSV
      let csv = '';
      
      if (templateType === 'project') {
        // For project template, add both project data and test case headers
        csv = Papa.unparse(templateData);
        
        // Add separator and test case template headers
        csv += "\n\n\n=== TEST CASE TEMPLATE HEADERS ===\n\n";
        csv += Papa.unparse(testCaseHeaderTemplate);
        
        // Create download link
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Combined template downloaded",
          description: "CSV template has been downloaded with project templates in the first section and test case headers in the second section.",
        });
      } else {
        csv = Papa.unparse(templateData);
        
        // Create download link
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Template downloaded",
          description: `CSV template has been downloaded. Fill it with your ${templateType} data and import.`,
        });
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to generate template.",
        variant: "destructive",
      });
    }
  };
  
  // Download template for Excel imports
  const downloadTemplateExcel = (templateType = 'project') => {
    toast({
      title: "Excel template",
      description: "For Excel imports, please use the CSV template and save it as Excel format (.xlsx).",
    });
    downloadTemplateCSV(templateType);
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
      <Button
        variant="outline"
        onClick={() => setIsImportOpen(true)}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Import Projects
      </Button>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Projects</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file with projects. The file must include name, description, and status columns.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <Button 
                  variant="secondary" 
                  onClick={() => downloadTemplateCSV('project')}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  Download CSV Template
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => downloadTemplateExcel('project')}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  Download Excel Template
                </Button>
              </div>
            </div>
            
            <div className="grid gap-2 mt-3">
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
              disabled={importProjectsMutation.isPending}
              onClick={() => {
                if (fileRef.current?.files?.length) {
                  // If a file is already selected, start import
                  const file = fileRef.current.files[0];
                  Papa.parse<CSVProject>(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results: Papa.ParseResult<CSVProject>) => {
                      const parsedData = results.data;
                      
                      // Validate required fields
                      const invalidRows = parsedData.filter(
                        row => !row.name || !row.description || !row.status
                      );
                      
                      if (invalidRows.length > 0) {
                        toast({
                          title: "Invalid file data",
                          description: `Found ${invalidRows.length} rows with missing required fields (name, description, status).`,
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Validate status values
                      const validStatuses = ["Active", "On Hold", "Completed", "Cancelled"];
                      const invalidStatuses = parsedData
                        .filter(row => !validStatuses.includes(row.status))
                        .map(row => `"${row.name}" has invalid status "${row.status}"`);
                        
                      if (invalidStatuses.length > 0) {
                        toast({
                          title: "Invalid status values",
                          description: `${invalidStatuses.slice(0, 3).join(", ")}${invalidStatuses.length > 3 ? ` and ${invalidStatuses.length - 3} more` : ''}.`,
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Process each project
                      const processedProjects = parsedData.map(project => {
                        // Clean up template headers if present
                        const cleanName = project.name.replace(/\s*\(REQUIRED\)$/i, "");
                        const cleanDescription = project.description.replace(/\s*\(REQUIRED\)$/i, "");
                        const cleanStatus = project.status.replace(/\s*\(REQUIRED.*\)$/i, "");
                        
                        return {
                          ...project,
                          name: cleanName,
                          description: cleanDescription,
                          status: cleanStatus,
                        };
                      });
                      
                      // Import projects
                      toast({
                        title: "Importing projects",
                        description: `Importing ${processedProjects.length} projects...`,
                      });
                      importProjectsMutation.mutate(processedProjects);
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
              {importProjectsMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}