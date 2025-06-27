import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface NotebookFormProps {
  notebook?: {
    id: number;
    title: string;
    content: string;
    color: string;
    archived?: boolean;
    isPinned?: boolean;
    isArchived?: boolean;
    createdAt?: string;
    tags?: string[];
  } | null;
  onSuccess: () => void;
}

interface NotebookFormData {
    title: string;
    content: string;
    color: string;
    tags?: string[];
    isArchived?: boolean;
}

function NotebookForm({ notebook, onSuccess }: NotebookFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [archived, setArchived] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when notebook changes
  useEffect(() => {
    if (notebook) {
      setTitle(notebook.title || "");
      setContent(notebook.content || "");
      setColor(notebook.color || "#3b82f6");
      setArchived(notebook.isArchived || notebook.archived || false);
    } else {
      setTitle("");
      setContent("");
      setColor("#3b82f6");
      setArchived(false);
    }
  }, [notebook]);

  // Create notebook mutation
  const createNotebookMutation = useMutation({
    mutationFn: async (data: NotebookFormData) => {
      return await apiRequest("POST", "/api/notebooks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notebooks"] });
      toast({
        title: "Success",
        description: "Notebook created successfully.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create notebook: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update notebook mutation
  const updateNotebookMutation = useMutation({
    mutationFn: async (data: NotebookFormData) => {
      if (!notebook?.id) throw new Error("No notebook ID provided");
      return await apiRequest("PUT", `/api/notebooks/${notebook.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notebooks"] });
      toast({
        title: "Success",
        description: "Notebook updated successfully.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update notebook: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const notebookData = {
      title: title.trim(),
      content: content.trim(),
      color,
      archived,
    };

    if (notebook) {
      updateNotebookMutation.mutate(notebookData);
    } else {
      createNotebookMutation.mutate(notebookData);
    }
  };

  const isLoading = createNotebookMutation.isPending || updateNotebookMutation.isPending;

  return (
    <form onSubmit={handleSubmit}>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notebook title..."
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your notes..."
                rows={6}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-16 h-8 p-0 border-2"
                      style={{ backgroundColor: color }}
                      disabled={isLoading}
                    >
                      <span className="sr-only">Pick a color</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="w-48 h-48">
                      <HexColorPicker 
                        color={color} 
                        onChange={setColor}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="#000000"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsColorPickerOpen(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="archived"
                checked={archived}
                onCheckedChange={(checked) => setArchived(checked as boolean)}
                disabled={isLoading}
              />
              <Label
                htmlFor="archived"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Archive this notebook
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : notebook ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

export { NotebookForm };
export default NotebookForm;