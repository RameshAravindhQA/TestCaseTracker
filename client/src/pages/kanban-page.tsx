import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { 
  Project, 
  Sprint, 
  KanbanColumn, 
  KanbanCard 
} from "@shared/schema";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { XYCoord } from "dnd-core";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  Edit,
  Plus, 
  RefreshCw,
  CalendarRange,
  CalendarDays,
  Layers,
  Palette,
  LayoutGrid,
  Filter,
  ListFilter,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Tag,
  User,
  X,
  Trash2,
  Pencil
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function to get the current user ID from session
const getUserData = async () => {
  try {
    const res = await fetch('/api/auth/user');
    if (res.ok) {
      const userData = await res.json();
      return userData.id;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Helper function to determine text color based on background color (for accessibility)
const getContrastColor = (hexColor: string) => {
  // If it's not a valid hex color, return black
  if (!/^#[0-9A-F]{6}$/i.test(hexColor)) return '#000000';

  // Convert hex to RGB
  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark colors and black for light colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export default function KanbanPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [newSprintDialogOpen, setNewSprintDialogOpen] = useState(false);
  const [editSprintDialogOpen, setEditSprintDialogOpen] = useState(false);
  const [deleteSprintDialogOpen, setDeleteSprintDialogOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<number | null>(null);
  const [editingSprint, setEditingSprint] = useState<{
    id: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null>(null);
  const [newColumnDialogOpen, setNewColumnDialogOpen] = useState(false);
  const [newCardDialogOpen, setNewCardDialogOpen] = useState(false);
  const [editCardDialogOpen, setEditCardDialogOpen] = useState(false);
  const [editColumnDialogOpen, setEditColumnDialogOpen] = useState(false);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);

  // For sub-card creation
  const [parentCardId, setParentCardId] = useState<number | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [currentAssigneeContext, setCurrentAssigneeContext] = useState<'new' | 'edit'>('new');
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  // This state is already defined above with the correct type
  const { toast } = useToast();

  // Function to get parent card title by ID
  const getParentCardTitle = (parentId: number): string => {
    if (!cards) return "Loading...";
    const parentCard = cards.find(card => card.id === parentId);
    return parentCard ? parentCard.title : "Unknown parent task";
  };

  // Function to fetch a single kanban card by ID
  const getKanbanCard = async (cardId: number): Promise<KanbanCard | null> => {
    try {
      const response = await fetch(`/api/kanban/cards/${cardId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch card");
      }
      const card = await response.json();
      return card;
    } catch (error) {
      console.error("Error fetching card:", error);
      return null;
    }
  };

  // Fetch projects list
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    onError: (error: Error) => {
      toast({
        title: "Error fetching projects",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Fetch sprints for selected project
  const { 
    data: sprints, 
    isLoading: isLoadingSprints 
  } = useQuery<Sprint[]>({
    queryKey: ["/api/sprints", selectedProjectId],
    enabled: !!selectedProjectId,
    onError: (error: Error) => {
      toast({
        title: "Error fetching sprints",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Fetch kanban columns for the selected sprint
  const { 
    data: columns, 
    isLoading: isLoadingColumns 
  } = useQuery<KanbanColumn[]>({
    queryKey: ["/api/kanban/columns", selectedProjectId, selectedSprintId],
    enabled: !!selectedProjectId && !!selectedSprintId,
    onError: (error: Error) => {
      toast({
        title: "Error fetching kanban columns",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Fetch all cards and organize them into a hierarchy
  const { 
    data: cards, 
    isLoading: isLoadingCards 
  } = useQuery<KanbanCard[]>({
    queryKey: ["/api/kanban/cards", selectedProjectId, selectedSprintId],
    enabled: !!selectedProjectId && !!selectedSprintId,
    queryFn: async () => {
      // Get all cards including sub-cards
      const response = await fetch(`/api/kanban/cards?projectId=${selectedProjectId}&sprintId=${selectedSprintId}`);
      const allCards = await response.json();
      
      // Group cards by column first
      const columnGroups = new Map<number, KanbanCard[]>();
      allCards.forEach((card: KanbanCard) => {
        if (!columnGroups.has(card.columnId)) {
          columnGroups.set(card.columnId, []);
        }
        columnGroups.get(card.columnId)?.push(card);
      });

      // Process each column's cards to create parent-child hierarchy
      const processedCards: KanbanCard[] = [];
      columnGroups.forEach((columnCards) => {
        // Create a map for parent cards in this column
        const parentMap = new Map<number, KanbanCard>();
        
        // First pass: identify parent cards
        columnCards.forEach(card => {
          if (!card.parentId) {
            parentMap.set(card.id, { ...card, subCards: [] });
          }
        });

        // Second pass: attach sub-cards to parents
        columnCards.forEach(card => {
          if (card.parentId && parentMap.has(card.parentId)) {
            const parent = parentMap.get(card.parentId);
            if (parent && parent.subCards) {
              parent.subCards.push(card);
            }
          }
        });

        // Add processed cards from this column to final result
        processedCards.push(...Array.from(parentMap.values()));
      });

      return processedCards;
    },
    onError: (error: Error) => {
      toast({
        title: "Error fetching kanban cards",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Select the first project when projects are loaded
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Select the first sprint when sprints are loaded
  useEffect(() => {
    if (sprints && sprints.length > 0 && !selectedSprintId) {
      setSelectedSprintId(sprints[0].id);
    }
  }, [sprints, selectedSprintId]);

  // Create new sprint mutation
  const createSprintMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/sprints", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sprint created",
        description: "The new sprint has been created successfully",
      });
      // Invalidate sprints query to refetch sprints
      queryClient.invalidateQueries({ queryKey: ["/api/sprints", selectedProjectId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create sprint",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create new column mutation
  const createColumnMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/kanban/columns", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Column created",
        description: "The new column has been created successfully",
      });
      // Invalidate columns query to refetch columns
      queryClient.invalidateQueries({ 
        queryKey: ["/api/kanban/columns", selectedProjectId, selectedSprintId] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create column",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create new card mutation
  const createCardMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/kanban/cards", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Card created",
        description: "The new card has been created successfully",
      });
      // Invalidate cards query to refetch cards
      queryClient.invalidateQueries({ 
        queryKey: ["/api/kanban/cards", selectedProjectId, selectedSprintId] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create card",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Move card mutation
  const moveCardMutation = useMutation({
    mutationFn: async (data: { cardId: number, columnId: number, order: number }) => {
      const res = await apiRequest("PATCH", `/api/kanban/cards/${data.cardId}/move`, {
        columnId: data.columnId,
        order: data.order
      });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate cards query to refetch cards
      queryClient.invalidateQueries({ 
        queryKey: ["/api/kanban/cards", selectedProjectId, selectedSprintId] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to move card",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update card mutation
  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: number) => {
      const res = await apiRequest("DELETE", `/api/kanban/cards/${cardId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Card deleted",
        description: "Card has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/columns", selectedSprintId] });
      setEditCardDialogOpen(false);
      setEditingCard(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete card",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateCardMutation = useMutation({
    mutationFn: async (data: { id: number, updates: any }) => {
      const res = await apiRequest("PATCH", `/api/kanban/cards/${data.id}`, data.updates);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Card updated",
        description: "The card has been updated successfully",
      });
      // Invalidate cards query to refetch cards
      queryClient.invalidateQueries({ 
        queryKey: ["/api/kanban/cards", selectedProjectId, selectedSprintId] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update card",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update column mutation
  const updateColumnMutation = useMutation({
    mutationFn: async (data: { id: number, updates: any }) => {
      const res = await apiRequest("PATCH", `/api/kanban/columns/${data.id}`, data.updates);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Column updated",
        description: "The column has been updated successfully",
      });
      // Invalidate columns query to refetch columns
      queryClient.invalidateQueries({ 
        queryKey: ["/api/kanban/columns", selectedProjectId, selectedSprintId] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update column",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update sprint mutation
  const updateSprintMutation = useMutation({
    mutationFn: async (data: { id: number, updates: any }) => {
      const res = await apiRequest("PATCH", `/api/sprints/${data.id}`, data.updates);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sprint updated",
        description: "The sprint has been updated successfully",
      });
      // Invalidate sprints query to refetch sprints
      queryClient.invalidateQueries({ queryKey: ["/api/sprints", selectedProjectId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update sprint",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete sprint mutation
  const deleteSprintMutation = useMutation({
    mutationFn: async (sprintId: number) => {
      const res = await apiRequest("DELETE", `/api/sprints/${sprintId}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Sprint deleted",
        description: "The sprint has been deleted successfully",
      });
      // Invalidate sprints query to refetch sprints
      queryClient.invalidateQueries({ queryKey: ["/api/sprints", selectedProjectId] });
      // Reset selected sprint if it was deleted
      if (sprints && sprints.length > 1) {
        const remaining = sprints.filter(s => s.id !== selectedSprintId);
        if (remaining.length > 0) {
          setSelectedSprintId(remaining[0].id);
        } else {
          setSelectedSprintId(undefined);
        }
      } else {
        setSelectedSprintId(undefined);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete sprint",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Fetch users for assignee selection with refetch interval for freshness
  const { 
    data: users, 
    isLoading: isLoadingUsers,
    refetch: refetchUsers 
  } = useQuery<{ id: number, name: string }[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    onError: (error: Error) => {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/users", { 
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Generate a placeholder email
        role: "tester" 
      });
      return await res.json();
    },
    onSuccess: (newUser) => {
      toast({
        title: "User created",
        description: `${newUser.name} has been created successfully`,
      });
      // Refetch users to get the updated list
      refetchUsers();

      // Update the current card with the new user
      if (currentAssigneeContext === 'new' && newCardDialogOpen) {
        setNewCard({
          ...newCard,
          assigneeName: newUser.name
        });
      } else if (currentAssigneeContext === 'edit' && editingCard) {
        setEditingCard({
          ...editingCard,
          assigneeName: newUser.name
        });
      }

      // Reset state and close dialog
      setNewUserName('');
      setNewUserDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Refetch users when a card update happens
  useEffect(() => {
    if (updateCardMutation.isSuccess) {
      refetchUsers();
    }
  }, [updateCardMutation.isSuccess, refetchUsers]);

  // Helper function to group cards by column
  const cardsByColumn = (columnId: number) => {
    // Only return parent cards for the column
    return cards?.filter(card => card.columnId === columnId && !card.parentId) || [];
  };

  // Handle card move
  const handleCardMove = (cardId: number, targetColumnId: number, newOrder: number) => {
    moveCardMutation.mutate({
      cardId,
      columnId: targetColumnId,
      order: newOrder
    });
  };
  
  // Handle column move to a new position
  const handleColumnMove = (dragColumnId: number, hoverColumnId: number) => {
    if (!columns || dragColumnId === hoverColumnId) return;
    
    // Get the dragged column and hover column
    const dragColumn = columns.find(col => col.id === dragColumnId);
    const hoverColumn = columns.find(col => col.id === hoverColumnId);
    
    if (!dragColumn || !hoverColumn) return;
    
    const dragPosition = dragColumn.position || 0;
    const hoverPosition = hoverColumn.position || 0;
    
    // Create a sorted array of columns by position
    const sortedColumns = [...columns].sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // Remove the dragged column from its current position
    const withoutDragColumn = sortedColumns.filter(col => col.id !== dragColumnId);
    
    // Find the insertion point
    const insertIndex = withoutDragColumn.findIndex(col => col.id === hoverColumnId);
    
    // Insert the dragged column at the new position
    withoutDragColumn.splice(insertIndex, 0, dragColumn);
    
    // Update positions for all columns
    withoutDragColumn.forEach((column, index) => {
      if (column.position !== index) {
        updateColumnMutation.mutate({
          id: column.id,
          updates: {
            position: index
          }
        });
      }
    });
  };

  const [newSprint, setNewSprint] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Planning" // Default status for new sprints
  });

  const [newColumn, setNewColumn] = useState({
    title: "",
    color: "#4F46E5" // Default color
  });

  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assigneeName: "unassigned",
    startDate: null as Date | null,
    endDate: null as Date | null,
    tags: [] as {name: string, color: string}[]
  });

  // Handle new sprint submission
  const handleCreateSprint = () => {
    if (!selectedProjectId) {
      toast({
        title: "No project selected",
        description: "Please select a project before creating a sprint",
        variant: "destructive",
      });
      return;
    }

    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      toast({
        title: "Missing fields",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    // Using the global getUserData function defined at the top level

    // Create sprint with current user as creator
    getUserData().then(userId => {
      if (!userId) {
        toast({
          title: "Authentication error",
          description: "Could not determine current user",
          variant: "destructive",
        });
        return;
      }

      createSprintMutation.mutate({
        name: newSprint.name,
        description: newSprint.description || "",
        projectId: selectedProjectId,
        startDate: newSprint.startDate,
        endDate: newSprint.endDate,
        status: newSprint.status,
        createdById: userId
      });
    });

    setNewSprint({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "Planning"
    });
    setNewSprintDialogOpen(false);
  };

  // Handle new column submission
  const handleCreateColumn = () => {
    if (!selectedProjectId || !selectedSprintId) {
      toast({
        title: "No project or sprint selected",
        description: "Please select a project and sprint before creating a column",
        variant: "destructive",
      });
      return;
    }

    if (!newColumn.title) {
      toast({
        title: "Missing title",
        description: "Please provide a title for the column",
        variant: "destructive",
      });
      return;
    }

    const order = columns?.length || 0;

    // Get current user ID from session
    getUserData().then(userId => {
      if (!userId) {
        toast({
          title: "Authentication error",
          description: "Could not determine current user",
          variant: "destructive",
        });
        return;
      }

      createColumnMutation.mutate({
        title: newColumn.title,
        projectId: selectedProjectId,
        sprintId: selectedSprintId,
        order,
        color: newColumn.color,
        createdById: userId
      });
    });

    setNewColumn({
      title: "",
      color: "#4F46E5"
    });
    setNewColumnDialogOpen(false);
  };

  // Handle new card submission
  const handleCreateCard = () => {
    if (!selectedProjectId || !selectedSprintId || !selectedColumnId) {
      toast({
        title: "Missing selection",
        description: "Please select a project, sprint, and column",
        variant: "destructive",
      });
      return;
    }

    if (!newCard.title) {
      toast({
        title: "Missing title",
        description: "Please provide a title for the card",
        variant: "destructive",
      });
      return;
    }

    const cardsInColumn = cardsByColumn(selectedColumnId);
    const order = cardsInColumn.length;

    // Using the global getUserData function defined at the top level

    // Get current user ID from session
    getUserData().then(userId => {
      if (!userId) {
        toast({
          title: "Authentication error",
          description: "Could not determine current user",
          variant: "destructive",
        });
        return;
      }

      // Find assignee ID if name is provided
      let assigneeId: number | undefined;
      let assigneeName: string | undefined;

      if (newCard.assigneeName && newCard.assigneeName !== 'unassigned' && users) {
        // Handle "Unknown User" specially
        if (newCard.assigneeName === 'Unknown User') {
          // Find the first user without a name
          const unknownUser = users.find(u => !u.name);
          if (unknownUser) {
            assigneeId = unknownUser.id;
            console.log("Found and assigning to unnamed user with ID:", assigneeId);
          }
        } else {
          // Regular name lookup
          const foundUser = users.find(u => u && u.name && typeof u.name === 'string' && 
            u.name.toLowerCase() === newCard.assigneeName.toLowerCase());
          if (foundUser) {
            assigneeId = foundUser.id;
          } else {
            // If name doesn't match any user, keep it as a manual assignee name
            assigneeName = newCard.assigneeName;
            console.log(`Manual assignee for new card: ${assigneeName}`);
          }
        }
      }

      // Format dates properly for the API
      const startDate = newCard.startDate ? 
        new Date(newCard.startDate).toISOString() : null;

      const endDate = newCard.endDate ? 
        new Date(newCard.endDate).toISOString() : null;

      // Include parentCardId if this is a sub-card
      createCardMutation.mutate({
        title: newCard.title,
        description: newCard.description || "",
        columnId: selectedColumnId,
        sprintId: selectedSprintId,
        projectId: selectedProjectId,
        priority: newCard.priority,
        order,
        assigneeId,
        // Include the assignee name for manual assignees
        assigneeName: (!assigneeId && assigneeName) ? assigneeName : undefined,
        startDate,
        endDate,
        labels: newCard.tags.length > 0 ? newCard.tags : undefined,
        createdById: userId,
        parentCardId: parentCardId // This will be null for regular cards
      });
    });

    setNewCard({
      title: "",
      description: "",
      priority: "Medium",
      assigneeName: "unassigned",
      startDate: null,
      endDate: null,
      tags: []
    });
    // Reset parent card ID after creating a card
    setParentCardId(null);
    setNewCardDialogOpen(false);
  };

  // Handle edit card submission
  const handleUpdateCard = () => {
    if (!editingCard) return;

    // Find assignee ID if name is provided
    let assigneeId: number | undefined = editingCard.assigneeId;

    if (typeof editingCard.assigneeName === 'string' && users) {
      if (editingCard.assigneeName && editingCard.assigneeName !== 'unassigned') {
        // Check for Unknown User first - we want to preserve the ID for existing users with no name
        if (editingCard.assigneeName === 'Unknown User') {
          // Keep the existing assigneeId
          console.log("Preserving Unknown User with ID:", assigneeId);
        } else {
          // Find the user by name normally
          const foundUser = users.find(u => u && u.name && typeof u.name === 'string' && 
            u.name.toLowerCase() === editingCard.assigneeName.toLowerCase());
          if (foundUser) {
            assigneeId = foundUser.id;
          } else {
            // If we have a name but no matching user, keep it as a manual entry
            // We'll save the assignee name separately in a custom field
            console.log(`Manual assignee: ${editingCard.assigneeName}`);
            // We set assigneeId to undefined so the manual name will be used
            assigneeId = undefined;
            // Don't clear assigneeName, let it pass through to be saved
          }
        }
      } else {
        // Clear assignee if "unassigned" was selected
        assigneeId = undefined;
      }
    }

    // Format dates properly for the API
    let startDate = null;
    if (editingCard.startDate) {
      // Ensure we have a proper date object
      const startDateObj = typeof editingCard.startDate === 'string' 
        ? new Date(editingCard.startDate) 
        : editingCard.startDate;

      // Only proceed if we have a valid date
      if (startDateObj instanceof Date && !isNaN(startDateObj.getTime())) {
        startDate = startDateObj.toISOString();
      }
    }

    let endDate = null;
    if (editingCard.endDate) {
      // Ensure we have a proper date object
      const endDateObj = typeof editingCard.endDate === 'string' 
        ? new Date(editingCard.endDate) 
        : editingCard.endDate;

      // Only proceed if we have a valid date
      if (endDateObj instanceof Date && !isNaN(endDateObj.getTime())) {
        endDate = endDateObj.toISOString();
      }
    }

    // Log for debugging
    console.log("Updating card with dates:", { 
      rawStartDate: editingCard.startDate,
      processedStartDate: startDate,
      rawEndDate: editingCard.endDate, 
      processedEndDate: endDate 
    });

    // Create update payload with only the fields that need to be updated
    const updates = {
      title: editingCard.title,
      description: editingCard.description || "",
      priority: editingCard.priority,
      assigneeId,
      // Include assigneeName if there's no assigneeId but there is a name
      // This allows manual assignee names like "Palaniswamy" to be saved and displayed
      assigneeName: (!assigneeId && editingCard.assigneeName && editingCard.assigneeName !== "unassigned") 
        ? editingCard.assigneeName : 
        (assigneeId ? undefined : "unassigned"), // Make sure to set "unassigned" if no assignee
      startDate,
      endDate,
      labels: Array.isArray(editingCard.labels) ? editingCard.labels : []
    };

    // Call the update mutation
    updateCardMutation.mutate({
      id: editingCard.id,
      updates
    });

    // Reset the editing state and close the dialog
    setEditingCard(null);
    setEditCardDialogOpen(false);
  };

  // Handle edit column submission
  const handleUpdateColumn = () => {
    if (!editingColumn) return;

    // Format dates properly for the API
    const startDate = editingColumn.startDate ? 
      new Date(editingColumn.startDate).toISOString() : null;

    const endDate = editingColumn.endDate ? 
      new Date(editingColumn.endDate).toISOString() : null;

    // Create update payload with only the fields that need to be updated
    const updates = {
      title: editingColumn.title,
      color: editingColumn.color,
      startDate,
      endDate
    };

    // Call the update mutation
    updateColumnMutation.mutate({
      id: editingColumn.id,
      updates
    });

    // Reset the editing state and close the dialog
    setEditingColumn(null);
    setEditColumnDialogOpen(false);
  };
  
  // Handle edit sprint submission
  const handleUpdateSprint = () => {
    if (!editingSprint) return;

    // Format dates properly for the API
    const startDate = editingSprint.startDate ? 
      new Date(editingSprint.startDate).toISOString().split('T')[0] : null;

    const endDate = editingSprint.endDate ? 
      new Date(editingSprint.endDate).toISOString().split('T')[0] : null;

    // Create update payload
    const updates = {
      name: editingSprint.name,
      description: editingSprint.description || "",
      startDate,
      endDate, 
      status: editingSprint.status
    };

    // Call the update mutation
    updateSprintMutation.mutate({
      id: editingSprint.id,
      updates
    });

    // Reset the editing state and close the dialog
    setEditingSprint(null);
    setEditSprintDialogOpen(false);
  };

  // State for color picker dialog
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#e2e8f0');

  // Constants for drag and drop
  const ItemTypes = {
    CARD: 'card',
    COLUMN: 'column'
  };

  // Interface for drag item
  interface DragItem {
    id: number;
    columnId: number;
    index: number;
    type: string;
    position?: number; // For column ordering
  }

  // DraggableCard component with react-dnd
  const DraggableCard = ({ 
    card, 
    index, 
    columnId 
  }: { 
    card: KanbanCard; 
    index: number; 
    columnId: number; 
  }) => {
    // Skip rendering if this is a sub-task (it will be shown nested under its parent)
    if (card.parentId) {
      return null;
    }
    // Query for sub-cards if this is a parent card
    const { data: subCards } = useQuery<KanbanCard[]>({
      queryKey: ["/api/kanban/cards/sub", card.id],
      enabled: !!card.id && !card.parentId, // Only fetch sub-cards for parent cards
      onError: (error: Error) => {
        toast({
          title: "Error fetching sub-cards",
          description: error.message,
          variant: "destructive",
        });
      }
    });
    // Drag configuration
    const [{ isDragging }, dragRef] = useDrag({
      type: ItemTypes.CARD,
      item: { id: card.id, columnId, index, type: ItemTypes.CARD },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    });

    // Drop configuration for sorting within the same column
    const [, dropRef] = useDrop({
      accept: ItemTypes.CARD,
      hover: (item: DragItem, monitor) => {
        if (!monitor.isOver({ shallow: true })) return;

        const dragIndex = item.index;
        const hoverIndex = index;
        const dragColumnId = item.columnId;
        const hoverColumnId = columnId;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex && dragColumnId === hoverColumnId) {
          return;
        }

        // Time to actually update the position in the backend
        handleCardMove(item.id, hoverColumnId, hoverIndex);

        // Update the position in the local state for immediate visual feedback
        item.index = hoverIndex;
        item.columnId = hoverColumnId;
      }
    });

    // Combine drag and drop refs
    const ref = (node: HTMLDivElement) => {
      dragRef(node);
      dropRef(node);
    };

    const cardStyle = {
      opacity: isDragging ? 0.5 : 1,
      cursor: 'move'
    };

    // Handle opening the edit dialog
    const handleEditCard = () => {
      // Find the user name if there's an assigneeId
      let assigneeName = "unassigned";
      if (card.assigneeId && users) {
        const assignedUser = users.find(u => u.id === card.assigneeId);
        if (assignedUser) {
          // Use name if available, otherwise use "Unknown User"
          assigneeName = assignedUser.name || "Unknown User";
        }
      }

      // Set the card with the assignee name
      setEditingCard({
        ...card,
        assigneeName
      });
      setEditCardDialogOpen(true);
    };

    // Display card tags if available
    const renderTags = () => {
      if (!card.labels || typeof card.labels !== 'object') return null;

      try {
        const labels = Array.isArray(card.labels) ? card.labels : [];

        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {labels.map((tag: any, idx: number) => (
              <div 
                key={idx} 
                className="text-xs px-2 py-0.5 rounded-full" 
                style={{ 
                  backgroundColor: tag.color || '#e2e8f0',
                  color: getContrastColor(tag.color || '#e2e8f0') 
                }}
              >
                {tag.name}
              </div>
            ))}
          </div>
        );
      } catch (e) {
        return null;
      }
    };

    return (
      <div ref={ref} style={cardStyle} className="mb-2">
        <Card className="relative group">
          <CardHeader className="p-3 pb-2 pr-8">
            <CardTitle 
              className="text-sm font-medium hover:text-primary hover:underline cursor-pointer"
              onClick={handleEditCard}
            >
              {card.title}
              {card.parentId && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Sub-task
                </Badge>
              )}
            </CardTitle>
            {card.parentId && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  <span className="mr-1">Sub-task of:</span>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-primary underline text-xs font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      const parentCard = cards?.find(c => c.id === card.parentId);
                      if (parentCard) {
                        // Set the editing card to the parent card
                        const assigneeName = parentCard.assigneeName || 
                          (parentCard.assigneeId && users?.find(u => u.id === parentCard.assigneeId)?.name) || 
                          "unassigned";

                        setEditingCard({
                          ...parentCard,
                          assigneeName
                        });
                        setEditCardDialogOpen(true);
                      }
                    }}
                  >
                    {getParentCardTitle(card.parentId)}
                  </Button>
                </Badge>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleEditCard}
            >
              <Edit className="h-3.5 w-3.5" />
              <span className="sr-only">Edit card</span>
            </Button>
          </CardHeader>

          {card.description && (
            <CardContent className="p-3 pt-0 pb-2">
              <p className="text-xs text-muted-foreground">
                {card.description.length > 120 ? 
                  `${card.description.substring(0, 120)}...` : 
                  card.description
                }
              </p>
              {renderTags()}
            </CardContent>
          )}

          <CardFooter className="flex flex-col p-3 pt-0">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2">
                {renderPriority(card.priority)}

                {card.estimatedHours && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {card.estimatedHours}h
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Estimated: {card.estimatedHours}h
                        {card.actualHours ? `, Actual: ${card.actualHours}h` : ''}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="absolute top-2 right-8 text-xs text-muted-foreground">
                {/* Assignee name removed */}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <CalendarDays className="h-3 w-3 mr-1" />
                  {card.startDate && new Date(card.startDate).toLocaleDateString()}
                  {card.startDate && card.endDate && " - "}
                  {card.endDate && new Date(card.endDate).toLocaleDateString()}
                </div>

              {/* Display sub-tasks if this is a parent card */}
              {subCards && subCards.length > 0 && (
                <div className="mt-2 border-t pt-2 border-primary/20">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Sub-tasks ({subCards.length})</span>
                      <Badge variant="outline" className="text-xs">Parent Task</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => {
                        setParentCardId(card.id);
                        setSelectedColumnId(card.columnId);
                        setNewCardDialogOpen(true);
                      }}
                      title="Create Sub-task"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {subCards.map((subCard, index) => (
                      <div 
                        key={subCard.id}
                        className="relative pl-4 border-l-2 border-primary/30"
                      >
                        <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-primary"></div>
                        <Card className="relative">
                          <CardHeader className="p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: 
                                  subCard.priority === "Critical" ? "#ef4444" : 
                                  subCard.priority === "High" ? "#f97316" : 
                                  subCard.priority === "Medium" ? "#3b82f6" : 
                                  "#22c55e" // Low
                                }}></div>
                                <div 
                                  className="text-sm font-medium cursor-pointer hover:text-primary"
                                  onClick={() => {
                                    setEditingCard({
                                      ...subCard,
                                      assigneeName: subCard.assigneeName || (subCard.assigneeId && users?.find(u => u.id === subCard.assigneeId)?.name) || ""
                                    });
                                    setEditCardDialogOpen(true);
                                  }}
                                >
                                  {subCard.title}
                                </div>
                              </div>
                              {(subCard.assigneeId || subCard.assigneeName) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                                          {subCard.assigneeName ? subCard.assigneeName.substring(0, 1).toUpperCase() :
                                            users?.find(u => u.id === subCard.assigneeId)?.name?.substring(0, 1).toUpperCase() || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Assigned to: {subCard.assigneeName || 
                                        (subCard.assigneeId && users?.find(u => u.id === subCard.assigneeId)?.name) || 
                                        "Unknown user"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </CardHeader>
                          {subCard.description && (
                            <CardContent className="p-2 pt-0">
                              <p className="text-xs text-muted-foreground">
                                {subCard.description.length > 100 ? 
                                  `${subCard.description.substring(0, 100)}...` : 
                                  subCard.description
                                }
                              </p>
                            </CardContent>
                          )}
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-3 right-3">
              {/* Display user from database when assigneeId is available */}
              {card.assigneeId && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto" 
                        onClick={handleEditCard}
                      >
                        <div className="flex items-center gap-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                              {(() => {
                                const assignee = users?.find(u => u && u.id === card.assigneeId);
                                if (assignee) {
                                  return assignee.name ? 
                                    assignee.name.substring(0, 1).toUpperCase() : 
                                    "U";
                                }
                                return "U";
                              })()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {(() => {
                              const assignee = users?.find(u => u && u.id === card.assigneeId);
                              if (assignee) {
                                return assignee.name || "Unknown User";
                              }
                              return "Assigned User";
                            })()}
                          </span>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Click to edit card
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Display manually entered assignee name */}
              {(card.assigneeName || "").trim() !== "" && card.assigneeName !== "unassigned" && !card.assigneeId && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                            {card.assigneeName ? card.assigneeName.substring(0, 1).toUpperCase() : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{card.assigneeName}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Assigned to: {card.assigneeName}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  };

  // DroppableColumn component for accepting cards
  const DroppableColumn = ({ 
    column, 
    cards 
  }: { 
    column: KanbanColumn; 
    cards: KanbanCard[]; 
  }) => {
    // Filter out sub-tasks from the main card list
    const mainCards = cards.filter(card => !card.parentId);
    
    // Make column draggable
    const [{ isDragging }, dragRef] = useDrag({
      type: ItemTypes.COLUMN,
      item: { id: column.id, index: column.position || 0, type: ItemTypes.COLUMN },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    });
    
    // Make column a drop target for cards
    const [, dropCardRef] = useDrop({
      accept: ItemTypes.CARD,
      drop: (item: DragItem) => {
        // If the card is dropped on the column but not on a card
        // move it to the end of this column
        if (item.columnId !== column.id) {
          handleCardMove(item.id, column.id, cards.length);
        }
      }
    });
    
    // Create a ref for the drop target element
    const dropRef = useRef<HTMLDivElement>(null);
    
    // Enhanced column drop target with better positioning logic
    const [{ isOver, canDrop }, dropColumnRef] = useDrop({
      accept: ItemTypes.COLUMN,
      drop: (item: DragItem, monitor) => {
        if (!monitor.didDrop()) {
          handleColumnMove(item.id, column.id);
        }
      },
      hover: (item: DragItem, monitor) => {
        if (!monitor.isOver({ shallow: true })) return;
        
        const dragColumnId = item.id;
        const hoverColumnId = column.id;
        
        // Don't replace columns with themselves
        if (dragColumnId === hoverColumnId) {
          return;
        }
        
        // Get the client offset and hovered item's bounding rectangle
        const clientOffset = monitor.getClientOffset();
        const hoverBoundingRect = dropRef.current?.getBoundingClientRect();
        
        if (!clientOffset || !hoverBoundingRect) return;
        
        // Get the middle of the hovered column
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
        
        // Get pixels to the left
        const clientOffsetX = clientOffset.x - hoverBoundingRect.left;
        
        // Only perform the move when the mouse has crossed half of the items width
        // When dragging leftwards, only move when the cursor is before 50%
        // When dragging rightwards, only move when the cursor is after 50%
        
        const dragIndex = columns?.findIndex(col => col.id === dragColumnId) || 0;
        const hoverIndex = columns?.findIndex(col => col.id === hoverColumnId) || 0;
        
        // Dragging leftwards
        if (dragIndex > hoverIndex && clientOffsetX > hoverMiddleX) {
          return;
        }
        
        // Dragging rightwards
        if (dragIndex < hoverIndex && clientOffsetX < hoverMiddleX) {
          return;
        }
        
        // Time to actually perform the action
        handleColumnMove(dragColumnId, hoverColumnId);
        
        // Update the item's index for subsequent moves
        item.index = hoverIndex;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop()
      })
    });
    
    // Combine drag and drop refs
    const ref = (node: HTMLDivElement) => {
      dragRef(node);
      dropCardRef(node);
      dropColumnRef(node);
      dropRef.current = node;
    };

    return (
      <div 
        ref={ref}
        className={`w-80 shrink-0 transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-105 rotate-2 shadow-2xl z-50' : 'opacity-100'
        } ${
          isOver && canDrop ? 'scale-105 shadow-lg ring-2 ring-primary ring-opacity-50' : ''
        }`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div 
          className={`rounded-md pb-4 transition-all duration-200 ${
            isOver && canDrop ? 'bg-primary/5' : ''
          }`}
          style={{ 
            borderTop: `3px solid ${column.color || "#4F46E5"}`,
            boxShadow: isOver && canDrop ? `0 0 0 2px ${column.color || "#4F46E5"}20` : 'none'
          }}
        >
          <div className="px-2 py-3 flex items-center justify-between bg-muted rounded-t-md">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium cursor-pointer hover:text-primary hover:underline" 
                onClick={() => {
                  setEditingColumn(column);
                  setEditColumnDialogOpen(true);
                }}
              >
                {column.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                onClick={() => {
                  setEditingColumn(column);
                  setEditColumnDialogOpen(true);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {cards.length}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                  setSelectedColumnId(column.id);
                  setNewCardDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-20rem)] p-2 space-y-2">
            {mainCards.length === 0 ? (
              <div className="flex items-center justify-center h-20 border border-dashed rounded-md">
                <p className="text-sm text-muted-foreground">No cards</p>
              </div>
            ) : (
              mainCards.map((card, index) => (
                <DraggableCard 
                  key={card.id} 
                  card={card} 
                  index={index} 
                  columnId={column.id} 
                />
              ))
            )}
          </ScrollArea>
        </div>
      </div>
    );
  };

  // Render priority badge with appropriate styling
  const renderPriority = (priority: string) => {
    const priorityClasses = {
      Low: "bg-green-100 text-green-800 border-green-200 dark:bg-green-800/30 dark:text-green-400 dark:border-green-800",
      Medium: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800/30 dark:text-blue-400 dark:border-blue-800",
      High: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-800/30 dark:text-orange-400 dark:border-orange-800",
      Critical: "bg-red-100 text-red-800 border-red-200 dark:bg-red-800/30 dark:text-red-400 dark:border-red-800"
    };

    return (
      <Badge variant="outline" className={priorityClasses[priority as keyof typeof priorityClasses]}>
        {priority}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Kanban Board | Test Case Tracker</title>
      </Helmet>

      <div className="container mx-auto py-6 px-4 md:px-6">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-xl shadow-lg">
                  <LayoutGrid className="h-8 w-8 text-white" />
                </div>
                Kanban Board
              </h1>
              <p className="text-muted-foreground max-w-2xl mt-2">
                Visualize your workflow and track progress using this customizable Kanban board
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ 
                    queryKey: ["/api/kanban/cards", selectedProjectId, selectedSprintId] 
                  });
                  queryClient.invalidateQueries({ 
                    queryKey: ["/api/kanban/columns", selectedProjectId, selectedSprintId] 
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Project & Sprint Selector */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-12 items-end">
          <div className="sm:col-span-4">
            <Label htmlFor="project-select">Project</Label>
            <Select 
              value={selectedProjectId?.toString() || ""} 
              onValueChange={(value) => {
                setSelectedProjectId(parseInt(value));
                setSelectedSprintId(null); // Reset sprint when project changes
              }}
              disabled={isLoadingProjects}
            >
              <SelectTrigger id="project-select" className="mt-1">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-4">
            <Label htmlFor="sprint-select">Sprint</Label>
            <Select 
              value={selectedSprintId?.toString() || ""} 
              onValueChange={(value) => setSelectedSprintId(parseInt(value))}
              disabled={isLoadingSprints || !selectedProjectId}
            >
              <SelectTrigger id="sprint-select" className="mt-1">
                <SelectValue placeholder="Select a sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints?.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id.toString()}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <Button 
              variant="default" 
              onClick={() => setNewSprintDialogOpen(true)}
              disabled={!selectedProjectId}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Sprint
            </Button>

            <Button
              variant="outline"
              onClick={() => setNewColumnDialogOpen(true)}
              disabled={!selectedProjectId || !selectedSprintId}
            >
              <Layers className="h-4 w-4 mr-1" />
              Add Column
            </Button>
          </div>
        </div>

        {/* Sprint Details (Milestone) */}
        {selectedSprintId && sprints && (
          <div className="mb-6">
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {sprints.find(s => s.id === selectedSprintId)?.name}
                    </CardTitle>
                    <CardDescription>
                      {sprints.find(s => s.id === selectedSprintId)?.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-4 flex-wrap justify-end">
                    <div className="flex items-center">
                      <CalendarRange className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(sprints.find(s => s.id === selectedSprintId)?.startDate || "").toLocaleDateString()} 
                        {" - "}
                        {new Date(sprints.find(s => s.id === selectedSprintId)?.endDate || "").toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={() => {
                          const sprint = sprints.find(s => s.id === selectedSprintId);
                          if (sprint) {
                            setEditingSprint({
                              id: sprint.id,
                              name: sprint.name,
                              description: sprint.description || "",
                              startDate: sprint.startDate,
                              endDate: sprint.endDate,
                              status: sprint.status
                            });
                            setEditSprintDialogOpen(true);
                          }
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (selectedSprintId) {
                            setSprintToDelete(selectedSprintId);
                            setDeleteSprintDialogOpen(true);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                    {(() => {
                      // Get the current sprint
                      const sprint = sprints.find(s => s.id === selectedSprintId);
                      if (!sprint) return null;
                      
                      // Calculate days remaining
                      const endDate = new Date(sprint.endDate);
                      const today = new Date();
                      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // Return appropriate badge based on status and days
                      if (sprint.status === "Completed") {
                        return (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Completed
                          </Badge>
                        );
                      } else if (sprint.status === "Planning") {
                        return (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Planning
                          </Badge>
                        );
                      } else if (daysRemaining < 0) {
                        return (
                          <Badge variant="destructive">
                            Overdue by {Math.abs(daysRemaining)} days
                          </Badge>
                        );
                      } else {
                        return (
                          <Badge variant="default">
                            {daysRemaining} days remaining
                          </Badge>
                        );
                      }
                    })()}
                  </div>
                </div>
              </CardHeader>
              {cards && (
                <CardContent className="pt-0 pb-3">
                  <div className="grid grid-cols-4 gap-4 mt-2">
                    <div className="flex flex-col items-center p-2 bg-muted/20 rounded-md">
                      <span className="text-xs text-muted-foreground">Total Cards</span>
                      <span className="text-xl font-semibold">{cards.length}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <span className="text-xs text-muted-foreground">Completed</span>
                      <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                        {cards.filter(card => columns?.some(col => col.id === card.columnId && col.title.toLowerCase().includes('done'))).length}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                      <span className="text-xs text-muted-foreground">In Progress</span>
                      <span className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                        {cards.filter(card => columns?.some(col => col.id === card.columnId && col.title.toLowerCase().includes('progress'))).length}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <span className="text-xs text-muted-foreground">Open</span>
                      <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                        {cards.filter(card => columns?.some(col => col.id === card.columnId && 
                          !col.title.toLowerCase().includes('done') && 
                          !col.title.toLowerCase().includes('progress'))).length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress section */}
                  <div className="mt-4">
                    {cards.length > 0 && (() => {
                      // Calculate completion percentage
                      const completedCount = cards.filter(card => 
                        columns?.some(col => col.id === card.columnId && col.title.toLowerCase().includes('done'))
                      ).length;
                      
                      const inProgressCount = cards.filter(card => 
                        columns?.some(col => col.id === card.columnId && col.title.toLowerCase().includes('progress'))
                      ).length;
                      
                      const openCount = cards.filter(card => 
                        columns?.some(col => col.id === card.columnId && 
                          !col.title.toLowerCase().includes('done') && 
                          !col.title.toLowerCase().includes('progress'))
                      ).length;
                      
                      const completionPercentage = Math.round((completedCount / cards.length) * 100);
                      const remainingWorkPercentage = 100 - completionPercentage;
                      
                      // Get current sprint
                      const sprint = sprints?.find(s => s.id === selectedSprintId);
                      
                      // Calculate days elapsed and total sprint duration
                      let timeProgressPercentage = 0;
                      let daysElapsed = 0;
                      let totalDays = 0;
                      
                      if (sprint?.startDate && sprint?.endDate) {
                        const startDate = new Date(sprint.startDate);
                        const endDate = new Date(sprint.endDate);
                        const today = new Date();
                        
                        totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        // Keep days elapsed within bounds (0 to totalDays)
                        daysElapsed = Math.max(0, Math.min(daysElapsed, totalDays));
                        
                        timeProgressPercentage = Math.round((daysElapsed / totalDays) * 100);
                      }
                      
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Sprint Progress</span>
                            <div className="flex items-center">
                              <span className="font-medium mr-2">{completionPercentage}% Complete</span>
                              {completionPercentage > timeProgressPercentage ? (
                                <Badge variant="success" className="text-xs">Ahead of Schedule</Badge>
                              ) : completionPercentage < timeProgressPercentage - 20 ? (
                                <Badge variant="destructive" className="text-xs">Behind Schedule</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">On Track</Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Task progress bar */}
                          <div className="w-full bg-muted/10 h-4 rounded-full overflow-hidden mb-2">
                            <div 
                              className="bg-green-500 h-full float-left transition-all duration-300" 
                              style={{ 
                                width: `${(completedCount / cards.length) * 100}%` 
                              }}
                            />
                            <div 
                              className="bg-yellow-500 h-full float-left transition-all duration-300" 
                              style={{ 
                                width: `${(inProgressCount / cards.length) * 100}%` 
                              }}
                            />
                          </div>
                          
                          {/* Time progress indicator */}
                          <div className="flex items-center justify-between text-xs mt-3 text-muted-foreground">
                            <span>Time Elapsed: {timeProgressPercentage}%</span>
                            {sprint?.startDate && sprint?.endDate && (
                              <span className="text-xs">
                                Day {daysElapsed} of {totalDays}
                                {daysElapsed > 0 && totalDays > 0 && completedCount > 0 && (
                                  <span className="ml-2">
                                    (Burn rate: {(completedCount / daysElapsed).toFixed(1)} cards/day)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-muted/10 h-2 rounded-full overflow-hidden mt-1">
                            <div 
                              className="bg-blue-500 h-full transition-all duration-300" 
                              style={{ width: `${timeProgressPercentage}%` }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Kanban Board */}
        <DndProvider backend={HTML5Backend}>
          <div className="overflow-auto pb-6">
            {isLoadingColumns || !columns ? (
              <div className="flex space-x-4 mt-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-80 shrink-0 space-y-4">
                    <Skeleton className="h-8 w-40" />
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-32 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            ) : columns.length === 0 ? (
              <div className="py-8">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No columns found</AlertTitle>
                  <AlertDescription>
                    Create columns to start building your Kanban board.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="flex space-x-4 mt-8">
                {columns
                  .slice() // Create a copy to avoid mutating the original array
                  .sort((a, b) => (a.position || 0) - (b.position || 0)) // Sort by position
                  .map((column) => (
                    <DroppableColumn 
                      key={column.id} 
                      column={column}
                      cards={cardsByColumn(column.id)}
                    />
                  ))
                }
              </div>
            )}
          </div>
        </DndProvider>
      </div>

      {/* New Sprint Dialog */}
      <Dialog open={newSprintDialogOpen} onOpenChange={setNewSprintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
            <DialogDescription>
              Add a new sprint to organize your work.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sprint-name">Name</Label>
              <Input 
                id="sprint-name" 
                value={newSprint.name}
                onChange={(e) => setNewSprint({...newSprint, name: e.target.value})}
                placeholder="Sprint name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sprint-description">Description</Label>
              <Textarea 
                id="sprint-description" 
                value={newSprint.description}
                onChange={(e) => setNewSprint({...newSprint, description: e.target.value})}
                placeholder="Sprint description (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sprint-start-date">Start Date</Label>
                <div className="flex">
                  <Input 
                    id="sprint-start-date" 
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint({...newSprint, startDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sprint-end-date">End Date</Label>
                <div className="flex">
                  <Input 
                    id="sprint-end-date" 
                    type="date"
                    value={newSprint.endDate}
                    onChange={(e) => setNewSprint({...newSprint, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sprint-status">Status</Label>
              <Select 
                value={newSprint.status} 
                onValueChange={(value) => setNewSprint({...newSprint, status: value})}
              >
                <SelectTrigger id="sprint-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSprintDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSprint}
              disabled={createSprintMutation.isPending}
            >
              {createSprintMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sprint Dialog */}
      <Dialog open={editSprintDialogOpen} onOpenChange={setEditSprintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sprint</DialogTitle>
            <DialogDescription>
              Modify the details of this sprint.
            </DialogDescription>
          </DialogHeader>
          {editingSprint && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-sprint-name">Name</Label>
                <Input 
                  id="edit-sprint-name" 
                  placeholder="Sprint name" 
                  value={editingSprint.name}
                  onChange={(e) => setEditingSprint({ ...editingSprint, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sprint-description">Description</Label>
                <Textarea 
                  id="edit-sprint-description" 
                  placeholder="Sprint description (optional)" 
                  className="resize-none"
                  value={editingSprint.description}
                  onChange={(e) => setEditingSprint({ ...editingSprint, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-sprint-start-date">Start Date</Label>
                  <div className="flex">
                    <Input 
                      id="edit-sprint-start-date" 
                      type="date" 
                      value={new Date(editingSprint.startDate).toISOString().split('T')[0]}
                      onChange={(e) => setEditingSprint({ ...editingSprint, startDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-sprint-end-date">End Date</Label>
                  <div className="flex">
                    <Input 
                      id="edit-sprint-end-date" 
                      type="date" 
                      value={new Date(editingSprint.endDate).toISOString().split('T')[0]}
                      onChange={(e) => setEditingSprint({ ...editingSprint, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sprint-status">Status</Label>
                <Select 
                  value={editingSprint.status} 
                  onValueChange={(value) => setEditingSprint({ ...editingSprint, status: value })}
                >
                  <SelectTrigger id="edit-sprint-status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditSprintDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => {
                if (editingSprint) {
                  updateSprintMutation.mutate({
                    id: editingSprint.id,
                    updates: {
                      name: editingSprint.name,
                      description: editingSprint.description,
                      startDate: editingSprint.startDate,
                      endDate: editingSprint.endDate,
                      status: editingSprint.status
                    }
                  });
                  setEditSprintDialogOpen(false);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sprint Confirmation Dialog */}
      <Dialog open={deleteSprintDialogOpen} onOpenChange={setDeleteSprintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sprint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sprint? This action cannot be undone and will delete all columns and cards associated with this sprint.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5">
            <Button 
              variant="outline" 
              onClick={() => setDeleteSprintDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (sprintToDelete) {
                  deleteSprintMutation.mutate(sprintToDelete);
                  setDeleteSprintDialogOpen(false);
                }
              }}
            >
              Delete Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Column Dialog */}
      <Dialog open={newColumnDialogOpen} onOpenChange={setNewColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
            <DialogDescription>
              Add a new column to your Kanban board.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="column-title">Title</Label>
              <Input 
                id="column-title" 
                value={newColumn.title}
                onChange={(e) => setNewColumn({...newColumn, title: e.target.value})}
                placeholder="Column title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="column-color">Color</Label>
              <div className="flex gap-2">
                <Input 
                  id="column-color" 
                  type="color"
                  value={newColumn.color}
                  onChange={(e) => setNewColumn({...newColumn, color: e.target.value})}
                  className="w-16 h-10 p-1"
                />
                <Input 
                  value={newColumn.color}
                  onChange={(e) => setNewColumn({...newColumn, color: e.target.value})}
                  placeholder="#4F46E5"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateColumn}
              disabled={createColumnMutation.isPending}
            >
              {createColumnMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Card Dialog */}
      <Dialog open={newCardDialogOpen} onOpenChange={setNewCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{parentCardId ? "Create Sub-task" : "Create New Card"}</DialogTitle>
            <DialogDescription>
              {parentCardId 
                ? "Add a new sub-task to the parent card." 
                : "Add a new card to the selected column."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="card-title">Title</Label>
              <Input 
                id="card-title" 
                value={newCard.title}
                onChange={(e) => setNewCard({...newCard, title: e.target.value})}
                placeholder="Card title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="card-description">Description</Label>
              <Textarea 
                id="card-description" 
                value={newCard.description}
                onChange={(e) => setNewCard({...newCard, description: e.target.value})}
                placeholder="Card description (optional)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="card-priority">Priority</Label>
              <Select 
                value={newCard.priority} 
                onValueChange={(value) => setNewCard({...newCard, priority: value})}
              >
                <SelectTrigger id="card-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="card-assignee">Assignee</Label>
              <Input
                id="card-assignee"
                placeholder="Enter assignee name"
                value={newCard.assigneeName === "unassigned" ? "" : newCard.assigneeName}
                onChange={(e) => {
                  setNewCard({
                    ...newCard,
                    assigneeName: e.target.value || "unassigned"
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="card-start-date">Start Date</Label>
                <Input 
                  id="card-start-date" 
                  type="date"
                  value={newCard.startDate ? new Date(newCard.startDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setNewCard({...newCard, startDate: e.target.value ? new Date(e.target.value) : null})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="card-end-date">End Date</Label>
                <Input 
                  id="card-end-date" 
                  type="date"
                  value={newCard.endDate ? new Date(newCard.endDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setNewCard({...newCard, endDate: e.target.value ? new Date(e.target.value) : null})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newCard.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    style={{ 
                      backgroundColor: tag.color,
                      color: getContrastColor(tag.color) 
                    }}
                    className="flex items-center gap-1"
                  >
                    {tag.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        const updatedTags = [...newCard.tags];
                        updatedTags.splice(index, 1);
                        setNewCard({ ...newCard, tags: updatedTags });
                      }}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="tagName"
                    placeholder="Enter tag name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        if (input.value) {
                          const tagName = input.value;
                          const updatedTags = [...newCard.tags];
                          const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
                          updatedTags.push({ name: tagName, color: randomColor });
                          setNewCard({ ...newCard, tags: updatedTags });
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('tagName') as HTMLInputElement;
                      if (input && input.value) {
                        const tagName = input.value;
                        const updatedTags = [...newCard.tags];
                        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
                        updatedTags.push({ name: tagName, color: randomColor });
                        setNewCard({ ...newCard, tags: updatedTags });
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newCard.tags.length > 0) {
                        const lastTag = newCard.tags[newCard.tags.length - 1];
                        const colorInput = document.createElement('input');
                        colorInput.type = 'color';
                        colorInput.value = lastTag.color;
                        colorInput.addEventListener('change', (e) => {
                          const updatedTags = [...newCard.tags];
                          updatedTags[updatedTags.length - 1].color = (e.target as HTMLInputElement).value;
                          setNewCard({ ...newCard, tags: updatedTags });
                        });
                        colorInput.click();
                      }
                    }}
                    disabled={newCard.tags.length === 0}
                  >
                    <Palette className="h-4 w-4" />
                    <span className="sr-only">Pick tag color</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCardDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCard}
              disabled={createCardMutation.isPending}
            >
              {createCardMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              {parentCardId ? "Create Sub-task" : "Create Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={editCardDialogOpen} onOpenChange={setEditCardDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingCard?.parentId ? "Edit Sub-task" : "Edit Card"}</DialogTitle>
            <DialogDescription>
              Update the {editingCard?.parentId ? "sub-task" : "card"} details and click save when done.
            </DialogDescription>
          </DialogHeader>

          {editingCard && (
            <div className="grid gap-4 py-4">
              {editingCard.parentId && (
                <div className="bg-muted/80 border p-3 rounded-md border-primary/20">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <Label className="font-semibold text-sm">Parent Task</Label>
                    </div>
                    <Badge variant="outline">Sub-task</Badge>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Title:</span>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-primary underline text-sm font-medium"
                        onClick={async () => {
                          // Find the parent card and display it
                          try {
                            const parentCard = await getKanbanCard(editingCard.parentId);
                            if (parentCard) {
                              // Close current dialog
                              setEditCardDialogOpen(false);
                              // Open the parent card after a short delay
                              setTimeout(() => {
                                setEditingCard({
                                  ...parentCard,
                                  assigneeName: parentCard.assigneeName || 
                                    (parentCard.assigneeId && users?.find(u => u.id === parentCard.assigneeId)?.name) || ""
                                });
                                setEditCardDialogOpen(true);
                              }, 100);
                            }
                          } catch (error) {
                            console.error("Error fetching parent card:", error);
                            toast({
                              title: "Error",
                              description: "Could not load parent task",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        {getParentCardTitle(editingCard.parentId) || "Loading parent task..."}
                      </Button>
                    </div>

                    {(() => {
                      const parentCard = cards?.find(c => c.id === editingCard.parentId);
                      if (parentCard) {
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">Priority:</span>
                              <span className="text-xs">{parentCard.priority}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">Assignee:</span>
                              <span className="text-xs">
                                {parentCard.assigneeName || 
                                  (parentCard.assigneeId && users?.find(u => u.id === parentCard.assigneeId)?.name) ||
                                  "Unassigned"}
                              </span>
                            </div>

                            {(parentCard.startDate || parentCard.endDate) && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Timeline:</span>
                                <span className="text-xs">
                                  {parentCard.startDate && new Date(parentCard.startDate).toLocaleDateString()}
                                  {parentCard.startDate && parentCard.endDate && " - "}
                                  {parentCard.endDate && new Date(parentCard.endDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="edit-card-title">Title</Label>
                <Input 
                  id="edit-card-title" 
                  value={editingCard.title}
                  onChange={(e) => setEditingCard({...editingCard, title: e.target.value})}
                  placeholder="Card title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-card-description">Description</Label>
                <Textarea 
                  id="edit-card-description" 
                  value={editingCard.description || ''}
                  onChange={(e) => setEditingCard({...editingCard, description: e.target.value})}
                  placeholder="Card description (optional)"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-card-priority">Priority</Label>
                <Select 
                  value={editingCard.priority} 
                  onValueChange={(value) => setEditingCard({...editingCard, priority: value})}
                >
                  <SelectTrigger id="edit-card-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-card-assignee">Assignee</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="edit-card-assignee"
                    placeholder="Enter assignee name (e.g. Palaniswamy)"
                    value={editingCard.assigneeName === "unassigned" ? "" : (editingCard.assigneeName || "")}
                    onChange={(e) => {
                      setEditingCard({ 
                        ...editingCard, 
                        assigneeName: e.target.value || "unassigned",
                        // Clear assigneeId if manually entering a name
                        assigneeId: e.target.value ? undefined : editingCard.assigneeId
                      });
                    }}
                    className="flex-1"
                  />
                  {editingCard.assigneeName && editingCard.assigneeName !== "unassigned" && (
                    <Badge variant="secondary" className="whitespace-nowrap">
                      Assigned to: {editingCard.assigneeName}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-card-start-date">Start Date</Label>
                  <Input 
                    id="edit-card-start-date" 
                    type="date"
                    value={editingCard.startDate ? 
                      (typeof editingCard.startDate === 'string' 
                        ? new Date(editingCard.startDate) 
                        : editingCard.startDate
                      ).toISOString().split('T')[0] 
                      : ""
                    }
                    onChange={(e) => {
                      console.log("Selected start date:", e.target.value);
                      setEditingCard({
                        ...editingCard, 
                        startDate: e.target.value ? new Date(e.target.value) : null
                      });
                    }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-card-end-date">End Date</Label>
                  <Input 
                    id="edit-card-end-date" 
                    type="date"
                    value={editingCard.endDate ? 
                      (typeof editingCard.endDate === 'string' 
                        ? new Date(editingCard.endDate) 
                        : editingCard.endDate
                      ).toISOString().split('T')[0] 
                      : ""
                    }
                    onChange={(e) => {
                      console.log("Selected end date:", e.target.value);
                      setEditingCard({
                        ...editingCard, 
                        endDate: e.target.value ? new Date(e.target.value) : null
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(Array.isArray(editingCard.labels) ? editingCard.labels : []).map((tag: any, index: number) => (
                    <Badge 
                      key={index} 
                      style={{ 
                        backgroundColor: tag.color,
                        color: getContrastColor(tag.color) 
                      }}
                      className="flex items-center gap-1"
                    >
                      {tag.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          const updatedLabels = [...(Array.isArray(editingCard.labels) ? editingCard.labels : [])];
                          updatedLabels.splice(index, 1);
                          setEditingCard({ ...editingCard, labels: updatedLabels });
                        }}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="edit-tagName"
                      placeholder="Enter tag name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          if (input.value) {
                            const tagName = input.value;
                            const updatedLabels = [...(Array.isArray(editingCard.labels) ? editingCard.labels : [])];
                            const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
                            updatedLabels.push({ name: tagName, color: randomColor });
                            setEditingCard({ ...editingCard, labels: updatedLabels });
                            input.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById('edit-tagName') as HTMLInputElement;
                        if (input && input.value) {
                          const tagName = input.value;
                          const updatedLabels = [...(Array.isArray(editingCard.labels) ? editingCard.labels : [])];
                          const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
                          updatedLabels.push({ name: tagName, color: randomColor });
                          setEditingCard({ ...editingCard, labels: updatedLabels });
                          input.value = '';
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const labels = Array.isArray(editingCard.labels) ? editingCard.labels : [];
                        if (labels.length > 0) {
                          const lastTag = labels[labels.length - 1];
                          const colorInput = document.createElement('input');
                          colorInput.type = 'color';
                          colorInput.value = lastTag.color;
                          colorInput.addEventListener('change', (e) => {
                            const updatedLabels = [...labels];
                            updatedLabels[updatedLabels.length - 1].color = (e.target as HTMLInputElement).value;
                            setEditingCard({ ...editingCard, labels: updatedLabels });
                          });
                          colorInput.click();
                        }
                      }}
                      disabled={!Array.isArray(editingCard.labels) || editingCard.labels.length === 0}
                    >
                      <Palette className="h-4 w-4" />
                      <span className="sr-only">Pick tag color</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (editingCard && editingCard.id) {
                    if (window.confirm("Are you sure you want to delete this card? This action cannot be undone.")) {
                      deleteCardMutation.mutate(editingCard.id);
                    }
                  }
                }}
                disabled={deleteCardMutation.isPending}
                size="sm"
              >
                {deleteCardMutation.isPending && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>

              <Button 
                variant="secondary" 
                onClick={() => {
                  if (editingCard && editingCard.id) {
                    // Set parent card ID for when we create the sub-card
                    setParentCardId(editingCard.id);

                    // Close edit dialog and open new card dialog
                    setEditCardDialogOpen(false);
                    setEditingCard(null);

                    // Pre-populate the new card dialog with parent's column
                    if (editingCard.columnId) {
                      setSelectedColumnId(editingCard.columnId);
                    }

                    // Open the new card dialog
                    setNewCardDialogOpen(true);
                  }
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Sub-task
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingCard(null);
                  setEditCardDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateCard}
                disabled={updateCardMutation.isPending}
              >
                {updateCardMutation.isPending && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCard?.parentId ? "Update Sub-task" : "Update Card"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={editColumnDialogOpen} onOpenChange={setEditColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <DialogDescription>
              Make changes to the column.
            </DialogDescription>
          </DialogHeader>

          {editingColumn && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-column-title">Title</Label>
                <Input 
                  id="edit-column-title" 
                  value={editingColumn.title}
                  onChange={(e) => setEditingColumn({...editingColumn, title: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-column-color">Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-md cursor-pointer border"
                    style={{ backgroundColor: editingColumn.color || "#4F46E5" }}
                  />
                  <Input 
                    id="edit-column-color"
                    type="color"
                    value={editingColumn.color || "#4F46E5"}
                    onChange={(e) => setEditingColumn({...editingColumn, color: e.target.value})}
                    className="h-9 w-9 p-0 border-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-column-start-date">Start Date</Label>
                  <Input 
                    id="edit-column-start-date" 
                    type="date"
                    value={editingColumn.startDate ? new Date(editingColumn.startDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => setEditingColumn({...editingColumn, startDate: e.target.value ? new Date(e.target.value) : null})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-column-end-date">End Date</Label>
                  <Input 
                    id="edit-column-end-date" 
                    type="date"
                    value={editingColumn.endDate ? new Date(editingColumn.endDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => setEditingColumn({...editingColumn, endDate: e.target.value ? new Date(e.target.value) : null})}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingColumn(null);
                setEditColumnDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateColumn}
              disabled={updateColumnMutation.isPending}
            >
              {updateColumnMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New User Dialog */}
      <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to assign to tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-user-name">Name</Label>
              <Input 
                id="new-user-name" 
                placeholder="Enter user name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setNewUserName('');
                setNewUserDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!newUserName.trim()) {
                  toast({
                    title: "Name required",
                    description: "Please enter a name for the user",
                    variant: "destructive",
                  });
                  return;
                }
                createUserMutation.mutate(newUserName);
              }}
              disabled={createUserMutation.isPending || !newUserName.trim()}
            >
              {createUserMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}