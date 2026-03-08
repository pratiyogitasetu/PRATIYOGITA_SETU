
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut
} from "@/components/ui/context-menu";
import { Copy, Clipboard, CopyPlus, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

interface NodeContextMenuProps {
  id: string;
  children: ReactNode;
}

export const NodeContextMenu = ({ id, children }: NodeContextMenuProps) => {
  const handleCopy = () => {
    window.mindmapApi?.copyNode?.(id);
  };

  const handlePaste = () => {
    window.mindmapApi?.pasteNode?.(id);
  };

  const handleDuplicate = () => {
    window.mindmapApi?.duplicateNode?.(id);
  };

  const handleDelete = () => {
    window.mindmapApi?.deleteNode(id);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={handleCopy} className="flex items-center">
          <Copy className="h-4 w-4 mr-2" />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handlePaste} className="flex items-center">
          <Clipboard className="h-4 w-4 mr-2" />
          Paste
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleDuplicate} className="flex items-center">
          <CopyPlus className="h-4 w-4 mr-2" />
          Duplicate
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleDelete} className="flex items-center text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
          <ContextMenuShortcut>Delete</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
