import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Settings, MoreHorizontal } from 'lucide-react';
import { EdgeData } from './types';

interface EdgeSettingsProps {
  id: string;
  data: EdgeData;
}

export const EdgeSettings = ({ id, data }: EdgeSettingsProps) => {
  const [label, setLabel] = useState(data.label || '');
  const [arrowStart, setArrowStart] = useState<boolean>(
    typeof data.arrowStart === 'boolean' ? data.arrowStart : false
  );
  const [arrowEnd, setArrowEnd] = useState<boolean>(
    typeof data.arrowEnd === 'boolean' ? data.arrowEnd : false
  );
  const [strokeWidth, setStrokeWidth] = useState(data.strokeWidth || 1);
  const [strokeColor, setStrokeColor] = useState(data.strokeColor || 'black');
  const [strokeStyle, setStrokeStyle] = useState(data.strokeStyle || 'solid');
  const [pathStyle, setPathStyle] = useState(data.pathStyle || 'straight');

  const handleSave = () => {
    window.mindmapApi?.updateEdge(id, {
      label,
      arrowStart,
      arrowEnd,
      strokeWidth,
      strokeColor,
      strokeStyle,
      pathStyle,
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="absolute bottom-4 right-4 z-50">
          <MoreHorizontal className="mr-2 h-4 w-4" />
          Edge Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Edge Settings</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <Tabs defaultValue="style">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="arrow">Arrow</TabsTrigger>
            </TabsList>
            <TabsContent value="style" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Edge Label"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stroke-color">Stroke Color</Label>
                <div className="flex space-x-2">
                  {['black', 'red', 'green', 'blue', 'orange', 'purple'].map((color) => (
                    <div
                      key={color}
                      className={`w-8 h-8 rounded-full cursor-pointer ${
                        strokeColor === color ? 'ring-2 ring-offset-2 ring-black' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setStrokeColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stroke-width">Stroke Width: {strokeWidth}px</Label>
                <Slider
                  id="stroke-width"
                  min={1}
                  max={10}
                  step={1}
                  value={[strokeWidth]}
                  onValueChange={(value) => setStrokeWidth(value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stroke-style">Stroke Style</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={strokeStyle === 'solid' ? 'default' : 'outline'}
                    onClick={() => setStrokeStyle('solid')}
                  >
                    Solid
                  </Button>
                  <Button
                    variant={strokeStyle === 'dashed' ? 'default' : 'outline'}
                    onClick={() => setStrokeStyle('dashed')}
                  >
                    Dashed
                  </Button>
                  <Button
                    variant={strokeStyle === 'dotted' ? 'default' : 'outline'}
                    onClick={() => setStrokeStyle('dotted')}
                  >
                    Dotted
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="path-style">Path Style</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={pathStyle === 'straight' ? 'default' : 'outline'}
                    onClick={() => setPathStyle('straight')}
                  >
                    Straight
                  </Button>
                  <Button
                    variant={pathStyle === 'step' ? 'default' : 'outline'}
                    onClick={() => setPathStyle('step')}
                  >
                    Step
                  </Button>
                  <Button
                    variant={pathStyle === 'smoothstep' ? 'default' : 'outline'}
                    onClick={() => setPathStyle('smoothstep')}
                  >
                    Smooth Step
                  </Button>
                  <Button
                    variant={pathStyle === 'curved' ? 'default' : 'outline'}
                    onClick={() => setPathStyle('curved')}
                  >
                    Curved
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="arrow" className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="arrow-start"
                  checked={arrowStart}
                  onCheckedChange={setArrowStart}
                />
                <Label htmlFor="arrow-start">Arrow at Start</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="arrow-end"
                  checked={arrowEnd}
                  onCheckedChange={setArrowEnd}
                />
                <Label htmlFor="arrow-end">Arrow at End</Label>
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} className="w-full mt-4">
            Apply Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
