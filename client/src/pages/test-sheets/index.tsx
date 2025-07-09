import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { TestSheetEditor } from '@/components/test-sheets/test-sheet-editor';
import { OnlyOfficeEditor } from '@/components/test-sheets/onlyoffice-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Table, Presentation, Eye, Download, Trash2, TestTube2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ProjectSelect } from '@/components/ui/project-select';

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface TestSheet {
  id: string;
  name: string;
  type: 'text' | 'spreadsheet' | 'presentation';
  projectId: number;
  createdAt: string;
  lastModified: string;
  createdBy: number;
  description?: string;
}

export default function TestSheetsPage() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [testSheets, setTestSheets] = useState<TestSheet[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<TestSheet | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [newSheet, setNewSheet] = useState({
    name: '',
    type: 'text' as 'text' | 'spreadsheet' | 'presentation',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
    loadTestSheets();
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTestSheets = async () => {
    try {
      setIsLoading(true);
      const url = selectedProject 
        ? `/api/onlyoffice/documents?projectId=${selectedProject}`
        : '/api/onlyoffice/documents';

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTestSheets(data);
      }
    } catch (error) {
      console.error('Failed to load test sheets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test sheets',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg">
              <TestTube2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test Sheets</h1>
              <p className="text-gray-600 dark:text-gray-400">Create and manage test documentation with OnlyOffice</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-64">
              <Label htmlFor="project" className="text-sm font-medium">
                Project
              </Label>
              <ProjectSelect
                value={selectedProject}
                onValueChange={setSelectedProject}
                placeholder="Select project"
              />
            </div>
            <Button onClick={() => setShowCreateDialog(true)} disabled={!selectedProject}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}