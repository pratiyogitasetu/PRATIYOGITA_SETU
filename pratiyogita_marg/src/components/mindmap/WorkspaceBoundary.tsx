
import { memo } from 'react';

// Workspace dimensions in flow coordinates
export const WORKSPACE_WIDTH = 800;
export const WORKSPACE_HEIGHT = 3000;
export const WORKSPACE_X = 0;
export const WORKSPACE_Y = 0;

interface WorkspaceBoundaryNodeProps {
  data: Record<string, unknown>;
}

export const WorkspaceBoundaryNode = memo(({ }: WorkspaceBoundaryNodeProps) => {
  return (
    <div
      style={{
        width: WORKSPACE_WIDTH,
        height: WORKSPACE_HEIGHT,
        border: '2px dashed #f97316',
        borderRadius: 12,
        pointerEvents: 'none',
        backgroundColor: 'rgba(249, 115, 22, 0.03)',
      }}
    />
  );
});

WorkspaceBoundaryNode.displayName = 'WorkspaceBoundaryNode';
