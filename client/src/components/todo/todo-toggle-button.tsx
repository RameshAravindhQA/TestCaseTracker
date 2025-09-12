
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";
import { TodoList } from "./todo-list";

export function TodoToggleButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-40 rounded-full h-12 w-12 p-0 shadow-lg"
        title="Toggle Todo List"
      >
        <CheckSquare className="h-5 w-5" />
      </Button>

      <TodoList
        isVisible={isVisible}
        onToggleVisibility={() => setIsVisible(false)}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
      />
    </>
  );
}
