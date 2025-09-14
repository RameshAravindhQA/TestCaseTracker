
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, FileDown, Calendar, Users, Target, Activity } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { TrackerProjectForm } from '@/components/project-tracker/tracker-project-form';
import { TrackerProjectTable } from '@/components/project-tracker/tracker-project-table';
import { TrackerDashboard } from '@/components/project-tracker/tracker-dashboard';
import { TrackerReports } from '@/components/project-tracker/tracker-reports';
import { TrackerProjectDetails } from '@/components/project-tracker/tracker-project-details';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TrackerProject {
  id: number;
  name: string;
  description?: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  ownerId: number;
  departmentId?: number;
  budget?: number;
  currency?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  createdById: number;
  createdAt: string;
  updatedAt?: string;
}

export default function ProjectTrackerPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<TrackerProject | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    department: 'all',
  });

  // Fetch tracker projects
  const { data: projects, isLoading: projectsLoading } = useQuery<TrackerProject[]>({
    queryKey: ['/api/tracker/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tracker/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

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
    createProjectMutation.mutate(data);
  };

  const handleUpdateProject = (data: any) => {
    if (selectedProject) {
      updateProjectMutation.mutate({ id: selectedProject.id, data });
    }
  };

  const handleDeleteProject = (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleEditProject = (project: TrackerProject) => {
    setSelectedProject(project);
    setShowProjectForm(true);
  };

  const handleViewDetails = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowProjectDetails(true);
  };

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filters.status === 'all' || project.status === filters.status;
    const matchesPriority = filters.priority === 'all' || project.priority === filters.priority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  // Show project details if selected
  if (showProjectDetails && selectedProjectId) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 px-4">
          <TrackerProjectDetails
            projectId={selectedProjectId}
            onBack={() => {
              setShowProjectDetails(false);
              setSelectedProjectId(null);
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-500 rounded-xl shadow-lg">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Project Tracker</h1>
              <p className="text-muted-foreground mt-1">
                Manage projects, features, and sub-features with timeline tracking
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              setSelectedProject(null);
              setShowProjectForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <TrackerDashboard projects={projects || []} />
          </TabsContent>

          <TabsContent value="projects">
            <div className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search & Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search projects..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Status</option>
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Priority</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4" />
                        More Filters
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projects Table */}
              <TrackerProjectTable
                projects={filteredProjects}
                isLoading={projectsLoading}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                onViewDetails={handleViewDetails}
              />
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Timeline view will be implemented here showing Gantt chart of all projects.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <TrackerReports projects={projects || []} />
          </TabsContent>
        </Tabs>

        {/* Project Form Dialog */}
        <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedProject ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
            </DialogHeader>
            <TrackerProjectForm
              project={selectedProject}
              onSubmit={selectedProject ? handleUpdateProject : handleCreateProject}
              onCancel={() => {
                setShowProjectForm(false);
                setSelectedProject(null);
              }}
              isLoading={createProjectMutation.isPending || updateProjectMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
