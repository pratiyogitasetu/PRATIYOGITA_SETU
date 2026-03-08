
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
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
import { LinkNode } from './node-components/LinkNode';
import { TextOnlyNode } from './node-components/TextOnlyNode';
import { initialNodes, initialEdges } from './MindMapInitialData';
import { MindMapTopBar } from './MindMapTopBar';
import { MindMapDeleteDialog } from './MindMapDeleteDialog';
import { MindMapSaveDialog } from './MindMapSaveDialog';

import { useMindMapStorage } from './MindMapStorage';
import { ComponentsSidebar } from './ComponentsSidebar';
import { RightPanel } from './RightPanel';
import { useMindMapNodeHandlers } from './hooks/useMindMapNodeHandlers';
import { useMindMapEdgeHandlers } from './hooks/useMindMapEdgeHandlers';
import { ChevronLeft } from 'lucide-react';
import { toPng } from 'html-to-image';
import { CanvasContextMenu } from './CanvasContextMenu';

import { MindMapHeader, MindMapHeaderData } from './MindMapHeader';
import { mindMapHistory } from '@/utils/mindmapHistory';
import { WorkspaceBoundaryNode, WORKSPACE_WIDTH, WORKSPACE_HEIGHT, WORKSPACE_X, WORKSPACE_Y } from './WorkspaceBoundary';
import { getHelperLines } from './utils/getHelperLines';
import { HelperLines } from './HelperLines';
import { useToast } from '@/hooks/use-toast';
import { ExamCategory } from './types';
import { 
  AutoSaveConfig, 
  initAutoSaveConfig, 
  performAutoSave 
} from '@/utils/mindmapAutoSave';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  link: LinkNode,
  textonly: TextOnlyNode,
  workspace: WorkspaceBoundaryNode,
};

// The workspace boundary node (always present, non-interactive)
const workspaceBoundaryNode = {
  id: '__workspace_boundary__',
  type: 'workspace' as const,
  position: { x: WORKSPACE_X, y: WORKSPACE_Y },
  data: { id: '__workspace_boundary__', label: '' } as any,
  selectable: false,
  draggable: false,
  deletable: false,
  focusable: false,
  style: { zIndex: -1 },
};

export const MindMap = () => {
  return (
    <ReactFlowProvider>
      <MindMapInner />
    </ReactFlowProvider>
  );
};

const MindMapInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstanceRef = useRef<any>(null);
  const [nodes, setNodes, defaultOnNodesChange] = useNodesState([workspaceBoundaryNode, ...initialNodes]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [helperLineH, setHelperLineH] = useState<number | undefined>(undefined);
  const [helperLineV, setHelperLineV] = useState<number | undefined>(undefined);
  const [currentMindMap, setCurrentMindMap] = useState<string>('');
  const [currentExamCategory, setCurrentExamCategory] = useState<ExamCategory | ''>('');
  const [mindMapToDelete, setMindMapToDelete] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [rightPanelVisible, setRightPanelVisible] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [autoSaveConfig, setAutoSaveConfig] = useState<AutoSaveConfig>(initAutoSaveConfig());
  const [headerData, setHeaderData] = useState<MindMapHeaderData>({
    title: '',
    description: '',
    subDetails: ''
  });
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);
  const [showNewWarning, setShowNewWarning] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  // Canvas context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);
  const exportAreaRef = useRef<HTMLDivElement>(null);
  const autoSaveSavedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { getNodes } = useReactFlow();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentExamCategoryRef = useRef<ExamCategory | ''>('');
  const { toast } = useToast();
  const lastChangeRef = useRef<number>(Date.now());
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const isNewMapFlow = useRef<boolean>(false);
  const historyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skipIsSavedResetRef = useRef<boolean>(false);
  // Always-current refs so auto-save never uses stale closure values
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const currentMindMapRef = useRef(currentMindMap);
  const autoSaveConfigRef = useRef(autoSaveConfig);
  const autoSaveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const headerDataRef = useRef(headerData);

  // Custom onNodesChange with alignment guide lines + snapping
  const onNodesChange = useCallback(
    (changes: any[]) => {
      const { horizontal, vertical, snapX, snapY } = getHelperLines(changes, nodesRef.current);
      setHelperLineH(horizontal);
      setHelperLineV(vertical);

      // Apply snap correction to the dragging position change
      if (typeof snapX === 'number' || typeof snapY === 'number') {
        const adjusted = changes.map((c: any) => {
          if (c.type === 'position' && c.dragging && c.position) {
            return {
              ...c,
              position: {
                x: snapX ?? c.position.x,
                y: snapY ?? c.position.y,
              },
            };
          }
          return c;
        });
        defaultOnNodesChange(adjusted);
      } else {
        defaultOnNodesChange(changes);
      }
    },
    [defaultOnNodesChange],
  );

  // Node handlers
  const { 
    deleteNode, 
    updateNodeData, 
    addNode,
    copyNode,
    pasteNode,
    duplicateNode
  } = useMindMapNodeHandlers({ 
    nodes, 
    setNodes 
  });

  // Edge handlers
  const { selectedEdge, updateEdge, onConnect, onEdgeClick } = useMindMapEdgeHandlers({
    setEdges
  });

  // Storage handlers
  const {
    loadExistingMindMap,
    handleDeleteMindMap,
    confirmDeleteMindMap,
    saveCurrentMindMap,
    openSaveDialog,
    isSaveDialogOpen,
    setIsSaveDialogOpen
  } = useMindMapStorage({
    nodes,
    edges,
    setNodes,
    setEdges,
    currentMindMap,
    setCurrentMindMap,
    setMindMapToDelete,
    initialNodes,
    headerData,
    setHeaderData,
    setCurrentExamCategory
  });

  // New mind map: warn if unsaved changes, then open save dialog
  const handleNewMindMap = useCallback(() => {
    if (!isSaved) {
      setShowNewWarning(true);
    } else {
      isNewMapFlow.current = true;
      openSaveDialog();
    }
  }, [isSaved, openSaveDialog]);

  const confirmNewMindMap = useCallback(() => {
    setShowNewWarning(false);
    isNewMapFlow.current = true;
    openSaveDialog();
  }, [openSaveDialog]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const previousState = mindMapHistory.undo(nodes, edges);
    if (previousState) {
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      toast({
        title: "Undo",
        description: "Previous action undone",
      });
      updateUndoRedoState();
    }
  }, [nodes, edges, setNodes, setEdges, toast]);

  const handleRedo = useCallback(() => {
    const nextState = mindMapHistory.redo(nodes, edges);
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      toast({
        title: "Redo",
        description: "Action redone",
      });
      updateUndoRedoState();
    }
  }, [nodes, edges, setNodes, setEdges, toast]);

  const updateUndoRedoState = useCallback(() => {
    setCanUndo(mindMapHistory.canUndo());
    setCanRedo(mindMapHistory.canRedo());
  }, []);

  // Handle saving mind map with exam category and sub-exam
  const handleSaveMindMap = useCallback(async (name: string, examCategory: ExamCategory) => {
    const emptyHeader = { title: '', description: '', subDetails: '' };
    if (isNewMapFlow.current) {
      // New map: persist an empty canvas immediately, then reset UI
      await saveCurrentMindMap(name, examCategory, emptyHeader, [workspaceBoundaryNode, ...initialNodes], initialEdges);
      setCurrentExamCategory(examCategory);
      currentExamCategoryRef.current = examCategory;
      isNewMapFlow.current = false;
      setNodes([workspaceBoundaryNode, ...initialNodes]);
      setEdges(initialEdges);
      setHeaderData(emptyHeader);
      mindMapHistory.clear();
      updateUndoRedoState();
      skipIsSavedResetRef.current = true;
      setIsSaved(true);
    } else {
      // Normal save: persist whatever is on the canvas right now
      await saveCurrentMindMap(name, examCategory, headerDataRef.current);
      setCurrentExamCategory(examCategory);
      currentExamCategoryRef.current = examCategory;
      skipIsSavedResetRef.current = true;
      setIsSaved(true);
    }
  }, [saveCurrentMindMap, setNodes, setEdges, updateUndoRedoState]);

  // Keep always-current refs in sync
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { currentMindMapRef.current = currentMindMap; }, [currentMindMap]);
  useEffect(() => { autoSaveConfigRef.current = autoSaveConfig; }, [autoSaveConfig]);
  useEffect(() => { headerDataRef.current = headerData; }, [headerData]);

  // Keep exam category ref in sync with state (handles load-map path too)
  useEffect(() => {
    currentExamCategoryRef.current = currentExamCategory;
  }, [currentExamCategory]);

  // Record changes to history — debounced 500ms to group rapid small changes
  useEffect(() => {
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => {
      mindMapHistory.record(nodes, edges);
      updateUndoRedoState();
      lastChangeRef.current = Date.now();
      if (skipIsSavedResetRef.current) {
        skipIsSavedResetRef.current = false;
      } else {
        setIsSaved(false);
        // Debounced auto-save: save 2 seconds after the last change
        if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
        autoSaveDebounceRef.current = setTimeout(async () => {
          const mapName = currentMindMapRef.current;
          const cfg = autoSaveConfigRef.current;
          if (!cfg.enabled || !mapName) return;
          setAutoSaveStatus('saving');
          const newCfg = await performAutoSave(
            {
              nodes: nodesRef.current,
              edges: edgesRef.current,
              name: mapName,
              examCategory: currentExamCategoryRef.current || undefined,
              headerData: headerDataRef.current,
            },
            cfg
          );
          setAutoSaveConfig(newCfg);
          skipIsSavedResetRef.current = true;
          setIsSaved(true);
          setAutoSaveStatus('saved');
          // Reset indicator after 3 seconds
          if (autoSaveSavedTimerRef.current) clearTimeout(autoSaveSavedTimerRef.current);
          autoSaveSavedTimerRef.current = setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }, 2000);
      }
    }, 500);
    return () => {
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    };
  }, [nodes, edges, updateUndoRedoState]);

  // Mark unsaved + trigger auto-save when header data changes
  useEffect(() => {
    if (skipIsSavedResetRef.current) {
      skipIsSavedResetRef.current = false;
      return;
    }
    setIsSaved(false);
    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    autoSaveDebounceRef.current = setTimeout(async () => {
      const mapName = currentMindMapRef.current;
      const cfg = autoSaveConfigRef.current;
      if (!cfg.enabled || !mapName) return;
      setAutoSaveStatus('saving');
      const newCfg = await performAutoSave(
        {
          nodes: nodesRef.current,
          edges: edgesRef.current,
          name: mapName,
          examCategory: currentExamCategoryRef.current || undefined,
          headerData: headerDataRef.current,
        },
        cfg
      );
      setAutoSaveConfig(newCfg);
      skipIsSavedResetRef.current = true;
      setIsSaved(true);
      setAutoSaveStatus('saved');
      if (autoSaveSavedTimerRef.current) clearTimeout(autoSaveSavedTimerRef.current);
      autoSaveSavedTimerRef.current = setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }, 2000);
  }, [headerData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save functionality — legacy interval kept only for the switch UI, actual saving is debounced above
  useEffect(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [autoSaveConfig]);

  // Assign API to window for global access
  useEffect(() => {
    (window as any).mindmapApi = {
      deleteNode,
      updateNodeData,
      updateEdge,
      copyNode,
      pasteNode,
      duplicateNode
    };
    return () => {
      delete (window as any).mindmapApi;
    };
  }, [deleteNode, updateNodeData, updateEdge, copyNode, pasteNode, duplicateNode]);

  // Toggle sidebar visibility
  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleToggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };

  // Confirm deletion handler for mind maps
  const handleConfirmDeleteMindMap = () => {
    confirmDeleteMindMap(mindMapToDelete);
    setMindMapToDelete(null);
  };

  const handleAddNode = useCallback((type: string) => {
    addNode(type as any, {
      position: {
        x: WORKSPACE_X + WORKSPACE_WIDTH / 2 - 120,
        y: WORKSPACE_Y + WORKSPACE_HEIGHT / 2 - 120,
      },
    });
  }, [addNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowInstanceRef.current || !reactFlowWrapper.current) {
      return;
    }

    const rect = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstanceRef.current.screenToFlowPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    addNode(type as any, { position });
  }, [addNode]);

  // Handle node click to show node settings
  const onNodeClick = (_: React.MouseEvent, node: any) => {
    setSelectedNode(node.id);
  };

  // Right-click on empty canvas pane
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    const flowPos = reactFlowInstanceRef.current?.screenToFlowPosition({
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    }) ?? { x: 0, y: 0 };
    setContextMenu({ x: event.clientX, y: event.clientY, flowX: flowPos.x, flowY: flowPos.y });
  }, []);

  // Bulk delete all currently selected nodes
  const handleDeleteSelected = useCallback(() => {
    const selected = nodes.filter(n => n.selected && n.id !== '__workspace_boundary__');
    if (selected.length === 0) return;
    selected.forEach(n => deleteNode(n.id));
  }, [nodes, deleteNode]);

  // Select all nodes
  const handleSelectAll = useCallback(() => {
    setNodes(nds => nds.map(n =>
      n.id === '__workspace_boundary__' ? n : { ...n, selected: true }
    ));
  }, [setNodes]);

  // Export full canvas (header + canvas) as PNG
  const handleExportPng = useCallback(async () => {
    const el = exportAreaRef.current;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${currentMindMap || 'mindmap'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('PNG export failed', e);
      toast({ title: 'Export failed', description: 'Could not export PNG', variant: 'destructive' });
    }
  }, [currentMindMap, toast]);

  // Keyboard shortcut: Ctrl+A select all, Delete for bulk delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey) {
        const selected = nodes.filter(n => n.selected && n.id !== '__workspace_boundary__');
        if (selected.length > 1) {
          e.preventDefault();
          selected.forEach(n => deleteNode(n.id));
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [nodes, handleSelectAll, deleteNode]);

  // Get the selected node data
  const getSelectedNodeData = () => {
    return nodes.find(node => node.id === selectedNode)?.data;
  };

  const selectedNodeData = getSelectedNodeData();
  const nodeType = selectedNodeData?.nodeType;
  
  // Check if the selected node is a shape

  return (
    <>
      <div className="w-full h-screen flex">
        {/* Left panel */}
        <ComponentsSidebar
          onAddNode={handleAddNode}
          onToggleSidebar={handleToggleSidebar}
          collapsed={!sidebarVisible}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <MindMapTopBar
            currentMindMap={currentMindMap}
            onSave={openSaveDialog}
            onNew={handleNewMindMap}
            isSaved={isSaved}
            autoSaveStatus={autoSaveStatus}
            onExportPng={handleExportPng}
            loadExistingMindMap={loadExistingMindMap}
            handleDeleteMindMap={handleDeleteMindMap}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            autoSaveConfig={autoSaveConfig}
            onAutoSaveConfigChange={setAutoSaveConfig}
          />
          
          {/* Mind Map Header */}
          <div ref={exportAreaRef} className="flex flex-col flex-1 overflow-hidden">
          <MindMapHeader
            data={headerData}
            onChange={setHeaderData}
            isCollapsed={isHeaderCollapsed}
            onToggleCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
          />
          
          <div ref={reactFlowWrapper} className="flex-1 overflow-hidden relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              onNodeClick={onNodeClick}
              onPaneContextMenu={onPaneContextMenu}
              onPaneClick={() => setContextMenu(null)}
              onInit={(instance) => {
                reactFlowInstanceRef.current = instance;
              }}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              selectionOnDrag
              multiSelectionKeyCode="Shift"
              selectionKeyCode="Shift"
              nodeExtent={[[WORKSPACE_X, WORKSPACE_Y], [WORKSPACE_X + WORKSPACE_WIDTH, WORKSPACE_Y + WORKSPACE_HEIGHT]]}
            >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
          <HelperLines horizontal={helperLineH} vertical={helperLineV} />
          </div>
          </div>
          
        </div>

        {/* Right panel or collapsed bar */}
        {rightPanelVisible ? (
          <RightPanel
            onToggle={handleToggleRightPanel}
            selectedNode={selectedNode}
            nodeType={nodeType}
            selectedNodeData={selectedNodeData as any}
            selectedEdgeId={selectedEdge}
            selectedEdgeData={selectedEdge ? (edges.find(e => e.id === selectedEdge)?.data ?? null) : null}
          />
        ) : (
          <button
            onClick={handleToggleRightPanel}
            title="Open Properties"
            className="h-full w-10 flex-shrink-0 flex flex-col items-center justify-center gap-1 bg-white border-l border-gray-200 hover:bg-gray-50 transition-colors group"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600" />
            <span className="[writing-mode:vertical-rl] text-[10px] font-medium text-gray-400 group-hover:text-gray-600 tracking-widest uppercase">Props</span>
          </button>
        )}
      </div>

      {/* Canvas right-click context menu */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          flowPosition={{ x: contextMenu.flowX, y: contextMenu.flowY }}
          onClose={() => setContextMenu(null)}
          onAddNode={(type, pos) => addNode(type as any, { position: pos })}
          onPaste={() => { window.mindmapApi?.pasteNode?.(); }}
          onSelectAll={handleSelectAll}
          onDeleteSelected={handleDeleteSelected}
          hasSelection={nodes.some(n => n.selected && n.id !== '__workspace_boundary__')}
          hasClipboard={!!localStorage.getItem('mindmap-copied-node')}
        />
      )}

      {/* Mind Map Delete Dialog */}
      <MindMapDeleteDialog
        mindMapToDelete={mindMapToDelete}
        setMindMapToDelete={setMindMapToDelete}
        confirmDeleteMindMap={handleConfirmDeleteMindMap}
      />

      {/* Mind Map Save Dialog */}
      <MindMapSaveDialog 
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSaveMindMap}
        currentName={currentMindMap}
        isNewFlow={isNewMapFlow.current}
      />

      {/* Unsaved changes warning before creating new map */}
      <AlertDialog open={showNewWarning} onOpenChange={setShowNewWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Your current mind map has unsaved changes. Creating a new map will discard them. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNewMindMap} className="bg-red-600 hover:bg-red-700">
              Continue (Discard Changes)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
