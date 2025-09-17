import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { TrackerProjectForm } from './tracker-project-form';
import { TrackerProjectTable } from './tracker-project-table';
import {
  Target,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  DollarSign,
  Plus,
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
  const { toast } = useToast();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/tracker/projects', data);
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/projects'] });
      setShowProjectForm(false);
      setSelectedProject(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/tracker/projects/${id}`, data);
      if (!response.ok) throw new Error('Failed to update project');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/projects'] });
      setShowProjectForm(false);
      setSelectedProject(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/tracker/projects/${id}`);
      if (!response.ok) throw new Error('Failed to delete project');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/projects'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    },
  });

  const handleCreateProject = (data: any) => {
    console.log('Creating project with data:', data);
    createProjectMutation.mutate(data);
  };

  const handleUpdateProject = (data: any) => {
    if (selectedProject?.id) {
      console.log('Updating project with data:', data);
      updateProjectMutation.mutate({ id: selectedProject.id, data });
    }
  };

  const handleEditProject = (project: any) => {
    console.log("Editing project:", project);
    setSelectedProject(project);
    setShowProjectForm(true);
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const handleViewDetails = (project: any) => {
    console.log("Viewing details for project:", project);
    setSelectedProjectId(project.id);
    // Logic to show details, e.g., navigate to project details page
  };

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

  // Filtering logic (basic example)
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || project.status === statusFilter) &&
    (priorityFilter === 'all' || project.priority === priorityFilter)
  );

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

      {/* Placeholder for Project Search and Filters */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded-md w-1/3"
        />
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
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

      {/* Project List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Project List</span>
            <Button
              onClick={() => {
                setSelectedProject(null);
                setShowProjectForm(true);
              }}
              className="flex items-center gap-2"
              disabled={createProjectMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              {createProjectMutation.isPending ? 'Adding...' : 'Add Project'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* This is where the project table with pagination will be rendered */}
          <TrackerProjectTable
            projects={filteredProjects}
            isLoading={isLoading}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onViewDetails={handleViewDetails}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={10}
          />
        </CardContent>
      </Card>

      {/* Add Project Form Dialog */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedProject ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button
                onClick={() => {
                  setShowProjectForm(false);
                  setSelectedProject(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <TrackerProjectForm
              project={selectedProject}
              onSubmit={selectedProject ? handleUpdateProject : handleCreateProject}
              onCancel={() => {
                setShowProjectForm(false);
                setSelectedProject(null);
              }}
              isLoading={false}
            />
          </div>
        </div>
      )}
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