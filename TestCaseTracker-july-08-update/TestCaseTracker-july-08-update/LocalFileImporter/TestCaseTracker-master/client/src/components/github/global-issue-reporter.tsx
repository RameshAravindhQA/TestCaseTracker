
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Camera, 
  Video, 
  Paperclip, 
  Send, 
  Minimize2, 
  Maximize2, 
  X, 
  Settings,
  Github,
  Monitor,
  Folder,
  Link
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface GlobalIssueReporterProps {
  onMinimize?: () => void;
  onClose?: () => void;
  isMinimized?: boolean;
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface GitHubConfig {
  id: number;
  projectId: number;
  repoOwner: string;
  repoName: string;
  isActive: boolean;
}

interface ScreenRecording {
  id: string;
  url: string;
  duration: number;
  size: number;
}

export function GlobalIssueReporter({ 
  onMinimize, 
  onClose, 
  isMinimized = false 
}: GlobalIssueReporterProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueLabels, setIssueLabels] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      return response.json();
    }
  });

  // Get GitHub configs
  const { data: githubConfigs } = useQuery({
    queryKey: ['github', 'configs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/github/configs');
      return response.json();
    }
  });

  // Create GitHub issue mutation
  const createIssueMutation = useMutation({
    mutationFn: async (data: {
      projectId: number;
      title: string;
      description: string;
      labels: string[];
      priority: string;
      attachments: File[];
      screenRecording?: string;
    }) => {
      // First upload attachments
      const uploadedAttachments = [];
      for (const file of data.attachments) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await apiRequest('POST', '/api/uploads/bug-attachment', formData, {
          'Content-Type': 'multipart/form-data'
        });
        const attachment = await uploadResponse.json();
        uploadedAttachments.push(attachment);
      }

      // Create bug in system first
      const bugResponse = await apiRequest('POST', `/api/projects/${data.projectId}/bugs`, {
        title: data.title,
        description: data.description,
        severity: data.priority,
        status: 'Open',
        priority: data.priority,
        attachments: uploadedAttachments,
        tags: data.labels,
        screenshotRequired: !!data.screenRecording
      });
      const bug = await bugResponse.json();

      // Then sync to GitHub
      const githubResponse = await apiRequest('POST', `/api/github/sync/${bug.id}`);
      return githubResponse.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Issue Created',
        description: `GitHub issue created successfully. Issue #${data.issueNumber}`,
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create GitHub issue',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setIssueTitle('');
    setIssueDescription('');
    setIssueLabels([]);
    setPriority('medium');
    setAttachments([]);
    setRecordingUrl(null);
    setSelectedProject(null);
  };

  const startScreenCapture = async () => {
    try {
      setIsCapturing(true);
      
      // Use Web Screen Capture API
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        });

        // Upload to server and get public URL
        const formData = new FormData();
        formData.append('file', blob, `screen-recording-${Date.now()}.webm`);
        
        try {
          const response = await apiRequest('POST', '/api/uploads/screen-recordings', formData);
          const result = await response.json();
          setRecordingUrl(result.url);
          
          toast({
            title: 'Recording Saved',
            description: 'Screen recording saved successfully',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to save screen recording',
            variant: 'destructive',
          });
        }

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsCapturing(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: 'Recording Started',
        description: 'Screen recording in progress...',
      });
    } catch (error) {
      setIsCapturing(false);
      toast({
        title: 'Error',
        description: 'Failed to start screen capture',
        variant: 'destructive',
      });
    }
  };

  const stopScreenCapture = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const takeScreenshot = async () => {
    try {
      // Use Web Screen Capture API for screenshot
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
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
            setAttachments(prev => [...prev, file]);
            
            toast({
              title: 'Screenshot Captured',
              description: 'Screenshot added to attachments',
            });
          }
        }, 'image/png');

        stream.getTracks().forEach(track => track.stop());
      };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to capture screenshot',
        variant: 'destructive',
      });
    }
  };

  const openGreenshotEditor = () => {
    // Open Greenshot if available (Windows only)
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      // Create a custom URL scheme for Greenshot
      const greenshotUrl = `greenshot://capture`;
      
      // Try to open Greenshot
      const link = document.createElement('a');
      link.href = greenshotUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Greenshot Launched',
        description: 'Greenshot editor should open if installed',
      });
    } else {
      toast({
        title: 'Greenshot Unavailable',
        description: 'Greenshot integration requires HTTPS or localhost',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addLabel = (label: string) => {
    if (label.trim() && !issueLabels.includes(label.trim())) {
      setIssueLabels(prev => [...prev, label.trim()]);
    }
  };

  const removeLabel = (label: string) => {
    setIssueLabels(prev => prev.filter(l => l !== label));
  };

  const handleSubmit = () => {
    if (!selectedProject || !issueTitle.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a project and provide an issue title',
        variant: 'destructive',
      });
      return;
    }

    createIssueMutation.mutate({
      projectId: selectedProject,
      title: issueTitle,
      description: issueDescription,
      labels: issueLabels,
      priority,
      attachments,
      screenRecording: recordingUrl || undefined
    });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={onMinimize}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg"
        >
          <Bug className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 w-96 max-h-[90vh] overflow-auto">
        <Card className="shadow-2xl border-2 border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Github className="h-5 w-5" />
                <span>GitHub Issue Reporter</span>
              </CardTitle>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={() => setIsConfigOpen(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onMinimize}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Selection */}
            <div>
              <Label htmlFor="project">Project</Label>
              <Select value={selectedProject?.toString()} onValueChange={(value) => setSelectedProject(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.filter((project: Project) => 
                    githubConfigs?.some((config: GitHubConfig) => 
                      config.projectId === project.id && config.isActive
                    )
                  ).map((project: Project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue Title */}
            <div>
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Brief description of the issue"
              />
            </div>

            {/* Issue Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Detailed description of the issue..."
                rows={4}
              />
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Labels */}
            <div>
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {issueLabels.map((label, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeLabel(label)}>
                    {label} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-1">
                {['bug', 'enhancement', 'documentation', 'urgent'].map((label) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => addLabel(label)}
                    disabled={issueLabels.includes(label)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Screen Capture Actions */}
            <div>
              <Label>Screen Capture</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={takeScreenshot}
                  disabled={isCapturing}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Screenshot
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isRecording ? stopScreenCapture : startScreenCapture}
                  disabled={isCapturing && !isRecording}
                >
                  <Video className="h-4 w-4 mr-2" />
                  {isRecording ? 'Stop Recording' : 'Record Screen'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={openGreenshotEditor}
                  className="col-span-2"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Open Greenshot Editor
                </Button>
              </div>
            </div>

            {/* File Attachments */}
            <div>
              <Label>Attachments</Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span className="truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {recordingUrl && (
              <div className="bg-green-50 p-3 rounded">
                <div className="flex items-center space-x-2">
                  <Video className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Screen recording ready</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRecordingUrl(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={createIssueMutation.isPending || !selectedProject || !issueTitle.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {createIssueMutation.isPending ? 'Creating Issue...' : 'Create GitHub Issue'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Hidden video element for screen recording */}
      <video ref={videoRef} style={{ display: 'none' }} />

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>GitHub Integration Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Configure GitHub integration for your projects in the GitHub settings page.
            </p>
            <Button onClick={() => {
              setIsConfigOpen(false);
              window.open('/github', '_blank');
            }}>
              Open GitHub Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
