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
  projects?: Project[];
  isLoading?: boolean;
  selectedProjectId: number | string | null;
  onChange: (value: string) => void;
  onProjectChange?: (projectId: number | null) => void;
  className?: string;
  placeholder?: string;
}

export function ProjectSelect({
  projects,
  isLoading = false,
  selectedProjectId,
  onChange,
  onProjectChange,
  className,
  placeholder = "Select a project"
}: ProjectSelectProps) {
  const handleValueChange = (value: string) => {
    onChange(value);
    if (onProjectChange) {
      const projectId = value === "no-projects" || value === "loading" ? null : parseInt(value);
      onProjectChange(projectId);
    }
  };

  return (
    <Select
      value={selectedProjectId?.toString() || ""}
      onValueChange={handleValueChange}
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
          <SelectItem value="no-projects" disabled>
            No projects found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}