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
import { FileDown, Calendar, TrendingUp, Clock, Target, Filter } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';

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
  
  // Combine all departments and work types
  const departments = [...new Set([...allDepartments, ...existingDepartments])];
  const workTypes = [...new Set([...allWorkTypes, ...existingWorkTypes])];
  const statuses = ['Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Completed', 'Blocked', 'On Hold'];

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

    // Work Type filter - check both sub-features and work logs
    if (selectedWorkType !== 'all') {
      // Filter sub-features by work type
      filteredSFs = filteredSFs.filter(sf => sf.workType === selectedWorkType);
      // Filter work logs by work type OR get work logs for filtered sub-features
      filteredWLs = filteredWLs.filter(wl => 
        wl.workType === selectedWorkType || 
        filteredSFs.some(sf => sf.id === wl.subFeatureId)
      );
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
      csvData.push(['Sub-Feature', 'Department', 'Status', 'Work Type', 'Estimated Hours', 'Total Work Hours', 'Start Date', 'End Date']);

      group.subFeatures.forEach(sf => {
        const subFeatureWorkLogs = group.workLogs.filter(wl => wl.subFeatureId === sf.id);
        const totalHours = subFeatureWorkLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);

        csvData.push([
          sf.name,
          sf.department || '',
          sf.status,
          sf.workType,
          sf.estimatedHours || 0,
          totalHours,
          sf.startDate || '',
          sf.endDate || ''
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

      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Total Sub-Features: ${totalSubFeatures}`, 14, yPosition);
      doc.text(`Total Work Logs: ${totalLogs}`, 14, yPosition + 5);
      doc.text(`Total Hours Logged: ${totalHours}h`, 14, yPosition + 10);
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

            return [
              sf.name,
              sf.department || '',
              sf.status,
              sf.workType,
              `${sf.estimatedHours || 0}h`,
              `${totalHours}h`
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [['Sub-Feature', 'Department', 'Status', 'Work Type', 'Estimated', 'Actual']],
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

            {/* Report Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Report Type:</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters Button */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedFeature('all');
                  setSelectedSubFeature('all');
                  setSelectedDepartment('all');
                  setSelectedStatus('all');
                  setSelectedWorkType('all');
                  setDateRange('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Reset Filters
              </Button>
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
                        <th className="border border-gray-200 px-4 py-2 text-left">Actual Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.subFeatures.map((sf) => {
                        const subFeatureWorkLogs = group.workLogs.filter(wl => wl.subFeatureId === sf.id);
                        const totalHours = subFeatureWorkLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);

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
                            <td className="border border-gray-200 px-4 py-2">{totalHours}h</td>
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
                      {group.workLogs.map((wl) => {
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
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}