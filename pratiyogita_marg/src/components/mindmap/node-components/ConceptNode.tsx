
import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeContainer } from './NodeContainer';
import { MindMapNodeProps } from '../types';
import { NodeContextMenu } from './NodeContextMenu';
import { Lightbulb, BookOpen } from 'lucide-react';

export function ConceptNode({ data, id, selected }: MindMapNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    window.mindmapApi?.updateNodeData(id, { definition: e.target.value });
  };

  // Map importance to visual indicator
  const getImportanceBadge = () => {
    switch (data.importance) {
      case 'high':
        return <div className="text-xs bg-red-100 text-red-800 px-1 rounded">High</div>;
      case 'medium':
        return <div className="text-xs bg-orange-100 text-orange-800 px-1 rounded">Medium</div>;
      case 'low':
        return <div className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Low</div>;
      default:
        return null;
    }
  };

  const nodeStyle = "rounded-md shadow border-blue-200";
  const examples = data.examples || [];
  
  return (
    <NodeContextMenu id={id}>
      <NodeContainer
        nodeStyle={nodeStyle}
        nodeData={data}
        selected={selected}
        onDoubleClick={handleDoubleClick}
        customStyle={{ 
          backgroundColor: data.backgroundColor || '#E6F0FF',
          minHeight: '120px',
          minWidth: '150px'
        }}
        forceAspectRatio={false}
        nodeId={id}
      >
        <div className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between mb-2 border-b pb-1">
            <div className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <div className={`font-medium ${data.fontSize ? `text-${data.fontSize}` : 'text-sm'}`}>
                {data.label || 'Concept'}
              </div>
            </div>
            {getImportanceBadge()}
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="text-xs font-medium mb-1">Definition:</div>
            {isEditing ? (
              <textarea
                className="w-full flex-1 bg-transparent resize-none p-1 focus:outline-none text-sm"
                value={data.definition || ''}
                onChange={handleContentChange}
                onBlur={handleBlur}
                autoFocus
              />
            ) : (
              <div className="p-1 text-sm text-left flex-1">
                {data.definition || 'Double-click to add definition'}
              </div>
            )}
            
            {examples.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium mb-1 flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Examples:
                </div>
                <ul className="list-disc list-inside text-xs pl-1">
                  {examples.map((example, index) => (
                    <li key={index} className="truncate">{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </NodeContainer>
    </NodeContextMenu>
  );
}
