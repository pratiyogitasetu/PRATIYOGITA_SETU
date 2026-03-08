import { ChevronLeft, MousePointerClick } from "lucide-react";
import { LinkSettings } from "./settings/LinkSettings";
import { TextOnlySettings } from "./settings/TextOnlySettings";
import { ChecklistSettings } from "./settings/ChecklistSettings";
import { ResourceSettings } from "./settings/ResourceSettings";
import { ShapeSettings } from "./settings/ShapeSettings";
import { NoteSettings } from "./settings/NoteSettings";
import { ConceptSettings } from "./settings/ConceptSettings";
import { NodeSettingsContent } from "./settings/NodeSettingsContent";
import { LineSettings } from "./settings/LineSettings";
import { EdgeSettingsPanel } from "./settings/EdgeSettingsPanel";
import { BaseNodeData, EdgeData } from "./types";

interface RightPanelProps {
  onToggle: () => void;
  selectedNode: string | null;
  nodeType: string | undefined;
  selectedNodeData: BaseNodeData | undefined;
  selectedEdgeId?: string | null;
  selectedEdgeData?: EdgeData | null;
}

const SHAPE_TYPES = new Set(['circle', 'rectangle', 'square', 'triangle']);
const BASE_TYPES  = new Set(['title', 'topic', 'subtopic', 'paragraph', 'section']);

const nodeLabel: Record<string, string> = {
  title:     'Title',
  topic:     'Topic',
  subtopic:  'Sub Topic',
  paragraph: 'Paragraph',
  section:   'Section',
  circle:    'Circle',
  rectangle: 'Rectangle',
  square:    'Square',
  triangle:  'Triangle',
  checklist: 'Checklist',
  resource:  'Resources',
  note:      'Note',
  concept:   'Concept',
  hline:     'Horizontal Line',
  vline:     'Vertical Line',
  link:      'Link',
  textonly:  'Text',
};

export const RightPanel = ({ onToggle, selectedNode, nodeType, selectedNodeData, selectedEdgeId, selectedEdgeData }: RightPanelProps) => {
  const isShape    = nodeType ? SHAPE_TYPES.has(nodeType) : false;
  const isBaseNode = nodeType ? BASE_TYPES.has(nodeType)  : false;
  const isLine     = nodeType === 'hline' || nodeType === 'vline';

  const hasNodeSettings = selectedNode && selectedNodeData && (
    isBaseNode || isLine || isShape ||
    nodeType === 'checklist' || nodeType === 'resource' ||
    nodeType === 'note' || nodeType === 'concept' ||
    nodeType === 'link' || nodeType === 'textonly'
  );

  const hasEdgeSettings = !hasNodeSettings && !!selectedEdgeId && !!selectedEdgeData;

  const panelTitle = selectedEdgeId && !hasNodeSettings
    ? 'Edge Settings'
    : (nodeType && nodeLabel[nodeType] ? `${nodeLabel[nodeType]} Settings` : 'Properties');

  return (
    <div className="h-full w-80 flex-shrink-0 flex flex-col bg-white border-l border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-3 py-2.5 flex justify-between items-center border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-700">{panelTitle}</h2>
        <button
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
          onClick={onToggle}
          title="Close Panel"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {hasNodeSettings ? (
          <div className="px-0 py-0">
            {isBaseNode && <NodeSettingsContent nodeId={selectedNode!} data={selectedNodeData!} />}
            {nodeType === 'checklist' && <ChecklistSettings nodeId={selectedNode!} data={selectedNodeData!} />}
            {nodeType === 'resource'  && <ResourceSettings  nodeId={selectedNode!} data={selectedNodeData!} />}
            {isShape                  && <ShapeSettings      nodeId={selectedNode!} data={selectedNodeData!} />}
            {nodeType === 'note'      && <NoteSettings       nodeId={selectedNode!} data={selectedNodeData!} />}
            {nodeType === 'concept'   && <ConceptSettings    nodeId={selectedNode!} data={selectedNodeData!} />}
            {nodeType === 'link'      && <LinkSettings       nodeId={selectedNode!} data={selectedNodeData!} />}
            {nodeType === 'textonly'  && <TextOnlySettings   nodeId={selectedNode!} data={selectedNodeData!} />}
            {isLine && (
              <LineSettings
                nodeId={selectedNode!}
                data={selectedNodeData!}
                direction={nodeType === 'hline' ? 'horizontal' : 'vertical'}
              />
            )}
          </div>
        ) : hasEdgeSettings ? (
          <EdgeSettingsPanel edgeId={selectedEdgeId!} data={selectedEdgeData!} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4 py-10 text-gray-400">
            <MousePointerClick className="h-8 w-8 opacity-40" />
            <p className="text-base leading-relaxed">
              Select a node or edge on the canvas to see its settings here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
