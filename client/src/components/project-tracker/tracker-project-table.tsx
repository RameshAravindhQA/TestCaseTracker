import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, Eye, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

interface TrackerProject {
  id: number;
  name: string;
  description?: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  startDate?: string;
  endDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  budget?: number;
  currency?: string;
  createdAt: string;
}

interface TrackerProjectTableProps {
  projects: TrackerProject[];
  isLoading: boolean;
  onEdit: (project: TrackerProject) => void;
  onDelete: (id: number) => void;
  onViewDetails: (projectId: number) => void;
  currentPage?: number;
  setCurrentPage?: (page: number) => void;
  itemsPerPage?: number;
}

const statusColors = {
  'Planning': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Completed': 'bg-green-100 text-green-800',
  'On Hold': 'bg-gray-100 text-gray-800',
  'Cancelled': 'bg-red-100 text-red-800',
};

const priorityColors = {
  'Low': 'bg-gray-100 text-gray-800',
  'Medium': 'bg-blue-100 text-blue-800',
  'High': 'bg-orange-100 text-orange-800',
  'Critical': 'bg-red-100 text-red-800',
};

export function TrackerProjectTable({
  projects,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
  currentPage = 1,
  setCurrentPage,
  itemsPerPage = 10,
}: TrackerProjectTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">No projects found. Create your first project to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProjects = projects.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Projects ({projects.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{project.name}</div>
                    {project.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {project.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[project.status]}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[project.priority]}>
                    {project.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {project.startDate && project.endDate ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(project.startDate), 'MMM dd')} - {format(new Date(project.endDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No timeline set</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500">
                    {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(project.id)}
                      className="h-8 w-8 p-0"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(project)}
                      className="h-8 w-8 p-0"
                      title="Edit Project"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(project.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      title="Delete Project"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">More options</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEdit(project)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(project.id)}
                          className="text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewDetails(project.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Projects Pagination */}
        {totalPages > 1 && setCurrentPage && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="min-w-[32px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <span className="text-sm text-gray-600 mx-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}