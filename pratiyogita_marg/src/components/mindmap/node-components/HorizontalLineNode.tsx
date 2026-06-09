import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { MindMapNodeProps } from '../types';

export const HorizontalLineNode: React.FC<MindMapNodeProps> = ({ id, data, selected }) => {
  const color = data.strokeColor || '#374151';
  const thickness = data.strokeWidth || 3;
  const lineStyle = (data.strokeStyle || 'solid') as React.CSSProperties['borderTopStyle'];
  const w = data.width || 200;
  const nodeH = Math.max(thickness + 12, 24);
  const handleVis = selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';

  return (
    <div
      className="relative flex items-center group"
      style={{ width: w, height: nodeH, minWidth: 40 }}
      data-nodeid={id}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={40}
        minHeight={nodeH}
        handleClassName="h-3 w-3 bg-white border-2 border-blue-400 rounded"
        lineClassName="border-blue-400"
        onResize={(_, params) => {
          window.mindmapApi?.updateNodeData(id, { width: params.width });
        }}
      />
      <div
        className="w-full"
        style={{
          borderTopWidth: thickness,
          borderTopStyle: lineStyle,
          borderTopColor: color,
        }}
      />
      {/* Left handles — always in DOM for edge attachment */}
      <Handle type="source" position={Position.Left}  id="left-source"
        className={`w-3 h-3 !bg-mindmap-primary transition-opacity ${handleVis}`} />
      <Handle type="target" position={Position.Left}  id="left-target"
        className={`w-3 h-3 !bg-mindmap-primary transition-opacity ${handleVis}`} />
      {/* Right handles */}
      <Handle type="source" position={Position.Right} id="right-source"
        className={`w-3 h-3 !bg-mindmap-primary transition-opacity ${handleVis}`} />
      <Handle type="target" position={Position.Right} id="right-target"
        className={`w-3 h-3 !bg-mindmap-primary transition-opacity ${handleVis}`} />
    </div>
  );
};
