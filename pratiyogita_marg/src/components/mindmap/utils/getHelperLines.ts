import type { Node, NodeChange, NodePositionChange } from '@xyflow/react';

type GetHelperLinesResult = {
  horizontal?: number;
  vertical?: number;
  snapX?: number;
  snapY?: number;
};

// Distance threshold in pixels — lines show within this range and node snaps
const SNAP_THRESHOLD = 8;

/**
 * Given the list of node changes (from onNodesChange) and the current nodes,
 * compute horizontal and vertical alignment guide-lines for the node being dragged.
 *
 * Returns the y-coordinate for a horizontal line and x-coordinate for a vertical line,
 * plus optional snap-corrected positions for the dragged node.
 */
export function getHelperLines(
  changes: NodeChange[],
  nodes: Node[],
): GetHelperLinesResult {
  const result: GetHelperLinesResult = {};

  // Find the position-change that represents an active drag
  const positionChange = changes.find(
    (c): c is NodePositionChange => c.type === 'position' && c.dragging === true,
  );
  if (!positionChange || !positionChange.position) return result;

  const draggedNode = nodes.find((n) => n.id === positionChange.id);
  if (!draggedNode) return result;

  const draggedW = draggedNode.measured?.width ?? (draggedNode.data as any)?.width ?? draggedNode.width ?? 100;
  const draggedH = draggedNode.measured?.height ?? (draggedNode.data as any)?.height ?? draggedNode.height ?? 40;

  // Edges of the dragged node (using the *new* position from the change)
  const dragLeft = positionChange.position.x;
  const dragRight = dragLeft + draggedW;
  const dragCenterX = dragLeft + draggedW / 2;
  const dragTop = positionChange.position.y;
  const dragBottom = dragTop + draggedH;
  const dragCenterY = dragTop + draggedH / 2;

  let bestDx = SNAP_THRESHOLD + 1;
  let bestDy = SNAP_THRESHOLD + 1;
  let snapX: number | undefined;
  let snapY: number | undefined;
  let verticalLine: number | undefined;
  let horizontalLine: number | undefined;

  for (const node of nodes) {
    if (node.id === positionChange.id) continue;
    if (node.id === '__workspace_boundary__') continue;

    const w = node.measured?.width ?? (node.data as any)?.width ?? node.width ?? 100;
    const h = node.measured?.height ?? (node.data as any)?.height ?? node.height ?? 40;
    const left = node.position.x;
    const right = left + w;
    const centerX = left + w / 2;
    const top = node.position.y;
    const bottom = top + h;
    const centerY = top + h / 2;

    // --- Vertical alignment (x-axis snapping) ---
    // left-left
    const checks: [number, number, number][] = [
      [Math.abs(dragLeft - left), left, left],
      [Math.abs(dragLeft - right), right, right],
      [Math.abs(dragLeft - centerX), centerX, centerX],
      [Math.abs(dragRight - left), left, left - draggedW],
      [Math.abs(dragRight - right), right, right - draggedW],
      [Math.abs(dragRight - centerX), centerX, centerX - draggedW],
      [Math.abs(dragCenterX - left), left, left - draggedW / 2],
      [Math.abs(dragCenterX - right), right, right - draggedW / 2],
      [Math.abs(dragCenterX - centerX), centerX, centerX - draggedW / 2],
    ];

    for (const [dist, lineX, nodeSnapX] of checks) {
      if (dist < bestDx) {
        bestDx = dist;
        verticalLine = lineX;
        snapX = nodeSnapX;
      }
    }

    // --- Horizontal alignment (y-axis snapping) ---
    const hChecks: [number, number, number][] = [
      [Math.abs(dragTop - top), top, top],
      [Math.abs(dragTop - bottom), bottom, bottom],
      [Math.abs(dragTop - centerY), centerY, centerY],
      [Math.abs(dragBottom - top), top, top - draggedH],
      [Math.abs(dragBottom - bottom), bottom, bottom - draggedH],
      [Math.abs(dragBottom - centerY), centerY, centerY - draggedH],
      [Math.abs(dragCenterY - top), top, top - draggedH / 2],
      [Math.abs(dragCenterY - bottom), bottom, bottom - draggedH / 2],
      [Math.abs(dragCenterY - centerY), centerY, centerY - draggedH / 2],
    ];

    for (const [dist, lineY, nodeSnapY] of hChecks) {
      if (dist < bestDy) {
        bestDy = dist;
        horizontalLine = lineY;
        snapY = nodeSnapY;
      }
    }
  }

  if (bestDx <= SNAP_THRESHOLD) {
    result.vertical = verticalLine;
    result.snapX = snapX;
  }
  if (bestDy <= SNAP_THRESHOLD) {
    result.horizontal = horizontalLine;
    result.snapY = snapY;
  }

  return result;
}
