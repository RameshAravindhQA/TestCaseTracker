import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import type { Document } from "@/types";

interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen && document) {
      setIsLoading(true);
      setHasError(false);
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, document]);

  if (!document) return null;

  const isImage = document.fileType?.startsWith('image/') || 
                  /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i.test(document.fileName || document.name);
  const isVideo = document.fileType?.startsWith('video/') || 
                  /\.(mp4|webm|ogv|avi|mov|wmv|flv|mkv|m4v|3gp|ts)$/i.test(document.fileName || document.name);
  const isPDF = document.fileType === 'application/pdf' || 
                /\.pdf$/i.test(document.fileName || document.name);
  const isText = document.fileType?.startsWith('text/') || 
                 /\.(txt|csv|md|json|xml|html|css|js|ts|py|java|cpp|c|h)$/i.test(document.fileName || document.name);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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

          {isImage && (
            <div className="flex items-center justify-center min-h-full p-4">
              <img
                src={document.fileUrl}
                alt={document.name}
                className="max-w-none transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  maxHeight: hasError ? '0' : 'none'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}

          {isVideo && (
            <div className="flex items-center justify-center min-h-full p-4">
              <video
                src={document.fileUrl}
                controls
                className="max-w-full max-h-full"
                style={{ maxHeight: '80vh' }}
                onLoadedData={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                preload="metadata"
              >
                <p>Your browser does not support the video tag.</p>
              </video>
            </div>
          )}

          {isPDF && (
            <div className="w-full h-full">
              <iframe
                src={`${document.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
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
            </div>
          )}

          {isText && (
            <div className="w-full h-full">
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

          {!isImage && !isVideo && !isPDF && !isText && (
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