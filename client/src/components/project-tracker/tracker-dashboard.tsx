import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  DollarSign,
} from 'lucide-react';

interface TrackerProject {
  id: number;
  name: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  createdAt?: string; // Added for sorting recent projects
}

interface TrackerDashboardProps {
  projects: TrackerProject[];
}

export function TrackerDashboard({ projects }: TrackerDashboardProps) {
  // Calculate statistics
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
  const onHoldProjects = projects.filter(p => p.status === 'On Hold').length;
  const highPriorityProjects = projects.filter(p => p.priority === 'High' || p.priority === 'Critical').length;

  const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);

  // Get overdue projects (projects with end date in the past and not completed)
  const overdueProjects = projects.filter(project => {
    if (project.status === 'Completed' || !project.endDate) return false;
    return new Date(project.endDate) < new Date();
  });

  const stats = [
    {
      title: 'Total Projects',
      value: totalProjects.toString(),
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'In Progress',
      value: inProgressProjects.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Completed',
      value: completedProjects.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'High Priority',
      value: highPriorityProjects.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-grid-cols-2 gap-6">
        {/* Project Completion Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Project Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Completion Rate</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planning:</span>
                  <span>{projects.filter(p => p.status === 'Planning').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In Progress:</span>
                  <span>{inProgressProjects}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">On Hold:</span>
                  <span>{onHoldProjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{completedProjects}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview - REMOVED */}
        {/*
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold">
                  ${totalBudget.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Budget Allocated</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projects with Budget:</span>
                  <span>{projects.filter(p => p.budget && p.budget > 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Budget:</span>
                  <span>
                    ${totalProjects > 0 ? Math.round(totalBudget / totalProjects).toLocaleString() : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Projects ({overdueProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueProjects.length === 0 ? (
              <p className="text-muted-foreground">No overdue projects</p>
            ) : (
              <div className="space-y-3">
                {overdueProjects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {project.endDate}
                      </p>
                    </div>
                    <Badge variant="destructive">{project.status}</Badge>
                  </div>
                ))}
                {overdueProjects.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    +{overdueProjects.length - 5} more overdue projects
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects
                .sort((a, b) => {
                  // Ensure createdAt is valid before comparison
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return dateB - dateA;
                })
                .slice(0, 5)
                .map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Badge className={
                      project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {project.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}