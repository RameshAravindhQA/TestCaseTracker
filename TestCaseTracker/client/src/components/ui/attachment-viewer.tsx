import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileAttachment } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink, FileText, Image as ImageIcon, ClipboardCopy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface AttachmentViewerProps {
  attachment: FileAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttachmentViewer({ attachment, open, onOpenChange }: AttachmentViewerProps) {
  const { toast } = useToast();
  
  if (!attachment) return null;
  
  const isImage = attachment.type.startsWith("image/");
  const isPdf = attachment.type === "application/pdf";
  const downloadAttachment = () => {
    const link = document.createElement("a");
    link.href = attachment.data;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const copyToClipboard = () => {
    // Create a text representation of the image or file
    let textContent = '';
    if (isImage) {
      textContent = `![${attachment.name}](${attachment.data})`;
    } else {
      textContent = `[${attachment.name}](Download attachment)`;
    }
    
    // Copy to clipboard
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 max-w-[calc(100%-6rem)] truncate">
              {isImage ? (
                <ImageIcon className="h-5 w-5 text-blue-500" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500" />
              )}
              <span className="truncate">{attachment.name}</span>
            </DialogTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyToClipboard}
                title="Make a Copy"
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
                onClick={() => window.open(attachment.data, "_blank")}
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
        
        <ScrollArea className="flex-1 p-4 bg-neutral-50 dark:bg-neutral-900 overflow-auto">
          <div className="flex items-center justify-center min-h-full">
            {isImage ? (
              <img 
                src={attachment.data} 
                alt={attachment.name} 
                className="max-w-full max-h-full object-contain shadow-lg rounded" 
              />
            ) : isPdf ? (
              <object 
                data={attachment.data} 
                type="application/pdf" 
                className="w-full h-full min-h-[500px]"
              >
                <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
                  <FileText className="h-12 w-12 text-gray-400" />
                  <p>Your browser doesn't support PDF preview.</p>
                  <Button onClick={downloadAttachment}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </object>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
                <FileText className="h-16 w-16 text-gray-400" />
                <p className="text-lg">This file type cannot be previewed</p>
                <p className="text-sm text-gray-500 max-w-md">
                  {attachment.name} ({attachment.type})
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