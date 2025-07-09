import { MainLayout } from "@/components/layout/main-layout";
import { TestSheetEditor } from "@/components/test-sheets/test-sheet-editor";
import { OnlyOfficeEditor } from "@/components/test-sheets/onlyoffice-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectSelect } from "@/components/ui/project-select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { FileText, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
}

export default function TestSheetsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/projects', {
        credentials: 'include'
      });

      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);

        // Auto-select first project if available
        if (projectsData.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectsData[0].id);
        }
      } else {
        console.error('Failed to load projects');
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test Sheets</h1>
              <p className="text-gray-600 dark:text-gray-400">Create and manage test documentation with OnlyOffice</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-64">
              <ProjectSelect
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={isLoading}
              />
            </div>
            <Button disabled={!selectedProjectId}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          </div>
        ) : selectedProjectId ? (
          <Tabs defaultValue="matrix" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="matrix">Test Sheet Matrix</TabsTrigger>
              <TabsTrigger value="onlyoffice">OnlyOffice Editor</TabsTrigger>
            </TabsList>
            <TabsContent value="matrix" className="space-y-4">
              <TestSheetEditor projectId={selectedProjectId} />
            </TabsContent>
            <TabsContent value="onlyoffice" className="space-y-4">
              <OnlyOfficeEditor projectId={selectedProjectId} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-64">
            <Card className="w-96">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {projects.length === 0 ? 'No Projects Available' : 'Select a Project'}
                </h3>
                <p className="text-gray-600">
                  {projects.length === 0 
                    ? 'Create a project first to start working with test sheets.' 
                    : 'Choose a project to start working with test sheets.'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}