
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { ProjectSelect } from "@/components/ui/project-select";
import { Trello, Plus, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@/types";

export default function KanbanPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Fetch projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-500 text-white p-4 rounded-lg shadow-lg flex-1 mr-4">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Trello className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
                <p className="text-purple-100 mt-1">Visualize your workflow and track progress using this customizable Kanban board</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <ProjectSelect
                projects={projects}
                isLoading={isProjectsLoading}
                selectedProjectId={selectedProjectId?.toString() || ""}
                onChange={(value) => setSelectedProjectId(value ? parseInt(value) : null)}
                placeholder="Select a project"
                className="w-[200px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sprint</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Select a sprint</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Sprint
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Column
            </Button>
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="text-center py-12">
            <Trello className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
            <p className="text-gray-500">Please select a project to view the Kanban board</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <Trello className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Kanban Board</h3>
              <p className="text-gray-500">Kanban board functionality will be implemented here</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
