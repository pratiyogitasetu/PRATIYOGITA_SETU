
import { useCallback, useState } from 'react';
import { saveMindMap, loadMindMap, deleteMindMap } from '@/utils/mindmapStorage';
import { useToast } from '@/hooks/use-toast';
import { MindMapData, ExamCategory } from './types';
import { MindMapHeaderData } from './MindMapHeader';

interface UseMindMapStorageProps {
  nodes: any[];
  edges: any[];
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  setEdges: React.Dispatch<React.SetStateAction<any[]>>;
  currentMindMap: string;
  setCurrentMindMap: React.Dispatch<React.SetStateAction<string>>;
  setMindMapToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  initialNodes: any[];
  headerData?: MindMapHeaderData;
  setHeaderData?: React.Dispatch<React.SetStateAction<MindMapHeaderData>>;
  setCurrentExamCategory?: React.Dispatch<React.SetStateAction<ExamCategory | ''>>;
}

export const useMindMapStorage = ({
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
}: UseMindMapStorageProps) => {
  const { toast } = useToast();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const handleExport = useCallback(() => {
    if (!currentMindMap) {
      toast({
        title: "Error",
        description: "Please save your mind map before exporting",
        variant: "destructive",
      });
      return;
    }
    
    const exportUrl = `/export?name=${encodeURIComponent(currentMindMap)}`;
    window.open(exportUrl, '_blank');
  }, [currentMindMap, toast]);

  const createNewMindMap = useCallback(async () => {
    const name = prompt('Enter a name for the new mind map:');
    if (!name) return;

    const success = await saveMindMap({
      nodes: initialNodes,
      edges: [],
      name
    });

    if (success) {
      setNodes(initialNodes);
      setEdges([]);
      setCurrentMindMap(name);
      toast({
        title: "Success",
        description: `Created new mind map: ${name}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create new mind map",
        variant: "destructive",
      });
    }
  }, [initialNodes, setNodes, setEdges, setCurrentMindMap, toast]);

  const loadExistingMindMap = useCallback(async (name: string) => {
    const data = await loadMindMap(name);
    if (data) {
      setNodes(data.nodes);
      // Normalize loaded edges: strip any leftover animated flag and arrow markers
      setEdges((data.edges || []).map(e => ({
        ...e,
        animated: false,
        markerEnd: undefined,
        markerStart: undefined,
      })));
      setCurrentMindMap(name);
      
      // Always reset header data — use saved value or fall back to empty
      if (setHeaderData) {
        setHeaderData(data.headerData || { title: '', description: '', subDetails: '' });
      }

      // Restore exam category
      if (setCurrentExamCategory && data.examCategory) {
        setCurrentExamCategory(data.examCategory as ExamCategory);
      }
      
      toast({
        title: "Success",
        description: `Loaded mind map: ${name}`,
      });
    } else {
      toast({
        title: "Error",
        description: `Failed to load mind map: ${name}`,
        variant: "destructive",
      });
    }
  }, [setNodes, setEdges, setCurrentMindMap, setHeaderData, toast]);

  const handleDeleteMindMap = useCallback((name: string) => {
    setMindMapToDelete(name);
  }, [setMindMapToDelete]);

  const confirmDeleteMindMap = useCallback(async (mindMapToDelete: string | null) => {
    if (!mindMapToDelete) return;

    const success = await deleteMindMap(mindMapToDelete);
    if (success) {
      if (currentMindMap === mindMapToDelete) {
        setNodes(initialNodes);
        setEdges([]);
        setCurrentMindMap('');
      }
      toast({
        title: "Success",
        description: `Deleted mind map: ${mindMapToDelete}`,
      });
    } else {
      toast({
        title: "Error",
        description: `Failed to delete mind map: ${mindMapToDelete}`,
        variant: "destructive",
      });
    }
  }, [currentMindMap, initialNodes, setNodes, setEdges, setCurrentMindMap, toast]);

  const openSaveDialog = useCallback(() => {
    setIsSaveDialogOpen(true);
  }, []);

  const saveCurrentMindMap = useCallback(async (
    name: string,
    examCategory: ExamCategory,
    overrideHeaderData?: MindMapHeaderData,
    nodesOverride?: any[],
    edgesOverride?: any[]
  ) => {
    const success = await saveMindMap({ 
      nodes: nodesOverride !== undefined ? nodesOverride : nodes, 
      edges: edgesOverride !== undefined ? edgesOverride : edges, 
      name,
      examCategory,
      headerData: overrideHeaderData !== undefined ? overrideHeaderData : headerData
    });
    
    if (success) {
      setCurrentMindMap(name);
      toast({
        title: "Success",
        description: `Saved mind map: ${name} under ${examCategory}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save mind map",
        variant: "destructive",
      });
    }
  }, [nodes, edges, headerData, setCurrentMindMap, toast]);

  return {
    handleExport,
    createNewMindMap,
    loadExistingMindMap,
    handleDeleteMindMap,
    confirmDeleteMindMap,
    saveCurrentMindMap,
    openSaveDialog,
    isSaveDialogOpen,
    setIsSaveDialogOpen
  };
};
