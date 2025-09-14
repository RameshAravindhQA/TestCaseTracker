
import React, { useState } from 'react';
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
import { FileDown, Calendar, TrendingUp, Clock, Target } from 'lucide-react';

interface TrackerReportsProps {
  projectId: number;
  features?: any[];
  subFeatures?: any[];
}

export function TrackerReports({ projectId, features = [], subFeatures = [] }: TrackerReportsProps) {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('all');

  // Fetch work logs for reports
  const { data: workLogs } = useQuery({
    queryKey: [`/api/tracker/work-logs`, projectId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/work-logs?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch work logs');
      return response.json();
    },
  });

  // Fetch project data
  const { data: project } = useQuery({
    queryKey: [`/api/tracker/projects/${projectId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
  });

  // Calculate delay statistics
  const getDelayStatistics = () => {
    const delayedSubFeatures = subFeatures.filter(subFeature => {
      if (!subFeature.endDate || subFeature.status === 'Completed') return false;
      return new Date() > new Date(subFeature.endDate);
    });

    const totalDelayDays = delayedSubFeatures.reduce((total, subFeature) => {
      const planned = new Date(subFeature.endDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - planned.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return total + diffDays;
    }, 0);

    return {
      delayedProjects: delayedSubFeatures.length,
      averageDelay: delayedSubFeatures.length > 0 ? Math.round(totalDelayDays / delayedSubFeatures.length) : 0,
      totalDelayDays,
    };
  };

  const delayStats = getDelayStatistics();

  // Export functions
  const exportToCSV = () => {
    const headers = [
      'Sub-Feature Name',
      'Feature',
      'Status',
      'Work Type',
      'Department',
      'Start Date',
      'End Date',
      'Estimated Hours',
      'Total Work Hours',
      'Created Date',
    ];

    const csvData = subFeatures.map(subFeature => {
      const feature = features.find(f => f.id === subFeature.featureId);
      const logs = workLogs?.filter(wl => wl.subFeatureId === subFeature.id) || [];
      const totalHours = logs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
      
      return [
        subFeature.name,
        feature?.name || 'Unknown',
        subFeature.status,
        subFeature.workType,
        subFeature.department || '',
        subFeature.startDate || '',
        subFeature.endDate || '',
        subFeature.estimatedHours || '',
        totalHours,
        new Date(subFeature.createdAt).toLocaleDateString(),
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `project-tracker-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    // This would integrate with a PDF library like jsPDF
    alert('PDF export functionality would be implemented here');
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
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Report Type:</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="delay">Delay Analysis</SelectItem>
                  <SelectItem value="budget">Budget Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date Range:</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisQuarter">This Quarter</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={exportToCSV}>
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportToPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportType === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sub-Feature Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Sub-Feature Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Planning', 'In Progress', 'Completed', 'On Hold', 'Blocked'].map(status => {
                  const count = subFeatures.filter(sf => sf.status === status).length;
                  const percentage = subFeatures.length > 0 ? (count / subFeatures.length) * 100 : 0;
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{status}</Badge>
                        <span className="text-sm">{count} sub-features</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Work Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Work Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Development', 'QA', 'DevOps', 'Designing', 'Analysis', 'Documentation'].map(workType => {
                  const count = subFeatures.filter(sf => sf.workType === workType).length;
                  const percentage = subFeatures.length > 0 ? (count / subFeatures.length) * 100 : 0;
                  
                  return (
                    <div key={workType} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{workType}</Badge>
                        <span className="text-sm">{count} sub-features</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Work Hours Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Work Hours Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {subFeatures.reduce((sum, sf) => sum + (sf.estimatedHours || 0), 0)}h
                  </p>
                  <p className="text-sm text-muted-foreground">Estimated Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {workLogs?.reduce((sum, wl) => sum + (wl.hoursWorked || 0), 0) || 0}h
                  </p>
                  <p className="text-sm text-muted-foreground">Actual Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {workLogs?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Work Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'delay' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Delay Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-red-600">{delayStats.delayedProjects}</p>
                  <p className="text-sm text-muted-foreground">Delayed Projects</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{delayStats.averageDelay}</p>
                  <p className="text-sm text-muted-foreground">Average Delay (days)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{delayStats.totalDelayDays}</p>
                  <p className="text-sm text-muted-foreground">Total Delay Days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Timeline vs Actual Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects
                  .filter(p => p.endDate && p.actualEndDate)
                  .slice(0, 10)
                  .map(project => {
                    const planned = new Date(project.endDate!);
                    const actual = new Date(project.actualEndDate!);
                    const isDelayed = actual > planned;
                    const diffTime = Math.abs(actual.getTime() - planned.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    return (
                      <div key={project.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Planned: {planned.toLocaleDateString()} | 
                            Actual: {actual.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={isDelayed ? "destructive" : "default"}>
                            {isDelayed ? `+${diffDays} days` : `On time`}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Timeline Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects
                .filter(p => p.startDate && p.endDate)
                .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())
                .map(project => (
                  <div key={project.id} className="p-4 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{project.name}</h4>
                      <Badge className={
                        project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Planned Timeline:</p>
                        <p>{new Date(project.startDate!).toLocaleDateString()} - {new Date(project.endDate!).toLocaleDateString()}</p>
                      </div>
                      {project.actualStartDate && project.actualEndDate && (
                        <div>
                          <p className="text-muted-foreground">Actual Timeline:</p>
                          <p>{new Date(project.actualStartDate).toLocaleDateString()} - {new Date(project.actualEndDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">
                    ${projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Budget Allocated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {projects.filter(p => p.budget && p.budget > 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Projects with Budget</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Planning', 'In Progress', 'Completed', 'On Hold'].map(status => {
                  const statusProjects = projects.filter(p => p.status === status);
                  const statusBudget = statusProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <Badge variant="outline">{status}</Badge>
                      <span className="font-medium">${statusBudget.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
