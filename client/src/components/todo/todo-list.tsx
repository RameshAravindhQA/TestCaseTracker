
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
  GripVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
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
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch todos
  const { data: todos, isLoading } = useQuery<TodoItem[]>({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/todos");
      if (!response.ok) throw new Error("Failed to fetch todos");
      return response.json();
    },
    enabled: isVisible,
  });

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: async (todo: Partial<TodoItem>) => {
      const response = await apiRequest("POST", "/api/todos", todo);
      if (!response.ok) throw new Error("Failed to create todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setNewTodo("");
      toast({
        title: "Todo created",
        description: "Your todo has been added successfully.",
      });
    },
  });

  // Update todo mutation
  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<TodoItem> }) => {
      const response = await apiRequest("PUT", `/api/todos/${id}`, updates);
      if (!response.ok) throw new Error("Failed to update todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast({
        title: "Todo deleted",
        description: "Your todo has been removed.",
      });
    },
  });

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
      completed: false,
      priority: 'medium'
    }, {
      onError: (error) => {
        console.error("Todo creation error:", error);
        toast({
          title: "Error",
          description: "Failed to create todo. Please try again.",
          variant: "destructive",
        });
      }
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

  if (!isVisible) return null;

  const completedCount = todos?.filter(todo => todo.completed).length || 0;
  const totalCount = todos?.length || 0;

  return (
    <div
      className={cn(
        "fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl",
        isMinimized ? "w-60" : "w-80"
      )}
      style={{
        left: position.x,
        top: position.y,
        maxHeight: isMinimized ? 'auto' : '600px'
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
            Todo List {totalCount > 0 && `(${completedCount}/${totalCount})`}
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
        <div className="p-3 max-h-[500px] overflow-y-auto">
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
            {isLoading ? (
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
