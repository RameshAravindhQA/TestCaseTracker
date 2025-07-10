
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X, RotateCw, ZoomIn, ZoomOut, Play, Pause, VolumeX, Volume2, Maximize, FileText } from "lucide-react";
import type { Document } from "@/types";

interface DocumentViewerProps {
  document: Document | null;
  onClose: () => void;
  onDownload: () => void;
}

export function DocumentViewer({ document, onClose, onDownload }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (document) {
      setIsLoading(true);
      setHasError(false);
      setZoom(1);
      setRotation(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [document]);

  if (!document) return null;

  const isImage = document.fileType?.startsWith('image/') || 
                  /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i.test(document.fileName || document.name);
  const isVideo = document.fileType?.startsWith('video/') || 
                  /\.(mp4|webm|ogv|avi|mov|wmv|flv|mkv|m4v|3gp|ts)$/i.test(document.fileName || document.name);
  const isPDF = document.fileType === 'application/pdf' || 
                /\.pdf$/i.test(document.fileName || document.name);
  const isText = document.fileType?.startsWith('text/') || 
                 /\.(txt|csv|md|json|xml|html|css|js|ts|py|java|cpp|c|h)$/i.test(document.fileName || document.name);
  const isOfficeDoc = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(document.fileName || document.name) ||
                     ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(document.fileType || '');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName || document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(document.fileUrl, '_blank');
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleVideoLoad = (video: HTMLVideoElement) => {
    setIsLoading(false);
    setHasError(false);
    setDuration(video.duration);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const togglePlayPause = () => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{document.name}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {document.fileName} • {document.fileType} 
              {document.fileSize && ` • ${(document.fileSize / 1024 / 1024).toFixed(2)} MB`}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {isImage && !hasError && (
              <>
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.25}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
            {isVideo && !hasError && (
              <>
                <Button variant="outline" size="sm" onClick={togglePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <span className="text-sm px-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-4xl">⚠️</div>
                <div>
                  <p className="font-medium">Failed to load preview</p>
                  <p className="text-sm text-muted-foreground">
                    The file might be corrupted or in an unsupported format.
                  </p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                  <Button variant="outline" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isImage && !hasError && (
            <div className="flex items-center justify-center min-h-full p-4">
              <img
                src={document.fileUrl}
                alt={document.name}
                className="max-w-none transition-transform duration-200 shadow-lg rounded-lg"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  maxHeight: 'none'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}

          {isVideo && (
            <div className="flex items-center justify-center min-h-full p-4">
              <div className="w-full max-w-4xl">
                <video
                  src={document.fileUrl}
                  controls
                  className="w-full rounded-lg shadow-lg"
                  style={{ maxHeight: '70vh' }}
                  onLoadedData={(e) => handleVideoLoad(e.target as HTMLVideoElement)}
                  onError={handleVideoError}
                  onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  preload="metadata"
                >
                  <p>Your browser does not support the video tag.</p>
                </video>
                
                {/* Enhanced Video Controls */}
                <div className="mt-4 p-4 bg-black/80 rounded-lg text-white">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    
                    <div className="flex-1">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    
                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isPDF && (
            <div className="w-full h-full">
              <iframe
                src={`${document.fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                className="w-full h-full border-0"
                style={{ minHeight: '70vh' }}
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                title={document.name}
              />
              
              {/* PDF Enhancement Notice */}
              <div className="absolute top-4 right-4 bg-blue-100 dark:bg-blue-900 p-3 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">PDF Document</p>
                    <p className="text-blue-600 dark:text-blue-300">Use browser controls for navigation</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isText && (
            <div className="w-full h-full">
              <div className="p-4 bg-white dark:bg-gray-800 border-b">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Text Document</span>
                </div>
              </div>
              <iframe
                src={document.fileUrl}
                className="w-full h-full border-0 bg-white dark:bg-gray-800"
                style={{ minHeight: '70vh' }}
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                title={document.name}
              />
            </div>
          )}

          {isOfficeDoc && (
            <div className="flex items-center justify-center min-h-full">
              <div className="text-center space-y-4 p-8">
                <div className="text-6xl">📄</div>
                <div>
                  <p className="font-medium">Office Document</p>
                  <p className="text-sm text-muted-foreground">
                    This document type requires downloading to view with appropriate software.
                  </p>
                </div>
                <div className="space-x-2">
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                  <Button variant="outline" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Try Opening Directly
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!isImage && !isVideo && !isPDF && !isText && !isOfficeDoc && (
            <div className="flex items-center justify-center min-h-full">
              <div className="text-center space-y-4 p-8">
                <div className="text-6xl">📄</div>
                <div>
                  <p className="font-medium">Preview not available</p>
                  <p className="text-sm text-muted-foreground">
                    This file type cannot be previewed in the browser.
                  </p>
                </div>
                <div className="space-x-2">
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                  <Button variant="outline" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Try Opening Directly
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
