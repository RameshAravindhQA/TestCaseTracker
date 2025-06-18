import { useState, useEffect } from "react";
import { Document } from "@/shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, ExternalLink, Eye, FileText, Image, Video, Music, Archive, File, FileImage, FileSpreadsheet, Presentation, Code, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { EnhancedImageViewer } from '../ui/enhanced-image-viewer';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
  onDownload: () => void;
}

export function DocumentViewer({ document, onClose, onDownload }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Determine file type based on extension
  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Image formats
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'].includes(extension)) {
      return 'image';
    }

    // Video formats
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'].includes(extension)) {
      return 'video';
    }

    // Audio formats
    if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'opus'].includes(extension)) {
      return 'audio';
    }

    // Document formats
    if (['pdf'].includes(extension)) {
      return 'pdf';
    }

    if (['doc', 'docx'].includes(extension)) {
      return 'word';
    }

    if (['xls', 'xlsx'].includes(extension)) {
      return 'excel';
    }

    if (['ppt', 'pptx'].includes(extension)) {
      return 'powerpoint';
    }

    // Text formats
    if (['txt', 'md', 'rtf', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h'].includes(extension)) {
      return 'text';
    }

    // Archive formats
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
      return 'archive';
    }

    return 'unknown';
  };

  const fileType = getFileType(document.fileName);
  const fileUrl = `/api/documents/${document.id}/download`;
  const fileName = document.fileName;

  // Add authentication headers if needed
  const getAuthenticatedUrl = () => {
    const timestamp = Date.now();
    const token = localStorage.getItem('token');
    if (token) {
      return `${fileUrl}?token=${encodeURIComponent(token)}&t=${timestamp}&_=${refreshKey}`;
    }
    return `${fileUrl}?t=${timestamp}&_=${refreshKey}`;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  // Check if it's an image using both file extension and MIME type
  const isImage = fileType === 'image' || 
    document.fileType?.startsWith('image/') ||
    fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/);
  const isPDF = fileType === 'pdf' || document.fileType === 'application/pdf';
  const isVideo = fileType === 'video' || document.fileType?.startsWith('video/');
  const isAudio = fileType === 'audio' || document.fileType?.startsWith('audio/');

  const renderFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-purple-500" />;
      case 'audio':
        return <Music className="h-5 w-5 text-green-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'word':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'powerpoint':
        return <Presentation className="h-5 w-5 text-orange-600" />;
      case 'archive':
        return <Archive className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleRefresh = () => {
    setError(null);
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);

    toast({
      title: "Refreshing preview",
      description: "Attempting to reload the preview...",
    });
  };

  const handleDownload = () => {
    onDownload();
    toast({
      title: "Download started",
      description: `Downloading ${fileName}`,
    });
  };

  const renderFilePreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            {isLoading && !error && (
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-gray-600">Loading image preview...</p>
              </div>
            )}
            {error ? (
              <div className="flex flex-col items-center justify-center space-y-4 p-10 text-center">
                <div className="p-4 bg-red-50 rounded-full">
                  <Eye className="h-12 w-12 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Failed to load image</h3>
                  <p className="text-red-600 text-sm mb-4 max-w-md">
                    The image preview could not be loaded. This might be due to file permissions or server configuration.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry Preview
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Instead
                  </Button>
                </div>
              </div>
            ) : (
              <img 
                key={refreshKey}
                src={getAuthenticatedUrl()}
                alt={fileName}
                className={`max-w-full max-h-[calc(80vh-8rem)] object-contain ${isLoading ? 'hidden' : ''}`}
                onError={(e) => {
                  console.error('Failed to load image:', e);
                  console.error('Image URL:', getAuthenticatedUrl());
                  setError('Failed to load image - please try downloading the file');
                  setIsLoading(false);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully');
                  setIsLoading(false);
                  setError(null);

                  // Clear the timeout since image loaded successfully
                  if (timeoutId) {
                    clearTimeout(timeoutId);
                    setTimeoutId(null);
                  }
                }}
                onLoadStart={() => {
                  console.log('Image load started');
                  setIsLoading(true);
                  setError(null);

                  // Clear any existing timeout
                  if (timeoutId) {
                    clearTimeout(timeoutId);
                  }

                  // Set a timeout for loading
                  const newTimeoutId = setTimeout(() => {
                    setError('Image loading timed out - please try downloading the file');
                    setIsLoading(false);
                    toast({
                      title: "Loading timeout",
                      description: "Image preview is taking too long to load. Try downloading instead.",
                      variant: "destructive",
                    });
                  }, 15000); // 15 seconds timeout

                  setTimeoutId(newTimeoutId);
                }}
              />
            )}
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center h-full">
            <video
              controls
              className="max-w-full max-h-[calc(80vh-8rem)]"
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setError('Failed to load video');
                setIsLoading(false);
                toast({
                  title: "Error loading video",
                  description: "Failed to load the video. Try downloading instead.",
                  variant: "destructive",
                });
              }}
              preload="metadata"
            >
              <source src={getAuthenticatedUrl()} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center space-y-6 p-10">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full">
              <Music className="h-12 w-12 text-blue-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Audio File</h3>
              <p className="text-gray-600 text-sm mb-4">{fileName}</p>
            </div>
            <audio
              controls
              className="w-full max-w-md"
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setError('Failed to load audio');
                setIsLoading(false);
                toast({
                  title: "Error loading audio",
                  description: "Failed to load the audio. Try downloading instead.",
                  variant: "destructive",
                });
              }}
              preload="metadata"
            >
              <source src={getAuthenticatedUrl()} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div className="flex items-center justify-center h-full">
            <iframe 
              src={getAuthenticatedUrl()} 
              width="100%" 
              height="100%" 
              className="min-h-[calc(80vh-8rem)]"
              title={fileName}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setError('PDF preview not available');
                setIsLoading(false);
              }}
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-10 text-center">
            <div className="p-4 bg-gray-50 rounded-full">
              {renderFileIcon()}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Preview not available</h3>
              <p className="text-gray-600 text-sm max-w-md mb-4">
                This file type is not supported for preview. You can download it to view with an appropriate application.
              </p>
              <p className="text-sm text-gray-500">
                {fileName} ({document.fileType || "Unknown type"})
              </p>
            </div>
            <Button onClick={handleDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download File
            </Button>
          </div>
        );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0" aria-describedby="document-viewer-description">
        <div id="document-viewer-description" className="sr-only">
          Document viewer for {document.name}. Use the buttons in the header to download, open in new tab, or close.
        </div>
        <DialogHeader className="px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 max-w-[calc(100%-12rem)] truncate">
              {renderFileIcon()}
              <div className="min-w-0">
                <span className="truncate text-base font-semibold">{document.name}</span>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <span className="truncate">{fileName}</span>
                  <Badge variant="secondary" className="text-xs">{document.fileType}</Badge>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>
              </div>
            </DialogTitle>
            <div className="flex gap-2">
              {isImage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  title="Refresh preview"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownload}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open(getAuthenticatedUrl(), "_blank")}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* File Preview */}
            <div className="mb-6 min-h-[60vh] bg-gray-50 rounded-lg border">
              {isLoading && !error && (
                <div className="flex items-center justify-center h-[60vh]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading preview...</p>
                  </div>
                </div>
              )}

              {!isLoading && renderFilePreview()}
            </div>

            {/* File Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3">File Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{document.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">{document.fileType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Size:</span>
                  <span className="ml-2 font-medium">{formatFileSize(document.fileSize)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium">
                    {document.createdAt ? format(new Date(document.createdAt), "MMM d, yyyy 'at' h:mm a") : 'Unknown'}
                  </span>
                </div>
                {document.description && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Description:</span>
                    <p className="ml-2 font-medium">{document.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}