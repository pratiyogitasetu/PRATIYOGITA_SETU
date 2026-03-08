
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ReactFlow, NodeTypes, Node, ReactFlowProvider, DefaultEdgeOptions, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BaseNode } from './BaseNode';
import { SectionNode } from './node-components/SectionNode';
import { ChecklistNode } from './node-components/ChecklistNode';
import { ResourceNode } from './node-components/ResourceNode';
import { CircleNode } from './node-components/CircleNode';
import { RectangleNode } from './node-components/RectangleNode';
import { SquareNode } from './node-components/SquareNode';
import { TriangleNode } from './node-components/TriangleNode';
import { NoteNode } from './node-components/NoteNode';
import { ConceptNode } from './node-components/ConceptNode';
import { HorizontalLineNode } from './node-components/HorizontalLineNode';
import { VerticalLineNode } from './node-components/VerticalLineNode';
import { WorkspaceBoundaryNode } from './WorkspaceBoundary';
import { renderMindMap } from '@/utils/mindmapRenderer';
import { useToast } from '@/hooks/use-toast';
import { MindMapData, BaseNodeData } from './types';
import { MindMapHeader, MindMapHeaderData } from './MindMapHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { getAllMindMaps } from '@/utils/mindmapStorage';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, FileText, Link2, CheckSquare, StickyNote, Lightbulb, BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { WORKSPACE_WIDTH, WORKSPACE_HEIGHT } from './WorkspaceBoundary';

// Node types mapping for the viewer
const nodeTypes: NodeTypes = {
  base: BaseNode,
  section: SectionNode,
  checklist: ChecklistNode,
  resource: ResourceNode,
  circle: CircleNode,
  rectangle: RectangleNode,
  square: SquareNode,
  triangle: TriangleNode,
  note: NoteNode,
  concept: ConceptNode,
  hline: HorizontalLineNode,
  vline: VerticalLineNode,
  workspace: WorkspaceBoundaryNode,
  title: BaseNode,
  topic: BaseNode,
  subtopic: BaseNode,
  paragraph: BaseNode,
};

/**
 * ViewModeCanvas — renders the mindmap inside a fixed-width container
 * that matches the workspace boundary width. Only vertical scrolling
 * is allowed (handled by the browser's native scroll). No ReactFlow
 * pan / zoom / drag.
 */
const ViewModeCanvas = ({
  mindMapData,
  nodeTypes,
  onNodeClick,
}: {
  mindMapData: MindMapData | null;
  nodeTypes: NodeTypes;
  onNodeClick: (e: React.MouseEvent, node: any) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Filter out workspace boundary node
  const nodes = useMemo(
    () => (mindMapData?.nodes || []).filter(n => n.id !== '__workspace_boundary__'),
    [mindMapData?.nodes]
  );

  const edges = useMemo(
    () =>
      (mindMapData?.edges || []).map(edge => {
        const strokeColor = edge.style?.stroke || edge.data?.strokeColor || '#333';
        const strokeWidth = edge.style?.strokeWidth || edge.data?.strokeWidth || 2;
        const strokeStyle = edge.data?.strokeStyle as string | undefined;
        const dasharray =
          strokeStyle === 'dashed' ? '6,4' :
          strokeStyle === 'dotted' ? '2,4' :
          undefined;
        return {
          ...edge,
          type: edge.type || 'default',
          animated: false,
          markerEnd: undefined,
          markerStart: undefined,
          style: {
            stroke: strokeColor,
            strokeWidth,
            strokeDasharray: dasharray,
          },
        };
      }),
    [mindMapData?.edges]
  );

  // Calculate the actual content height from node positions
  const contentHeight = useMemo(() => {
    if (nodes.length === 0) return WORKSPACE_HEIGHT;
    let maxY = 0;
    nodes.forEach(node => {
      const nodeHeight = (node.data as any)?.height || (node.measured?.height) || 100;
      const bottom = (node.position?.y || 0) + nodeHeight;
      if (bottom > maxY) maxY = bottom;
    });
    // Add some bottom padding
    return Math.max(maxY + 80, 400);
  }, [nodes]);

  // Calculate scale: fit WORKSPACE_WIDTH into the container's actual width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Scale so that WORKSPACE_WIDTH fits exactly in the container
        const newScale = Math.min(containerWidth / WORKSPACE_WIDTH, 1);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // The scaled height of the ReactFlow viewport
  const scaledHeight = contentHeight * scale;

  return (
    <div
      ref={containerRef}
      className="w-full mx-auto bg-white"
      style={{ maxWidth: WORKSPACE_WIDTH }}
    >
      {/* This div has the scaled height so the page scrolls naturally */}
      <div
        style={{
          width: '100%',
          height: scaledHeight,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ReactFlow is rendered at full workspace size, then scaled down with CSS */}
        <div
          style={{
            width: WORKSPACE_WIDTH,
            height: contentHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              minZoom={1}
              maxZoom={1}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              panOnDrag={false}
              panOnScroll={false}
              preventScrolling={false}
              defaultEdgeOptions={{
                type: 'default',
                style: { stroke: '#333', strokeWidth: 2 },
              }}
              className="mindmap-display touchscreen:select-none"
              data-viewmode="true"
              proOptions={{ hideAttribution: true }}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
};

interface MindMapViewerProps {
  predefinedMindMap?: MindMapData;
  containerHeight?: string;
}

export const ExportedMindMap = ({ predefinedMindMap, containerHeight = "100vh" }: MindMapViewerProps) => {
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [selectedMap, setSelectedMap] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<BaseNodeData | null>(null);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [mindMaps, setMindMaps] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMindMaps = async () => {
      const maps = await getAllMindMaps();
      setMindMaps(maps.map(m => m.name));
    };
    void loadMindMaps();
  }, []);

  // Default header data
  const defaultHeaderData: MindMapHeaderData = {
    title: 'Untitled Mind Map',
    description: 'No description provided',
    subDetails: 'No additional details'
  };

  // Auto-load mind map from URL parameter
  useEffect(() => {
    const mapName = searchParams.get('map');
    if (mapName) {
      setSelectedMap(mapName);
      handleRenderMap(mapName);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Use predefined mind map if provided
  useEffect(() => {
    if (predefinedMindMap) {
      setMindMapData(predefinedMindMap);
    }
  }, [predefinedMindMap]);

  const handleRenderMap = async (mapName: string) => {
    if (!mapName) {
      toast({
        title: "Error",
        description: "Please select a mind map to view",
        variant: "destructive",
      });
      return;
    }

    const data = await renderMindMap(mapName);
    if (data) {
      console.log('Mind map loaded for viewing:', data);
      console.log('Number of nodes:', data.nodes?.length || 0);
      console.log('Number of edges:', data.edges?.length || 0);
      console.log('Edges data:', JSON.stringify(data.edges, null, 2));
      
      setMindMapData(data);
      
      toast({
        title: "Success",
        description: `Loaded mind map: ${mapName} with ${data.edges?.length || 0} connections`,
      });
    } else {
      console.error('Failed to load mind map:', mapName);
      toast({
        title: "Error",
        description: `Failed to load mind map: ${mapName}`,
        variant: "destructive",
      });
    }
  };

  const handleRender = () => {
    handleRenderMap(selectedMap);
  };

  const handleNodeClick = (_: React.MouseEvent, node: any) => {
    const d = node.data;
    const hasContent =
      (d?.content?.description && d.content.description.trim() !== '') ||
      (Array.isArray(d?.content?.links) && d.content.links.length > 0) ||
      (d?.nodeType === 'checklist' && Array.isArray(d?.checklistItems) && d.checklistItems.length > 0) ||
      (d?.nodeType === 'note' && d?.noteContent && d.noteContent.trim() !== '') ||
      (d?.nodeType === 'concept' && d?.definition && d.definition.trim() !== '');

    if (hasContent) {
      setSelectedNode(d);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
      <Navbar />

      {/* Spacer for fixed navbar */}
      <div className="h-16 sm:h-20 flex-shrink-0" />

      {/* Mind map area — fills remaining space */}
      <div className="flex-1 flex flex-col">
        {(mindMapData || predefinedMindMap) ? (
          <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-hidden">
            <div
              id="mindmap-container"
              className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
            >
              <MindMapHeader
                data={mindMapData?.headerData || defaultHeaderData}
                onChange={() => {}}
                readOnly={true}
                onBack={() => navigate('/explore')}
              />
              <div className="flex-1 bg-white">
                <ViewModeCanvas
                  mindMapData={mindMapData}
                  nodeTypes={nodeTypes}
                  onNodeClick={handleNodeClick}
                />
              </div>
            </div>
          </div>
        ) : (
          /* No map loaded yet — show select UI */
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl p-10 flex flex-col items-center gap-6 shadow-xl w-full max-w-lg">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mind Map Viewer</h2>
                <p className="text-gray-600 mb-6">Select a mind map to view in presentation mode</p>
              </div>
              <div className="flex gap-4 items-center">
                <Select value={selectedMap} onValueChange={setSelectedMap}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Choose a mind map to view" />
                  </SelectTrigger>
                  <SelectContent>
                    {mindMaps.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleRender} disabled={!selectedMap}>
                  View Mind Map
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Right-side sliding panel */}
      {/* Backdrop */}
      {selectedNode && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setSelectedNode(null)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-80 md:w-96 bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${
            selectedNode ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {selectedNode && (
          <>
            {/* Panel header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex-1 min-w-0 pr-3">
                {/* Node type badge */}
                <span className="inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mb-1">
                  {selectedNode.nodeType || 'node'}
                </span>
                <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
                  {selectedNode.label || 'Node Details'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Description */}
              {selectedNode?.content && typeof selectedNode.content === 'object' && (selectedNode.content as any)?.description && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <h3 className="text-base font-semibold text-gray-700">Description</h3>
                  </div>
                  <p className="text-base text-gray-600 whitespace-pre-wrap leading-relaxed pl-6">
                    {(selectedNode.content as any).description}
                  </p>
                </div>
              )}

              {/* Links */}
              {selectedNode?.content && typeof selectedNode.content === 'object' &&
                Array.isArray((selectedNode.content as any)?.links) &&
                (selectedNode.content as any).links.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-4 w-4 text-violet-500" />
                    <h3 className="text-base font-semibold text-gray-700">Links</h3>
                  </div>
                  <ul className="pl-6 space-y-1.5">
                    {(selectedNode.content as any).links.map((link: any, i: number) => (
                      <li key={i}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 hover:text-blue-800 hover:underline break-all"
                        >
                          {link.label || link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Checklist */}
              {selectedNode?.nodeType === 'checklist' && Array.isArray((selectedNode as any).checklistItems) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-base font-semibold text-gray-700">Checklist</h3>
                  </div>
                  {/* Progress bar */}
                  {(() => {
                    const items = (selectedNode as any).checklistItems as any[];
                    const done = items.filter(i => i.isChecked).length;
                    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
                    return (
                      <div className="pl-6 mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{done}/{items.length} done</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                  <ul className="pl-6 space-y-2">
                    {((selectedNode as any).checklistItems as any[]).map((item: any) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <input type="checkbox" checked={item.isChecked} readOnly className="h-4 w-4 mt-0.5 accent-emerald-500" />
                        <span className={`text-base leading-snug ${
                          item.isChecked ? 'line-through text-gray-400' : 'text-gray-700'
                        }`}>{item.text}</span>
                        {item.priority && (
                          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            item.priority === 'high' ? 'bg-red-100 text-red-700' :
                            item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>{item.priority}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Note */}
              {selectedNode?.nodeType === 'note' && (selectedNode as any).noteContent && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="h-4 w-4 text-amber-500" />
                    <h3 className="text-base font-semibold text-gray-700">Note</h3>
                  </div>
                  <div
                    className="pl-2 pr-3 py-3 rounded-lg border-l-4 border-amber-400 text-base text-gray-700 whitespace-pre-wrap leading-relaxed"
                    style={{ backgroundColor: (selectedNode as any).noteColor || '#fffbeb' }}
                  >
                    {(selectedNode as any).noteContent}
                  </div>
                  {Array.isArray((selectedNode as any).tags) && (selectedNode as any).tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {((selectedNode as any).tags as string[]).map((tag, i) => (
                        <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Concept */}
              {selectedNode?.nodeType === 'concept' && (selectedNode as any).definition && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <h3 className="text-base font-semibold text-gray-700">Definition</h3>
                  </div>
                  <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed pl-6">
                    {(selectedNode as any).definition}
                  </p>
                  {Array.isArray((selectedNode as any).examples) && (selectedNode as any).examples.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-indigo-500" />
                        <h4 className="text-base font-semibold text-gray-700">Examples</h4>
                      </div>
                      <ul className="pl-6 space-y-1.5">
                        {((selectedNode as any).examples as string[]).map((ex, i) => (
                          <li key={i} className="flex items-start gap-2 text-base text-gray-600">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>

      <style>{`
        .mindmap-display .react-flow__handle {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .mindmap-display .react-flow__resize-control {
          display: none !important;
        }
        .mindmap-display .react-flow__node .settings-button {
          display: none !important;
        }
        .mindmap-display .react-flow__node .node-settings {
          display: none !important;
        }
        .mindmap-display {
          background: white !important;
          cursor: default !important;
        }
        .mindmap-display .react-flow__pane {
          cursor: default !important;
        }
        .mindmap-display .react-flow__background {
          display: none !important;
        }
        .mindmap-display .react-flow__controls {
          display: none !important;
        }
        .mindmap-display .react-flow__minimap {
          display: none !important;
        }
        .mindmap-display .react-flow__attribution {
          display: none !important;
        }
        .mindmap-display .react-flow__edges {
          z-index: 5 !important;
          pointer-events: none;
        }
        .mindmap-display .react-flow__edge {
          pointer-events: none;
        }
        .mindmap-display .react-flow__edge path,
        .mindmap-display .react-flow__edge-path {
          fill: none !important;
        }
        .mindmap-display .react-flow__edge.selected path {
          stroke: #3b82f6 !important;
        }
        .mindmap-display .react-flow__edgelabel {
          display: block !important;
        }
        .react-flow__edge-interaction {
          pointer-events: none;
        }
        /* Strip box wrapper from line nodes so only the line itself renders */
        .mindmap-display .react-flow__node-hline,
        .mindmap-display .react-flow__node-vline {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
      `}</style>


    </div>
  );
};
