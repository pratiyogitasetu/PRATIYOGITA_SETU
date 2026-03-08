
import { Handle, Position } from '@xyflow/react';

export const NodeConnectors = () => {
  return (
    <>
      <Handle
        type="source"
        position={Position.Top}
        className="w-3 h-3 !bg-mindmap-primary"
        id="top-source"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-mindmap-primary"
        id="top-target"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-mindmap-primary"
        id="right-source"
      />
      <Handle
        type="target"
        position={Position.Right}
        className="w-3 h-3 !bg-mindmap-primary"
        id="right-target"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-mindmap-primary"
        id="bottom-source"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="w-3 h-3 !bg-mindmap-primary"
        id="bottom-target"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-3 h-3 !bg-mindmap-primary"
        id="left-source"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-mindmap-primary"
        id="left-target"
      />
    </>
  );
};
