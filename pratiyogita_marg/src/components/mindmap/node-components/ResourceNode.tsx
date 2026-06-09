
import React, { useState } from 'react';
import { FileText, Video, Globe, Star, ExternalLink } from 'lucide-react';
import { NodeContainer } from './NodeContainer';
import { MindMapNodeProps } from '../types';
import { Button } from '@/components/ui/button';

export const ResourceNode: React.FC<MindMapNodeProps> = ({ 
  id, 
  data, 
  selected 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  // Default resources if none exists
  const resources = data.resources || [
    { id: '1', title: 'Study Guide', url: 'https://example.com/guide', type: 'pdf', rating: 5 },
    { id: '2', title: 'Tutorial Video', url: 'https://example.com/video', type: 'video', rating: 4 }
  ];
  
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <Video className="h-4 w-4 text-blue-500" />;
      case 'website': return <Globe className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getRatingStars = (rating: number = 0) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star 
            key={i}
            className={`h-3 w-3 ${i <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <NodeContainer 
      nodeStyle="min-w-[220px] min-h-[130px] bg-white"
      nodeData={data}
      selected={selected}
      onDoubleClick={handleDoubleClick}
      forceAspectRatio={false}
      nodeId={id}
    >
      <div className="w-full p-2 relative">
        <div className="font-semibold text-sm mb-2">{data.label || 'Resources'}</div>
        
        {/* Resource list */}
        <ul className="space-y-2 text-left">
          {resources.map(resource => (
            <li key={resource.id} className="border rounded p-1.5 bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  {getResourceIcon(resource.type)}
                  <span className="text-xs font-medium truncate max-w-[120px]">
                    {resource.title}
                  </span>
                </div>
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {resource.rating && (
                <div className="flex justify-end">
                  {getRatingStars(resource.rating)}
                </div>
              )}
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {resource.tags.map(tag => (
                    <span key={tag} className="bg-blue-100 text-blue-800 text-[8px] px-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </NodeContainer>
  );
};
