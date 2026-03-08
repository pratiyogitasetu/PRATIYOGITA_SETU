import { useState } from 'react';
import { MindMapNodeProps } from '../types';
import { NodeContextMenu } from './NodeContextMenu';
import { NodeContainer } from './NodeContainer';
import { ExternalLink } from 'lucide-react';

export function LinkNode({ data, id, selected }: MindMapNodeProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    window.mindmapApi?.updateNodeData(id, { label: e.target.value });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    window.mindmapApi?.updateNodeData(id, { linkUrl: e.target.value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  const linkUrl = data.linkUrl || '';
  const linkLabel = data.label || 'Click to edit link';

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing && linkUrl) {
      e.stopPropagation();
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <NodeContextMenu id={id}>
      <NodeContainer
        nodeStyle="rounded-lg"
        nodeData={data}
        selected={selected}
        onDoubleClick={handleDoubleClick}
        forceAspectRatio={false}
        nodeId={id}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-2 gap-1.5">
          {isEditing ? (
            <div className="w-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                value={linkLabel}
                onChange={handleLabelChange}
                onKeyDown={handleKeyDown}
                placeholder="Link text"
                autoFocus
              />
              <input
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                value={linkUrl}
                onChange={handleUrlChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
              />
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={handleClick}
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <span
                className={`text-sm font-medium ${
                  linkUrl
                    ? 'text-blue-600 underline underline-offset-2 group-hover:text-blue-800'
                    : 'text-gray-500 italic'
                }`}
                style={{
                  fontSize: data.fontSize
                    ? typeof data.fontSize === 'number'
                      ? `${data.fontSize}px`
                      : undefined
                    : undefined,
                }}
              >
                {linkLabel}
              </span>
            </div>
          )}
          {!isEditing && linkUrl && (
            <span className="text-[10px] text-gray-400 truncate max-w-full">
              {linkUrl}
            </span>
          )}
        </div>
      </NodeContainer>
    </NodeContextMenu>
  );
}
