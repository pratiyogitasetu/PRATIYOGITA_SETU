
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AutoSaveConfig, saveAutoSaveConfig } from '@/utils/mindmapAutoSave';

interface AutoSaveSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AutoSaveConfig;
  onConfigChange: (config: AutoSaveConfig) => void;
}

export function AutoSaveSettings({ open, onOpenChange, config, onConfigChange }: AutoSaveSettingsProps) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [interval, setInterval] = useState(Math.floor(config.interval / 1000)); // Convert to seconds for display

  useEffect(() => {
    setEnabled(config.enabled);
    setInterval(Math.floor(config.interval / 1000));
  }, [config, open]);

  const handleSave = () => {
    const newConfig: AutoSaveConfig = {
      ...config,
      enabled,
      interval: interval * 1000, // Convert back to milliseconds
      lastSaveTime: config.lastSaveTime
    };
    
    saveAutoSaveConfig(newConfig);
    onConfigChange(newConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Auto-Save Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-save-toggle" className="mr-4">
              Enable Auto-Save
            </Label>
            <Switch
              id="auto-save-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="auto-save-interval" className="col-span-2">
              Save Interval (seconds)
            </Label>
            <Input
              id="auto-save-interval"
              type="number"
              value={interval}
              onChange={(e) => setInterval(Math.max(10, parseInt(e.target.value) || 10))}
              min={10}
              className="col-span-2"
              disabled={!enabled}
            />
          </div>
          
          <div className="text-base text-muted-foreground">
            {enabled 
              ? `Mind map will automatically save every ${interval} seconds when changes are made.`
              : 'Auto-save is currently disabled.'}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
