import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Document, DocumentFolder } from "@/shared/schema";
import { DocumentItem } from "./document-item";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderPlus,
  FileUp,
  MoreVertical,
  Pencil,
  Trash2,
  MoveUpRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDrag, useDrop } from "react-dnd";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define item types for drag and drop
const ItemTypes = {
  FOLDER: 'folder',
  DOCUMENT: 'document'
};

interface DocumentFolderComponentProps {
  folder: DocumentFolder;
  documents: Document[];
  subFolders: DocumentFolder[];
  onAddSubFolder: (parentId: number) => void;
  onEditFolder: (folder: DocumentFolder) => void;
  onDeleteFolder: (folder: DocumentFolder) => void;
  onAddDocument: (folderId: number) => void;
  onViewDocument: (document: Document) => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (documentId: number) => void;
  onDownloadDocument: (document: Document) => void;
  onNavigateToFolder?: (folderId: number) => void;
}

export function DocumentFolderComponent({
  folder,
  documents,
  subFolders,
  onAddSubFolder,
  onEditFolder,
  onDeleteFolder,
  onAddDocument,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onDownloadDocument,
  onNavigateToFolder,
}: DocumentFolderComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  // Filter documents in this folder
  const folderDocuments = documents.filter(doc => doc.folderId === folder.id);
  
  // Set up drag source - folders can be dragged
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FOLDER,
    item: { id: folder.id, type: ItemTypes.FOLDER },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        // Handle cancelled drag operation
        setIsMoving(false);
      }
    },
  }));
  
  // Set up drop target - folders can receive other folders
  const [{ isOverCurrent }, drop] = useDrop(
    () => ({
      accept: [ItemTypes.FOLDER],
      drop: (item: { id: number, type: string }, monitor) => {
        if (!monitor.isOver({ shallow: true })) {
          return; // Don't handle drop if it's over a child target
        }
        
        if (item.type === ItemTypes.FOLDER) {
          handleFolderDrop(item.id);
        }
        
        return { id: folder.id, type: "folder" };
      },
      hover: (item, monitor) => {
        if (!ref.current) {
          return;
        }
        
        // Set hover state
        setIsOver(monitor.isOver({ shallow: true }));
      },
      collect: (monitor) => ({
        isOverCurrent: monitor.isOver({ shallow: true }),
      }),
    }),
    [folder]
  );
  
  // Apply refs to make the component both draggable and a drop target
  const applyRef = (el: HTMLDivElement | null) => {
    drag(el);
    drop(el);
    if (ref) {
      ref.current = el;
    }
  };
  
  // Handler for folder drop
  const handleFolderDrop = async (draggedFolderId: number) => {
    // Prevent dropping onto itself
    if (draggedFolderId === folder.id) {
      return;
    }
    
    setIsMoving(true);
    
    try {
      // Call API to move the folder
      const response = await apiRequest(
        "POST",
        `/api/document-folders/${draggedFolderId}/move`,
        { targetFolderId: folder.id }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to move folder");
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ 
        queryKey: [`/api/projects/${folder.projectId}/document-folders`] 
      });
      
      toast({
        title: "Folder moved",
        description: "The folder has been moved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move folder",
        variant: "destructive",
      });
    } finally {
      setIsMoving(false);
      setIsOver(false);
    }
  };
  
  const toggleOpen = () => {
    if (onNavigateToFolder) {
      onNavigateToFolder(folder.id);
    } else {
      setIsOpen(!isOpen);
    }
  };
  
  // Handle double click to open folder
  const handleDoubleClick = () => {
    if (onNavigateToFolder) {
      onNavigateToFolder(folder.id);
    } else {
      setIsOpen(true);
    }
  };

  // Style for when the folder is being dragged
  const dragStyle = isDragging ? { opacity: 0.5 } : {};
  
  // Style for when an item is being dragged over this folder
  const dropIndicatorStyle = isOverCurrent && !isDragging ? { 
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgb(59, 130, 246)",
    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.25)" 
  } : {};

  return (
    <div 
      ref={applyRef}
      className={`border border-gray-200 dark:border-gray-800 rounded-md mb-2 ${isMoving ? 'animate-pulse' : ''}`}
      style={{ ...dragStyle, ...dropIndicatorStyle }}
    >
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-t-md border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleOpen}
          onDoubleClick={handleDoubleClick}
          className="flex items-center flex-1 text-left"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
          )}
          <Folder className={`h-4 w-4 mr-2 ${isOverCurrent ? 'text-blue-500' : 'text-primary'}`} />
          <span className="text-sm font-medium">{folder.name}</span>
        </button>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onAddDocument(folder.id)}
          >
            <FileUp className="h-4 w-4" />
            <span className="sr-only">Upload Document</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onAddSubFolder(folder.id)}
          >
            <FolderPlus className="h-4 w-4" />
            <span className="sr-only">Add Subfolder</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // Placeholder for move action using dialog instead of drag-and-drop
                toast({
                  title: "Move folder",
                  description: "You can drag and drop folders to move them.",
                });
              }}>
                <MoveUpRight className="h-4 w-4 mr-2" />
                Move Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => onDeleteFolder(folder)}
                aria-label="Delete folder"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isOpen && (
        <div className="p-2">
          {subFolders.length === 0 && folderDocuments.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              This folder is empty
            </div>
          ) : (
            <div className="space-y-1">
              {subFolders.map((subFolder) => (
                <DocumentFolderComponent
                  key={subFolder.id}
                  folder={subFolder}
                  documents={documents}
                  subFolders={documents ? documents.filter(sf => sf.parentFolderId === subFolder.id) : []}
                  onAddSubFolder={onAddSubFolder}
                  onEditFolder={onEditFolder}
                  onDeleteFolder={onDeleteFolder}
                  onAddDocument={onAddDocument}
                  onViewDocument={onViewDocument}
                  onEditDocument={onEditDocument}
                  onDeleteDocument={onDeleteDocument}
                  onDownloadDocument={onDownloadDocument}
                  onNavigateToFolder={onNavigateToFolder}
                />
              ))}
              
              {folderDocuments.map((document) => (
                <DocumentItem
                  key={document.id}
                  document={document}
                  onView={() => onViewDocument(document)}
                  onEdit={() => onEditDocument(document)}
                  onDelete={() => onDeleteDocument(document.id)}
                  onDownload={() => onDownloadDocument(document)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}