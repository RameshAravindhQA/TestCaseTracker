import { Handle, NodeProps, Position } from 'reactflow';

export function SubprocessNode({ data }: NodeProps) {
  return (
    <div 
      className="px-4 py-2 rounded-md bg-purple-100 border-2 border-purple-300 min-w-[150px] shadow-md"
      style={{ backgroundColor: data.bgColor || '#f3e8ff' }}
    >
      <div className="border-l-4 border-purple-500 pl-2">
        <div className="font-medium text-purple-800">{data.label || 'Sub-process'}</div>
        {data.description && (
          <div className="text-xs text-purple-600 mt-1 max-w-[200px]">
            {data.description}
          </div>
        )}
      </div>
      
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #a78bfa' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #a78bfa' }}
      />
    </div>
  );
}