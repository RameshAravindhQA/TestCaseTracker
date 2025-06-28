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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mic, 
  MicOff, 
  Upload, 
  File, 
  Image, 
  X, 
  Plus,
  CheckSquare,
  Square,
  FileText,
  Camera,
  Paperclip,
  Tag,
  Search,
  Palette
} from "lucide-react";

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
    attachments?: any[];
    checklistItems?: any[];
    audioNotes?: any[];
  } | null;
  onSuccess: () => void;
}

interface NotebookFormData {
  title: string;
  content: string;
  color: string;
  tags?: string[];
  isArchived?: boolean;
  attachments?: any[];
  checklistItems?: any[];
  audioNotes?: any[];
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface AudioNote {
  id: string;
  name: string;
  duration: number;
  url: string;
  transcript?: string;
}

function NotebookForm({ notebook, onSuccess }: NotebookFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [archived, setArchived] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [audioNotes, setAudioNotes] = useState<AudioNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const tagColors = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#F97316", // Orange
    "#6B7280", // Gray
  ];

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when notebook changes
  useEffect(() => {
    if (notebook) {
      setTitle(notebook.title || "");
      setContent(notebook.content || "");
      setColor(notebook.color || "#3b82f6");
      setArchived(notebook.isArchived || notebook.archived || false);
      setTags(notebook.tags || []);
      setAttachments(notebook.attachments || []);
      setChecklistItems(notebook.checklistItems || []);
      setAudioNotes(notebook.audioNotes || []);
    } else {
      setTitle("");
      setContent("");
      setColor("#3b82f6");
      setArchived(false);
      setTags([]);
      setAttachments([]);
      setChecklistItems([]);
      setAudioNotes([]);
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
      tags,
      attachments,
      checklistItems,
      audioNotes,
    };

    if (notebook) {
      updateNotebookMutation.mutate(notebookData);
    } else {
      createNotebookMutation.mutate(notebookData);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const attachment: Attachment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file)
        };
        setAttachments(prev => [...prev, attachment]);
      });
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.some(tag => tag.name === newTag.trim())) {
      setTags([...tags, { name: newTag.trim(), color: newTagColor }]);
      setNewTag("");
      setNewTagColor("#3B82F6");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const item: ChecklistItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: newChecklistItem.trim(),
        completed: false
      };
      setChecklistItems(prev => [...prev, item]);
      setNewChecklistItem("");
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const audioNote: AudioNote = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: `Recording ${audioNotes.length + 1}`,
          duration: 0,
          url: URL.createObjectURL(blob)
        };
        setAudioNotes(prev => [...prev, audioNote]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const removeAudioNote = (id: string) => {
    setAudioNotes(prev => prev.filter(note => note.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isLoading = createNotebookMutation.isPending || updateNotebookMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 py-4">
        {/* Title */}
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notebook title..."
            disabled={isLoading}
            className="text-lg font-semibold"
          />
        </div>

        {/* Tags */}
        <div className="grid gap-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-1"
                style={{ backgroundColor: typeof tag === 'object' ? tag.color + '20' : undefined, borderColor: typeof tag === 'object' ? tag.color : undefined }}
              >
                <Tag className="h-3 w-3" />
                {typeof tag === 'object' ? tag.name : tag}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              disabled={isLoading}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="px-3">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: newTagColor }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <Label>Tag Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {tagColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${newTagColor === color ? 'border-black' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-full h-8"
                  />
                </div>
              </PopoverContent>
            </Popover>
            <Button type="button" variant="outline" onClick={addTag} disabled={!newTag.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your notes... You can add rich content using the tools below."
            rows={8}
            disabled={isLoading}
            className="min-h-[200px]"
          />
        </div>

        {/* Checklist */}
        <div className="grid gap-2">
          <Label>Checklist</Label>
          <div className="space-y-2">
            {checklistItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleChecklistItem(item.id)}
                  className="p-1 h-auto"
                >
                  {item.completed ? (
                    <CheckSquare className="h-4 w-4 text-green-500" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
                <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                  {item.text}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChecklistItem(item.id)}
                  className="p-1 h-auto text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              placeholder="Add checklist item..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
              disabled={isLoading}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addChecklistItem} 
              disabled={!newChecklistItem.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File Attachments */}
        <div className="grid gap-2">
          <Label>Attachments</Label>
          <div className="space-y-2">
            {attachments.map(attachment => (
              <Card key={attachment.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {attachment.type.startsWith('image/') ? (
                        <Image className="h-4 w-4" />
                      ) : (
                        <File className="h-4 w-4" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="flex items-center gap-2"
            >
              <Paperclip className="h-4 w-4" />
              Attach Files
            </Button>
          </div>
        </div>

        {/* Audio Notes */}
        <div className="grid gap-2">
          <Label>Audio Notes</Label>
          <div className="space-y-2">
            {audioNotes.map(note => (
              <Card key={note.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">{note.name}</p>
                        <audio controls className="mt-1" style={{ width: '200px', height: '30px' }}>
                          <source src={note.url} type="audio/webm" />
                        </audio>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAudioNote(note.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 ${isRecording ? 'text-red-500' : ''}`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Stop Recording' : 'Record Audio'}
            </Button>
          </div>
        </div>

        {/* Color */}
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

        {/* Archive */}
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