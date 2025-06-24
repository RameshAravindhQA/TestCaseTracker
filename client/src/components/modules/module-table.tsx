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

interface ModuleTableProps {
  modules: Module[];
  projectId: number;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
  onViewTestCases: (module: Module) => void;
  project?: { prefix: string };
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
                onClick={() => onViewTestCases(module)}
                className="border-b transition-colors hover:bg-muted/50 hover:shadow-sm data-[state=selected]:bg-muted cursor-pointer"
                whileHover={{ scale: 1.005, backgroundColor: "rgba(0,0,0,0.02)" }}

              >
                <TableCell className="font-medium text-muted-foreground">
                  <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded border">
                    MOD-{String(module.id).padStart(3, '0')}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  <div 
                    className="hover:text-primary hover:underline"
                  >
                    {module.name}
                  </div>
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