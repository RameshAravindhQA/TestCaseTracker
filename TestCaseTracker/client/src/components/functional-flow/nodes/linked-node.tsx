import { Handle, NodeProps, Position } from 'reactflow';
import { ArrowUpRight } from 'lucide-react';

export function LinkedNode({ data }: NodeProps) {
  // Define link type colors and icons
  const getLinkDetails = () => {
    switch (data.linkedItemType) {
      case 'testCase':
        return { 
          color: 'bg-emerald-100', 
          border: 'border-emerald-300',
          textColor: 'text-emerald-800',
          descColor: 'text-emerald-600',
          label: 'Test Case'
        };
      case 'requirement':
        return { 
          color: 'bg-sky-100', 
          border: 'border-sky-300',
          textColor: 'text-sky-800',
          descColor: 'text-sky-600',
          label: 'Requirement'
        };
      case 'bug':
        return { 
          color: 'bg-rose-100', 
          border: 'border-rose-300',
          textColor: 'text-rose-800',
          descColor: 'text-rose-600',
          label: 'Bug'
        };
      default:
        return { 
          color: 'bg-pink-100', 
          border: 'border-pink-300',
          textColor: 'text-pink-800',
          descColor: 'text-pink-600',
          label: 'Linked Item'
        };
    }
  };

  const { color, border, textColor, descColor, label } = getLinkDetails();
  
  return (
    <div 
      className={`px-4 py-2 rounded-md ${color} ${border} min-w-[150px] shadow-md`}
      style={{ backgroundColor: data.bgColor }}
    >
      <div className="flex items-center">
        <ArrowUpRight className={`${textColor} mr-1`} size={16} />
        <div className={`font-medium ${textColor}`}>
          {data.label || label}
        </div>
      </div>
      
      {data.linkedItemId && (
        <div className={`text-xs ${descColor} mt-1`}>
          ID: {data.linkedItemId}
        </div>
      )}
      
      {data.description && (
        <div className={`text-xs ${descColor} mt-1 max-w-[200px]`}>
          {data.description}
        </div>
      )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #ec4899' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output" 
        style={{ background: '#fff', width: '8px', height: '8px', border: '2px solid #ec4899' }}
      />
    </div>
  );
}