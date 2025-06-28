import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";
import { NotebookForm } from "@/components/notebooks/notebook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Calendar, Tag, Trash2, Edit, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  MoreHorizontal, 
  Pin, 
  Archive, 
  Filter,
  StickyNote,
  Grid,
  List
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { Notebook } from "@/types";
import { AttachmentViewer } from "@/components/notebooks/attachment-viewer";

export default function NotebooksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch notebooks
  const { data: notebooks, isLoading, refetch } = useQuery<Notebook[]>({
    queryKey: ["/api/notebooks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notebooks");
      if (!response.ok) throw new Error("Failed to fetch notebooks");
      return response.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Function to refresh notebooks
  const refreshNotebooks = () => {
    refetch();
    toast({
      title: "Refreshing",
      description: "Notebooks are being refreshed.",
    });
  };

  // Update notebook mutation
  const updateNotebookMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Notebook> }) => {
      return await apiRequest("PUT", `/api/notebooks/${id}`, updates);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notebooks"] });
      const action = variables.updates.isPinned !== undefined ? 
        (variables.updates.isPinned ? "pinned" : "unpinned") :
        variables.updates.isArchived !== undefined ?
        (variables.updates.isArchived ? "archived" : "unarchived") : "updated";

      toast({
        title: "Success",
        description: `Notebook ${action} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update notebook: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete notebook mutation
  const deleteNotebookMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/notebooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notebooks"] });
      toast({
        title: "Success",
        description: "Notebook deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete notebook: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter notebooks with advanced search
  const notebooksArray = Array.isArray(notebooks) ? notebooks : [];
  const filteredNotebooks = notebooksArray.filter(notebook => {
    if (!searchQuery) {
      const matchesFilter = filterStatus === "all" ||
                           (filterStatus === "pinned" && notebook.isPinned) ||
                           (filterStatus === "archived" && notebook.isArchived) ||
                           (filterStatus === "active" && !notebook.isArchived);
      return matchesFilter;
    }

    const searchWords = searchQuery.toLowerCase().split(' ').filter(word => word.length > 0);
    const titleText = notebook.title.toLowerCase();
    const contentText = notebook.content.toLowerCase();
    const tagsText = notebook.tags ? notebook.tags.join(' ').toLowerCase() : '';

    const matchesSearch = searchWords.every(word => 
      titleText.includes(word) || 
      contentText.includes(word) || 
      tagsText.includes(word)
    );

    const matchesFilter = filterStatus === "all" ||
                         (filterStatus === "pinned" && notebook.isPinned) ||
                         (filterStatus === "archived" && notebook.isArchived) ||
                         (filterStatus === "active" && !notebook.isArchived);

    return matchesSearch && matchesFilter;
  });

  const handleNotebookSelect = (notebook: Notebook) => {
    setSelectedNotebook(notebook);
  };

  const handleEditNotebook = (notebook: Notebook) => {
    setSelectedNotebook(notebook);
    setEditDialogOpen(true);
  };

  const handlePinNotebook = (notebook: Notebook) => {
    updateNotebookMutation.mutate({
      id: notebook.id,
      updates: { isPinned: !notebook.isPinned }
    });
  };

  const handleArchiveNotebook = (notebook: Notebook) => {
    updateNotebookMutation.mutate({
      id: notebook.id,
      updates: { isArchived: !notebook.isArchived }
    });
  };

  const handleDeleteNotebook = (notebook: Notebook) => {
    if (confirm("Are you sure you want to delete this notebook?")) {
      deleteNotebookMutation.mutate(notebook.id);
    }
  };

  const getStatusBadge = (notebook: Notebook) => {
    if (notebook.isPinned) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pinned</Badge>;
    }
    if (notebook.isArchived) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Archived</Badge>;
    }
    return <Badge variant="outline">Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Notebooks</h1>
        </div>
        <div className="text-center">Loading notebooks...</div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-500 rounded-xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              Notebooks
            </h1>
            <p className="text-gray-600 mt-2">Create and organize your notes with rich formatting</p>
          </div>

          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Notebook
          </Button>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex gap-4 items-center mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search notebooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notebooks</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pinned">Pinned</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {filteredNotebooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchQuery || filterStatus !== "all" ? "No notebooks found" : "No notebooks yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterStatus !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Create your first notebook to get started"}
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Notebook
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotebooks.map((notebook) => (
              <Card 
                key={notebook.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleNotebookSelect(notebook)}
              >
                <CardHeader 
                  className="pb-3"
                  style={{ borderLeft: `4px solid ${notebook.color}` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold truncate">
                        {notebook.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(notebook)}
                        {notebook.tags && notebook.tags.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {notebook.tags.length} tag{notebook.tags.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditNotebook(notebook);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handlePinNotebook(notebook);
                        }}>
                          <Pin className="h-4 w-4 mr-2" />
                          {notebook.isPinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveNotebook(notebook);
                        }}>
                          <Archive className="h-4 w-4 mr-2" />
                          {notebook.isArchived ? "Unarchive" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotebook(notebook);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="text-sm text-gray-600 line-clamp-3 mb-3">
                    {notebook.content || "No content"}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Created {new Date(notebook.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      Updated {new Date(notebook.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {notebook.tags && notebook.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {notebook.tags.slice(0, 3).map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs"
                          style={{
                            backgroundColor: typeof tag === 'object' && tag.color ? tag.color + '20' : undefined,
                            borderColor: typeof tag === 'object' && tag.color ? tag.color : undefined
                          }}
                        >
                          {typeof tag === 'object' ? tag.name : tag}
                        </Badge>
                      ))}
                      {notebook.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{notebook.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notebook List */}
            <div className="lg:col-span-1 space-y-2">
              <h3 className="font-semibold text-lg mb-4">Notebooks ({filteredNotebooks.length})</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredNotebooks.map((notebook) => (
                  <Card
                    key={notebook.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedNotebook?.id === notebook.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotebookSelect(notebook)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: notebook.color }}
                            />
                            <h4 className="font-medium truncate">{notebook.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {notebook.content || "No content"}
                          </p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(notebook)}
                            {notebook.tags && notebook.tags.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {notebook.tags.length} tags
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleEditNotebook(notebook);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handlePinNotebook(notebook);
                            }}>
                              <Pin className="h-4 w-4 mr-2" />
                              {notebook.isPinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveNotebook(notebook);
                            }}>
                              <Archive className="h-4 w-4 mr-2" />
                              {notebook.isArchived ? "Unarchive" : "Archive"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotebook(notebook);
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
            </div>

            {/* Notebook Preview */}
            <div className="lg:col-span-2">
              {selectedNotebook ? (
                <Card className="h-full">
                  <CardHeader style={{ borderLeft: `4px solid ${selectedNotebook.color}` }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Input
                          value={selectedNotebook.title}
                          onChange={(e) => {
                            setSelectedNotebook(prev => prev ? {...prev, title: e.target.value} : null);
                          }}
                          onBlur={() => {
                            if (selectedNotebook) {
                              updateNotebookMutation.mutate({
                                id: selectedNotebook.id,
                                updates: { title: selectedNotebook.title }
                              });
                            }
                          }}
                          className="text-2xl font-bold border-none p-0 focus:ring-0 bg-transparent"
                          placeholder="Notebook title..."
                        />
                        <CardDescription>
                          Created on {new Date(selectedNotebook.createdAt).toLocaleDateString()} • 
                          Updated on {new Date(selectedNotebook.updatedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedNotebook)}
                        <Button onClick={() => handleEditNotebook(selectedNotebook)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Dialog
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose max-w-none mb-6">
                      <textarea
                        value={selectedNotebook.content || ""}
                        onChange={(e) => {
                          setSelectedNotebook(prev => prev ? {...prev, content: e.target.value} : null);
                        }}
                        onBlur={() => {
                          if (selectedNotebook) {
                            updateNotebookMutation.mutate({
                              id: selectedNotebook.id,
                              updates: { content: selectedNotebook.content }
                            });
                          }
                        }}
                        className="w-full min-h-[400px] text-sm leading-relaxed resize-none border-none focus:ring-0 bg-transparent"
                        placeholder="Start writing your notes..."
                      />
                    </div>

                    {selectedNotebook.tags && selectedNotebook.tags.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedNotebook.tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              style={{
                                backgroundColor: typeof tag === 'object' && tag.color ? tag.color + '20' : undefined,
                                borderColor: typeof tag === 'object' && tag.color ? tag.color : undefined
                              }}
                            >
                              {typeof tag === 'object' ? tag.name : tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedNotebook.checklistItems && selectedNotebook.checklistItems.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Checklist</h4>
                        <div className="space-y-1">
                          {selectedNotebook.checklistItems.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                readOnly
                                className="rounded"
                              />
                              <span className={item.completed ? 'line-through text-gray-500' : ''}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedNotebook.attachments && selectedNotebook.attachments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {selectedNotebook.attachments.map((attachment: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm p-2 border rounded">
                              <AttachmentViewer attachment={attachment} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Select a notebook to view
                    </h3>
                    <p className="text-gray-500">
                      Choose a notebook from the list to see its full content
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Create Notebook Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Notebook</DialogTitle>
              <DialogDescription>
                Create a new notebook to organize your notes and ideas.
              </DialogDescription>
            </DialogHeader>
            <NotebookForm onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/notebooks"] });
              refetch();
              setCreateDialogOpen(false);
              toast({
                title: "Success",
                description: "Notebook created successfully.",
              });
            }} />
          </DialogContent>
        </Dialog>

        {/* Edit Notebook Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Notebook</DialogTitle>
              <DialogDescription>
                Update your notebook details and content.
              </DialogDescription>
            </DialogHeader>
            {selectedNotebook && (
              <NotebookForm 
                notebook={selectedNotebook}
                onSuccess={() => {
                  setEditDialogOpen(false);
                  setSelectedNotebook(null);
                }} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Floating Refresh Button */}
      <Button
        onClick={refreshNotebooks}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 rounded-full h-12 w-12 p-0 shadow-lg"
        variant="outline"
        title="Refresh Notebooks"
      >
        <RefreshCw className="h-5 w-5" />
      </Button>
    </MainLayout>
  );
}