
import { useState } from 'react';
import { BaseNodeData } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { StickyNote, Plus, Trash, Tag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface NoteSettingsProps {
  nodeId: string;
  data: BaseNodeData;
}

export function NoteSettings({ nodeId, data }: NoteSettingsProps) {
  const { toast } = useToast();
  const [newTag, setNewTag] = useState('');
  
  // Set default values if they don't exist
  const noteContent = data.noteContent || '';
  const noteColor = data.noteColor || '#FFFACD';
  const pinned = data.pinned || false;
  const tags = data.tags || [];

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    window.mindmapApi?.updateNodeData(nodeId, { noteContent: e.target.value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    window.mindmapApi?.updateNodeData(nodeId, { noteColor: e.target.value });
  };

  const handlePinnedChange = (checked: boolean) => {
    window.mindmapApi?.updateNodeData(nodeId, { pinned: checked });
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...tags, newTag.trim()];
    window.mindmapApi?.updateNodeData(nodeId, { tags: updatedTags });
    setNewTag('');
    
    toast({
      title: "Tag added",
      description: `Added tag: ${newTag.trim()}`,
    });
  };

  const removeTag = (index: number) => {
    const updatedTags = [...tags];
    updatedTags.splice(index, 1);
    window.mindmapApi?.updateNodeData(nodeId, { tags: updatedTags });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <StickyNote className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Note Settings</h2>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="appearance">Appearance & Tags</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Note Title</Label>
            <Input 
              id="note-title" 
              value={data.label || ''} 
              onChange={(e) => window.mindmapApi?.updateNodeData(nodeId, { label: e.target.value })}
              placeholder="Enter note title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note-content">Note Content</Label>
            <Textarea 
              id="note-content" 
              value={noteContent} 
              onChange={handleContentChange}
              placeholder="Enter your note content here"
              className="min-h-[200px]"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="note-color">Note Color</Label>
            <div className="flex items-center space-x-2">
              <Input 
                id="note-color" 
                type="color" 
                value={noteColor} 
                onChange={handleColorChange}
                className="w-12 h-8 p-1"
              />
              <div 
                className="w-8 h-8 rounded" 
                style={{ backgroundColor: noteColor }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 py-2">
            <Switch 
              id="pinned" 
              checked={pinned}
              onCheckedChange={handlePinnedChange}
            />
            <Label htmlFor="pinned">Pin this note</Label>
          </div>
          
          <div className="space-y-2 pt-2">
            <Label className="flex items-center" htmlFor="tags">
              <Tag className="h-4 w-4 mr-1" />
              Tags
            </Label>
            
            <div className="flex space-x-2">
              <Input 
                id="tags" 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button 
                size="sm" 
                onClick={addTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center bg-yellow-100 rounded px-2 py-1">
                  <span className="mr-1">{tag}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0"
                    onClick={() => removeTag(index)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
