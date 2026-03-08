import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { MindMapNodeProps } from '../types';

export const VerticalLineNode: React.FC<MindMapNodeProps> = ({ id, data, selected }) => {
  const color = data.strokeColor || '#374151';
  const thickness = data.strokeWidth || 3;
  const lineStyle = (data.strokeStyle || 'solid') as React.CSSProperties['borderLeftStyle'];
  const h = data.height || 200;
  const nodeW = Math.max(thickness + 12, 24);
  const handleVis = selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';

  return (
    <div
      className="relative flex justify-center group"
      style={{ height: h, width: nodeW, minHeight: 40 }}
      data-nodeid={id}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={nodeW}
        minHeight={40}
        handleClassName="h-3 w-3 bg-white border-2 border-blue-400 rounded"
        lineClassName="border-blue-400"
        onResize={(_, params) => {
          window.mindmapApi?.updateNodeData(id, { height: params.height });
        }}
      />
      <div
        className="h-full"
        style={{
          borderLeftWidth: thickness,
          borderLeftStyle: lineStyle,
          borderLeftColor: color,
        }}
      />
      {/* Top handles — always in DOM for edge attachment */}
      <Handle type="source" position={Position.Top}    id="top-source"
        className={`w-3 h-3 !bg-mindmap-primary transition-opacity ${handleVis}`} />
      <Handle type="target" position={Position.Top}    id="top-target"
        className={`w-3 h-3 !bg-mindmap-primary transition-opacity ${handleVis}`} />
      {/* Bottom handles */}
      <Handle type="source" position={Position.Bottom} id="bottom-source"
        className={`w-3 h-3 !bg-mindmap-primary transition-opacity ${handleVis}`} />
      <Handle type="target" position={Position.Bottom} id="bottom-target"
        className={`w-3 h-3 !bg-mindmap-primary transition-opacity ${handleVis}`} />
    </div>
  );
};
