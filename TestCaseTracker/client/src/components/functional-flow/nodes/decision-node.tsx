import { Handle, NodeProps, Position } from 'reactflow';

export function DecisionNode({ data }: NodeProps) {
  return (
    <div 
      className="w-[150px] h-[100px] flex items-center justify-center rotate-45 bg-amber-100 border-2 border-amber-300 shadow-md"
      style={{ backgroundColor: data.bgColor || '#fef3c7' }}
    >
      <div className="rotate-[-45deg] text-center w-[120px]">
        <div className="font-medium text-amber-800">{data.label || 'Decision'}</div>
        {data.description && (
          <div className="text-xs text-amber-600 mt-1 max-w-[100px] mx-auto">
            {data.description}
          </div>
        )}
      </div>
      
      {/* Input handle on top corner of diamond */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input"
        className="rotate-[-45deg]"
        style={{ 
          top: '-5px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          background: '#fff', 
          width: '8px', 
          height: '8px', 
          border: '2px solid #f59e0b' 
        }}
      />
      
      {/* Output handles for Yes/No or True/False paths */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output-yes"
        className="rotate-[-45deg]"
        style={{ 
          right: '-7px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          background: '#fff', 
          width: '8px', 
          height: '8px', 
          border: '2px solid #16a34a' 
        }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output-no"
        className="rotate-[-45deg]"
        style={{ 
          bottom: '-7px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          background: '#fff', 
          width: '8px', 
          height: '8px', 
          border: '2px solid #ef4444' 
        }}
      />
    </div>
  );
}