import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Bug, 
  Camera, 
  Minimize2, 
  Maximize2, 
  X, 
  Upload, 
  Settings,
  Github,
  Send,
  Loader2,
  ImageIcon,
  Trash2,
  Video,
  Square,
  Pause,
  Play
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Screenshot {
  id: string;
  dataUrl: string;
  name: string;
}

interface GlobalIssueReporterProps {
  onClose?: () => void;
}

interface ScreenRecording {
  id: string;
  name: string;
  url: string;
  duration: number;
  size: number;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
}

export function GlobalIssueReporter({ onClose }: GlobalIssueReporterProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    severity: 'Medium',
    priority: 'Medium',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: ''
  });
  const [settings, setSettings] = useState({
    githubToken: localStorage.getItem('github_token') || '',
    autoCapture: localStorage.getItem('auto_capture') === 'true',
    defaultProject: localStorage.getItem('default_project') || ''
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [screenRecordings, setScreenRecordings] = useState<ScreenRecording[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

  // Screenshot capture functionality
  const captureScreenshot = useCallback(async () => {
    try {
      // Request screen capture
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

        const dataUrl = canvas.toDataURL('image/png');
        const screenshot: Screenshot = {
          id: Date.now().toString(),
          dataUrl,
          name: `Screenshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`
        };

        setScreenshots(prev => [...prev, screenshot]);

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());

        toast({
          title: "Screenshot Captured",
          description: "Screenshot added to the issue report"
        });
      });
    } catch (error) {
      toast({
        title: "Screenshot Failed",
        description: "Could not capture screenshot. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const startScreenRecording = async () => {
    try {
      console.log('Starting screen recording...');
      setIsRecording(true);
      setRecordingError(null);
      setRecordedBlob(null);
      setRecordingTime(0); // Reset timer

      // Check if screen recording is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen recording is not supported in this browser');
      }

      // Request screen capture with fallback options
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            mediaSource: 'screen' as any,
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
      } catch (permissionError) {
        console.error('Screen capture permission denied:', permissionError);
        throw new Error('Screen recording permission denied. Please allow screen sharing and try again.');
      }

      console.log('Stream acquired successfully:', stream);
      setStream(stream);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          console.log('Recording time updated:', newTime);
          return newTime;
        });
      }, 1000);

      // Check MediaRecorder support with fallback MIME types
      const supportedTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus', 
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
      ];

      let mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) {
        mimeType = 'video/webm'; // Fallback
      }

      console.log('Using MIME type:', mimeType);

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        console.log('Recording stopped, creating blob from', chunks.length, 'chunks');
        const blob = new Blob(chunks, { type: mimeType });
        console.log('Created blob:', blob.size, 'bytes');
        setRecordedBlob(blob);
        setIsRecording(false);
        setIsPaused(false);

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Clean up stream
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
        setStream(null);

        // Automatically upload the recording
        try {
          await uploadScreenRecording(blob);
        } catch (uploadError) {
          console.error('Failed to upload recording:', uploadError);
        }

        toast({
          title: "Recording Complete",
          description: `Screen recording saved (${(blob.size / 1024 / 1024).toFixed(1)} MB)`,
        });
      };

      recorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        setRecordingError('Recording failed due to an error');
        setIsRecording(false);

        // Stop timer on error
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Handle stream ending (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('User stopped screen sharing');
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      });

      recorder.start(1000); // Record in 1-second chunks
      setMediaRecorder(recorder);

      console.log('Recording started successfully');

      toast({
        title: "Recording Started",
        description: "Screen recording is now active. Click 'Stop Recording' when finished.",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording. Please check permissions.';
      setRecordingError(errorMessage);
      setIsRecording(false);

      // Stop timer on error
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast({
        title: "Recording Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const stopScreenRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }, [mediaRecorder]);

  const pauseScreenRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      console.log('Recording paused at:', recordingTime);
    }
  }, [mediaRecorder, recordingTime]);

  const resumeScreenRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          console.log('Recording time resumed:', newTime);
          return newTime;
        });
      }, 1000);
      console.log('Recording resumed from:', recordingTime);
    }
  }, [mediaRecorder, recordingTime]);

  const uploadScreenRecording = async (blob: Blob) => {
    try {
      const formData = new FormData();
      const fileName = `screen-recording-${Date.now()}.webm`;
      formData.append('file', blob, fileName);
      formData.append('type', 'bug-attachment'); // Use bug-attachment type for consistency

      console.log('Uploading screen recording:', fileName, 'size:', blob.size);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Upload response:', data);

        // Create attachment object
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          name: fileName,
          url: data.url,
          size: blob.size,
        };

        // Add to attachments list (which gets included in bug report)
        setAttachments(prev => [...prev, newAttachment]);

        // Also add to screen recordings for display
        const newRecording: ScreenRecording = {
          id: Date.now().toString(),
          name: fileName,
          url: data.url,
          duration: recordingTime,
          size: blob.size,
        };

        setScreenRecordings(prev => [...prev, newRecording]);

        toast({
          title: "Recording Uploaded",
          description: `Screen recording saved successfully. Duration: ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
        });
      } else {
        const errorData = await response.text();
        console.error('Upload failed:', response.status, errorData);
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error uploading screen recording:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload screen recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'bug-attachment'); // Adjust type as needed

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const newAttachment: Attachment = {
            id: Date.now().toString() + index,
            name: file.name,
            url: data.url,
            size: file.size,
          };
          return newAttachment;
        } else {
          throw new Error(`Upload failed for ${file.name}`);
        }
      });

      const newAttachments = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...newAttachments]);

      toast({
        title: "Files Uploaded",
        description: `${files.length} file(s) uploaded successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current && fileInputRef.current.files) {
      handleFileUpload(fileInputRef.current.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Create GitHub issue mutation
  const createIssueMutation = useMutation({
    mutationFn: async () => {
      if (!formData.projectId || !formData.title || !settings.githubToken) {
        throw new Error('Please fill in all required fields and configure GitHub token');
      }

      // Upload screenshots first
      const uploadedScreenshots = [];
      for (const screenshot of screenshots) {
        const formDataUpload = new FormData();

        // Convert data URL to blob
        const response = await fetch(screenshot.dataUrl);
        const blob = await response.blob();

        formDataUpload.append('file', blob, screenshot.name);
        formDataUpload.append('type', 'bug-attachment');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          uploadedScreenshots.push(uploadResult.url);
        }
      }

      // Create bug with attachments
      const bugData = {
        ...formData,
        projectId: parseInt(formData.projectId),
        attachments: uploadedScreenshots,
        environment: 'Global Issue Reporter',
        reportedById: 1 // Will be updated by backend with actual user
      };

      const bugResponse = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bugData)
      });

      if (!bugResponse.ok) {
        throw new Error('Failed to create bug');
      }

      const bug = await bugResponse.json();

      // Create GitHub issue
      const githubResponse = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bugId: bug.id })
      });

      if (!githubResponse.ok) {
        throw new Error('Failed to create GitHub issue');
      }

      return await githubResponse.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Issue Created Successfully",
        description: `GitHub issue #${data.githubIssueNumber} has been created`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(data.githubUrl, '_blank')}
          >
            View Issue
          </Button>
        ),
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        projectId: settings.defaultProject,
        severity: 'Medium',
        priority: 'Medium',
        stepsToReproduce: '',
        expectedResult: '',
        actualResult: ''
      });
      setScreenshots([]);
      setAttachments([]);
      setScreenRecordings([]);

      queryClient.invalidateQueries({ queryKey: ['/api/bugs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Issue",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const saveSettings = () => {
    localStorage.setItem('github_token', settings.githubToken);
    localStorage.setItem('auto_capture', settings.autoCapture.toString());
    localStorage.setItem('default_project', settings.defaultProject);
    setShowSettings(false);
    toast({
      title: "Settings Saved",
      description: "Your preferences have been saved"
    });
  };

  const removeScreenshot = (id: string) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
  };

  // Cleanup effect for recording
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [mediaRecorder]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [recordingTimer]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full h-12 w-12 bg-red-600 hover:bg-red-700 shadow-lg"
        >
          <Bug className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden">
        <Card className="shadow-2xl border-2 border-red-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Bug className="h-5 w-5" />
                Issue Reporter
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={captureScreenshot}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Screenshot
              </Button>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
                  {/* Screen Recording Controls */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <Label className="text-sm font-medium mb-3 block">Screen Recording</Label>
                    <div className="flex items-center gap-2 mb-3">
                      {!isRecording ? (
                        <Button
                          onClick={startScreenRecording}
                          disabled={isRecording}
                          className="w-full"
                          variant={isRecording ? "destructive" : "default"}
                        >
                          {isRecording ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Recording...
                            </>
                          ) : (
                            <>
                              <Video className="mr-2 h-4 w-4" />
                              Start Recording
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={stopScreenRecording}
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Square className="h-4 w-4" />
                            Stop
                          </Button>

                          {!isPaused ? (
                            <Button
                              type="button"
                              onClick={pauseScreenRecording}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Pause className="h-4 w-4" />
                              Pause
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={resumeScreenRecording}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Play className="h-4 w-4" />
                              Resume
                            </Button>
                          )}

                          <Badge variant={isPaused ? "secondary" : "destructive"} className="ml-2">
                            {isPaused ? "PAUSED" : "RECORDING"} {formatTime(recordingTime)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {recordingError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {recordingError}
                      </div>
                    )}

                    {isRecording && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                        Recording in progress... Click "Stop Recording" when finished.
                      </div>
                    )}

                    {screenRecordings.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Recorded Videos:</Label>
                        {screenRecordings.map((recording) => (
                          <div key={recording.id} className="flex items-center justify-between p-2 bg-background rounded border">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">{recording.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {formatTime(recording.duration)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(recording.url, '_blank')}
                              >
                                View
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setScreenRecordings(prev => prev.filter(r => r.id !== recording.id));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="title">Issue Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of the issue"
                      className="mt-1"
                    />
                  </div>

            <Textarea
              placeholder="Description *"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Steps to reproduce"
              value={formData.stepsToReproduce}
              onChange={(e) => setFormData(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
              rows={2}
            />

            <Textarea
              placeholder="Expected result"
              value={formData.expectedResult}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedResult: e.target.value }))}
              rows={2}
            />

            <Textarea
              placeholder="Actual result"
              value={formData.actualResult}
              onChange={(e) => setFormData(prev => ({ ...prev, actualResult: e.target.value }))}
              rows={2}
            />

            {screenshots.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Screenshots:</Label>
                <div className="grid grid-cols-2 gap-2">
                  {screenshots.map((screenshot) => (
                    <div key={screenshot.id} className="relative group">
                      <img
                        src={screenshot.dataUrl}
                        alt={screenshot.name}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeScreenshot(screenshot.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="space-y-2">
              <Label htmlFor="attachments" className="text-sm font-medium">
                Attachments:
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Files:</Label>
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                          {attachment.name}
                        </a>
                        <span className="text-xs text-gray-500">{Math.ceil(attachment.size / 1024)} KB</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={() => createIssueMutation.mutate()}
              disabled={createIssueMutation.isPending || !formData.title || !formData.projectId || !settings.githubToken}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {createIssueMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Github className="h-4 w-4 mr-2" />
              )}
              Create GitHub Issue
            </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Issue Reporter Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="github-token">GitHub Access Token</Label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={settings.githubToken}
                onChange={(e)=> setSettings(prev => ({ ...prev, githubToken: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="default-project">Default Project</Label>
              <Select
                value={settings.defaultProject}
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultProject: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-capture">Auto-capture on open</Label>
              <Switch
                id="auto-capture"
                checked={settings.autoCapture}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoCapture: checked }))}
              />
            </div>

            <Button onClick={saveSettings} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}