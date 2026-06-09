
import { useState, useRef, useEffect } from 'react';
import { BaseNodeData } from '../types';

interface NodeContentProps {
  nodeData: BaseNodeData;
  id: string;
  label: string;
  isEditing: boolean;
  onLabelChange: (label: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const NodeContent: React.FC<NodeContentProps> = ({
  nodeData,
  id,
  label,
  isEditing,
  onLabelChange,
  onBlur,
  onKeyDown,
}) => {
  const [editValue, setEditValue] = useState(label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(label);
  }, [label]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    onLabelChange(e.target.value);
  };

  const getFontClassName = (fontSize?: number | string) => {
    if (typeof fontSize === 'number') {
      return `text-[${fontSize}px]`;
    }
    
    switch (fontSize) {
      case 'xs': return 'text-xs';
      case 's': 
      case 'sm': return 'text-sm';
      case 'l': 
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      case '3xl': return 'text-3xl';
      case 'm':
      case 'md':
      default: return 'text-base';
    }
  };

  const getFontWeight = (fw?: string): number | undefined => {
    switch (fw) {
      case 'light': return 300;
      case 'normal': return 400;
      case 'medium': return 500;
      case 'semibold': return 600;
      case 'bold': return 700;
      case 'extrabold': return 800;
      default: return undefined;
    }
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={editValue}
        onChange={handleInputChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="w-full h-full bg-transparent outline-none resize-none"
        style={{
          fontFamily: nodeData.fontFamily,
          fontSize: typeof nodeData.fontSize === 'number' ? `${nodeData.fontSize}px` : undefined,
          fontWeight: getFontWeight(nodeData.fontWeight),
          textAlign: nodeData.textAlign || 'center',
        }}
      />
    );
  }

  return (
    <div 
      className={`w-full h-full break-words ${getFontClassName(nodeData.fontSize)}`}
      style={{
        fontFamily: nodeData.fontFamily,
        fontWeight: getFontWeight(nodeData.fontWeight),
        color: nodeData.fontColor,
        textAlign: nodeData.textAlign || 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 
          nodeData.textAlign === 'left' ? 'flex-start' : 
          nodeData.textAlign === 'right' ? 'flex-end' : 
          'center',
      }}
    >
      {label || 'New Node'}
    </div>
  );
};
