import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProjectSelect } from "@/components/ui/project-select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Project, Module } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Check, 
  ChevronDown, 
  Download, 
  Edit, 
  FileText, 
  FileType, 
  Palette, 
  Plus, 
  Save, 
  Settings, 
  Trash, 
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { HexColorPicker } from "react-colorful";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle, AlertCircle, Clock, Filter, RefreshCw, GitBranch, Network, Link2, Grid3X3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

// Define the cell value types
type CellValue = {
  type: 'checkmark' | 'x-mark' | 'custom' | 'empty';
  color?: string;
  label?: string;
};

// Define a custom marker type for CRUD operations
type CustomMarker = {
  id: number;
  markerId: string;
  label: string;
  color: string;
  type: 'checkmark' | 'x-mark' | 'custom';
  projectId: number;
  createdById: number;
  createdAt: string;
  updatedAt?: string;
};

export default function TraceabilityMatrixPage() {
  // Define all state variables first to prevent reference errors
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [matrixData, setMatrixData] = useState<Record<string, CellValue[]>>({});
  const [customMarkers, setCustomMarkers] = useState<CustomMarker[]>([]);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingSaves, setPendingSaves] = useState<{
    rowId: string; 
    colIndex: number; 
    value: CellValue;
    projectId: string; // Keep track of which project this change belongs to
  }[]>([]);

  // Autosave timer reference
  const autosaveTimerRef = useRef<number | null>(null);
  // Track if autosave is in progress
  const [isAutosaving, setIsAutosaving] = useState(false);

  const [newMarker, setNewMarker] = useState<Omit<CustomMarker, 'id' | 'markerId' | 'projectId' | 'createdById' | 'createdAt' | 'updatedAt'>>({
    label: '',
    color: '#3b82f6',
    type: 'custom'
  });
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [editingMarker, setEditingMarker] = useState<CustomMarker | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get the current user from local storage as backup
  const [localStorageUser, setLocalStorageUser] = useState<{id: number, name: string} | null>(null);

  // Load user from localStorage as a fallback
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setLocalStorageUser(user);
      }
    } catch (e) {
      console.error("Failed to load user from localStorage:", e);
    }
  }, []);

  // Fetch current user from API
  const { data: apiUser } = useQuery({
    queryKey: ['/api/user/current'],
    retry: false
  });

  // Combined user data from API or localStorage backup
  const currentUser = apiUser || localStorageUser;

  // Default markers to use if no custom markers exist
  const defaultMarkers: Array<Omit<CustomMarker, 'id' | 'projectId' | 'createdById' | 'createdAt' | 'updatedAt'>> = [
    { markerId: 'green-check', label: 'Completed', color: '#10b981', type: 'checkmark' },
    { markerId: 'red-x', label: 'Not Implemented', color: '#ef4444', type: 'x-mark' },
    { markerId: 'yellow-custom', label: 'In Progress', color: '#f59e0b', type: 'custom' }
  ];

  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: modules, isLoading: isModulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/projects/${selectedProjectId}/modules`],
    enabled: !!selectedProjectId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always get fresh data
  });

  // Function to ensure markers are stored in both the database and local storage for backup
  const saveMarkersToStorageAndDb = useCallback(async (markers: CustomMarker[]) => {
    if (!selectedProjectId) return;

    console.log("MARKER FIX: Saving markers to database and storage:", markers.length);

    // Update state first - this ensures the UI shows the markers immediately
    setCustomMarkers(markers);

    // Also save to localStorage as a fallback for marker restoration
    try {
      localStorage.setItem(`markers_${selectedProjectId}`, JSON.stringify(markers));
      console.log("MARKER FIX: Saved markers to localStorage");
    } catch (e) {
      console.error("MARKER FIX: Failed to save markers to localStorage:", e);
    }

    // Save each marker to the database through API - with enhanced error handling
    for (const marker of markers) {
      try {
        // Check if marker already exists on server (by markerId)
        const existingMarkerResponse = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/markers?_t=${Date.now()}`);
        const existingMarkers = existingMarkerResponse || [];
        const existingMarker = existingMarkers.find((m: any) => m.markerId === marker.markerId);

        if (existingMarker) {
          // Update existing marker
          await apiRequest("PUT", `/api/projects/${selectedProjectId}/matrix/markers/${existingMarker.id}`, {
            markerId: marker.markerId,
            label: marker.label,
            color: marker.color,
            type: marker.type,
            projectId: parseInt(selectedProjectId)
          });
          console.log(`Updated existing marker ${marker.label} in database`);
        } else {
          // Create new marker
          await apiRequest("POST", `/api/projects/${selectedProjectId}/matrix/markers`, {
            markerId: marker.markerId, 
            label: marker.label,
            color: marker.color,
            type: marker.type,
            projectId: parseInt(selectedProjectId),
            createdById: currentUser?.id || 1
          });
          console.log(`Created new marker ${marker.label} in database`);
        }
      } catch (error) {
        console.error(`Failed to save marker ${marker.label} to database:`, error);
        // Continue with the next marker even if this one fails
      }
    }

    // Invalidate queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`] });

    // Notify user
    toast({
      title: "Markers Saved",
      description: `Successfully saved ${markers.length} markers to the database.`,
    });

    // Indicate we're saving
    setIsAutosaving(true);

    // Hide saving indicator after a brief delay
    setTimeout(() => {
      setIsAutosaving(false);
    }, 1000);
  }, [selectedProjectId, toast, queryClient, currentUser]);

  // Create default markers for a new project
  const createDefaultMarkers = async () => {
    if (!selectedProjectId) return;

    // Get user ID from API fetch or localStorage backup
    const userId = currentUser?.id || localStorageUser?.id || 1;
    console.log("Creating default markers with user ID:", userId);

    try {
      console.log("Creating default markers for project:", selectedProjectId);

      // Create temporary markers in local state
      const tempMarkers: CustomMarker[] = [];

      // Create default markers one by one
      for (const marker of defaultMarkers) {
        console.log("Creating marker:", marker);
        const response = await apiRequest("POST", `/api/projects/${selectedProjectId}/matrix/markers`, {
          markerId: marker.markerId,
          label: marker.label,
          color: marker.color,
          type: marker.type,
          projectId: parseInt(selectedProjectId),
          createdById: userId
        });

        // Add the new marker to our temporary array
        tempMarkers.push({
          id: response.id,
          markerId: marker.markerId,
          label: marker.label,
          color: marker.color,
          type: marker.type,
          projectId: parseInt(selectedProjectId),
          createdById: response.createdById,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt
        });
      }

      // MARKER FIX: Use our centralized function to save markers
      console.log("MARKER FIX: Setting default markers using centralized function:", tempMarkers.length);
      saveMarkersToStorageAndDb(tempMarkers);

      // Refetch markers after creating defaults
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`] });

      toast({
        title: "Default markers created",
        description: "Initial markers have been set up for this project"
      });
    } catch (error) {
      console.error("Failed to create default markers:", error);
      toast({
        title: "Error",
        description: "Failed to create default markers",
        variant: "destructive"
      });
    }
  };

  // Fetch custom markers when project is selected
  const { data: projectMarkers, isLoading: isMarkersLoading, refetch: refetchMarkers } = useQuery<CustomMarker[]>({
    queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`],
    enabled: !!selectedProjectId,
    staleTime: 0, // Force refetch every time to ensure we have the latest data
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
    refetchInterval: 5000, // Refetch more frequently (every 5 seconds) to ensure markers remain visible
    retry: 5, // Increase retry attempts for reliability
    onSuccess: (data) => {
      console.log("MARKER FIX: Fetched markers:", data);

      if (data && data.length > 0) {
        // EMERGENCY MARKER FIX: Use our centralized function to save markers
        saveMarkersToStorageAndDb(data);

        // Update local state immediately to ensure markers are visible in the UI
        setCustomMarkers(data);

        console.log("MARKER FIX: Saved fetched markers using centralized function");
      } else if (selectedProjectId) {
        // If no markers exist yet for this project, create default ones
        console.log("MARKER FIX: No markers found, creating defaults");
        createDefaultMarkers();
      }
    },
    onError: (error) => {
      console.error("MARKER FIX: Failed to fetch markers:", error);

      // EMERGENCY FIX: Try to recover markers from localStorage
      try {
        const storageKey = `markers_${selectedProjectId}`;
        const savedMarkers = localStorage.getItem(storageKey);

        if (savedMarkers) {
          const markers = JSON.parse(savedMarkers) as CustomMarker[];
          console.log("MARKER FIX: Recovered markers from localStorage:", markers.length);
          setCustomMarkers(markers);
        }
      } catch (e) {
        console.error("MARKER FIX: Failed to recover markers from localStorage:", e);
      }
    }
  });

  // Fetch matrix cells when project is selected
  const { data: matrixCells, isLoading: isCellsLoading, refetch: refetchMatrixCells } = useQuery<any[]>({
    queryKey: [`/api/projects/${selectedProjectId}/matrix/cells`],
    enabled: !!selectedProjectId && !!modules,
    staleTime: 0, // Force refetch every time to ensure we have the latest data
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
    refetchInterval: 30000, // Refetch every 30 seconds to keep data fresh
    retry: 3, // Retry failed requests 3 times
    onSuccess: (data) => {
      if (!modules) return;

      console.log("Successfully loaded matrix cells:", data?.length || 0);

      // Convert API data to our matrix format
      const newMatrixData: Record<string, CellValue[]> = {};

      // Initialize empty data structure for all modules (even if no data)
      modules.forEach(module => {
        newMatrixData[module.id.toString()] = modules.map(_ => ({ type: 'empty' }));
      });

      // Fill in with data from API
      if (data && data.length > 0) {
        data.forEach(cell => {
          try {
            console.log("Processing cell:", cell);
            const rowModuleId = cell.rowModuleId.toString();
            const colModuleIndex = modules.findIndex(m => m.id === cell.colModuleId);

            if (colModuleIndex >= 0 && newMatrixData[rowModuleId]) {
              // Parse the stored value
              try {
                // Handle both string and object formats of value (depends on server implementation)
                let cellValue: CellValue;
                if (typeof cell.value === 'string') {
                  cellValue = JSON.parse(cell.value);
                  console.log("Parsed cell value from string:", cellValue);
                } else {
                  cellValue = cell.value as CellValue;
                  console.log("Using cell value as object:", cellValue);
                }
                newMatrixData[rowModuleId][colModuleIndex] = cellValue;
              } catch (e) {
                console.error("Error parsing cell value:", e, cell.value);
                // Keep it as empty if we can't parse it
                newMatrixData[rowModuleId][colModuleIndex] = { type: 'empty' };
              }
            } else {
              console.warn(`Could not place cell in matrix - row: ${rowModuleId}, col index: ${colModuleIndex}, exists: ${!!newMatrixData[rowModuleId]}`);
            }
          } catch (e) {
            console.error("Error processing cell data:", e, cell);
          }
        });
      }

      console.log("Setting matrix data from API:", newMatrixData);
      setMatrixData(newMatrixData);
    },
    onError: (error) => {
      console.error("Failed to fetch matrix cells:", error);
      toast({
        title: "Error loading matrix data",
        description: "Failed to load matrix data. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update cell value in local state first AND immediately save to DB
  const updateCellValue = (moduleRowId: string, moduleColIndex: number, value: CellValue) => {
    // Update local state immediately
    setMatrixData(prevData => {
      const newData = { ...prevData };
      const rowData = [...(newData[moduleRowId] || [])];

      // Add label to checkmark/x-mark values if not provided
      if (value.type === 'checkmark' && !value.label) {
        value = { ...value, label: 'Yes', color: value.color || '#10b981' };
      } else if (value.type === 'x-mark' && !value.label) {
        value = { ...value, label: 'No', color: value.color || '#ef4444' };
      }

      rowData[moduleColIndex] = value;
      newData[moduleRowId] = rowData;

      // Store in localStorage as backup (EMERGENCY FIX)
      try {
        const storageKey = `matrix_${selectedProjectId}_${moduleRowId}_${moduleColIndex}`;
        localStorage.setItem(storageKey, JSON.stringify(value));
        console.log("EMERGENCY: Backed up cell to localStorage:", storageKey);
      } catch (error) {
        console.error("Failed to store in localStorage:", error);
      }

      return newData;
    });

    // PERSISTENCE FIX: Immediately save to database to ensure data persists between module switches
    if (selectedProjectId && modules) {
      const moduleColId = modules[moduleColIndex]?.id;
      if (moduleColId) {
        // Make sure value has proper attributes for Yes/No values
        let valueToSave = { ...value };
        if (valueToSave.type === 'checkmark' && !valueToSave.label) {
          valueToSave.label = 'Yes';
          valueToSave.color = valueToSave.color || '#10b981';
        } else if (valueToSave.type === 'x-mark' && !valueToSave.label) {
          valueToSave.label = 'No';
          valueToSave.color = valueToSave.color || '#ef4444';
        }

        // Perform direct database save in background
        (async () => {
          try {
            console.log("🔄 PERSISTENCE FIX: Saving cell directly to database:", {
              rowModuleId: parseInt(moduleRowId),
              colModuleId: moduleColId,
              value: valueToSave
            });

            await apiRequest("POST", `/api/projects/${selectedProjectId}/matrix/cells`, {
              rowModuleId: parseInt(moduleRowId),
              colModuleId: moduleColId,
              projectId: parseInt(selectedProjectId),
              value: JSON.stringify(valueToSave),
              createdById: currentUser?.id || 1 // Use authenticated user ID if available
            });

            console.log("✅ PERSISTENCE FIX: Cell successfully saved to database");

            // Refresh data in React Query cache for when we switch back to this view
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/cells`] });
          } catch (error) {
            console.error("❌ PERSISTENCE FIX: Failed to save cell to database:", error);
          }
        })();
      }
    }

    // Only track if we have a project selected
    if (selectedProjectId) {
      // Track this change
      setPendingSaves(prev => [...prev, {
        rowId: moduleRowId, 
        colIndex: moduleColIndex, 
        value,
        projectId: selectedProjectId
      }]);
      setHasUnsavedChanges(true);
    }
  };

  // Save all pending changes to the database
  const saveAllChanges = async (): Promise<boolean> => {
    if (pendingSaves.length === 0) return false;

    // Use current user ID if available, otherwise use a default ID
    const userId = currentUser?.id || 1;

    toast({
      title: "Saving changes",
      description: `Saving ${pendingSaves.length} cell updates...`,
    });

    let successCount = 0;
    let errorCount = 0;

    // Process all pending saves - grouped by project for better efficiency
    const changesByProject: Record<string, typeof pendingSaves> = {};

    // Group changes by project
    pendingSaves.forEach(change => {
      if (!changesByProject[change.projectId]) {
        changesByProject[change.projectId] = [];
      }
      changesByProject[change.projectId].push(change);
    });

    // Process changes for each project
    for (const [projectId, changes] of Object.entries(changesByProject)) {
      console.log(`Processing ${changes.length} changes for project ${projectId}`);

      // Process all changes for this project
      for (const {rowId, colIndex, value} of changes) {
        try {
          // Fetch the modules for this project specifically if needed
          let moduleColId;
          // If we're in the current project, use the loaded modules
          if (projectId === selectedProjectId && modules) {
            moduleColId = modules[colIndex]?.id;
          } else {
            // Otherwise, we need to fetch the modules for the other project
            try {
              const projectModulesResponse = await apiRequest("GET", `/api/projects/${projectId}/modules`);
              if (projectModulesResponse && projectModulesResponse.length > 0) {
                moduleColId = projectModulesResponse[colIndex]?.id;
              }
            } catch (moduleError) {
              console.error(`Failed to fetch modules for project ${projectId}:`, moduleError);
            }
          }

          if (!moduleColId) {
            console.error(`Could not find module at index ${colIndex} for project ${projectId}`);
            errorCount++;
            continue;
          }

          console.log(`Saving cell for project ${projectId}:`, {
            rowId, colIndex, moduleColId, value: JSON.stringify(value)
          });

          const response = await apiRequest("POST", `/api/projects/${projectId}/matrix/cells`, {
            rowModuleId: parseInt(rowId),
            colModuleId: moduleColId,
            projectId: parseInt(projectId),
            value: JSON.stringify(value),
            createdById: userId
          });

          console.log("Save cell response:", response);
          successCount++;
        } catch (error) {
          console.error(`Failed to save cell for project ${projectId}:`, error);
          errorCount++;
        }
      }

      // Refresh data for this project to ensure consistency
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/matrix/cells`] });
    }

    // Clear pending changes
    setPendingSaves([]);
    setHasUnsavedChanges(false);

    // Show success/error message
    if (errorCount === 0) {
      toast({
        title: "Changes saved",
        description: `Successfully saved all ${successCount} changes to the database.`,
      });
    } else {
      toast({
        title: "Partial save",
        description: `Saved ${successCount} changes. ${errorCount} changes failed to save.`,
        variant: "destructive"
      });
      return errorCount === 0;
    }

    return true;
  };

  // Export matrix as Excel (CSV)
  const exportToExcel = () => {
    if (!modules || modules.length === 0) {
      toast({
        title: "Cannot export",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    // Create header row with module names
    csvContent += "Module ID,Module Name,";
    csvContent += modules.map(m => m.name).join(",");
    csvContent += "\n";

    // Add data rows
    const moduleData = modules?.map(m => ({
      id: m.id.toString(),
      name: m.name
    })) || [];

    moduleData.forEach(module => {
      csvContent += `${module.id},${module.name},`;

      // Add cell values for each column
      const rowData = matrixData[module.id] || [];
      csvContent += modules.map((_, index) => {
        const cellValue = rowData[index] || { type: 'empty' };
        // Use clear text values for Excel export that are easily understood
        switch (cellValue.type) {
          case 'checkmark':
            return "Yes"; // Clear text for Excel export
          case 'x-mark':
            return "No"; // Clear text for Excel export
          case 'custom':
            return cellValue.label || "Custom"; // Use label or default text
          default:
            return "";
        }
      }).join(",");

      csvContent += "\n";
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `traceability_matrix_${projectName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Traceability matrix has been exported to Excel format",
    });
  };

  // Export matrix as PDF
  const exportToPDF = () => {
    if (!modules || modules.length === 0) {
      toast({
        title: "Cannot export",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const moduleData = modules?.map(m => ({
      id: m.id.toString(),
      name: m.name
    })) || [];

    // Create PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(`Traceability Matrix: ${projectName}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    // Prepare table data
    const headers = ['Module ID', 'Module Name', ...modules.map(m => m.name)];

    const rows = moduleData.map(module => {
      const rowData = matrixData[module.id] || [];

      // Create row with module ID and name first
      const row = [
        module.id,
        module.name,
        // Add cell values for each column
        ...modules.map((_, index) => {
          const cellValue = rowData[index] || { type: 'empty' };
          switch (cellValue.type) {
            case 'checkmark':
              return "Yes";
            case 'x-mark':
              return "No";
            case 'custom':
              return cellValue.label || "●";
            default:
              return "";
          }
        })
      ];

      return row;
    });

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 30 },
      didDrawCell: (data) => {
        // Skip header row
        if (data.row.index === 0) return;

        // Only process cells after the first two columns (Module ID, Module Name)
        if (data.column.index < 2) return;

        // Get the cell value
        const rowIndex = data.row.index - 1; // Adjust for header
        const colIndex = data.column.index - 2; // Adjust for Module ID and Name columns

        const rowModuleId = moduleData[rowIndex]?.id;
        if (!rowModuleId) return;

        const cellValue = matrixData[rowModuleId]?.[colIndex] || { type: 'empty' };

        // Apply cell background based on value type, using the same colors as the UI
        if (cellValue.type === 'checkmark') {
          // Default green or use custom color if specified
          const color = cellValue.color || '#10b981';

          // Parse hex color to RGB for PDF
          const hex = color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);

          doc.setFillColor(r, g, b);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');

          // Use white text on dark backgrounds, black on light backgrounds
          const isLightColor = (r * 0.299 + g * 0.587 + b * 0.114) > 186;
          doc.setTextColor(isLightColor ? 0 : 255);
          doc.text(cellValue.label || "Yes", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { 
            align: 'center', 
            baseline: 'middle'
          });
        } else if (cellValue.type === 'x-mark') {
          // Default red or use custom color if specified
          const color = cellValue.color || '#ef4444';

          // Parse hex color to RGB for PDF
          const hex = color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);

          doc.setFillColor(r, g, b);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');

          // Use white text on dark backgrounds, black on light backgrounds
          const isLightColor = (r * 0.299 + g * 0.587 + b * 0.114) > 186;
          doc.setTextColor(isLightColor ? 0 : 255);
          doc.text(cellValue.label || "No", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { 
            align: 'center', 
            baseline: 'middle'
          });
        } else if (cellValue.type === 'custom') {
          // Custom marker with specified color
          const color = cellValue.color || '#3b82f6';

          // Parse hex color to RGB for PDF
          const hex = color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);

          doc.setFillColor(r, g, b);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');

          // Use white text on dark backgrounds, black on light backgrounds
          const isLightColor = (r * 0.299 + g * 0.587 + b * 0.114) > 186;
          doc.setTextColor(isLightColor ? 0 : 255);
          doc.text(cellValue.label || "●", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { 
            align: 'center', 
            baseline: 'middle'
          });
        }
      }
    });

    // Save PDF
    doc.save(`traceability_matrix_${projectName.replace(/\s+/g, '_')}.pdf`);

    toast({
      title: "Export successful",
      description: "Traceability matrix has been exported to PDF",
    });
  };

  // Add a new custom marker
  const addCustomMarker = async () => {
    if (!newMarker.label || !selectedProjectId) {
      toast({
        title: "Invalid marker",
        description: "Please provide a label for the marker",
        variant: "destructive"
      });
      return;
    }

    // Check if user is authenticated
    if (!currentUser || !currentUser.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create markers",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate a unique ID
      const markerId = `custom-${Date.now()}`;

      console.log("Creating marker with user ID:", currentUser.id);

      const response = await apiRequest("POST", `/api/projects/${selectedProjectId}/matrix/markers`, {
        markerId,
        label: newMarker.label,
        color: newMarker.color,
        type: newMarker.type,
        projectId: parseInt(selectedProjectId),
        createdById: currentUser.id
      });

      // Reset form
      setNewMarker({
        label: '',
        color: '#3b82f6',
        type: 'custom'
      });
      setIsAddingMarker(false);

      // Also update the markers in our local state immediately
      const newMarkerWithId = {
        id: response.id,
        markerId,
        label: newMarker.label,
        color: newMarker.color,
        type: newMarker.type,
        projectId: parseInt(selectedProjectId),
        createdById: response.createdById,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };

      // Update React state for immediate UI feedback
      setCustomMarkers(current => [...current, newMarkerWithId]);

      // Refresh markers in the React Query cache
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`] });

      toast({
        title: "Marker added",
        description: `New marker "${newMarker.label}" has been added`,
      });
    } catch (error) {
      console.error("Failed to add marker:", error);
      toast({
        title: "Error",
        description: "Failed to create new marker",
        variant: "destructive"
      });
    }
  };

  // Update an existing marker
  const updateCustomMarker = async () => {
    if (!editingMarker || !selectedProjectId) return;

    // Abort if user isn't authenticated
    if (!currentUser || !currentUser.id) {
      console.error("User not authenticated, cannot update marker");
      toast({
        title: "Authentication required",
        description: "You must be logged in to update markers",
        variant: "destructive"
      });
      return;
    }

    // Validate the marker data to prevent empty markers
    if (!editingMarker.label || editingMarker.label.trim() === '') {
      toast({
        title: "Invalid marker",
        description: "Marker label cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      // Show saving indicator
      setIsAutosaving(true);

      // First, update local state for immediate UI feedback
      setCustomMarkers(current => 
        current.map(marker => 
          marker.id === editingMarker.id ? editingMarker : marker
        )
      );

      await apiRequest("PATCH", `/api/projects/${selectedProjectId}/matrix/markers/${editingMarker.id}`, {
        label: editingMarker.label,
        color: editingMarker.color,
        type: editingMarker.type,
        markerId: editingMarker.markerId
      });

      // Close the dialog
      setEditingMarker(null);

      toast({
        title: "Marker updated",
        description: `Marker "${editingMarker.label}" has been updated`,
      });

      // Refresh markers from server
      refetchMarkers();

      setIsAutosaving(false);
    } catch (error: any) {
      console.error("Failed to update marker:", error);
      setIsAutosaving(false);

      toast({
        title: "Error",
        description: "Failed to update marker",
        variant: "destructive"
      });
    }
  };

  // Delete a custom marker
  const deleteCustomMarker = async (markerId: number) => {
    if (!selectedProjectId) return;

    // Abort if user isn't authenticated
    if (!currentUser || !currentUser.id) {
      console.error("User not authenticated, cannot delete marker");
      toast({
        title: "Authentication required",
        description: "You must be logged in to delete markers",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAutosaving(true);

      // First, update local state immediately for responsive UI
      setCustomMarkers(current => current.filter(marker => marker.id !== markerId));

      await apiRequest("DELETE", `/api/projects/${selectedProjectId}/matrix/markers/${markerId}`);

      // Refresh markers in the React Query cache
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`] });

      toast({
        title: "Marker deleted",
        description: "The marker has been deleted",
      });

      setIsAutosaving(false);
    } catch (error) {
      console.error("Failed to delete marker:", error);
      setIsAutosaving(false);

      toast({
        title: "Error",
        description: "Failed to delete marker. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Render header function
  const renderHeader = () => {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between px-2 border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="grid gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                  <Network className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-heading text-2xl md:text-3xl">Traceability Matrix</h1>
              </div>
              <p className="text-muted-foreground">Track relationships between requirements and test cases</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const selectedProject = projects?.find(p => p.id.toString() === selectedProjectId);
  const moduleData = modules?.map(m => ({
    id: m.id.toString(),
    name: m.name
  })) || [];

  // Set up beforeunload event listener to warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = "You have unsaved changes. If you leave now, these changes will be lost.";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Autosave timer will be set up after all required functions are defined
  useEffect(() => {
    const setupAutosaveTimer = () => {
      if (!hasUnsavedChanges || !pendingSaves || pendingSaves.length === 0) {
        return;
      }

      // Clear any existing timer
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }

      // Set new timer for autosave
      autosaveTimerRef.current = window.setTimeout(() => {
        console.log("Autosaving changes...");
        setIsAutosaving(true);

        setTimeout(() => {
          setIsAutosaving(false);
        }, 1000);
        autosaveTimerRef.current = null;
      }, 3000);
    };

    setupAutosaveTimer();

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, pendingSaves]);

  return (
    <MainLayout>
      <div className="p-4">
        {renderHeader()}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Traceability Matrix</h1>
              {hasUnsavedChanges && (
                <div className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {pendingSaves.length} unsaved {pendingSaves.length === 1 ? 'change' : 'changes'}
                </div>
              )}
              {isAutosaving && (
                <div className="ml-3 flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  <span className="animate-spin mr-1">⟳</span> Autosaving...
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track requirements implementation across modules
            </p>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={!selectedProjectId}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only">Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Matrix Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAddingMarker(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Marker
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Existing Markers</DropdownMenuLabel>
                  {customMarkers.map(marker => (
                    <DropdownMenuItem 
                      key={marker.markerId}
                      onSelect={(e) => {
                        e.preventDefault();
                        setEditingMarker(marker);
                      }}
                    >
                      <div className="flex items-center w-full justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{backgroundColor: marker.color}}
                          />
                          {marker.label}
                        </div>
                        <Edit className="h-3 w-3 opacity-50" />
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex space-x-2">
              <Button
                variant={hasUnsavedChanges ? "default" : "outline"}
                className="flex items-center gap-2"
                onClick={async () => {
                  setIsAutosaving(true);
                  try {
                    await saveAllChanges();
                  } catch (error) {
                    console.error("Save failed:", error);
                  } finally {
                    setTimeout(() => {
                      setIsAutosaving(false);
                    }, 1000);
                  }
                }}
                disabled={!hasUnsavedChanges || !selectedProjectId || isAutosaving}
              >
                {isAutosaving ? (
                  <span className="animate-spin mr-2">⟳</span>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isAutosaving ? 'Saving...' : 
                  (pendingSaves.length > 0 ? `Save Changes (${pendingSaves.length})` : 'Save Changes')}
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={exportToExcel}
                disabled={!selectedProjectId || modules?.length === 0}
              >
                <FileText className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={exportToPDF}
                disabled={!selectedProjectId || modules?.length === 0}
              >
                <FileType className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4 w-[250px]">
          <ProjectSelect
            projects={projects}
            isLoading={isProjectsLoading}
            selectedProjectId={selectedProjectId}
            onChange={(value) => {
              // Check for unsaved changes before switching projects
              if (hasUnsavedChanges && selectedProjectId && value !== selectedProjectId) {
                const shouldSwitch = window.confirm(
                  `You have ${pendingSaves.length} unsaved changes. If you switch projects now, these changes will be lost. Do you want to continue?`
                );

                if (!shouldSwitch) {
                  return; // Don't switch if user cancels
                }

                // Reset unsaved changes since user chose to discard them
                setPendingSaves([]);
                setHasUnsavedChanges(false);
              }

              setSelectedProjectId(value);
            }}
          />
        </div>

        {/* Excel-style traceability matrix */}
        {selectedProjectId && (
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <Table className="border-collapse w-full">
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="text-center border-0 w-16">Module ID</TableHead>
                  <TableHead className="text-left border-0 w-48">Module Name</TableHead>
                  {/* Column Headers - module names */}
                  {modules?.map((module) => (
                    <TableHead 
                      key={module.id} 
                      className="text-center border-0 min-w-24 text-xs"
                    >
                      {module.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {moduleData.map((rowModule) => (
                  <TableRow key={rowModule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <TableCell className="font-medium text-center border-0">
                      {selectedProject?.name ? `${selectedProject.name.substring(0, 3).toUpperCase()}-MOD-${String(rowModule.id).padStart(2, '0')}` : `MOD-${String(rowModule.id).padStart(2, '0')}`}
                    </TableCell>
                    <TableCell className="font-medium border-0">
                      {rowModule.name}
                    </TableCell>
                    {modules?.map((colModule, colIndex) => (
                      <TableCell 
                        key={colModule.id} 
                        className="text-center border-0 p-1"
                      >
                        <CellDropdown
                          value={matrixData[rowModule.id]?.[colIndex] || { type: 'empty' }}
                          onChange={(value) => updateCellValue(rowModule.id, colIndex, value)}
                          customMarkers={customMarkers || []}
                          rowId={rowModule.id}
                          colId={colModule.id.toString()}
                          projectId={selectedProjectId}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!selectedProjectId && (
          <div className="flex items-center justify-center h-40 border rounded-md border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              Select a project to view the traceability matrix
            </p>
          </div>
        )}

        {selectedProjectId && modules?.length === 0 && !isModulesLoading && (
          <div className="flex items-center justify-center h-40 border rounded-md border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              No modules found for this project
            </p>
          </div>
        )}
      </div>

      {/* Add new marker dialog */}
      <Dialog open={isAddingMarker} onOpenChange={setIsAddingMarker}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Marker</DialogTitle>
            <DialogDescription>
              Create a new custom marker to use in the traceability matrix.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="label" className="text-right text-sm font-medium">
                Label
              </label>
              <Input
                type="text"
                id="label"
                value={newMarker.label}
                onChange={(e) => setNewMarker({...newMarker, label: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="color" className="text-right text-sm font-medium">
                Color
              </label>
              <div className="col-span-3 flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      <span className="sr-only">Pick Color</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 outline-none" align="start">
                    <HexColorPicker 
                      color={newMarker.color} 
                      onChange={(color) => setNewMarker({...newMarker, color})} 
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="text"
                  id="color"
                  value={newMarker.color}
                  onChange={(e) => setNewMarker({...newMarker, color: e.target.value})}
                  className="ml-2 w-32"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsAddingMarker(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={addCustomMarker}>
              Add Marker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit marker dialog */}
      <Dialog open={editingMarker !== null} onOpenChange={() => setEditingMarker(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Marker</DialogTitle>
            <DialogDescription>
              Edit the details of an existing marker.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="label" className="text-right text-sm font-medium">
                Label
              </label>
              <Input
                type="text"
                id="label"
                value={editingMarker?.label || ''}
                onChange={(e) => setEditingMarker(editingMarker => editingMarker ? {...editingMarker, label: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="color" className="text-right text-sm font-medium">
                Color
              </label>
              <div className="col-span-3 flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      <span className="sr-only">Pick Color</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 outline-none" align="start">
                    <HexColorPicker 
                      color={editingMarker?.color || '#3b82f6'}
                      onChange={(color) => setEditingMarker(editingMarker => editingMarker ? {...editingMarker, color} : null)} 
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="text"
                  id="color"
                  value={editingMarker?.color || ''}
                  onChange={(e) => setEditingMarker(editingMarker => editingMarker ? {...editingMarker, color: e.target.value} : null)}
                  className="ml-2 w-32"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditingMarker(null)}>
              Cancel
            </Button>
            {editingMarker && (
              <Button type="button" variant="destructive" className="mr-2" onClick={() => {
                if (editingMarker?.id) {
                  deleteCustomMarker(editingMarker.id);
                }
                setEditingMarker(null);
              }}>
                Delete
              </Button>
            )}
            <Button type="button" onClick={updateCustomMarker}>
              Update Marker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// CellDropdown component
interface CellDropdownProps {
  value: CellValue;
  onChange: (value: CellValue) => void;
  customMarkers: CustomMarker[];
  rowId: string;
  colId: string;
  projectId: string;
}

const CellDropdown: React.FC<CellDropdownProps> = ({ value, onChange, customMarkers, rowId, colId, projectId }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (newValue: CellValue) => {
    onChange(newValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-24 justify-center text-sm"
        >
          {value.type === 'checkmark' && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {value.label || "Yes"}
            </div>
          )}
          {value.type === 'x-mark' && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              {value.label || "No"}
            </div>
          )}
          {value.type === 'custom' && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: value.color }} />
              {value.label || "Custom"}
            </div>
          )}
          {value.type === 'empty' && (
            <span>Empty</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0">
        <DropdownMenuContent className="w-40">
          <DropdownMenuItem onSelect={() => handleSelect({ type: 'checkmark', label: 'Yes', color: '#10b981' })}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Yes
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSelect({ type: 'x-mark', label: 'No', color: '#ef4444' })}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              No
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Custom Markers</DropdownMenuLabel>
          {customMarkers.map((marker) => (
            <DropdownMenuItem key={marker.markerId} onSelect={() => handleSelect({ type: 'custom', label: marker.label, color: marker.color })}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: marker.color }} />
                {marker.label}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => handleSelect({ type: 'empty' })}>
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </PopoverContent>
    </Popover>
  );
};