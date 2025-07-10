import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Project } from "@/types";
import { format } from "date-fns";
import { useMemo } from "react";

interface ProjectsTableProps {
  projects: Project[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  // Calculate project completion percentages based on project data
  const projectsWithCompletionPercentage = useMemo(() => {
    return projects.map(project => {
      // Calculate completion percentage based on project status
      let completionPercentage = 0;
      
      if (project.status === "Completed") {
        completionPercentage = 100;
      } else if (project.status === "Active") {
        // For active projects, you could compute based on modules/test cases
        // This is a random value between 60-90% for demo purposes
        completionPercentage = 60 + Math.floor(Math.random() * 30);
      } else if (project.status === "On Hold") {
        // For on-hold projects, typically less complete
        // This is a random value between 30-60% for demo purposes
        completionPercentage = 30 + Math.floor(Math.random() * 30);
      }
      
      return {
        ...project,
        completionPercentage
      };
    });
  }, [projects]);
  
  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {projectsWithCompletionPercentage.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <Link href={`/projects/${project.id}`} className="text-sm font-medium text-gray-900 hover:text-primary hover:underline">
                  {project.name}
                </Link>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <Badge variant="outline" className={
                  project.status === "Active" 
                    ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-white dark:border-blue-700" 
                    : project.status === "Completed"
                    ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-white dark:border-green-700"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-white dark:border-yellow-700"
                }>
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      project.status === "Completed" 
                        ? "bg-green-500" 
                        : project.status === "Active" 
                        ? "bg-blue-500" 
                        : "bg-yellow-500"
                    }`}
                    style={{ width: `${project.completionPercentage}%` }} 
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">
                  {project.completionPercentage}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
