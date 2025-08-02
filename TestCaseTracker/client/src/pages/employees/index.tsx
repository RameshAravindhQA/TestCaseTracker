import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Download, Upload, FileText, Users, Mail, Phone, MapPin, Calendar, Edit, Trash2, Search, Filter, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  const [projectMappingEmployee, setProjectMappingEmployee] = useState(null);
  const { toast } = useToast();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employees = [], isLoading } = useQuery({
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

  const filteredEmployees = employees.filter((employee: any) =>
    `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.employeeId}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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

  // CSV Import functionality
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          importEmployees(results.data as any[]);
        },
        error: (error) => {
          toast({
            title: "Import failed",
            description: `Error parsing CSV: ${error.message}`,
            variant: "destructive",
          });
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          importEmployees(jsonData as any[]);
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Error parsing Excel file",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: "Invalid file format",
        description: "Please select a CSV or Excel file",
        variant: "destructive",
      });
    }
  };

  const importEmployees = async (data: any[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        if (!row.firstName || !row.lastName || !row.email) {
          errorCount++;
          continue;
        }

        try {
          await apiRequest("POST", "/api/employees", {
            employeeId: row.employeeId || `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone || '',
            department: row.department || '',
            designation: row.designation || '',
            joiningDate: row.joiningDate || new Date().toISOString(),
            status: row.status || 'Active',
            technologies: typeof row.technologies === 'string'
              ? row.technologies.split(',').map((t: string) => t.trim())
              : row.technologies || []
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: "Import completed",
        description: `${successCount} employees imported successfully. ${errorCount} failed.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsImportDialogOpen(false);
    } catch (error) {
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
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Import Employees</DialogTitle>
                          <DialogDescription>
                            Upload a CSV or Excel file with employee data. Download the template to see the required format.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={downloadCSVTemplate}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Template
                            </Button>
                          </div>
                          <div>
                            <Label htmlFor="file-upload">Select File (CSV, Excel)</Label>
                            <Input
                              id="file-upload"
                              type="file"
                              ref={fileInputRef}
                              accept=".csv,.xlsx,.xls"
                              onChange={handleFileImport}
                              className="mt-1"
                            />
                          </div>
                        </div>
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
              Employees ({filteredEmployees.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
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
                            {employee.technologies?.slice(0, 2).map((tech: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                            {employee.technologies?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{employee.technologies.length - 2}
                              </Badge>
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