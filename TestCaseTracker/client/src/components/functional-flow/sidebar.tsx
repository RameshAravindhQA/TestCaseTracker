import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FlowNodeType } from '../../../shared/functional-flow-types';

interface NodeItemProps {
  type: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

function NodeItem({ type, label, color, icon }: NodeItemProps) {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
    
    // Create a transparent drag image to prevent flickering
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent 1x1 pixel
    event.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  return (
    <div
      className="flex items-center p-2 rounded-md border border-gray-200 mb-2 cursor-grab hover:bg-gray-50 shadow-sm"
      onDragStart={onDragStart}
      draggable
    >
      <div 
        className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center mr-2" 
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-3 flex flex-col h-full">
      <h3 className="font-medium text-lg mb-3">Node Types</h3>
      <p className="text-sm text-gray-500 mb-4">Drag and drop nodes onto the canvas</p>
      <Separator className="mb-4" />
      
      <div className="overflow-y-auto flex-1">
        <h4 className="text-xs uppercase font-semibold text-gray-500 mb-2">Flow Controls</h4>
        <NodeItem
          type="startNode"
          label="Start"
          color="#4ade80"
          icon={<span className="text-white text-xs">▶</span>}
        />
        <NodeItem
          type="endNode"
          label="End"
          color="#f43f5e"
          icon={<span className="text-white text-xs">■</span>}
        />
        <NodeItem
          type="stepNode"
          label="Step / Action"
          color="#60a5fa"
          icon={<span className="text-white text-xs">●</span>}
        />
        <NodeItem
          type="decisionNode"
          label="Decision"
          color="#f59e0b"
          icon={<span className="text-white text-xs">◆</span>}
        />
        
        <h4 className="text-xs uppercase font-semibold text-gray-500 mt-4 mb-2">Special Nodes</h4>
        <NodeItem
          type="subprocessNode"
          label="Sub-process"
          color="#a78bfa"
          icon={<span className="text-white text-xs">◐</span>}
        />
        <NodeItem
          type="linkedNode"
          label="Linked Item"
          color="#ec4899"
          icon={<span className="text-white text-xs">↗</span>}
        />
        <NodeItem
          type="apiCallNode"
          label="API Call"
          color="#14b8a6"
          icon={<span className="text-white text-xs">⚡</span>}
        />
        <NodeItem
          type="externalSystemNode"
          label="External System"
          color="#6366f1"
          icon={<span className="text-white text-xs">⇆</span>}
        />

        <h4 className="text-xs uppercase font-semibold text-gray-500 mt-4 mb-2">Instructions</h4>
        <Card className="mt-2">
          <CardContent className="p-3">
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <span className="font-medium">Drag nodes</span> from the palette to the canvas</li>
              <li>• <span className="font-medium">Click nodes</span> to edit their properties</li>
              <li>• <span className="font-medium">Drag between ports</span> to create connections</li>
              <li>• <span className="font-medium">Right-click</span> for context menu options</li>
              <li>• Use <span className="font-medium">mouse wheel</span> to zoom in/out</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}