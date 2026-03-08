
import { MindMapData } from "@/components/mindmap/types";

const nodeTypeMap: Record<string, string> = {
  title: 'base', topic: 'base', subtopic: 'base', paragraph: 'base',
  section: 'section', checklist: 'checklist', resource: 'resource',
  circle: 'circle', rectangle: 'rectangle', square: 'square',
  triangle: 'triangle', note: 'note', concept: 'concept',
  hline: 'hline', vline: 'vline',
};

const getNodeType = (t: string | undefined) =>
  t && nodeTypeMap[t] ? nodeTypeMap[t] : 'base';

const validNode = (n: any) =>
  n.id && typeof n.id === 'string' &&
  n.position && typeof n.position.x === 'number' &&
  typeof n.position.y === 'number' && n.data;

const validEdge = (e: any) =>
  e.id && typeof e.id === 'string' && e.source && e.target;

export const renderMindMap = async (name: string): Promise<MindMapData | null> => {
  try {
    const res = await fetch(`/api/mindmap?name=${encodeURIComponent(name)}`);
    if (!res.ok) { console.error('Mind map not found:', name); return null; }
    const mm = await res.json();

    mm.nodes = Array.isArray(mm.nodes)
      ? mm.nodes.filter(validNode).map((n: any) => {
          if (n.data?.nodeType) n.type = getNodeType(n.data.nodeType);
          if (!n.type) n.type = 'base';
          return n;
        })
      : [];

    mm.edges = Array.isArray(mm.edges) ? mm.edges.filter(validEdge) : [];

    console.log('Loaded mind map for viewing:', name);
    return mm as MindMapData;
  } catch (err) {
    console.error('Error rendering mind map:', err);
    return null;
  }
};

