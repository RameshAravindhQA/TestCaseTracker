import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Project } from "@/types";
import { format } from "date-fns";
import { Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectTable({ projects, onEdit, onDelete }: ProjectTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    No projects found.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project, index) => (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.3 
                  }}
                >
                  <TableCell className="font-medium">
                    <Link href={`/projects/${project.id}`} className="text-primary hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {project.description || "-"}
                  </TableCell>
                  <TableCell>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === "Active" 
                          ? "bg-blue-100 text-blue-800 border border-blue-300" 
                          : project.status === "Completed" 
                          ? "bg-green-100 text-green-800 border border-green-300" 
                          : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      }`}
                    >
                      <span className={`mr-1.5 h-2 w-2 rounded-full ${
                        project.status === "Active" 
                          ? "bg-blue-500" 
                          : project.status === "Completed" 
                          ? "bg-green-500" 
                          : "bg-yellow-500"
                      }`}></span>
                      {project.status}
                    </motion.div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(project)}>
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </motion.div>
  );
}