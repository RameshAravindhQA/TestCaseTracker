import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Download, 
  MousePointer, 
  Square, 
  Circle, 
  Type, 
  Pencil,
  Undo,
  Redo,
  Palette,
  Bug,
  Send,
  AlertCircle,
  CheckCircle,
  Minimize2,
  Maximize2,
  X,
  Video,
  VideoOff,
  StopCircle,
  Play,
  Github,
  ChevronLeft,
  ChevronRight,
  Move,
  Clipboard,
  Link,
  ExternalLink,
  Settings,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
}

interface Module {
  id: number;
  name: string;
  projectId: number;
  status: string;
}

interface GitHubIssueData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string; // Changed to string to accommodate custom categories
  projectId: number;
  moduleId?: number;
  reproductionSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  environment: string;
  browserInfo: string;
  screenshots: File[];
  screenRecording?: File;
  additionalInfo?: string;
  selectedLabels?: number[]; // Array of label IDs
}

interface CustomLabel {
  id: number;
  name: string;
  color: string;
}

// Interface for Custom Category
interface CustomCategory {
  id: number;
  name: string;
}

// Component for Custom Category Management
function CategoryManagement({
  categories,
  onCategoriesChange,
  selectedCategory,
  onCategorySelect,
}: {
  categories: CustomCategory[];
  onCategoriesChange: (categories: CustomCategory[]) => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}) {
  const { toast } = useToast();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [nextCategoryId, setNextCategoryId] = useState(1);

  // Load categories from local storage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('githubIssueCustomCategories');
    if (savedCategories) {
      const parsedCategories: CustomCategory[] = JSON.parse(savedCategories);
      onCategoriesChange(parsedCategories);
      if (parsedCategories.length > 0) {
        setNextCategoryId(Math.max(...parsedCategories.map(cat => cat.id)) + 1);
      }
    } else {
      // Set default categories if none are found
      const defaultCategories: CustomCategory[] = [
        { id: 1, name: 'UI/UX' },
        { id: 2, name: 'API' },
        { id: 3, name: 'Performance' },
        { id: 4, name: 'Security' },
        { id: 5, name: 'Data' },
        { id: 6, name: 'Integration' },
      ];
      onCategoriesChange(defaultCategories);
      setNextCategoryId(defaultCategories.length + 1);
    }
  }, []);

  // Save categories to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('githubIssueCustomCategories', JSON.stringify(categories));
  }, [categories]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    const newCategory: CustomCategory = { id: nextCategoryId, name: newCategoryName.trim() };
    onCategoriesChange([...categories, newCategory]);
    setNewCategoryName('');
    setNextCategoryId(prev => prev + 1);
    setShowAddCategory(false);
    toast({ title: "Category added successfully" });
  };

  const handleDeleteCategory = (id: number) => {
    const updatedCategories = categories.filter(cat => cat.id !== id);
    onCategoriesChange(updatedCategories);
    // If the deleted category was selected, reset to the first available or empty
    if (selectedCategory.split('-')[0] === 'custom' && parseInt(selectedCategory.split('-')[1]) === id) {
      onCategorySelect(updatedCategories.length > 0 ? `${updatedCategories[0].id}-${updatedCategories[0].name}` : '');
    } else if (selectedCategory === categories.find(cat => cat.id === id)?.name) {
       onCategorySelect(updatedCategories.length > 0 ? `${updatedCategories[0].id}-${updatedCategories[0].name}` : '');
    }
    toast({ title: "Category deleted successfully" });
  };

  const handleSelectCategory = (value: string) => {
    onCategorySelect(value);
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={selectedCategory} onValueChange={handleSelectCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={`custom-${category.id}`} value={`${category.id}-${category.name}`}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-2">
        <Button onClick={() => setShowAddCategory(true)} variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Manage Categories
        </Button>

        {showAddCategory && (
          <div className="mt-3 p-3 border rounded flex items-center gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleAddCategory} size="sm">Add</Button>
            <Button variant="outline" onClick={() => setShowAddCategory(false)} size="sm">Cancel</Button>
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
          <h4 className="text-sm font-medium">Custom Categories:</h4>
          {categories.map((category) => (
            <Card key={category.id} className="p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{category.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}


export function GitHubIssueReporter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenRecording, setScreenRecording] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Label Management State
  const [showLabelManagement, setShowLabelManagement] = useState(false);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [customLabels, setCustomLabels] = useState<CustomLabel[]>([]);
  const [newLabel, setNewLabel] = useState<Omit<CustomLabel, 'id'>>({ name: '', color: '#3b82f6' });
  const [nextLabelId, setNextLabelId] = useState(1);

  // Custom Categories State
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [formData, setFormData] = useState<GitHubIssueData>({
    title: '',
    description: '',
    priority: 'medium',
    severity: 'medium',
    category: 'ui', // Default category
    projectId: 0,
    moduleId: undefined,
    reproductionSteps: '',
    expectedBehavior: '',
    actualBehavior: '',
    environment: getBrowserInfo(),
    browserInfo: getBrowserInfo(),
    screenshots: [],
    additionalInfo: '',
    selectedLabels: []
  });

  const [pastedLinks, setPastedLinks] = useState<string[]>([]);
  const [clipboardText, setClipboardText] = useState('');

  // Fetch projects
  const { data: projectsData } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: isOpen,
  });

  // Fetch modules for selected project
  const { data: modulesData } = useQuery<Module[]>({
    queryKey: [`/api/projects/${formData.projectId}/modules`],
    enabled: isOpen && formData.projectId > 0,
  });

  // Load custom labels from local storage on mount
  useEffect(() => {
    const savedLabels = localStorage.getItem('githubIssueCustomLabels');
    if (savedLabels) {
      const parsedLabels: CustomLabel[] = JSON.parse(savedLabels);
      setCustomLabels(parsedLabels);
      // Find the highest ID to ensure new labels get unique IDs
      if (parsedLabels.length > 0) {
        setNextLabelId(Math.max(...parsedLabels.map(label => label.id)) + 1);
      }
    }
  }, []);

  // Save custom labels to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('githubIssueCustomLabels', JSON.stringify(customLabels));
  }, [customLabels]);

  React.useEffect(() => {
    if (projectsData) {
      setProjects(projectsData);
      if (projectsData.length > 0 && formData.projectId === 0) {
        setFormData(prev => ({ ...prev, projectId: projectsData[0].id }));
      }
    }
  }, [projectsData, formData.projectId]);

  React.useEffect(() => {
    if (modulesData) {
      setModules(modulesData);
      // Reset module selection when project changes
      setFormData(prev => ({ ...prev, moduleId: undefined }));
    }
  }, [modulesData]);

  // Handle project change
  const handleProjectChange = (projectId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      projectId: parseInt(projectId),
      moduleId: undefined // Reset module when project changes
    }));
  };

  function getBrowserInfo(): string {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    let os = "Unknown";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";

    return `${browser} on ${os} - Screen: ${screen.width}x${screen.height}`;
  }

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggableRef.current) return;

    const rect = draggableRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Constrain to viewport with proper boundaries
    const element = draggableRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Screenshot capture
  const takeScreenshot = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' }
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `screenshot-${Date.now()}.png`, { 
                type: 'image/png' 
              });
              setScreenshots(prev => [...prev, file]);
              toast({
                title: "Screenshot Captured",
                description: "Screenshot added successfully",
              });
            }
          }, 'image/png');

          stream.getTracks().forEach(track => track.stop());
        });
      } else {
        toast({
          title: "Screenshot Feature",
          description: "Please use browser's built-in screenshot tools and upload manually",
        });
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      toast({
        title: "Screenshot Failed",
        description: "Unable to capture screenshot. Please upload manually.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Screen recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { 
          type: 'video/webm' 
        });
        setScreenRecording(file);
        setRecordingTime(0);
        toast({
          title: "Recording Completed",
          description: "Screen recording saved successfully",
        });
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Automatically stop recording after 5 minutes (300 seconds)
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          stopRecording();
        }
      }, 300000);

    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to start screen recording",
        variant: "destructive",
      });
    }
  }, [isRecording, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        setScreenshots(prev => [...prev, file]);
      } else if (file.type.startsWith('video/')) {
        setScreenRecording(file);
      } else {
        setAttachments(prev => [...prev, file]);
      }
    });

    if (event.target) {
      event.target.value = ''; // Clear the input
    }
  };

  // Remove screenshot
  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatIssueDescription = () => {
    const selectedProject = projects.find(p => p.id === formData.projectId);
    const selectedModule = modules.find(m => m.id === formData.moduleId);

    // Extract custom category name
    const categoryParts = formData.category.split('-');
    const categoryName = categoryParts.length > 1 ? categoryParts.slice(1).join('-') : formData.category;


    let descriptionContent = formData.description;

    if (clipboardText) {
      descriptionContent += (descriptionContent ? '\n\n' : '') + '**Clipboard Content:**\n```\n' + clipboardText + '\n```';
    }

    if (pastedLinks.length > 0) {
      descriptionContent += (descriptionContent ? '\n\n' : '') + '**Reference Links:**\n' + 
        pastedLinks.map(link => `- ${link}`).join('\n');
    }

    // Add screenshots as GitHub-compatible image references
    let screenshotSection = '';
    if (screenshots.length > 0) {
      screenshotSection = '\n\n## Screenshots\n';
      screenshots.forEach((screenshot, index) => {
        // For GitHub issues, we'll reference uploaded attachments
        screenshotSection += `\n### Screenshot ${index + 1}\n`;
        screenshotSection += `<img width="960" height="540" alt="Screenshot ${index + 1}" src="attachment://screenshot-${index + 1}.png" />\n`;
      });
    }

    if (screenRecording) {
      screenshotSection += '\n\n## Screen Recording\n';
      screenshotSection += 'Screen recording attached: `recording.webm`\n';
    }

    return `
## Project Information
- **Project**: ${selectedProject?.name || 'Unknown'}
- **Module**: ${selectedModule?.name || 'Not specified'}
- **Priority**: ${formData.priority}
- **Severity**: ${formData.severity}
- **Category**: ${categoryName} 
- **Environment**: ${formData.environment}

## Issue Description
${descriptionContent}

## Steps to Reproduce
${formData.reproductionSteps}

## Expected Behavior
${formData.expectedBehavior}

## Actual Behavior
${formData.actualBehavior}

${screenshotSection}

## Browser Information
${formData.browserInfo}

${formData.additionalInfo ? `## Additional Information\n${formData.additionalInfo}` : ''}

---
*This issue was automatically created from the GitHub Issue Reporter*
`.trim();
  };

  const submitIssue = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a title for the issue",
        variant: "destructive"
      });
      return;
    }

    if (formData.projectId === 0) {
      toast({
        title: "Missing project",
        description: "Please select a project",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create bug in the system first
      const bugPayload = {
        title: formData.title,
        severity: formData.severity === 'low' ? 'Trivial' : 
                 formData.severity === 'medium' ? 'Minor' : 
                 formData.severity === 'high' ? 'Major' : 'Critical',
        priority: formData.priority === 'low' ? 'Low' : 
                 formData.priority === 'medium' ? 'Medium' : 
                 formData.priority === 'high' ? 'High' : 'Critical',
        status: 'Open',
        stepsToReproduce: formData.reproductionSteps,
        expectedResult: formData.expectedBehavior,
        actualResult: formData.actualBehavior,
        environment: formData.environment,
        comments: formData.additionalInfo || '',
        preConditions: 'Issue reported via GitHub Issue Reporter',
        attachments: [],
        moduleId: formData.moduleId || null
      };

      // Handle file uploads separately first if needed
      const attachmentPromises = [];

      for (const file of screenshots) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadPromise = fetch('/api/uploads/bug-attachment', {
          method: 'POST',
          body: uploadFormData,
        }).then(res => res.json());

        attachmentPromises.push(uploadPromise);
      }

      if (screenRecording) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', screenRecording);

        const uploadPromise = fetch('/api/uploads/bug-attachment', {
          method: 'POST',
          body: uploadFormData,
        }).then(res => res.json());

        attachmentPromises.push(uploadPromise);
      }

      // Handle other attachments
      for (const file of attachments) {
        // Avoid re-uploading if it's a screenshot or recording already handled
        if (!screenshots.includes(file) && file !== screenRecording) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);

          const uploadPromise = fetch('/api/uploads/bug-attachment', {
            method: 'POST',
            body: uploadFormData,
          }).then(res => res.json());

          attachmentPromises.push(uploadPromise);
        }
      }

      // Wait for all uploads to complete
      const uploadedAttachments = await Promise.all(attachmentPromises);
      bugPayload.attachments = uploadedAttachments.map(uploadResult => uploadResult.url); // Assuming the API returns the URL

      // Create bug in system
      const bugResponse = await fetch(`/api/projects/${formData.projectId}/bugs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bugPayload),
      });

      if (!bugResponse.ok) {
        throw new Error('Failed to create bug in system');
      }

      const bugResult = await bugResponse.json();
      const bugId = bugResult.id;

      // Step 2: Create GitHub issue
      // Prepare labels including category and custom labels
      const categoryParts = formData.category.split('-');
      const categoryName = categoryParts.length > 1 ? categoryParts[1] : formData.category;

      const allLabels = [
        `category: ${categoryName}`, // Add category as label
        `severity: ${formData.severity}`,
        `priority: ${formData.priority}`,
        ...(formData.selectedLabels?.map(labelId => customLabels.find(l => l.id === labelId)?.name).filter(Boolean) || [])
      ];

      const githubResponse = await fetch(`/api/github/create-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          body: formatIssueDescription(),
          labels: allLabels,
          projectId: formData.projectId,
        }),
      });

      if (githubResponse.ok) {
        const githubResult = await githubResponse.json();

        toast({
          title: "Issue created successfully",
          description: `Bug #${bugResult.id} created in system and GitHub issue #${githubResult.issueNumber} created`,
        });
      } else {
        // GitHub creation failed, but system bug was created
        toast({
          title: "Partial success",
          description: `Bug #${bugResult.id} created in system, but GitHub issue creation failed`,
          variant: "destructive"
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        severity: 'medium',
        category: 'ui', // Reset to default
        projectId: formData.projectId, // Keep the same project
        moduleId: undefined,
        reproductionSteps: '',
        expectedBehavior: '',
        actualBehavior: '',
        environment: getBrowserInfo(),
        browserInfo: getBrowserInfo(),
        screenshots: [],
        additionalInfo: '',
        selectedLabels: []
      });
      setScreenshots([]);
      setScreenRecording(null);
      setAttachments([]);
      setPastedLinks([]);
      setClipboardText('');
      setCustomLabels([]); // Clear labels after submission
      setNextLabelId(1);
      setIsOpen(false);

    } catch (error) {
      console.error('Error creating issue:', error);
      toast({
        title: "Error creating issue",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Clipboard handlers
  const handlePasteFromClipboard = async () => {
    try {
      // Try to read text from clipboard
      const text = await navigator.clipboard.readText();
      if (text) {
        // Check if it's a URL
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex);

        if (urls) {
          setPastedLinks(prev => [...prev, ...urls.filter(url => !prev.includes(url))]);
          toast({
            title: 'Success',
            description: `${urls.length} link(s) added from clipboard`,
          });
        } else {
          setClipboardText(text);
          toast({
            title: 'Success',
            description: 'Text content pasted from clipboard',
          });
        }
      }

      // Try to read images from clipboard
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType('image/png');
          const file = new File([blob], `clipboard-image-${Date.now()}.png`, { type: 'image/png' });
          setScreenshots(prev => [...prev, file]); // Add to screenshots
          toast({
            title: 'Success',
            description: 'Image pasted from clipboard',
          });
        }
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      toast({
        title: 'Error',
        description: 'Failed to access clipboard. Please ensure you have granted clipboard permissions.',
        variant: 'destructive',
      });
    }
  };

  const removePastedLink = (linkToRemove: string) => {
    setPastedLinks(prev => prev.filter(link => link !== linkToRemove));
  };

  const addLinkToDescription = (link: string) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description + (prev.description ? '\n\n' : '') + `Reference: ${link}`
    }));
  };

  // Label Management Handlers
  const handleAddLabel = () => {
    if (!newLabel.name.trim()) {
      toast({ title: "Label name is required", variant: "destructive" });
      return;
    }
    const labelWithId = { ...newLabel, id: nextLabelId };
    setCustomLabels(prev => [...prev, labelWithId]);
    setNewLabel({ name: '', color: '#3b82f6' });
    setNextLabelId(prev => prev + 1);
    setShowAddLabel(false);
    toast({ title: "Label added successfully" });
  };

  const handleDeleteLabel = (id: number) => {
    setCustomLabels(prev => prev.filter(label => label.id !== id));
    setFormData(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels?.filter(labelId => labelId !== id)
    }));
    toast({ title: "Label deleted successfully" });
  };

  const handleAddSelectedLabel = (labelId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedLabels: [...(prev.selectedLabels || []), labelId]
    }));
  };

  const handleRemoveLabel = (labelId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels?.filter(id => id !== labelId)
    }));
  };

  return (
    <>
      {/* Draggable Container */}
      <motion.div
        ref={draggableRef}
        className="fixed z-50 select-none"
        style={{
          left: position.x,
          top: position.y,
          right: isHidden ? 0 : 'auto',
          bottom: isHidden ? '50%' : 'auto',
          transform: isHidden ? 'translateY(50%)' : 'none'
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Hidden State - Side Arrow */}
        {isHidden && (
          <div className="bg-red-500 hover:bg-red-600 rounded-l-lg p-2 shadow-lg cursor-pointer transition-colors">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHidden(false)}
              className="text-white hover:text-white p-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Visible State - Draggable Button */}
        {!isHidden && (
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsOpen(true)}
              className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-200"
              size="sm"
            >
              <Bug className="h-5 w-5 text-white" />
            </Button>

            {/* Controls */}
            <div className="flex flex-col space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onMouseDown={handleMouseDown}
                className="h-6 w-6 p-0 bg-gray-200 hover:bg-gray-300 rounded cursor-move"
                title="Drag to move"
              >
                <Move className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHidden(true)}
                className="h-6 w-6 p-0 bg-gray-200 hover:bg-gray-300 rounded"
                title="Hide to side"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Issue Reporter Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Issue Reporter
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Project and Module Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select 
                    value={formData.projectId.toString()} 
                    onValueChange={handleProjectChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="module">Module</Label>
                  <Select 
                    value={formData.moduleId?.toString() || ""} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      moduleId: value ? parseInt(value) : undefined 
                    }))}
                    disabled={!formData.projectId || modules.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.projectId ? "Select a project first" :
                        modules.length === 0 ? "No modules available" :
                        "Select module (optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="media">Screenshots & Recording</TabsTrigger>
                  <TabsTrigger value="upload">Upload & Clipboard</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <CategoryManagement
                        categories={customCategories}
                        onCategoriesChange={setCustomCategories}
                        selectedCategory={formData.category}
                        onCategorySelect={(category) => setFormData(prev => ({ ...prev, category }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Issue Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the issue"
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reproduction Steps *</label>
                    <Textarea
                      value={formData.reproductionSteps}
                      onChange={(e) => setFormData(prev => ({ ...prev, reproductionSteps: e.target.value }))}
                      placeholder="1. Go to... 2. Click on... 3. Observe..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expected Behavior</label>
                      <Textarea
                        value={formData.expectedBehavior}
                        onChange={(e) => setFormData(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                        placeholder="What should happen?"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Actual Behavior</label>
                      <Textarea
                        value={formData.actualBehavior}
                        onChange={(e) => setFormData(prev => ({ ...prev, actualBehavior: e.target.value }))}
                        placeholder="What actually happens?"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Environment</label>
                    <Input
                      value={formData.environment}
                      onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                      placeholder="Browser, OS, screen resolution"
                    />
                  </div>

                  {/* Labels Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Labels</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLabelManagement(!showLabelManagement)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage Labels
                      </Button>
                    </div>

                    {/* Label Management Panel */}
                    {showLabelManagement && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Custom Labels</h4>
                              <Button onClick={() => setShowAddLabel(true)} size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Label
                              </Button>
                            </div>

                            {/* Existing Labels */}
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {customLabels.map((label) => (
                                <div key={label.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded"
                                      style={{ backgroundColor: label.color }}
                                    />
                                    <span className="text-sm">{label.name}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLabel(label.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>

                            {/* Add Label Form */}
                            {showAddLabel && (
                              <div className="space-y-3 border-t pt-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Label name"
                                    value={newLabel.name}
                                    onChange={(e) => setNewLabel(prev => ({ ...prev, name: e.target.value }))}
                                  />
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="color"
                                      value={newLabel.color}
                                      onChange={(e) => setNewLabel(prev => ({ ...prev, color: e.target.value }))}
                                      className="w-12 h-8"
                                    />
                                    <Input
                                      value={newLabel.color}
                                      onChange={(e) => setNewLabel(prev => ({ ...prev, color: e.target.value }))}
                                      className="font-mono text-xs"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                      onClick={() => setNewLabel(prev => ({ ...prev, color }))}
                                    />
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={handleAddLabel} size="sm">Save</Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowAddLabel(false);
                                      setNewLabel({ name: '', color: '#3b82f6' });
                                    }}
                                    size="sm"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Selected Labels Display */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedLabels?.map((labelId) => {
                          const label = customLabels.find(l => l.id === labelId);
                          if (!label) return null;
                          return (
                            <Badge
                              key={labelId}
                              variant="secondary"
                              className="flex items-center gap-1"
                              style={{ backgroundColor: label.color + '20', borderColor: label.color, color: label.color }}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: label.color }}
                              />
                              {label.name}
                              <button
                                onClick={() => handleRemoveLabel(labelId)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>

                      {/* Available Labels */}
                      {customLabels.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Available labels:</p>
                          <div className="flex flex-wrap gap-1">
                            {customLabels
                              .filter(label => !formData.selectedLabels?.includes(label.id))
                              .map((label) => (
                                <button
                                  key={label.id}
                                  onClick={() => handleAddSelectedLabel(label.id)}
                                  className="text-xs px-2 py-1 rounded border hover:bg-gray-50 flex items-center gap-1"
                                  style={{ borderColor: label.color + '40' }}
                                >
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: label.color }}
                                  />
                                  {label.name}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Information</label>
                    <Textarea
                      id="additionalInfo"
                      value={formData.additionalInfo || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                      placeholder="Any additional information, logs, or context that might be helpful"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4">
                  <div className="flex gap-3">
                    <Button onClick={takeScreenshot} variant="outline" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Take Screenshot
                    </Button>

                    {!isRecording ? (
                      <Button onClick={startRecording} variant="outline" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Stop Recording ({formatTime(recordingTime)})
                      </Button>
                    )}

                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Files
                      </Button>
                    </div>
                  </div>

                  {screenshots.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Screenshots ({screenshots.length})</label>
                      <div className="grid grid-cols-4 gap-2">
                        {screenshots.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Screenshot ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeScreenshot(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {screenRecording && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Screen Recording</label>
                      <div className="relative">
                        <video
                          src={URL.createObjectURL(screenRecording)}
                          controls
                          className="w-full max-h-60 rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setScreenRecording(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Upload Files</Label>
                    <Input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="mt-2"
                    />
                  </div>

                  {/* Clipboard Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Clipboard Content</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handlePasteFromClipboard}
                        className="flex items-center gap-2"
                      >
                        <Clipboard className="h-4 w-4" />
                        Paste from Clipboard
                      </Button>
                    </div>

                    {/* Pasted Links */}
                    {pastedLinks.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <Label className="text-sm text-blue-600">Pasted Links:</Label>
                        {pastedLinks.map((link, index) => (
                          <Card key={index} className="p-2 bg-blue-50 border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <Link className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-blue-700 truncate">{link}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(link, '_blank')}
                                  className="h-6 w-6 p-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addLinkToDescription(link)}
                                  className="h-6 text-xs px-2"
                                >
                                  Add to Description
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removePastedLink(link)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Clipboard Text */}
                    {clipboardText && (
                      <div className="mb-4">
                        <Label className="text-sm text-green-600">Pasted Text Content:</Label>
                        <Card className="p-2 bg-green-50 border-green-200">
                          <div className="flex items-start justify-between">
                            <pre className="text-sm text-green-700 whitespace-pre-wrap overflow-auto max-h-32 flex-1">
                              {clipboardText.length > 200 ? `${clipboardText.substring(0, 200)}...` : clipboardText}
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setClipboardText('')}
                              className="h-6 w-6 p-0 ml-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files:</Label>
                      {attachments.map((file, index) => (
                        <Card key={index} className="p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeAttachment(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitIssue}
                  disabled={isSubmitting || !formData.title || !formData.description}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Github className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Creating Issue...' : 'Create GitHub Issue'}
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}