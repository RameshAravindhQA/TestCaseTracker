import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileAttachment } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink, FileText, Image as ImageIcon, Video, ClipboardCopy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface BugAttachmentViewerProps {
  attachment: FileAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugAttachmentViewer({ attachment, open, onOpenChange }: BugAttachmentViewerProps) {
  const { toast } = useToast();
  
  if (!attachment) return null;
  
  const isImage = 
    attachment.fileType?.startsWith("image/") || 
    attachment.fileName?.toLowerCase().endsWith(".png") ||
    attachment.fileName?.toLowerCase().endsWith(".jpg") ||
    attachment.fileName?.toLowerCase().endsWith(".jpeg") ||
    attachment.fileName?.toLowerCase().endsWith(".gif") ||
    attachment.fileName?.toLowerCase().endsWith(".webp");
  
  const isVideo = 
    attachment.fileType?.startsWith("video/") ||
    attachment.fileName?.toLowerCase().endsWith(".mp4") ||
    attachment.fileName?.toLowerCase().endsWith(".webm") ||
    attachment.fileName?.toLowerCase().endsWith(".ogv") ||
    attachment.fileName?.toLowerCase().endsWith(".mov") ||
    attachment.fileName?.toLowerCase().endsWith(".avi");
  
  const isPdf = 
    attachment.fileType === "application/pdf" || 
    attachment.fileName?.toLowerCase().endsWith(".pdf");
  
  const downloadAttachment = () => {
    const link = document.createElement("a");
    link.href = attachment.fileUrl;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `Downloading ${attachment.fileName}`,
    });
  };
  
  const copyToClipboard = () => {
    // Create a text representation of the image or file
    let textContent = '';
    if (isImage) {
      textContent = `![${attachment.fileName}](${attachment.fileUrl})`;
    } else {
      textContent = `[${attachment.fileName}](${attachment.fileUrl})`;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(textContent)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Attachment link has been copied",
        });
      })
      .catch((error) => {
        console.error('Failed to copy attachment details:', error);
        toast({
          title: "Copy failed",
          description: "Failed to copy attachment link to clipboard",
          variant: "destructive",
        });
      });
  };
  
  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (isVideo) return <Video className="h-5 w-5 text-purple-500" />;
    if (isPdf) return <FileText className="h-5 w-5 text-red-500" />;
    return <FileText className="h-5 w-5 text-blue-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 max-w-[calc(100%-6rem)] truncate">
              {getFileIcon()}
              <span className="truncate">{attachment.fileName}</span>
            </DialogTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyToClipboard}
                title="Copy link"
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={downloadAttachment}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open(attachment.fileUrl, "_blank")}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="flex items-center justify-center h-full">
            {isImage && (
              <img 
                src={attachment.fileUrl} 
                alt={attachment.fileName} 
                className="max-w-full max-h-[calc(80vh-8rem)] object-contain" 
                onError={() => {
                  toast({
                    title: "Error loading image",
                    description: "Failed to load the image. Try downloading instead.",
                    variant: "destructive",
                  });
                }}
              />
            )}
            {isVideo && (
              <video 
                src={attachment.fileUrl} 
                controls 
                className="max-w-full max-h-[calc(80vh-8rem)]" 
                onError={() => {
                  toast({
                    title: "Error loading video",
                    description: "Failed to load the video. Try downloading instead.",
                    variant: "destructive",
                  });
                }}
              />
            )}
            {isPdf && (
              <iframe 
                src={attachment.fileUrl} 
                width="100%" 
                height="100%" 
                className="min-h-[calc(80vh-8rem)]"
                title={attachment.fileName}
              />
            )}
            {!isImage && !isVideo && !isPdf && (
              <div className="flex flex-col items-center justify-center space-y-4 p-10 text-center">
                <FileText className="h-16 w-16 text-gray-400" />
                <p className="text-lg">This file type cannot be previewed</p>
                <p className="text-sm text-gray-500 max-w-md">
                  {attachment.fileName} ({attachment.fileType || "Unknown type"})
                </p>
                <Button onClick={downloadAttachment}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
