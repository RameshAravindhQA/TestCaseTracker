import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

    initializeComponent();
  }, [user]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('[TestSheets] Error loading projects:', error);
      throw error;
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/onlyoffice/documents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('[TestSheets] Error loading documents:', error);
      throw error;
    }
  };

  const createDocument = async () => {
    if (!newDocument.title || !newDocument.type || !newDocument.projectId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/onlyoffice/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDocument),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const createdDocument = await response.json();
      setDocuments([...documents, createdDocument]);
      setIsCreateDialogOpen(false);
      setNewDocument({
        title: '',
        type: '',
        projectId: null,
        description: ''
      });

      toast({
        title: "Success",
        description: "Document created successfully",
      });
    } catch (error) {
      console.error('[TestSheets] Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDocument = (document: OnlyOfficeDocument) => {
    setEditingDocument(document);
    
    // In a real implementation, this would open the OnlyOffice editor
    toast({
      title: "Opening Document",
      description: `Opening ${document.title} in editor...`,
    });
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/onlyoffice/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error('[TestSheets] Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = selectedProject 
    ? documents.filter(doc => doc.projectId === parseInt(selectedProject))
    : documents;

  if (isInitialLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Test Sheets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-gray-600">{authError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Test Sheets</h1>
        <p className="text-gray-600">
          Create and manage spreadsheets, documents, and presentations for your projects
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                  placeholder="Enter document title"
                />
              </div>

              <div>
                <Label htmlFor="type">Document Type</Label>
                <Select value={newDocument.type} onValueChange={(value) => setNewDocument({...newDocument, type: value as any})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project">Project</Label>
                <Select value={newDocument.projectId?.toString() || ""} onValueChange={(value) => setNewDocument({...newDocument, projectId: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                  placeholder="Enter document description"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createDocument} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Document"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => {
          const docType = documentTypes.find(dt => dt.value === document.type);
          const IconComponent = docType?.icon || FileText;
          
          return (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg leading-tight">{document.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {docType?.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1 mb-1">
                    <FolderOpen className="h-3 w-3" />
                    {document.projectName || 'Unknown Project'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created {new Date(document.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => openDocument(document)}
                    className="flex-1"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                  <Button 
                    onClick={() => deleteDocument(document.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
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
  );
}