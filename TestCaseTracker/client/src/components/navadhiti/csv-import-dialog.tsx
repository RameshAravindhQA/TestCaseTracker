
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface CSVImportDialogProps {
  onClose: () => void;
}

export function CSVImportDialog({ onClose }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (csvData: any[]) => {
      const res = await apiRequest("POST", "/api/navadhiti-projects/import", { csvData });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Import successful", 
        description: `Imported ${data.imported} projects successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      onClose();
    },
    onError: () => {
      toast({ title: "Import failed", variant: "destructive" });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast({ title: "Please select a valid CSV file", variant: "destructive" });
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const rowData: any = {};

        headers.forEach((header, index) => {
          const value = values[index] || '';
          
          // Map CSV headers to database fields
          switch (header.toLowerCase()) {
            case 'project name':
              rowData.projectName = value;
              break;
            case 'overall project activity':
              rowData.overallProjectActivity = value;
              break;
            case 'current sprint':
              rowData.currentSprint = value;
              break;
            case 'current issues':
              rowData.currentIssues = value;
              break;
            case 'weekly comms':
              rowData.weeklyComms = value;
              break;
            case 'immediate action items':
              rowData.immediateActionItems = value;
              break;
            case 'support required':
              rowData.supportRequired = value;
              break;
            case 'additional remarks / inputs':
            case 'additional remarks':
              rowData.additionalRemarks = value;
              break;
            case 'activity status':
              rowData.activityStatus = parseInt(value) || 0;
              break;
            case 'sprint status':
              rowData.sprintStatus = parseInt(value) || 0;
              break;
            case 'communication status':
              rowData.communicationStatus = parseInt(value) || 0;
              break;
            default:
              // Handle any other fields directly
              const camelCase = header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
              rowData[camelCase] = value;
              break;
          }
        });

        if (rowData.projectName) {
          data.push(rowData);
        }
      }
    }

    return data;
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: "Please select a file first", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);

        if (parsedData.length === 0) {
          toast({ title: "No valid data found in CSV", variant: "destructive" });
          setIsProcessing(false);
          return;
        }

        console.log("Parsed CSV data:", parsedData);
        importMutation.mutate(parsedData);
        setIsProcessing(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error reading file:", error);
      toast({ title: "Error reading file", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Select CSV File
        </label>
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV file with project data. Download the template to see the expected format.
        </p>
      </div>

      {file && (
        <div className="bg-muted p-3 rounded">
          <p className="text-sm">
            <strong>Selected file:</strong> {file.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Size: {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!file || isProcessing || importMutation.isPending}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing || importMutation.isPending ? "Importing..." : "Import"}
        </Button>
      </div>
    </div>
  );
}
