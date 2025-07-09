
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileSpreadsheet, FileText, Presentation, Edit, Trash2, Download, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface OnlyOfficeDocument {
  id: string;
  title: string;
  type: 'text' | 'spreadsheet' | 'presentation';
  projectId: number;
  createdBy: number;
  createdAt: string;
  lastModified: string;
  fileType: string;
  key: string;
  url: string;
}

interface Project {
  id: number;
  name: string;
}

export default function TestSheetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentType, setNewDocumentType] = useState<'text' | 'spreadsheet' | 'presentation'>('spreadsheet');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<OnlyOfficeDocument | null>(null);
  const [editorConfig, setEditorConfig] = useState<any>(null);

  // Get projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return response.json();
    }
  });

  // Get OnlyOffice documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['onlyoffice', 'documents'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/onlyoffice/documents');
      return response.json();
    }
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      type: 'text' | 'spreadsheet' | 'presentation';
      projectId: number;
    }) => {
      const response = await apiRequest('POST', '/api/onlyoffice/documents', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Document created',
        description: 'Document created successfully',
      });
      setIsCreateDialogOpen(false);
      setNewDocumentTitle('');
      queryClient.invalidateQueries({ queryKey: ['onlyoffice', 'documents'] });
      openDocument(data);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create document',
        variant: 'destructive',
      });
    }
  });

  const openDocument = async (document: OnlyOfficeDocument) => {
    try {
      const response = await apiRequest('GET', `/api/onlyoffice/documents/${document.id}/config`);
      const config = await response.json();
      
      setSelectedDocument(document);
      setEditorConfig({
        ...config,
        width: '100%',
        height: '600px',
        events: {
          onDocumentReady: () => {
            console.log('Document is ready');
          },
          onDocumentStateChange: (event: any) => {
            console.log('Document state changed:', event);
          },
          onRequestSaveAs: (event: any) => {
            console.log('Save as requested:', event);
          },
          onError: (event: any) => {
            console.error('OnlyOffice error:', event);
            toast({
              title: 'Editor Error',
              description: 'An error occurred in the document editor',
              variant: 'destructive',
            });
          }
        }
      });
    } catch (error) {
      console.error('Error opening document:', error);
      toast({
        title: 'Error',
        description: 'Failed to open document',
        variant: 'destructive',
      });
    }
  };

  // Initialize OnlyOffice editor when config is set
  useEffect(() => {
    if (editorConfig && selectedDocument && window.DocsAPI) {
      // Clear previous editor if exists
      const editorContainer = document.getElementById('onlyoffice-editor');
      if (editorContainer) {
        editorContainer.innerHTML = '';
      }

      // Create new editor
      new window.DocsAPI.DocEditor('onlyoffice-editor', editorConfig);
    }
  }, [editorConfig, selectedDocument]);

  // Load OnlyOffice script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://documentserver.onlyoffice.com/web-apps/apps/api/documents/api.js';
    script.async = true;
    script.onload = () => {
      console.log('OnlyOffice API loaded');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleCreateDocument = () => {
    if (!newDocumentTitle.trim() || !selectedProject) {
      toast({
        title: 'Validation Error',
        description: 'Please provide document title and select a project',
        variant: 'destructive',
      });
      return;
    }

    createDocumentMutation.mutate({
      title: newDocumentTitle.trim(),
      type: newDocumentType,
      projectId: selectedProject
    });
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'presentation':
        return <Presentation className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Text Document';
      case 'spreadsheet':
        return 'Spreadsheet';
      case 'presentation':
        return 'Presentation';
      default:
        return 'Document';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Sheets</h1>
          <p className="text-gray-600">Create and manage test documentation with OnlyOffice</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="document-title">Document Title</Label>
                <Input
                  id="document-title"
                  value={newDocumentTitle}
                  onChange={(e) => setNewDocumentTitle(e.target.value)}
                  placeholder="Enter document title"
                />
              </div>

              <div>
                <Label htmlFor="document-type">Document Type</Label>
                <Select value={newDocumentType} onValueChange={(value: any) => setNewDocumentType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Text Document</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="spreadsheet">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Spreadsheet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="presentation">
                      <div className="flex items-center space-x-2">
                        <Presentation className="h-4 w-4" />
                        <span>Presentation</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project-select">Project</Label>
                <Select value={selectedProject?.toString()} onValueChange={(value) => setSelectedProject(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
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

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateDocument}
                  disabled={createDocumentMutation.isPending}
                >
                  {createDocumentMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="editor" disabled={!selectedDocument}>
            Editor {selectedDocument && `- ${selectedDocument.title}`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                <p className="text-gray-600 mb-4">Create your first test sheet to get started</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document: OnlyOfficeDocument) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getDocumentTypeIcon(document.type)}
                        <CardTitle className="text-sm font-medium truncate">
                          {document.title}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getDocumentTypeLabel(document.type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">
                        Created: {new Date(document.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Modified: {new Date(document.lastModified).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openDocument(document)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="editor">
          {selectedDocument ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {getDocumentTypeIcon(selectedDocument.type)}
                    <span>{selectedDocument.title}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  id="onlyoffice-editor" 
                  className="w-full border border-gray-200 rounded-lg"
                  style={{ minHeight: '600px' }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Document Selected</h3>
                <p className="text-gray-600">Select a document from the Documents tab to start editing</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Extend Window interface for OnlyOffice API
declare global {
  interface Window {
    DocsAPI: any;
  }
}
