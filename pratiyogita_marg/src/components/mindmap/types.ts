
import { Edge, Node } from '@xyflow/react';

export interface MindMapData {
  nodes: Node[];
  edges: Edge[];
  name: string;
  examCategory?: string;
  subExamName?: string;
  headerData?: {
    title: string;
    description: string;
    subDetails: string;
  };
}

export interface BaseNodeData {
  id: string;
  label: string;
  nodeType?: string;
  color?: string;
  fontSize?: number | string;
  fontColor?: string;
  width?: number | string;
  height?: number | string;
  status?: string;
  notes?: string;
  content?: any;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  rotation?: number;
  shadow?: {
    enabled: boolean;
    offsetX?: number;
    offsetY?: number;
    blur?: number;
    color?: string;
  };
  glow?: {
    enabled: boolean;
    blur?: number;
    color?: string;
  };
  aspectRatio?: boolean;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  fontWeight?: FontWeight;
  legend?: {
    enabled: boolean;
    position: LegendPosition;
    text?: string;
    color?: string;
  };
  // Additional properties for specialized nodes
  checklistItems?: any[];
  isChecked?: boolean;
  hasCheckbox?: boolean;
  noteContent?: string;
  noteColor?: string;
  tags?: string[];
  definition?: string;
  examples?: string[];
  position?: { x: number; y: number };
  pinned?: boolean;
  resources?: any[];
  definition?: string;
  examples?: string[];
  [key: string]: any; // Index signature to allow additional properties
}

export interface TopicNodeData extends BaseNodeData {
  nodeType: 'topic';
}

export interface SubtopicNodeData extends BaseNodeData {
  nodeType: 'subtopic';
  content: string;
}

export interface TaskNodeData extends BaseNodeData {
  nodeType: 'task';
  status: 'open' | 'inProgress' | 'completed';
}

export interface MindMapNodeProps {
  data: BaseNodeData;
  id: string;
  selected?: boolean;
}

export type MindMapNode = Node<BaseNodeData>;
export type MindMapEdge = Edge;

export type EdgeData = {
  label?: string;
  animated?: boolean;
  style?: string;
  color?: string;
  width?: number;
  arrowType?: 'default' | 'closed' | 'none';
  strokeWidth?: number;
  strokeColor?: string;
  strokeStyle?: string;
  pathStyle?: string;
  arrowStart?: boolean; // Changed from string to boolean
  arrowEnd?: boolean; // Changed from string to boolean
  [key: string]: any; // Index signature to allow additional properties
};

export type OnEdgeClick = (event: React.MouseEvent, edge: MindMapEdge) => void;

export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 's' | 'm' | 'l';
export type FontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type NodeContent = { title?: string; description?: string; links?: { label: string; url: string }[] };
export type LegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left-top' | 'left-center' | 'left-bottom' | 'right-top' | 'right-center' | 'right-bottom';

export type ExamCategory = 
  | 'SSC_EXAMS'
  | 'BANKING_EXAMS'
  | 'CIVIL_SERVICES_EXAMS'
  | 'DEFENCE_EXAMS'
  | 'ENGINEERING_RECRUITING_EXAMS'
  | 'INSURANCE_EXAMS'
  | 'MBA_EXAMS'
  | 'NURSUING_EXAMS'
  | 'PG_EXAMS'
  | 'POLICE_EXAMS'
  | 'RAILWAY_EXAMS'
  | 'SCHOOL_EXAMS'
  | 'TEACHING_EXAMS'
  | 'UG_EXAMS';

export const EXAM_CATEGORIES: ExamCategory[] = [
  'SSC_EXAMS',
  'BANKING_EXAMS',
  'CIVIL_SERVICES_EXAMS',
  'DEFENCE_EXAMS',
  'ENGINEERING_RECRUITING_EXAMS',
  'INSURANCE_EXAMS',
  'MBA_EXAMS',
  'NURSUING_EXAMS',
  'PG_EXAMS',
  'POLICE_EXAMS',
  'RAILWAY_EXAMS',
  'SCHOOL_EXAMS',
  'TEACHING_EXAMS',
  'UG_EXAMS'
];

// Add a global declaration for the mindmapApi
declare global {
  interface Window {
    mindmapApi?: {
      deleteNode: (id: string) => void;
      updateNodeData: (id: string, updates: Partial<BaseNodeData>) => void;
      updateEdge: (id: string, updates: Partial<EdgeData>) => void;
      copyNode: (id: string) => void;
      pasteNode: (id: string) => void;
      duplicateNode: (id: string) => void;
    };
  }
}
