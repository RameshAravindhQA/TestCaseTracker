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

  // Autosave timer will be set up after all required functions are defined
  useEffect(() => {
    // Function to setup autosave timer - we'll call this after all dependencies are defined
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

        // We'll call saveAllChanges manually later when it's defined
        setTimeout(() => {
          setIsAutosaving(false);
        }, 1000);
        autosaveTimerRef.current = null;
      }, 3000); // Autosave after 3 seconds of inactivity
    };

    // Set up the timer
    setupAutosaveTimer();

    return () => {
      // Clear timer on cleanup
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges]);

  // Set up beforeunload event listener to warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // This message might not be displayed verbatim (browsers use their own messages)
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
  const [newMarker, setNewMarker] = useState<Omit<CustomMarker, 'id' | 'markerId' | 'projectId' | 'createdById' | 'createdAt' | 'updatedAt'>>({
    label: '',
    color: '#3b82f6',
    type: 'custom'
  });
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [editingMarker, setEditingMarker] = useState<CustomMarker | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    onSuccess: (data) => {
      if (selectedProjectId && projects) {
        const project = projects.find(p => p.id.toString() === selectedProjectId);
        if (project) {
          setProjectName(project.name);
        }

        // When modules load, force refetch of matrix cells to ensure latest data
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/cells`] });
      }
    }
  });

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

  // Once we have modules, initialize matrix data and load it from the database
  useEffect(() => {
    if (modules && modules.length > 0 && selectedProjectId) {
      console.log("📢 PERSISTENCE FIX: Loading matrix cells for project", selectedProjectId);

      // First initialize with empty structure
      const initialData: Record<string, CellValue[]> = {};
      modules.forEach(rowModule => {
        initialData[rowModule.id.toString()] = modules.map(_ => ({ type: 'empty' }));
      });

      // Then load data from database
      const loadCellsFromDatabase = async () => {
        try {
          const response = await fetch(`/api/projects/${selectedProjectId}/matrix/cells`);
          if (response.ok) {
            const cellsData = await response.json();
            console.log(`✅ PERSISTENCE FIX: Loaded ${cellsData.length} matrix cells from database`);

            // Update the initial data with values from database
            cellsData.forEach(cell => {
              try {
                const rowId = cell.rowModuleId.toString();
                // Find the corresponding column index
                const colModule = modules.find(m => m.id === cell.colModuleId);
                if (colModule) {
                  const colIndex = modules.findIndex(m => m.id === colModule.id);
                  if (colIndex !== -1 && initialData[rowId] && colIndex < initialData[rowId].length) {
                    // IMPORTANT FIX: More robust parsing with fallback
                    let value: CellValue = { type: 'empty' };
                    try {
                      // Try to parse the value from the database
                      value = JSON.parse(cell.value);

                      // Special fix for Yes/No values to ensure they don't disappear
                      if (value.type === 'checkmark') {
                        value = {
                          type: 'checkmark',
                          color: value.color || '#10b981', // Use default color if missing
                          label: value.label || 'Yes'
                        };
                      } else if (value.type === 'x-mark') {
                        value = {
                          type: 'x-mark',
                          color: value.color || '#ef4444', // Use default color if missing
                          label: value.label || 'No'
                        };
                      }
                    } catch (parseError) {
                      console.error("Failed to parse cell value:", parseError);
                      // Use default Yes value if parsing failed and value contains "Yes"
                      if (cell.value && cell.value.includes("Yes")) {
                        value = { type: 'checkmark', color: '#10b981', label: 'Yes' };
                      }
                    }

                    // Update the value at the specific index
                    initialData[rowId][colIndex] = value;
                  }
                }
              } catch (e) {
                console.error("Error handling cell value:", e);
              }
            });

            // Now set the matrix data with both empty cells and loaded values
            setMatrixData(initialData);
          } else {
            console.error("Failed to load matrix cells:", response.statusText);
            // Still set the matrix data with empty cells
            setMatrixData(initialData);
          }
        } catch (error) {
          console.error("Error loading matrix cells:", error);
          // Still set the matrix data with empty cells
          setMatrixData(initialData);
        }
      };

      loadCellsFromDatabase();
    }
  }, [modules, selectedProjectId]);

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

  // Recovery function for matrix cells to ensure they persist when switching modules
  useEffect(() => {
    if (!selectedProjectId || !modules || modules.length === 0) {
      return;
    }

    const recoverMatrixCells = async () => {
      console.log("Starting matrix cell recovery process...");

      // Force reload matrix data from API first
      try {
        const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/cells`);
        console.log(`Loaded ${response?.length || 0} cells from API`);

        if (response && Array.isArray(response) && response.length > 0) {
          // Create matrix data structure
          const recoveredData: Record<string, CellValue[]> = {};

          // Initialize with empty cells
          modules.forEach(module => {
            recoveredData[module.id.toString()] = modules.map(_ => ({ type: 'empty' }));
          });

          // Fill in with data from API
          response.forEach(cell => {
            try {
              const rowModuleId = cell.rowModuleId.toString();
              const colModuleIndex = modules.findIndex(m => m.id === cell.colModuleId);

              if (colModuleIndex >= 0 && recoveredData[rowModuleId]) {
                // Parse the stored value
                try {
                  let cellValue: CellValue;
                  if (typeof cell.value === 'string') {
                    cellValue = JSON.parse(cell.value);
                  } else {
                    cellValue = cell.value as CellValue;
                  }
                  recoveredData[rowModuleId][colModuleIndex] = cellValue;
                  console.log(`Recovered cell: row=${rowModuleId}, col=${colModuleIndex}, type=${cellValue.type}`);
                } catch (e) {
                  console.error("Error parsing cell value:", e);
                }
              }
            } catch (e) {
              console.error("Error processing cell during recovery:", e);
            }
          });

          // Update the matrix data
          setMatrixData(recoveredData);
          console.log("Matrix data recovery complete");
        }
      } catch (error) {
        console.error("Failed to load matrix cells from API during recovery:", error);
      }

      // Check for any backed up cells in IndexedDB
      try {
        if (window.indexedDB) {
          const request = window.indexedDB.open("traceabilityMatrixCellsDB", 1);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('cells')) {
              db.createObjectStore('cells', { keyPath: 'id' });
            }
          };

          request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['cells'], 'readonly');
            const store = transaction.objectStore('cells');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
              const backupCells = getAllRequest.result;
              console.log(`Found ${backupCells.length} backed up cells in IndexedDB`);

              if (backupCells.length > 0) {
                setMatrixData(prevData => {
                  const newData = { ...prevData };

                  backupCells.forEach(cell => {
                    if (cell.projectId === selectedProjectId) {
                      const rowId = cell.rowModuleId;
                      const colModuleId = cell.colModuleId;
                      const colIndex = modules.findIndex(m => m.id === colModuleId);

                      if (colIndex >= 0 && newData[rowId]) {
                        newData[rowId][colIndex] = cell.value;
                        console.log(`Restored cell from IndexedDB: row=${rowId}, col=${colIndex}`);
                      }
                    }
                  });

                  return newData;
                });
              }

              db.close();
            };

            getAllRequest.onerror = (error) => {
              console.error("Error loading backup cells from IndexedDB:", error);
              db.close();
            };
          };
        }
      } catch (e) {
        console.error("Error recovering from IndexedDB:", e);
      }

      // Check localStorage recovery list as last resort
      try {
        const recoveryList = JSON.parse(localStorage.getItem('matrix_cell_recovery_list') || '[]');
        if (recoveryList.length > 0) {
          console.log(`Found ${recoveryList.length} cells in recovery list`);

          // Process all recovery items
          recoveryList.forEach(key => {
            try {
              const cellBackup = JSON.parse(localStorage.getItem(key) || 'null');
              if (cellBackup && cellBackup.projectId === selectedProjectId) {
                const rowId = cellBackup.rowModuleId;
                const colModuleId = cellBackup.colModuleId;
                const colIndex = modules.findIndex(m => m.id === colModuleId);

                // Update the matrix data with this backup
                if (colIndex >= 0) {
                  setMatrixData(prevData => {
                    const newData = { ...prevData };
                    if (newData[rowId]) {
                      newData[rowId][colIndex] = cellBackup.value;
                      console.log(`Restored cell from localStorage: row=${rowId}, col=${colIndex}`);
                    }
                    return newData;
                  });

                  // Also try to save it to the database
                  if (cellBackup.pendingSave && currentUser) {
                    console.log(`Attempting to save recovered cell to database: ${key}`);
                    apiRequest("POST", `/api/projects/${selectedProjectId}/matrix/cells`, {
                      rowModuleId: parseInt(rowId),
                      colModuleId: colModuleId,
                      projectId: parseInt(selectedProjectId),
                      value: JSON.stringify(cellBackup.value),
                      createdById: currentUser?.id || 1
                    }).then(() => {
                      console.log(`Successfully saved recovered cell to database: ${key}`);
                      // Remove from recovery list after successful save
                      const updatedList = JSON.parse(localStorage.getItem('matrix_cell_recovery_list') || '[]')
                        .filter(k => k !== key);
                      localStorage.setItem('matrix_cell_recovery_list', JSON.stringify(updatedList));
                      localStorage.removeItem(key);
                    }).catch(e => {
                      console.error(`Failed to save recovered cell to database: ${key}`, e);
                    });
                  }
                }
              }
            } catch (e) {
              console.error(`Error processing recovery item ${key}:`, e);
            }
          });
        }
      } catch (error) {
        console.error("Error checking localStorage recovery list:", error);
      }
    };

    // Run the recovery process
    recoverMatrixCells();

  }, [selectedProjectId, modules]);

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

    // After saving to database, also keep localStorage backup
    try {
      // Use both the regular key and a special global key for extra redundancy
      const storageKey = `markers_${selectedProjectId}`;
      localStorage.setItem(storageKey, JSON.stringify(markers));

      // Also store in a global marker database
      const allMarkersDb = JSON.parse(localStorage.getItem('all_project_markers') || '{}');
      allMarkersDb[selectedProjectId] = markers;
      localStorage.setItem('all_project_markers', JSON.stringify(allMarkersDb));

      console.log("Saved markers to localStorage as backup");
    } catch (error) {
      console.error("Failed to save markers to localStorage:", error);
    }

    // IndexedDB backup for more persistent storage
    try {
      if (window.indexedDB) {
        const request = window.indexedDB.open("traceabilityMatrixMarkersDB", 1);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          // Always recreate store to ensure correct schema
          if (db.objectStoreNames.contains('markers')) {
            db.deleteObjectStore('markers');
          }
          db.createObjectStore('markers', { 
            keyPath: 'projectId',
            autoIncrement: false 
          });
        };

        request.onerror = (event) => {
          console.error("Database error:", event);
        };

        request.onsuccess = (event) => {
          try {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create transaction and store data
            const transaction = db.transaction(['markers'], 'readwrite');
            const store = transaction.objectStore('markers');

            const storeRequest = store.put({
              projectId: selectedProjectId,
              markers: markers,
              timestamp: new Date().toISOString()
            });

            storeRequest.onsuccess = () => {
              console.log("Successfully stored markers in IndexedDB");
              db.close();
            };

            storeRequest.onerror = (error) => {
              console.error("Error storing markers:", error);
              db.close();
            };
          } catch (error) {
            console.error("IndexedDB error:", error);
          }
        };
      }
    } catch (error) {
      console.error("Failed to save to IndexedDB:", error);
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
  }, [selectedProjectId, toast, queryClient]);

  // EMERGENCY FIX FOR MARKERS: Add effect to load markers from multiple storage sources on component mount
  useEffect(() => {
    if (selectedProjectId) {
      let foundMarkers = false;
      let loadedMarkers: CustomMarker[] | null = null;

      console.log("MARKER FIX: Attempting to recover markers for project:", selectedProjectId);

      // Step 1: Try to load from localStorage first
      try {
        const storageKey = `markers_${selectedProjectId}`;
        const savedMarkers = localStorage.getItem(storageKey);

        if (savedMarkers) {
          loadedMarkers = JSON.parse(savedMarkers) as CustomMarker[];
          console.log("MARKER FIX: Recovered markers from localStorage:", loadedMarkers?.length || 0);
          foundMarkers = true;
        }
      } catch (error) {
        console.error("MARKER FIX: Failed to load markers from localStorage:", error);
      }

      // Step 2: If not found in localStorage, try global marker database
      if (!foundMarkers) {
        try {
          const allMarkersDb = JSON.parse(localStorage.getItem('all_project_markers') || '{}');
          if (allMarkersDb[selectedProjectId]) {
            loadedMarkers = allMarkersDb[selectedProjectId] as CustomMarker[];
            console.log("MARKER FIX: Recovered markers from global database:", loadedMarkers?.length || 0);
            foundMarkers = true;
          }
        } catch (error) {
          console.error("MARKER FIX: Failed to load markers from global database:", error);
        }
      }

      // Step 3: If still not found, try IndexedDB
      if (!foundMarkers) {
        try {
          if (window.indexedDB) {
            const request = window.indexedDB.open("traceabilityMatrixMarkersDB", 1);

            // Add the missing onupgradeneeded handler to create the store
            request.onupgradeneeded = (event) => {
              const db = (event.target as IDBOpenDBRequest).result;
              if (!db.objectStoreNames.contains('markers')) {
                console.log("Creating markers store in IndexedDB");
                db.createObjectStore('markers', { keyPath: 'projectId' });
              }
            };

            request.onsuccess = (event) => {
              try {
                const db = (event.target as IDBOpenDBRequest).result;
                // Only try to access the store if it exists
                if (db.objectStoreNames.contains('markers')) {
                  const transaction = db.transaction(['markers'], 'readonly');
                  const store = transaction.objectStore('markers');
                  const getRequest = store.get(selectedProjectId);

                  // Move the success handler inside the if block to fix the error
                  getRequest.onsuccess = () => {
                    if (getRequest.result) {
                      loadedMarkers = getRequest.result.markers as CustomMarker[];
                      console.log("MARKER FIX: Recovered markers from IndexedDB:", loadedMarkers?.length || 0);

                      // Update state and other storages for consistency
                      if (loadedMarkers && loadedMarkers.length > 0) {
                        setCustomMarkers(loadedMarkers);

                        // Also save back to localStorage for redundancy
                        try {
                          const storageKey = `markers_${selectedProjectId}`;
                          localStorage.setItem(storageKey, JSON.stringify(loadedMarkers));
                        } catch (e) {
                          console.error("MARKER FIX: Failed to update localStorage after IndexedDB recovery:", e);
                        }
                      }
                    }
                    db.close();
                  };

                  // Move the error handler inside too
                  getRequest.onerror = (err) => {
                    console.error("MARKER FIX: Error getting markers from IndexedDB:", err);
                    db.close();
                  };
                } else {
                  console.log("Markers store doesn't exist yet");
                  // Close the database connection if we're not using it
                  db.close();
                }
              } catch (error) {
                console.log("Safe IndexedDB access failed:", error);
              }
            };

            request.onerror = (event) => {
              console.error("MARKER FIX: Error opening IndexedDB:", event);
            };
          }
        } catch (error) {
          console.error("MARKER FIX: Failed to load from IndexedDB:", error);
        }
      }

      // If we found markers in any of the local storages, update the state
      if (foundMarkers && loadedMarkers && loadedMarkers.length > 0) {
        console.log("MARKER FIX: Setting recovered markers to state:", loadedMarkers.length);
        setCustomMarkers(loadedMarkers);
      }
    }
  }, [selectedProjectId]);

  // EMERGENCY FIX - Ensure we always reload matrix data when returning to the page
  // This fixes the issue where cell values reset when navigating away and back
  useEffect(() => {
    if (selectedProjectId && modules && modules.length > 0) {
      console.log("EMERGENCY FIX: Forcing refresh of matrix data");

      // First, initialize with empty cells
      const newMatrixData: Record<string, CellValue[]> = {};
      modules.forEach(module => {
        newMatrixData[module.id.toString()] = modules.map(_ => ({ type: 'empty' }));
      });

      // STEP 1: Try to recover from localStorage first (most immediate data)
      try {
        console.log("EMERGENCY FIX: Attempting to recover from localStorage");

        // Loop through all modules to check if we have stored values
        let localStorageRecoveryCount = 0;

        modules.forEach(rowModule => {
          const rowId = rowModule.id.toString();

          modules.forEach((colModule, colIndex) => {
            const storageKey = `matrix_${selectedProjectId}_${rowId}_${colIndex}`;
            const storedValue = localStorage.getItem(storageKey);

            if (storedValue) {
              try {
                const cellValue = JSON.parse(storedValue) as CellValue;
                newMatrixData[rowId][colIndex] = cellValue;
                localStorageRecoveryCount++;
              } catch (e) {
                console.error("EMERGENCY FIX: Failed to parse localStorage value:", e);
              }
            }
          });
        });

        if (localStorageRecoveryCount > 0) {
          console.log(`EMERGENCY FIX: Recovered ${localStorageRecoveryCount} cells from localStorage`);
        }
      } catch (error) {
        console.error("EMERGENCY FIX: Error recovering from localStorage:", error);
      }

      // STEP 2: Also fetch from the database to get any server-side changes
      const fetchLatestData = async () => {
        try {
          // Direct API call to get the latest data - use a unique timestamp to avoid caching
          const timestamp = new Date().getTime();
          const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/cells?_t=${timestamp}`);

          if (response && Array.isArray(response)) {
            console.log("EMERGENCY FIX: Got fresh data with", response.length, "cells from server");

            // Fill in with actual data from server, preserving localStorage values if they exist
            response.forEach(cell => {
              try {
                const rowModuleId = cell.rowModuleId.toString();
                const colModuleIndex = modules.findIndex(m => m.id === cell.colModuleId);

                if (colModuleIndex >= 0 && newMatrixData[rowModuleId]) {
                  // Only overwrite if not already populated from localStorage
                  if (newMatrixData[rowModuleId][colModuleIndex].type === 'empty') {
                    let cellValue: CellValue;
                    if (typeof cell.value === 'string') {
                      cellValue = JSON.parse(cell.value);
                    } else {
                      cellValue = cell.value as CellValue;
                    }
                    newMatrixData[rowModuleId][colModuleIndex] = cellValue;
                  }
                }
              } catch (e) {
                console.error("EMERGENCY FIX: Error processing cell:", e);
              }
            });
          }
        } catch (error) {
          console.error("EMERGENCY FIX: Failed to fetch latest matrix data:", error);
          toast({
            title: "Warning",
            description: "Could not fetch the latest matrix data from server. Some recent changes might not be visible.",
            variant: "destructive"
          });
        } finally {
          // Update the state with the combined data (localStorage + server)
          setMatrixData(newMatrixData);
          console.log("EMERGENCY FIX: Updated matrix data with all recovered values");
        }
      };

      // Execute the fetch
      fetchLatestData();

      // Also trigger a normal refetch via React Query for good measure
      if (refetchMatrixCells) {
        refetchMatrixCells();
      }

      // MARKER FIX: Also ensure we reload the markers
      try {
        console.log("MARKER FIX: Forcing refresh of markers");

        // Try to recover from localStorage first
        const storageKey = `markers_${selectedProjectId}`;
        const savedMarkers = localStorage.getItem(storageKey);

        if (savedMarkers) {
          try {
            const markers = JSON.parse(savedMarkers) as CustomMarker[];
            console.log("MARKER FIX: Recovered markers from localStorage:", markers.length);
            setCustomMarkers(markers);
          } catch (e) {
            console.error("MARKER FIX: Failed to parse localStorage markers:", e);
          }
        }

        // Also fetch from server
        const fetchLatestMarkers = async () => {
          try {
            // Direct API call with cache-busting timestamp
            const timestamp = new Date().getTime();
            const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/markers?_t=${timestamp}`);

            if (response && Array.isArray(response) && response.length > 0) {
              console.log("MARKER FIX: Got fresh markers from server:", response.length);
              setCustomMarkers(response);

              // Update localStorage
              localStorage.setItem(storageKey, JSON.stringify(response));
            }
          } catch (error) {
            console.error("MARKER FIX: Failed to fetch latest markers:", error);
          }
        };

        // Execute marker fetch
        fetchLatestMarkers();

        // Also trigger the normal query refetch
        if (refetchMarkers) {
          refetchMarkers();
        }
      } catch (error) {
        console.error("MARKER FIX: Error during marker recovery:", error);
      }
    }
  }, [selectedProjectId, modules]);

  // Actual autosave functionality - this will be triggered when pendingSaves changes
  // and saveAllChanges is available
  useEffect(() => {
    // Don't do anything if no pending saves or no unsaved changes
    if (!hasUnsavedChanges || pendingSaves.length === 0 || !isAutosaving) {
      return;
    }

    // We have pending saves and the save function is available, so let's use it
    console.log("Running actual autosave with saveAllChanges function");

    // Create a timeout to avoid immediate execution
    const timer = setTimeout(async () => {
      try {
        await saveAllChanges();
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        setIsAutosaving(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pendingSaves, hasUnsavedChanges, isAutosaving]);

  // Filter modules if needed
  const moduleData = modules?.map(m => ({
    id: m.id.toString(),
    name: m.name
  })) || [];

  // pendingSaves and hasUnsavedChanges are already declared at the top

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

      // Immediately save this change to the database
      // Don't wait for autosave or manual save
      if (modules) {
        const moduleColId = modules[moduleColIndex]?.id;
        if (moduleColId) {
          console.log("EMERGENCY: Immediately saving cell to database");

          // Implement a reliable save with retry mechanism
          (async () => {
            const saveCell = async (attempt = 1, maxAttempts = 3) => {
              try {
                console.log(`Saving cell (attempt ${attempt}/${maxAttempts}): Row=${moduleRowId}, Col=${moduleColId}`);

                // Create a unique identifier for this cell to track it in logs
                const cellId = `${moduleRowId}_${moduleColId}`;

                // First try to get the existing cell to see if we need to update or create
                try {
                  const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/cells?rowModuleId=${moduleRowId}&colModuleId=${moduleColId}`);

                  if (response && response.length > 0) {
                    // Update existing cell
                    console.log(`Updating existing cell ${cellId}`);
                  } else {
                    // Create new cell
                    console.log(`Creating new cell ${cellId}`);
                  }
                } catch (err) {
                  console.log(`Error checking cell existence, will create new: ${err}`);
                }

                // Now save the cell with retries
                const result = await apiRequest("POST", `/api/projects/${selectedProjectId}/matrix/cells`, {
                  rowModuleId: parseInt(moduleRowId),
                  colModuleId: moduleColId,
                  projectId: parseInt(selectedProjectId),
                  value: JSON.stringify(value),
                  createdById: currentUser?.id || 1
                });

                // Force reload matrix data after successful save
                queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/cells`] });

                console.log(`Cell ${cellId} saved successfully`, result);

                // After saving, create a more permanent backup in IndexedDB
                try {
                  if (window.indexedDB) {
                    const request = window.indexedDB.open("traceabilityMatrixCellsDB", 1);

                    request.onupgradeneeded = (event) => {
                      const db = (event.target as IDBOpenDBRequest).result;
                      if (!db.objectStoreNames.contains('cells')) {
                        db.createObjectStore('cells', { keyPath: 'id' });
                      }
                    };

                    request.onsuccess = (event) => {
                      const db = (event.target as IDBOpenDBRequest).result;
                      const transaction = db.transaction(['cells'], 'readwrite');
                      const store = transaction.objectStore('cells');

                      store.put({
                        id: `${selectedProjectId}_${moduleRowId}_${moduleColId}`,
                        rowModuleId: moduleRowId,
                        colModuleId: moduleColId,
                        projectId: selectedProjectId,
                        value: value,
                        savedAt: new Date().toISOString()
                      });

                      db.close();
                    };
                  }
                } catch (e) {
                  console.error("Error backing up to IndexedDB:", e);
                }

              } catch (error) {
                console.error(`Failed to save cell (attempt ${attempt}/${maxAttempts}):`, error);

                // Retry if we haven't exceeded max attempts
                if (attempt < maxAttempts) {
                  console.log(`Retrying save... (${attempt + 1}/${maxAttempts})`);
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                  return saveCell(attempt + 1, maxAttempts);
                } else {
                  // Max retries exceeded, save to localStorage as ultimate backup
                  console.error("Max retry attempts exceeded, saving to localStorage as backup");
                  try {
                    const cellBackup = {
                      rowModuleId: moduleRowId,
                      colModuleId: moduleColId,
                      projectId: selectedProjectId,
                      value: value,
                      timestamp: new Date().toISOString(),
                      pendingSave: true
                    };
                    const backupKey = `matrix_cell_backup_${selectedProjectId}_${moduleRowId}_${moduleColId}`;
                    localStorage.setItem(backupKey, JSON.stringify(cellBackup));

                    // Add to a recovery list that can be processed on next load
                    const recoveryList = JSON.parse(localStorage.getItem('matrix_cell_recovery_list') || '[]');
                    recoveryList.push(backupKey);
                    localStorage.setItem('matrix_cell_recovery_list', JSON.stringify(recoveryList));

                    console.log("Cell backup saved to localStorage recovery list");
                  } catch (e) {
                    console.error("Ultimate backup to localStorage failed:", e);
                  }
                }
              }
            };

            // Start the save process
            await saveCell();
          })();
        }
      }
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
    if (errorCount === 0){
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

  // Save matrix data to backend - Now enhanced with autosave indicators
  const saveMatrixUpdate = async (moduleRowId: string, moduleColIndex: number, value: CellValue) => {
    if (!selectedProjectId || !modules) return;

    // Abort if user isn't authenticated
    if (!currentUser || !currentUser.id) {
      console.error("User not authenticated, cannot save matrix cell");
      toast({
        title: "Authentication required",
        description: "You must be logged in to update the matrix",
        variant: "destructive"
      });
      return;
    }

    try {
      // Show saving indicator
      setIsAutosaving(true);

      const moduleColId = modules[moduleColIndex]?.id;
      if (!moduleColId) {
        throw new Error("Module column not found");
      }

      // Save the cell value with debugging for easier troubleshooting
      console.log("Saving individual matrix cell:", {
        rowModuleId: parseInt(moduleRowId),
        colModuleId: moduleColId,
        projectId: parseInt(selectedProjectId),
        value: value,
        userID: currentUser.id
      });

      // Perform the save operation
      const response = await apiRequest("POST", `/api/projects/${selectedProjectId}/matrix/cells`, {
        rowModuleId: parseInt(moduleRowId),
        colModuleId: moduleColId,
        projectId: parseInt(selectedProjectId),
        value: JSON.stringify(value), // Must stringify before sending to server
        createdById: currentUser.id
      });

      console.log("Save response:", response);

      // Update local matrix data immediately to ensure it's reflected in the UI
      setMatrixData(prevData => {
        const newData = { ...prevData };
        const rowData = [...(newData[moduleRowId] || [])];
        rowData[moduleColIndex] = value;
        newData[moduleRowId] = rowData;
        return newData;
      });

      // Explicitly trigger a data refresh to ensure we have the latest data
      const refreshResponse = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/cells`);
      console.log("Refreshed matrix data:", refreshResponse);

      // Invalidate the cache to refresh data in React Query
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/cells`] });

      // Show success message
      toast({
        title: "Cell updated",
        description: "Matrix cell saved successfully",
      });

      // Remove this cell from pending saves if it exists
      setPendingSaves(prev => prev.filter(
        save => !(save.rowId === moduleRowId && save.colIndex === moduleColIndex && save.projectId === selectedProjectId)
      ));

      // Update unsaved changes status if we've saved all changes
      if (pendingSaves.length <= 1) {
        setHasUnsavedChanges(false);
      }

    } catch (error: any) {
      console.error("Failed to update matrix:", error);

      // Show a more specific error message if available
      const errorMessage = error?.message || "Failed to save matrix cell";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Add more detailed logging
      if (error?.response) {
        console.error("Server response:", error.response);
      }
    } finally {
      // Always hide the saving indicator, even if there was an error
      setTimeout(() => {
        setIsAutosaving(false);
      }, 1000); // Keep visible briefly for UI feedback
    }
  };

  // Save project name
  const saveProjectName = async () => {
    if (!selectedProjectId) return;

    try {
      await apiRequest("PATCH", `/api/projects/${selectedProjectId}`, {
        name: projectName
      });

      setIsEditingName(false);
      toast({
        title: "Project name updated",
        description: "Project name has been saved successfully",
      });
    } catch (error) {
      console.error("Failed to update project name:", error);
      toast({
        title: "Failed to update project name",
        description: "An error occurred while saving the project name",
        variant: "destructive"
      });
    }
  };

  // Cancel editing project name
  const cancelEditProjectName = () => {
    if (selectedProjectId && projects) {
      const project = projects.find(p => p.id.toString() === selectedProjectId);
      if (project) {
        setProjectName(project.name);
      }
    }
    setIsEditingName(false);
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
           const color = value.color || '#10b981';

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
          const color = value.color || '#ef4444';

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
          const color = value.color || '#3b82f6';

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
        } else if (cellValue.type === 'custom' && cellValue.color) {
          // Parse hex color to RGB
          const hex = cellValue.color.replace('#', '');
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

  // Fetch current user from API
  const { data: apiUser } = useQuery({
    queryKey: ['/api/user/current'],
    retry: false
  });

  // Combined user data from API or localStorage backup
  const currentUser = apiUser || localStorageUser;

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

      // DB PERSISTENCE FIX: Ensuring markers are properly stored in the database
      console.log("DB PERSISTENCE: Adding new marker to database and state:", newMarkerWithId);

      // 1. Update React state for immediate UI feedback
      setCustomMarkers(current => [...current, newMarkerWithId]);

      // 2. Use the centralized function to save the complete marker collection to the database
      try {
        // First get the complete list of markers including the new one
        const allMarkers = [...customMarkers, newMarkerWithId];

        // Then save them all to the database using our centralized function
        // This ensures all markers are properly stored in the database
        saveMarkersToStorageAndDb(allMarkers);

        console.log("DB PERSISTENCE: Saved all markers to database, total:", allMarkers.length);
      } catch (e) {
        console.error("DB PERSISTENCE: Failed to save markers to database:", e);
      }

      // 3. Force a direct refresh from the server to ensure everything is in sync
      (async () => {
        try {
          console.log("PERSISTENCE FIX: Directly refreshing markers from server");
          const refreshResponse = await fetch(`/api/projects/${selectedProjectId}/matrix/markers?_t=${Date.now()}`, {
            credentials: 'include'
          });

          if (refreshResponse.ok) {
            const freshMarkers = await refreshResponse.json();
            if (freshMarkers && Array.isArray(freshMarkers)) {
              console.log("PERSISTENCE FIX: Got fresh markers:", freshMarkers.length);
              setCustomMarkers(freshMarkers);
              localStorage.setItem(`markers_${selectedProjectId}`, JSON.stringify(freshMarkers));
            }
          }
        } catch (e) {
          console.error("PERSISTENCE FIX: Failed to refresh markers:", e);
        }
      })();

      // 4. Refresh markers in the React Query cache
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

      console.log("UPDATE FIX: Updating marker with ID:", editingMarker.id);

      // For safety, ensure we keep the existing markerId when updating
      console.log("UPDATE FIX: Marker details:", {
        id: editingMarker.id,
        markerId: editingMarker.markerId,
        label: editingMarker.label,
        color: editingMarker.color,
        type: editingMarker.type
      });

      // First, update local state for immediate UI feedback
      setCustomMarkers(current => 
        current.map(marker => 
          marker.id === editingMarker.id ? editingMarker : marker
        )
      );

      // Save to localStorage as a backup
      try {
        const allMarkers = customMarkers.map(marker => 
          marker.id === editingMarker.id ? editingMarker : marker
        );

        const storageKey = `markers_${selectedProjectId}`;
        localStorage.setItem(storageKey, JSON.stringify(allMarkers));
        console.log("UPDATE FIX: Backed up updated marker to localStorage");
      } catch (error) {
        console.error("UPDATE FIX: Failed to backup marker to localStorage:", error);
      }

      try {
        console.log("UPDATE FIX: Making PATCH request to server");

        // Use fetch directly for more control and better error handling
        const response = await fetch(`/api/projects/${selectedProjectId}/matrix/markers/${editingMarker.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            label: editingMarker.label,
            color: editingMarker.color,
            type: editingMarker.type,
            markerId: editingMarker.markerId // Keep the existing markerId
          }),
          credentials: 'include'
        });

        console.log("UPDATE FIX: Server response status:", response.status);

        if (response.ok) {
          const updatedMarker = await response.json();
          console.log("UPDATE FIX: Successfully updated marker:", updatedMarker);

          // Close the dialog
          setEditingMarker(null);

          toast({
            title: "Marker updated",
            description: `Marker "${editingMarker.label}" has been updated`,
          });

          // Refresh markers from server
          refetchMarkers();
        } else if (response.status === 404) {
          console.log("UPDATE FIX: Marker not found (404). Creating a new one instead.");

          // Create a new marker with the same properties
          const createResponse = await fetch(`/api/projects/${selectedProjectId}/matrix/markers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              label: editingMarker.label,
              color: editingMarker.color,
              type: editingMarker.type,
              markerId: editingMarker.markerId || `marker-${Date.now()}`,
              projectId: parseInt(selectedProjectId),
              createdById: currentUser.id
            }),
            credentials: 'include'
          });

          if (createResponse.ok) {
            const newMarker = await createResponse.json();
            console.log("UPDATE FIX: Successfully recreated missing marker:", newMarker);

            // Close the dialog
            setEditingMarker(null);

            toast({
              title: "Marker updated",
              description: `Marker "${editingMarker.label}" has been updated`,
            });

            // Refresh markers from server
            refetchMarkers();
          } else {
            const errorText = await createResponse.text();
            throw new Error(`Failed to create marker: ${errorText}`);
          }
        } else {
          const errorText = await response.text();
          throw new Error(`Update failed with status ${response.status}: ${errorText}`);
        }
      } catch (error: any) {
        console.error("UPDATE FIX: Error during marker update/create:", error);
        throw error; // Re-throw to be handled by the outer catch
      }

      // Refresh markers in React Query cache
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`] });
    } catch (error: any) {
      console.error("Failed to update/create marker:", error);

      // Show a more specific error message if available
      const errorMessage = error?.message || "Failed to update marker";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Add more detailed logging
      if (error?.response) {
        console.error("Server response:", error.response);
      }

      // Make sure to clear the autosaving state
      setIsAutosaving(false);
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
      console.log("DELETE FIX: Deleting marker with ID:", markerId);
      setIsAutosaving(true); // Show the autosaving indicator

      // First, update local state immediately for responsive UI
      setCustomMarkers(current => current.filter(marker => marker.id !== markerId));

      // Also clean up local storage to prevent resurrection of deleted markers
      try {
        const storageKey = `markers_${selectedProjectId}`;
        const existingMarkers = localStorage.getItem(storageKey);
        if (existingMarkers) {
          const parsedMarkers = JSON.parse(existingMarkers);
          const filteredMarkers = parsedMarkers.filter((marker: any) => marker.id !== markerId);
          localStorage.setItem(storageKey, JSON.stringify(filteredMarkers));
          console.log("DELETE FIX: Removed deleted marker from localStorage");
        }
      } catch (e) {
        console.error("DELETE FIX: Failed to update localStorage after deletion:", e);
      }

      // Then make the actual DELETE request to server
      console.log("DELETE FIX: Sending DELETE request to server");
      const deleteResponse = await fetch(`/api/projects/${selectedProjectId}/matrix/markers/${markerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log("DELETE FIX: Server response status:", deleteResponse.status);

      // Accept both 200 (success) and 404 (already deleted) as successful outcomes
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        console.error("DELETE FIX: Server error response:", errorText);
        throw new Error(`Delete request failed with status ${deleteResponse.status}: ${errorText}`);
      }

      console.log("DELETE FIX: Delete request successful");

      // Force a refresh of markers from the server to ensure our state is in sync
      try {
        const refreshResponse = await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/markers?_t=${Date.now()}`);
        if (refreshResponse && Array.isArray(refreshResponse)) {
          setCustomMarkers(refreshResponse);
          localStorage.setItem(`markers_${selectedProjectId}`, JSON.stringify(refreshResponse));
        }
      } catch (e) {
        console.error("DELETE FIX: Failed to refresh markers after deletion:", e);
      }

      // Refresh markers in the React Query cache
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/matrix/markers`] });

      toast({
        title: "Marker deleted",
        description: "The marker has been deleted",
      });

      setIsAutosaving(false); // Hide the autosaving indicator
    } catch (error) {
      console.error("DELETE FIX: Failed to delete marker:", error);
      setIsAutosaving(false); // Hide the autosaving indicator

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

          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Requirements
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Mapping
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Matrix View
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
  };

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

          <div className="mt-4 sm:mt-0 space-x-2 flex">
            {/* Save changes button - only enabled when there are unsaved changes */}
            <Button
              variant={hasUnsavedChanges ? "default" : "outline"}
              className="flex items-center gap-2"
              onClick={async () => {
                setIsAutosaving(true);
                try {
                  // EMERGENCY FIX: Display a clear message to the user
                  toast({
                    title: "Saving your changes",
                    description: "Please wait while we save all your cell values to the database...",
                  });

                  // EMERGENCY FIX: First, ensure everything is saved to localStorage as backup
                  if (modules && selectedProjectId) {
                    pendingSaves.forEach(save => {
                      try {
                        const storageKey = `matrix_${save.projectId}_${save.rowId}_${save.colIndex}`;
                        localStorage.setItem(storageKey, JSON.stringify(save.value));
                      } catch (e) {
                        console.error("EMERGENCY FIX: Failed to save to localStorage:", e);
                      }
                    });
                  }

                  // Normal save process
                  const saveResult = await saveAllChanges();

                  // EMERGENCY FIX: Force a database refresh after saving
                  if (saveResult && selectedProjectId) {
                    try {
                      await apiRequest("GET", `/api/projects/${selectedProjectId}/matrix/cells?_force=true&_t=${Date.now()}`);
                      console.log("EMERGENCY FIX: Forced refresh after save");
                    } catch (e) {
                      console.error("EMERGENCY FIX: Refresh after save failed:", e);
                    }
                  }

                  // EMERGENCY FIX: Clear notification
                  toast({
                    title: "Save complete",
                    description: "All your changes have been saved to the database and backed up locally.",
                  });
                } catch (error) {
                  console.error("Save failed:", error);
                  toast({
                    title: "Save error",
                    description: "We had trouble saving some changes. Your data has been backed up locally.",
                    variant: "destructive"
                  });
                } finally {
                  // Keep autosave indicator visible briefly
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
              <DropdownMenuContent align="end">
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

        {/* Project Name - Editable */}
        {selectedProjectId && (
          <div className="mb-6">
            {isEditingName ? (
              <div className="flex items-center">
                <Input
                  className="max-w-md"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={saveProjectName}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={cancelEditProjectName}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center">
                <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {projectName}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={() => setIsEditingName(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Excel-style traceability matrix */}
        {selectedProjectId && (
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <Table className="border-collapse w-full">
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="w-24 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 sticky left-0 z-20 font-bold text-gray-700 dark:text-gray-300">
                    Module ID
                  </TableHead>
                  <TableHead className="w-48 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 sticky left-24 z-20 font-bold text-gray-700 dark:text-gray-300">
                    Module Name
                  </TableHead>
                  {/* Column Headers - module names */}
                  {modules?.map((module) => (
                    <TableHead 
                      key={module.id} 
                      className="border border-gray-200 dark:border-gray-700 p-2 min-w-[100px] text-center font-bold text-gray-700 dark:text-gray-300"
                    >
                      {module.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {moduleData.map((rowModule) => (
                  <TableRow key={rowModule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <TableCell className="border border-gray-200 dark:border-gray-700 p-2 text-center sticky left-0 z-10 bg-white dark:bg-gray-900">
                      {rowModule.id}
                    </TableCell>
                    <TableCell className="border border-gray-200 dark:border-gray-700 p-2 sticky left-24 z-10 bg-white dark:bg-gray-900">
                      {rowModule.name}
                    </TableCell>
                    {modules?.map((colModule, colIndex) => (
                      <TableCell 
                        key={colModule.id} 
                        className="border border-gray-200 dark:border-gray-700 p-0 text-center h-9"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Marker</DialogTitle>
            <DialogDescription>
              Create a new marker for the traceability matrix cells.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="marker-label" className="text-right font-medium">
                Label
              </label>
              <Input
                id="marker-label"
                value={newMarker.label}
                onChange={(e) => setNewMarker({...newMarker, label: e.target.value})}
                className="col-span-3"
                placeholder="e.g. In Progress"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="marker-color"className="text-right font-medium pt-2">
                Color
              </label>
              <div className="col-span-3">
                <HexColorPicker 
                  color={newMarker.color} 
                  onChange={(color) => setNewMarker({...newMarker, color})} 
                />
                <Input
                  value={newMarker.color}
                  onChange={(e) => setNewMarker({...newMarker, color: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="marker-type" className="text-right font-medium">
                Type
              </label>
              <div className="col-span-3">
                {/* Only show Custom marker type option - removing checkmark and X as requested */}
                <input type="hidden" name="marker-type" value="custom" />
                <Button 
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  <div className="mr-2 w-4 h-4 rounded-full bg-current" />
                  Custom Marker
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingMarker(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomMarker}>Add Marker</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit marker dialog */}
      <Dialog open={!!editingMarker} onOpenChange={(open) => !open && setEditingMarker(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Marker</DialogTitle>
            <DialogDescription>
              Modify the selected marker.
            </DialogDescription>
          </DialogHeader>

          {editingMarker && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-marker-label" className="text-right font-medium">
                  Label
                </label>
                <Input
                  id="edit-marker-label"
                  value={editingMarker.label}
                  onChange={(e) => setEditingMarker({...editingMarker, label: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="edit-marker-color" className="text-right font-medium pt-2">
                  Color
                </label>
                <div className="col-span-3">
                  <HexColorPicker 
                    color={editingMarker.color} 
                    onChange={(color) => setEditingMarker({...editingMarker, color})} 
                  />
                  <Input
                    value={editingMarker.color}
                    onChange={(e) => setEditingMarker({...editingMarker, color: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-marker-type" className="text-right font-medium">
                  Type
                </label>
                <div className="col-span-3">
                  {/* Only show Custom marker type when editing - removing checkmark and X mark as requested */}
                  <input type="hidden" name="edit-marker-type" value="custom" />
                  <Button 
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => setEditingMarker({...editingMarker, type: 'custom'})}
                  >
                    <div className="mr-2 w-4 h-4 rounded-full bg-current" />
                    Custom Marker
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (editingMarker) {
                  deleteCustomMarker(editingMarker.id);
                  setEditingMarker(null);
                }
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div>
              <Button variant="outline" onClick={() => setEditingMarker(null)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={updateCustomMarker}>Update</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// Cell dropdown component for selecting cell values
function CellDropdown({ 
  value, 
  onChange,
  customMarkers,
  rowId,
  colId,
  projectId
}: { 
  value: CellValue; 
  onChange: (value: CellValue) => void;
  customMarkers: CustomMarker[];
  rowId: string;
  colId: string;
  projectId: string;
}) {
  // Direct save function to ensure persistence
  const saveCellToDatabase = async (newValue: CellValue) => {
    if (!projectId) return;

    // First update the UI
    onChange(newValue);

    console.log(`⚠️ DIRECT FIX: Saving cell value directly to database: Row=${rowId}, Col=${colId}, Value=`, newValue);

    try {
            // Save to database
      const saveResponse = await apiRequest("POST", `/api/projects/${projectId}/matrix/cells`, {
        rowModuleId: parseInt(rowId),
        colModuleId: parseInt(colId),
        projectId: parseInt(projectId),
        value: JSON.stringify(newValue)
      });
      console.log("✅ DIRECT FIX: Cell saved successfully:", saveResponse);
    } catch (error) {
      console.error("❌ DIRECT FIX: Failed to save cell:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full h-9 p-0">
          {value.type === 'checkmark' ? (
            <CheckCircle className="mx-auto h-5 w-5" style={{ color: value.color }} />
          ) : value.type === 'x-mark' ? (
            <AlertCircle className="mx-auto h-5 w-5" style={{ color: value.color }} />
          ) : value.type === 'custom' ? (
            <div className="flex items-center justify-center">
              <span className="mx-auto" style={{ color: value.color }}>{value.label || "●"}</span>
            </div>
          ) : (
            <Clock className="mx-auto h-5 w-5 text-gray-400" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Select Value</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          const newValue: CellValue = { type: 'checkmark', color: '#10b981', label: 'Yes' };
          onChange(newValue);
          saveCellToDatabase(newValue);
        }}>
          <Check className="mr-2 h-4 w-4 text-green-500" />
          Yes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          const newValue: CellValue = { type: 'x-mark', color: '#ef4444', label: 'No' };
           onChange(newValue);
           saveCellToDatabase(newValue);
        }}>
          <X className="mr-2 h-4 w-4 text-red-500" />
          No
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Custom Markers</DropdownMenuLabel>
        {customMarkers.map(marker => (
          <DropdownMenuItem key={marker.markerId} onClick={() => {
             const newValue: CellValue = { type: 'custom', color: marker.color, label: marker.label };
             onChange(newValue);
             saveCellToDatabase(newValue);
          }}>
            <div className="flex items-center">
              <div className="mr-2 w-3 h-3 rounded-full" style={{ backgroundColor: marker.color }} />
              <span>{marker.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          const newValue: CellValue = { type: 'empty' };
          onChange(newValue);
          saveCellToDatabase(newValue);
        }}>
          Clear
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}