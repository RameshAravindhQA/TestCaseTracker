
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileAttachment } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink, FileText, Image as ImageIcon, Video, ClipboardCopy, ZoomIn, ZoomOut, RotateCw, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

interface AttachmentViewerProps {
  attachment: any;
}

export function AttachmentViewer({ attachment }: AttachmentViewerProps) {
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (attachment) {
      setZoom(1);
      setRotation(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [attachment]);

  if (!attachment) return null;

  const fileName = attachment.fileName || attachment.name || 'Unknown';
  const fileType = attachment.fileType || attachment.type || '';
  const fileUrl = attachment.fileUrl || attachment.data || attachment.url || '';
  
  const isImage = fileType.startsWith("image/") || fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
  const isVideo = fileType.startsWith("video/") || fileName.toLowerCase().match(/\.(mp4|webm|ogv|mov|avi)$/);
  const isPdf = fileType === "application/pdf" || fileName.toLowerCase().endsWith('.pdf');
  const isText = fileType.startsWith("text/") || fileName.toLowerCase().match(/\.(txt|md|json|xml|csv)$/);

  const downloadAttachment = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Download started",
      description: `Downloading ${fileName}`,
    });
  };

  const copyToClipboard = () => {
    let textContent = '';
    if (isImage) {
      textContent = `![${fileName}](${fileUrl})`;
    } else {
      textContent = `[${fileName}](Download attachment)`;
    }
    
    navigator.clipboard.writeText(textContent)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Attachment details have been copied",
        });
      })
      .catch((error) => {
        console.error('Failed to copy attachment details:', error);
        toast({
          title: "Copy failed",
          description: "Failed to copy attachment details to clipboard",
          variant: "destructive",
        });
      });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (isVideo) return <Video className="h-5 w-5 text-purple-500" />;
    if (isPdf) return <FileText className="h-5 w-5 text-red-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getFileIcon()}
          <span className="text-sm font-medium truncate">{fileName}</span>
          {attachment.size && (
            <span className="text-xs text-gray-500">
              ({(attachment.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewerOpen(true)}
            className="h-8 w-8 p-0"
            title="View attachment"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadAttachment}
            className="h-8 w-8 p-0"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview for images - show inline */}
      {isImage && fileUrl && (
        <div className="mt-2">
          <img 
            src={fileUrl} 
            alt={fileName}
            className="max-w-full h-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
            style={{ maxHeight: '200px' }}
            onClick={() => setViewerOpen(true)}
          />
        </div>
      )}

      {/* Full viewer dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 max-w-[calc(100%-8rem)] truncate">
                {getFileIcon()}
                <span className="truncate">{fileName}</span>
              </DialogTitle>
              <div className="flex gap-2">
                {isImage && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom out">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom in">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRotate} title="Rotate">
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={copyToClipboard} title="Copy reference">
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadAttachment} title="Download">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(fileUrl, "_blank")} title="Open in new tab">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewerOpen(false)} title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden bg-neutral-50 dark:bg-neutral-900">
            <ScrollArea className="h-full">
              <div className="p-4 min-h-full flex items-center justify-center">
                {isImage ? (
                  <div className="flex items-center justify-center">
                    <img 
                      src={fileUrl} 
                      alt={fileName}
                      className="max-w-full max-h-full object-contain shadow-lg rounded transition-transform duration-200"
                      style={{ 
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: 'center'
                      }}
                    />
                  </div>
                ) : isVideo ? (
                  <div className="w-full max-w-4xl">
                    <video 
                      ref={videoRef}
                      src={fileUrl}
                      className="w-full h-auto rounded shadow-lg"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleTimeUpdate}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      controls={false}
                    />
                    <div className="mt-4 p-4 bg-black/80 rounded">
                      <div className="flex items-center gap-4 mb-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleVideoPlay}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        
                        <div className="flex-1">
                          <Slider
                            value={[currentTime]}
                            onValueChange={handleSeek}
                            max={duration}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        
                        <span className="text-white text-sm min-w-[80px]">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleVolumeToggle}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        
                        <div className="w-20">
                          <Slider
                            value={[volume]}
                            onValueChange={handleVolumeChange}
                            max={1}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isPdf ? (
                  <object 
                    data={fileUrl} 
                    type="application/pdf" 
                    className="w-full h-full min-h-[500px] rounded"
                  >
                    <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
                      <FileText className="h-16 w-16 text-gray-400" />
                      <p className="text-lg">Your browser doesn't support PDF preview.</p>
                      <Button onClick={downloadAttachment}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </object>
                ) : isText ? (
                  <div className="w-full max-w-4xl p-6 bg-white dark:bg-gray-800 rounded shadow-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {/* Text content would be loaded here */}
                      <div className="text-center text-gray-500">
                        <FileText className="h-16 w-16 mx-auto mb-4" />
                        <p>Text file preview</p>
                        <Button onClick={downloadAttachment} className="mt-4">
                          <Download className="h-4 w-4 mr-2" />
                          Download to view content
                        </Button>
                      </div>
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
                    <FileText className="h-16 w-16 text-gray-400" />
                    <p className="text-lg">This file type cannot be previewed</p>
                    <p className="text-sm text-gray-500 max-w-md">
                      {fileName} ({fileType})
                    </p>
                    <Button onClick={downloadAttachment}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Status bar */}
          <div className="px-6 py-2 border-t bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between items-center">
              <span>
                File: {fileName} • Type: {fileType}
              </span>
              {attachment.size && (
                <span>
                  Size: {(attachment.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
