import { ChevronRight, Home } from "lucide-react";
import { DocumentFolder } from "@/shared/schema";

interface DocumentBreadcrumbProps {
  folders: DocumentFolder[];
  currentPath: number[] | null; // Array of folder IDs representing the current path
  onNavigate: (folderId: number | null) => void; // null means go to root
}

export function DocumentBreadcrumb({
  folders,
  currentPath,
  onNavigate,
}: DocumentBreadcrumbProps) {
  // If no current path or it's empty, just show the root
  if (!currentPath || currentPath.length === 0) {
    return (
      <div className="flex items-center mb-4 overflow-x-auto whitespace-nowrap py-2">
        <button
          className="flex items-center text-sm font-medium text-primary hover:underline"
          onClick={() => onNavigate(null)}
        >
          <Home className="h-4 w-4 mr-1" />
          Root
        </button>
      </div>
    );
  }

  // Build the breadcrumb path
  const breadcrumbItems = currentPath.map((folderId) => {
    const folder = folders.find((f) => f.id === folderId);
    return folder || { id: folderId, name: "Unknown Folder" };
  });

  return (
    <div className="flex items-center mb-4 overflow-x-auto whitespace-nowrap py-2">
      <button
        className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:underline"
        onClick={() => onNavigate(null)}
      >
        <Home className="h-4 w-4 mr-1" />
        Root
      </button>

      {breadcrumbItems.map((folder, index) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          <button
            className={`text-sm font-medium ${index === breadcrumbItems.length - 1 
              ? "text-primary" 
              : "text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:underline"
            }`}
            onClick={() => onNavigate(folder.id)}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </div>
  );
}
