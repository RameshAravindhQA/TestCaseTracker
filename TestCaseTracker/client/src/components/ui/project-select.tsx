import { Project } from "@/types";
import { 
  Select,
  SelectContent, 
  SelectTrigger, 
  SelectValue,
  SelectItem
} from "./select";
import { StatusBadge } from "./status-badge";

interface ProjectSelectProps {
  projects: Project[] | undefined;
  isLoading: boolean;
  selectedProjectId: number | string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function ProjectSelect({
  projects,
  isLoading,
  selectedProjectId,
  onChange,
  className,
  placeholder = "Select a project"
}: ProjectSelectProps) {
  return (
    <Select
      value={selectedProjectId?.toString() || ''}
      onValueChange={onChange}
      disabled={isLoading}
      data-testid="project-select"
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Loading projects...
          </SelectItem>
        ) : projects && projects.length > 0 ? (
          projects.map((project) => (
            <SelectItem 
              key={project.id} 
              value={project.id.toString()} 
              className="flex items-center justify-between pr-8"
            >
              <span>{project.name}</span>
              <StatusBadge status={project.status} className="ml-2" />
            </SelectItem>
          ))
        ) : (
          <SelectItem value="empty" disabled>
            No projects found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}