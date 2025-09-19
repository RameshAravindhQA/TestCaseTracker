import { Handle, NodeProps, Position } from 'reactflow';
import { Zap } from 'lucide-react';

export function ApiCallNode({ data }: NodeProps) {
  return (
    <div 
      className="px-4 py-2 rounded-md bg-teal-100 border-2 border-teal-300 min-w-[150px] shadow-md"
      style={{ backgroundColor: data.bgColor || '#ccfbf1' }}
    >
      <div className="flex items-center justify-center">
        <Zap className="text-teal-600 mr-1" size={16} />
        <div className="font-medium text-teal-800 text-center">{data.label || 'API Call'}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-teal-600 mt-1 max-w-[200px] text-center">
          {data.description}
        </div>
      )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #14b8a6' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output-success" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #14b8a6' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output-error" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #ef4444' }}
      />
    </div>
  );
}