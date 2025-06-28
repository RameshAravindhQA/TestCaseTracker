
import { MainLayout } from "@/components/layout/main-layout";
import { TodoList } from "@/components/todo/todo-list";
import { useState } from "react";
import { CheckSquare, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TodosPage() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <MainLayout>
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

        {/* Todo Interface */}
        <div className="relative h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          {!isVisible && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Click "Show Lists" to display your todo interface</p>
              </div>
            </div>
          )}
          
          <TodoList
            isVisible={isVisible}
            onToggleVisibility={() => setIsVisible(!isVisible)}
            isMinimized={isMinimized}
            onToggleMinimize={() => setIsMinimized(!isMinimized)}
          />
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
    </MainLayout>
  );
}
