
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Search, Filter, FileText, BarChart3, Download } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface WorkLogsListProps {
  projectId?: number;
  featureId?: number;
  subFeatureId?: number;
}

export function WorkLogsList({ projectId, featureId, subFeatureId }: WorkLogsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

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

  const getSubFeatureName = (subFeatureId: number) => {
    return subFeatures?.find(sf => sf.id === subFeatureId)?.name || 'Unknown';
  };

  const filteredWorkLogs = workLogs?.filter((log: any) => {
    const matchesSearch = log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getSubFeatureName(log.subFeatureId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesWorkType = workTypeFilter === 'all' || log.workType === workTypeFilter;
    return matchesSearch && matchesStatus && matchesWorkType;
  }) || [];

  const totalHours = filteredWorkLogs.reduce((sum: number, log: any) => sum + (log.hoursWorked || 0), 0);

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
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
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work Logs List */}
      <div className="space-y-4">
        {filteredWorkLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Work Logs Found</h3>
              <p className="text-muted-foreground">
                {workLogs?.length === 0 
                  ? 'No work logs have been created yet.'
                  : 'No work logs match your current filters.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkLogs.map((log: any) => (
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
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(log.workDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm leading-relaxed">{log.description}</p>

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

                  {/* Status and Work Type */}
                  <div className="flex flex-col items-end gap-2">
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
    </div>
  );
}

export default WorkLogsList;
