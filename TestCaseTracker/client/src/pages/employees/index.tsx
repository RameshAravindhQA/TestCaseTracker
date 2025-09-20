import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Download, Upload, FileText, Users, Mail, Phone, MapPin, Calendar, Edit, Trash2, Search, Filter, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// Modified EmployeesPage component with CSV import/export and PDF export functionality
export default function EmployeesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [technologyFilter, setTechnologyFilter] = useState("");
  const [projectMappingEmployee, setProjectMappingEmployee] = useState(null);
  const { toast } = useToast();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);


  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      return res.json();
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Employee deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    },
    onError: () => {
      toast({ title: "Failed to delete employee", variant: "destructive" });
    },
  });

  const calculateExperience = (joiningDate: string) => {
    if (!joiningDate) return "N/A";

    const joining = new Date(joiningDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joining.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return "Less than a month";
    }
  };

  const filteredEmployees = employees.filter((employee: any) => {
    const searchMatch = `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.employeeId}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const departmentMatch = !departmentFilter || employee.department === departmentFilter;
    
    const technologyMatch = !technologyFilter || 
      (Array.isArray(employee.technologies) && 
       employee.technologies.some((tech: string) => tech.toLowerCase().includes(technologyFilter.toLowerCase())));
    
    return searchMatch && departmentMatch && technologyMatch;
  });

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle file selection (don't auto-import)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
      setSelectedFile(file);
      toast({
        title: "File selected",
        description: `Selected ${file.name}. Click Import to continue.`,
      });
    } else {
      setSelectedFile(null);
      toast({
        title: "Invalid file format",
        description: "Please select a CSV or Excel file",
        variant: "destructive",
      });
    }
  };

  const importEmployees = async (data: any[]) => {
    try {
      // Format data for bulk import
      const employeesToImport = data
        .filter(row => row.firstName && row.lastName && row.email)
        .map(row => ({
          employeeId: row.employeeId || `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone || '',
          department: row.department || '',
          designation: row.designation || '',
          joiningDate: row.joiningDate || new Date().toISOString(),
          status: row.status || 'Active',
          technologies: row.technologies 
                        ? (typeof row.technologies === 'string' 
                           ? row.technologies.split(',').map(t => t.trim()).filter(t => t.length > 0)
                           : Array.isArray(row.technologies) ? row.technologies : [])
                        : [],
        }));

      if (employeesToImport.length === 0) {
        toast({
          title: "No valid data",
          description: "No valid employees found to import. Please check your data.",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest("POST", "/api/employees/import", {
        employees: employeesToImport
      });

      const result = await response.json();

      toast({
        title: "Import completed",
        description: `${result.successCount} employees imported successfully. ${result.errorCount} failed.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "Error importing employees",
        variant: "destructive",
      });
    }
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const template = [
      {
        employeeId: "EMP001",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@company.com",
        phone: "1234567890",
        department: "Development",
        designation: "Software Engineer",
        joiningDate: "2024-01-01",
        status: "Active",
        technologies: "React,Node.js,TypeScript"
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'employees_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!employees || employees.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no employees to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = filteredEmployees.map(emp => ({
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone || '',
        department: emp.department || '',
        designation: emp.designation || '',
        joiningDate: emp.joiningDate ? format(new Date(emp.joiningDate), 'yyyy-MM-dd') : '',
        status: emp.status,
        technologies: Array.isArray(emp.technologies) ? emp.technologies.join(', ') : emp.technologies || ''
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `employees_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: "Employees data exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Error exporting employees data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!employees || employees.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no employees to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text('Employee Directory', 14, 20);

      // Add metadata
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 30);
      doc.text(`Total Employees: ${filteredEmployees.length}`, 14, 35);

      // Prepare table data
      const tableData = filteredEmployees.map(emp => [
        emp.employeeId,
        `${emp.firstName} ${emp.lastName}`,
        emp.email,
        emp.phone || '',
        emp.department || '',
        emp.designation || '',
        emp.status,
        Array.isArray(emp.technologies) ? emp.technologies.join(', ') : emp.technologies || ''
      ]);

      // Add table
      autoTable(doc, {
        head: [['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Status', 'Technologies']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 60, 60] },
        columnStyles: {
          7: { cellWidth: 30 } // Technologies column
        }
      });

      // Save PDF
      doc.save(`employees_export_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: "Export successful",
        description: "Employees data exported to PDF",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Error exporting employees data to PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file import
  const handleImport = async (file: File) => {
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/employees/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Import Successful",
            description: `Imported ${result.imported} employees successfully`,
          });

          if (result.errors && result.errors.length > 0) {
            console.warn('Import warnings:', result.errors);
            toast({
              title: "Import Warnings",
              description: `${result.errors.length} rows had issues. Check console for details.`,
              variant: "destructive",
            });
          }

          refetch();
          setIsImportDialogOpen(false);
        } else {
          toast({
            title: "Import Failed",
            description: result.message || "Failed to import employees",
            variant: "destructive",
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: "Import Failed",
          description: error.message || "Failed to import employees",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "An error occurred while importing employees",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Catalyst Management</h1>
              <p className="text-muted-foreground">
                Manage employees and project assignments
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Employees</DialogTitle>
              <DialogDescription className="space-y-2">
                <p>Upload a CSV file with employee data. Download the template to see the required format.</p>
                <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                  <strong>Required Fields:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li><strong>firstName</strong> - Employee's first name</li>
                    <li><strong>email</strong> - Valid email address</li>
                  </ul>
                  <strong className="mt-2 block">Optional Fields:</strong>
                  <ul className="list-disc list-inside mt-1 text-xs">
                    <li>lastName, phoneNumber, department, designation</li>
                    <li>joiningDate, status, technologies, locality, overallExperience</li>
                  </ul>
                  <p className="mt-2 text-xs"><strong>Note:</strong> Multiple column name formats are supported (e.g., firstName, first_name, FirstName, First Name)</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Create and download a template CSV
                  const template = `firstName,lastName,email,phoneNumber,department,designation,joiningDate,status,technologies,locality,overallExperience
John,Doe,john.doe@company.com,1234567890,Engineering,Software Developer,2024-01-15,Active,"JavaScript,React,Node.js",New York,3 years
Jane,Smith,jane.smith@company.com,0987654321,Marketing,Marketing Manager,2023-06-01,Active,"Digital Marketing,SEO",Los Angeles,5 years
Mike,Johnson,mike.johnson@company.com,5551234567,Sales,Sales Executive,2023-12-01,Active,"CRM,Sales Strategy",Chicago,2 years`;

                  const blob = new Blob([template], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'employee_template.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);

                  toast({
                    title: "Template Downloaded",
                    description: "Use this template as a reference for your CSV file format",
                  });
                }}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <div>
                <Label htmlFor="file-upload">Select File (CSV)</Label>
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedFile && handleImport(selectedFile)}
                disabled={!selectedFile || isImporting}
              >
                {isImporting ? "Importing..." : "Import Employees"}
              </Button>
            </DialogFooter>
            </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={isExporting || !employees?.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button
              variant="outline"
              onClick={exportToPDF}
              disabled={isExporting || !employees?.length}
            >
              <FileType className="h-4 w-4 mr-2" />
              Export PDF
            </Button>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingEmployee ? "Edit Employee" : "Add New Employee"}
                  </DialogTitle>
                </DialogHeader>
                <EmployeeForm
                  employee={editingEmployee}
                  onSuccess={handleFormSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>

        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employees ({filteredEmployees.length}{employees.length !== filteredEmployees.length ? ` of ${employees.length}` : ''})
            </CardTitle>
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                    <SelectItem value="Project Management">Project Management</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Filter by technology/skill..."
                  value={technologyFilter}
                  onChange={(e) => setTechnologyFilter(e.target.value)}
                  className="w-48"
                />
              </div>

              {(departmentFilter || technologyFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDepartmentFilter("");
                    setTechnologyFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              filteredEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No employee record found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? `No employees found for "${searchTerm}"` : "No employees found"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Technologies</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee: any) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {employee.profilePicture ? (
                              <img
                                src={employee.profilePicture}
                                alt={`${employee.firstName} ${employee.lastName}`}
                                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                                {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{employee.employeeId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                            {employee.joiningDate && (
                              <div className="text-sm text-muted-foreground">
                                Joined: {new Date(employee.joiningDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.phoneNumber || "N/A"}</TableCell>
                        <TableCell>{employee.department || "N/A"}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{calculateExperience(employee.joiningDate)}</div>
                            {employee.overallExperience && (
                              <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={employee.overallExperience}>
                                {employee.overallExperience}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(employee.technologies) && employee.technologies.slice(0, 2).map((tech: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                            {Array.isArray(employee.technologies) && employee.technologies.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{employee.technologies.length - 2}
                              </Badge>
                            )}
                            {!Array.isArray(employee.technologies) && employee.technologies && (
                              <Badge variant="secondary" className="text-xs">
                                {employee.technologies}
                              </Badge>
                            )}
                            {!employee.technologies && (
                              <span className="text-gray-400 text-sm">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={employee.status === "Active" ? "default" : "secondary"}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProjectMappingEmployee(employee)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(employee.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </CardContent>
        </Card>

        {projectMappingEmployee && (
          <ProjectMappingDialog
            employee={projectMappingEmployee}
            onClose={() => setProjectMappingEmployee(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}

// Placeholder for ProjectMappingDialog - replace with actual implementation
function ProjectMappingDialog({ employee, onClose }: { employee: any; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Map Projects for {employee.firstName} {employee.lastName}</DialogTitle>
          <DialogDescription>
            Assign or unassign projects for this employee.
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle>Assigned Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Project mapping UI would go here */}
            <p>Project mapping functionality to be implemented.</p>
          </CardContent>
        </Card>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {/* Save button for project mapping */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}