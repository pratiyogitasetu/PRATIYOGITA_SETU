
import React, { useState } from 'react';
import { NodeContainer } from './NodeContainer';
import { MindMapNodeProps } from '../types';

export const CircleNode: React.FC<MindMapNodeProps> = ({ 
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
  
  // Apply shadow if enabled
  const shadowStyle = data.shadow?.enabled ? {
    boxShadow: `${data.shadow.offsetX || 2}px ${data.shadow.offsetY || 2}px ${data.shadow.blur || 4}px ${data.shadow.color || 'rgba(0,0,0,0.3)'}`,
  } : {};
  
  // Apply glow if enabled
  const glowStyle = data.glow?.enabled ? {
    filter: `drop-shadow(0 0 ${data.glow.blur || 8}px ${data.glow.color || '#3b82f6'})`,
  } : {};
  
  // Combine all styles
  const combinedStyle = {
    ...rotationStyle,
    ...shadowStyle,
    ...glowStyle,
    aspectRatio: data.aspectRatio !== false ? '1 / 1' : 'auto', // Force 1:1 aspect ratio by default
  };

  return (
    <NodeContainer 
      nodeStyle="flex items-center justify-center rounded-full overflow-hidden"
      nodeData={data}
      selected={selected}
      onDoubleClick={handleDoubleClick}
      customStyle={combinedStyle}
      forceAspectRatio={data.aspectRatio !== false}
      nodeId={id}
    >
      <div className="w-full h-full p-2 flex items-center justify-center relative">
        <div className="text-center">{data.label || 'Circle'}</div>
      </div>
    </NodeContainer>
  );
};
