import { Handle, NodeProps, Position } from 'reactflow';

export function StartNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-2 rounded-full bg-green-400 text-white border-2 border-green-500 min-w-[100px] text-center shadow-md">
      <div className="font-medium">{data.label || 'Start'}</div>
      
      {/* Only output handle, no input for start node */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #4ade80' }}
      />
    </div>
  );
}