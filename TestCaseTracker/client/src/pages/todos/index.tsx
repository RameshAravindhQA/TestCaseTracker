import { MainLayout } from "@/components/layout/main-layout";
import { useState } from "react";
import { CheckSquare, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Flag, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  listId?: number;
  createdAt: string;
  updatedAt: string;
}

interface TodoList {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

function TodosPage() {
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'Medium' as const,
    dueDate: '',
  });
  const [newList, setNewList] = useState({
    name: '',
    description: '',
    color: '#4F46E5',
  });
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const { data: todos = [], isLoading: todosLoading, refetch: refetchTodos } = useQuery({
    queryKey: ["/api/todos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/todos");
      if (!res.ok) throw new Error("Failed to fetch todos");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: todoLists = [], isLoading: listsLoading, refetch: refetchLists } = useQuery({
    queryKey: ["/api/todo-lists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/todo-lists");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const createTodoMutation = useMutation({
    mutationFn: async (todoData: any) => {
      const res = await apiRequest("POST", "/api/todos", todoData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Todo created successfully" });
      refetchTodos();
      setNewTodo({ title: '', description: '', priority: 'Medium', dueDate: '' });
      setIsAddingTodo(false);
    },
    onError: () => {
      toast({ title: "Failed to create todo", variant: "destructive" });
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/todos/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      refetchTodos();
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/todos/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Todo deleted successfully" });
      refetchTodos();
    },
  });

  const createListMutation = useMutation({
    mutationFn: async (listData: any) => {
      const res = await apiRequest("POST", "/api/todo-lists", listData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Todo list created successfully" });
      refetchLists();
      refetchTodos();
      setNewList({ name: '', description: '', color: '#4F46E5' });
      setIsAddingList(false);
    },
    onError: () => {
      toast({ title: "Failed to create todo list", variant: "destructive" });
    },
  });

  const handleCreateTodo = () => {
    if (!newTodo.title.trim()) {
      toast({ title: "Please enter a todo title", variant: "destructive" });
      return;
    }

    createTodoMutation.mutate({
      ...newTodo,
      listId: selectedList,
    });
  };

  const handleCreateList = () => {
    if (!newList.name.trim()) {
      toast({ title: "Please enter a list name", variant: "destructive" });
      return;
    }

    createListMutation.mutate(newList);
  };

  const handleToggleTodo = (todo: Todo) => {
    updateTodoMutation.mutate({
      id: todo.id,
      completed: !todo.completed,
    });
  };

  const handleDeleteTodo = (id: number) => {
    if (confirm("Are you sure you want to delete this todo?")) {
      deleteTodoMutation.mutate(id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Ensure todos is always an array before filtering
  const todosArray = Array.isArray(todos) ? todos : [];

  const filteredTodos = selectedList
    ? todosArray.filter((todo: Todo) => todo.listId === selectedList)
    : todosArray.filter((todo: Todo) => !todo.listId);

  console.log('TodosPage render:', { todos, todoLists, filteredTodos, selectedList });

  if (todosLoading || listsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-screen overflow-hidden"> {/* Added overflow-hidden */}
        {/* List Sidebar */}
        <aside
          className={cn(
            "relative transition-all duration-300 ease-in-out",
            isMinimized ? "w-0 md:w-16" : "w-full md:w-64",
            !isVisible && "hidden"
          )}
        >
          <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 pr-2" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}></div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Todo Lists</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={!selectedList ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedList(null)}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  All Todos ({todosArray.filter((todo: Todo) => !todo.listId).length})
                </Button>
                {todoLists.map((list: TodoList) => (
                  <Button
                    key={list.id}
                    variant={selectedList === list.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedList(list.id)}
                    style={{
                      backgroundColor: selectedList === list.id ? list.color : 'transparent',
                      borderColor: list.color,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: list.color }}
                    />
                    {list.name} ({todosArray.filter((todo: Todo) => todo.listId === list.id).length})
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            isMinimized ? "ml-0 md:ml-16" : "ml-0 md:ml-64",
            !isVisible && "ml-0"
          )}
        >
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl shadow-lg">
                  <List className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Todo Management</h1>
                  <p className="text-muted-foreground">
                    Create and manage multiple todo lists to stay organized
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? "Expand" : "Minimize"}
                </Button>
                <Button
                  onClick={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? "Hide Lists" : "Show Lists"}
                </Button>
              </div>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Multiple Lists</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create unlimited todo lists with custom names, descriptions, and colors to organize different projects or areas of your life.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Task Management</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add, edit, complete, and delete tasks within each list. Set priorities and track progress with completion counts.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <List className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Flexible Interface</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Draggable, resizable interface that can be minimized or hidden. Perfect for quick task management while working on other things.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Todo Management</h1>
                  <p className="text-muted-foreground">Create and manage multiple todo lists to stay organized</p>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={isAddingList} onOpenChange={setIsAddingList}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <List className="mr-2 h-4 w-4" />
                        New List
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Todo List</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="List name"
                          value={newList.name}
                          onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={newList.description}
                          onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                        />
                        <div className="flex items-center space-x-2">
                          <label>Color:</label>
                          <input
                            type="color"
                            value={newList.color}
                            onChange={(e) => setNewList({ ...newList, color: e.target.value })}
                            className="w-10 h-10 rounded border"
                          />
                        </div>
                        <Button onClick={handleCreateList} className="w-full" disabled={createListMutation.isPending}>
                          {createListMutation.isPending ? "Creating..." : "Create List"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isAddingTodo} onOpenChange={setIsAddingTodo}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Todo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Todo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Todo title"
                          value={newTodo.title}
                          onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={newTodo.description}
                          onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                        />
                        <Select value={newTodo.priority} onValueChange={(value: any) => setNewTodo({ ...newTodo, priority: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={newTodo.dueDate}
                          onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                        />
                        <Button onClick={handleCreateTodo} className="w-full" disabled={createTodoMutation.isPending}>
                          {createTodoMutation.isPending ? "Adding..." : "Add Todo"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* List Sidebar */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Todo Lists</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pr-2" style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f3f4f6'
                    }}>
                      <Button
                        variant={!selectedList ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedList(null)}
                      >
                        <CheckSquare className="mr-2 h-4 w-4" />
                        All Todos ({todosArray.filter((todo: Todo) => !todo.listId).length})
                      </Button>
                      {todoLists.map((list: TodoList) => (
                        <Button
                          key={list.id}
                          variant={selectedList === list.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setSelectedList(list.id)}
                          style={{
                            backgroundColor: selectedList === list.id ? list.color : 'transparent',
                            borderColor: list.color,
                          }}
                        >
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: list.color }}
                          />
                          {list.name} ({todosArray.filter((todo: Todo) => todo.listId === list.id).length})
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Todos Display */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {selectedList
                          ? todoLists.find((list: TodoList) => list.id === selectedList)?.name || 'Selected List'
                          : 'All Todos'
                        }
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#d1d5db #f3f4f6'
                      }}>
                        {filteredTodos.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No todos yet. Add a new todo above!
                          </p>
                        ) : (
                          filteredTodos.map((todo: Todo) => (
                            <div
                              key={todo.id}
                              className={cn(
                                "flex items-center space-x-3 p-3 border rounded-lg",
                                todo.completed && "opacity-60 bg-gray-50"
                              )}
                            >
                              <Checkbox
                                checked={todo.completed}
                                onCheckedChange={() => handleToggleTodo(todo)}
                              />
                              <div className="flex-1">
                                <h3 className={cn(
                                  "font-medium",
                                  todo.completed && "line-through text-gray-500"
                                )}>
                                  {todo.title}
                                </h3>
                                {todo.description && (
                                  <p className="text-sm text-muted-foreground">{todo.description}</p>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge className={getPriorityColor(todo.priority)}>
                                    <Flag className="mr-1 h-3 w-3" />
                                    {todo.priority}
                                  </Badge>
                                  {todo.dueDate && (
                                    <Badge variant="outline">
                                      <Calendar className="mr-1 h-3 w-3" />
                                      {new Date(todo.dueDate).toLocaleDateString()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTodo(todo.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Getting Started</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Click the folder icon to create a new todo list</li>
                <li>• Use the dropdown to switch between your different lists</li>
                <li>• Add todos to any list and set their priority levels</li>
                <li>• Drag the interface around by clicking and holding the header</li>
                <li>• Delete lists using the trash icon (this will also delete all todos in that list)</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

export default TodosPage;