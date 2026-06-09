import { useViewport } from '@xyflow/react';
import { CSSProperties, useMemo } from 'react';

const LINE_COLOR = '#3b82f6'; // blue-500

interface HelperLinesProps {
  horizontal?: number;
  vertical?: number;
}

/**
 * Renders alignment guide lines as absolutely-positioned HTML divs.
 * Must be rendered as a sibling overlay on the ReactFlow wrapper div (with position:relative).
 */
export function HelperLines({ horizontal, vertical }: HelperLinesProps) {
  const { x: tx, y: ty, zoom } = useViewport();

  const verticalStyle = useMemo<CSSProperties | null>(() => {
    if (typeof vertical !== 'number') return null;
    return {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: vertical * zoom + tx,
      width: 0,
      borderLeft: `1.5px dashed ${LINE_COLOR}`,
      pointerEvents: 'none',
      zIndex: 1000,
    };
  }, [vertical, zoom, tx]);

  const horizontalStyle = useMemo<CSSProperties | null>(() => {
    if (typeof horizontal !== 'number') return null;
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: horizontal * zoom + ty,
      height: 0,
      borderTop: `1.5px dashed ${LINE_COLOR}`,
      pointerEvents: 'none',
      zIndex: 1000,
    };
  }, [horizontal, zoom, ty]);

  return (
    <>
      {verticalStyle && <div style={verticalStyle} />}
      {horizontalStyle && <div style={horizontalStyle} />}
    </>
  );
}
