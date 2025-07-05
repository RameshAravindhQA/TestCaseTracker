
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  FileSpreadsheet, 
  Plus, 
  Save, 
  Download, 
  Share2, 
  Users, 
  Loader2,
  Folder,
  Edit3
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface OnlyOfficeDocument {
  id: number;
  name: string;
  type: 'document' | 'spreadsheet' | 'presentation';
  projectId: number;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface OnlyOfficeEditorProps {
  projectId?: number;
  documentId?: number;
  onDocumentSaved?: (document: OnlyOfficeDocument) => void;
}

export function OnlyOfficeEditor({ projectId, documentId, onDocumentSaved }: OnlyOfficeEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(projectId || null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentType, setNewDocumentType] = useState<'document' | 'spreadsheet' | 'presentation'>('document');
  const [docEditor, setDocEditor] = useState<any>(null);

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return response.json();
    },
  });

  // Fetch project documents
  const { data: documents = [], refetch: refetchDocuments } = useQuery<OnlyOfficeDocument[]>({
    queryKey: ['/api/projects', selectedProjectId, 'onlyoffice-documents'],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await apiRequest('GET', `/api/projects/${selectedProjectId}/onlyoffice-documents`);
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Fetch single document
  const { data: currentDocument } = useQuery<OnlyOfficeDocument>({
    queryKey: ['/api/onlyoffice-documents', documentId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/onlyoffice-documents/${documentId}`);
      return response.json();
    },
    enabled: !!documentId,
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async ({ name, type, projectId }: { name: string; type: string; projectId: number }) => {
      const response = await apiRequest('POST', '/api/onlyoffice-documents', {
        name,
        type,
        projectId
      });
      return response.json();
    },
    onSuccess: (document: OnlyOfficeDocument) => {
      setShowCreateDialog(false);
      setNewDocumentName('');
      refetchDocuments();
      initializeEditor(document);
      toast({
        title: "Document Created",
        description: `${document.name} has been created successfully`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create document",
        variant: "destructive"
      });
    }
  });

  // Save document mutation
  const saveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, content }: { documentId: number; content: any }) => {
      const response = await apiRequest('PUT', `/api/onlyoffice-documents/${documentId}`, {
        content
      });
      return response.json();
    },
    onSuccess: (document: OnlyOfficeDocument) => {
      onDocumentSaved?.(document);
      refetchDocuments();
      toast({
        title: "Document Saved",
        description: "Your changes have been saved successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save document",
        variant: "destructive"
      });
    }
  });

  // Initialize ONLYOFFICE editor
  const initializeEditor = (document: OnlyOfficeDocument) => {
    if (!editorRef.current || !window.DocsAPI) {
      console.error('ONLYOFFICE API not loaded or editor container not found');
      return;
    }

    const config = {
      document: {
        fileType: getFileType(document.type),
        key: `document_${document.id}_${Date.now()}`,
        title: document.name,
        url: document.fileUrl,
        permissions: {
          edit: true,
          download: true,
          print: true,
          review: true,
          comment: true,
        }
      },
      documentType: getDocumentType(document.type),
      editorConfig: {
        mode: 'edit',
        lang: 'en',
        callbackUrl: `/api/onlyoffice-documents/${document.id}/callback`,
        user: {
          id: 'user_1', // This should come from auth context
          name: 'Current User'
        },
        customization: {
          autosave: true,
          forcesave: true,
          commentAuthorOnly: false,
          trackChanges: false,
        }
      },
      events: {
        onReady: () => {
          setIsEditorReady(true);
          toast({
            title: "Editor Ready",
            description: "You can now start editing the document"
          });
        },
        onDocumentStateChange: (event: any) => {
          if (event.data) {
            console.log('Document changed, auto-saving...');
            // Auto-save functionality can be implemented here
          }
        },
        onError: (event: any) => {
          console.error('ONLYOFFICE Editor Error:', event);
          toast({
            title: "Editor Error",
            description: "An error occurred in the document editor",
            variant: "destructive"
          });
        }
      },
      width: '100%',
      height: '600px'
    };

    const editor = new window.DocsAPI.DocEditor(editorRef.current, config);
    setDocEditor(editor);
  };

  const getFileType = (type: string) => {
    switch (type) {
      case 'document': return 'docx';
      case 'spreadsheet': return 'xlsx';
      case 'presentation': return 'pptx';
      default: return 'docx';
    }
  };

  const getDocumentType = (type: string) => {
    switch (type) {
      case 'document': return 'text';
      case 'spreadsheet': return 'cell';
      case 'presentation': return 'slide';
      default: return 'text';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'spreadsheet': return <FileSpreadsheet className="h-4 w-4" />;
      case 'presentation': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleCreateDocument = () => {
    if (!newDocumentName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a document name",
        variant: "destructive"
      });
      return;
    }

    if (!selectedProjectId) {
      toast({
        title: "Project Required",
        description: "Please select a project",
        variant: "destructive"
      });
      return;
    }

    createDocumentMutation.mutate({
      name: newDocumentName.trim(),
      type: newDocumentType,
      projectId: selectedProjectId
    });
  };

  const handleDocumentSelect = (document: OnlyOfficeDocument) => {
    initializeEditor(document);
  };

  const handleSaveDocument = () => {
    if (docEditor && currentDocument) {
      // Get document content from editor
      docEditor.downloadAs({
        format: getFileType(currentDocument.type),
        callback: (content: any) => {
          saveDocumentMutation.mutate({
            documentId: currentDocument.id,
            content
          });
        }
      });
    }
  };

  // Load ONLYOFFICE API script
  useEffect(() => {
    if (!window.DocsAPI) {
      const script = document.createElement('script');
      script.src = 'https://documentserver.onlyoffice.com/OfficeWeb/apps/api/documents/api.js';
      script.async = true;
      script.onload = () => {
        console.log('ONLYOFFICE API loaded');
      };
      document.head.appendChild(script);
    }
  }, []);

  // Initialize editor when document is selected
  useEffect(() => {
    if (currentDocument && window.DocsAPI) {
      initializeEditor(currentDocument);
    }
  }, [currentDocument]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ONLYOFFICE Documents</h1>
          <p className="text-muted-foreground">Create and edit documents, spreadsheets, and presentations</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select
            value={selectedProjectId?.toString() || ''}
            onValueChange={(value) => setSelectedProjectId(parseInt(value))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button disabled={!selectedProjectId}>
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="document-name">Document Name</Label>
                  <Input
                    id="document-name"
                    value={newDocumentName}
                    onChange={(e) => setNewDocumentName(e.target.value)}
                    placeholder="Enter document name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="document-type">Document Type</Label>
                  <Select value={newDocumentType} onValueChange={(value: any) => setNewDocumentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Text Document
                        </div>
                      </SelectItem>
                      <SelectItem value="spreadsheet">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Spreadsheet
                        </div>
                      </SelectItem>
                      <SelectItem value="presentation">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Presentation
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateDocument}
                    disabled={createDocumentMutation.isPending}
                  >
                    {createDocumentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Documents List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProjectId ? (
              <div className="space-y-2">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                      currentDocument?.id === document.id ? 'bg-muted border-primary' : ''
                    }`}
                    onClick={() => handleDocumentSelect(document)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDocumentIcon(document.type)}
                        <span className="text-sm font-medium truncate">{document.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {document.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {new Date(document.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                
                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No documents yet</p>
                    <p className="text-xs text-muted-foreground">Create a new document to get started</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Select a project to view documents</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor Area */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                {currentDocument ? currentDocument.name : 'Document Editor'}
              </CardTitle>
              
              {currentDocument && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDocument}
                    disabled={!isEditorReady || saveDocumentMutation.isPending}
                  >
                    {saveDocumentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentDocument ? (
              <div>
                <div ref={editorRef} className="w-full h-[600px] border rounded-lg"></div>
                {!isEditorReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Loading editor...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/30">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
                  <p className="text-muted-foreground mb-4">Select a document from the list or create a new one</p>
                  <Button onClick={() => setShowCreateDialog(true)} disabled={!selectedProjectId}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Document
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
