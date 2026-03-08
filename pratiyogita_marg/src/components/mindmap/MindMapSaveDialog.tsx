
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ExamCategory, EXAM_CATEGORIES } from "./types";
import { useToast } from "@/hooks/use-toast";

interface MindMapSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, examCategory: ExamCategory) => void;
  currentName: string;
  isNewFlow?: boolean;
}

export function MindMapSaveDialog({
  open,
  onOpenChange,
  onSave,
  currentName,
  isNewFlow = false,
}: MindMapSaveDialogProps) {
  const [name, setName] = useState(currentName);
  const [examCategory, setExamCategory] = useState<ExamCategory | ''>('');

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // For new flow, always start with blank name & category
      setName(isNewFlow ? '' : currentName);
      setExamCategory('');
    }
  }, [open, currentName, isNewFlow]);

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mind map name",
        variant: "destructive",
      });
      return;
    }

    if (!examCategory) {
      toast({
        title: "Error",
        description: "Please select an exam category",
        variant: "destructive",
      });
      return;
    }

    onSave(name, examCategory as ExamCategory);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isNewFlow ? 'New Mind Map' : 'Save Mind Map'}</DialogTitle>
          <DialogDescription>
            {isNewFlow
              ? 'Naye mind map ka naam aur exam category daalein'
              : 'Enter the details to save your mind map'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Enter mind map name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="examCategory" className="text-right">
              Exam Category
            </Label>
            <Select value={examCategory} onValueChange={(value) => setExamCategory(value as ExamCategory)}>
              <SelectTrigger id="examCategory" className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {EXAM_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
