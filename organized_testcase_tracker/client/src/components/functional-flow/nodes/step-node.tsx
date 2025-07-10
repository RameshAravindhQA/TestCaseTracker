import { Handle, NodeProps, Position } from 'reactflow';

export function StepNode({ data }: NodeProps) {
  return (
    <div 
      className="px-4 py-2 rounded bg-blue-100 border-2 border-blue-300 min-w-[150px] shadow-md"
      style={{ backgroundColor: data.bgColor || '#dbeafe' }}
    >
      <div className="font-medium text-blue-800 text-center">{data.label || 'Step'}</div>
      {data.description && (
        <div className="text-xs text-blue-600 mt-1 max-w-[200px] text-center">
          {data.description}
        </div>
      )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #60a5fa' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #60a5fa' }}
      />
    </div>
  );
}