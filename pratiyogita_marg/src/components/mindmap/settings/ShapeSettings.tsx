
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BaseNodeData, FontWeight } from "../types";
import { 
  Circle, Square, Triangle, RotateCw, AlignCenter, AlignLeft, 
  AlignRight, AlignStartVertical, AlignEndVertical, AlignCenterVertical,
  Send, SendToBack, Layers, Group
} from "lucide-react";

const strokeColors = ['black', 'red', 'green', 'blue', 'orange', '#9b87f5', '#7E69AB'];
const backgroundColors = ['white', 'pink', 'lightgreen', 'lightblue', 'lightyellow', 'transparent', '#E5DEFF', '#FEF7CD', '#FDE1D3'];
const fontFamilies = ['serif', 'sans-serif', 'monospace', 'cursive'];
const strokeStyles = ['solid', 'dashed', 'dotted'] as const;

interface ShapeSettingsProps {
  nodeId: string;
  data: BaseNodeData;
}

export function ShapeSettings({ data, nodeId }: ShapeSettingsProps) {
  const [rotation, setRotation] = useState(data.rotation || 0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(data.aspectRatio || false);
  const [shadowEnabled, setShadowEnabled] = useState(data.shadow?.enabled || false);
  const [glowEnabled, setGlowEnabled] = useState(data.glow?.enabled || false);
  
  const handleChange = (updates: Partial<BaseNodeData>) => {
    window.mindmapApi?.updateNodeData(nodeId, updates);
  };

  const handleRotationChange = (value: number) => {
    setRotation(value);
    handleChange({ rotation: value });
  };
  
  const handleAspectRatioChange = (checked: boolean) => {
    setMaintainAspectRatio(checked);
    handleChange({ aspectRatio: checked });
  };
  
  const handleShadowChange = (checked: boolean) => {
    setShadowEnabled(checked);
    handleChange({ 
      shadow: {
        ...data.shadow,
        enabled: checked,
        color: checked ? (data.shadow?.color || 'rgba(0,0,0,0.3)') : undefined,
        blur: checked ? (data.shadow?.blur || 5) : undefined,
        offsetX: checked ? (data.shadow?.offsetX || 3) : undefined,
        offsetY: checked ? (data.shadow?.offsetY || 3) : undefined,
      }
    });
  };
  
  const handleGlowChange = (checked: boolean) => {
    setGlowEnabled(checked);
    handleChange({ 
      glow: {
        ...data.glow,
        enabled: checked,
        color: checked ? (data.glow?.color || '#9b87f5') : undefined,
        blur: checked ? (data.glow?.blur || 8) : undefined,
      }
    });
  };
  
  const handleLayerChange = (direction: 'forward' | 'backward') => {
    const currentZ = data.zIndex || 0;
    handleChange({ zIndex: direction === 'forward' ? currentZ + 1 : currentZ - 1 });
  };

  return (
    <div className="space-y-6 pb-6">
      <Tabs defaultValue="style" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="text">Text & Effects</TabsTrigger>
          <TabsTrigger value="transform">Transform</TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-medium mb-3">Label</h4>
              <Input
                value={data.label}
                onChange={(e) => handleChange({ label: e.target.value })}
                placeholder="Enter label"
              />
            </div>

            <div>
              <h4 className="text-base font-medium mb-3">Border Style</h4>
              <div className="flex gap-2">
                {strokeStyles.map((style) => (
                  <Button
                    key={style}
                    variant={data.strokeStyle === style ? "default" : "outline"}
                    onClick={() => handleChange({ strokeStyle: style })}
                  >
                    {style === 'solid' ? '—' : style === 'dashed' ? '- -' : '...'}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-base font-medium mb-3">Border Width</h4>
              <Slider
                defaultValue={[data.strokeWidth || 1]}
                min={0}
                max={10}
                step={1}
                onValueChange={(value) => handleChange({ strokeWidth: value[0] })}
                className="mb-2"
              />
              <div className="text-base text-gray-500">{data.strokeWidth || 1}px</div>
            </div>

            <div>
              <h4 className="text-base font-medium mb-3">Border Color</h4>
              <div className="flex gap-2 flex-wrap">
                {strokeColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border ${
                      data.strokeColor === color ? 'ring-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleChange({ strokeColor: color })}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <h4 className="text-base font-medium">Background</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="transparent-bg"
                    checked={data.backgroundColor === 'transparent'}
                    onCheckedChange={(checked) => 
                      handleChange({ backgroundColor: checked ? 'transparent' : 'white' })
                    }
                  />
                  <Label htmlFor="transparent-bg">Transparent</Label>
                </div>
              </div>
              {data.backgroundColor !== 'transparent' && (
                <div className="flex gap-2 flex-wrap">
                  {backgroundColors.filter(c => c !== 'transparent').map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border ${
                        data.backgroundColor === color ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleChange({ backgroundColor: color })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="text" className="space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-medium mb-3">Font Family</h4>
              <div className="flex gap-2 flex-wrap">
                {fontFamilies.map((font) => (
                  <Button
                    key={font}
                    variant={data.fontFamily === font ? "default" : "outline"}
                    onClick={() => handleChange({ fontFamily: font })}
                    style={{ fontFamily: font }}
                  >
                    Aa
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-base font-medium mb-3">Font Size</h4>
              <div className="flex gap-2">
                {["xs", "s", "m", "l", "xl"].map((size) => (
                  <Button
                    key={size}
                    variant={data.fontSize === size ? "default" : "outline"}
                    onClick={() => handleChange({ fontSize: size as any })}
                    className="w-10"
                  >
                    {size.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-base font-medium mb-3">Font Weight</h4>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'light', label: 'Light' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'semibold', label: 'Semi' },
                  { value: 'bold', label: 'Bold' },
                  { value: 'extrabold', label: 'Extra' },
                ] as { value: FontWeight; label: string }[]).map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={data.fontWeight === value ? "default" : "outline"}
                    onClick={() => handleChange({ fontWeight: value })}
                    className="w-16"
                    style={{ fontWeight: value === 'light' ? 300 : value === 'normal' ? 400 : value === 'medium' ? 500 : value === 'semibold' ? 600 : value === 'bold' ? 700 : 800 }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-base font-medium mb-3">Text Alignment</h4>
              <div className="flex gap-2">
                <Button
                  variant={data.textAlign === 'left' ? "default" : "outline"}
                  onClick={() => handleChange({ textAlign: 'left' })}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={data.textAlign === 'center' ? "default" : "outline"}
                  onClick={() => handleChange({ textAlign: 'center' })}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={data.textAlign === 'right' ? "default" : "outline"}
                  onClick={() => handleChange({ textAlign: 'right' })}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <h4 className="text-base font-medium">Drop Shadow</h4>
                <Switch
                  id="shadow-enabled"
                  checked={shadowEnabled}
                  onCheckedChange={handleShadowChange}
                />
              </div>
              {shadowEnabled && (
                <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                  <div>
                    <Label htmlFor="shadow-color">Color</Label>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(155,135,245,0.5)', 'rgba(255,0,0,0.3)'].map((color) => (
                        <button
                          key={color}
                          className={`w-6 h-6 rounded-full border ${
                            data.shadow?.color === color ? 'ring-2 ring-primary' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleChange({ 
                            shadow: { ...data.shadow, color, enabled: true } 
                          })}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shadow-blur">Blur</Label>
                    <Slider
                      id="shadow-blur"
                      defaultValue={[data.shadow?.blur || 5]}
                      min={0}
                      max={20}
                      step={1}
                      onValueChange={(value) => handleChange({ 
                        shadow: { ...data.shadow, blur: value[0], enabled: true } 
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <h4 className="text-base font-medium">Glow Effect</h4>
                <Switch
                  id="glow-enabled"
                  checked={glowEnabled}
                  onCheckedChange={handleGlowChange}
                />
              </div>
              {glowEnabled && (
                <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                  <div>
                    <Label htmlFor="glow-color">Color</Label>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {['#9b87f5', '#f97316', '#0ea5e9', '#22c55e'].map((color) => (
                        <button
                          key={color}
                          className={`w-6 h-6 rounded-full border ${
                            data.glow?.color === color ? 'ring-2 ring-primary' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleChange({ 
                            glow: { ...data.glow, color, enabled: true } 
                          })}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="glow-blur">Intensity</Label>
                    <Slider
                      id="glow-blur"
                      defaultValue={[data.glow?.blur || 8]}
                      min={2}
                      max={20}
                      step={1}
                      onValueChange={(value) => handleChange({ 
                        glow: { ...data.glow, blur: value[0], enabled: true } 
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="transform" className="space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-medium mb-3">Rotation</h4>
              <div className="flex items-center gap-2">
                <Slider
                  defaultValue={[rotation]}
                  min={0}
                  max={360}
                  step={15}
                  onValueChange={(value) => handleRotationChange(value[0])}
                  className="flex-1"
                />
                <div className="min-w-[40px] text-center text-base">{rotation}°</div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleRotationChange(0)}
                  title="Reset rotation"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRotationChange(0)}
                >
                  0°
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRotationChange(90)}
                >
                  90°
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRotationChange(180)}
                >
                  180°
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRotationChange(270)}
                >
                  270°
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium">Maintain Aspect Ratio</h4>
              <Switch
                id="aspect-ratio"
                checked={maintainAspectRatio}
                onCheckedChange={handleAspectRatioChange}
              />
            </div>
            
            <div>
              <h4 className="text-base font-medium mb-3">Vertical Alignment</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {/* implement alignment */}}
                >
                  <AlignStartVertical className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {/* implement alignment */}}
                >
                  <AlignCenterVertical className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {/* implement alignment */}}
                >
                  <AlignEndVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-base font-medium mb-3">Layering</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleLayerChange('forward')}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Bring Forward
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleLayerChange('backward')}
                  className="flex-1"
                >
                  <SendToBack className="h-4 w-4 mr-2" />
                  Send Backward
                </Button>
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                disabled={true} // Will be implemented in a future update
              >
                <Group className="h-4 w-4 mr-2" />
                Group with Selected Shapes
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
