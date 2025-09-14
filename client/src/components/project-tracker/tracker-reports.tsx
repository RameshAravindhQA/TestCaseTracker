
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface TrackerProject {
  id: number;
  name: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget?: number;
  currency?: string;
  createdAt: string;
}

interface TrackerReportsProps {
  projects: TrackerProject[];
}

export function TrackerReports({ projects }: TrackerReportsProps) {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('all');

  // Calculate delay statistics
  const getDelayStatistics = () => {
    const projectsWithDelay = projects.filter(project => {
      if (!project.endDate || !project.actualEndDate) return false;
      return new Date(project.actualEndDate) > new Date(project.endDate);
    });

    const totalDelayDays = projectsWithDelay.reduce((total, project) => {
      const planned = new Date(project.endDate!);
      const actual = new Date(project.actualEndDate!);
      const diffTime = Math.abs(actual.getTime() - planned.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return total + diffDays;
    }, 0);

    return {
      delayedProjects: projectsWithDelay.length,
      averageDelay: projectsWithDelay.length > 0 ? Math.round(totalDelayDays / projectsWithDelay.length) : 0,
      totalDelayDays,
    };
  };

  const delayStats = getDelayStatistics();

  // Export functions
  const exportToCSV = () => {
    const headers = [
      'Project Name',
      'Status',
      'Priority',
      'Start Date',
      'End Date',
      'Actual Start',
      'Actual End',
      'Budget',
      'Created Date',
    ];

    const csvData = projects.map(project => [
      project.name,
      project.status,
      project.priority,
      project.startDate || '',
      project.endDate || '',
      project.actualStartDate || '',
      project.actualEndDate || '',
      project.budget ? `${project.currency} ${project.budget}` : '',
      new Date(project.createdAt).toLocaleDateString(),
    ]);

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
          {/* Project Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'].map(status => {
                  const count = projects.filter(p => p.status === status).length;
                  const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{status}</Badge>
                        <span className="text-sm">{count} projects</span>
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

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Critical', 'High', 'Medium', 'Low'].map(priority => {
                  const count = projects.filter(p => p.priority === priority).length;
                  const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                  
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={
                            priority === 'Critical' ? 'bg-red-100 text-red-800' :
                            priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {priority}
                        </Badge>
                        <span className="text-sm">{count} projects</span>
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
