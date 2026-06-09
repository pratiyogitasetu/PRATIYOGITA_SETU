import { useEffect, useRef } from 'react';
import { Plus, Clipboard, CheckSquare, Trash2 } from 'lucide-react';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  flowPosition: { x: number; y: number };
  onClose: () => void;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  hasClipboard: boolean;
}

export const CanvasContextMenu = ({
  x,
  y,
  onClose,
  onAddNode,
  flowPosition,
  onPaste,
  onSelectAll,
  onDeleteSelected,
  hasSelection,
  hasClipboard,
}: CanvasContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Clamp to viewport
  const menuW = 200;
  const menuH = 180;
  const left = x + menuW > window.innerWidth ? x - menuW : x;
  const top  = y + menuH > window.innerHeight ? y - menuH : y;

  const nodeTypes = [
    { type: 'base',      label: 'Topic Node' },
    { type: 'concept',   label: 'Concept Node' },
    { type: 'note',      label: 'Note' },
    { type: 'section',   label: 'Section' },
    { type: 'checklist', label: 'Checklist' },
    { type: 'link',      label: 'Link' },
    { type: 'textonly',  label: 'Text' },
  ];

  const item = (icon: React.ReactNode, label: string, shortcut: string, onClick: () => void, disabled = false, danger = false) => (
    <button
      key={label}
      onClick={() => { if (!disabled) { onClick(); onClose(); } }}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left transition-colors rounded
        ${disabled ? 'text-gray-300 cursor-not-allowed' : danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      <span className="text-[10px] text-gray-400 font-mono">{shortcut}</span>
    </button>
  );

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top, left, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 w-52 select-none"
    >
      {/* Add node submenu label */}
      <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
        Add Node Here
      </div>
      <div className="px-1.5 mb-1">
        {nodeTypes.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => { onAddNode(type, flowPosition); onClose(); }}
            className="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors text-left"
          >
            <Plus className="h-3.5 w-3.5 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className="h-px bg-gray-100 mx-2 my-1" />

      <div className="px-1.5">
        {item(<Clipboard className="h-4 w-4" />, 'Paste', 'Ctrl+V', onPaste, !hasClipboard)}
        {item(<CheckSquare className="h-4 w-4" />, 'Select All', 'Ctrl+A', onSelectAll)}
        {hasSelection && item(<Trash2 className="h-4 w-4" />, 'Delete Selected', 'Del', onDeleteSelected, false, true)}
      </div>
    </div>
  );
};
