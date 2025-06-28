
import { MainLayout } from "@/components/layout/main-layout";
import { TodoList } from "@/components/todo/todo-list";
import { useState } from "react";
import { CheckSquare } from "lucide-react";

export default function TodosPage() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl shadow-lg">
            <CheckSquare className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Todo List</h1>
            <p className="text-muted-foreground">
              Manage your tasks and stay organized
            </p>
          </div>
        </div>
        
        <div className="relative h-[600px]">
          <TodoList
            isVisible={isVisible}
            onToggleVisibility={() => setIsVisible(!isVisible)}
            isMinimized={isMinimized}
            onToggleMinimize={() => setIsMinimized(!isMinimized)}
          />
        </div>
      </div>
    </MainLayout>
  );
}
