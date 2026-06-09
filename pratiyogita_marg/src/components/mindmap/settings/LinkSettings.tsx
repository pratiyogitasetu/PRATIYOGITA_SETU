import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseNodeData } from "../types";

interface LinkSettingsProps {
  nodeId: string;
  data: BaseNodeData;
}

const strokeColors = ['#3b82f6', '#000000', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#9ca3af'];
const backgroundColors = ['#ffffff', '#eff6ff', '#fce7f3', '#d1fae5', '#dbeafe', '#fef9c3', '#f3e8ff', 'transparent'];

export function LinkSettings({ nodeId, data }: LinkSettingsProps) {
  const handleChange = (updates: Partial<BaseNodeData>) => {
    window.mindmapApi?.updateNodeData(nodeId, updates);
  };

  return (
    <div className="p-3 space-y-4">
      {/* Link Label */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Link Text</Label>
        <Input
          value={data.label || ''}
          onChange={(e) => handleChange({ label: e.target.value })}
          placeholder="Link text"
          className="h-8 text-sm"
        />
      </div>

      {/* Link URL */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">URL</Label>
        <Input
          value={data.linkUrl || ''}
          onChange={(e) => handleChange({ linkUrl: e.target.value })}
          placeholder="https://example.com"
          className="h-8 text-sm"
        />
      </div>

      {/* Border Color */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Border Color</Label>
        <div className="flex gap-1.5 flex-wrap">
          {strokeColors.map((color) => (
            <button
              key={color}
              onClick={() => handleChange({ strokeColor: color })}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                data.strokeColor === color ? 'border-gray-800 scale-110' : 'border-gray-200'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Background</Label>
        <div className="flex gap-1.5 flex-wrap">
          {backgroundColors.map((color) => (
            <button
              key={color}
              onClick={() => handleChange({ backgroundColor: color })}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                data.backgroundColor === color ? 'border-gray-800 scale-110' : 'border-gray-200'
              }`}
              style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
            >
              {color === 'transparent' && <span className="text-[8px] text-gray-400">∅</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500">Border Width</Label>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((w) => (
            <button
              key={w}
              onClick={() => handleChange({ strokeWidth: w })}
              className={`px-2.5 py-1 text-xs rounded border ${
                data.strokeWidth === w ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
