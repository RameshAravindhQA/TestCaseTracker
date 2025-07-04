import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const DEFAULT_COLORS = [
  "#f44336", // Red
  "#e91e63", // Pink
  "#9c27b0", // Purple
  "#673ab7", // Deep Purple
  "#3f51b5", // Indigo
  "#2196f3", // Blue
  "#03a9f4", // Light Blue
  "#00bcd4", // Cyan
  "#009688", // Teal
  "#4caf50", // Green
  "#8bc34a", // Light Green
  "#cddc39", // Lime
  "#ffeb3b", // Yellow
  "#ffc107", // Amber
  "#ff9800", // Orange
  "#ff5722", // Deep Orange
  "#795548", // Brown
  "#607d8b", // Blue Grey
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  colors?: string[];
}

export function ColorPicker({ 
  value, 
  onChange, 
  disabled = false,
  colors = DEFAULT_COLORS 
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(value);
  const customColorInputRef = useRef<HTMLInputElement>(null);

  // Sync the internal state with the external value
  useEffect(() => {
    setSelectedColor(value);
  }, [value]);

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    onChange(color);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("relative", disabled && "opacity-50 cursor-not-allowed")}
          disabled={disabled}
        >
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <Palette className="absolute opacity-20 w-3 h-3" />
          <span className="sr-only">Pick a color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="font-medium text-sm">Select a color</div>
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <motion.button
                key={color}
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-6 h-6 rounded-full border",
                  selectedColor === color ? "ring-2 ring-primary ring-offset-2" : "border-gray-300"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleSelectColor(color)}
              />
            ))}
          </div>
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="custom-color" className="text-xs font-medium">
              Custom color
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={customColorInputRef}
                type="color"
                id="custom-color"
                value={selectedColor}
                onChange={(e) => handleSelectColor(e.target.value)}
                className="w-10 h-8 p-0 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => handleSelectColor(e.target.value)}
                className="flex-1 h-8 px-2 text-sm border rounded"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}