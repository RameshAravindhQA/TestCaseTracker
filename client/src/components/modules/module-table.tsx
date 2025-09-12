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
import { Module } from "@/types";
import { format } from "date-fns";
import { Edit, Trash, FolderOpen } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModuleTableProps {
  modules: Module[];
  projectId: number;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
  onViewTestCases: (module: Module) => void;
  project?: { prefix: string; name: string };
}

export function ModuleTable({ modules, projectId, onEdit, onDelete, onViewTestCases, project }: ModuleTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No modules found.
              </TableCell>
            </TableRow>
          ) : (
            modules.map((module, index) => (
              <motion.tr
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: "easeOut"
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewTestCases(module);
                }}
                className="border-b transition-colors hover:bg-muted/50 hover:shadow-sm data-[state=selected]:bg-muted cursor-pointer"
                whileHover={{ scale: 1.002, backgroundColor: "rgba(0,0,0,0.02)" }}
                style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}

              >
                <TableCell className="font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-bold cursor-help">
                          {module.moduleId || `MOD-${String(module.id).padStart(3, '0')}`}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div><strong>Module ID:</strong> {module.moduleId || `MOD-${String(module.id).padStart(3, '0')}`}</div>
                          <div><strong>Module Name:</strong> {module.name}</div>
                          {project && <div><strong>Project:</strong> {project.prefix} - {project.name}</div>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="hover:text-primary hover:underline cursor-help"
                        >
                          {module.name}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div><strong>Full Module Name:</strong> {module.name}</div>
                          <div><strong>Module ID:</strong> {module.moduleId || `MOD-${String(module.id).padStart(3, '0')}`}</div>
                          {project && <div><strong>Project:</strong> {project.prefix} - {project.name}</div>}
                          {module.description && <div><strong>Description:</strong> {module.description}</div>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {module.description || "-"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={module.status} />
                </TableCell>
                <TableCell>
                  {format(new Date(module.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onViewTestCases(module);
                      }}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        <span>View Test Cases</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit(module);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onDelete(module);
                      }}>
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}