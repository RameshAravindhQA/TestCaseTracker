import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrdDocumentForm } from "@/components/brd/brd-document-form";
import { BrdFunctionalRequirements } from "@/components/brd/brd-test-case-checklist";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  MoreVertical,
  Trash2,
  Download,
  History,
  RotateCcw,
  FileDown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock apiRequest function for demonstration purposes.
// In a real application, this would be imported from your API utility.
const apiRequest = async (method: string, url: string, body?: any) => {
  // Simulate API calls
  if (method === 'GET' && url.includes('/api/brd-documents/')) {
    const documentId = parseInt(url.split('/').pop() || '0');
    // Simulate fetching a document with versions
    const mockDocument = {
      id: documentId,
      title: `Mock Document ${documentId}`,
      version: "1.1",
      createdAt: new Date().toISOString(),
      createdBy: { firstName: "John" },
      versions: [
        { id: 1, version: "1.0", createdAt: new Date(Date.now() - 86400000).toISOString(), createdBy: { firstName: "Jane" }, comment: "Initial version" },
        { id: 2, version: "1.1", createdAt: new Date().toISOString(), createdBy: { firstName: "John" }, comment: "Updated features" },
      ]
    };
    return {
      ok: true,
      json: async () => mockDocument,
    };
  }
  if (method === 'POST' && url.includes('/api/brd-documents/revert/')) {
    return { ok: true, json: async () => ({ success: true }) };
  }
  // Default response for other methods
  return { ok: true, json: async () => ({}) };
};

export default function BrdDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showTestCases, setShowTestCases] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [versionToRevert, setVersionToRevert] = useState<any>(null);
  // Version History Modal
  const [selectedBrdForVersions, setSelectedBrdForVersions] = useState<any>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();


  // Fetch BRD documents
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/brd-documents", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId 
        ? `/api/brd-documents?projectId=${selectedProjectId}`
        : "/api/brd-documents";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch BRD documents");
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Fetch projects for the form
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  // Create BRD document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/brd-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId: selectedProjectId }),
      });
      if (!response.ok) throw new Error("Failed to create document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brd-documents", selectedProjectId] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "BRD document created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to create BRD document",
        variant: "destructive"
      });
    },
  });

  // Update BRD status mutation
  const updateBrdStatusMutation = useMutation({
    mutationFn: async ({ brdId, status }: { brdId: number; status: string }) => {
      const response = await fetch(`/api/brd-documents/${brdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update BRD status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brd-documents", selectedProjectId] });
      toast({ title: "Success", description: "BRD status updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to update BRD status",
        variant: "destructive"
      });
    },
  });

  // Add functional requirement mutation
  const addFunctionalRequirementMutation = useMutation({
    mutationFn: async ({ brdId, functionalRequirement }: { brdId: number; functionalRequirement: any }) => {
      const response = await fetch(`/api/brd-documents/${brdId}/functional-requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(functionalRequirement),
      });
      if (!response.ok) throw new Error("Failed to add functional requirement");
      return response.json();
    },
    onSuccess: (newRequirement) => {
      // Update the selected document's functional requirements immediately
      if (selectedDocument) {
        const updatedDocument = {
          ...selectedDocument,
          functionalRequirements: [...(selectedDocument.functionalRequirements || []), newRequirement]
        };
        setSelectedDocument(updatedDocument);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/brd-documents"] });
      toast({ title: "Success", description: "Functional requirement added successfully" });
    },
    onError: (error) => {
      console.error("Add functional requirement error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to add functional requirement",
        variant: "destructive"
      });
    },
  });

  // Update functional requirement mutation
  const updateFunctionalRequirementMutation = useMutation({
    mutationFn: async ({ requirementId, functionalRequirement }: { requirementId: number; functionalRequirement: any }) => {
      const response = await fetch(`/api/brd-documents/functional-requirements/${requirementId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(functionalRequirement),
      });
      if (!response.ok) throw new Error("Failed to update functional requirement");
      return response.json();
    },
    onSuccess: (updatedRequirement) => {
      // Update the selected document's functional requirements immediately
      if (selectedDocument && selectedDocument.functionalRequirements) {
        const updatedRequirements = selectedDocument.functionalRequirements.map((req: any) => 
          req.id === updatedRequirement.id ? updatedRequirement : req
        );
        const updatedDocument = {
          ...selectedDocument,
          functionalRequirements: updatedRequirements
        };
        setSelectedDocument(updatedDocument);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/brd-documents", selectedProjectId] });
      toast({ title: "Success", description: "Functional requirement updated successfully" });
    },
    onError: (error) => {
      console.error("Update functional requirement error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update functional requirement",
        variant: "destructive"
      });
    },
  });

  // Delete functional requirement mutation
  const deleteFunctionalRequirementMutation = useMutation({
    mutationFn: async (requirementId: number) => {
      const response = await fetch(`/api/brd-documents/functional-requirements/${requirementId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete functional requirement");
      return response.json();
    },
    onSuccess: (_, requirementId) => {
      // Remove the functional requirement from the selected document immediately
      if (selectedDocument && selectedDocument.functionalRequirements) {
        const updatedRequirements = selectedDocument.functionalRequirements.filter((req: any) => req.id !== requirementId);
        const updatedDocument = {
          ...selectedDocument,
          functionalRequirements: updatedRequirements
        };
        setSelectedDocument(updatedDocument);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/brd-documents", selectedProjectId] });
      toast({ title: "Success", description: "Functional requirement deleted successfully" });
    },
    onError: (error) => {
      console.error("Delete functional requirement error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to delete functional requirement",
        variant: "destructive"
      });
    },
  });

  // Update BRD document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/brd-documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brd-documents", selectedProjectId] });
      setIsEditDialogOpen(false);
      setEditingDocument(null);
      toast({ title: "Success", description: "BRD document updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to update BRD document",
        variant: "destructive"
      });
    },
  });

  // Revert BRD document mutation
  const revertDocumentMutation = useMutation({
    mutationFn: async ({ brdId, versionId }: { brdId: number; versionId: number }) => {
      const response = await fetch(`/api/brd-documents/${brdId}/revert/${versionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to revert document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brd-documents", selectedProjectId] });
      setShowVersionHistory(false);
      setSelectedDocument(null);
      toast({ title: "Success", description: "BRD document reverted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to revert BRD document",
        variant: "destructive"
      });
    },
  });

  // Delete BRD document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/brd-documents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brd-documents", selectedProjectId] });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      toast({ title: "Success", description: "BRD document deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to delete BRD document",
        variant: "destructive"
      });
    },
  });

  // PDF Export functions
  const exportToPDF = async (brdDocument: any) => {
    try {
      const response = await fetch(`/api/brd-documents/${brdDocument.id}/export-pdf`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Failed to export PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = url;
      anchor.download = `${brdDocument.title}_v${brdDocument.version}.pdf`;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      toast({ title: "Success", description: "PDF exported successfully" });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to export PDF",
        variant: "destructive"
      });
    }
  };

  // Export all documents to PDF
  const exportAllToPDF = async () => {
    if (!selectedProjectId) {
      toast({ 
        title: "Error", 
        description: "Please select a project first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/brd-documents/export-all-pdf?projectId=${selectedProjectId}`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Failed to export all PDFs");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = url;
      anchor.download = `BRD_Documents_Project_${selectedProjectId}.zip`;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      toast({ title: "Success", description: "All BRD documents exported successfully" });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to export all PDFs",
        variant: "destructive"
      });
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "Review":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "Draft": "secondary",
      "Review": "default",
      "Approved": "default",
      "Rejected": "destructive"
    };

    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const openVersionHistory = async (document: any) => {
    setSelectedBrdForVersions(document);
    try {
      const response = await fetch(`/api/brd-documents/${document.id}`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
        setSelectedDocument({...document, versions: data.versions || []});
        setShowVersionHistory(true);
      } else {
        throw new Error("Failed to fetch versions");
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      setVersions([]);
      toast({ 
        title: "Error", 
        description: "Failed to load version history",
        variant: "destructive"
      });
    }
  };

  const revertToVersion = async (versionId: number) => {
    if (!selectedBrdForVersions) return;

    try {
      const response = await fetch(`/api/brd-documents/${selectedBrdForVersions.id}/revert/${versionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast({ title: "Success", description: "Document reverted successfully" });
        refetch();
        setShowVersionHistory(false);
        setSelectedDocument(null);
      } else {
        throw new Error("Failed to revert document");
      }
    } catch (error) {
      console.error("Revert error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to revert document",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">BRD Documents</h1>
          <p className="text-muted-foreground">
            Business Requirements Documents with Version Control
          </p>
        </div>

        {selectedProjectId && (
          <div className="flex gap-2">
            <Button onClick={() => {
              console.log("Create BRD Document button clicked");
              setIsCreateDialogOpen(true);
            }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New BRD Document
            </Button>
          </div>
        )}
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>
            Choose a project to view and manage its BRD documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-sm">
            <Select 
              value={selectedProjectId?.toString() || ""} 
              onValueChange={(value) => setSelectedProjectId(parseInt(value) || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {selectedProjectId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document: any) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{document.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(document.status)}
                      <Select
                        value={document.status}
                        onValueChange={(status) => 
                          updateBrdStatusMutation.mutate({ brdId: document.id, status })
                        }
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {document.author}
                  </div>
                  <div className="text-sm text-gray-600">
                    Version: {document.version || "1.0"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Created: {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                  {document.overview && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {document.overview}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDocument(document);
                        setShowTestCases(false);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDocument(document);
                        setShowTestCases(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Functional Requirements
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingDocument(document);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          openVersionHistory(document);
                        }}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Version History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportToPDF(document)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setDocumentToDelete(document);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProjectId && filteredDocuments.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No BRD Documents</h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first Business Requirements Document
              </p>
              <Button onClick={() => {
                console.log("Create BRD Document button clicked");
                setIsCreateDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create BRD Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedProjectId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Project</h3>
              <p className="text-gray-600">
                Please select a project from the dropdown above to view and manage BRD documents
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Dialog */}
      {selectedDocument && (
        <Dialog 
          open={!!selectedDocument} 
          onOpenChange={() => setSelectedDocument(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedDocument.title}
              </DialogTitle>
            </DialogHeader>

            {showTestCases ? (
              <BrdFunctionalRequirements
                brdId={selectedDocument.id}
                functionalRequirements={selectedDocument.functionalRequirements || []}
                onUpdateFunctionalRequirement={(functionalRequirement) => {
                  if (functionalRequirement.id) {
                    updateFunctionalRequirementMutation.mutate({ 
                      requirementId: functionalRequirement.id, 
                      functionalRequirement 
                    });
                  }
                }}
                onAddFunctionalRequirement={(functionalRequirement) => {
                  console.log("Adding functional requirement:", functionalRequirement);
                  addFunctionalRequirementMutation.mutate({ 
                    brdId: selectedDocument.id, 
                    functionalRequirement 
                  });
                }}
                onDeleteFunctionalRequirement={(requirementId) => {
                  deleteFunctionalRequirementMutation.mutate(requirementId);
                }}
              />
            ) : showVersionHistory ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-lg">Version History</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Create New Version:</label>
                    <Select
                      onValueChange={(newVersion) => {
                        if (newVersion) {
                          const confirmMessage = `Are you sure you want to create version ${newVersion}? This will increment the document version.`;
                          if (window.confirm(confirmMessage)) {
                            updateDocumentMutation.mutate({
                              id: selectedDocument.id,
                              data: {
                                ...selectedDocument,
                                version: newVersion,
                                versionComment: `Updated to version ${newVersion}`
                              }
                            });
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="New Version" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const currentVersion = selectedDocument.version || "1.0";
                          const versionParts = currentVersion.split('.');
                          const major = parseInt(versionParts[0]) || 1;
                          const minor = parseInt(versionParts[1]) || 0;
                          const nextMinor = `${major}.${minor + 1}`;
                          const nextMajor = `${major + 1}.0`;

                          return [
                            <SelectItem key={nextMinor} value={nextMinor}>
                              {nextMinor}
                            </SelectItem>,
                            <SelectItem key={nextMajor} value={nextMajor}>
                              {nextMajor}
                            </SelectItem>
                          ];
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {versions && versions.length > 0 ? (
                  <div className="space-y-3">
                    {versions.map((version: any, index: number) => (
                      <Card key={version.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={index === 0 ? "default" : "secondary"}>
                                Version {version.version}
                              </Badge>
                              {selectedDocument.version === version.version && <Badge variant="outline">Current</Badge>}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Changes:</strong> {version.comment || "No changes documented"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(version.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {version.data && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // View this version's data
                                  setSelectedDocument({
                                    ...selectedDocument,
                                    ...version.data,
                                    version: version.version
                                  });
                                  setShowVersionHistory(false);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportToPDF({ 
                                ...selectedDocument, 
                                ...(version.data || {}),
                                version: version.version 
                              })}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                            {selectedDocument.version !== version.version && version.data && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setVersionToRevert(version);
                                  setRevertDialogOpen(true);
                                }}
                                disabled={revertDocumentMutation.isPending}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                {revertDocumentMutation.isPending ? "Reverting..." : "Revert"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No version history available</p>
                    <p className="text-sm text-gray-400">Versions will appear here when you make changes to the document.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Author:</strong> {selectedDocument.author}</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedDocument.status)}</div>
                  <div><strong>Version:</strong> {selectedDocument.version}</div>
                  <div><strong>Created:</strong> {selectedDocument.createdAt ? new Date(selectedDocument.createdAt).toLocaleDateString() : 'N/A'}</div>
                </div>

                {selectedDocument.overview && (
                  <div>
                    <h4 className="font-medium mb-2">Overview</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.overview}</p>
                  </div>
                )}

                {selectedDocument.problemStatement && (
                  <div>
                    <h4 className="font-medium mb-2">Problem Statement</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.problemStatement}</p>
                  </div>
                )}

                {selectedDocument.objectives && (
                  <div>
                    <h4 className="font-medium mb-2">Objectives</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.objectives}</p>
                  </div>
                )}

                {selectedDocument.scope && (
                  <div>
                    <h4 className="font-medium mb-2">Scope</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.scope}</p>
                  </div>
                )}

                {selectedDocument.userStories && (
                  <div>
                    <h4 className="font-medium mb-2">User Stories</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.userStories}</p>
                  </div>
                )}

                {selectedDocument.functionalRequirements && (
                  <div>
                    <h4 className="font-medium mb-2">Functional Requirements</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.functionalRequirements}</p>
                  </div>
                )}

                {selectedDocument.nonFunctionalRequirements && (
                  <div>
                    <h4 className="font-medium mb-2">Non-Functional Requirements</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.nonFunctionalRequirements}</p>
                  </div>
                )}

                {selectedDocument.designNotes && (
                  <div>
                    <h4 className="font-medium mb-2">Design Notes</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.designNotes}</p>
                  </div>
                )}

                {selectedDocument.dependencies && (
                  <div>
                    <h4 className="font-medium mb-2">Dependencies</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.dependencies}</p>
                  </div>
                )}

                {selectedDocument.assumptions && (
                  <div>
                    <h4 className="font-medium mb-2">Assumptions</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.assumptions}</p>
                  </div>
                )}

                {selectedDocument.acceptanceCriteria && (
                  <div>
                    <h4 className="font-medium mb-2">Acceptance Criteria</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.acceptanceCriteria}</p>
                  </div>
                )}

                {selectedDocument.risks && (
                  <div>
                    <h4 className="font-medium mb-2">Risks</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.risks}</p>
                  </div>
                )}

                {selectedDocument.supportingDocuments && (
                  <div>
                    <h4 className="font-medium mb-2">Supporting Documents</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedDocument.supportingDocuments}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowTestCases(!showTestCases)}
              >
                {showTestCases ? "View Document" : "View Test Cases"}
              </Button>
              <div className="flex gap-2">
                {!showTestCases && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowVersionHistory(!showVersionHistory);
                    }}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {showVersionHistory ? "Hide Versions" : "Version History"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create New BRD Document Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New BRD Document</DialogTitle>
          </DialogHeader>
          {selectedProjectId && (
            <BrdDocumentForm
              projects={projects}
              onSubmit={(data) => createDocumentMutation.mutate(data)}
              isSubmitting={createDocumentMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingDocument && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit BRD Document</DialogTitle>
            </DialogHeader>
            <BrdDocumentForm
              projects={projects}
              initialData={editingDocument}
              onSubmit={(data) => updateDocumentMutation.mutate({ id: editingDocument.id, data })}
              isSubmitting={updateDocumentMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the BRD document
              "{documentToDelete?.title}" and all its associated data including test cases and version history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToDelete) {
                  deleteDocumentMutation.mutate(documentToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert Document Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revert to version {versionToRevert?.version}? 
              This will create a backup of the current version and restore the document to the selected version state.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVersionToRevert(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (versionToRevert && selectedDocument) {
                  revertDocumentMutation.mutate({
                    brdId: selectedDocument.id,
                    versionId: versionToRevert.id
                  });
                  setRevertDialogOpen(false);
                  setVersionToRevert(null);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Revert to Version {versionToRevert?.version}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </MainLayout>
  );
}