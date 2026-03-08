import { MindMapData, MindMapNode, MindMapEdge } from '@/components/mindmap/types';

// Maximum history states to keep
const MAX_HISTORY_LENGTH = 50;

export type HistoryEntry = {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  timestamp: number;
};

class MindMapHistory {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private ignoreNextChange = false;

  constructor() {
    this.past = [];
    this.future = [];
  }

  // Record a new state in history
  record(nodes: MindMapNode[], edges: MindMapEdge[]): void {
    if (this.ignoreNextChange) {
      this.ignoreNextChange = false;
      return;
    }

    // Add current state to past
    this.past.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now()
    });

    // Clear future as we're on a new path
    this.future = [];

    // Limit history size
    if (this.past.length > MAX_HISTORY_LENGTH) {
      this.past.shift();
    }
  }

  // Go back one step
  undo(currentNodes: MindMapNode[], currentEdges: MindMapEdge[]): HistoryEntry | null {
    if (this.past.length === 0) {
      return null;
    }

    // Move current state to future
    const currentState: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
      timestamp: Date.now()
    };
    this.future.push(currentState);

    // Get previous state
    const previousState = this.past.pop();
    if (!previousState) return null;

    this.ignoreNextChange = true;
    return previousState;
  }

  // Go forward one step
  redo(currentNodes: MindMapNode[], currentEdges: MindMapEdge[]): HistoryEntry | null {
    if (this.future.length === 0) {
      return null;
    }

    // Move current state to past
    const currentState: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
      timestamp: Date.now()
    };
    this.past.push(currentState);

    // Get next state
    const nextState = this.future.pop();
    if (!nextState) return null;

    this.ignoreNextChange = true;
    return nextState;
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.past.length > 0;
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.future.length > 0;
  }

  // Clear all history
  clear(): void {
    this.past = [];
    this.future = [];
  }
}

export const mindMapHistory = new MindMapHistory();
