
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

interface GlobalIssueToggleProps {
  onToggle: () => void;
}

export function GlobalIssueToggle({ onToggle }: GlobalIssueToggleProps) {
  return (
    <div className="fixed left-4 bottom-4 z-50">
      <Button
        onClick={onToggle}
        className="rounded-full h-12 w-12 bg-red-600 hover:bg-red-700 shadow-lg"
        size="icon"
      >
        <Bug className="h-6 w-6" />
      </Button>
    </div>
  );
}
