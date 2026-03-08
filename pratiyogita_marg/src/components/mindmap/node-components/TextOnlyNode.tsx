import { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MindMapNodeProps } from '../types';
import { NodeContextMenu } from './NodeContextMenu';
import { NodeConnectors } from '../NodeConnectors';

export function TextOnlyNode({ data, id, selected }: MindMapNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '');

  useEffect(() => {
    setLabel(data.label || '');
  }, [data.label]);

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

  const fontSizeMap: Record<string, string> = {
    xs: '10px',
    s: '12px',
    m: '14px',
    l: '18px',
    xl: '24px',
  };

  const fontSize = data.fontSize
    ? typeof data.fontSize === 'number'
      ? `${data.fontSize}px`
      : fontSizeMap[data.fontSize as string] || '14px'
    : '14px';

  const fontWeightMap: Record<string, number> = {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  };

  const style: React.CSSProperties = {
    fontSize,
    fontWeight: data.fontWeight ? fontWeightMap[data.fontWeight] || 400 : 400,
    fontFamily: data.fontFamily || 'inherit',
    color: data.fontColor || data.strokeColor || '#1f2937',
    textAlign: (data.textAlign as 'left' | 'center' | 'right') || 'center',
    opacity: data.opacity ?? 1,
    minWidth: '60px',
    minHeight: '24px',
    padding: '4px 8px',
    width: data.width ? (typeof data.width === 'number' ? `${data.width}px` : data.width) : undefined,
  };

  if (data.rotation) {
    style.transform = `rotate(${data.rotation}deg)`;
  }

  return (
    <NodeContextMenu id={id}>
      <div
        className={`relative cursor-move ${
          selected ? 'outline-2 outline-dashed outline-blue-400 rounded' : ''
        }`}
        style={style}
        onDoubleClick={handleDoubleClick}
        data-nodeid={id}
      >
        <NodeConnectors />

        {isEditing ? (
          <textarea
            className="w-full bg-transparent resize-none focus:outline-none"
            style={{
              fontSize,
              fontWeight: style.fontWeight,
              fontFamily: style.fontFamily,
              color: style.color,
              textAlign: style.textAlign,
              border: 'none',
              padding: 0,
              minHeight: '24px',
            }}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {label || 'Double-click to edit text'}
          </div>
        )}
      </div>
    </NodeContextMenu>
  );
}
