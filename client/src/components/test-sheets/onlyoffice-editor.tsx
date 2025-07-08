
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, FileSpreadsheet, Presentation, Save, Download, Share2, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface OnlyOfficeEditorProps {
  projectId?: number;
  documentId?: string;
  documentType?: 'text' | 'spreadsheet' | 'presentation';
  onSave?: (documentData: any) => void;
}

interface DocumentConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions: {
      edit: boolean;
      download: boolean;
      review: boolean;
      comment: boolean;
    };
  };
  documentType: string;
  editorConfig: {
    mode: 'edit' | 'view';
    lang: string;
    callbackUrl?: string;
    user: {
      id: string;
      name: string;
    };
    customization: {
      autosave: boolean;
      forcesave: boolean;
      comments: boolean;
      chat: boolean;
      reviewDisplay: string;
      trackChanges: boolean;
    };
  };
  width: string;
  height: string;
}

export function OnlyOfficeEditor({
  projectId,
  documentId,
  documentType = 'text',
  onSave
}: OnlyOfficeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const [documentConfig, setDocumentConfig] = useState<DocumentConfig | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentType, setNewDocumentType] = useState<'text' | 'spreadsheet' | 'presentation'>('text');
  const [selectedProject, setSelectedProject] = useState<number | undefined>(projectId);
  
  const queryClient = useQueryClient();

  // Get user data
  const { data: user } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/user');
      return response.json();
    }
  });

  // Get projects for selection
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return response.json();
    }
  });

  // Create new document mutation
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
      loadDocument(data.id);
      queryClient.invalidateQueries({ queryKey: ['onlyoffice', 'documents'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create document',
        variant: 'destructive',
      });
    }
  });

  // Save document mutation
  const saveDocumentMutation = useMutation({
    mutationFn: async (data: { documentId: string; content: any }) => {
      const response = await apiRequest('PUT', `/api/onlyoffice/documents/${data.documentId}`, {
        content: data.content
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document saved',
        description: 'Document saved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save document',
        variant: 'destructive',
      });
    }
  });

  // Load OnlyOffice script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://documentserver.onlyoffice.com/web-apps/apps/api/documents/api.js';
    script.async = true;
    script.onload = () => {
      setIsEditorLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize editor when script is loaded and config is ready
  useEffect(() => {
    if (isEditorLoaded && documentConfig && editorRef.current && window.DocsAPI) {
      const editor = new window.DocsAPI.DocEditor('onlyoffice-editor', {
        ...documentConfig,
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

      return () => {
        if (editor && typeof editor.destroyEditor === 'function') {
          editor.destroyEditor();
        }
      };
    }
  }, [isEditorLoaded, documentConfig]);

  const loadDocument = async (docId?: string) => {
    if (!docId && !documentId) return;

    try {
      const response = await apiRequest('GET', `/api/onlyoffice/documents/${docId || documentId}/config`);
      const config = await response.json();
      setDocumentConfig(config);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load document',
        variant: 'destructive',
      });
    }
  };

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

  // Load document on component mount
  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  return (
    <div className="space-y-4">
      {/* Document Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
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
                      {projects?.map((project: any) => (
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

        {documentConfig && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Collaborate
            </Button>
          </div>
        )}
      </div>

      {/* Editor Container */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {documentConfig && getDocumentTypeIcon(documentConfig.documentType)}
            <span>
              {documentConfig 
                ? documentConfig.document.title 
                : 'OnlyOffice Document Editor'
              }
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!documentConfig ? (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No document loaded</p>
                <p className="text-sm text-gray-500">
                  Create a new document or select an existing one to start editing
                </p>
              </div>
            </div>
          ) : (
            <div 
              id="onlyoffice-editor" 
              ref={editorRef}
              className="w-full"
              style={{ minHeight: '600px' }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Extend Window interface for OnlyOffice API
declare global {
  interface Window {
    DocsAPI: any;
  }
}
