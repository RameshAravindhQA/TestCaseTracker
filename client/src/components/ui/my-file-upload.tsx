import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FileAttachment } from "@/types";
import { Paperclip, X, Copy, Image, FileText, File } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  value: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  requiredFileTypes?: string[];
  isCopyMode?: boolean;
  copySourceId?: number;
  entityType?: string;
  className?: string;
  screenshotRequired?: boolean;
}

export function MyFileUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 2 * 1024 * 1024, // 2MB default
  requiredFileTypes = [],
  isCopyMode = false,
  copySourceId,
  entityType = "bug",
  className,
  screenshotRequired = false
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [hasScreenshot, setHasScreenshot] = useState(() => {
    return value.some(file => 
      file.fileName.toLowerCase().endsWith('.png') || 
      file.fileName.toLowerCase().endsWith('.jpg') || 
      file.fileName.toLowerCase().endsWith('.jpeg') || 
      file.fileName.toLowerCase().endsWith('.gif') ||
      file.fileType.includes('image/')
    );
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        const response = await apiRequest("POST", "/api/uploads/bug-attachment", undefined, {
          body: formData,
          headers: {
            // Don't set Content-Type here, it will be set automatically with the boundary
          },
        });

        if (!response.ok) {
          let errorMessage = `Upload failed with status ${response.status}`;
          try {
            // Try to get error details from response
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // If we can't parse JSON, try getting text
            try {
              const text = await response.text();
              if (text) errorMessage = text;
            } catch (textError) {
              console.error('Failed to get error text:', textError);
            }
          }
          throw new Error(errorMessage);
        }

        // Try to parse JSON response
        try {
          return await response.json();
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Upload request error:', error);
        throw error;
      }
    },
    onSuccess: (data: FileAttachment) => {
      onChange([...value, data]);
      
      // Check if the new file is an image/screenshot
      const isScreenshot = 
        data.fileName.toLowerCase().endsWith('.png') || 
        data.fileName.toLowerCase().endsWith('.jpg') || 
        data.fileName.toLowerCase().endsWith('.jpeg') || 
        data.fileName.toLowerCase().endsWith('.gif') ||
        data.fileType.includes('image/');
        
      if (isScreenshot) {
        setHasScreenshot(true);
      }
      
      toast({
        title: "File uploaded",
        description: "The file has been uploaded successfully.",
      });
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  // Copy attachments mutation
  const copyAttachmentsMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest("POST", `/api/${entityType}s/${copySourceId}/copy-attachments`, undefined);
        
        if (!response.ok) {
          let errorMessage = `Copy operation failed with status ${response.status}`;
          try {
            // Try to get error details from response
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // If we can't parse JSON, try getting text
            try {
              const text = await response.text();
              if (text) errorMessage = text;
            } catch (textError) {
              console.error('Failed to get error text:', textError);
            }
          }
          throw new Error(errorMessage);
        }
        
        // Try to parse JSON response
        try {
          return await response.json();
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Copy attachments request error:', error);
        throw error;
      }
    },
    onSuccess: (data: FileAttachment[]) => {
      onChange(data);
      
      // Check if any of the copied files is a screenshot
      const hasAnyScreenshot = data.some(file => 
        file.fileName.toLowerCase().endsWith('.png') || 
        file.fileName.toLowerCase().endsWith('.jpg') || 
        file.fileName.toLowerCase().endsWith('.jpeg') || 
        file.fileName.toLowerCase().endsWith('.gif') ||
        file.fileType.includes('image/')
      );
      
      setHasScreenshot(hasAnyScreenshot);
      
      toast({
        title: "Attachments copied",
        description: `${data.length} attachments have been copied.`,
      });
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Copy failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${maxFiles} files.`,
        variant: "destructive",
      });
      return;
    }

    // Set uploading state once at the beginning
    setIsUploading(true);
    
    // Upload each file individually for better error handling
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `The file ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`,
          variant: "destructive",
        });
        continue;
      }

      if (requiredFileTypes.length > 0 && !requiredFileTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `The file ${file.name} has an invalid type. Allowed types: ${requiredFileTypes.join(", ")}.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        // Create a new FormData instance for each file
        const formData = new FormData();
        formData.append("file", file); // Use file to match the server expected field name
        
        // Use mutateAsync to handle individual file uploads sequentially
        await uploadFileMutation.mutateAsync(formData);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Let the mutation onError handle the error display
      }
    }
    
    // Reset the uploading state only if the mutation doesn't handle it
    if (uploadFileMutation.isPending === false) {
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...value];
    
    // Check if the file being removed is a screenshot
    const removedFile = newFiles[index];
    const isRemovingScreenshot = 
      removedFile.fileName.toLowerCase().endsWith('.png') || 
      removedFile.fileName.toLowerCase().endsWith('.jpg') || 
      removedFile.fileName.toLowerCase().endsWith('.jpeg') || 
      removedFile.fileName.toLowerCase().endsWith('.gif') ||
      removedFile.fileType.includes('image/');
    
    newFiles.splice(index, 1);
    onChange(newFiles);
    
    // If we removed a screenshot, check if there are any other screenshots left
    if (isRemovingScreenshot) {
      const stillHasScreenshot = newFiles.some(file => 
        file.fileName.toLowerCase().endsWith('.png') || 
        file.fileName.toLowerCase().endsWith('.jpg') || 
        file.fileName.toLowerCase().endsWith('.jpeg') || 
        file.fileName.toLowerCase().endsWith('.gif') ||
        file.fileType.includes('image/')
      );
      setHasScreenshot(stillHasScreenshot);
    }
  };

  const handleCopyAttachments = () => {
    if (!copySourceId) {
      toast({
        title: "Error",
        description: "No source ID provided for copying attachments.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    copyAttachmentsMutation.mutate();
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType.startsWith("image/") || 
        fileName.toLowerCase().endsWith('.png') || 
        fileName.toLowerCase().endsWith('.jpg') || 
        fileName.toLowerCase().endsWith('.jpeg') || 
        fileName.toLowerCase().endsWith('.gif')) {
      return <Image className="h-4 w-4" />;
    }
    
    if (fileType.includes("pdf") || 
        fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="h-4 w-4" />;
    }
    
    return <File className="h-4 w-4" />;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Attachments {screenshotRequired && <span className="text-red-500">*</span>}
        </Label>
        
        {screenshotRequired && !hasScreenshot && (
          <span className="text-xs text-red-500">
            At least one screenshot is required
          </span>
        )}
      </div>
      
      {isCopyMode && copySourceId && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyAttachments}
          disabled={isUploading}
          className="w-full mb-2"
        >
          <Copy className="h-4 w-4 mr-2" />
          Make Copy of Original Attachments
        </Button>
      )}
      
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || value.length >= maxFiles}
          className="w-full"
        >
          <Paperclip className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Attach File"}
        </Button>
        
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
        />
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        {screenshotRequired ? (
          <><strong>Screenshots are mandatory</strong> - Please attach at least one screenshot (.png, .jpg, .jpeg, .gif)</>
        ) : (
          <><strong>Screenshots are recommended</strong> - Adding screenshots helps in understanding the issue better</>  
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        Max file size: {maxSize / 1024 / 1024}MB, Max files: {maxFiles}
      </div>
      
      {value.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({value.length})</h4>
          
          <Card className="border border-muted">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Attachments</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ul className="space-y-2">
                {value.map((file, index) => (
                  <li key={index} className="flex items-center justify-between py-1 border-b last:border-0">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file.fileName, file.fileType)}
                      <a 
                        href={file.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate max-w-[200px]"
                      >
                        {file.fileName}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}