import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Check } from "lucide-react";
import { BaseNodeData, FontSize, FontWeight, NodeContent, LegendPosition } from "../types";

const strokeColors = ['#000000', '#ef4444', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#9ca3af', '#f59e0b'];
const backgroundColors = ['#ffffff', '#fce7f3', '#d1fae5', '#dbeafe', '#fef9c3', '#f3e8ff', '#ffedd5', 'transparent'];
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

interface NodeSettingsContentProps {
  data: BaseNodeData;
  nodeId: string;
}

export function NodeSettingsContent({ data, nodeId }: NodeSettingsContentProps) {
  const [newLink, setNewLink] = useState({ url: '', label: '' });

  const handleChange = (updates: Partial<BaseNodeData>) => {
    window.mindmapApi?.updateNodeData(nodeId, updates);
  };

  const handleContentChange = (content: Partial<NodeContent>) => {
    handleChange({ content: { ...data.content, ...content } });
  };

  const handleLegendChange = (position: LegendPosition) => {
    handleChange({
      legend: {
        enabled: true,
        position,
        color: data.legend?.color || '#3b82f6',
        text: '',
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

  const addLink = () => {
    if (!newLink.url || !newLink.label) return;
    const currentLinks = data.content?.links || [];
    handleContentChange({ links: [...currentLinks, newLink] });
    setNewLink({ url: '', label: '' });
  };

  const removeLink = (index: number) => {
    const currentLinks = data.content?.links || [];
    handleContentChange({ links: currentLinks.filter((_, i) => i !== index) });
  };

  return (
    <Tabs defaultValue="style" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="style" className="text-base">Style</TabsTrigger>
        <TabsTrigger value="content" className="text-base">Content</TabsTrigger>
        <TabsTrigger value="legend" className="text-base">Legend</TabsTrigger>
      </TabsList>

      {/* ── Style Tab ── */}
      <TabsContent value="style" className="space-y-4 mt-3">
        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Label</h4>
          <Input
            value={data.label}
            onChange={(e) => handleChange({ label: e.target.value })}
            placeholder="Enter label"
            className="h-8 text-base"
          />
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Font Size</h4>
          <div className="flex gap-1 flex-wrap">
            {fontSizes.map((size) => (
              <Button
                key={size}
                size="sm"
                variant={data.fontSize === size ? "default" : "outline"}
                onClick={() => handleChange({ fontSize: size })}
                className="h-7 px-2 text-base"
              >
                {size.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Font Weight</h4>
          <div className="flex gap-1 flex-wrap">
            {fontWeights.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={data.fontWeight === value ? "default" : "outline"}
                onClick={() => handleChange({ fontWeight: value })}
                className="h-7 px-2 text-base"
                style={{ fontWeight: value === 'light' ? 300 : value === 'normal' ? 400 : value === 'medium' ? 500 : value === 'semibold' ? 600 : value === 'bold' ? 700 : 800 }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Font Family</h4>
          <div className="flex gap-1 flex-wrap">
            {fontFamilies.map((font) => (
              <Button
                key={font}
                size="sm"
                variant={data.fontFamily === font ? "default" : "outline"}
                onClick={() => handleChange({ fontFamily: font })}
                className="h-7 px-2 text-base"
                style={{ fontFamily: font }}
              >
                Aa
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Text Align</h4>
          <div className="flex gap-1">
            {textAligns.map((align) => (
              <Button
                key={align}
                size="sm"
                variant={data.textAlign === align ? "default" : "outline"}
                onClick={() => handleChange({ textAlign: align })}
                className="h-7 px-3 text-base"
              >
                {align === 'left' ? '⇤' : align === 'center' ? '⇔' : '⇥'}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Stroke Color</h4>
          <div className="flex gap-1.5 flex-wrap">
            {strokeColors.map((color, i) => (
              <button
                key={i}
                className={`w-7 h-7 rounded-full border-2 ${data.strokeColor === color ? 'ring-2 ring-offset-1 ring-blue-400' : 'border-gray-200'}`}
                style={{ backgroundColor: color }}
                onClick={() => handleChange({ strokeColor: color })}
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Background</h4>
          <div className="flex gap-1.5 flex-wrap">
            {backgroundColors.map((color, i) => (
              <button
                key={i}
                className={`w-7 h-7 rounded-full border-2 ${data.backgroundColor === color ? 'ring-2 ring-offset-1 ring-blue-400' : 'border-gray-200'}`}
                style={{ backgroundColor: color === 'transparent' ? undefined : color, backgroundImage: color === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)' : undefined, backgroundSize: color === 'transparent' ? '8px 8px' : undefined }}
                onClick={() => handleChange({ backgroundColor: color })}
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Stroke Style</h4>
          <div className="flex gap-1">
            {strokeStyles.map((style) => (
              <Button
                key={style}
                size="sm"
                variant={data.strokeStyle === style ? "default" : "outline"}
                onClick={() => handleChange({ strokeStyle: style })}
                className="h-7 px-2 text-base"
              >
                {style === 'solid' ? '—' : style === 'dashed' ? '- -' : '···'}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Stroke Width</h4>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((w) => (
              <Button
                key={w}
                size="sm"
                variant={data.strokeWidth === w ? "default" : "outline"}
                onClick={() => handleChange({ strokeWidth: w })}
                className="h-7 px-2 text-base"
              >
                {w}px
              </Button>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* ── Content Tab ── */}
      <TabsContent value="content" className="space-y-4 mt-3">
        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Title</h4>
          <Input
            value={data.content?.title || ''}
            onChange={(e) => handleContentChange({ title: e.target.value })}
            placeholder="Enter title"
            className="h-8 text-base"
          />
        </div>
        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Description</h4>
          <Textarea
            value={data.content?.description || ''}
            onChange={(e) => handleContentChange({ description: e.target.value })}
            placeholder="Enter description"
            className="min-h-[90px] text-base"
          />
        </div>
        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Links</h4>
          <div className="space-y-2 mb-2">
            {data.content?.links?.map((link: any, index: number) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-md border text-base">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{link.label}</p>
                  <p className="text-gray-400 truncate">{link.url}</p>
                </div>
                <button onClick={() => removeLink(index)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Input
              value={newLink.label}
              onChange={(e) => setNewLink(p => ({ ...p, label: e.target.value }))}
              placeholder="Link label"
              className="h-8 text-base"
            />
            <div className="flex gap-1.5">
              <Input
                value={newLink.url}
                onChange={(e) => setNewLink(p => ({ ...p, url: e.target.value }))}
                placeholder="URL"
                className="h-8 text-base"
              />
              <Button size="sm" onClick={addLink} className="h-8 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* ── Legend Tab ── */}
      <TabsContent value="legend" className="space-y-4 mt-3">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
          <div>
            <p className="text-base font-medium text-gray-700">Show Legend Dot</p>
            <p className="text-xs text-gray-400 mt-0.5">Adds a colored circle indicator to the node</p>
          </div>
          <button
            onClick={() => {
              if (data.legend?.enabled) {
                removeLegend();
              } else {
                handleChange({ legend: { enabled: true, position: data.legend?.position || 'right-top', color: data.legend?.color || '#3b82f6', text: '' } });
              }
            }}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              data.legend?.enabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              data.legend?.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {data.legend?.enabled && (
          <>
        <div>
          <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Legend Position</h4>
          <RadioGroup
            value={data.legend?.enabled ? data.legend.position : undefined}
            onValueChange={(v) => handleLegendChange(v as LegendPosition)}
            className="grid grid-cols-2 gap-1.5"
          >
            {legendPositions.map((pos) => (
              <div key={pos.value} className="flex items-center space-x-1.5">
                <RadioGroupItem value={pos.value} id={`rp-${pos.value}`} />
                <Label htmlFor={`rp-${pos.value}`} className="text-base">{pos.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        {data.legend?.enabled && (
          <>
            <div>
              <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Legend Color</h4>
              <div className="flex gap-1.5 flex-wrap">
                {strokeColors.map((color, i) => (
                  <button
                    key={i}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${data.legend?.color === color ? 'ring-2 ring-offset-1 ring-blue-400' : 'border-gray-200'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (data.legend) window.mindmapApi?.updateNodeData(nodeId, { legend: { ...data.legend, color } });
                    }}
                  >
                    {data.legend?.color === color && <Check className="h-3 w-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={removeLegend} className="w-full h-8 text-base">
              Remove Legend
            </Button>
          </>
        )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
