import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { MainLayout } from '../../components/layout/main-layout';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash, Star, Archive, Tag, Pin, Calendar, Clock, StickyNote, BookOpen, FileText, Palette, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../../lib/queryClient';

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
}

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
      setCreateDialogOpen(false);
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
      setCreateDialogOpen(false);
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

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Notebooks
              </h1>
              <p className="text-gray-600 mt-1">Create and organize your notes with rich formatting</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Notebook
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                placeholder="Search notebooks..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-6 py-4">
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Color</label>
                    <Select value={filterColor} onValueChange={setFilterColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Colors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Colors</SelectItem>
                        {COLORS.map((color) => (
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {allTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={filterTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (filterTags.includes(tag)) {
                              setFilterTags(filterTags.filter((t) => t !== tag));
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
                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pinned"
                        checked={showPinnedOnly}
                        onCheckedChange={setShowPinnedOnly}
                      />
                      <label htmlFor="pinned" className="text-sm font-medium text-gray-700">Pinned only</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="archived"
                        checked={showArchived}
                        onCheckedChange={setShowArchived}
                      />
                      <label htmlFor="archived" className="text-sm font-medium text-gray-700">Show archived</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notebooks Grid */}
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {sortedNotebooks.map((notebook, index) => (
              <motion.div
                key={notebook.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card 
                  className={`${getColorClass(notebook.color)} hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
                  onClick={() => handleEdit(notebook)}
                >
                  <CardHeader className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {highlightText(notebook.title, searchQuery)}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" forceMount>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(notebook); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePin(notebook); }}>
                          <Pin className="h-4 w-4 mr-2" />
                          {notebook.isPinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleArchive(notebook); }}>
                          <Archive className="h-4 w-4 mr-2" />
                          {notebook.isArchived ? "Unarchive" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); handleDelete(notebook); }}
                          className="text-red-600 focus:bg-red-600 focus:text-white"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="py-2 text-sm text-gray-700 line-clamp-3">
                    {highlightText(notebook.content, searchQuery)}
                  </CardContent>
                  <CardContent className="py-2">
                    {notebook.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {notebook.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {highlightText(tag, searchQuery)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Updated {new Date(notebook.updatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {sortedNotebooks.length === 0 && !isLoading && (
          <div className="px-6 py-4 text-center">
            <StickyNote className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900">No notebooks found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery || showFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Create your first notebook to get started."}
            </p>
            {!searchQuery && !showFilters && (
              <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Notebook
              </Button>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingNotebook ? "Edit Notebook" : "Create New Notebook"}</DialogTitle>
              <DialogDescription>
                {editingNotebook ? "Edit your notebook details." : "Create a new notebook to start writing your notes."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="title" className="text-right text-sm font-medium text-gray-700">
                  Title
                </label>
                <Input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="content" className="text-right text-sm font-medium text-gray-700">
                  Content
                </label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="col-span-3"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="color" className="text-right text-sm font-medium text-gray-700">
                  Color
                </label>
                <div className="col-span-3 flex items-center gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 ${color.class} ${
                        formData.color === color.value ? "border-gray-900" : "border-transparent"
                      } hover:border-gray-500 focus:outline-none`}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="tags" className="text-right text-sm font-medium text-gray-700">
                  Tags
                </label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    type="text"
                    id="tags"
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addTag();
                        e.preventDefault();
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>
              {formData.tags.length > 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-gray-700"></label>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-700"></label>
                <div className="col-span-3 flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pinned"
                      checked={formData.isPinned}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
                    />
                    <label htmlFor="pinned" className="text-sm font-medium text-gray-700">
                      Pin
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="archived"
                      checked={formData.isArchived}
                      onCheckedChange={(checked) => setFormData({ ...formData, isArchived: checked })}
                    />
                    <label htmlFor="archived" className="text-sm font-medium text-gray-700">
                      Archive
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleSubmit}>
                {editingNotebook ? "Update Notebook" : "Create Notebook"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}