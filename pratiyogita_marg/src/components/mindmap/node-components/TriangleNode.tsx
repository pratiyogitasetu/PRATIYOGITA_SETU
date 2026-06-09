
import React, { useState } from 'react';
import { NodeContainer } from './NodeContainer';
import { MindMapNodeProps } from '../types';

export const TriangleNode: React.FC<MindMapNodeProps> = ({ 
  id, 
  data, 
  selected 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  
  // Apply rotation if specified
  const rotationStyle = data.rotation ? {
    transform: `rotate(${data.rotation}deg)`,
  } : {};
  
  // Apply glow if enabled
  const glowStyle = data.glow?.enabled ? {
    filter: `drop-shadow(0 0 ${data.glow.blur || 8}px ${data.glow.color || '#3b82f6'})`,
  } : {};

  const strokeColor = data.strokeColor || '#000';
  const strokeWidth = data.strokeWidth || 1;
  const strokeStyle = data.strokeStyle || 'solid';
  const fillColor = data.backgroundColor || '#fff';

  // Map stroke style to SVG dash array
  const dashArray = strokeStyle === 'dashed' ? '8,4' : strokeStyle === 'dotted' ? '2,4' : 'none';

  return (
    <div className="relative">
      <NodeContainer 
        nodeStyle="flex items-center justify-center overflow-visible"
        nodeData={{...data, backgroundColor: 'transparent', strokeWidth: 0, strokeColor: 'transparent'}}
        selected={selected}
        onDoubleClick={handleDoubleClick}
        customStyle={{
          ...rotationStyle,
          aspectRatio: data.aspectRatio !== false ? '1 / 1' : 'auto',
          borderColor: 'transparent',
        }}
        forceAspectRatio={data.aspectRatio !== false}
        nodeId={id}
      >
        {/* SVG triangle with proper visible borders */}
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={glowStyle}
        >
          <polygon
            points="50,2 2,98 98,98"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 2}
            strokeDasharray={dashArray}
            strokeLinejoin="round"
          />
        </svg>
        
        <div className="w-full h-full p-2 flex items-center justify-center relative z-10" style={{ paddingTop: '35%' }}>
          <div className="text-center">{data.label || 'Triangle'}</div>
          

        </div>
      </NodeContainer>
    </div>
  );
};
