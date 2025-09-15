import React, { useState, useEffect } from 'react';
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

// Assuming TrackerProjectTable component exists and accepts pagination props
// import TrackerProjectTable from './TrackerProjectTable'; // Placeholder for actual import

// Mocking the TrackerProjectTable component for demonstration purposes
const TrackerProjectTable = ({
  projects,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}: any) => {
  const totalItems = projects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentProjects = projects.slice(startIndex, endIndex);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th scope="col" className="relative px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">Loading...</td>
              </tr>
            ) : currentProjects.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">No projects found.</td>
              </tr>
            ) : (
              currentProjects.map((project: any) => (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge
                      className={
                        project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        project.status === 'On Hold' ? 'bg-orange-100 text-orange-800' :
                        project.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }
                    >
                      {project.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge
                      variant={
                        project.priority === 'High' || project.priority === 'Critical' ? 'destructive' :
                        project.priority === 'Medium' ? 'secondary' : 'outline'
                      }
                    >
                      {project.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => onEdit(project)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => onDelete(project.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    <button onClick={() => onViewDetails(project)} className="text-blue-600 hover:text-blue-900">Details</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalItems > itemsPerPage && (
        <div className="mt-4 flex justify-center">
          <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                aria-current={currentPage === i + 1 ? 'page' : undefined}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${currentPage === i + 1 ? 'bg-indigo-50 border-indigo-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'} focus:z-20 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};


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
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Dummy data and handlers for demonstration purposes
  const [isLoading, setIsLoading] = useState(false);
  const handleEditProject = (project: any) => {
    console.log("Editing project:", project);
    setSelectedProject(project);
    setShowProjectForm(true);
  };
  const handleDeleteProject = (projectId: number) => {
    console.log("Deleting project:", projectId);
    // Actual delete logic would go here
  };
  const handleViewDetails = (project: any) => {
    console.log("Viewing details for project:", project);
    // Logic to show details, e.g., in a modal
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
            <button
              onClick={() => setShowProjectForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Project
            </button>
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