
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, Globe, Star, Trash2, Plus, X, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BaseNodeData } from '../types';

interface ResourceSettingsProps {
  nodeId: string;
  data: BaseNodeData;
}

export const ResourceSettings: React.FC<ResourceSettingsProps> = ({ nodeId, data }) => {
  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    type: 'website' as 'pdf' | 'video' | 'website' | 'other',
    rating: 5 as 1 | 2 | 3 | 4 | 5,
    description: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);

  const resources = data.resources || [];

  const handleAddResource = () => {
    if (!newResource.title || !newResource.url) return;

    const updatedResources = [
      ...resources,
      {
        id: uuidv4(),
        title: newResource.title,
        url: newResource.url,
        type: newResource.type,
        rating: newResource.rating,
        description: newResource.description,
        tags: newResource.tags
      }
    ];

    window.mindmapApi?.updateNodeData(nodeId, { resources: updatedResources });
    setNewResource({
      title: '',
      url: '',
      type: 'website',
      rating: 5,
      description: '',
      tags: []
    });
  };

  const handleUpdateResource = () => {
    if (!editingResourceId || !newResource.title || !newResource.url) return;

    const updatedResources = resources.map(resource => 
      resource.id === editingResourceId ? {
        ...resource,
        title: newResource.title,
        url: newResource.url,
        type: newResource.type,
        rating: newResource.rating,
        description: newResource.description,
        tags: newResource.tags
      } : resource
    );

    window.mindmapApi?.updateNodeData(nodeId, { resources: updatedResources });
    setEditingResourceId(null);
    setNewResource({
      title: '',
      url: '',
      type: 'website',
      rating: 5,
      description: '',
      tags: []
    });
  };

  const handleDeleteResource = (id: string) => {
    const updatedResources = resources.filter(resource => resource.id !== id);
    window.mindmapApi?.updateNodeData(nodeId, { resources: updatedResources });
    
    if (editingResourceId === id) {
      setEditingResourceId(null);
      setNewResource({
        title: '',
        url: '',
        type: 'website',
        rating: 5,
        description: '',
        tags: []
      });
    }
  };

  const handleEditResource = (resource: any) => {
    setEditingResourceId(resource.id);
    setNewResource({
      title: resource.title,
      url: resource.url,
      type: resource.type,
      rating: resource.rating || 5,
      description: resource.description || '',
      tags: resource.tags || []
    });
  };

  const handleCancelEdit = () => {
    setEditingResourceId(null);
    setNewResource({
      title: '',
      url: '',
      type: 'website',
      rating: 5,
      description: '',
      tags: []
    });
  };

  const handleAddTag = () => {
    if (!newTag.trim() || newResource.tags.includes(newTag.trim())) return;
    
    setNewResource(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setNewResource(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <Video className="h-4 w-4 text-blue-500" />;
      case 'website': return <Globe className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf': return 'PDF Document';
      case 'video': return 'Video';
      case 'website': return 'Website';
      default: return 'Other';
    }
  };

  const getRatingStars = (rating: number = 0) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star 
            key={i}
            className={`h-4 w-4 ${i <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Resource Settings</h3>
        
        {/* Resource list */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {resources.map(resource => (
            <div 
              key={resource.id} 
              className="p-3 border rounded-md bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    {getResourceIcon(resource.type)}
                    <h4 className="font-medium text-base">{resource.title}</h4>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-base text-gray-500">
                    <span>{getResourceTypeLabel(resource.type)}</span>
                    <span>•</span>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 flex items-center"
                    >
                      Visit <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                  
                  {resource.description && (
                    <p className="text-base text-gray-700">{resource.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-wrap gap-1">
                      {resource.tags && resource.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0 h-5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {resource.rating && (
                      <div className="flex justify-end">
                        {getRatingStars(resource.rating)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-1 ml-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => handleEditResource(resource)}
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
                    onClick={() => handleDeleteResource(resource.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {resources.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-base">
              No resources added yet. Create your first resource below.
            </div>
          )}
        </div>
        
        {/* Add/Edit resource form */}
        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="text-base font-medium">
            {editingResourceId ? 'Edit Resource' : 'Add New Resource'}
          </h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="resource-title">Title</Label>
              <Input
                id="resource-title"
                value={newResource.title}
                onChange={e => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Resource title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resource-url">URL</Label>
              <Input
                id="resource-url"
                value={newResource.url}
                onChange={e => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resource-type">Type</Label>
              <Select
                value={newResource.type}
                onValueChange={(value) => 
                  setNewResource(prev => ({ 
                    ...prev, 
                    type: value as 'pdf' | 'video' | 'website' | 'other' 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resource-description">Description (optional)</Label>
              <Textarea
                id="resource-description"
                value={newResource.description}
                onChange={e => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
                className="min-h-[60px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setNewResource(prev => ({ ...prev, rating: rating as 1 | 2 | 3 | 4 | 5 }))}
                    className="p-1"
                  >
                    <Star 
                      className={`h-5 w-5 ${
                        rating <= newResource.rating 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resource-tags">Tags</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {newResource.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="h-3 w-3 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="resource-tags"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  Add
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              {editingResourceId ? (
                <>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateResource}>
                    Update Resource
                  </Button>
                </>
              ) : (
                <Button onClick={handleAddResource}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Resource
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
