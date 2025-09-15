import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, Search, Filter, FileText, BarChart3, Download, Edit, Eye, Trash2, FileDown } from 'lucide-react';
import { TrackerWorkLogForm } from './tracker-work-log-form';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface WorkLogsListProps {
  projectId?: number;
  featureId?: number;
  subFeatureId?: number;
  onEditWorkLog?: (workLog: any) => void;
}

export function WorkLogsList({ projectId, featureId, subFeatureId, onEditWorkLog }: WorkLogsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [selectedWorkLog, setSelectedWorkLog] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingWorkLog, setEditingWorkLog] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const queryClient = useQueryClient();

  // Fetch work logs
  const { data: workLogs, isLoading } = useQuery({
    queryKey: ['/api/tracker/work-logs', { projectId, featureId, subFeatureId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId.toString());
      if (featureId) params.append('featureId', featureId.toString());
      if (subFeatureId) params.append('subFeatureId', subFeatureId.toString());

      const response = await apiRequest('GET', `/api/tracker/work-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch work logs');
      return response.json();
    },
  });

  // Fetch sub-features for context
  const { data: subFeatures } = useQuery({
    queryKey: ['/api/tracker/sub-features', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await apiRequest('GET', `/api/tracker/sub-features?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch sub-features');
      return response.json();
    },
  });

  // Fetch features for context and filtering
  const { data: features } = useQuery({
    queryKey: ['/api/tracker/features', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await apiRequest('GET', `/api/tracker/features?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    },
  });

  // Update work log mutation
  const updateWorkLogMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/tracker/work-logs/${id}`, data);
      if (!response.ok) throw new Error('Failed to update work log');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/work-logs'] });
      setShowEditDialog(false);
      setEditingWorkLog(null);
      toast({
        title: "Success",
        description: "Work log updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update work log",
        variant: "destructive",
      });
    },
  });

  // Delete work log mutation
  const deleteWorkLogMutation = useMutation({
    mutationFn: async (workLogId: number) => {
      const response = await apiRequest('DELETE', `/api/tracker/work-logs/${workLogId}`);
      if (!response.ok) throw new Error('Failed to delete work log');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/work-logs'] });
      toast({
        title: "Success",
        description: "Work log deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete work log",
        variant: "destructive",
      });
    },
  });

  const getSubFeatureName = (subFeatureId: number) => {
    return subFeatures?.find(sf => sf.id === subFeatureId)?.name || 'Unknown';
  };

  const getFeatureName = (featureId: number) => {
    return features?.find(f => f.id === featureId)?.name || 'Unknown';
  };

  const filteredWorkLogs = workLogs?.filter((log: any) => {
    const matchesSearch = searchTerm === '' ||
                          log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getSubFeatureName(log.subFeatureId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getFeatureName(log.featureId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesWorkType = workTypeFilter === 'all' || log.workType === workTypeFilter;
    const matchesFeature = featureFilter === 'all' || log.featureId?.toString() === featureFilter;
    return matchesSearch && matchesStatus && matchesWorkType && matchesFeature;
  }) || [];

  const totalHours = filteredWorkLogs.reduce((sum: number, log: any) => sum + (log.hoursWorked || 0), 0);

  const handleViewWorkLog = (workLog: any) => {
    setSelectedWorkLog(workLog);
    setShowViewDialog(true);
  };

  const handleEditWorkLog = (workLog: any) => {
    setEditingWorkLog(workLog);
    setShowEditDialog(true);
  };

  const handleDeleteWorkLog = (workLogId: number) => {
    deleteWorkLogMutation.mutate(workLogId);
  };

  const statusColors = {
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
    'Blocked': 'bg-red-100 text-red-800',
  };

  const workTypeColors = {
    'Development': 'bg-blue-500',
    'QA': 'bg-green-500',
    'DevOps': 'bg-purple-500',
    'Designing': 'bg-pink-500',
    'Analysis': 'bg-orange-500',
    'Documentation': 'bg-gray-500',
    'User Story': 'bg-indigo-500',
    'Change Request': 'bg-cyan-500',
    'Bug Fix': 'bg-red-500',
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredWorkLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWorkLogs = filteredWorkLogs.slice(startIndex, startIndex + itemsPerPage);

  // Highlight search terms
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ?
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading work logs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Logs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{filteredWorkLogs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Total Hours</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Avg Hours/Log</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {filteredWorkLogs.length > 0 ? (totalHours / filteredWorkLogs.length).toFixed(1) : '0'}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work logs..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-9"
              />
            </div>
            <Select value={featureFilter} onValueChange={setFeatureFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by feature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Features</SelectItem>
                {features?.map((feature: any) => (
                  <SelectItem key={feature.id} value={feature.id.toString()}>
                    {feature.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by work type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Work Types</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="DevOps">DevOps</SelectItem>
                <SelectItem value="Designing">Designing</SelectItem>
                <SelectItem value="Analysis">Analysis</SelectItem>
                <SelectItem value="Documentation">Documentation</SelectItem>
                <SelectItem value="User Story">User Story</SelectItem>
                <SelectItem value="Change Request">Change Request</SelectItem>
                <SelectItem value="Bug Fix">Bug Fix</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    if (filteredWorkLogs.length === 0) {
                      toast({
                        title: "No data to export",
                        description: "No work logs match the current filters",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Create CSV headers
                    const headers = [
                      'Log ID',
                      'Feature',
                      'Sub-Feature',
                      'Work Type',
                      'Hours Worked',
                      'Work Date',
                      'Status',
                      'Description',
                      'Created Date'
                    ];

                    // Create CSV data
                    const csvData = filteredWorkLogs.map(log => [
                      log.id,
                      `"${getFeatureName(log.featureId).replace(/"/g, '""')}"`,
                      `"${getSubFeatureName(log.subFeatureId).replace(/"/g, '""')}"`,
                      `"${log.workType || 'N/A'}"`,
                      log.hoursWorked || 0,
                      new Date(log.workDate).toLocaleDateString(),
                      `"${log.status || 'N/A'}"`,
                      `"${(log.description || 'N/A').replace(/"/g, '""')}"`,
                      new Date(log.createdAt).toLocaleDateString()
                    ]);

                    // Combine headers and data
                    const csvContent = [headers, ...csvData]
                      .map(row => row.join(','))
                      .join('\n');

                    // Create and download CSV file
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `work-logs-export-${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();

                    toast({
                      title: "CSV Export successful",
                      description: `Exported ${filteredWorkLogs.length} work logs to CSV`,
                    });
                  } catch (error) {
                    console.error('CSV Export error:', error);
                    toast({
                      title: "CSV Export failed",
                      description: "Failed to export work logs to CSV",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    if (filteredWorkLogs.length === 0) {
                      toast({
                        title: "No data to export",
                        description: "No work logs match the current filters",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Create a printable HTML version for PDF
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                      toast({
                        title: "PDF Export Failed",
                        description: "Please allow pop-ups to export PDF",
                        variant: "destructive",
                      });
                      return;
                    }

                    const projectName = projectId ? 'Project Work Logs' : 'All Work Logs';
                    const currentDate = new Date().toLocaleDateString();

                    const htmlContent = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Work Logs Report</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .stats { display: flex; gap: 20px; margin-bottom: 20px; justify-content: center; }
                            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                            th { background-color: #f5f5f5; font-weight: bold; }
                            .work-type { padding: 2px 6px; border-radius: 3px; font-size: 10px; background-color: #e0f2fe; }
                            .status-badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; }
                            .in-progress { background-color: #fef3c7; color: #92400e; }
                            .completed { background-color: #d1fae5; color: #065f46; }
                            .blocked { background-color: #fee2e2; color: #991b1b; }
                            @media print {
                              body { margin: 0; }
                              .no-print { display: none; }
                              .stats { flex-direction: column; align-items: center; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>Work Logs Report</h1>
                            <h2>${projectName}</h2>
                            <p>Generated on: ${currentDate}</p>
                            <p>Total Records: ${filteredWorkLogs.length}</p>
                          </div>

                          <div class="stats">
                            <div class="stat-card">
                              <h3>Total Logs</h3>
                              <p style="font-size: 24px; font-weight: bold; color: #3b82f6;">${filteredWorkLogs.length}</p>
                            </div>
                            <div class="stat-card">
                              <h3>Total Hours</h3>
                              <p style="font-size: 24px; font-weight: bold; color: #10b981;">${totalHours.toFixed(1)}h</p>
                            </div>
                            <div class="stat-card">
                              <h3>Avg Hours/Log</h3>
                              <p style="font-size: 24px; font-weight: bold; color: #8b5cf6;">
                                ${filteredWorkLogs.length > 0 ? (totalHours / filteredWorkLogs.length).toFixed(1) : '0'}h
                              </p>
                            </div>
                          </div>

                          <table>
                            <thead>
                              <tr>
                                <th>Log ID</th>
                                <th>Feature</th>
                                <th>Sub-Feature</th>
                                <th>Work Type</th>
                                <th>Hours</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${filteredWorkLogs.map(log => `
                                <tr>
                                  <td>#${log.id}</td>
                                  <td>${getFeatureName(log.featureId)}</td>
                                  <td>${getSubFeatureName(log.subFeatureId)}</td>
                                  <td><span class="work-type">${log.workType || 'N/A'}</span></td>
                                  <td style="font-weight: bold;">${log.hoursWorked || 0}h</td>
                                  <td>${new Date(log.workDate).toLocaleDateString()}</td>
                                  <td><span class="status-badge ${log.status?.toLowerCase().replace(' ', '-') || ''}">${log.status || 'N/A'}</span></td>
                                  <td>${(log.description || 'N/A').substring(0, 80)}${log.description && log.description.length > 80 ? '...' : ''}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>

                          <div class="no-print" style="margin-top: 30px; text-align: center;">
                            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Print / Save as PDF</button>
                            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin-left: 10px; background-color: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
                          </div>
                        </body>
                      </html>
                    `;

                    printWindow.document.write(htmlContent);
                    printWindow.document.close();

                    // Auto-trigger print dialog after a short delay
                    setTimeout(() => {
                      printWindow.print();
                    }, 500);

                    toast({
                      title: "PDF Export initiated",
                      description: `Opening print dialog for ${filteredWorkLogs.length} work logs`,
                    });
                  } catch (error) {
                    console.error('PDF Export error:', error);
                    toast({
                      title: "PDF Export failed",
                      description: "Failed to export work logs to PDF",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Work Logs List */}
      <div className="space-y-4">
        {paginatedWorkLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Work Logs Found</h3>
              <p className="text-muted-foreground">
                {filteredWorkLogs.length === 0 && searchTerm
                  ? 'No work logs match your current search criteria.'
                  : 'No work logs have been created yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedWorkLogs.map((log: any) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1 h-6 rounded"
                          style={{ backgroundColor: workTypeColors[log.workType] || '#gray' }}
                        />
                        <div>
                          <h4 className="font-medium">{getSubFeatureName(log.subFeatureId)}</h4>
                          <p className="text-xs text-muted-foreground">
                            Feature: {getFeatureName(log.featureId)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(log.workDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm leading-relaxed">
                      {highlightText(log.description, searchTerm)}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.hoursWorked}h worked
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        User #{log.userId}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>

                  {/* Status, Work Type and Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewWorkLog(log)}
                        title="View Work Log"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditWorkLog(log)}
                        title="Edit Work Log"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Work Log"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Work Log</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this work log? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteWorkLog(log.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteWorkLogMutation.isPending}
                            >
                              {deleteWorkLogMutation.isPending ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Badge className={statusColors[log.status]}>
                      {log.status}
                    </Badge>
                    <Badge variant="outline">
                      {log.workType}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}


      {/* Work Log View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Work Log Details</DialogTitle>
          </DialogHeader>
          {selectedWorkLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Sub-Feature</h4>
                  <p className="mt-1">{getSubFeatureName(selectedWorkLog.subFeatureId)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Work Date</h4>
                  <p className="mt-1">{format(new Date(selectedWorkLog.workDate), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Hours Worked</h4>
                  <p className="mt-1 font-medium">{selectedWorkLog.hoursWorked} hours</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Work Type</h4>
                  <Badge
                    variant="outline"
                    style={{ borderLeftColor: workTypeColors[selectedWorkLog.workType], borderLeftWidth: '4px' }}
                  >
                    {selectedWorkLog.workType}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                  <Badge className={statusColors[selectedWorkLog.status]}>
                    {selectedWorkLog.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Created</h4>
                  <p className="mt-1">{format(new Date(selectedWorkLog.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Description</h4>
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-sm leading-relaxed">{selectedWorkLog.description}</p>
                </div>
              </div>
              {selectedWorkLog.attachments && selectedWorkLog.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedWorkLog.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Work Log Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Work Log</DialogTitle>
          </DialogHeader>
          {editingWorkLog && (
            <TrackerWorkLogForm
              workLog={editingWorkLog}
              subFeature={subFeatures?.find(sf => sf.id === editingWorkLog.subFeatureId)}
              projectId={projectId}
              onSubmit={(data) => {
                updateWorkLogMutation.mutate({
                  id: editingWorkLog.id,
                  data: {
                    ...data,
                    projectId: projectId,
                    subFeatureId: editingWorkLog.subFeatureId,
                    featureId: editingWorkLog.featureId,
                  }
                });
              }}
              isLoading={updateWorkLogMutation.isPending}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingWorkLog(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkLogsList;