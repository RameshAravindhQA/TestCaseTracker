import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Papa from "papaparse";
import { format } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";

// Type for CSV bug data
interface CSVBug {
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: string;
  priority: string;
  status: string;
  projectId?: string;
  moduleId?: string;
  assignedToId?: string;
  environment?: string;
  browserInfo?: string;
  operatingSystem?: string;
  deviceInfo?: string;
  tags?: string;
}

// Helper function to format current date for filenames
const getFormattedDate = () => {
  return format(new Date(), "yyyy-MM-dd");
};

interface BugImportProps {
  projectId?: number;
  moduleId?: number;
  onSuccess?: () => void;
}

export function BugImport({ projectId, moduleId, onSuccess }: BugImportProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Import bugs mutation
  const importBugsMutation = useMutation({
    mutationFn: async (bugs: CSVBug[]) => {
      const result = await apiRequest("POST", "/api/bugs/import", { 
        bugs,
        projectId,
        moduleId
      });
      return await result.json();
    },
    onSuccess: (data) => {
      setIsImportOpen(false);
      if (fileRef.current) fileRef.current.value = "";
      
      // Invalidate bug queries
      queryClient.invalidateQueries({ queryKey: ['/api/bugs'] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'bugs'] });
      
      toast({
        title: "Bugs imported successfully",
        description: `Imported ${data.length} bugs.`,
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Download template for CSV imports
  const downloadTemplateCSV = () => {
    try {
      // Create template with all required columns and example data
      // REQUIRED fields are marked in the template data
      const templateData = [
        {
          title: "Bug Title (REQUIRED)",
          description: "Bug Description (REQUIRED)",
          stepsToReproduce: "1. Navigate to page\n2. Click button\n3. Observe error (REQUIRED)",
          severity: "Medium (REQUIRED - Valid values: Low, Medium, High, Critical)",
          priority: "Medium (REQUIRED - Valid values: Low, Medium, High)",
          status: "Open (REQUIRED - Valid values: Open, In Progress, Resolved, Closed)",
          projectId: projectId ? projectId.toString() : "(REQUIRED - If not importing into a project)",
          moduleId: moduleId ? moduleId.toString() : "(OPTIONAL)",
          assignedToId: "(OPTIONAL - User ID)",
          environment: "Test Environment (OPTIONAL)",
          browserInfo: "Chrome 96.0.4664.93 (OPTIONAL)",
          operatingSystem: "Windows 10 (OPTIONAL)",
          deviceInfo: "Desktop (OPTIONAL)",
          tags: "ui,validation,regression (OPTIONAL - comma separated)"
        },
        {
          title: "Login button doesn't respond on mobile devices",
          description: "The login button doesn't respond to taps on mobile devices, making it impossible to log in from mobile browsers.",
          stepsToReproduce: "1. Access the login page from a mobile device\n2. Enter valid credentials\n3. Tap the login button\n4. Observe that nothing happens",
          severity: "High",
          priority: "High",
          status: "Open",
          projectId: projectId ? projectId.toString() : "",
          moduleId: moduleId ? moduleId.toString() : "",
          assignedToId: "",
          environment: "Production",
          browserInfo: "Mobile Safari",
          operatingSystem: "iOS 15",
          deviceInfo: "iPhone 13",
          tags: "mobile,login,ui"
        }
      ];
      
      // Generate CSV
      const csv = Papa.unparse(templateData);
      
      // Create download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bug-import-template-${getFormattedDate()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Template downloaded",
        description: "CSV template has been downloaded. Fill it with your bugs and import.",
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
      <Button
        variant="outline"
        onClick={() => setIsImportOpen(true)}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Import Bugs
      </Button>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Bugs</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file with bugs. The file must include title, description, steps to reproduce, status, severity, and priority columns.
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
              disabled={importBugsMutation.isPending}
              onClick={() => {
                if (fileRef.current?.files?.length) {
                  // If a file is already selected, start import
                  const file = fileRef.current.files[0];
                  Papa.parse<CSVBug>(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results: Papa.ParseResult<CSVBug>) => {
                      const parsedData = results.data;
                      
                      // Validate required fields
                      const invalidRows = parsedData.filter(
                        row => !row.title || !row.description || !row.stepsToReproduce || 
                             !row.status || !row.severity || !row.priority
                      );
                      
                      if (invalidRows.length > 0) {
                        toast({
                          title: "Invalid file data",
                          description: `Found ${invalidRows.length} rows with missing required fields.`,
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Validate status values
                      const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
                      const invalidStatuses = parsedData
                        .filter(row => !validStatuses.includes(row.status))
                        .map(row => `"${row.title}" has invalid status "${row.status}"`);
                        
                      if (invalidStatuses.length > 0) {
                        toast({
                          title: "Invalid status values",
                          description: `${invalidStatuses.slice(0, 3).join(", ")}${invalidStatuses.length > 3 ? ` and ${invalidStatuses.length - 3} more` : ''}.`,
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Validate severity values
                      const validSeverities = ["Low", "Medium", "High", "Critical"];
                      const invalidSeverities = parsedData
                        .filter(row => !validSeverities.includes(row.severity))
                        .map(row => `"${row.title}" has invalid severity "${row.severity}"`);
                        
                      if (invalidSeverities.length > 0) {
                        toast({
                          title: "Invalid severity values",
                          description: `${invalidSeverities.slice(0, 3).join(", ")}${invalidSeverities.length > 3 ? ` and ${invalidSeverities.length - 3} more` : ''}.`,
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Validate priority values
                      const validPriorities = ["Low", "Medium", "High"];
                      const invalidPriorities = parsedData
                        .filter(row => !validPriorities.includes(row.priority))
                        .map(row => `"${row.title}" has invalid priority "${row.priority}"`);
                        
                      if (invalidPriorities.length > 0) {
                        toast({
                          title: "Invalid priority values",
                          description: `${invalidPriorities.slice(0, 3).join(", ")}${invalidPriorities.length > 3 ? ` and ${invalidPriorities.length - 3} more` : ''}.`,
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Process each bug
                      const processedBugs = parsedData.map(bug => {
                        // Clean up template headers if present
                        const cleanTitle = bug.title.replace(/\s*\(REQUIRED\)$/i, "");
                        const cleanDescription = bug.description.replace(/\s*\(REQUIRED\)$/i, "");
                        const cleanSteps = bug.stepsToReproduce.replace(/\s*\(REQUIRED\)$/i, "");
                        const cleanStatus = bug.status.replace(/\s*\(REQUIRED.*\)$/i, "");
                        const cleanSeverity = bug.severity.replace(/\s*\(REQUIRED.*\)$/i, "");
                        const cleanPriority = bug.priority.replace(/\s*\(REQUIRED.*\)$/i, "");
                        
                        return {
                          ...bug,
                          title: cleanTitle,
                          description: cleanDescription,
                          stepsToReproduce: cleanSteps,
                          status: cleanStatus,
                          severity: cleanSeverity,
                          priority: cleanPriority,
                        };
                      });
                      
                      // Import bugs
                      toast({
                        title: "Importing bugs",
                        description: `Importing ${processedBugs.length} bugs...`,
                      });
                      importBugsMutation.mutate(processedBugs);
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
              {importBugsMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}