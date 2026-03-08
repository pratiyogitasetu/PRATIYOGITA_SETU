import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseNodeData, FontSize, FontWeight } from "../types";

interface TextOnlySettingsProps {
  nodeId: string;
  data: BaseNodeData;
}

const fontColors = ['#1f2937', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#9ca3af', '#ffffff'];
const fontSizes: FontSize[] = ['xs', 's', 'm', 'l', 'xl'];
const fontWeights: { value: FontWeight; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semi' },
  { value: 'bold', label: 'Bold' },
  { value: 'extrabold', label: 'Extra' },
];
const fontFamilies = ['sans-serif', 'serif', 'monospace', 'cursive'];
const textAligns = ['left', 'center', 'right'] as const;

export function TextOnlySettings({ nodeId, data }: TextOnlySettingsProps) {
  const handleChange = (updates: Partial<BaseNodeData>) => {
    window.mindmapApi?.updateNodeData(nodeId, updates);
  };

  return (
    <div className="p-3 space-y-4">
      {/* Label */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Text</Label>
        <Input
          value={data.label || ''}
          onChange={(e) => handleChange({ label: e.target.value })}
          placeholder="Enter text"
          className="h-8 text-sm"
        />
      </div>

      {/* Font Color */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Text Color</Label>
        <div className="flex gap-1.5 flex-wrap">
          {fontColors.map((color) => (
            <button
              key={color}
              onClick={() => handleChange({ fontColor: color, strokeColor: color })}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                (data.fontColor || data.strokeColor) === color ? 'border-gray-800 scale-110' : 'border-gray-200'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Font Size</Label>
        <div className="flex gap-1">
          {fontSizes.map((size) => (
            <button
              key={size}
              onClick={() => handleChange({ fontSize: size })}
              className={`px-2.5 py-1 text-xs rounded border uppercase ${
                data.fontSize === size ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Font Weight */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Font Weight</Label>
        <div className="flex gap-1 flex-wrap">
          {fontWeights.map((fw) => (
            <button
              key={fw.value}
              onClick={() => handleChange({ fontWeight: fw.value })}
              className={`px-2 py-1 text-xs rounded border ${
                data.fontWeight === fw.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {fw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Font Family</Label>
        <div className="flex gap-1 flex-wrap">
          {fontFamilies.map((f) => (
            <button
              key={f}
              onClick={() => handleChange({ fontFamily: f })}
              className={`px-2 py-1 text-xs rounded border ${
                data.fontFamily === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
              }`}
              style={{ fontFamily: f }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Text Align */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Alignment</Label>
        <div className="flex gap-1">
          {textAligns.map((align) => (
            <button
              key={align}
              onClick={() => handleChange({ textAlign: align })}
              className={`px-3 py-1 text-xs rounded border capitalize ${
                data.textAlign === align ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
