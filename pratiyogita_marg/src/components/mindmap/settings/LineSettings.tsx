import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { BaseNodeData } from '../types';

const LINE_COLORS = [
  { label: 'Dark', value: '#374151' },
  { label: 'Black', value: '#000000' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Gray', value: '#9ca3af' },
];

const LINE_STYLES = ['solid', 'dashed', 'dotted'] as const;

interface LineSettingsProps {
  nodeId: string;
  data: BaseNodeData;
  direction: 'horizontal' | 'vertical';
}

export function LineSettings({ nodeId, data, direction }: LineSettingsProps) {
  const thickness = data.strokeWidth || 3;
  const color = data.strokeColor || '#374151';
  const lineStyle = data.strokeStyle || 'solid';

  const update = (updates: Partial<BaseNodeData>) => {
    window.mindmapApi?.updateNodeData(nodeId, updates);
  };

  return (
    <div className="space-y-5 px-3 py-3">
      {/* Direction badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
          {direction === 'horizontal' ? '─ Horizontal Line' : '│ Vertical Line'}
        </span>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-600">Color</Label>
        <div className="flex flex-wrap gap-2">
          {LINE_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                color === c.value ? 'ring-2 ring-offset-1 ring-blue-500 border-transparent' : 'border-gray-200'
              }`}
              style={{ backgroundColor: c.value }}
              onClick={() => update({ strokeColor: c.value })}
            />
          ))}
        </div>
      </div>

      {/* Thickness */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-600">
          Thickness — {thickness}px
        </Label>
        <Slider
          min={1}
          max={20}
          step={1}
          value={[thickness]}
          onValueChange={([v]) => update({ strokeWidth: v })}
          className="mt-1"
        />
      </div>

      {/* Stroke style */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-600">Stroke</Label>
        <div className="flex flex-col gap-1.5">
          {LINE_STYLES.map((s) => {
            const active = lineStyle === s;
            const borderStyle = s as React.CSSProperties['borderTopStyle'];
            return (
              <button
                key={s}
                onClick={() => update({ strokeStyle: s })}
                className={`flex items-center gap-3 px-3 h-9 rounded-md border transition-all ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {/* visual line preview */}
                <div
                  className="w-10 flex-shrink-0"
                  style={{
                    borderTopWidth: 2,
                    borderTopStyle: borderStyle,
                    borderTopColor: active ? '#3b82f6' : color,
                  }}
                />
                <span className="capitalize text-sm font-medium">{s}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Size control */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-600">
          {direction === 'horizontal' ? 'Length' : 'Height'}
        </Label>
        <div className="flex gap-2">
          {[100, 200, 300, 400].map((size) => (
            <button
              key={size}
              className="flex-1 text-sm h-8 rounded-md border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
              onClick={() =>
                update(direction === 'horizontal' ? { width: size } : { height: size })
              }
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
