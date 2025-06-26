import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";
import { DocumentFolderComponent } from "@/components/documents/document-folder";
import { DocumentItem } from "@/components/documents/document-item";
import { DocumentFolderForm } from "@/components/documents/document-folder-form";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { DocumentBreadcrumb } from "@/components/documents/document-breadcrumb";
import { WindowsExplorerView } from "@/components/documents/windows-explorer-view";
import { Document, DocumentFolder, InsertDocumentFolder, InsertDocument } from "@/shared/schema";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Folder,
  FileText,
  Loader2,
  Search,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Download,
  FolderPlus,
  Trash2,
  ChevronLeft,
  Upload,
  Scissors,
  Copy,
  Clipboard,
  ClipboardCopy,
  ClipboardPaste,
  X,
  Pencil,
  FolderOpen,
  MoreVertical
} from "lucide-react";

// Root-level drop zone component
interface RootDropZoneProps {
  onFolderDrop: (folderId: number) => void;
  isActive: boolean;
  children: React.ReactNode;
}

function RootDropZone({ onFolderDrop, isActive, children }: RootDropZoneProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'FOLDER',
    drop: (item: { id: number; type: string }) => {
      if (item.type === 'FOLDER') {
        onFolderDrop(item.id);
      }
      return { name: 'Root' };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
    // Only allow drops if the component is active (e.g., we're not already at root level)
    canDrop: () => isActive,
  });

  return (
    <div 
      ref={drop} 
      className={`${isActive && isOver ? 'bg-blue-50 dark:bg-blue-950 border-2 border-dashed border-blue-300' : ''}`}
      style={{ minHeight: isActive ? '100%' : 'auto' }}
    >
      {children}
    </div>
  );
}

export default function DocumentsPage() {
  const { toast } = useToast();
  const [viewType, setViewType] = useState<"list" | "grid" | "windows">("windows");
  const [searchQuery, setSearchQuery] = useState("");

  // State for project and folder navigation
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);

  // Form dialogs state
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [viewDocumentOpen, setViewDocumentOpen] = useState(false);
  const [deleteDocumentDialog, setDeleteDocumentDialog] = useState(false);
  const [deleteFolderDialog, setDeleteFolderDialog] = useState(false);

  // Selected items for edit/delete operations
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedParentFolder, setSelectedParentFolder] = useState<number | null>(null);

  // State for cut/copy/paste
  const [clipboardAction, setClipboardAction] = useState<'cut' | 'copy' | null>(null);
  const [clipboardItem, setClipboardItem] = useState<Document | DocumentFolder | null>(null);
  const [showPasteButton, setShowPasteButton] = useState(false);
  const [isPasteLoading, setIsPasteLoading] = useState(false);

  // Fetch projects data
  const { data: projects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: true,
  });

  // Fetch folders data based on project selection
  const { data: folders, isLoading: isFoldersLoading } = useQuery({
    queryKey: [`/api/projects/${selectedProjectId}/document-folders`],
    enabled: !!selectedProjectId,
    onSuccess: (data) => {
      console.log("Folders fetched successfully:", data);
      if (data) {
        console.log("Root folders:", data.filter(folder => folder.parentFolderId === null));
      }
    },
    onError: (error) => {
      console.error("Error fetching folders:", error);
    }
  });

  // Fetch documents data based on project selection
  const documentsQuery = useQuery({
    queryKey: [`/api/projects/${selectedProjectId}/documents`],
    enabled: !!selectedProjectId,
    onSuccess: (data) => {
      console.log("Documents fetched successfully:", data);
      if (data) {
        console.log("Root documents:", data.filter(doc => doc.folderId === null));
      }
    },
    onError: (error) => {
      console.error("Error fetching documents:", error);
    }
  });

  const { data: documents, isLoading: isDocumentsLoading } = documentsQuery;

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: InsertDocumentFolder) => {
      console.log("Creating folder with data:", data);
      const res = await apiRequest("POST", "/api/document-folders", data);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Folder creation error response:", errorText);
        throw new Error(errorText || `Failed with status: ${res.status}`);
      }

      const result = await res.json();
      console.log("Folder created successfully:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Folder created with ID:", data.id);
      // Force a refetch of the folders data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/document-folders`] });

      setFolderFormOpen(false);
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Folder creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create folder: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update folder mutation with enhanced logging and validation
  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertDocumentFolder> }) => {
      // Validate folder ID
      if (!id || isNaN(Number(id))) {
        console.error("Invalid folder ID for update:", id);
        throw new Error("Invalid folder ID");
      }

      // Validate folder name
      if (!data.name || data.name.trim() === '') {
        console.error("Empty folder name provided for update");
        throw new Error("Folder name cannot be empty");
      }

      console.log("Updating folder:", id, "with data:", data);

      // Make API request to update folder
      try {
        const res = await apiRequest("PUT", `/api/document-folders/${id}`, data);

        if (!res.ok) {
          let errorMessage;
          try {
            // Safely attempt to parse the response as JSON
            const responseText = await res.text();
            try {
              // Try to parse as JSON first
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || `Failed with status: ${res.status}`;
            } catch (jsonError) {
              // If not valid JSON, use the raw text
              // Check if it's an HTML response (common for server errors)
              if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
                errorMessage = `Server error: Status ${res.status}`;
              } else {
                errorMessage = responseText || `Failed with status: ${res.status}`;
              }
            }
          } catch (e) {
            errorMessage = `Failed with status: ${res.status}`;
          }

          console.error("Folder update error response:", errorMessage);
          throw new Error(errorMessage);
        }

        // Safely handle the success response
        try {
          const responseText = await res.text();
          if (!responseText.trim()) {
            // Handle empty response
            console.log("Empty response received, but operation was successful");
            return { id, ...data, success: true };
          }

          try {
            const result = JSON.parse(responseText);
            console.log("Folder updated successfully:", result);
            return result;
          } catch (jsonError) {
            console.warn("Non-JSON response received:", responseText);
            // Return a constructed response since the operation was successful
            return { id, ...data, success: true };
          }
        } catch (responseError) {
          console.error("Error reading response:", responseError);
          // Return a constructed response object with the data we have
          return { id, ...data, success: true };
        }
      } catch (error) {
        console.error("Error during folder update:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Folder updated successfully:", data);

      // Track if this was specifically a rename operation
      const wasRenameOperation = selectedFolder && 
                                 selectedFolder.name !== data.name &&
                                 selectedFolder.id === data.id;

      // Update local state to reflect changes immediately
      if (currentFolderId === data.id) {
        // If we're currently in the renamed folder, update the UI immediately
        setCurrentPath(prev => {
          // Find and update the folder in the current path
          return prev.map(id => id);
        });
      }

      // Force a refetch of the folders data with the correct query key
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/document-folders`] });

      // Clear form state
      setFolderFormOpen(false);
      setSelectedFolder(null);

      // Show appropriate success message
      toast({
        title: "Success",
        description: wasRenameOperation 
          ? `Folder renamed to "${data.name}" successfully` 
          : "Folder updated successfully",
        duration: 3000
      });
    },
    onError: (error: Error) => {
      console.error("Folder update error:", error);

      // Provide more specific error messages based on common error cases
      let errorMessage = error.message;
      if (errorMessage.includes("name is required") || errorMessage.includes("empty")) {
        errorMessage = "Folder name cannot be empty";
      } else if (errorMessage.includes("already exists")) {
        errorMessage = "A folder with this name already exists in this location";
      } else if (errorMessage.includes("Invalid folder")) {
        errorMessage = "The folder could not be found or accessed";
      }

      toast({
        title: "Error",
        description: `Failed to update folder: ${errorMessage}`,
        variant: "destructive",
        duration: 5000,
      });

      // Keep the form open when there's an error so the user can correct it
      // unless it's an access or not found error
      if (errorMessage.includes("not be found")) {
        setFolderFormOpen(false);
      }
    },
  });

  // Create a local state to track deleted folder IDs
  const [deletedFolderIds, setDeletedFolderIds] = useState<number[]>([]);

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderOrId: DocumentFolder | number) => {
      if (!selectedProjectId) {
        throw new Error("Project ID is required");
      }

      // Extract the ID whether we receive a folder object or an ID
      const folderId = typeof folderOrId === 'object' ? Number(folderOrId.id) : Number(folderOrId);
      if (isNaN(folderId)) {
        throw new Error("Invalid folder ID");
      }

      console.log("Deleting folder with ID:", folderId);

      // Enhanced error logging to debug potential issues
      try {
        // The correct endpoint is /api/document-folders/:id without project ID
        const res = await apiRequest("DELETE", `/api/document-folders/${folderId}`);

        if (!res.ok) {
          let errorMsg;
          try {
            const error = await res.json();
            errorMsg = error.message;
          } catch (e) {
            errorMsg = `Failed with status: ${res.status}`;
          }
          console.error("Folder deletion error response:", errorMsg);
          throw new Error(errorMsg);
        }

        console.log("Folder deleted successfully");
        return true;
      } catch (error) {
        console.error("Error during folder deletion API call:", error);
        throw error;
      }
    },
    onSuccess: (_, deletedFolderId) => {
      console.log("Folder deletion succeeded, invalidating queries");

      // Add to locally deleted folders list to ensure it stays out of the UI
      setDeletedFolderIds(prev => [...prev, deletedFolderId]);

      // Force a refetch of the folders data with the correct query key
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/document-folders`] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", selectedProjectId] });

      // No need to set these states as they'll be set in confirmDeleteFolder
    },
    onError: (error: Error) => {
      console.error("Folder deletion error:", error);
      toast({
        title: "Error",
        description: `Failed to delete folder: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add loading state for documents
  const [isUploading, setIsUploading] = useState(false);

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: InsertDocument & { file: File }) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("projectId", data.projectId.toString());
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      if (data.folderId) {
        formData.append("folderId", data.folderId.toString());
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload document");
      }

      return await res.json();
    },
    onSuccess: async (data) => {
      console.log("Document upload success, received response:", data);

      // Immediately close the upload form and show success message
      setUploadFormOpen(false);
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Reset the document queries to trigger a true refetch
      queryClient.resetQueries({ queryKey: ["/api/documents", selectedProjectId] });
      queryClient.resetQueries({ 
        queryKey: [`/api/projects/${selectedProjectId}/documents`] 
      });

      // Force immediate refetch for the current view
      if (currentFolderId !== null) {
        try {
          await queryClient.refetchQueries({ 
            queryKey: [`/api/document-folders/${currentFolderId}/documents`],
            exact: true
          });
        } catch (err) {
          console.error("Error refetching folder documents:", err);
        }
      } else {
        try {
          await queryClient.refetchQueries({ 
            queryKey: [`/api/projects/${selectedProjectId}/documents`],
            exact: true
          });
        } catch (err) {
          console.error("Error refetching project documents:", err);
        }
      }

      // Manually trigger refetch of documents query
      try {
        // Force a direct fetch to ensure fresh data
        const response = await fetch(`/api/projects/${selectedProjectId}/documents${
          currentFolderId ? `?folderId=${currentFolderId}` : ''
        }`);

        if (response.ok) {
          const freshData = await response.json();
          console.log("Manually fetched fresh documents:", freshData);

          // Force-update the cache with the new data
          queryClient.setQueryData(
            [`/api/projects/${selectedProjectId}/documents`], 
            (oldData: any) => {
              console.log("Old data before update:", oldData);
              console.log("New data being set:", freshData);
              return freshData;
            }
          );

          // Add newly uploaded document to documents array if not already present
          if (Array.isArray(documents)) {
            const isDocumentAlreadyInList = documents.some(doc => doc.id === data.id);
            if (!isDocumentAlreadyInList) {
              const updatedDocuments = [...documents, data];
              queryClient.setQueryData(
                [`/api/projects/${selectedProjectId}/documents`],
                updatedDocuments
              );
            }
          }
        }
      } catch (err) {
        console.error("Error directly fetching documents:", err);
      } finally {
        setIsUploading(false);
      }
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: `Failed to upload document: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Document move mutation (used for cut & paste)
  const moveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, targetFolderId }: { documentId: number, targetFolderId: number | null }) => {
      console.log(`Moving document ${documentId} to folder ${targetFolderId}`);
      const res = await apiRequest("POST", `/api/documents/${documentId}/move`, { targetFolderId });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to move document");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Document moved successfully:", data);

      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/documents`] });

      // Reset clipboard state
      setClipboardAction(null);
      setClipboardItem(null);
      setShowPasteButton(false);
      setIsPasteLoading(false);

      toast({
        title: "Success",
        description: "Document moved successfully",
      });
    },
    onError: (error: Error) => {
      setIsPasteLoading(false);
      toast({
        title: "Error",
        description: `Failed to move document: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Document copy mutation (used for copy & paste)
  const copyDocumentMutation = useMutation({
    mutationFn: async ({ documentId, targetFolderId }: { documentId: number, targetFolderId: number | null }) => {
      console.log(`Copying document ${documentId} to folder ${targetFolderId}`);
      const res = await apiRequest("POST", `/api/documents/${documentId}/copy`, { targetFolderId });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to copy document");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Document copied successfully:", data);

      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/documents`] });

      // Reset clipboard state if it was a paste operation
      if (clipboardAction === 'copy') {
        setClipboardAction(null);
        setClipboardItem(null);
        setShowPasteButton(false);
      }

      setIsPasteLoading(false);

      toast({
        title: "Success",
        description: "Document copied successfully",
      });
    },
    onError: (error: Error) => {
      setIsPasteLoading(false);
      toast({
        title: "Error",
        description: `Failed to copy document: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle cut operation
  const handleCutDocument = (document: Document) => {
    // Store document in clipboard for paste operation
    setClipboardItem({
      item: document,
      type: 'document'
    });
    setClipboardAction('cut');
    setShowPasteButton(true);

    toast({
      title: "Ready to move",
      description: `Navigate to destination folder and click paste`,
    });
  };

  // Handle copy operation
  const handleCopyDocument = (document: Document) => {
    // Store document in clipboard for paste operation
    setClipboardItem({
      item: document,
      type: 'document'
    });
    setClipboardAction('copy');
    setShowPasteButton(true);

    toast({
      title: "Ready to copy",
      description: `Navigate to destination folder and click paste`,
    });
  };

  // Handle paste operation
  const handlePaste = () => {
    if (!clipboardItem || !clipboardAction) {
      toast({
        title: "Error",
        description: "Nothing to paste",
        variant: "destructive",
      });
      return;
    }

    setIsPasteLoading(true);

    if (clipboardItem.type === 'document') {
      const document = clipboardItem.item as Document;

      if (clipboardAction === 'cut') {
        // Move document to current folder
        moveDocumentMutation.mutate({ 
          documentId: document.id, 
          targetFolderId: currentFolderId 
        });
      } else if (clipboardAction === 'copy') {
        // Copy document to current folder
        copyDocumentMutation.mutate({ 
          documentId: document.id, 
          targetFolderId: currentFolderId 
        });
      }
    }
  };

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!selectedProjectId) {
        throw new Error("Project ID is required");
      }
      const res = await apiRequest("DELETE", `/api/projects/${selectedProjectId}/documents/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete document");
      }
      return true;
    },
    onSuccess: (_, deletedDocId) => {
      // Invalidate multiple queries to ensure all document lists are refreshed
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/documents`] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });

      // Make sure the document stays removed from UI even if the API calls fail
      setDeletedDocumentIds(prev => [...prev, deletedDocId]);

      // No need to set dialog state or show toast as it's already done in confirmDeleteDocument
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete document: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filtered data based on search and exclude deleted folders
  const filteredFolders = folders?.filter(folder => {
    // Skip folders that have been locally marked as deleted
    if (deletedFolderIds.includes(folder.id)) return false;

    // Apply search filter
    if (!searchQuery) return true;
    return folder.name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  // Create a local state to track deleted document IDs
  const [deletedDocumentIds, setDeletedDocumentIds] = useState<number[]>([]);

  // Filter documents - exclude deleted ones and apply search
  const filteredDocuments = documents?.filter(doc => {
    // Skip documents that have been locally marked as deleted
    if (deletedDocumentIds.includes(doc.id)) return false;

    // Apply search filter
    if (!searchQuery) return true;
    return doc.name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  // Helper to get all documents in current folder
  const rootDocuments = documents?.filter(doc => doc.folderId === null) || [];

  // Helper to get all folders in a specific parent folder
  const getSubFolders = (parentId: number) => {
    return folders?.filter(folder => folder.parentFolderId === parentId) || [];
  };

  // Root folders are those without a parent
  const rootFolders = folders?.filter(folder => folder.parentFolderId === null) || [];

  // Event handlers
  const handleAddFolder = () => {
    setSelectedFolder(null);
    setSelectedParentFolder(null);
    setFolderFormOpen(true);
  };

  const handleAddSubFolder = () => {
    setSelectedFolder(null);
    setSelectedParentFolder(currentFolderId);
    setFolderFormOpen(true);
  };

  const handleEditFolder = (folder: DocumentFolder) => {
    console.log("Preparing to edit folder:", folder);

    // Validate folder object before editing
    if (!folder || !folder.id) {
      console.error("Invalid folder object provided for editing");
      toast({
        title: "Error",
        description: "Invalid folder selected for editing",
        variant: "destructive"
      });
      return;
    }

    // Ensure folder ID is a number
    setSelectedFolder({
      ...folder,
      id: Number(folder.id)
    });
    setSelectedParentFolder(folder.parentFolderId);
    setFolderFormOpen(true);
  };

  const handleDeleteFolder = (folder: DocumentFolder) => {
    console.log("Preparing to delete folder:", folder);
    // Save the folder with its ID as a number
    setSelectedFolder({
      ...folder,
      id: Number(folder.id) // Ensure ID is a number
    });
    setDeleteFolderDialog(true);
  };

  const confirmDeleteFolder = () => {
    if (selectedFolder) {
      console.log("Deleting folder with details:", {
        id: selectedFolder.id,
        name: selectedFolder.name,
        typeofId: typeof selectedFolder.id
      });

      // Ensure we have a valid numeric ID to delete
      const folderId = Number(selectedFolder.id);
      if (isNaN(folderId)) {
        console.error("Invalid folder ID:", selectedFolder.id);
        toast({
          title: "Error",
          description: "Invalid folder ID",
          variant: "destructive"
        });
        return;
      }

      // Immediately update local state to remove the folder from UI
      setDeletedFolderIds(prev => [...prev, folderId]);

      // Close dialog first so the UI updates immediately
      setDeleteFolderDialog(false);

      // If the current folder was deleted, navigate to parent
      if (folderId === currentFolderId) {
        navigateToParentFolder();
      }

      // Then initiate the server-side deletion passing the complete folder object
      deleteFolderMutation.mutate(selectedFolder);

      // Reset selected folder
      setSelectedFolder(null);

      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    }
  };

  const handleAddDocument = () => {
    setSelectedDocument(null);
    setSelectedParentFolder(currentFolderId);
    setUploadFormOpen(true);
  };

  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    // Document editing is typically handled via metadata updates or re-uploading
    toast({
      title: "Info",
      description: "Document editing coming soon. For now, please delete and re-upload.",
    });
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewDocumentOpen(true);
  };

  const handleDeleteDocument = (document: Document | number) => {
    // If document is a number, it's being called from the WindowsExplorerView component
    if (typeof document === 'number') {
      const docToDelete = documents.find(d => d.id === document);
      if (docToDelete) {
        setSelectedDocument(docToDelete);
      } else {
        console.error('Document not found:', document);
        return;
      }
    } else {
      setSelectedDocument(document);
    }
    setDeleteDocumentDialog(true);
  };

  const confirmDeleteDocument = () => {
    if (selectedDocument) {
      // Immediately update local state to remove the document from UI
      setDeletedDocumentIds(prev => [...prev, selectedDocument.id]);

      // Close dialog first so the UI updates
      setDeleteDocumentDialog(false);

      // Then initiate the server-side deletion
      deleteDocumentMutation.mutate(selectedDocument.id);

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    }
  };

  const handleMoveDocument = async (document: Document, targetFolderId: number | null) => {
    try {
      const response = await apiRequest(
        'PATCH',
        `/api/documents/${document.id}`,
        { folderId: targetFolderId }
      );

      if (!response.ok) {
        throw new Error('Failed to move document');
      }

      // Refresh documents list
      queryClient.invalidateQueries({ 
        queryKey: [`/api/projects/${selectedProjectId}/documents`] 
      });

      toast({
        title: "Document moved",
        description: "Document has been moved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    window.open(`/api/documents/${document.id}/download`, "_blank");
  };

  // Navigation functions
  const handleNavigateToFolder = (folderId: number | null) => {
    if (folderId === null) {
      // Navigate to root
      setCurrentFolderId(null);
      setCurrentPath([]);
    } else {
      // Navigate to specific folder
      setCurrentFolderId(folderId);

      // Update path
      const folder = folders?.find(f => f.id === folderId);
      if (folder) {
        // If clicking a folder we're already viewing in the path, truncate the path
        const existingIndex = currentPath.indexOf(folderId);
        if (existingIndex >= 0) {
          setCurrentPath(prev => prev.slice(0, existingIndex + 1));
        } else {
          // Otherwise add to path
          setCurrentPath(prev => [...prev, folderId]);
        }
      }
    }
  };

  const navigateToParentFolder = () => {
    if (currentPath.length <= 1) {
      // If at first level, go back to root
      setCurrentFolderId(null);
      setCurrentPath([]);
    } else {
      // Otherwise go up one level
      const parentFolderId = currentPath[currentPath.length - 2];
      setCurrentFolderId(parentFolderId);
      setCurrentPath(prev => prev.slice(0, -1));
    }
  };

  // Handle dropping a folder to make it a root folder
  const handleFolderDropToRoot = (folderId: number) => {
    const folder = folders?.find(f => f.id === folderId);
    if (folder) {
      updateFolderMutation.mutate({
        id: folder.id,
        data: { ...folder, parentFolderId: null }
      });
    }
  };

  // Cut / Copy / Paste handlers
  const handleClipboardAction = (action: 'cut' | 'copy', item: Document | DocumentFolder) => {
    setClipboardAction(action);
    setClipboardItem(item);
    setShowPasteButton(true);

    toast({
      title: `Item ${action === 'cut' ? 'cut' : 'copied'} to clipboard`,
      description: `Navigate to destination folder and click Paste to ${action === 'cut' ? 'move' : 'copy'} "${item.name}"`,
      duration: 5000,
    });
  };

  const handlePasteItem = async (targetFolderId: number | null) => {
    if (!clipboardAction || !clipboardItem) {
      toast({
        title: "Error",
        description: "No item to paste.",
        variant: "destructive",
      });
      return;
    }

    setIsPasteLoading(true);

    try {
      if ('fileType' in clipboardItem) {
        // It's a document
        const document = clipboardItem as Document;

        if (clipboardAction === 'cut') {
          try {
            const response = await apiRequest(
              'PATCH',
              `/api/documents/${document.id}`,
              { folderId: targetFolderId }
            );

            if (!response.ok) {
              throw new Error('Failed to move document');
            }

            // Refresh documents list
            queryClient.invalidateQueries({ 
              queryKey: [`/api/projects/${selectedProjectId}/documents`] 
            });

            toast({
              title: "Success",
              description: "Document moved successfully",
            });
          } catch (error) {
            throw new Error('Failed to move document');
          }
        } else if (clipboardAction === 'copy') {
          try {
            // For document copy, we'll create a new document with the same data but in the target folder
            const docToCopy = clipboardItem as Document;

            const newDocData = {
              name: `Copy of ${docToCopy.name}`,
              description: docToCopy.description,
              fileUrl: docToCopy.fileUrl,
              fileName: docToCopy.fileName,
              fileType: docToCopy.fileType,
              fileSize: docToCopy.fileSize,
              folderId: targetFolderId,
              projectId: selectedProjectId
            };

            const response = await apiRequest(
              'POST',
              `/api/documents`,
              newDocData
            );

            if (!response.ok) {
              throw new Error('Failed to copy document');
            }

            // Refresh documents list
            queryClient.invalidateQueries({ 
              queryKey: [`/api/projects/${selectedProjectId}/documents`] 
            });

            toast({
              title: "Success",
              description: "Document copied successfully",
            });
          } catch (error) {
            console.error('Error copying document:', error);
            toast({
              title: "Error",
              description: "Failed to copy document",
              variant: "destructive",
            });
          }
        }
      } else {
        // It's a folder
        const folder = clipboardItem as DocumentFolder;

        if (clipboardAction === 'cut') {
          try {
            // Check for circular reference
            if (targetFolderId === folder.id) {
              throw new Error("Cannot move folder into itself");
            }

            const response = await apiRequest(
              'POST',
              `/api/document-folders/${folder.id}/move`,
              { targetFolderId }
            );

            if (!response.ok) {
              throw new Error('Failed to move folder');
            }

            // Refresh folders list
            queryClient.invalidateQueries({ 
              queryKey: [`/api/projects/${selectedProjectId}/document-folders`] 
            });

            toast({
              title: "Success",
              description: "Folder moved successfully",
            });
          } catch (error) {
            throw new Error('Failed to move folder');
          }
        } else if (clipboardAction === 'copy') {
          toast({
            title: "Not implemented",
            description: "Copying folders is not yet implemented.",
          });
        }
      }

      // Reset clipboard state after successful operation
      setClipboardAction(null);
      setClipboardItem(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to paste item",
        variant: "destructive",
      });
    }
  };

  const isLoading = isProjectsLoading || 
    (!!selectedProjectId && (isFoldersLoading || isDocumentsLoading));

  return (
    <MainLayout>
      <DndProvider backend={HTML5Backend}>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-xl shadow-lg">
                  <FolderOpen className="h-8 w-8 text-white" />
                </div>
                Document Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage project documents and folders
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-2 mr-4">
                <Tabs value={viewType} onValueChange={(value) => setViewType(value as "list" | "grid" | "windows")}>
                  <TabsList>
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="grid">Grid</TabsTrigger>
                    <TabsTrigger value="windows">Windows Explorer</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Button
                onClick={() => handleAddDocument()}
                variant="default"
                className="flex items-center gap-2"
                disabled={!selectedProjectId}
              >
                <FileText className="h-4 w-4" />
                Upload Document
              </Button>
              <Button
                onClick={handleAddFolder}
                variant="outline"
                className="flex items-center gap-2"
                disabled={!selectedProjectId}
              >
                <Folder className="h-4 w-4" />
                New Folder
              </Button>

              {/* Enhanced clipboard/paste functionality */}
              {showPasteButton && (
                <div className="relative">
                  <Button
                    onClick={() => handlePasteItem(currentFolderId)}
                    variant="default"
                    className={`flex items-center gap-2 ${clipboardAction === 'cut' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    disabled={isPasteLoading || !clipboardItem || !selectedProjectId}
                  >
                    {isPasteLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <>
                        {clipboardAction === 'cut' ? <Scissors className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      </>
                    )}
                    Paste {clipboardItem?.name ? `"${clipboardItem.name.substring(0, 15)}${clipboardItem.name.length > 15 ? '...' : ''}"` : ''}
                  </Button>

                  {/* Clear clipboard button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-7 top-0 h-full w-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 border-l border-red-200 dark:border-red-800 rounded-r-md"
                    onClick={() => {
                      setClipboardAction(null);
                      setClipboardItem(null);
                      setShowPasteButton(false);
                    }}
                    title="Clear clipboard"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <Button
                onClick={() => window.location.reload()}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <Select
                value={selectedProjectId ? selectedProjectId.toString() : undefined}
                onValueChange={(value) => {
                  setSelectedProjectId(parseInt(value));
                  setSearchQuery("");
                  // Reset folder navigation when changing projects
                  setCurrentPath([]);
                  setCurrentFolderId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder="Search documents and folders..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!selectedProjectId}
              />
            </div>
          </div>

          {!selectedProjectId ? (
            <Card>
              <CardContent className="pt-6 text-center py-10">
                <Folder className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  Please select a project to view its documents
                </p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rootFolders.length === 0 && rootDocuments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-10">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchQuery
                    ? "No documents or folders match your search"
                    : "No documents or folders found. Upload a document or create a folder to get started."}
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    onClick={() => handleAddDocument()}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Upload Document
                  </Button>
                  <Button
                    onClick={handleAddFolder}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Folder className="h-4 w-4" />
                    New Folder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <RootDropZone
              onFolderDrop={handleFolderDropToRoot}
              isActive={!!currentFolderId}
            >
              {viewType === "windows" ? (
                <WindowsExplorerView
                  folders={filteredFolders}
                  documents={filteredDocuments}
                  currentFolderId={currentFolderId}
                  onNavigateToFolder={handleNavigateToFolder}
                  onViewDocument={handleViewDocument}
                  onEditDocument={handleEditDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onDownloadDocument={handleDownloadDocument}
                  onAddDocument={handleAddDocument}
                  onAddFolder={handleAddSubFolder}
                  onEditFolder={handleEditFolder}
                  onDeleteFolder={handleDeleteFolder}
                />
              ) : (
                <div className="border rounded-md overflow-hidden bg-white dark:bg-gray-950 shadow">
                  {/* Windows-style Explorer Header and Address Bar */}
                  <div className="p-3 border-b flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Navigate to parent folder or back to root
                          if (currentPath.length <= 1) {
                            handleNavigateToFolder(null); // Go to root
                          } else {
                            // Go to parent folder
                            const parentFolderId = currentPath[currentPath.length - 2];
                            handleNavigateToFolder(parentFolderId);
                          }
                        }}
                        disabled={currentPath.length === 0}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="icon"
                        disabled
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Address/Path bar similar to Windows Explorer */}
                    <div className="flex-1 mx-4">
                      <div className="flex items-center bg-white dark:bg-gray-800 border rounded-md px-2 py-1">
                        <span className="text-gray-500 mr-2">
                          <Folder className="h-4 w-4" />
                        </span>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
                          <span 
                            className="cursor-pointer hover:underline hover:text-blue-500 flex items-center"
                            onClick={() => handleNavigateToFolder(null)}
                          >
                            Root
                          </span>
                          {currentPath.map((folderId, index) => {
                            const folder = folders?.find(f => f.id === folderId);
                            if (!folder) return null;
                            return (
                              <div key={folderId} className="flex items-center">
                                <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
                                <span 
                                  className="cursor-pointer hover:underline hover:text-blue-500"
                                  onClick={() => handleNavigateToFolder(folderId)}
                                >
                                  {folder.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="search"
                        placeholder="Search..."
                        className="pl-10 w-48"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={!selectedProjectId}
                      />
                    </div>
                  </div>

                  {/* Main Explorer Content - Windows-style Grid View */}
                  <div className="p-4 h-[500px] overflow-auto">
                    {/* File and Folder Grid - Windows Explorer style */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {/* Root Folder navigation icon */}
                      {currentPath.length > 0 && (
                        <div 
                          className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => {
                            // Navigate to parent folder or back to root
                            if (currentPath.length <= 1) {
                              handleNavigateToFolder(null); // Go to root
                            } else {
                              // Go to parent folder
                              const parentFolderId = currentPath[currentPath.length - 2];
                              handleNavigateToFolder(parentFolderId);
                            }
                          }}
                        >
                          <div className="relative mb-2">
                            <FolderOpen className="h-16 w-16 text-yellow-400" />
                            <ArrowUp className="h-4 w-4 absolute bottom-1 right-1 text-black dark:text-white bg-yellow-300 rounded-full p-0.5" />
                          </div>
                          <span className="text-sm text-center truncate">Parent Folder</span>
                        </div>
                      )}

                      {/* Display folders first - Windows Explorer style */}
                      {!currentFolderId ? 
                        rootFolders.map((folder) => (
                          <div 
                            key={folder.id}
                            className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors relative group"
                            onClick={() => handleNavigateToFolder(folder.id)}
                          >
                            <div className="relative mb-2">
                              <Folder className="h-16 w-16 text-yellow-400" />
                            </div>
                            <span className="text-sm text-center truncate max-w-full">{folder.name}</span>

                            {/* Context menu actions shown on hover */}
                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditFolder(folder);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folder);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                        : getSubFolders(currentFolderId).map((folder) => (
                          <div 
                            key={folder.id}
                            className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors relative group"
                            onClick={() => handleNavigateToFolder(folder.id)}
                          >
                            <div className="relative mb-2">
                              <Folder className="h-16 w-16 text-yellow-400" />
                            </div>
                            <span className="text-sm text-center truncate max-w-full">{folder.name}</span>

                            {/* Context menu actions shown on hover */}
                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditFolder(folder);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folder);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      }

                      {/* Display documents - Windows Explorer style */}
                      {filteredDocuments.map((document) => (
                        <div 
                          key={document.id}
                          className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors relative group"
                          onClick={() => handleViewDocument(document)}
                        >
                          <div className="relative mb-2">
                            <FileText className="h-16 w-16 text-blue-400" />
                          </div>
                          <span className="text-sm text-center truncate max-w-full">{document.name}</span>

                          {/* Context menu actions shown on hover */}
                          <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(document);
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDocument(document);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(document);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClipboardAction('cut', document);
                              }}
                            >
                              Cut
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 bg-white dark:bg-gray-800 border shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClipboardAction('copy', document);
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Explorer Status Bar */}
                    <div className="p-2 border-t bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                      <div>
                        {!currentFolderId
                          ? `${rootFolders.length} folders, ${rootDocuments.length} documents`
                                                    : `${getSubFolders(currentFolderId).length} folders, ${filteredDocuments.filter(doc => doc.folderId === currentFolderId).length} documents`
                        }
                      </div>
                      <div>
                        {searchQuery && `Showing results for "${searchQuery}"`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </RootDropZone>
          )}
        </div>

        {/* Folder Form Dialog */}
        <Dialog open={folderFormOpen} onOpenChange={setFolderFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedFolder ? "Edit Folder" : "Create New Folder"}
              </DialogTitle>
              <DialogDescription>
                {selectedFolder
                  ? "Update the folder details below."
                  : "Enter the details for the new folder."}
              </DialogDescription>
            </DialogHeader>

            <DocumentFolderForm
              projectId={Number(selectedProjectId)}
              parentFolderId={selectedParentFolder}
              existingFolder={selectedFolder}
              folders={folders || []}
              onSubmit={(data) => {
                if (selectedFolder) {
                  // Validate folder name before update
                  if (!data.name || data.name.trim() === '') {
                    toast({
                      title: "Validation Error",
                      description: "Folder name cannot be empty",
                      variant: "destructive"
                    });
                    return;
                  }

                  // Check if name is unchanged to avoid unnecessary API calls
                  if (data.name === selectedFolder.name && 
                      data.description === selectedFolder.description && 
                      data.parentFolderId === selectedFolder.parentFolderId) {
                    toast({
                      title: "Info",
                      description: "No changes detected in folder details",
                    });
                    setFolderFormOpen(false);
                    return;
                  }

                  console.log("Updating folder with new data:", data);
                  updateFolderMutation.mutate({
                    id: selectedFolder.id,
                    data,
                  });
                } else {
                  createFolderMutation.mutate(data);
                }
              }}
              isSubmitting={
                createFolderMutation.isPending || updateFolderMutation.isPending
              }
            />
          </DialogContent>
        </Dialog>

        {/* Document Upload Dialog */}
        <Dialog open={uploadFormOpen} onOpenChange={setUploadFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a document to the selected project.
              </DialogDescription>
            </DialogHeader>

            <DocumentUploadForm
              projectId={Number(selectedProjectId)}
              folders={folders || []}
              selectedFolderId={selectedParentFolder}
              onSubmit={(data) => {
                uploadDocumentMutation.mutate(data as InsertDocument & { file: File });
              }}
              isSubmitting={uploadDocumentMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Document Viewer */}
        <DocumentViewer
          document={viewDocumentOpen ? selectedDocument : null}
          onClose={() => {
            setViewDocumentOpen(false);
            setSelectedDocument(null);
          }}
          onDownload={() => selectedDocument && handleDownloadDocument(selectedDocument)}
        />

        {/* Delete Document Confirmation */}
        <AlertDialog open={deleteDocumentDialog} onOpenChange={setDeleteDocumentDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the document "{selectedDocument?.name}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteDocument}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteDocumentMutation.isPending}
              >
                {deleteDocumentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Document"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Folder Confirmation */}
        <AlertDialog open={deleteFolderDialog} onOpenChange={setDeleteFolderDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the folder "{selectedFolder?.name}" and all its contents.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteFolder}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteFolderMutation.isPending}
              >
                {deleteFolderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Folder"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DndProvider>
    </MainLayout>
  );
}