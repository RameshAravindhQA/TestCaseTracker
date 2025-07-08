import { Button } from "@/components/ui/button";
import { Document } from "@/shared/schema";
import {
  FileText,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  MoveUpRight,
  Copy,
  Scissors,
  File,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

interface DocumentItemProps {
  document: Document;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onMove?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
}

export function DocumentItem({
  document,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onMove,
  onCut,
  onCopy,
}: DocumentItemProps) {
  // Handle double click to open the document
  const handleDoubleClick = () => {
    onView();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'csv':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div 
      className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-1 cursor-pointer"
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex items-center flex-1 min-w-0">
        <FileText className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
        <div className="truncate">
          <div className="text-sm font-medium truncate">{document.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {document.description && (
              <span className="mr-2">{document.description}</span>
            )}
            <span>
              {formatDate(new Date(document.uploadedAt))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 ml-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
          onClick={onView}
          title="View Document"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">View</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
          onClick={onDelete}
          title="Delete Document"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
          onClick={onDownload}
          title="Download Document"
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Download</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}>
              <MoveUpRight className="h-4 w-4 mr-2" />
              Move to Folder
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                if (onCut) onCut();
              }}
              className="text-amber-600 dark:text-amber-400"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Cut to Clipboard
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onCopy?.()} 
              className="text-blue-600 dark:text-blue-400"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}