import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, Upload, File, Image, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

import type { RequestAttachment } from "@shared/schema";

interface RequestAttachmentsProps {
  requestId: number;
}

export function RequestAttachments({ requestId }: RequestAttachmentsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Fetch attachments
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: [`/api/request-forms/${requestId}/attachments`],
    enabled: !!requestId
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return apiRequest('POST', `/api/request-forms/${requestId}/attachments`, formData, { isFormData: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/request-forms/${requestId}/attachments`] });
      setSelectedFile(null);
      toast({ title: "File uploaded successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      return apiRequest('DELETE', `/api/request-forms/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/request-forms/${requestId}/attachments`] });
      toast({ title: "File deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Delete failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDelete = (attachmentId: number) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(attachmentId);
    }
  };

  const handleDownload = (attachment: RequestAttachment) => {
    window.open(`/api/request-forms/attachments/${attachment.id}/download`, '_blank');
  };

  const handleView = (attachment: RequestAttachment) => {
    // For images, show in a modal viewer
    if (attachment.mimeType.startsWith('image/')) {
      const imageUrl = `/api/request-forms/attachments/${attachment.id}/download`;
      // Open in a new window for viewing
      const viewer = window.open('', '_blank');
      if (viewer) {
        viewer.document.write(`
          <html>
            <head><title>${attachment.originalFileName}</title></head>
            <body style="margin:0; display:flex; justify-content:center; align-items:center; background:#000;">
              <img src="${imageUrl}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
            </body>
          </html>
        `);
      }
    } else {
      // For other files, open in new tab
      window.open(`/api/request-forms/attachments/${attachment.id}/download`, '_blank');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return <div className="p-4">Loading attachments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-2">
          <Input
            type="file"
            onChange={handleFileSelect}
            accept="*/*"
            data-testid="input-attachment-file"
          />
          {selectedFile && (
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-sm">{selectedFile.name}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  data-testid="button-upload-attachment"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedFile(null)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Attachments List */}
        {attachments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8" data-testid="text-no-attachments">
            No attachments uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment: RequestAttachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`attachment-item-${attachment.id}`}
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(attachment.mimeType)}
                  <div>
                    <div className="font-medium text-sm">
                      {attachment.originalFileName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.fileSize)} • 
                      Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs" data-testid={`badge-filetype-${attachment.id}`}>
                    {attachment.mimeType.split('/')[0]}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(attachment)}
                    data-testid={`button-view-${attachment.id}`}
                    title="View attachment"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(attachment)}
                    data-testid={`button-download-${attachment.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${attachment.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}