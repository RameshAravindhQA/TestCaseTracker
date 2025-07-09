import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Palette, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useColorTheme } from "./theme-provider";

// Define available color themes
export const colorThemes = [
  { id: "blue", name: "Blue", color: "#3b82f6" },
  { id: "purple", name: "Purple", color: "#9333ea" },
  { id: "teal", name: "Teal", color: "#14b8a6" },
  { id: "green", name: "Green", color: "#22c55e" },
  { id: "red", name: "Red", color: "#ef4444" },
  { id: "orange", name: "Orange", color: "#f97316" },
  { id: "pink", name: "Pink", color: "#ec4899" },
  { id: "indigo", name: "Indigo", color: "#6366f1" },
  { id: "amber", name: "Amber", color: "#f59e0b" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();
  const [mounted, setMounted] = useState(false);
  
  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Toggle theme"
          className="h-9 w-9 rounded-md border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === "light" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme Colors</DropdownMenuLabel>
        <Popover>
          <PopoverTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Color Theme</span>
              <div 
                className="ml-auto h-4 w-4 rounded-full" 
                style={{ backgroundColor: colorThemes.find(t => t.id === colorTheme)?.color }}
              />
            </DropdownMenuItem>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="end">
            <div className="grid grid-cols-3 gap-2">
              {colorThemes.map((themeOption) => (
                <Button
                  key={themeOption.id}
                  variant="outline"
                  size="sm"
                  className={`h-8 w-full flex items-center justify-center rounded-md p-0 ${
                    colorTheme === themeOption.id ? 'ring-2 ring-offset-1 ring-ring' : ''
                  }`}
                  style={{ backgroundColor: themeOption.color, color: '#fff' }}
                  onClick={() => setColorTheme(themeOption.id)}
                >
                  {colorTheme === themeOption.id && (
                    <Check className="h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// For situations where you need display of current theme text
export function ThemeToggleWithText() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex items-center gap-2 px-3 py-2 w-full justify-start"
      >
        {theme === "dark" ? (
          <>
            <Sun className="h-4 w-4" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            <span>Dark Mode</span>
          </>
        )}
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 px-3 py-2 w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>Color Theme</span>
            </div>
            <div 
              className="h-4 w-4 rounded-full" 
              style={{ backgroundColor: colorThemes.find(t => t.id === colorTheme)?.color }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="end">
          <div className="grid grid-cols-3 gap-2">
            {colorThemes.map((themeOption) => (
              <Button
                key={themeOption.id}
                variant="outline"
                size="sm"
                className={`h-8 w-full flex items-center justify-center rounded-md p-0 ${
                  colorTheme === themeOption.id ? 'ring-2 ring-offset-1 ring-ring' : ''
                }`}
                style={{ backgroundColor: themeOption.color, color: '#fff' }}
                onClick={() => setColorTheme(themeOption.id)}
              >
                {colorTheme === themeOption.id && (
                  <Check className="h-3 w-3" />
                )}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}