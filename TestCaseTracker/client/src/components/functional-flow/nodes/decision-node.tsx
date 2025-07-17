import { Handle, NodeProps, Position } from 'reactflow';

export function DecisionNode({ data }: NodeProps) {
  return (
    <div className="relative">
      {/* Diamond shape for decision node */}
      <div className="w-24 h-24 bg-yellow-400 border-2 border-yellow-500 transform rotate-45 flex items-center justify-center shadow-md">
        <div className="transform -rotate-45 text-white font-medium text-sm text-center max-w-16">
          {data.label || 'Decision'}
        </div>
      </div>
      
      {/* Input handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input" 
        style={{ 
          background: '#fff', 
          width: '8px', 
          height: '8px', 
          border: '2px solid #f59e0b',
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* Output handles for Yes/No */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="yes" 
        style={{ 
          background: '#fff', 
          width: '8px', 
          height: '8px', 
          border: '2px solid #f59e0b',
          bottom: '-4px',
          left: '25%'
        }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="no" 
        style={{ 
          background: '#fff', 
          width: '8px', 
          height: '8px', 
          border: '2px solid #f59e0b',
          bottom: '-4px',
          right: '25%'
        }}
      />
    </div>
  );
}

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