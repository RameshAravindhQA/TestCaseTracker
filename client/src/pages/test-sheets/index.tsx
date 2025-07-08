import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnlyOfficeTest } from "@/components/test-sheets/onlyoffice-test";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Plus, 
  FileText, 
  Table, 
  Presentation, 
  Download, 
  Edit,
  Trash2,
  FolderOpen,
  Calendar
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  status: string;
}

interface OnlyOfficeDocument {
  id: string;
  title: string;
  type: 'text' | 'spreadsheet' | 'presentation';
  projectId: number;
  projectName?: string;
  createdAt: string;
  createdBy: string;
  lastModified?: string;
  fileType: string;
  key: string;
  url: string;
}

const documentTypes = [
  { value: 'text', label: 'Text Document', icon: FileText, extension: 'docx' },
  { value: 'spreadsheet', label: 'Spreadsheet', icon: Table, extension: 'xlsx' },
  { value: 'presentation', label: 'Presentation', icon: Presentation, extension: 'pptx' }
];

export default function TestSheetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<OnlyOfficeDocument[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<OnlyOfficeDocument | null>(null);

  // Form state
  const [newDocument, setNewDocument] = useState({
    title: '',
    type: '' as 'text' | 'spreadsheet' | 'presentation' | '',
    projectId: null as number | null,
    description: ''
  });

  useEffect(() => {
    console.log('[TestSheets] Component mounted, user:', user);

    const initializeComponent = async () => {
      try {
        // Always try to load, even without user initially
        setIsInitialLoading(true);
        setAuthError(null);

        // First try to load projects to test authentication
        await loadProjects();

        // If successful, load documents
        await loadDocuments();

        console.log('[TestSheets] Initialization completed successfully');
      } catch (error) {
        console.error('[TestSheets] Error during initialization:', error);

        // Check if it's an authentication error
        if (error.message?.includes('401') || error.message?.includes('authentication')) {
          setAuthError('Please log in to access Test Sheets');
        } else {
          setAuthError('Failed to load data. Please refresh the page.');
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    // Initialize immediately, don't wait for user state
    initializeComponent();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      console.log('[TestSheets] Selected project changed:', selectedProject);
      loadDocuments();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      console.log('[TestSheets] Loading projects...');

      const response = await fetch('/api/projects', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('[TestSheets] Projects response status:', response.status);

      if (response.status === 401) {
        console.error('[TestSheets] Authentication failed');
        throw new Error('Authentication failed (401)');
      }

      if (response.ok) {
        const projectData = await response.json();
        console.log('[TestSheets] Loaded projects:', projectData.length);
        setProjects(Array.isArray(projectData) ? projectData : []);

        // Clear any previous auth errors if successful
        setAuthError(null);
      } else if (response.status === 404) {
        console.log('[TestSheets] No projects found (404)');
        setProjects([]);
        setAuthError(null);
      } else {
        console.error('[TestSheets] Failed to load projects:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[TestSheets] Error response:', errorText);

        throw new Error(`Failed to load projects (${response.status})`);
      }
    } catch (error) {
      console.error('[TestSheets] Error loading projects:', error);
      setProjects([]);
      throw error; // Re-throw to be handled by caller
    }
  };

  const loadDocuments = async () => {
    try {
      const url = selectedProject 
        ? `/api/onlyoffice/documents?projectId=${selectedProject}`
        : '/api/onlyoffice/documents';

      console.log('[TestSheets] Loading documents from:', url);

      const response = await fetch(url, {
        credentials: 'include'
      });

      console.log('[TestSheets] Documents response status:', response.status);

      if (response.ok) {
        const documentsData = await response.json();
        console.log('[TestSheets] Loaded documents:', documentsData.length);

        // Ensure documentsData is an array
        const docsArray = Array.isArray(documentsData) ? documentsData : [];

        // Add project names to documents
        const documentsWithProjects = docsArray.map((doc: OnlyOfficeDocument) => ({
          ...doc,
          projectName: projects.find(p => p.id === doc.projectId)?.name || 'Unknown Project'
        }));

        console.log('[TestSheets] Documents with project names:', documentsWithProjects);
        setDocuments(documentsWithProjects);
      } else if (response.status === 404) {
        console.log('[TestSheets] No documents found');
        setDocuments([]);
      } else {
        console.error('[TestSheets] Failed to load documents:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[TestSheets] Error response:', errorText);

        // Only show error for non-404 responses
        if (response.status !== 404) {
          toast({
            title: "Warning",
            description: `Could not load documents (${response.status})`,
            variant: "destructive"
          });
        }
        setDocuments([]);
      }
    } catch (error) {
      console.error('[TestSheets] Error loading documents:', error);
      setDocuments([]);

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast({
          title: "Network Error",
          description: "Please check your connection and try again",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive"
        });
      }
    }
  };

  const createDocument = async () => {
    console.log('[TestSheets] Creating document with data:', newDocument);

    if (!newDocument.title.trim()) {
      console.warn('[TestSheets] No document title provided');
      toast({
        title: "Error",
        description: "Please enter a document title",
        variant: "destructive"
      });
      return;
    }

    if (!newDocument.projectId) {
      console.warn('[TestSheets] No project selected');
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = {
        title: newDocument.title.trim(),
        type: newDocument.type,
        projectId: parseInt(newDocument.projectId.toString()),
        description: newDocument.description
      };

      console.log('[TestSheets] Sending create document request:', requestBody);

      const response = await fetch('/api/onlyoffice/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log('[TestSheets] Create document response status:', response.status);

      if (response.ok) {
        const document = await response.json();
        console.log('[TestSheets] Document created successfully:', document);

        toast({
          title: "Success",
          description: "Document created successfully"
        });

        setIsCreateDialogOpen(false);
        setNewDocument({
          title: "",
          description: "",
          type: "" as 'text' | 'spreadsheet' | 'presentation' | '',
          projectId: null
        });

        loadDocuments();

        // Open the document for editing
        openDocument(document);
      } else {
        const responseText = await response.text();
        console.error('[TestSheets] Create document error response:', responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('[TestSheets] Failed to parse error response:', parseError);
          errorData = { error: responseText || 'Unknown error' };
        }

        throw new Error(errorData.error || errorData.message || 'Failed to create document');
      }
    } catch (error) {
      console.error('[TestSheets] Error creating document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create document",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDocument = async (document: OnlyOfficeDocument) => {
    try {
      console.log('[TestSheets] Opening document in OnlyOffice editor:', document);

      // Open OnlyOffice editor directly using the dedicated editor endpoint
      const editorUrl = `/api/onlyoffice/editor/${document.id}`;
      const editorWindow = window.open(editorUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

      if (editorWindow) {
        toast({
          title: "Success",
          description: `Opening ${document.title} in OnlyOffice editor`
        });
      } else {
        throw new Error('Unable to open editor window - popup may be blocked');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open document",
        variant: "destructive"
      });
    }
  };

  const openDocumentOLD = async (document: OnlyOfficeDocument) => {
    try {
      const response = await fetch(`/api/onlyoffice/documents/${document.id}/config`, {
        credentials: 'include'
      });

      if (response.ok) {
        const config = await response.json();

        // Create a new window for OnlyOffice editor
        const editorWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

        if (editorWindow) {
          editorWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>OnlyOffice - ${document.title}</title>
              <script src="https://documentserver/web-apps/apps/api/documents/api.js"></script>
              <style>
                body { margin: 0; font-family: Arial, sans-serif; }
                #placeholder { width: 100%; height: 100vh; }
                .header { 
                  background: #f8f9fa; 
                  padding: 10px 20px; 
                  border-bottom: 1px solid #dee2e6;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .document-title { 
                  font-size: 16px; 
                  font-weight: 600; 
                  color: #333;
                }
                .close-btn {
                  background: #dc3545;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 4px;
                  cursor: pointer;
                }
                .close-btn:hover {
                  background: #c82333;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="document-title">${document.title}</div>
                <button class="close-btn" onclick="window.close()">Close</button>
              </div>
              <div id="placeholder"></div>
              <script>
                // Fallback configuration for demo purposes
                const config = ${JSON.stringify({
                  document: {
                    fileType: document.fileType,
                    key: document.key,
                    title: document.title,
                    url: document.url,
                    permissions: {
                      edit: true,
                      download: true,
                      review: true,
                      comment: true
                    }
                  },
                  documentType: document.type,
                  editorConfig: {
                    mode: 'edit',
                    lang: 'en',
                    user: {
                      id: user?.id?.toString() || '1',
                      name: user?.firstName + ' ' + (user?.lastName || '') || 'User'
                    },
                    customization: {
                      autosave: true,
                      forcesave: true,
                      comments: true,
                      chat: true,
                      reviewDisplay: 'markup',
                      trackChanges: true
                    }
                  },
                  width: '100%',
                  height: 'calc(100vh - 60px)'
                })};

                // Initialize OnlyOffice editor
                try {
                  if (typeof DocsAPI !== 'undefined') {
                    new DocsAPI.DocEditor("placeholder", config);
                  } else {
                    // Fallback UI when OnlyOffice is not available
                    document.getElementById('placeholder').innerHTML = \`
                      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                        <h2 style="color: #666; margin-bottom: 10px;">OnlyOffice Document Editor</h2>
                        <p style="color: #888; margin-bottom: 20px;">Document: <strong>${document.title}</strong></p>
                        <p style="color: #888; margin-bottom: 20px;">Type: <strong>${document.type.charAt(0).toUpperCase() + document.type.slice(1)}</strong></p>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; max-width: 500px;">
                          <p style="color: #666; margin: 0;">OnlyOffice Document Server integration is ready.</p>
                          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Configure your OnlyOffice Document Server URL to enable full editing capabilities.</p>
                        </div>
                      </div>
                    \`;
                  }
                } catch (error) {
                  console.error('Error initializing OnlyOffice:', error);
                  document.getElementById('placeholder').innerHTML = \`
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 40px;">
                      <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                      <h2 style="color: #dc3545; margin-bottom: 10px;">Editor Initialization Error</h2>
                      <p style="color: #888;">Unable to load OnlyOffice editor. Please check your configuration.</p>
                    </div>
                  \`;
                }
              </script>
            </body>
            </html>
          `);
          editorWindow.document.close();
        }
      } else {
        throw new Error('Failed to get document configuration');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive"
      });
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/onlyoffice/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document deleted successfully"
        });
        loadDocuments();
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const getDocumentIcon = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.icon : FileText;
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  const filteredDocuments = selectedProject 
    ? documents.filter(doc => doc.projectId.toString() === selectedProject)
    : documents;

  const handleCreateDocument = async () => {
    try {
      console.log('[TestSheets] Creating document:', newDocument);

      if (!newDocument.title.trim()) {
        toast({
          title: "Error",
          description: "Please enter a document title",
          variant: "destructive"
        });
        return;
      }

      if (!newDocument.type) {
        toast({
          title: "Error", 
          description: "Please select a document type",
          variant: "destructive"
        });
        return;
      }

      if (!newDocument.projectId) {
        toast({
          title: "Error",
          description: "Please select a project", 
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/onlyoffice/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newDocument)
      });

      if (!response.ok) {
        throw new Error(`Failed to create document: ${response.status}`);
      }

      const createdDocument = await response.json();
      console.log('[TestSheets] Document created:', createdDocument);

      // Add to documents list
      setDocuments(prev => [...prev, createdDocument]);

      // Reset form
      setNewDocument({
        title: '',
        type: '' as 'text' | 'spreadsheet' | 'presentation' | '',
        projectId: null,
        description: ''
      });

      setIsCreateDialogOpen(false);

      toast({
        title: "Success",
        description: "Document created successfully"
      });

    } catch (error) {
      console.error('[TestSheets] Error creating document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create document',
        variant: "destructive"
      });
    }
  };

  // Show loading screen while initializing
  if (isInitialLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Test Sheets...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error if authentication failed
  if (authError) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please log in to access Test Sheets</p>
              <Button onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <Tabs defaultValue="documents" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="test">Unit Test</TabsTrigger>
          </TabsList>
          <TabsContent value="documents" className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
              <h1 className="text-3xl font-bold">OnlyOffice Document Manager</h1>
              <p className="text-gray-600 mt-2">Create and manage documents with OnlyOffice editor integration</p>
            </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Document Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter document title"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select 
                    value={newDocument.projectId ? newDocument.projectId.toString() : undefined} 
                    onValueChange={(value) => setNewDocument(prev => ({ ...prev, projectId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.length > 0 ? (
                        projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No projects available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Document Type</Label>
                  <Select 
                    value={newDocument.type || undefined} 
                    onValueChange={(value) => setNewDocument(prev => ({ ...prev, type: value as 'text' | 'spreadsheet' | 'presentation' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Document</SelectItem>
                      <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter document description"
                    value={newDocument.description}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={createDocument} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Creating..." : "Create Document"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <Label>Filter by Project:</Label>
              </div>
              <Select value={selectedProject || "all"} onValueChange={(value) => setSelectedProject(value === "all" ? "" : value)}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => {
            const Icon = getDocumentIcon(document.type);
            return (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{document.title}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDocument(document)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocument(document.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {getDocumentTypeLabel(document.type)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        .{documentTypes.find(dt => dt.value === document.type)?.extension}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1 mb-1">
                        <FolderOpen className="h-3 w-3" />
                        {document.projectName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {new Date(document.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <Button 
                      onClick={() => openDocument(document)}
                      className="w-full mt-3"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Open in Editor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
              <p className="text-gray-600 mb-4">
                {selectedProject 
                  ? "No documents found for the selected project. Create your first document to get started."
                  : "No documents found. Create your first document to get started."
                }
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
            </CardContent>
          </Card>
        )}
            </div>
          </TabsContent>
          <TabsContent value="test" className="h-full">
            <div className="p-6">
              <OnlyOfficeTest />
            </div>
          </TabsContent>
          <TabsContent value="test" className="h-full">
            <div className="p-6">
              <OnlyOfficeTest />
            </div>
          </TabsContent></old_str>
          <TabsContent value="test" className="h-full">
            <div className="p-6">
              <OnlyOfficeTest />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}