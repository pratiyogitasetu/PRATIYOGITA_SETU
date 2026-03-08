
import { MindMapData } from '@/components/mindmap/types';

// ─── Node pre-processing ─────────────────────────────────────────────────────
const processNodesForStorage = (nodes: any[]): any[] =>
  nodes.map(node => {
    const n = JSON.parse(JSON.stringify(node));
    if (n.data && !n.data.nodeType) n.data.nodeType = n.type || 'topic';
    return n;
  });

// ─── Public types ─────────────────────────────────────────────────────────────
export interface MindMapListItem {
  name: string;
  examCategory: string;
  savedAt?: string;
}

// ─── Save ─────────────────────────────────────────────────────────────────────
export const saveMindMap = async (data: MindMapData): Promise<boolean> => {
  try {
    const payload = { ...data, nodes: processNodesForStorage(data.nodes) };
    const res = await fetch('/api/save-mindmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log('Mind map saved to filesystem:', data.name);
    return true;
  } catch (err) {
    console.error('Error saving mind map:', err);
    return false;
  }
};

// ─── Load ─────────────────────────────────────────────────────────────────────
export const loadMindMap = async (name: string): Promise<MindMapData | null> => {
  try {
    const res = await fetch(`/api/mindmap?name=${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null;
    console.log('Mind map loaded from filesystem:', name);
    return data as MindMapData;
  } catch (err) {
    console.error('Error loading mind map:', err);
    return null;
  }
};

// ─── List all ─────────────────────────────────────────────────────────────────
export const getAllMindMaps = async (): Promise<MindMapListItem[]> => {
  try {
    const res = await fetch('/api/mindmaps');
    if (!res.ok) return [];
    return (await res.json()) as MindMapListItem[];
  } catch (err) {
    console.error('Error listing mind maps:', err);
    return [];
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
export const deleteMindMap = async (name: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/delete-mindmap?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    if (!res.ok) return false;
    console.log('Mind map deleted from filesystem:', name);
    return true;
  } catch (err) {
    console.error('Error deleting mind map:', err);
    return false;
  }
};

/** @deprecated no-op: Firebase sync removed */
export const syncMindMapsFromFirebaseToLocal = async (): Promise<number> => 0;
