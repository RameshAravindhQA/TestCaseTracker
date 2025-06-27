import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Archive, 
  Pin, 
  Trash2,
  BookOpen,
  Filter,
  StickyNote
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
import { NotebookForm } from "@/components/notebooks/notebook-form";
import { Notebook } from "@/types";

export default function NotebooksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);

  // Fetch notebooks
  const { data: notebooks, isLoading } = useQuery<Notebook[]>({
    queryKey: ["/api/notebooks"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/notebooks");
    },
  });

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

  // Filter notebooks - ensure notebooks is an array
  const notebooksArray = Array.isArray(notebooks) ? notebooks : [];
  const filteredNotebooks = notebooksArray.filter(notebook => {
    const matchesSearch = notebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notebook.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === "all" ||
                         (filterStatus === "pinned" && notebook.isPinned) ||
                         (filterStatus === "archived" && notebook.isArchived) ||
                         (filterStatus === "active" && !notebook.isArchived);

    return matchesSearch && matchesFilter;
  });

  const handleNotebookClick = (notebook: Notebook) => {
    setSelectedNotebook(notebook);
    setViewDialogOpen(true);
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

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Notebook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Notebook</DialogTitle>
              <DialogDescription>
                Create a new notebook to organize your notes and ideas.
              </DialogDescription>
            </DialogHeader>
            <NotebookForm onSuccess={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
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
      </div>

      {/* Notebooks Grid */}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotebooks.map((notebook) => (
            <Card 
              key={notebook.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleNotebookClick(notebook)}
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
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {notebook.content || "No content"}
                </p>

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
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
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
      )}

      {/* View Notebook Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotebook?.title}
              {selectedNotebook && getStatusBadge(selectedNotebook)}
            </DialogTitle>
            <DialogDescription>
              Created on {selectedNotebook && new Date(selectedNotebook.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedNotebook && (
            <div className="space-y-4">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {selectedNotebook.content || "No content"}
                </div>
              </div>

              {selectedNotebook.tags && selectedNotebook.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNotebook.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewDialogOpen(false);
                  handleEditNotebook(selectedNotebook);
                }}>
                  Edit
                </Button>
              </div>
            </div>
          )}
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
    </MainLayout>
  );
}