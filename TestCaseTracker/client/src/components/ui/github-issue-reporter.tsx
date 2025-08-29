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
  Move
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
  category: 'ui' | 'api' | 'performance' | 'security' | 'data' | 'integration';
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<GitHubIssueData>({
    title: '',
    description: '',
    priority: 'medium',
    severity: 'medium',
    category: 'ui',
    projectId: 0,
    moduleId: undefined,
    reproductionSteps: '',
    expectedBehavior: '',
    actualBehavior: '',
    environment: getBrowserInfo(),
    browserInfo: getBrowserInfo(),
    screenshots: [],
    additionalInfo: ''
  });

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
      }
    });

    event.target.value = '';
  };

  // Remove screenshot
  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const formatIssueDescription = () => {
    const selectedProject = projects.find(p => p.id === formData.projectId);
    const selectedModule = modules.find(m => m.id === formData.moduleId);

    return `
## Project Information
- **Project**: ${selectedProject?.name || 'Unknown'}
- **Module**: ${selectedModule?.name || 'Not specified'}
- **Priority**: ${formData.priority}
- **Severity**: ${formData.severity}
- **Category**: ${formData.category}
- **Environment**: ${formData.environment}

## Issue Description
${formData.description}

## Steps to Reproduce
${formData.reproductionSteps}

## Expected Behavior
${formData.expectedBehavior}

## Actual Behavior
${formData.actualBehavior}

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
        description: formData.description,
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
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadPromise = fetch('/api/uploads/bug-attachment', {
          method: 'POST',
          body: formData,
        }).then(res => res.json());
        
        attachmentPromises.push(uploadPromise);
      }

      if (screenRecording) {
        const formData = new FormData();
        formData.append('file', screenRecording);
        
        const uploadPromise = fetch('/api/uploads/bug-attachment', {
          method: 'POST',
          body: formData,
        }).then(res => res.json());
        
        attachmentPromises.push(uploadPromise);
      }

      // Wait for all uploads to complete
      const uploadedAttachments = await Promise.all(attachmentPromises);
      bugPayload.attachments = uploadedAttachments;

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
      const githubResponse = await fetch(`/api/github/create-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          body: formatIssueDescription(),
          labels: [formData.priority, formData.severity, formData.category],
          projectId: formData.projectId,
        }),
      });

      if (githubResponse.ok) {
        const githubResult = await githubResponse.json();

        toast({
          title: "Issue created successfully",
          description: `Bug #${bugResult.bugId} created in system and GitHub issue #${githubResult.issueNumber} created`,
        });
      } else {
        // GitHub creation failed, but system bug was created
        toast({
          title: "Partial success",
          description: `Bug #${bugResult.bugId} created in system, but GitHub issue creation failed`,
          variant: "destructive"
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        severity: 'medium',
        category: 'ui',
        projectId: formData.projectId, // Keep the same project
        moduleId: undefined,
        reproductionSteps: '',
        expectedBehavior: '',
        actualBehavior: '',
        environment: getBrowserInfo(),
        browserInfo: getBrowserInfo(),
        screenshots: [],
        additionalInfo: ''
      });
      setScreenshots([]);
      setScreenRecording(null);
      setIsOpen(false);

    } catch (error) {
      console.error('Error creating issue:', error);
      toast({
        title: "Error creating issue",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="media">Screenshots & Recording</TabsTrigger>
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
                      <label className="text-sm font-medium">Category</label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ui">UI/UX</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="data">Data</SelectItem>
                          <SelectItem value="integration">Integration</SelectItem>
                        </SelectContent>
                      </Select>
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Information</label>
                    <Textarea
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                      placeholder="Any additional context, logs, or information"
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
                        accept="image/*,video/*"
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