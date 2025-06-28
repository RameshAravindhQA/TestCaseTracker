
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  X, 
  Trash2, 
  Edit, 
  CheckSquare, 
  Square,
  Minimize2,
  Maximize2,
  GripVertical,
  List,
  FolderPlus,
  Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  todoListId?: number;
  createdAt: string;
  updatedAt: string;
}

interface TodoList {
  id: number;
  name: string;
  description?: string;
  color: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface TodoListProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export function TodoList({ isVisible, onToggleVisibility, isMinimized, onToggleMinimize }: TodoListProps) {
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListColor, setNewListColor] = useState("#3b82f6");
  const [editingListId, setEditingListId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch todo lists
  const { data: todoLists, isLoading: isLoadingLists } = useQuery<TodoList[]>({
    queryKey: ["todoLists"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/todo-lists");
      if (!response.ok) throw new Error("Failed to fetch todo lists");
      return response.json();
    },
    enabled: isVisible,
  });

  // Fetch todos for selected list
  const { data: todos, isLoading: isLoadingTodos, refetch } = useQuery<TodoItem[]>({
    queryKey: ["todos", selectedListId],
    queryFn: async () => {
      if (selectedListId) {
        const response = await apiRequest("GET", `/api/todo-lists/${selectedListId}/todos`);
        if (!response.ok) throw new Error("Failed to fetch todos");
        return response.json();
      } else {
        const response = await apiRequest("GET", "/api/todos");
        if (!response.ok) throw new Error("Failed to fetch todos");
        return response.json();
      }
    },
    enabled: isVisible,
  });

  // Create todo list mutation
  const createListMutation = useMutation({
    mutationFn: async (newList: { name: string; description?: string; color: string }) => {
      const response = await apiRequest("POST", "/api/todo-lists", newList);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create todo list: ${errorData}`);
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["todoLists"] });
      setIsCreateListOpen(false);
      setNewListName("");
      setNewListDescription("");
      setNewListColor("#3b82f6");
      toast({
        title: "Todo list created",
        description: "Your todo list has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Todo list creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create todo list. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update todo list mutation
  const updateListMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<TodoList> }) => {
      const response = await apiRequest("PUT", `/api/todo-lists/${id}`, updates);
      if (!response.ok) throw new Error("Failed to update todo list");
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["todoLists"] });
      setEditingListId(null);
    },
  });

  // Delete todo list mutation
  const deleteListMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/todo-lists/${id}`);
      if (!response.ok) throw new Error("Failed to delete todo list");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["todoLists"] });
      if (selectedListId === editingListId) {
        setSelectedListId(null);
      }
      toast({
        title: "Todo list deleted",
        description: "Your todo list has been removed.",
      });
    },
  });

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: async (newTodo: { title: string; description?: string; todoListId?: number }) => {
      const response = await apiRequest("POST", "/api/todos", {
        title: newTodo.title,
        description: newTodo.description || "",
        completed: false,
        priority: 'medium',
        todoListId: newTodo.todoListId
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create todo: ${errorData}`);
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["todos", selectedListId] });
      await refetch();
      setNewTodo("");
      toast({
        title: "Todo created",
        description: "Your todo has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Todo creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create todo. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update todo mutation
  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<TodoItem> }) => {
      const response = await apiRequest("PUT", `/api/todos/${id}`, updates);
      if (!response.ok) throw new Error("Failed to update todo");
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["todos", selectedListId] });
      await refetch();
      setEditingId(null);
      setEditingText("");
    },
  });

  // Delete todo mutation
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/todos/${id}`);
      if (!response.ok) throw new Error("Failed to delete todo");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["todos", selectedListId] });
      await refetch();
      toast({
        title: "Todo deleted",
        description: "Your todo has been removed.",
      });
    },
  });

  const handleCreateList = () => {
    if (!newListName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a list name.",
        variant: "destructive",
      });
      return;
    }

    createListMutation.mutate({
      name: newListName.trim(),
      description: newListDescription.trim(),
      color: newListColor
    });
  };

  const handleCreateTodo = () => {
    if (!newTodo.trim()) {
      toast({
        title: "Error",
        description: "Please enter a todo item.",
        variant: "destructive",
      });
      return;
    }

    createTodoMutation.mutate({
      title: newTodo.trim(),
      description: "",
      todoListId: selectedListId
    });
  };

  const handleToggleComplete = (todo: TodoItem) => {
    updateTodoMutation.mutate({
      id: todo.id,
      updates: { completed: !todo.completed }
    });
  };

  const handleUpdateTodo = (id: number) => {
    if (editingText.trim()) {
      updateTodoMutation.mutate({
        id,
        updates: { title: editingText.trim() }
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (todoLists && todoLists.length > 0 && !selectedListId) {
      setSelectedListId(todoLists[0].id);
    }
  }, [todoLists, selectedListId]);

  if (!isVisible) return null;

  const completedCount = todos?.filter(todo => todo.completed).length || 0;
  const totalCount = todos?.length || 0;
  const selectedList = todoLists?.find(list => list.id === selectedListId);

  return (
    <div
      className={cn(
        "fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl",
        isMinimized ? "w-80" : "w-96"
      )}
      style={{
        left: position.x,
        top: position.y,
        maxHeight: isMinimized ? 'auto' : '700px'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-800 rounded-t-lg"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <CheckSquare className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-sm">
            Todo Lists {totalCount > 0 && `(${completedCount}/${totalCount})`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="h-6 w-6 p-0"
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3 max-h-[600px] overflow-y-auto">
          {/* List Management */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Select 
                value={selectedListId?.toString() || ""} 
                onValueChange={(value) => setSelectedListId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a list..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Todos</SelectItem>
                  {todoLists?.map((list) => (
                    <SelectItem key={list.id} value={list.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: list.color }}
                        />
                        {list.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isCreateListOpen} onOpenChange={setIsCreateListOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Todo List</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="listName">Name</Label>
                      <Input
                        id="listName"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Enter list name..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="listDescription">Description</Label>
                      <Textarea
                        id="listDescription"
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        placeholder="Enter list description..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="listColor">Color</Label>
                      <div className="flex gap-2 mt-1">
                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-8 h-8 rounded-full border-2",
                              newListColor === color ? "border-gray-400" : "border-gray-200"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewListColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateList} disabled={createListMutation.isPending}>
                        {createListMutation.isPending ? "Creating..." : "Create List"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreateListOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selectedList && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: selectedList.color }}
                />
                <span>{selectedList.description || "No description"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteListMutation.mutate(selectedList.id)}
                  className="h-4 w-4 p-0 ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Add new todo */}
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Add a new todo..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTodo()}
              className="text-sm"
            />
            <Button
              onClick={handleCreateTodo}
              size="sm"
              disabled={!newTodo.trim() || createTodoMutation.isPending}
              className="shrink-0"
            >
              {createTodoMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Todo list */}
          <div className="space-y-2">
            {isLoadingTodos ? (
              <div className="text-center py-4 text-sm text-gray-500">Loading todos...</div>
            ) : todos && todos.length > 0 ? (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded border",
                    todo.completed ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"
                  )}
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => handleToggleComplete(todo)}
                    className="h-4 w-4"
                  />

                  {editingId === todo.id ? (
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdateTodo(todo.id)}
                      onBlur={() => handleUpdateTodo(todo.id)}
                      className="text-sm flex-1"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex-1 text-sm cursor-pointer",
                        todo.completed && "line-through text-gray-500"
                      )}
                      onClick={() => {
                        setEditingId(todo.id);
                        setEditingText(todo.title);
                      }}
                    >
                      {todo.title}
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <Badge
                      variant={
                        todo.priority === 'high' ? 'destructive' :
                        todo.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {todo.priority}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTodoMutation.mutate(todo.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                No todos yet. Add one above!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
