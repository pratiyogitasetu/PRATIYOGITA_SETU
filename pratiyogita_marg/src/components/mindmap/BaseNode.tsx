
import { useState, useEffect } from 'react';
import { MindMapNodeProps } from './types';
import { NodeContextMenu } from './node-components/NodeContextMenu';
import { NodeContent } from './node-components/NodeContent';
import { NodeContainer } from './node-components/NodeContainer';
import { getNodeStyle } from './utils/fontSizeUtils';

export const BaseNode = ({ data, id, selected }: MindMapNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '');
  const [nodeData, setNodeData] = useState(data);

  useEffect(() => {
    if (data) {
      setNodeData(data);
      setLabel(data.label);
    }
  }, [data]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    window.mindmapApi?.updateNodeData(id, { label });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      window.mindmapApi?.updateNodeData(id, { label });
    }
  };

  if (!nodeData) return null;

  const nodeStyle = getNodeStyle(nodeData.nodeType);

  // Remove forced aspect ratio for "title", "topic", "subtopic", "paragraph"
  // so they behave like "Main Idea" (title type), i.e. allow width/height to scale freely
  const rectangularTypes = ['title', 'topic', 'subtopic', 'paragraph'];
  const forceAspectRatio = false; // Apply free rectangular resizing for all such nodes

  return (
    <NodeContextMenu id={id}>
      <NodeContainer
        nodeStyle={nodeStyle}
        nodeData={nodeData}
        selected={selected}
        onDoubleClick={handleDoubleClick}
        forceAspectRatio={forceAspectRatio}
        nodeId={id}
      >
        <NodeContent
          nodeData={nodeData}
          id={id}
          label={label}
          isEditing={isEditing}
          onLabelChange={setLabel}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />

      </NodeContainer>
    </NodeContextMenu>
  );
};
