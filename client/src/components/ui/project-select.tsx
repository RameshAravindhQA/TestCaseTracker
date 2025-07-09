
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Project {
  id: number;
  name: string;
}

interface ProjectSelectProps {
  selectedProjectId: number | null;
  onProjectChange: (projectId: number | null) => void;
  projects: Project[];
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function ProjectSelect({
  selectedProjectId,
  onProjectChange,
  projects,
  label = "Project",
  placeholder = "Select project",
  className = "",
  required = false
}: ProjectSelectProps) {
  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select 
        value={selectedProjectId?.toString() || ""} 
        onValueChange={(value) => onProjectChange(value ? parseInt(value) : null)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {projects?.map((project: Project) => (
            <SelectItem key={project.id} value={project.id.toString()}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
