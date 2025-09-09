
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BrdDocumentForm } from "@/components/brd/brd-document-form";
import { BrdTestCaseChecklist } from "@/components/brd/brd-test-case-checklist";
import { useToast } from "@/hooks/use-toast";
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
  User
} from "lucide-react";

export default function BrdDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showTestCases, setShowTestCases] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch BRD documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/brd-documents"],
    queryFn: async () => {
      const response = await fetch("/api/brd-documents");
      if (!response.ok) throw new Error("Failed to fetch BRD documents");
      return response.json();
    },
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
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brd-documents"] });
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">BRD Documents</h1>
          <p className="text-muted-foreground">
            Business Requirements Documents with Version Control
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New BRD Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New BRD Document</DialogTitle>
            </DialogHeader>
            <BrdDocumentForm
              projects={projects}
              onSubmit={(data) => createDocumentMutation.mutate(data)}
              isSubmitting={createDocumentMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document: any) => (
          <Card key={document.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{document.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(document.status)}
                    {getStatusBadge(document.status)}
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
              
              <div className="flex gap-2 mt-4">
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
                  Test Cases
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No BRD Documents</h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first Business Requirements Document
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create BRD Document
              </Button>
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
              <BrdTestCaseChecklist
                brdId={selectedDocument.id}
                testCases={selectedDocument.testCases || []}
                onUpdateTestCase={(testCase) => {
                  console.log("Update test case:", testCase);
                }}
                onAddTestCase={(testCase) => {
                  console.log("Add test case:", testCase);
                }}
              />
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
                    <p className="text-gray-600">{selectedDocument.overview}</p>
                  </div>
                )}
                
                {selectedDocument.problemStatement && (
                  <div>
                    <h4 className="font-medium mb-2">Problem Statement</h4>
                    <p className="text-gray-600">{selectedDocument.problemStatement}</p>
                  </div>
                )}
                
                {selectedDocument.objectives && (
                  <div>
                    <h4 className="font-medium mb-2">Objectives</h4>
                    <p className="text-gray-600">{selectedDocument.objectives}</p>
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
              <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
