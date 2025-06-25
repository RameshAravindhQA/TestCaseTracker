
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Filter, Grid, List, Palette, Pin, Archive, Trash2, Edit3, Save, X, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

interface Notebook {
  id: number;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: number;
}

interface NotebookFormData {
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
}

const COLORS = [
  { name: 'Default', value: '#ffffff', class: 'bg-white border-gray-200' },
  { name: 'Red', value: '#fee2e2', class: 'bg-red-100 border-red-200' },
  { name: 'Orange', value: '#fed7aa', class: 'bg-orange-100 border-orange-200' },
  { name: 'Yellow', value: '#fef3c7', class: 'bg-yellow-100 border-yellow-200' },
  { name: 'Green', value: '#dcfce7', class: 'bg-green-100 border-green-200' },
  { name: 'Blue', value: '#dbeafe', class: 'bg-blue-100 border-blue-200' },
  { name: 'Purple', value: '#e9d5ff', class: 'bg-purple-100 border-purple-200' },
  { name: 'Pink', value: '#fce7f3', class: 'bg-pink-100 border-pink-200' },
  { name: 'Gray', value: '#f3f4f6', class: 'bg-gray-100 border-gray-200' },
];

export default function NotebooksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterColor, setFilterColor] = useState("all");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  
  const [formData, setFormData] = useState<NotebookFormData>({
    title: "",
    content: "",
    color: "#ffffff",
    isPinned: false,
    isArchived: false,
    tags: [],
  });
  
  const [newTag, setNewTag] = useState("");

  // Fetch notebooks
  const { data: notebooks = [], isLoading, refetch } = useQuery<Notebook[]>({
    queryKey: ["/api/notebooks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notebooks");
      if (!response.ok) throw new Error("Failed to fetch notebooks");
      return response.json();
    },
  });

  // Create notebook mutation
  const createNotebookMutation = useMutation({
    mutationFn: async (data: Omit<NotebookFormData, 'id'>) => {
      const response = await apiRequest("POST", "/api/notebooks", data);
      if (!response.ok) throw new Error("Failed to create notebook");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notebooks"] });
      toast({ title: "Success", description: "Notebook created successfully" });
      resetForm();
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update notebook mutation
  const updateNotebookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NotebookFormData> }) => {
      const response = await apiRequest("PUT", `/api/notebooks/${id}`, data);
      if (!response.ok) throw new Error("Failed to update notebook");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notebooks"] });
      toast({ title: "Success", description: "Notebook updated successfully" });
      setEditingNotebook(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete notebook mutation
  const deleteNotebookMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/notebooks/${id}`);
      if (!response.ok) throw new Error("Failed to delete notebook");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notebooks"] });
      toast({ title: "Success", description: "Notebook deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      color: "#ffffff",
      isPinned: false,
      isArchived: false,
      tags: [],
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    if (editingNotebook) {
      updateNotebookMutation.mutate({ id: editingNotebook.id, data: formData });
    } else {
      createNotebookMutation.mutate(formData);
    }
  };

  const handleEdit = (notebook: Notebook) => {
    setEditingNotebook(notebook);
    setFormData({
      title: notebook.title,
      content: notebook.content,
      color: notebook.color,
      isPinned: notebook.isPinned,
      isArchived: notebook.isArchived,
      tags: notebook.tags,
    });
    setShowCreateDialog(true);
  };

  const handleTogglePin = (notebook: Notebook) => {
    updateNotebookMutation.mutate({
      id: notebook.id,
      data: { isPinned: !notebook.isPinned }
    });
  };

  const handleToggleArchive = (notebook: Notebook) => {
    updateNotebookMutation.mutate({
      id: notebook.id,
      data: { isArchived: !notebook.isArchived }
    });
  };

  const handleDelete = (notebook: Notebook) => {
    if (confirm("Are you sure you want to delete this notebook?")) {
      deleteNotebookMutation.mutate(notebook.id);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getColorClass = (color: string) => {
    const colorConfig = COLORS.find(c => c.value === color);
    return colorConfig?.class || 'bg-white border-gray-200';
  };

  // Filter notebooks
  const filteredNotebooks = notebooks.filter(notebook => {
    if (notebook.isArchived !== showArchived) return false;
    if (showPinnedOnly && !notebook.isPinned) return false;
    if (filterColor !== "all" && notebook.color !== filterColor) return false;
    if (filterTags.length > 0 && !filterTags.some(tag => notebook.tags.includes(tag))) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notebook.title.toLowerCase().includes(query) ||
        notebook.content.toLowerCase().includes(query) ||
        notebook.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Get all unique tags
  const allTags = Array.from(new Set(notebooks.flatMap(n => n.tags)));

  // Sort notebooks (pinned first)
  const sortedNotebooks = filteredNotebooks.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notebooks</h1>
          <p className="text-gray-600">Create and organize your notes with rich formatting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              resetForm();
              setEditingNotebook(null);
              setShowCreateDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Notebook
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notebooks by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-blue-50 border-blue-300" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Color</Label>
              <Select value={filterColor} onValueChange={setFilterColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {COLORS.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${color.class}`}></div>
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pinned"
                checked={showPinnedOnly}
                onCheckedChange={setShowPinnedOnly}
              />
              <Label htmlFor="pinned">Pinned only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="archived">Show archived</Label>
            </div>
            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filterTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (filterTags.includes(tag)) {
                        setFilterTags(filterTags.filter(t => t !== tag));
                      } else {
                        setFilterTags([...filterTags, tag]);
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{notebooks.length}</div>
          <div className="text-sm text-gray-600">Total Notes</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{notebooks.filter(n => n.isPinned).length}</div>
          <div className="text-sm text-gray-600">Pinned</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{notebooks.filter(n => n.isArchived).length}</div>
          <div className="text-sm text-gray-600">Archived</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{allTags.length}</div>
          <div className="text-sm text-gray-600">Tags</div>
        </Card>
      </div>

      {/* Notebooks Grid/List */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        <AnimatePresence>
          {sortedNotebooks.map((notebook, index) => (
            <motion.div
              key={notebook.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className={`${getColorClass(notebook.color)} hover:shadow-lg transition-all duration-200 relative group`}>
                {notebook.isPinned && (
                  <Pin className="absolute top-2 right-2 h-4 w-4 text-gray-600 fill-current" />
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">
                      {highlightText(notebook.title, searchQuery)}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(notebook)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePin(notebook)}>
                          <Pin className="h-4 w-4 mr-2" />
                          {notebook.isPinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleArchive(notebook)}>
                          <Archive className="h-4 w-4 mr-2" />
                          {notebook.isArchived ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(notebook)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-gray-700 line-clamp-4 mb-3 whitespace-pre-wrap">
                    {highlightText(notebook.content, searchQuery)}
                  </div>
                  {notebook.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {notebook.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {highlightText(tag, searchQuery)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(notebook.updatedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {sortedNotebooks.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Edit3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notebooks found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || showFilters ? "Try adjusting your search or filters" : "Create your first notebook to get started"}
          </p>
          {!searchQuery && !showFilters && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Notebook
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingNotebook ? 'Edit Notebook' : 'Create New Notebook'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter notebook title..."
              />
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your notes here..."
                rows={8}
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`w-8 h-8 rounded-full border-2 ${color.class} ${
                      formData.color === color.value ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} variant="outline">Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pinned"
                  checked={formData.isPinned}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPinned: !!checked }))}
                />
                <Label htmlFor="pinned">Pin this note</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="archived"
                  checked={formData.isArchived}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isArchived: !!checked }))}
                />
                <Label htmlFor="archived">Archive</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createNotebookMutation.isPending || updateNotebookMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingNotebook ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
