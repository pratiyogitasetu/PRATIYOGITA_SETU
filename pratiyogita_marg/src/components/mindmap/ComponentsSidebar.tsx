

import {
  Heading1,
  CircleDot,
  Layers,
  AlignLeft,
  SquareIcon,
  ChevronRight,
  Circle,
  Square,
  Triangle,
  ListTodo,
  FileText,
  StickyNote,
  Lightbulb,
  LucideIcon,
  Minus,
  GripVertical,
  Link,
  Type,
} from "lucide-react";

interface ComponentsSidebarProps {
  onAddNode: (type: string) => void;
  onToggleSidebar: () => void;
  collapsed?: boolean;
}

interface NodeItem {
  type: string;
  label: string;
  icon: LucideIcon;
  iconClass?: string;
  bg: string;
  border: string;
  text: string;
  iconColor: string;
}

const COMPONENTS: NodeItem[] = [
  { type: 'title',     label: 'Title',      icon: Heading1,   bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'topic',     label: 'Topic',      icon: CircleDot,  bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'subtopic',  label: 'Sub Topic',  icon: Layers,     bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'paragraph', label: 'Paragraph',  icon: AlignLeft,  bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'section',   label: 'Section',    icon: SquareIcon, bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
];

const SHAPES: NodeItem[] = [
  { type: 'circle',    label: 'Circle',     icon: Circle,       bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'rectangle', label: 'Rectangle',  icon: SquareIcon,   iconClass: 'rotate-90', bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'square',    label: 'Square',     icon: Square,       bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'triangle',  label: 'Triangle',   icon: Triangle,     bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'hline',     label: 'H. Line',    icon: Minus,        bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'vline',     label: 'V. Line',    icon: GripVertical, bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
];

const ADVANCED: NodeItem[] = [
  { type: 'checklist', label: 'Checklist',  icon: ListTodo,   bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'resource',  label: 'Resources',  icon: FileText,   bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'note',      label: 'Note',       icon: StickyNote, bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'concept',   label: 'Concept',    icon: Lightbulb,  bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'link',      label: 'Link',       icon: Link,       bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
  { type: 'textonly',  label: 'Text',       icon: Type,       bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-white', iconColor: 'text-white' },
];

const NodeButton = ({
  item,
  onAddNode,
  onDragStart,
}: {
  item: NodeItem;
  onAddNode: (type: string) => void;
  onDragStart: (e: React.DragEvent<HTMLButtonElement>, type: string) => void;
}) => {
  const Icon = item.icon;
  return (
    <button
      draggable
      onDragStart={(e) => onDragStart(e, item.type)}
      onClick={() => onAddNode(item.type)}
      className={`w-full flex items-center gap-2.5 h-10 px-3 text-sm font-semibold rounded-md border
        ${item.bg} ${item.border} ${item.text}
        hover:brightness-125 active:scale-[0.98]
        transition-all duration-150 cursor-pointer shadow-sm`}
    >
      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${item.iconColor} ${item.iconClass ?? ''}`} />
      <span>{item.label}</span>
    </button>
  );
};

export const ComponentsSidebar = ({
  onAddNode,
  onToggleSidebar,
  collapsed = false,
}: ComponentsSidebarProps) => {
  const onDragStart = (event: React.DragEvent<HTMLButtonElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  /* ── COLLAPSED: icon-only strip ── */
  if (collapsed) {
    return (
      <div className="h-full w-16 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 shadow-sm">
        {/* Expand button */}
        <button
          onClick={onToggleSidebar}
          title="Open Tools"
          className="flex-shrink-0 h-9 w-full flex items-center justify-center hover:bg-gray-100 transition-colors border-b border-gray-200"
        >
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>

        {/* All node icons */}
        <div className="flex-1 overflow-y-auto py-1 flex flex-col items-center gap-0.5">
          {COMPONENTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                title={item.label}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                onClick={() => onAddNode(item.type)}
                className={`w-10 h-10 flex items-center justify-center rounded-md border ${item.bg} ${item.border} hover:brightness-95 active:scale-95 transition-all duration-150`}
              >
                <Icon className={`h-5 w-5 ${item.iconColor} ${item.iconClass ?? ''}`} style={{ fill: 'currentColor', strokeWidth: 1.5 }} />
              </button>
            );
          })}

          <div className="w-6 h-px bg-gray-200 my-1" />

          {SHAPES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                title={item.label}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                onClick={() => onAddNode(item.type)}
                className={`w-10 h-10 flex items-center justify-center rounded-md border ${item.bg} ${item.border} hover:brightness-95 active:scale-95 transition-all duration-150`}
              >
                <Icon className={`h-5 w-5 ${item.iconColor} ${item.iconClass ?? ''}`} style={{ fill: 'currentColor', strokeWidth: 1.5 }} />
              </button>
            );
          })}

          <div className="w-6 h-px bg-gray-200 my-1" />

          {ADVANCED.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                title={item.label}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                onClick={() => onAddNode(item.type)}
                className={`w-10 h-10 flex items-center justify-center rounded-md border ${item.bg} ${item.border} hover:brightness-95 active:scale-95 transition-all duration-150`}
              >
                <Icon className={`h-5 w-5 ${item.iconColor} ${item.iconClass ?? ''}`} style={{ fill: 'currentColor', strokeWidth: 1.5 }} />
              </button>
            );
          })}
        </div>

      </div>
    );
  }

  /* ── EXPANDED ── */
  return (
    <div className="h-full w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-3 py-2.5 flex justify-between items-center border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-700">Mind Map Tools</h2>
        <button
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
          onClick={onToggleSidebar}
          title="Close Sidebar"
        >
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="py-1.5">
          <p className="pb-1 text-xs font-bold tracking-widest text-gray-400 uppercase px-3">Components</p>
          <div className="space-y-0.5 px-2">
            {COMPONENTS.map((item) => (
              <NodeButton key={item.type} item={item} onAddNode={onAddNode} onDragStart={onDragStart} />
            ))}
          </div>
        </div>

        <div className="py-1.5 border-t border-gray-100">
          <p className="pb-1 text-xs font-bold tracking-widest text-gray-400 uppercase px-3">Shapes</p>
          <div className="space-y-0.5 px-2">
            {SHAPES.map((item) => (
              <NodeButton key={item.type} item={item} onAddNode={onAddNode} onDragStart={onDragStart} />
            ))}
          </div>
        </div>

        <div className="py-1.5 border-t border-gray-100">
          <p className="pb-1 text-xs font-bold tracking-widest text-gray-400 uppercase px-3">Advanced</p>
          <div className="space-y-0.5 px-2">
            {ADVANCED.map((item) => (
              <NodeButton key={item.type} item={item} onAddNode={onAddNode} onDragStart={onDragStart} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
