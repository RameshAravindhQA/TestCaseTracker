import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, Calendar, TrendingUp, Clock, Target, Filter, FileText, BarChart } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import _ from 'lodash'; // Import lodash

// Define interfaces for clarity
interface TrackerSubFeature {
  id: number;
  featureId: number;
  name: string;
  department: string | null;
  status: string;
  workType: string | null;
  estimatedHours: number | null;
  startDate: string | null;
  endDate: string | null;
}

interface TrackerWorkLog {
  id: number;
  subFeatureId: number;
  workDate: string;
  hoursWorked: number;
  workType: string | null;
  status: string;
  description: string;
  subFeature?: TrackerSubFeature; // Optional: to access sub-feature details directly
}

interface TrackerReportsProps {
  projectId?: number;
  features?: any[];
  subFeatures?: TrackerSubFeature[]; // Use the defined interface
}

export function TrackerReports({ projectId, features = [], subFeatures = [] }: TrackerReportsProps) {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState('all');
  const [selectedSubFeature, setSelectedSubFeature] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWorkType, setSelectedWorkType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [currentPage, setCurrentPage] = useState(1); // State for pagination
  const [isGeneratingReport, setIsGeneratingReport] = useState(false); // State for loading indicator
  const [showSummaryReport, setShowSummaryReport] = useState(false); // State to show summary report

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: [`/api/tracker/projects/${projectId}`],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await apiRequest('GET', `/api/tracker/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
    enabled: !!projectId,
  });

  // Fetch work logs for reports
  const { data: workLogsData } = useQuery({
    queryKey: [`/api/tracker/work-logs`, projectId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/work-logs?projectId=${projectId || ''}`);
      if (!response.ok) throw new Error('Failed to fetch work logs');
      return response.json();
    },
  });

  // Cast workLogsData to the correct type
  const workLogs: TrackerWorkLog[] = workLogsData || [];

  // Get all available departments and work types (not just from existing data)
  const allDepartments = ['Frontend', 'Backend', 'Mobile', 'Quality Assurance', 'DevOps', 'UI/UX', 'Business Analysis', 'Testing'];
  const allWorkTypes = ['Development', 'QA', 'DevOps', 'Designing', 'Analysis', 'Documentation', 'User Story', 'Change Request', 'Bug Fix', 'Feature Request'];

  // Also include departments and work types from existing data
  const existingDepartments = [...new Set(subFeatures.map(sf => sf.department).filter(Boolean))];
  const existingWorkTypes = [...new Set(subFeatures.map(sf => sf.workType).filter(Boolean))];

  // Include work types from work logs
  const workLogWorkTypes = [...new Set(workLogs.map(wl => wl.workType).filter(Boolean))];

  // Combine all departments and work types
  const departments = [...new Set([...allDepartments, ...existingDepartments])];
  const workTypes = [...new Set([...allWorkTypes, ...existingWorkTypes, ...workLogWorkTypes])];
  const statuses = ['Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Completed', 'Blocked', 'On Hold'];

  // Reset filters function
  const resetFilters = () => {
    setSelectedFeature('all');
    setSelectedSubFeature('all');
    setSelectedDepartment('all');
    setSelectedStatus('all');
    setSelectedWorkType('all');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const generateSummaryReport = async () => {
    setIsGeneratingReport(true);

    // Simulate report generation process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsGeneratingReport(false);
    setShowSummaryReport(true);
  };


  // Apply all filters to get filtered data
  const getFilteredData = () => {
    let filteredSFs = [...subFeatures];
    let filteredWLs = workLogs || [];

    // Feature filter
    if (selectedFeature !== 'all') {
      filteredSFs = filteredSFs.filter(sf => sf.featureId.toString() === selectedFeature);
      filteredWLs = filteredWLs.filter(wl => 
        filteredSFs.some(sf => sf.id === wl.subFeatureId)
      );
    }

    // Sub-feature filter
    if (selectedSubFeature !== 'all') {
      filteredSFs = filteredSFs.filter(sf => sf.id.toString() === selectedSubFeature);
      filteredWLs = filteredWLs.filter(wl => wl.subFeatureId.toString() === selectedSubFeature);
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filteredSFs = filteredSFs.filter(sf => sf.department === selectedDepartment);
      filteredWLs = filteredWLs.filter(wl => 
        filteredSFs.some(sf => sf.id === wl.subFeatureId)
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filteredSFs = filteredSFs.filter(sf => sf.status === selectedStatus);
      filteredWLs = filteredWLs.filter(wl => 
        filteredSFs.some(sf => sf.id === wl.subFeatureId)
      );
    }

    // Work Type filter
    if (selectedWorkType !== 'all') {
      filteredSFs = filteredSFs.filter(sf => sf.workType === selectedWorkType);
      filteredWLs = filteredWLs.filter(wl => wl.workType === selectedWorkType);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let filterDate = new Date();

      switch (dateRange) {
        case 'thisMonth':
          filterDate.setMonth(now.getMonth());
          filterDate.setDate(1);
          break;
        case 'lastMonth':
          filterDate.setMonth(now.getMonth() - 1);
          filterDate.setDate(1);
          break;
        case 'thisQuarter':
          const quarter = Math.floor(now.getMonth() / 3);
          filterDate.setMonth(quarter * 3);
          filterDate.setDate(1);
          break;
        case 'thisYear':
          filterDate.setMonth(0);
          filterDate.setDate(1);
          break;
        case 'custom':
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            filteredWLs = filteredWLs.filter(wl => {
              const logDate = new Date(wl.workDate);
              return logDate >= start && logDate <= end;
            });
          }
          return { filteredSubFeatures: filteredSFs, filteredWorkLogs: filteredWLs };
      }

      if (dateRange !== 'custom') {
        filteredWLs = filteredWLs.filter(wl => {
          const logDate = new Date(wl.workDate);
          return logDate >= filterDate;
        });
      }
    }

    // Search filter
    if (searchQuery) {
      filteredSFs = filteredSFs.filter(sf => 
        sf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sf.department && sf.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        sf.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      filteredWLs = filteredWLs.filter(wl => 
        wl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wl.workType && wl.workType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        wl.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wl.subFeature?.name && wl.subFeature.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }


    return { filteredSubFeatures: filteredSFs, filteredWorkLogs: filteredWLs };
  };

  const { filteredSubFeatures, filteredWorkLogs } = getFilteredData();

  // Get filtered sub-features based on selected feature for the dropdown
  const filteredSubFeaturesForDropdown = selectedFeature === 'all' 
    ? subFeatures 
    : subFeatures.filter(sf => sf.featureId.toString() === selectedFeature);

  // Group data by features for structured reports
  const getGroupedData = () => {
    const grouped = {};

    features.forEach(feature => {
      const featureSubFeatures = filteredSubFeatures.filter(sf => sf.featureId === feature.id);
      const featureWorkLogs = filteredWorkLogs.filter(wl => 
        featureSubFeatures.some(sf => sf.id === wl.subFeatureId)
      );

      if (featureSubFeatures.length > 0 || featureWorkLogs.length > 0) {
        grouped[feature.id] = {
          feature,
          subFeatures: featureSubFeatures,
          workLogs: featureWorkLogs
        };
      }
    });

    return grouped;
  };

  // Export functions
  const exportToCSV = () => {
    const groupedData = getGroupedData();

    const csvData = [];

    // Add header information
    csvData.push([`Project: ${project?.name || 'Unknown Project'}`]);
    csvData.push([`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`]);
    csvData.push([`Date Range: ${dateRange === 'custom' && startDate && endDate ? 
      `${startDate} to ${endDate}` : dateRange}`]);
    csvData.push([`Filters Applied: Feature(${selectedFeature}), Department(${selectedDepartment}), Status(${selectedStatus}), Work Type(${selectedWorkType})`]);
    csvData.push([]);

    Object.values(groupedData).forEach((group: any) => {
      csvData.push([`FEATURE: ${group.feature.name}`]);
      csvData.push(['Sub-Feature', 'Department', 'Status', 'Work Type', 'Estimated Hours', 'Estimated Days', 'Actual Hours', 'Actual Days']);

      group.subFeatures.forEach(sf => {
        const subFeatureWorkLogs = group.workLogs.filter(wl => wl.subFeatureId === sf.id);
        const totalHours = subFeatureWorkLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
        const totalDays = totalHours / 8; // Assuming 8 hours per day

        csvData.push([
          sf.name,
          sf.department || '',
          sf.status,
          sf.workType,
          sf.estimatedHours || 0,
          (sf.estimatedHours ? sf.estimatedHours / 8 : 0).toFixed(2), // Convert estimated hours to days
          totalHours,
          totalDays.toFixed(2) // Display actual days
        ]);
      });

      csvData.push([]);
      csvData.push(['Work Logs for this Feature:']);
      csvData.push(['Log ID', 'Sub-Feature', 'Date', 'Hours', 'Work Type', 'Status', 'Description']);

      group.workLogs.forEach(wl => {
        const subFeature = group.subFeatures.find(sf => sf.id === wl.subFeatureId);
        csvData.push([
          wl.id,
          subFeature?.name || 'Unknown',
          wl.workDate,
          wl.hoursWorked,
          wl.workType,
          wl.status,
          wl.description
        ]);
      });

      csvData.push([]);
    });

    const csvContent = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project?.name || 'project'}-tracker-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    try {
      const groupedData = getGroupedData();

      if (Object.keys(groupedData).length === 0) {
        toast({
          title: "No Data",
          description: "There is no data to export. Please add some work logs first.",
          variant: "destructive",
        });
        return;
      }

      const doc = new jsPDF();

      // Add title and project info
      doc.setFontSize(18);
      doc.text(`${project?.name || 'Project'} - Work Logs Report`, 14, 20);

      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 30);
      doc.text(`Date Range: ${dateRange === 'custom' && startDate && endDate ? 
        `${startDate} to ${endDate}` : dateRange}`, 14, 35);
      doc.text(`Applied Filters:`, 14, 40);
      doc.text(`• Feature: ${selectedFeature === 'all' ? 'All Features' : features.find(f => f.id.toString() === selectedFeature)?.name || 'Unknown'}`, 20, 45);
      doc.text(`• Sub-Feature: ${selectedSubFeature === 'all' ? 'All Sub-Features' : filteredSubFeatures.find(sf => sf.id.toString() === selectedSubFeature)?.name || 'Unknown'}`, 20, 50);
      doc.text(`• Department: ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}`, 20, 55);
      doc.text(`• Status: ${selectedStatus === 'all' ? 'All Statuses' : selectedStatus}`, 20, 60);
      doc.text(`• Work Type: ${selectedWorkType === 'all' ? 'All Work Types' : selectedWorkType}`, 20, 65);

      let yPosition = 75;

      // Summary statistics
      const totalHours = filteredWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0);
      const totalLogs = filteredWorkLogs.length;
      const totalSubFeatures = filteredSubFeatures.length;
      const totalDays = totalHours / 8; // Assuming 8 hours per day

      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Total Sub-Features: ${totalSubFeatures}`, 14, yPosition);
      doc.text(`Total Work Logs: ${totalLogs}`, 14, yPosition + 5);
      doc.text(`Total Hours Logged: ${totalHours}h (${totalDays.toFixed(2)} days)`, 14, yPosition + 10);
      yPosition += 25;

      // Feature-wise detailed report
      Object.values(groupedData).forEach((group: any) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text(`Feature: ${group.feature.name}`, 14, yPosition);
        yPosition += 10;

        // Sub-features table
        if (group.subFeatures.length > 0) {
          const subFeatureTableData = group.subFeatures.map(sf => {
            const subFeatureWorkLogs = group.workLogs.filter(wl => wl.subFeatureId === sf.id);
            const totalHours = subFeatureWorkLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
            const totalDays = totalHours / 8; // Assuming 8 hours per day

            return [
              sf.name,
              sf.department || '',
              sf.status,
              sf.workType,
              `${sf.estimatedHours || 0}h`,
              `${(sf.estimatedHours ? sf.estimatedHours / 8 : 0).toFixed(2)}d`, // Convert estimated hours to days
              `${totalHours}h`,
              `${totalDays.toFixed(2)}d` // Display actual days
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Sub-Feature', 'Department', 'Status', 'Work Type', 'Est. Hours', 'Est. Days', 'Actual Hours', 'Actual Days']],
            body: subFeatureTableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
            margin: { left: 14 }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Work logs table
        if (group.workLogs.length > 0) {
          // Check if we need a new page for work logs
          if (yPosition > 220) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.text('Work Logs:', 14, yPosition);
          yPosition += 5;

          const workLogTableData = group.workLogs.map(wl => {
            const subFeature = group.subFeatures.find(sf => sf.id === wl.subFeatureId);
            return [
              wl.id.toString(),
              subFeature?.name || 'Unknown',
              wl.workDate,
              `${wl.hoursWorked}h`,
              wl.workType,
              wl.status,
              wl.description.substring(0, 30) + (wl.description.length > 30 ? '...' : '')
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Log ID', 'Sub-Feature', 'Date', 'Hours', 'Work Type', 'Status', 'Description']],
            body: workLogTableData,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [46, 125, 50] },
            margin: { left: 14 }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 15;
        }
      });

      // Save the PDF
      const filename = `${project?.name || 'project'}-tracker-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);

      toast({
        title: "Export Successful",
        description: `PDF report has been downloaded as ${filename}`,
      });

    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Pagination logic for the overall work logs table
  const logsPerPage = 10;
  const totalPages = Math.ceil(filteredWorkLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const paginatedWorkLogs = filteredWorkLogs.slice(startIndex, endIndex);

  // Handle pagination change for the overall table
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Project Reports & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Feature Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Feature:</Label>
              <Select value={selectedFeature} onValueChange={(value) => {
                setSelectedFeature(value);
                setSelectedSubFeature('all'); // Reset sub-feature when feature changes
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  {features.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id.toString()}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-Feature Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sub-Feature:</Label>
              <Select value={selectedSubFeature} onValueChange={setSelectedSubFeature}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub-Features</SelectItem>
                  {filteredSubFeaturesForDropdown.map((subFeature) => (
                    <SelectItem key={subFeature.id} value={subFeature.id.toString()}>
                      {subFeature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Department:</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status:</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Work Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Work Type:</Label>
              <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Work Types</SelectItem>
                  {workTypes.map((workType) => (
                    <SelectItem key={workType} value={workType}>
                      {workType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range:</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisQuarter">This Quarter</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
              <Label className="text-sm font-medium">Search:</Label>
              <Input
                type="text"
                placeholder="Search by description, work type, status, or sub-feature name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Reset and Export Buttons */}
            <div className="col-span-1 md:col-span-3 lg:col-span-4">
              <div className="flex items-center gap-2 justify-end">
                <Button variant="secondary" onClick={resetFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
                <Button onClick={exportToCSV} variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={exportToPDF} variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button 
                  onClick={generateSummaryReport}
                  disabled={isGeneratingReport}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Final Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date:</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date:</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Filtered Sub-Features</span>
            </div>
            <p className="text-2xl font-bold mt-1">{filteredSubFeatures.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Total Work Logs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{filteredWorkLogs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Total Hours</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {filteredWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0)}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Active Features</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {Object.keys(getGroupedData()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports by Feature */}
      <div className="space-y-6">
        {Object.values(getGroupedData()).map((group: any) => (
          <Card key={group.feature.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Feature: {group.feature.name}</span>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {group.subFeatures.length} Sub-Features
                  </Badge>
                  <Badge variant="outline">
                    {group.workLogs.length} Work Logs
                  </Badge>
                  <Badge variant="outline">
                    {group.workLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0)}h Total
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Sub-Features Table */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">Sub-Features</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Department</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Work Type</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Est. Hours</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Est. Days</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Actual Hours</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Actual Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.subFeatures.map((sf) => {
                        const subFeatureWorkLogs = group.workLogs.filter(wl => wl.subFeatureId === sf.id);
                        const totalHours = subFeatureWorkLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
                        const totalDays = totalHours / 8; // Assuming 8 hours per day

                        return (
                          <tr key={sf.id}>
                            <td className="border border-gray-200 px-4 py-2">{sf.name}</td>
                            <td className="border border-gray-200 px-4 py-2">{sf.department || '-'}</td>
                            <td className="border border-gray-200 px-4 py-2">
                              <StatusBadge status={sf.status} />
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <StatusBadge status={sf.workType} />
                            </td>
                            <td className="border border-gray-200 px-4 py-2">{sf.estimatedHours || 0}h</td>
                            <td className="border border-gray-200 px-4 py-2">{(sf.estimatedHours ? sf.estimatedHours / 8 : 0).toFixed(2)}d</td>
                            <td className="border border-gray-200 px-4 py-2">{totalHours}h</td>
                            <td className="border border-gray-200 px-4 py-2">{totalDays.toFixed(2)}d</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Work Logs Table */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Work Logs</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Log ID</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Sub-Feature</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Hours</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Work Type</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Apply pagination to this group's work logs
                        const groupWorkLogs = group.workLogs;
                        const startIdx = (currentPage - 1) * logsPerPage;
                        const endIdx = startIdx + logsPerPage;
                        const paginatedGroupLogs = groupWorkLogs.slice(startIdx, endIdx);

                        return paginatedGroupLogs.map((wl) => {
                          const subFeature = group.subFeatures.find(sf => sf.id === wl.subFeatureId);
                          return (
                            <tr key={wl.id}>
                              <td className="border border-gray-200 px-4 py-2">#{wl.id}</td>
                              <td className="border border-gray-200 px-4 py-2">{subFeature?.name || 'Unknown'}</td>
                              <td className="border border-gray-200 px-4 py-2">{wl.workDate}</td>
                              <td className="border border-gray-200 px-4 py-2">{wl.hoursWorked}h</td>
                              <td className="border border-gray-200 px-4 py-2">
                                <StatusBadge status={wl.workType} />
                              </td>
                              <td className="border border-gray-200 px-4 py-2">
                                <StatusBadge status={wl.status} />
                              </td>
                              <td className="border border-gray-200 px-4 py-2">{wl.description}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for this group's work logs */}
                {group.workLogs.length > logsPerPage && (
                  <div className="flex justify-center mt-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 flex items-center">
                      Page {currentPage} of {Math.ceil(group.workLogs.length / logsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(group.workLogs.length / logsPerPage)))}
                      disabled={currentPage === Math.ceil(group.workLogs.length / logsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination for the overall work logs table */}
      {filteredWorkLogs.length > logsPerPage && (
        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              onClick={() => handlePageChange(page)}
              className="mx-1"
            >
              {page}
            </Button>
          ))}
        </div>
      )}

      {/* Progress Dialog */}
      {isGeneratingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Generating Final Project Report</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Collecting project data...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span>Processing analytics...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>Compiling final report...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Final Report Display */}
      {showSummaryReport && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-blue-600">
              📊 Comprehensive Project Tracker Report
            </CardTitle>
            <div className="text-center text-sm text-gray-500">
              Generated on {format(new Date(), 'MMMM dd, yyyy at HH:mm')} | Total Pages: Multi-section Analysis
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-10">
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-2xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                  📋 Executive Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-blue-700">Project Completion</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {subFeatures ? Math.round((subFeatures.filter(sf => sf.status === 'Completed').length / Math.max(subFeatures.length, 1)) * 100) : 0}%
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-green-700">Total Hours Logged</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {filteredWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0)}h
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-purple-700">Active Features</h4>
                    <p className="text-2xl font-bold text-purple-600">{features?.length || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-orange-700">Work Logs</h4>
                    <p className="text-2xl font-bold text-orange-600">{filteredWorkLogs.length}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">Key Insights</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Project has {features?.length || 0} main features with {subFeatures?.length || 0} detailed sub-features</li>
                    <li>Total development effort: {Math.round((filteredWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0)) / 8)} working days</li>
                    <li>Most active department: {_.chain(subFeatures || []).groupBy('department').toPairs().maxBy(([, items]) => items.length)?.[0] || 'N/A'}</li>
                    <li>Average hours per work log: {filteredWorkLogs.length > 0 ? Math.round((filteredWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0) / filteredWorkLogs.length) * 10) / 10 : 0}h</li>
                  </ul>
                </div>
              </div>

              {/* Project Overview */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
                  🏢 Project Information & Scope
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 shadow-sm">
                    <h4 className="font-bold text-blue-800 text-lg mb-2">Project Details</h4>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Name:</span> {project?.name || 'Unknown Project'}</p>
                      <p><span className="font-semibold">ID:</span> #{project?.id || 'N/A'}</p>
                      <p><span className="font-semibold">Created:</span> {project?.createdAt ? format(new Date(project.createdAt), 'MMM dd, yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500 shadow-sm">
                    <h4 className="font-bold text-green-800 text-lg mb-2">Current Status</h4>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Status:</span> <Badge className="bg-green-100 text-green-800">{project?.status || 'Active'}</Badge></p>
                      <p><span className="font-semibold">Priority:</span> <Badge variant="outline">{project?.priority || 'Medium'}</Badge></p>
                      <p><span className="font-semibold">Budget:</span> {project?.budget ? `${project.currency || '$'}${project.budget.toLocaleString()}` : 'Not set'}</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500 shadow-sm">
                    <h4 className="font-bold text-purple-800 text-lg mb-2">Timeline</h4>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Start:</span> {project?.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : 'Not set'}</p>
                      <p><span className="font-semibold">End:</span> {project?.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : 'Not set'}</p>
                      <p><span className="font-semibold">Duration:</span> {project?.startDate && project?.endDate ? `${Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {project?.description && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h4 className="font-bold text-gray-800 text-lg mb-3">Project Description</h4>
                    <p className="text-gray-700 leading-relaxed">{project.description}</p>
                  </div>
                )}
              </div>

              {/* Detailed Features Analysis */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-green-500 pb-2">
                  🎯 Features Breakdown & Analysis ({features?.length || 0} Total)
                </h3>
                <div className="overflow-x-auto shadow-sm rounded-lg">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <th className="border border-gray-300 px-6 py-4 text-left font-bold">Feature Name</th>
                        <th className="border border-gray-300 px-6 py-4 text-left font-bold">Status</th>
                        <th className="border border-gray-300 px-6 py-4 text-center font-bold">Sub-Features</th>
                        <th className="border border-gray-300 px-6 py-4 text-center font-bold">Work Logs</th>
                        <th className="border border-gray-300 px-6 py-4 text-center font-bold">Hours Logged</th>
                        <th className="border border-gray-300 px-6 py-4 text-center font-bold">Progress</th>
                        <th className="border border-gray-300 px-6 py-4 text-left font-bold">Timeline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {features?.map((feature: any, index: number) => {
                        const featureSubFeatures = subFeatures?.filter(sf => sf.featureId === feature.id) || [];
                        const featureWorkLogs = filteredWorkLogs.filter(wl => featureSubFeatures.some(sf => sf.id === wl.subFeatureId));
                        const totalHours = featureWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0);
                        const completedSubFeatures = featureSubFeatures.filter(sf => sf.status === 'Completed').length;
                        const progress = featureSubFeatures.length > 0 ? Math.round((completedSubFeatures / featureSubFeatures.length) * 100) : 0;
                        
                        return (
                          <tr key={feature.id} className={index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}>
                            <td className="border border-gray-300 px-6 py-4">
                              <div>
                                <p className="font-semibold text-gray-800">{feature.name}</p>
                                {feature.description && <p className="text-sm text-gray-600 mt-1">{feature.description.substring(0, 100)}...</p>}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-6 py-4">
                              <StatusBadge status={feature.status} />
                            </td>
                            <td className="border border-gray-300 px-6 py-4 text-center">
                              <Badge variant="outline" className="text-lg px-3 py-1">{featureSubFeatures.length}</Badge>
                            </td>
                            <td className="border border-gray-300 px-6 py-4 text-center">
                              <Badge variant="outline" className="text-lg px-3 py-1">{featureWorkLogs.length}</Badge>
                            </td>
                            <td className="border border-gray-300 px-6 py-4 text-center font-semibold">
                              {totalHours}h ({Math.round(totalHours / 8 * 10) / 10} days)
                            </td>
                            <td className="border border-gray-300 px-6 py-4 text-center">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-bold">{progress}%</span>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-6 py-4">
                              <div className="text-sm">
                                <p><span className="font-semibold">Start:</span> {feature.startDate ? format(new Date(feature.startDate), 'MMM dd') : 'Not set'}</p>
                                <p><span className="font-semibold">End:</span> {feature.endDate ? format(new Date(feature.endDate), 'MMM dd') : 'Not set'}</p>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Sub-Features Analysis */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-purple-500 pb-2">
                  📋 Sub-Features Detailed Analysis ({subFeatures?.length || 0} Total)
                </h3>
                
                {/* Sub-Features by Department */}
                <div className="mb-8">
                  <h4 className="text-xl font-semibold mb-4 text-purple-700">🏢 Department-wise Distribution</h4>
                  <div className="overflow-x-auto shadow-sm rounded-lg">
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                          <th className="border border-gray-300 px-6 py-4 text-left font-bold">Department</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Total Tasks</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Completed</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">In Progress</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Pending</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Total Hours</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Avg Hours/Task</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {_.chain(subFeatures || [])
                          .groupBy('department')
                          .map((items, department) => {
                            const completed = items.filter(item => item.status === 'Completed').length;
                            const inProgress = items.filter(item => ['Planning', 'Design', 'Development', 'Testing'].includes(item.status)).length;
                            const pending = items.filter(item => ['Planning', 'Design'].includes(item.status)).length;
                            const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
                            const deptWorkLogs = filteredWorkLogs.filter(wl => items.some(item => item.id === wl.subFeatureId));
                            const totalHours = deptWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0);
                            const avgHours = items.length > 0 ? Math.round((totalHours / items.length) * 10) / 10 : 0;
                            
                            return {
                              department: department || 'Unassigned',
                              total: items.length,
                              completed,
                              inProgress,
                              pending,
                              progress,
                              totalHours,
                              avgHours
                            };
                          })
                          .value()
                          .map((dept, index) => (
                            <tr key={dept.department} className={index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}>
                              <td className="border border-gray-300 px-6 py-4 font-semibold">{dept.department}</td>
                              <td className="border border-gray-300 px-6 py-4 text-center font-bold text-lg">{dept.total}</td>
                              <td className="border border-gray-300 px-6 py-4 text-center">
                                <Badge className="bg-green-100 text-green-800 px-3 py-1">{dept.completed}</Badge>
                              </td>
                              <td className="border border-gray-300 px-6 py-4 text-center">
                                <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">{dept.inProgress}</Badge>
                              </td>
                              <td className="border border-gray-300 px-6 py-4 text-center">
                                <Badge className="bg-gray-100 text-gray-800 px-3 py-1">{dept.pending}</Badge>
                              </td>
                              <td className="border border-gray-300 px-6 py-4 text-center font-semibold">{dept.totalHours}h</td>
                              <td className="border border-gray-300 px-6 py-4 text-center font-semibold">{dept.avgHours}h</td>
                              <td className="border border-gray-300 px-6 py-4 text-center">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div 
                                      className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                                      style={{ width: `${dept.progress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-bold">{dept.progress}%</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-Features by Status */}
                <div className="mb-8">
                  <h4 className="text-xl font-semibold mb-4 text-purple-700">📊 Status-wise Analysis</h4>
                  <div className="overflow-x-auto shadow-sm rounded-lg">
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                          <th className="border border-gray-300 px-6 py-4 text-left font-bold">Status</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Sub-Features</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Work Logs</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Total Hours</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Avg Hours/Task</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Working Days</th>
                          <th className="border border-gray-300 px-6 py-4 text-center font-bold">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {_.chain(subFeatures || [])
                          .groupBy('status')
                          .map((items, status) => {
                            const statusWorkLogs = filteredWorkLogs.filter(wl => 
                              items.some(item => item.id === wl.subFeatureId)
                            );
                            const totalHours = statusWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0);
                            const avgHours = items.length > 0 ? Math.round((totalHours / items.length) * 10) / 10 : 0;
                            const workingDays = Math.round(totalHours / 8 * 10) / 10;
                            const percentage = (subFeatures?.length || 0) > 0 ? Math.round((items.length / (subFeatures?.length || 1)) * 100) : 0;
                            return {
                              status,
                              count: items.length,
                              workLogs: statusWorkLogs.length,
                              hours: totalHours,
                              avgHours,
                              workingDays,
                              percentage
                            };
                          })
                          .value()
                          .map((statusItem, index) => (
                            <tr key={statusItem.status} className={index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}>
                              <td className="border border-gray-300 px-6 py-4">
                                <StatusBadge status={statusItem.status} />
                              </td>
                              <td className="border border-gray-300 px-6 py-4 text-center font-bold text-lg">{statusItem.count}</td>
                              <td className="border border-gray-300 px-6 py-4 text-center font-semibold">{statusItem.workLogs}</td>
                              <td className="border border-gray-300 px-6 py-4 text-center font-semibold">{statusItem.hours}h</td>
                              <td className="border border-gray-300 px-6 py-4 text-center font-semibold">{statusItem.avgHours}h</td>
                              <td className="border border-gray-300 px-6 py-4 text-center font-semibold">{statusItem.workingDays} days</td>
                              <td className="border border-gray-300 px-6 py-4 text-center">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div 
                                      className="bg-purple-500 h-3 rounded-full transition-all duration-300" 
                                      style={{ width: `${statusItem.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-bold">{statusItem.percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Work Types Analysis */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-orange-500 pb-2">
                  🔧 Work Types & Effort Distribution
                </h3>
                <div className="overflow-x-auto shadow-sm rounded-lg">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                        <th className="border border-gray-300 px-6 py-4 text-left font-bold">Work Type</th>
                        <th className="border border-gray-300 px-6 py-4 text-center font-bold">Work Logs</th>
                        <th className="border border-gray-300 px-6 py-4 text-center font-bold">Total Hours</th>
                        <th className="border border-gray-300 px-6 py-4 text-center font-bold">Working Days</th>
                        <th className="border border-gray-300 px-6 py-4 text-center font-bold">Avg Hours/Log</th>
                        <th className="border border-gray-300 px-6 py-4 text-center font-bold">% of Total Effort</th>
                      </tr>
                    </thead>
                    <tbody>
                      {_.chain(filteredWorkLogs)
                        .groupBy('workType')
                        .map((logs, workType) => {
                          const totalHours = logs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0);
                          const avgHours = logs.length > 0 ? Math.round((totalHours / logs.length) * 10) / 10 : 0;
                          const workingDays = Math.round(totalHours / 8 * 10) / 10;
                          const totalProjectHours = filteredWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0);
                          const percentage = totalProjectHours > 0 ? Math.round((totalHours / totalProjectHours) * 100) : 0;
                          
                          return {
                            workType: workType || 'Unspecified',
                            count: logs.length,
                            hours: totalHours,
                            avgHours,
                            workingDays,
                            percentage
                          };
                        })
                        .value()
                        .orderBy(['hours'], ['desc'])
                        .map((workTypeItem, index) => (
                          <tr key={workTypeItem.workType} className={index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}>
                            <td className="border border-gray-300 px-6 py-4">
                              <StatusBadge status={workTypeItem.workType} />
                            </td>
                            <td className="border border-gray-300 px-6 py-4 text-center font-bold text-lg">{workTypeItem.count}</td>
                            <td className="border border-gray-300 px-6 py-4 text-center font-semibold">{workTypeItem.hours}h</td>
                            <td className="border border-gray-300 px-6 py-4 text-center font-semibold">{workTypeItem.workingDays} days</td>
                            <td className="border border-gray-300 px-6 py-4 text-center font-semibold">{workTypeItem.avgHours}h</td>
                            <td className="border border-gray-300 px-6 py-4 text-center">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-orange-500 h-3 rounded-full transition-all duration-300" 
                                    style={{ width: `${workTypeItem.percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-bold">{workTypeItem.percentage}%</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timeline Analysis */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-500 pb-2">
                  📅 Timeline & Performance Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500 shadow-sm">
                    <h4 className="font-bold text-indigo-800 text-lg mb-3">Project Timeline</h4>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Total Duration:</span> {project?.startDate && project?.endDate ? `${Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 'N/A'}</p>
                      <p><span className="font-semibold">Days Elapsed:</span> {project?.startDate ? `${Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 'N/A'}</p>
                      <p><span className="font-semibold">Days Remaining:</span> {project?.endDate ? `${Math.max(0, Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500 shadow-sm">
                    <h4 className="font-bold text-green-800 text-lg mb-3">Work Performance</h4>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Total Work Days:</span> {Math.round((filteredWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0)) / 8)} days</p>
                      <p><span className="font-semibold">Avg Daily Hours:</span> {filteredWorkLogs.length > 0 ? Math.round((filteredWorkLogs.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0) / _.uniqBy(filteredWorkLogs, 'workDate').length) * 10) / 10 : 0}h</p>
                      <p><span className="font-semibold">Most Productive Day:</span> {(() => {
                        const dayGroups = _.groupBy(filteredWorkLogs, 'workDate');
                        const productiveDay = _.maxBy(Object.entries(dayGroups), ([, logs]) => logs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0));
                        return productiveDay ? `${format(new Date(productiveDay[0]), 'MMM dd')} (${productiveDay[1].reduce((sum, log) => sum + (log.hoursWorked || 0), 0)}h)` : 'N/A';
                      })()}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500 shadow-sm">
                    <h4 className="font-bold text-yellow-800 text-lg mb-3">Efficiency Metrics</h4>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Completion Rate:</span> {subFeatures ? Math.round((subFeatures.filter(sf => sf.status === 'Completed').length / Math.max(subFeatures.length, 1)) * 100) : 0}%</p>
                      <p><span className="font-semibold">Active Work Rate:</span> {subFeatures ? Math.round((subFeatures.filter(sf => ['Development', 'Testing'].includes(sf.status)).length / Math.max(subFeatures.length, 1)) * 100) : 0}%</p>
                      <p><span className="font-semibold">Log Frequency:</span> {filteredWorkLogs.length > 0 ? `${Math.round((filteredWorkLogs.length / _.uniqBy(filteredWorkLogs, 'workDate').length) * 10) / 10} logs/day` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations & Next Steps */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border-l-4 border-gray-500">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  💡 Recommendations & Next Steps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">🎯 Key Recommendations</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>Focus on completing {subFeatures?.filter(sf => sf.status === 'Development').length || 0} development tasks in progress</li>
                      <li>Review {subFeatures?.filter(sf => sf.status === 'Blocked').length || 0} blocked items to unblock dependencies</li>
                      <li>Allocate more resources to {_.chain(subFeatures || []).groupBy('department').toPairs().minBy(([, items]) => items.filter(item => item.status === 'Completed').length / items.length)?.[0] || 'N/A'} department if lagging</li>
                      <li>Consider increasing daily logging frequency for better tracking</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">📋 Immediate Actions</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>Schedule review meetings for features with &lt; 50% completion</li>
                      <li>Update estimated hours for tasks with significant time variance</li>
                      <li>Create detailed timeline for remaining {subFeatures?.filter(sf => !['Completed', 'Cancelled'].includes(sf.status)).length || 0} tasks</li>
                      <li>Document lessons learned from completed features</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Export Actions */}
              <div className="text-center pt-8 border-t-2 border-gray-200">
                <h4 className="text-lg font-semibold mb-4 text-gray-700">📄 Export Options</h4>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 px-6 py-3">
                    <FileDown className="h-5 w-5 mr-2" />
                    Download Comprehensive PDF
                  </Button>
                  <Button onClick={exportToCSV} variant="outline" className="px-6 py-3">
                    <FileDown className="h-5 w-5 mr-2" />
                    Export Raw Data (CSV)
                  </Button>
                  <Button onClick={() => window.print()} variant="outline" className="px-6 py-3">
                    <FileDown className="h-5 w-5 mr-2" />
                    Print Report
                  </Button>
                  <Button onClick={() => setShowSummaryReport(false)} variant="outline" className="px-6 py-3">
                    Close Report
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Report contains {features?.length || 0} features, {subFeatures?.length || 0} sub-features, and {filteredWorkLogs.length} work logs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}