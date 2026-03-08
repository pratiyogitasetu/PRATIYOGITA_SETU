
import { useCallback, useEffect } from 'react';
import { MindMapNode, BaseNodeData } from '../types';
import { addNode as addNewNode } from '../MindMapNodeManager';
import { useToast } from '@/hooks/use-toast';

interface UseMindMapNodeHandlersProps {
  nodes: MindMapNode[];
  setNodes: React.Dispatch<React.SetStateAction<MindMapNode[]>>;
}

export const useMindMapNodeHandlers = ({ nodes, setNodes }: UseMindMapNodeHandlersProps) => {
  const { toast } = useToast();

  // Delete node
  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    toast({
      title: "Deleted",
      description: "Node has been deleted",
      duration: 2000,
    });
  }, [setNodes, toast]);

  // Update node data
  const updateNodeData = useCallback((id: string, newData: Partial<BaseNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Add a new node
  const addNode = useCallback((type: BaseNodeData['nodeType'], additionalData: Partial<BaseNodeData> = {}) => {
    addNewNode(setNodes, nodes, type, additionalData);
    toast({
      title: "Added",
      description: `New ${type} node has been added`,
      duration: 2000,
    });
  }, [nodes, setNodes, toast]);

  // Copy node
  const copyNode = useCallback((id: string) => {
    const nodeToCopy = nodes.find(node => node.id === id);
    if (nodeToCopy) {
      localStorage.setItem('mindmap-copied-node', JSON.stringify(nodeToCopy.data));
      toast({
        title: "Copied",
        description: "Node copied to clipboard",
        duration: 2000,
      });
    }
  }, [nodes, toast]);

  // Paste node data
  const pasteNode = useCallback((id: string | null = null) => {
    const copiedNodeData = localStorage.getItem('mindmap-copied-node');
    if (copiedNodeData) {
      try {
        const data = JSON.parse(copiedNodeData);
        if (id) {
          // Paste to existing node
          updateNodeData(id, data);
          toast({
            title: "Pasted",
            description: "Node data pasted to selected node",
            duration: 2000,
          });
        } else {
          // Create new node with copied data
          addNode(data.nodeType || 'topic', data);
          toast({
            title: "Created",
            description: "New node created from clipboard",
            duration: 2000,
          });
        }
      } catch (e) {
        console.error('Failed to parse copied node data', e);
        toast({
          title: "Error",
          description: "Failed to paste node data",
          variant: "destructive",
          duration: 2000,
        });
      }
    }
  }, [updateNodeData, addNode, toast]);

  // Duplicate node
  const duplicateNode = useCallback((id: string) => {
    const nodeToDuplicate = nodes.find(node => node.id === id);
    if (nodeToDuplicate) {
      addNode(
        nodeToDuplicate.data.nodeType || 'topic', 
        {
          ...nodeToDuplicate.data,
          position: {
            x: nodeToDuplicate.position.x + 50,
            y: nodeToDuplicate.position.y + 50
          }
        }
      );
      toast({
        title: "Duplicated",
        description: "Node has been duplicated",
        duration: 2000,
      });
    }
  }, [nodes, addNode, toast]);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const selectedNode = nodes.find(node => node.selected);
      
      // Ctrl+C to copy
      if (e.ctrlKey && e.key === 'c') {
        if (selectedNode) {
          copyNode(selectedNode.id);
        }
      }
      
      // Ctrl+V to paste
      if (e.ctrlKey && e.key === 'v') {
        if (selectedNode) {
          pasteNode(selectedNode.id);
        } else {
          pasteNode();
        }
      }
      
      // Delete or Backspace to remove node
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          deleteNode(selectedNode.id);
        }
      }

      // Ctrl+D to duplicate node
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault(); // Prevent browser bookmark dialog
        if (selectedNode) {
          duplicateNode(selectedNode.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, copyNode, pasteNode, deleteNode, duplicateNode]);

  // Set up custom event handlers for context menu actions
  useEffect(() => {
    const handleDuplicateNode = (e: Event) => {
      const customEvent = e as CustomEvent;
      duplicateNode(customEvent.detail.id);
    };
    
    document.addEventListener('duplicate-node', handleDuplicateNode);
    
    return () => {
      document.removeEventListener('duplicate-node', handleDuplicateNode);
    };
  }, [duplicateNode]);

  return {
    deleteNode,
    updateNodeData,
    addNode,
    copyNode,
    pasteNode,
    duplicateNode
  };
};
