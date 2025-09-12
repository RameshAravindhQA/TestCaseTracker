import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tag } from "@/types";

interface TagInputProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  max?: number;
}

export function TagInput({ tags, onChange, max = 10 }: TagInputProps) {
  const [tagInput, setTagInput] = useState("");
  const [tagColor, setTagColor] = useState("#3b82f6"); // Default blue
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < max) {
      const newTag: Tag = {
        id: `tag-${Date.now()}`,
        name: tagInput.trim(),
        color: tagColor,
      };
      onChange([...tags, newTag]);
      setTagInput("");
      // Don't reset color so user can add multiple tags with same color if desired
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (id: string) => {
    onChange(tags.filter((tag) => tag.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 min-h-[40px] border rounded-md bg-background">
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.div
              key={tag.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-white text-sm"
              style={{ backgroundColor: tag.color }}
            >
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="flex items-center justify-center rounded-full w-4 h-4 bg-white/30 hover:bg-white/40 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag..."
          className="flex-1"
          maxLength={20}
          disabled={tags.length >= max}
        />
        <ColorPicker value={tagColor} onChange={setTagColor} />
        <Button
          type="button"
          size="icon"
          onClick={handleAddTag}
          disabled={!tagInput.trim() || tags.length >= max}
          className="flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add tag</span>
        </Button>
      </div>

      {max && (
        <p className="text-xs text-muted-foreground">
          {tags.length} of {max} tags used
        </p>
      )}
    </div>
  );
}