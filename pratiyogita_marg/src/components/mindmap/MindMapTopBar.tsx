
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Save, 
  FolderOpen, 
  FilePlus, 
  ChevronDown, 
  Trash2,
  Undo,
  Redo,
  Eye,
  CheckCircle2,
  Loader2,
  Cloud,
  Download,
  Keyboard,
} from 'lucide-react';
import { getAllMindMaps } from '@/utils/mindmapStorage';
import { AutoSaveConfig, saveAutoSaveConfig } from '@/utils/mindmapAutoSave';

const ShortcutRow = ({ label, shortcut }: { label: string; shortcut: string }) => (
  <div className="flex items-center justify-between px-3 py-1.5 text-sm">
    <span className="text-gray-700">{label}</span>
    <kbd className="text-[11px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
      {shortcut}
    </kbd>
  </div>
);

interface MindMapTopBarProps {
  currentMindMap: string;
  onSave: () => void;
  onNew: () => void;
  isSaved: boolean;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
  onExportPng: () => void;
  loadExistingMindMap: (name: string) => void;
  handleDeleteMindMap: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  autoSaveConfig: AutoSaveConfig;
  onAutoSaveConfigChange: (config: AutoSaveConfig) => void;
}

export const MindMapTopBar = ({
  currentMindMap,
  onSave,
  onNew,
  isSaved,
  autoSaveStatus,
  onExportPng,
  loadExistingMindMap,
  handleDeleteMindMap,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  autoSaveConfig,
  onAutoSaveConfigChange
}: MindMapTopBarProps) => {
  const [existingMaps, setExistingMaps] = useState<string[]>([]);

  useEffect(() => {
    const refreshMindMaps = async () => {
      const maps = await getAllMindMaps();
      setExistingMaps(maps.map(m => m.name));
    };
    void refreshMindMaps();
  }, [currentMindMap]);

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-2 py-1.5 flex items-center gap-1.5">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNew}
          className="gap-1"
        >
          <FilePlus className="h-4 w-4" />
          New
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSave}
          disabled={isSaved}
          className={`gap-1 transition-colors ${isSaved ? 'text-green-600 border-green-300 bg-green-50 hover:bg-green-50' : ''}`}
        >
          {isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaved ? 'Saved' : 'Save'}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <FolderOpen className="h-4 w-4" />
              Open <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {existingMaps.length === 0 ? (
              <div className="px-2 py-4 text-center text-base text-gray-500">
                No saved mind maps
              </div>
            ) : (
              existingMaps.map((name) => (
                <div key={name} className="flex items-center justify-between">
                  <DropdownMenuItem 
                    className="flex-1"
                    onClick={() => loadExistingMindMap(name)}
                  >
                    {name}
                  </DropdownMenuItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDeleteMindMap(name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Undo/Redo */}
        <div className="w-px h-6 bg-gray-200 mx-0.5 flex-shrink-0" />

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUndo} 
          disabled={!canUndo} 
          title="Undo"
          className="px-2"
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRedo} 
          disabled={!canRedo} 
          title="Redo"
          className="px-2"
        >
          <Redo className="h-4 w-4" />
        </Button>

        {/* Auto-save toggle */}
        <div className="w-px h-6 bg-gray-200 mx-0.5 flex-shrink-0" />
        <div className="flex items-center gap-1.5 px-1">
          <Switch
            id="autosave-toggle"
            checked={autoSaveConfig.enabled}
            onCheckedChange={(checked) => {
              const newConfig = { ...autoSaveConfig, enabled: checked };
              saveAutoSaveConfig(newConfig);
              onAutoSaveConfigChange(newConfig);
            }}
          />
          <label htmlFor="autosave-toggle" className="text-sm text-gray-600 cursor-pointer select-none whitespace-nowrap">
            Auto-save
          </label>
        </div>

        {/* Auto-save cloud indicator — shown to the RIGHT of the cloud save */}

        {/* View Mind Map Button */}
        <Button 
          variant="default" 
          size="sm"
          onClick={() => {
            if (currentMindMap) {
              window.open(`/view?map=${encodeURIComponent(currentMindMap)}`, '_blank');
            } else {
              alert('Please save the mind map first before viewing');
            }
          }}
          title="View Mind Map"
          className="px-2 gap-1 bg-blue-600 hover:bg-blue-700"
        >
          <Eye className="h-4 w-4" />
          <span>View</span>
        </Button>

        {/* Export as PNG */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPng}
          title="Export as PNG (header + canvas)"
          className="px-2 gap-1"
        >
          <Download className="h-4 w-4" />
          <span>Export PNG</span>
        </Button>

        {/* Auto-save cloud indicator: appears right of View button */}
        {autoSaveStatus !== 'idle' && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            autoSaveStatus === 'saving' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'
          }`}>
            {autoSaveStatus === 'saving' ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Saving...</span></>
            ) : (
              <><Cloud className="h-3.5 w-3.5" /><CheckCircle2 className="h-3.5 w-3.5" /><span>Saved to cloud</span></>
            )}
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1" title="Keyboard Shortcuts">
              <Keyboard className="h-4 w-4" />
              Shortcuts <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs text-gray-500 font-semibold">Selection</DropdownMenuLabel>
            <ShortcutRow label="Select node" shortcut="Click" />
            <ShortcutRow label="Multi-select" shortcut="Shift + Click" />
            <ShortcutRow label="Box select" shortcut="Shift + Drag" />
            <ShortcutRow label="Select all" shortcut="Ctrl + A" />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500 font-semibold">Edit</DropdownMenuLabel>
            <ShortcutRow label="Copy node" shortcut="Ctrl + C" />
            <ShortcutRow label="Paste node" shortcut="Ctrl + V" />
            <ShortcutRow label="Duplicate node" shortcut="Ctrl + D" />
            <ShortcutRow label="Delete selected" shortcut="Delete" />
            <ShortcutRow label="Edit node text" shortcut="Double-click" />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500 font-semibold">History</DropdownMenuLabel>
            <ShortcutRow label="Undo" shortcut="Ctrl + Z" />
            <ShortcutRow label="Redo" shortcut="Ctrl + Y" />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500 font-semibold">Canvas</DropdownMenuLabel>
            <ShortcutRow label="Pan" shortcut="Drag (empty area)" />
            <ShortcutRow label="Zoom in/out" shortcut="Scroll wheel" />
            <ShortcutRow label="Context menu" shortcut="Right-click" />
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto">
          <span className="text-sm font-medium text-gray-600">
            {currentMindMap || 'Unsaved mind map'}
          </span>
        </div>
      </div>
    </>
  );
};
