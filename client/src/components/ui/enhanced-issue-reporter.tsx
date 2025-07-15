import React, { useState, useRef, useCallback } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnnotationTool {
  type: 'pointer' | 'rectangle' | 'circle' | 'text' | 'freehand';
  color: string;
  size: number;
}

interface Annotation {
  id: string;
  type: AnnotationTool['type'];
  coordinates: number[];
  text?: string;
  color: string;
  size: number;
}

interface Screenshot {
  id: string;
  dataUrl: string;
  annotations: Annotation[];
  timestamp: Date;
  name: string;
}

interface IssueData {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'feature' | 'enhancement' | 'question';
  environment: string;
  steps: string;
  expected: string;
  actual: string;
  screenshots: Screenshot[];
}

export function EnhancedIssueReporter() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [currentScreenshot, setCurrentScreenshot] = useState<Screenshot | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [currentTool, setCurrentTool] = useState<AnnotationTool>({
    type: 'pointer',
    color: '#ef4444',
    size: 3
  });
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const [issueData, setIssueData] = useState<IssueData>({
    title: '',
    description: '',
    severity: 'medium',
    category: 'bug',
    environment: '',
    steps: '',
    expected: '',
    actual: '',
    screenshots: []
  });

  // Screenshot capture
  const captureScreenshot = useCallback(async () => {
    try {
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

        const newScreenshot: Screenshot = {
          id: Date.now().toString(),
          dataUrl,
          annotations: [],
          timestamp: new Date(),
          name: `Screenshot ${screenshots.length + 1}`
        };

        setScreenshots(prev => [...prev, newScreenshot]);
        setCurrentScreenshot(newScreenshot);
        setActiveTab('screenshots');

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());

        toast({
          title: "Screenshot captured",
          description: "You can now annotate the screenshot"
        });
      });

    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: "Capture failed",
        description: "Unable to capture screenshot. Please try uploading an image instead.",
        variant: "destructive"
      });
    }
  }, [screenshots.length, toast]);

  // File upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      const newScreenshot: Screenshot = {
        id: Date.now().toString(),
        dataUrl,
        annotations: [],
        timestamp: new Date(),
        name: file.name
      };

      setScreenshots(prev => [...prev, newScreenshot]);
      setCurrentScreenshot(newScreenshot);
      setActiveTab('screenshots');
    };

    reader.readAsDataURL(file);
  }, [toast]);

  // Canvas drawing functions
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAnnotating || !currentScreenshot) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      setStartPos({ x, y });
      setIsDrawing(true);

      if (currentTool.type === 'freehand') {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'freehand',
          coordinates: [x, y],
          color: currentTool.color,
          size: currentTool.size
        };

        setCurrentScreenshot(prev => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            annotations: [...prev.annotations, newAnnotation]
          };
          setUndoStack(stack => [...stack, prev.annotations]);
          setRedoStack([]);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error in startDrawing:', error);
    }
  }, [isAnnotating, currentScreenshot, currentTool]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isAnnotating || !currentScreenshot) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (currentTool.type === 'freehand') {
        setCurrentScreenshot(prev => {
          if (!prev) return prev;
          const annotations = [...prev.annotations];
          const lastAnnotation = annotations[annotations.length - 1];
          if (lastAnnotation && lastAnnotation.type === 'freehand') {
            lastAnnotation.coordinates.push(x, y);
          }
          return { ...prev, annotations };
        });
      }

      redrawCanvas();
    } catch (error) {
      console.error('Error in draw:', error);
    }
  }, [isDrawing, isAnnotating, currentScreenshot, currentTool, redrawCanvas]);

  const stopDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isAnnotating || !currentScreenshot) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (currentTool.type !== 'freehand') {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: currentTool.type,
          coordinates: [startPos.x, startPos.y, x, y],
          color: currentTool.color,
          size: currentTool.size
        };

        if (currentTool.type === 'text') {
          const text = prompt('Enter text:');
          if (text) {
            newAnnotation.text = text;
          } else {
            setIsDrawing(false);
            return;
          }
        }

        setCurrentScreenshot(prev => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            annotations: [...prev.annotations, newAnnotation]
          };
          setUndoStack(stack => [...stack, prev.annotations]);
          setRedoStack([]);
          return updated;
        });
      }

      setIsDrawing(false);
    } catch (error) {
      console.error('Error in stopDrawing:', error);
      setIsDrawing(false);
    }
  }, [isDrawing, isAnnotating, currentScreenshot, currentTool, startPos]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentScreenshot) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw screenshot
      const img = new Image();
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Draw annotations with proper scaling
          currentScreenshot.annotations.forEach(annotation => {
            try {
              ctx.save();
              ctx.strokeStyle = annotation.color;
              ctx.fillStyle = annotation.color;
              ctx.lineWidth = Math.max(1, annotation.size);
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              switch (annotation.type) {
                case 'pointer':
                  const [px, py] = annotation.coordinates;
                  if (px >= 0 && py >= 0 && px <= canvas.width && py <= canvas.height) {
                    ctx.beginPath();
                    ctx.arc(px, py, Math.max(2, annotation.size * 2), 0, Math.PI * 2);
                    ctx.fill();
                  }
                  break;

                case 'rectangle':
                  const [rx1, ry1, rx2, ry2] = annotation.coordinates;
                  if (rx1 !== undefined && ry1 !== undefined && rx2 !== undefined && ry2 !== undefined) {
                    ctx.beginPath();
                    ctx.rect(rx1, ry1, rx2 - rx1, ry2 - ry1);
                    ctx.stroke();
                  }
                  break;

                case 'circle':
                  const [cx1, cy1, cx2, cy2] = annotation.coordinates;
                  if (cx1 !== undefined && cy1 !== undefined && cx2 !== undefined && cy2 !== undefined) {
                    const radius = Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2));
                    if (radius > 0) {
                      ctx.beginPath();
                      ctx.arc(cx1, cy1, radius, 0, Math.PI * 2);
                      ctx.stroke();
                    }
                  }
                  break;

                case 'text':
                  const [tx, ty] = annotation.coordinates;
                  if (tx !== undefined && ty !== undefined && annotation.text) {
                    ctx.font = `${Math.max(12, annotation.size * 4)}px Arial`;
                    ctx.fillText(annotation.text, tx, ty);
                  }
                  break;

                case 'freehand':
                  if (annotation.coordinates.length >= 4) {
                    ctx.beginPath();
                    ctx.moveTo(annotation.coordinates[0], annotation.coordinates[1]);
                    for (let i = 2; i < annotation.coordinates.length; i += 2) {
                      if (annotation.coordinates[i] !== undefined && annotation.coordinates[i + 1] !== undefined) {
                        ctx.lineTo(annotation.coordinates[i], annotation.coordinates[i + 1]);
                      }
                    }
                    ctx.stroke();
                  }
                  break;
              }
              ctx.restore();
            } catch (annotationError) {
              console.warn('Error drawing annotation:', annotationError);
            }
          });
        } catch (imageError) {
          console.error('Error drawing image on canvas:', imageError);
        }
      };

      img.onerror = () => {
        console.error('Error loading image for canvas');
      };

      img.src = currentScreenshot.dataUrl;
    } catch (error) {
      console.error('Error in redrawCanvas:', error);
    }
  }, [currentScreenshot]);

  useEffect(() => {
    const handleResize = () => {
      if (redrawCanvas) {
        redrawCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Undo/Redo functions
  const undo = useCallback(() => {
    if (undoStack.length === 0 || !currentScreenshot) return;

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, currentScreenshot.annotations]);
    setUndoStack(prev => prev.slice(0, -1));

    setCurrentScreenshot(prev => prev ? { ...prev, annotations: previousState } : null);
  }, [undoStack, currentScreenshot]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || !currentScreenshot) return;

    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, currentScreenshot.annotations]);
    setRedoStack(prev => prev.slice(0, -1));

    setCurrentScreenshot(prev => prev ? { ...prev, annotations: nextState } : null);
  }, [redoStack, currentScreenshot]);

  // Submit issue
  const submitIssue = useCallback(async () => {
    if (!issueData.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a title for the issue",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare the issue data with screenshots
      const finalIssueData = {
        ...issueData,
        screenshots: screenshots.map(screenshot => ({
          ...screenshot,
          // Convert annotations to a serializable format
          annotations: screenshot.annotations
        }))
      };

      // Here you would submit to your issue tracking system
      console.log('Submitting issue:', finalIssueData);

      toast({
        title: "Issue submitted",
        description: "Your issue has been submitted successfully",
      });

      // Reset form
      setIssueData({
        title: '',
        description: '',
        severity: 'medium',
        category: 'bug',
        environment: '',
        steps: '',
        expected: '',
        actual: '',
        screenshots: []
      });
      setScreenshots([]);
      setCurrentScreenshot(null);
      setOpen(false);

    } catch (error) {
      console.error('Error submitting issue:', error);
      toast({
        title: "Submission failed",
        description: "Failed to submit issue. Please try again.",
        variant: "destructive"
      });
    }
  }, [issueData, screenshots, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bug className="h-4 w-4" />
          Report Issue
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Enhanced Issue Reporter
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={issueData.title}
                  onChange={(e) => setIssueData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select value={issueData.severity} onValueChange={(value: any) => setIssueData(prev => ({ ...prev, severity: value }))}>
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
                <Label htmlFor="category">Category</Label>
                <Select value={issueData.category} onValueChange={(value: any) => setIssueData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="enhancement">Enhancement</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Input
                  id="environment"
                  value={issueData.environment}
                  onChange={(e) => setIssueData(prev => ({ ...prev, environment: e.target.value }))}
                  placeholder="Browser, OS, device, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={issueData.description}
                onChange={(e) => setIssueData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the issue"
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="screenshots" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button onClick={captureScreenshot} variant="outline" className="gap-2">
                <Camera className="h-4 w-4" />
                Capture Screen
              </Button>

              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {screenshots.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {screenshots.map((screenshot) => (
                  <div
                    key={screenshot.id}
                    className={`relative cursor-pointer border-2 rounded ${
                      currentScreenshot?.id === screenshot.id ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => setCurrentScreenshot(screenshot)}
                  >
                    <img
                      src={screenshot.dataUrl}
                      alt={screenshot.name}
                      className="w-full h-20 object-cover rounded"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScreenshots(prev => prev.filter(s => s.id !== screenshot.id));
                        if (currentScreenshot?.id === screenshot.id) {
                          setCurrentScreenshot(null);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {currentScreenshot && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{currentScreenshot.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isAnnotating ? "default" : "outline"}
                        onClick={() => setIsAnnotating(!isAnnotating)}
                      >
                        {isAnnotating ? "Stop Annotating" : "Start Annotating"}
                      </Button>
                    </div>
                  </div>

                  {isAnnotating && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={currentTool.type === 'pointer' ? "default" : "outline"}
                          onClick={() => setCurrentTool(prev => ({ ...prev, type: 'pointer' }))}
                        >
                          <MousePointer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={currentTool.type === 'rectangle' ? "default" : "outline"}
                          onClick={() => setCurrentTool(prev => ({ ...prev, type: 'rectangle' }))}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={currentTool.type === 'circle' ? "default" : "outline"}
                          onClick={() => setCurrentTool(prev => ({ ...prev, type: 'circle' }))}
                        >
                          <Circle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={currentTool.type === 'text' ? "default" : "outline"}
                          onClick={() => setCurrentTool(prev => ({ ...prev, type: 'text' }))}
                        >
                          <Type className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={currentTool.type === 'freehand' ? "default" : "outline"}
                          onClick={() => setCurrentTool(prev => ({ ...prev, type: 'freehand' }))}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>

                      <Separator orientation="vertical" className="h-6" />

                      <div className="flex gap-1">
                        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000'].map((color) => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded border-2 ${
                              currentTool.color === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setCurrentTool(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>

                      <Separator orientation="vertical" className="h-6" />

                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={undo} disabled={undoStack.length === 0}>
                          <Undo className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={redo} disabled={redoStack.length === 0}>
                          <Redo className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={600}
                      className="border rounded max-w-full h-auto cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={() => setIsDrawing(false)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="steps">Steps to Reproduce</Label>
                <Textarea
                  id="steps"
                  value={issueData.steps}
                  onChange={(e) => setIssueData(prev => ({ ...prev, steps: e.target.value }))}
                  placeholder="1. Go to...\n2. Click on...\n3. See error"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected">Expected Result</Label>
                  <Textarea
                    id="expected"
                    value={issueData.expected}
                    onChange={(e) => setIssueData(prev => ({ ...prev, expected: e.target.value }))}
                    placeholder="What should happen?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual">Actual Result</Label>
                  <Textarea
                    id="actual"
                    value={issueData.actual}
                    onChange={(e) => setIssueData(prev => ({ ...prev, actual: e.target.value }))}
                    placeholder="What actually happened?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
            </Badge>
            {issueData.title && (
              <Badge variant="outline">
                <CheckCircle className="h-3 w-3 mr-1" />
                Title set
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitIssue} className="gap-2">
              <Send className="h-4 w-4" />
              Submit Issue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}