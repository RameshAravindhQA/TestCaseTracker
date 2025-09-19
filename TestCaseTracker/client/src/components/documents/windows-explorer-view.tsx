import { useState, useRef, useEffect } from "react";
import { Document, DocumentFolder } from "@shared/schema";
import {
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Download,
  Pencil,
  Trash2,
  Copy,
  Scissors,
  ClipboardPaste,
  FileUp,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatFileSize } from "@/lib/utils";

interface WindowsExplorerViewProps {
  folders: DocumentFolder[];
  documents: Document[];
  currentFolderId: number | null;
  onNavigateToFolder: (folderId: number | null) => void;
  onViewDocument: (document: Document) => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (documentId: number) => void;
  onDownloadDocument: (document: Document) => void;
  onAddDocument: (folderId: number | null) => void;
  onAddFolder: (parentFolderId: number | null) => void;
  onEditFolder: (folder: DocumentFolder) => void;
  onDeleteFolder: (folderOrId: DocumentFolder | number) => void;
  onCutDocument?: (document: Document) => void;
  onCopyDocument?: (document: Document) => void;
  onPaste?: () => void;
  hasPasteItem?: boolean;
  isPasteLoading?: boolean;
}

export function WindowsExplorerView({
  folders,
  documents,
  currentFolderId,
  onNavigateToFolder,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onDownloadDocument,
  onAddDocument,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onCutDocument,
  onCopyDocument,
  onPaste,
  hasPasteItem = false,
  isPasteLoading = false,
}: WindowsExplorerViewProps) {
  // States for clipboard operations
  const [clipboard, setClipboard] = useState<{type: 'cut' | 'copy', items: Array<{type: 'folder' | 'document', id: number}>}>({ type: 'copy', items: [] });
  const [selection, setSelection] = useState<{type: 'folder' | 'document', id: number}[]>([]);
  const [isMultiSelectActive, setIsMultiSelectActive] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{type: 'folder' | 'document', id: number} | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<number | null>(null);

  // For folder tree navigation
  const [expandedFolders, setExpandedFolders] = useState<number[]>([]);
  
  // Get current folder and its contents
  const currentFolder = currentFolderId ? folders.find(f => f.id === currentFolderId) : null;
  const parentFolderId = currentFolder?.parentFolderId || null;
  
  const currentFolders = folders.filter(f => f.parentFolderId === currentFolderId && !f.isDeleted);
  const currentDocuments = documents.filter(d => d.folderId === currentFolderId && !d.isDeleted);

  // Folder tree for side navigation
  const rootFolders = folders.filter(f => f.parentFolderId === null && !f.isDeleted);

  // Handle folder expansion in tree
  const toggleFolderExpand = (folderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  // Get folder path for breadcrumb
  const getFolderPath = () => {
    const path = [];
    let current = currentFolder;
    
    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current?.parentFolderId) || null;
    }
    
    return path;
  };

  const folderPath = getFolderPath();

  // Selection handlers
  const toggleItemSelection = (type: 'folder' | 'document', id: number, isMultiSelect: boolean) => {
    setSelection(prev => {
      // Find if item is already selected
      const isSelected = prev.some(item => item.type === type && item.id === id);
      
      if (isSelected) {
        // If already selected, deselect it
        return prev.filter(item => !(item.type === type && item.id === id));
      } else {
        // If not selected and not multi-select, replace selection with just this item
        if (!isMultiSelect) {
          return [{ type, id }];
        }
        // If multi-select, add to selection
        return [...prev, { type, id }];
      }
    });
  };

  // Clear selection when changing folders
  useEffect(() => {
    setSelection([]);
  }, [currentFolderId]);

  // Clipboard operations
  const handleCopy = () => {
    if (selection.length > 0) {
      setClipboard({ type: 'copy', items: [...selection] });
    }
  };

  const handleCut = () => {
    if (selection.length > 0) {
      setClipboard({ type: 'cut', items: [...selection] });
    }
  };

  const handlePaste = () => {
    // This would be implemented to interact with the server API
    // For now, just showing the UI capability
    console.log('Pasting', clipboard.items, 'to folder', currentFolderId);
    // After paste operation, clear clipboard if it was a cut operation
    if (clipboard.type === 'cut') {
      setClipboard({ type: 'copy', items: [] });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (type: 'folder' | 'document', id: number, e: React.DragEvent) => {
    setDraggedItem({ type, id });
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (folderId: number | null, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  const handleDrop = (targetFolderId: number | null, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    // Process drop only if we have a dragged item and target is not the current folder
    if (!draggedItem || (draggedItem.type === 'folder' && draggedItem.id === targetFolderId)) {
      return;
    }

    console.log(`Moving ${draggedItem.type} ${draggedItem.id} to folder ${targetFolderId}`);
    // Here you would implement the API call to move the item
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverFolder(null);
  };

  // Render folder tree (recursive)
  const renderFolderTree = (folderList: DocumentFolder[], parentId: number | null = null, level = 0) => {
    return folderList
      .filter(folder => folder.parentFolderId === parentId && !folder.isDeleted)
      .map(folder => {
        const hasChildren = folders.some(f => f.parentFolderId === folder.id && !f.isDeleted);
        const isExpanded = expandedFolders.includes(folder.id);
        const isSelected = selection.some(item => item.type === 'folder' && item.id === folder.id);
        const isDragOver = dragOverFolder === folder.id;
        
        return (
          <div key={folder.id} className="pl-2">
            <div 
              className={`flex items-center py-1 ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''} ${isDragOver ? 'bg-gray-100 dark:bg-gray-800' : ''} rounded`}
              onClick={() => toggleItemSelection('folder', folder.id, isMultiSelectActive)}
              onDoubleClick={() => onNavigateToFolder(folder.id)}
              onDragOver={(e) => handleDragOver(folder.id, e)}
              onDrop={(e) => handleDrop(folder.id, e)}
              draggable
              onDragStart={(e) => handleDragStart('folder', folder.id, e)}
              onDragEnd={handleDragEnd}
            >
              <button 
                onClick={(e) => toggleFolderExpand(folder.id, e)}
                className="mr-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )
                ) : (
                  <div className="w-4" /> // Spacer when no children
                )}
              </button>
              {isExpanded ? (
                <FolderOpen className="h-5 w-5 text-yellow-500 mr-2" />
              ) : (
                <Folder className="h-5 w-5 text-yellow-500 mr-2" />
              )}
              <span className="text-sm">{folder.name}</span>
            </div>
            {isExpanded && hasChildren && (
              <div className="ml-4">
                {renderFolderTree(folders, folder.id, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  // Render file icon based on file type
  const getFileIcon = (fileType: string) => {
    // Could expand this with more file type icons
    return <FileText className="h-12 w-12" />;
  };

  // Selecting a file type icon based on file extension
  const getIconForFileType = (fileName: string, fileType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Using text color to differentiate file types
    let iconColor = "text-blue-500";
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')) {
      iconColor = "text-green-500";
    } else if (['pdf'].includes(extension || '')) {
      iconColor = "text-red-500";
    } else if (['doc', 'docx'].includes(extension || '')) {
      iconColor = "text-blue-600";
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      iconColor = "text-green-600";
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      iconColor = "text-orange-500";
    }
    
    return <FileText className={`h-12 w-12 ${iconColor}`} />;
  };

  return (
    <div className="flex flex-col h-full border rounded-md shadow-sm bg-white dark:bg-gray-950 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center border-b p-2 gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onNavigateToFolder(parentFolderId)}
          disabled={!currentFolderId}
        >
          Back
        </Button>
        
        <Button variant="outline" size="sm" onClick={() => onAddFolder(currentFolderId)}>
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
        
        <Button variant="outline" size="sm" onClick={() => onAddDocument(currentFolderId)}>
          <FileUp className="h-4 w-4 mr-2" />
          Upload
        </Button>
        
        {selection.length > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleCut}>
              <Scissors className="h-4 w-4 mr-2" />
              Cut
            </Button>
          </>
        )}
        
        {clipboard.items.length > 0 && (
          <Button variant="outline" size="sm" onClick={handlePaste}>
            <ClipboardPaste className="h-4 w-4 mr-2" />
            Paste
          </Button>
        )}
      </div>
      
      {/* Breadcrumb navigation */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-900 px-3 py-1 text-sm">
        <span 
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          onClick={() => onNavigateToFolder(null)}
        >
          Root
        </span>
        
        {folderPath.map((folder, index) => (
          <span key={folder.id}>
            <span className="mx-1">/</span>
            <span 
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              onClick={() => onNavigateToFolder(folder.id)}
            >
              {folder.name}
            </span>
          </span>
        ))}
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Folder tree sidebar */}
        <div className="w-1/4 border-r p-2 overflow-y-auto">
          <div className="font-semibold mb-2 text-sm">Folders</div>
          <div 
            className={`flex items-center py-1 ${!currentFolderId ? 'bg-blue-100 dark:bg-blue-900' : ''} rounded`}
            onClick={() => onNavigateToFolder(null)}
            onDragOver={(e) => handleDragOver(null, e)}
            onDrop={(e) => handleDrop(null, e)}
          >
            <Folder className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-sm">Root</span>
          </div>
          {renderFolderTree(folders)}
        </div>
        
        {/* Files and folders grid */}
        <div 
          className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          onDragOver={(e) => handleDragOver(currentFolderId, e)}
          onDrop={(e) => handleDrop(currentFolderId, e)}
        >
          {/* Render folders */}
          {currentFolders.map(folder => {
            const isSelected = selection.some(item => item.type === 'folder' && item.id === folder.id);
            
            return (
              <ContextMenu key={`folder-${folder.id}`}>
                <ContextMenuTrigger>
                  <div 
                    className={`flex flex-col items-center p-3 rounded-md cursor-pointer relative group ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    onClick={(e) => toggleItemSelection('folder', folder.id, e.ctrlKey || e.metaKey)}
                    onDoubleClick={() => onNavigateToFolder(folder.id)}
                    draggable
                    onDragStart={(e) => handleDragStart('folder', folder.id, e)}
                    onDragEnd={handleDragEnd}
                  >
                    <Folder className="h-12 w-12 text-yellow-500 mb-2" />
                    <span className="text-sm text-center truncate w-full">{folder.name}</span>
                    
                    {/* Folder action buttons (visible on hover) */}
                    <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToFolder(folder.id);
                        }}
                        title="Open Folder"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder);
                        }}
                        title="Delete Folder"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem onClick={() => onNavigateToFolder(folder.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Open
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onEditFolder(folder)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => handleCopy()}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleCut()}>
                    <Scissors className="h-4 w-4 mr-2" />
                    Cut
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem 
                    className="text-red-600 dark:text-red-400"
                    onClick={() => onDeleteFolder(folder)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
          
          {/* Render documents */}
          {currentDocuments.map(document => {
            const isSelected = selection.some(item => item.type === 'document' && item.id === document.id);
            
            return (
              <ContextMenu key={`document-${document.id}`}>
                <ContextMenuTrigger>
                  <div 
                    className={`flex flex-col items-center p-3 rounded-md cursor-pointer relative group ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    onClick={(e) => toggleItemSelection('document', document.id, e.ctrlKey || e.metaKey)}
                    onDoubleClick={() => onViewDocument(document)}
                    draggable
                    onDragStart={(e) => handleDragStart('document', document.id, e)}
                    onDragEnd={handleDragEnd}
                  >
                    {getIconForFileType(document.name, document.fileType)}
                    <span className="text-sm text-center truncate w-full">{document.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(document.fileSize)}</span>
                    
                    {/* Document action buttons (visible on hover) */}
                    <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDocument(document);
                        }}
                        title="View Document"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDocument(document.id);
                        }}
                        title="Delete Document"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem onClick={() => onViewDocument(document)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onDownloadDocument(document)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onEditDocument(document)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => handleCopy()}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleCut()}>
                    <Scissors className="h-4 w-4 mr-2" />
                    Cut
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem 
                    className="text-red-600 dark:text-red-400"
                    onClick={() => onDeleteDocument(document.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
          
          {currentFolders.length === 0 && currentDocuments.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
              This folder is empty
            </div>
          )}
        </div>
      </div>
      
      {/* Status bar */}
      <div className="border-t px-3 py-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <div>
          {selection.length > 0 ? 
            `${selection.length} item(s) selected` : 
            `${currentFolders.length} folder(s), ${currentDocuments.length} file(s)`}
        </div>
        <div>
          {currentFolder ? 
            `Last modified: ${formatDate(new Date(currentFolder.updatedAt || currentFolder.createdAt))}` : 
            '\u00A0'}
        </div>
      </div>
    </div>
  );
}
