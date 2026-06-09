
import { MindMapNode, MindMapEdge } from './types';

export const initialNodes: MindMapNode[] = [
  {
    id: '1',
    type: 'base',
    data: { 
      id: '1',
      label: 'Main Idea',
      nodeType: 'title',
      backgroundColor: '#fee2e2',
      strokeColor: '#ef4444',
      strokeWidth: 3,
      strokeStyle: 'solid',
      fontSize: 'm',
      textAlign: 'center',
      opacity: 1,
      width: 100,
      height: 40,
    },
    position: { x: 400, y: 200 },
  },
];

export const initialEdges: MindMapEdge[] = [];
