
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MindMapDeleteDialogProps {
  mindMapToDelete: string | null;
  setMindMapToDelete: (name: string | null) => void;
  confirmDeleteMindMap: () => void;
}

export const MindMapDeleteDialog: React.FC<MindMapDeleteDialogProps> = ({
  mindMapToDelete,
  setMindMapToDelete,
  confirmDeleteMindMap,
}) => {
  return (
    <AlertDialog open={!!mindMapToDelete} onOpenChange={() => setMindMapToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the mind map
            "{mindMapToDelete}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeleteMindMap} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
