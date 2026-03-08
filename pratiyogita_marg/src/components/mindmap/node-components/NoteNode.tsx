
import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeContainer } from './NodeContainer';
import { MindMapNodeProps } from '../types';
import { NodeContextMenu } from './NodeContextMenu';
import { StickyNote, Tag } from 'lucide-react';

export function NoteNode({ data, id, selected }: MindMapNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    window.mindmapApi?.updateNodeData(id, { noteContent: e.target.value });
  };

  const nodeStyle = "rounded-md shadow bg-yellow-50 border-yellow-200";
  const tags = data.tags || [];

  return (
    <NodeContextMenu id={id}>
      <NodeContainer
        nodeStyle={nodeStyle}
        nodeData={data}
        selected={selected}
        onDoubleClick={handleDoubleClick}
        customStyle={{ 
          backgroundColor: data.noteColor || '#FFFACD',
          minHeight: '100px'
        }}
        forceAspectRatio={false}
        nodeId={id}
      >
        <div className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between mb-2 border-b pb-1">
            <div className="flex items-center gap-1">
              <StickyNote className="h-4 w-4" />
              <div className={`font-medium ${data.fontSize ? `text-${data.fontSize}` : 'text-sm'}`}>
                {data.label || 'Note'}
              </div>
            </div>
            {data.pinned && (
              <div className="text-xs px-1 bg-yellow-200 rounded">Pinned</div>
            )}
          </div>
          
          {isEditing ? (
            <textarea
              className="w-full h-full flex-1 bg-transparent resize-none p-1 focus:outline-none"
              value={data.noteContent || ''}
              onChange={handleContentChange}
              onBlur={handleBlur}
              autoFocus
            />
          ) : (
            <div className="flex-1 whitespace-pre-wrap p-1 text-left overflow-y-auto text-sm">
              {data.noteContent || 'Double-click to add note content'}
            </div>
          )}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center text-xs bg-yellow-100 px-1 rounded">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </NodeContainer>
    </NodeContextMenu>
  );
}
