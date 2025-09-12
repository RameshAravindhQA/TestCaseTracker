import { Handle, NodeProps, Position } from 'reactflow';

export function EndNode({ data }: NodeProps) {
  return (
    <div className="w-20 h-20 bg-red-400 text-white border-2 border-red-500 flex items-center justify-center shadow-md">
      <div className="font-medium text-center">{data.label || 'End'}</div>
      
      {/* Only input handle, no output for end node */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #ef4444' }}
      />
    </div>
  );
}

export function EndNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-2 rounded-full bg-red-400 text-white border-2 border-red-500 min-w-[100px] text-center shadow-md">
      <div className="font-medium">{data.label || 'End'}</div>
      
      {/* Only input handle, no output for end node */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #f43f5e' }}
      />
    </div>
  );
}