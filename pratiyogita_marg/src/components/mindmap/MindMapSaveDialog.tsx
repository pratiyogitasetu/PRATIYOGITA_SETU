
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ExamCategory } from "./types";
import { useToast } from "@/hooks/use-toast";

interface CatalogEntry {
  mindmap_name: string;
  exam_code: string;
  linked_json_file: string;
}

type CatalogData = Record<string, CatalogEntry[]>;

const formatName = (s: string) =>
  s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

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
  const [examCategory, setExamCategory] = useState<string>('');
  const [examName, setExamName] = useState('');
  const [catalog, setCatalog] = useState<CatalogData>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const { toast } = useToast();

  // Fetch catalog once when dialog opens
  useEffect(() => {
    if (open && categories.length === 0) {
      setLoadingCatalog(true);
      fetch('/api/mindmap-catalog')
        .then(r => r.ok ? r.json() : {})
        .then((data: CatalogData) => {
          setCatalog(data);
          setCategories(Object.keys(data));
        })
        .catch(() => {})
        .finally(() => setLoadingCatalog(false));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setExamName(isNewFlow ? '' : currentName);
      setExamCategory('');
    }
  }, [open, currentName, isNewFlow]);

  // Exam names for selected category
  const examNames = examCategory ? (catalog[examCategory] || []) : [];

  const handleSave = () => {
    if (!examCategory) {
      toast({ title: "Error", description: "Please select an exam category", variant: "destructive" });
      return;
    }
    if (!examName) {
      toast({ title: "Error", description: "Please select an exam name", variant: "destructive" });
      return;
    }
    onSave(examName, examCategory as ExamCategory);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isNewFlow ? 'New Mind Map' : 'Save Mind Map'}</DialogTitle>
          <DialogDescription>
            {isNewFlow
              ? 'Select category and exam to create a mind map'
              : 'Select category and exam to save your mind map'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Category selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="examCategory" className="text-right">
              Category
            </Label>
            <Select
              value={examCategory}
              onValueChange={(value) => { setExamCategory(value); setExamName(''); }}
              disabled={loadingCatalog}
            >
              <SelectTrigger id="examCategory" className="col-span-3">
                <SelectValue placeholder={loadingCatalog ? "Loading..." : "Select a category"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {formatName(cat)} ({(catalog[cat] || []).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exam name selector (shown after category is selected) */}
          {examCategory && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="examName" className="text-right">
                Exam
              </Label>
              <Select value={examName} onValueChange={setExamName}>
                <SelectTrigger id="examName" className="col-span-3">
                  <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {examNames.map((exam) => (
                    <SelectItem key={exam.mindmap_name} value={exam.mindmap_name}>
                      {exam.mindmap_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={!examCategory || !examName}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
