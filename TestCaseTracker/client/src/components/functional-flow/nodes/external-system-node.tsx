import { Handle, NodeProps, Position } from 'reactflow';
import { ExternalLink } from 'lucide-react';

export function ExternalSystemNode({ data }: NodeProps) {
  return (
    <div 
      className="px-4 py-2 rounded-md bg-indigo-100 border-2 border-indigo-300 min-w-[150px] shadow-md"
      style={{ backgroundColor: data.bgColor || '#e0e7ff' }}
    >
      <div className="flex items-center justify-center">
        <ExternalLink className="text-indigo-600 mr-1" size={16} />
        <div className="font-medium text-indigo-800 text-center">{data.label || 'External System'}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-indigo-600 mt-1 max-w-[200px] text-center">
          {data.description}
        </div>
      )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #6366f1' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #6366f1' }}
      />
    </div>
  );
}