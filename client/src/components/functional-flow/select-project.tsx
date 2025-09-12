import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project } from "@/../../shared/schema";

interface SelectProjectProps {
  onSelect: (projectId: number) => void;
  selectedId: number | null;
}

export function SelectProject({ onSelect, selectedId }: SelectProjectProps) {
  // Fetch projects from API
  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle project selection
  const handleProjectChange = (value: string) => {
    onSelect(parseInt(value));
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="project-select" className="text-sm font-medium text-gray-700">
            Select Project
          </label>
          <Select
            value={selectedId ? String(selectedId) : undefined}
            onValueChange={handleProjectChange}
            disabled={isLoading}
          >
            <SelectTrigger id="project-select" className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Loading projects...
                </SelectItem>
              ) : isError ? (
                <SelectItem value="error" disabled>
                  Error loading projects
                </SelectItem>
              ) : !projects || projects.length === 0 ? (
                <SelectItem value="empty" disabled>
                  No projects available
                </SelectItem>
              ) : (
                projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}