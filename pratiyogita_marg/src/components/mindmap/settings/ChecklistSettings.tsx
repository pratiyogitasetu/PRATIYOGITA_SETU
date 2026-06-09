
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BaseNodeData } from '../types';

interface ChecklistSettingsProps {
  nodeId: string;
  data: BaseNodeData;
}

export const ChecklistSettings: React.FC<ChecklistSettingsProps> = ({ nodeId, data }) => {
  const [newItem, setNewItem] = useState({
    text: '',
    isChecked: false,
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const checklistItems = data.checklistItems || [];

  const handleAddItem = () => {
    if (!newItem.text) return;

    const updatedItems = [
      ...checklistItems,
      {
        id: uuidv4(),
        text: newItem.text,
        isChecked: newItem.isChecked,
        priority: newItem.priority
      }
    ];

    window.mindmapApi?.updateNodeData(nodeId, { checklistItems: updatedItems });
    setNewItem({
      text: '',
      isChecked: false,
      priority: 'medium'
    });
  };

  const handleUpdateItem = () => {
    if (!editingItemId || !newItem.text) return;

    const updatedItems = checklistItems.map(item => 
      item.id === editingItemId ? {
        ...item,
        text: newItem.text,
        isChecked: newItem.isChecked,
        priority: newItem.priority
      } : item
    );

    window.mindmapApi?.updateNodeData(nodeId, { checklistItems: updatedItems });
    setEditingItemId(null);
    setNewItem({
      text: '',
      isChecked: false,
      priority: 'medium'
    });
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = checklistItems.filter(item => item.id !== id);
    window.mindmapApi?.updateNodeData(nodeId, { checklistItems: updatedItems });
    
    if (editingItemId === id) {
      setEditingItemId(null);
      setNewItem({
        text: '',
        isChecked: false,
        priority: 'medium'
      });
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setNewItem({
      text: item.text,
      isChecked: item.isChecked,
      priority: item.priority || 'medium'
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setNewItem({
      text: '',
      isChecked: false,
      priority: 'medium'
    });
  };

  const handleToggleItem = (id: string) => {
    const updatedItems = checklistItems.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    );
    
    window.mindmapApi?.updateNodeData(nodeId, { checklistItems: updatedItems });
  };

  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    const itemIndex = checklistItems.findIndex(item => item.id === id);
    if (
      (direction === 'up' && itemIndex === 0) || 
      (direction === 'down' && itemIndex === checklistItems.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    const updatedItems = [...checklistItems];
    const [movedItem] = updatedItems.splice(itemIndex, 1);
    updatedItems.splice(newIndex, 0, movedItem);
    
    window.mindmapApi?.updateNodeData(nodeId, { checklistItems: updatedItems });
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-300';
      case 'medium': return 'bg-yellow-100 border-yellow-300';
      case 'low': return 'bg-green-100 border-green-300';
      default: return '';
    }
  };

  const getPriorityLabel = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Checklist Settings</h3>
        
        {/* Checklist items */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {checklistItems.map((item, index) => (
            <div 
              key={item.id} 
              className={`p-3 border rounded-md ${getPriorityColor(item.priority)}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="flex flex-col space-y-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => handleMoveItem(item.id, 'up')}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => handleMoveItem(item.id, 'down')}
                      disabled={index === checklistItems.length - 1}
                    >
                      <GripVertical className="h-4 w-4 -rotate-90" />
                    </Button>
                  </div>
                  
                  <Checkbox 
                    id={`checklist-setting-${item.id}`}
                    checked={item.isChecked} 
                    onCheckedChange={() => handleToggleItem(item.id)}
                  />
                  
                  <div className="flex-1">
                    <label 
                      htmlFor={`checklist-setting-${item.id}`}
                      className={`text-base ${item.isChecked ? 'line-through text-gray-500' : ''}`}
                    >
                      {item.text}
                    </label>
                    
                    <div className="flex items-center mt-1">
                      <span className="text-base text-gray-500 mr-2">Priority:</span>
                      <span className={`text-base px-2 py-0.5 rounded-full inline-flex items-center justify-center ${
                        item.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {getPriorityLabel(item.priority)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => handleEditItem(item)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500" 
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {checklistItems.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-base">
              No checklist items added yet. Create your first item below.
            </div>
          )}
        </div>
        
        {/* Add/Edit item form */}
        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="text-base font-medium">
            {editingItemId ? 'Edit Item' : 'Add New Item'}
          </h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="item-text">Task</Label>
              <Input
                id="item-text"
                value={newItem.text}
                onChange={e => setNewItem(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Task description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item-priority">Priority</Label>
              <div className="flex flex-col space-y-2">
                <RadioGroup
                  value={newItem.priority}
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))}
                  className="flex space-x-2"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="low" id="priority-low" />
                    <Label htmlFor="priority-low" className="font-normal text-green-700">Low</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="medium" id="priority-medium" />
                    <Label htmlFor="priority-medium" className="font-normal text-yellow-700">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="high" id="priority-high" />
                    <Label htmlFor="priority-high" className="font-normal text-red-700">High</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="is-checked"
                checked={newItem.isChecked}
                onCheckedChange={(checked) => 
                  setNewItem(prev => ({ ...prev, isChecked: checked === true }))
                }
              />
              <Label htmlFor="is-checked" className="font-normal">Mark as completed</Label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              {editingItemId ? (
                <>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateItem}>
                    Update Item
                  </Button>
                </>
              ) : (
                <Button onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
