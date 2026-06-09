
import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { NodeContainer } from './NodeContainer';
import { MindMapNodeProps } from '../types';
import { Button } from '@/components/ui/button';

export const ChecklistNode: React.FC<MindMapNodeProps> = ({ 
  id, 
  data, 
  selected 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const toggleItem = (itemId: string) => {
    const updatedItems = data.checklistItems?.map(item => 
      item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
    ) || [];
    
    window.mindmapApi?.updateNodeData(id, {
      checklistItems: updatedItems
    });
  };
  
  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-300';
      case 'medium': return 'bg-yellow-100 border-yellow-300';
      case 'low': return 'bg-green-100 border-green-300';
      default: return '';
    }
  };
  
  const calculateProgress = () => {
    if (!data.checklistItems || data.checklistItems.length === 0) return 0;
    const completed = data.checklistItems.filter(item => item.isChecked).length;
    return Math.round((completed / data.checklistItems.length) * 100);
  };
  
  const progress = calculateProgress();
  
  // Default checklist if none exists
  const checklistItems = data.checklistItems || [
    { id: '1', text: 'Item 1', isChecked: false },
    { id: '2', text: 'Item 2', isChecked: false }
  ];

  return (
    <NodeContainer 
      nodeStyle="min-w-[200px] min-h-[100px] bg-white"
      nodeData={data}
      selected={selected}
      onDoubleClick={handleDoubleClick}
      forceAspectRatio={false}
      nodeId={id}
    >
      <div className="w-full p-2 relative">
        <div className="font-semibold text-sm mb-2">{data.label || 'Checklist'}</div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full mb-3">
          <div 
            className="bg-green-500 h-2 rounded-full" 
            style={{ width: `${progress}%` }}
            title={`${progress}% complete`}
          ></div>
        </div>
        
        {/* Checklist items */}
        <ul className="space-y-2 text-left">
          {checklistItems.map(item => (
            <li 
              key={item.id} 
              className={`flex items-center gap-2 p-1 rounded border ${getPriorityColor(item.priority)}`}
            >
              <Checkbox 
                id={`checklist-${id}-${item.id}`}
                checked={item.isChecked} 
                onCheckedChange={() => toggleItem(item.id)}
              />
              <label 
                htmlFor={`checklist-${id}-${item.id}`}
                className={`text-sm flex-1 ${item.isChecked ? 'line-through text-gray-500' : ''}`}
              >
                {item.text}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </NodeContainer>
  );
};
