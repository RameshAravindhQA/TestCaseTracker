import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Trash, Edit, MoreHorizontal, Copy, Scissors, ClipboardPaste, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { InlineNavadhitiLoader } from "@/components/ui/navadhiti-loader";

interface TimeSheetFolder {
  id: number;
  name: string;
  userId: number;
  parentId: number | null;
  path: string;
  createdAt: string;
  updatedAt?: string;
}

interface TimeSheetFolderTreeProps {
  onFolderSelect: (folderId: number | null) => void;
  selectedFolderId: number | null;
}

export default function TimeSheetFolderTree({ onFolderSelect, selectedFolderId }: TimeSheetFolderTreeProps) {
  const { toast } = useToast();
  const [expandedFolders, setExpandedFolders] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [folderToRename, setFolderToRename] = useState<TimeSheetFolder | null>(null);

  // Clipboard state for copy/cut/paste operations
  const [clipboardFolder, setClipboardFolder] = useState<TimeSheetFolder | null>(null);
  const [clipboardOperation, setClipboardOperation] = useState<'copy' | 'cut' | null>(null);
  const [rightClickedFolder, setRightClickedFolder] = useState<TimeSheetFolder | null>(null);

  // Drag-and-drop state
  const [draggedFolder, setDraggedFolder] = useState<TimeSheetFolder | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  const [expandTimer, setExpandTimer] = useState<NodeJS.Timeout | null>(null);
  // Track when dragging over root area
  const [isDraggingOverRoot, setIsDraggingOverRoot] = useState(false);

  // Fetch all folders
  const { data: folders, isLoading } = useQuery<TimeSheetFolder[]>({
    queryKey: ["/api/timesheet-folders"],
  });

  // Import useAuth to get current user
  const { user } = useAuth();

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; parentId: number | null }) => {
      // Create the folder with required userId and path fields
      const folderData = {
        name: data.name,
        parentId: data.parentId,
        userId: user?.id,
        path: `/${data.name}` // Default path, will be updated by backend if parentId exists
      };
      const res = await apiRequest("POST", "/api/timesheet-folders", folderData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-folders"] });
      setIsCreateDialogOpen(false);
      setNewFolderName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      });
    },
  });

  // Rename folder mutation
  const renameFolderMutation = useMutation({
    mutationFn: async (data: { id: number; name: string }) => {
      const res = await apiRequest("PATCH", `/api/timesheet-folders/${data.id}`, { name: data.name });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Folder renamed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-folders"] });
      setIsRenameDialogOpen(false);
      setFolderToRename(null);
      setNewFolderName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to rename folder",
        variant: "destructive",
      });
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      const res = await apiRequest("DELETE", `/api/timesheet-folders/${folderId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-folders"] });
      // If the selected folder was deleted, select null
      if (selectedFolderId && !folders?.find(f => f.id === selectedFolderId)) {
        onFolderSelect(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder",
        variant: "destructive",
      });
    },
  });

  // Convert flat folder list to tree structure
  const buildFolderTree = (items: TimeSheetFolder[] | undefined, parentId: number | null = null): TimeSheetFolder[] => {
    if (!items) return [];
    return items
      .filter(item => item.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Handle folder toggle
  const toggleFolder = (folderId: number) => {
    setExpandedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  // Handle create folder
  const handleCreateFolder = (parentId: number | null = null) => {
    setCurrentParentId(parentId);
    setNewFolderName("");
    setIsCreateDialogOpen(true);
  };

  // Handle rename folder
  const handleRenameFolder = (folder: TimeSheetFolder) => {
    setFolderToRename(folder);
    setNewFolderName(folder.name);
    setIsRenameDialogOpen(true);
  };

  // Handle delete folder
  const handleDeleteFolder = (folderId: number) => {
    if (confirm("Are you sure you want to delete this folder? All timesheets in this folder will be moved to the root level.")) {
      deleteFolderMutation.mutate(folderId);
    }
  };

  // Handle copy folder
  const handleCopyFolder = (folder: TimeSheetFolder) => {
    setClipboardFolder(folder);
    setClipboardOperation('copy');
    toast({
      title: "Folder copied",
      description: `Folder "${folder.name}" copied to clipboard. Use Paste to create a copy.`,
    });
  };

  // Handle cut folder
  const handleCutFolder = (folder: TimeSheetFolder) => {
    setClipboardFolder(folder);
    setClipboardOperation('cut');
    toast({
      title: "Folder cut",
      description: `Folder "${folder.name}" cut to clipboard. Use Paste to move it.`,
    });
  };

  // Move folder mutation
  const moveFolderMutation = useMutation({
    mutationFn: async (data: { id: number; parentId: number | null }) => {
      const res = await apiRequest("PATCH", `/api/timesheet-folders/${data.id}`, { parentId: data.parentId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Folder moved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheet-folders"] });
      setClipboardFolder(null);
      setClipboardOperation(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to move folder",
        variant: "destructive",
      });
    },
  });

  // Helper function to check if a folder is a child of another folder
  const isChildOfSource = (childId: number | null, sourceId: number): boolean => {
    if (childId === null) return false;
    if (childId === sourceId) return true;

    const childFolder = folders?.find(f => f.id === childId);
    if (!childFolder) return false;

    return isChildOfSource(childFolder.parentId, sourceId);
  };

  // Handle paste folder
  const handlePasteFolder = (targetFolderId: number | null) => {
    if (!clipboardFolder) {
      toast({
        title: "Nothing to paste",
        description: "Copy or cut a folder first",
        variant: "destructive",
      });
      return;
    }

    // Prevent pasting into itself or its children (circular reference)
    if (clipboardFolder.id === targetFolderId) {
      toast({
        title: "Invalid operation",
        description: "Cannot paste a folder into itself",
        variant: "destructive",
      });
      return;
    }

    if (targetFolderId !== null && isChildOfSource(targetFolderId, clipboardFolder.id)) {
      toast({
        title: "Invalid operation",
        description: "Cannot paste a folder into its own subfolder",
        variant: "destructive",
      });
      return;
    }

    if (clipboardOperation === 'cut') {
      // Move folder
      moveFolderMutation.mutate({
        id: clipboardFolder.id,
        parentId: targetFolderId,
      });
    } else if (clipboardOperation === 'copy') {
      // Create a new folder with the same name
      createFolderMutation.mutate({
        name: `${clipboardFolder.name} (Copy)`,
        parentId: targetFolderId,
      });
      setClipboardFolder(null);
      setClipboardOperation(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (folder: TimeSheetFolder, event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify({ id: folder.id }));
    setDraggedFolder(folder);

    // Add a delay before showing the ghost image
    setTimeout(() => {
      const ghost = document.createElement('div');
      ghost.classList.add('opacity-60');
      ghost.innerHTML = `<div class="flex items-center p-2 bg-background border rounded shadow-sm">
        <svg class="h-4 w-4 mr-2 text-amber-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.07989 5 6.2 5H8.4C9.08836 5 9.43254 5 9.75217 5.10222C10.0354 5.19367 10.2981 5.34833 10.5095 5.55951C10.7466 5.79945 10.9005 6.13258 11.2083 6.79883L11.8476 8.20117C12.1554 8.86742 12.3093 9.20055 12.5464 9.44049C12.7578 9.65167 13.0206 9.80633 13.3038 9.89778C13.6234 10 13.9676 10 14.656 10H17.8C18.9201 10 19.4802 10 19.908 10.218C20.2843 10.4097 20.5903 10.7157 20.782 11.092C21 11.5198 21 12.0799 21 13.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="text-sm">${folder.name}</span>
      </div>`;
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(ghost, 20, 20);

      setTimeout(() => {
        document.body.removeChild(ghost);
      }, 0);
    }, 0);
  };

  const handleDragOver = (folderId: number | null, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Set drag effect
    event.dataTransfer.dropEffect = 'move';

    if (folderId === null) {
      setIsDraggingOverRoot(true);
      setDragOverFolderId(null);
      return;
    }

    setIsDraggingOverRoot(false);

    // Don't allow dropping on self or child folders
    if (draggedFolder && (folderId === draggedFolder.id || isChildOfSource(folderId, draggedFolder.id))) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }

    // Set current dragged over folder
    setDragOverFolderId(folderId);

    // Auto-expand folder after hovering for 1 second
    if (!expandedFolders.includes(folderId)) {
      if (expandTimer) clearTimeout(expandTimer);

      const timer = setTimeout(() => {
        setExpandedFolders(prev => [...prev, folderId]);
      }, 1000);

      setExpandTimer(timer);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Only clear if we're leaving the container, not entering a child
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      if (expandTimer) {
        clearTimeout(expandTimer);
        setExpandTimer(null);
      }
      setDragOverFolderId(null);
      setIsDraggingOverRoot(false);
    }
  };

  const handleDrop = (targetFolderId: number | null, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Clean up any expand timer
    if (expandTimer) {
      clearTimeout(expandTimer);
      setExpandTimer(null);
    }

    // Reset drag states
    setDragOverFolderId(null);
    setIsDraggingOverRoot(false);

    // Get the dragged folder id from dataTransfer
    const data = event.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const { id } = JSON.parse(data);
      const draggedFolder = folders?.find(f => f.id === id);

      if (!draggedFolder) return;

      // Don't drop on itself or its children
      if (targetFolderId === draggedFolder.id || 
          (targetFolderId !== null && isChildOfSource(targetFolderId, draggedFolder.id))) {
        toast({
          title: "Invalid drop target",
          description: "Cannot drop a folder into itself or its subfolders",
          variant: "destructive",
        });
        return;
      }

      // Move the folder
      moveFolderMutation.mutate({
        id: draggedFolder.id,
        parentId: targetFolderId,
      });
    } catch (error) {
      console.error('Error parsing drag data', error);
    } finally {
      setDraggedFolder(null);
    }
  };

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (expandTimer) clearTimeout(expandTimer);
    };
  }, [expandTimer]);

  // Submit create folder form
  const submitCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    createFolderMutation.mutate({
      name: newFolderName.trim(),
      parentId: currentParentId,
    });
  };

  // Submit rename folder form
  const submitRenameFolder = () => {
    if (!folderToRename) return;
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    renameFolderMutation.mutate({
      id: folderToRename.id,
      name: newFolderName.trim(),
    });
  };

  // Render folder tree item recursively
  const renderFolderItem = (folder: TimeSheetFolder) => {
    const isExpanded = expandedFolders.includes(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folders?.some(f => f.parentId === folder.id);
    const childFolders = buildFolderTree(folders, folder.id);
    const isCut = clipboardOperation === 'cut' && clipboardFolder?.id === folder.id;
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div key={folder.id} className="select-none group">
            <div 
              className={`flex items-center py-1.5 px-2 rounded-sm my-0.5 ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'} ${
                isDragOver ? 'bg-primary/20 ring-1 ring-primary' : ''
              } ${isCut ? 'opacity-50' : ''} cursor-pointer`}
              onClick={(e) => {
                if (e.detail === 2) { // Double click
                  toggleFolder(folder.id);
                }
              }}
              draggable
              onDragStart={(e) => handleDragStart(folder, e)}
              onDragOver={(e) => handleDragOver(folder.id, e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(folder.id, e)}
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="mr-1 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {hasChildren ? isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
              </button>

              <div 
                className="flex-1 flex items-center text-left rounded-sm hover:text-primary"
                onClick={() => onFolderSelect(folder.id)}
              >
                {isExpanded ? 
                  <FolderOpen className="h-4 w-4 mr-2 text-blue-500" /> : 
                  <Folder className="h-4 w-4 mr-2 text-amber-400" />
                }
                <span className="truncate text-sm">{folder.name}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-background focus:opacity-100 focus:outline-none">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleCreateFolder(folder.id)}>
                    <Plus className="h-4 w-4 mr-2" /> New Subfolder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleCopyFolder(folder)}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCutFolder(folder)}>
                    <Scissors className="h-4 w-4 mr-2" /> Cut
                  </DropdownMenuItem>
                  {clipboardFolder && (
                    <DropdownMenuItem onClick={() => handlePasteFolder(folder.id)}>
                      <ClipboardPaste className="h-4 w-4 mr-2" /> Paste
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRenameFolder(folder)}>
                    <Edit className="h-4 w-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isExpanded && childFolders.length > 0 && (
              <div className="pl-4 border-l border-border/40 ml-1.5">
                {childFolders.map(childFolder => renderFolderItem(childFolder))}
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onFolderSelect(folder.id)}>
            <FileText className="h-4 w-4 mr-2" /> Open
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCreateFolder(folder.id)}>
            <Plus className="h-4 w-4 mr-2" /> New Subfolder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleCopyFolder(folder)}>
            <Copy className="h-4 w-4 mr-2" /> Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCutFolder(folder)}>
            <Scissors className="h-4 w-4 mr-2" /> Cut
          </ContextMenuItem>
          {clipboardFolder && (
            <ContextMenuItem onClick={() => handlePasteFolder(folder.id)}>
              <ClipboardPaste className="h-4 w-4 mr-2" /> Paste
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleRenameFolder(folder)}>
            <Edit className="h-4 w-4 mr-2" /> Rename
          </ContextMenuItem>
          <ContextMenuItem 
            onClick={() => handleDeleteFolder(folder.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="h-4 w-4 mr-2" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        <InlineNavadhitiLoader message="Loading folders..." />
      </div>
    );
  }

  const rootFolders = buildFolderTree(folders);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 px-3 py-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm">Folders</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => handleCreateFolder(null)}
              title="Create new folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-1 max-h-[400px] overflow-y-auto custom-scrollbar">
          <ContextMenu>
            <ContextMenuTrigger>
              <div 
                className={`flex items-center py-1.5 px-2 rounded-sm ${selectedFolderId === null ? 'bg-primary/10' : 'hover:bg-accent'} ${isDraggingOverRoot ? 'bg-primary/20 ring-1 ring-primary' : ''} cursor-pointer group`}
                onClick={() => onFolderSelect(null)}
                onDragOver={(e) => handleDragOver(null, e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(null, e)}
              >
                <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium flex-1">All Timesheets</span>

                {clipboardFolder && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-background focus:opacity-100 focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePasteFolder(null);
                    }}
                    title="Paste folder"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => onFolderSelect(null)}>
                <FileText className="h-4 w-4 mr-2" /> View All Timesheets
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleCreateFolder(null)}>
                <Plus className="h-4 w-4 mr-2" /> New Folder
              </ContextMenuItem>
              {clipboardFolder && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => handlePasteFolder(null)}>
                    <ClipboardPaste className="h-4 w-4 mr-2" /> Paste
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>

          {rootFolders.length > 0 ? (
            rootFolders.map(folder => renderFolderItem(folder))
          ) : (
            <div className="text-xs text-muted-foreground py-4 px-3 text-center">
              No folders yet. Create one to organize your timesheets.
            </div>
          )}
        </div>
      </CardContent>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="New folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRenameFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitRenameFolder}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}