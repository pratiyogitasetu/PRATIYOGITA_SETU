import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { EdgeData } from '../types';

const STROKE_COLORS = [
  '#000000', '#374151', '#3b82f6', '#ef4444',
  '#22c55e', '#f97316', '#8b5cf6', '#9ca3af',
];

interface EdgeSettingsPanelProps {
  edgeId: string;
  data: EdgeData;
}

export function EdgeSettingsPanel({ edgeId, data }: EdgeSettingsPanelProps) {
  const [label, setLabel]           = useState(data.label || '');
  const [strokeWidth, setStrokeWidth] = useState(data.strokeWidth || 1);
  const [strokeColor, setStrokeColor] = useState(data.strokeColor || '#000000');
  const [strokeStyle, setStrokeStyle] = useState(data.strokeStyle || 'solid');
  const [pathStyle, setPathStyle]   = useState(data.pathStyle || 'straight');

  // Sync when a different edge is selected
  useEffect(() => {
    setLabel(data.label || '');
    setStrokeWidth(data.strokeWidth || 1);
    setStrokeColor(data.strokeColor || '#000000');
    setStrokeStyle(data.strokeStyle || 'solid');
    setPathStyle(data.pathStyle || 'straight');
  }, [edgeId]);

  const apply = () => {
    window.mindmapApi?.updateEdge(edgeId, { label, strokeWidth, strokeColor, strokeStyle, pathStyle });
  };

  const STYLES = ['solid', 'dashed', 'dotted'] as const;
  const PATHS  = ['straight', 'curved', 'step', 'smoothstep'] as const;

  return (
    <div className="space-y-4 px-3 py-3">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Edge / Connector</span>

      {/* Label */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-gray-600">Label</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Edge label…"
          className="h-8 text-sm"
        />
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-gray-600">Color</Label>
        <div className="flex flex-wrap gap-2">
          {STROKE_COLORS.map((c) => (
            <button
              key={c}
              title={c}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                strokeColor === c ? 'ring-2 ring-offset-1 ring-blue-500 border-transparent' : 'border-gray-200'
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setStrokeColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Width */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-gray-600">Width — {strokeWidth}px</Label>
        <Slider min={1} max={10} step={1} value={[strokeWidth]} onValueChange={([v]) => setStrokeWidth(v)} />
      </div>

      {/* Stroke style */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-gray-600">Stroke</Label>
        <div className="flex gap-1.5">
          {STYLES.map((s) => (
            <Button key={s} size="sm" variant={strokeStyle === s ? 'default' : 'outline'}
              className="flex-1 capitalize text-xs h-7" onClick={() => setStrokeStyle(s)}>{s}</Button>
          ))}
        </div>
      </div>

      {/* Path style */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-gray-600">Path</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {PATHS.map((p) => (
            <Button key={p} size="sm" variant={pathStyle === p ? 'default' : 'outline'}
              className="capitalize text-xs h-7" onClick={() => setPathStyle(p)}>{p}</Button>
          ))}
        </div>
      </div>

      <Button onClick={apply} className="w-full h-8 text-sm">Apply</Button>
    </div>
  );
}
