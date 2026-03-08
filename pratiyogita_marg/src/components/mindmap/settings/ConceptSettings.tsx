
import { useState } from 'react';
import { BaseNodeData } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, Plus, Trash, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

interface ConceptSettingsProps {
  nodeId: string;
  data: BaseNodeData;
}

export function ConceptSettings({ nodeId, data }: ConceptSettingsProps) {
  const { toast } = useToast();
  const [newExample, setNewExample] = useState('');
  
  // Set default values if they don't exist
  const definition = data.definition || '';
  const importance = data.importance || 'medium';
  const examples = data.examples || [];

  const handleDefinitionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    window.mindmapApi?.updateNodeData(nodeId, { definition: e.target.value });
  };

  const handleImportanceChange = (value: string) => {
    window.mindmapApi?.updateNodeData(nodeId, { 
      importance: value as 'low' | 'medium' | 'high' 
    });
  };

  const addExample = () => {
    if (!newExample.trim()) return;
    
    const updatedExamples = [...examples, newExample.trim()];
    window.mindmapApi?.updateNodeData(nodeId, { examples: updatedExamples });
    setNewExample('');
    
    toast({
      title: "Example added",
      description: `Added example to concept`,
    });
  };

  const removeExample = (index: number) => {
    const updatedExamples = [...examples];
    updatedExamples.splice(index, 1);
    window.mindmapApi?.updateNodeData(nodeId, { examples: updatedExamples });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <h2 className="text-2xl font-bold">Concept Settings</h2>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Definition</TabsTrigger>
          <TabsTrigger value="examples">Examples & Importance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="concept-title">Concept Name</Label>
            <Input 
              id="concept-title" 
              value={data.label || ''} 
              onChange={(e) => window.mindmapApi?.updateNodeData(nodeId, { label: e.target.value })}
              placeholder="Enter concept name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="concept-definition">Definition</Label>
            <Textarea 
              id="concept-definition" 
              value={definition} 
              onChange={handleDefinitionChange}
              placeholder="Define this concept"
              className="min-h-[200px]"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="examples" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Importance Level</Label>
              <RadioGroup 
                value={importance} 
                onValueChange={handleImportanceChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="text-red-800">High</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="text-orange-800">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="text-blue-800">Low</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="border-t pt-4">
              <Label className="flex items-center mb-2" htmlFor="examples">
                <BookOpen className="h-4 w-4 mr-1" />
                Examples
              </Label>
              
              <div className="flex space-x-2">
                <Input 
                  id="examples" 
                  value={newExample} 
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Add example"
                  onKeyDown={(e) => e.key === 'Enter' && addExample()}
                />
                <Button 
                  size="sm" 
                  onClick={addExample}
                  disabled={!newExample.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2 mt-4">
                {examples.map((example, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 rounded px-3 py-2">
                    <span>{example}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => removeExample(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
