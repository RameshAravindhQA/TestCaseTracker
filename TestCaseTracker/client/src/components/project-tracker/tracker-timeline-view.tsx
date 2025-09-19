
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns';

interface TimelineViewProps {
  projectId: number;
}

export function TimelineView({ projectId }: TimelineViewProps) {
  const [viewMode, setViewMode] = useState('gantt');
  const [timeRange, setTimeRange] = useState('all');
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: [`/api/tracker/projects/${projectId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
  });

  // Fetch features
  const { data: features } = useQuery({
    queryKey: [`/api/tracker/features`, projectId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/features?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    },
  });

  // Fetch sub-features
  const { data: subFeatures } = useQuery({
    queryKey: [`/api/tracker/sub-features`, projectId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/sub-features?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch sub-features');
      return response.json();
    },
  });

  // Fetch work logs
  const { data: workLogs } = useQuery({
    queryKey: [`/api/tracker/work-logs`, projectId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracker/work-logs?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch work logs');
      return response.json();
    },
  });

  const toggleFeatureExpansion = (featureId: number) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
    }
    setExpandedFeatures(newExpanded);
  };

  const getFeatureSubFeatures = (featureId: number) => {
    return subFeatures?.filter(sf => sf.featureId === featureId) || [];
  };

  const getSubFeatureWorkLogs = (subFeatureId: number) => {
    return workLogs?.filter(wl => wl.subFeatureId === subFeatureId) || [];
  };

  const calculateProgress = (item: any) => {
    if (item.startDate && item.endDate) {
      const total = differenceInDays(parseISO(item.endDate), parseISO(item.startDate));
      const elapsed = differenceInDays(new Date(), parseISO(item.startDate));
      return Math.min(Math.max((elapsed / total) * 100, 0), 100);
    }
    return 0;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Planning': 'bg-blue-500',
      'Design': 'bg-purple-500',
      'Development': 'bg-orange-500',
      'Testing': 'bg-yellow-500',
      'Deployment': 'bg-indigo-500',
      'In Progress': 'bg-yellow-500',
      'Completed': 'bg-green-500',
      'On Hold': 'bg-gray-500',
      'Cancelled': 'bg-red-500',
      'Blocked': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getTimelineBar = (startDate: string, endDate: string, status: string) => {
    if (!startDate || !endDate) return null;
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const now = new Date();
    const progress = calculateProgress({ startDate, endDate });
    const isOverdue = isAfter(now, end) && status !== 'Completed';

    return (
      <div className="relative h-6 bg-gray-200 rounded overflow-hidden">
        <div 
          className={`h-full ${getStatusColor(status)} ${isOverdue ? 'opacity-75' : ''}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        {isOverdue && (
          <div className="absolute inset-0 border-2 border-red-500 border-dashed rounded" />
        )}
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
          {Math.round(progress)}%
        </div>
      </div>
    );
  };

  if (!project || !features) {
    return <div>Loading timeline...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Project Timeline</span>
              </div>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gantt">Gantt View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="calendar">Calendar View</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="nextMonth">Next Month</SelectItem>
                  <SelectItem value="thisQuarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {project.startDate && project.endDate && (
                <>
                  {format(parseISO(project.startDate), 'MMM dd, yyyy')} - {format(parseISO(project.endDate), 'MMM dd, yyyy')}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project: {project.name}</span>
            <Badge className={`${getStatusColor(project.status)} text-white`}>
              {project.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.startDate && project.endDate && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {format(parseISO(project.startDate), 'MMM dd')} - {format(parseISO(project.endDate), 'MMM dd')}
                </span>
              </div>
              {getTimelineBar(project.startDate, project.endDate, project.status)}
            </div>
          )}

          {/* Features Timeline */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Features Timeline</h4>
            {features.map((feature: any) => (
              <div key={feature.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeatureExpansion(feature.id)}
                    >
                      {expandedFeatures.has(feature.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <h5 className="font-medium">{feature.name}</h5>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(feature.status)} text-white`}>
                      {feature.status}
                    </Badge>
                    {feature.startDate && feature.endDate && (
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(feature.startDate), 'MMM dd')} - {format(parseISO(feature.endDate), 'MMM dd')}
                      </span>
                    )}
                  </div>
                </div>

                {feature.startDate && feature.endDate && (
                  <div className="mb-3">
                    {getTimelineBar(feature.startDate, feature.endDate, feature.status)}
                  </div>
                )}

                {/* Sub-features Timeline */}
                {expandedFeatures.has(feature.id) && (
                  <div className="ml-8 space-y-3">
                    {getFeatureSubFeatures(feature.id).map((subFeature: any) => {
                      const logs = getSubFeatureWorkLogs(subFeature.id);
                      const totalHours = logs.reduce((sum: number, log: any) => sum + (log.hoursWorked || 0), 0);
                      
                      return (
                        <div key={subFeature.id} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h6 className="font-medium text-sm">{subFeature.name}</h6>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">{subFeature.workType}</Badge>
                                {subFeature.estimatedHours && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {totalHours}/{subFeature.estimatedHours}h
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(subFeature.status)} text-white text-xs`}>
                                {subFeature.status}
                              </Badge>
                              {subFeature.startDate && subFeature.endDate && (
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(subFeature.startDate), 'MMM dd')} - {format(parseISO(subFeature.endDate), 'MMM dd')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {subFeature.startDate && subFeature.endDate && (
                            <div className="mt-2">
                              {getTimelineBar(subFeature.startDate, subFeature.endDate, subFeature.status)}
                            </div>
                          )}

                          {/* Work Logs Summary */}
                          {logs.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span>{logs.length} work logs</span> • 
                              <span className="ml-1">Last updated: {format(parseISO(logs[0].createdAt), 'MMM dd, HH:mm')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TimelineView;
