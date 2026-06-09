import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { BaseNodeData, FontSize, FontWeight, NodeContent, LegendPosition } from "./types";
import { Plus, Trash, Check, Settings } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const strokeColors = ['black', 'red', 'green', 'blue', 'orange', 'black'];
const backgroundColors = ['white', 'pink', 'lightgreen', 'lightblue', 'lightyellow', 'transparent'];
const fontFamilies = ['serif', 'sans-serif', 'monospace', 'cursive'];
const strokeStyles = ['solid', 'dashed', 'dotted'] as const;
const textAligns = ['left', 'center', 'right'] as const;
const fontSizes: FontSize[] = ['xs', 's', 'm', 'l', 'xl'];
const fontWeights: { value: FontWeight; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semi' },
  { value: 'bold', label: 'Bold' },
  { value: 'extrabold', label: 'Extra' },
];

const legendPositions: { value: LegendPosition; label: string }[] = [
  { value: 'left-top', label: 'Left: Top' },
  { value: 'left-center', label: 'Left: Center' },
  { value: 'left-bottom', label: 'Left: Bottom' },
  { value: 'right-top', label: 'Right: Top' },
  { value: 'right-center', label: 'Right: Center' },
  { value: 'right-bottom', label: 'Right: Bottom' },
];

interface NodeSettingsProps {
  data: BaseNodeData;
  nodeId: string;
}

export function NodeSettings({ data, nodeId }: NodeSettingsProps) {
  const [newLink, setNewLink] = useState({ url: '', label: '' });
  
  const handleChange = (updates: Partial<BaseNodeData>) => {
    window.mindmapApi?.updateNodeData(nodeId, updates);
  };

  const handleContentChange = (content: Partial<NodeContent>) => {
    const updatedContent = {
      ...data.content,
      ...content
    };
    handleChange({ content: updatedContent });
  };

  const handleLegendChange = (position: LegendPosition) => {
    handleChange({
      legend: {
        enabled: true,
        position,
        color: data.legend?.color || '#000000',
        text: data.legend?.text || '',
      },
    });
  };

  const removeLegend = () => {
    handleChange({
      legend: {
        enabled: false,
        position: data.legend?.position || 'right-top',
        color: data.legend?.color || '#000000',
        text: data.legend?.text || '',
      },
    });
  };

  const handleLegendColorChange = (color: string) => {
    if (data.legend) {
      handleChange({
        legend: {
          ...data.legend,
          color,
        },
      });
    }
  };

  const addLink = () => {
    if (!newLink.url || !newLink.label) return;
    
    const currentLinks = data.content?.links || [];
    handleContentChange({
      links: [...currentLinks, newLink]
    });
    setNewLink({ url: '', label: '' });
  };

  const removeLink = (index: number) => {
    const currentLinks = data.content?.links || [];
    handleContentChange({
      links: currentLinks.filter((_, i) => i !== index)
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="node-settings absolute top-0 right-0 -translate-y-full h-6 w-6 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <div className="space-y-6 pb-6">
          <Tabs defaultValue="style" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="content">Content & Links</TabsTrigger>
              <TabsTrigger value="legend">Legend</TabsTrigger>
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
                  <h4 className="text-base font-medium mb-3">Font Size</h4>
                  <div className="flex gap-2">
                    {fontSizes.map((size) => (
                      <Button
                        key={size}
                        variant={data.fontSize === size ? "default" : "outline"}
                        onClick={() => handleChange({ fontSize: size })}
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
                    {fontWeights.map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={data.fontWeight === value ? "default" : "outline"}
                        onClick={() => handleChange({ fontWeight: value })}
                        style={{ fontWeight: value === 'light' ? 300 : value === 'normal' ? 400 : value === 'medium' ? 500 : value === 'semibold' ? 600 : value === 'bold' ? 700 : 800 }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-medium mb-3">Stroke Color</h4>
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
                  <h4 className="text-base font-medium mb-3">Background Color</h4>
                  <div className="flex gap-2 flex-wrap">
                    {backgroundColors.map((color) => (
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
                </div>

                <div>
                  <h4 className="text-base font-medium mb-3">Stroke Style</h4>
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
                  <h4 className="text-base font-medium mb-3">Text Align</h4>
                  <div className="flex gap-2">
                    {textAligns.map((align) => (
                      <Button
                        key={align}
                        variant={data.textAlign === align ? "default" : "outline"}
                        onClick={() => handleChange({ textAlign: align })}
                      >
                        {align === 'left' ? '⇤' : align === 'center' ? '⇔' : '⇥'}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-medium mb-3">Stroke Width</h4>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((width) => (
                      <Button
                        key={width}
                        variant={data.strokeWidth === width ? "default" : "outline"}
                        onClick={() => handleChange({ strokeWidth: width })}
                      >
                        {width}px
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-4 space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-medium mb-3">Title</h4>
                  <Input
                    value={data.content?.title || ''}
                    onChange={(e) => handleContentChange({ title: e.target.value })}
                    placeholder="Enter title"
                  />
                </div>

                <div>
                  <h4 className="text-base font-medium mb-3">Description</h4>
                  <Textarea
                    value={data.content?.description || ''}
                    onChange={(e) => handleContentChange({ description: e.target.value })}
                    placeholder="Enter description"
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <h4 className="text-base font-medium mb-3">Links</h4>
                  <div className="space-y-3">
                    {data.content?.links?.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                        <div className="flex-1">
                          <p className="text-base font-medium">{link.label}</p>
                          <p className="text-base text-muted-foreground">{link.url}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLink(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2">
                    <Input
                      value={newLink.label}
                      onChange={(e) => setNewLink(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Link label"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newLink.url}
                        onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="URL"
                      />
                      <Button onClick={addLink}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="legend" className="mt-4 space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-medium mb-3">Legend Position</h4>
                  <RadioGroup
                    value={data.legend?.enabled ? data.legend.position : undefined}
                    onValueChange={(value) => handleLegendChange(value as LegendPosition)}
                    className="grid grid-cols-2 gap-2"
                  >
                    {legendPositions.map((pos) => (
                      <div key={pos.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={pos.value} id={pos.value} />
                        <Label htmlFor={pos.value}>{pos.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {data.legend?.enabled && (
                  <>
                    <div>
                      <h4 className="text-base font-medium mb-3">Legend Color</h4>
                      <div className="flex gap-2 flex-wrap">
                        {strokeColors.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                              data.legend?.color === color ? 'ring-2 ring-primary' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleLegendColorChange(color)}
                          >
                            {data.legend?.color === color && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      onClick={removeLegend}
                      className="w-full"
                    >
                      Remove Legend
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
