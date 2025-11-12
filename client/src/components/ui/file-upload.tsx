import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { X, Upload, FileText, Image as ImageIcon, Eye } from "lucide-react";
import { FileAttachment } from "@/types";
import { AttachmentViewer } from "./attachment-viewer";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  value: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  readOnly?: boolean;
}

export function FileUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  },
  readOnly = false
}: FileUploadProps) {
  const [selectedAttachment, setSelectedAttachment] = React.useState<FileAttachment | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const promises = acceptedFiles.map((file) => {
        return new Promise<FileAttachment>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              data: reader.result as string,
              size: file.size,
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((newFiles) => {
        onChange([...value, ...newFiles]);
      });
    },
    [onChange, value]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - value.length,
    maxSize,
    accept,
    disabled: value.length >= maxFiles || readOnly,
  });

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  
  const openViewer = (file: FileAttachment) => {
    setSelectedAttachment(file);
    setViewerOpen(true);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (type === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (type.includes("spreadsheet") || type.includes("excel") || type.endsWith(".xlsx")) {
      return <FileText className="h-5 w-5 text-green-600" />;
    } else if (type.includes("word") || type.includes("document") || type.endsWith(".docx")) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300 hover:border-primary"
          } ${value.length >= maxFiles || readOnly ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? "Drop the files here..."
                : value.length >= maxFiles
                ? `Maximum ${maxFiles} files allowed`
                : "Drag and drop files here, or click to select files"}
            </p>
            <p className="text-xs text-gray-500">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {readOnly ? 
              (value.every(file => file.type.startsWith('image/')) ? "Screenshots" : "Attachments")
              : "Attached Files"} ({value.length})
          </p>
          <AnimatePresence>
            <div className="space-y-2">
              {value.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3 cursor-pointer" onClick={() => openViewer(file)}>
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openViewer(file)}
                      className="h-8 px-2 mr-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View file</span>
                    </Button>
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      )}
      
      <AttachmentViewer 
        attachment={selectedAttachment} 
        open={viewerOpen} 
        onOpenChange={setViewerOpen} 
      />
    </div>
  );
}