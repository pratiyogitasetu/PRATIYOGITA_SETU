import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Edit3, 
  Save, 
  X, 
  ChevronDown, 
  ChevronUp,
  Type,
  FileText,
  Info,
  ArrowLeft,
  BookOpen,
  Tag,
  Share2,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

export interface MindMapHeaderData {
  title: string;
  description: string;
  subDetails: string;
}

interface MindMapHeaderProps {
  data: MindMapHeaderData;
  onChange: (data: MindMapHeaderData) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  readOnly?: boolean;
  onBack?: () => void;
}

export const MindMapHeader = ({ 
  data, 
  onChange, 
  isCollapsed = false,
  onToggleCollapse,
  readOnly = false,
  onBack,
}: MindMapHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  // Local buffer so inputs are always controlled and never stale
  const [editData, setEditData] = useState<MindMapHeaderData>(data);
  // Snapshot for Cancel — taken when editing starts
  const snapshotRef = useRef<MindMapHeaderData>(data);
  // Ref for view-mode export
  const viewContainerRef = useRef<HTMLDivElement>(null);

  const handleExportPng = async () => {
    try {
      // Capture full page in view mode
      const el = document.body;
      const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${data.title || 'mindmap'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('PNG export failed', e);
    }
  };

  // When a new map is loaded (data changes externally) and we are NOT in edit mode,
  // sync editData so the display reflects the newly loaded map's header.
  useEffect(() => {
    if (!isEditing) {
      setEditData(data);
    }
  }, [data, isEditing]);

  const startEditing = () => {
    snapshotRef.current = { ...editData }; // save current for cancel
    setIsEditing(true);
  };

  const handleDone = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(snapshotRef.current); // restore local buffer
    onChange(snapshotRef.current);    // restore parent too
    setIsEditing(false);
  };

  // Update local buffer AND propagate to parent immediately on every keystroke
  const handleChange = (field: keyof MindMapHeaderData, value: string) => {
    const updated = { ...editData, [field]: value };
    setEditData(updated);
    onChange(updated);
  };

  // ── READ-ONLY / VIEW MODE ──────────────────────────────────────────────
  if (readOnly) {
    const hasDescription = data.description && data.description !== 'No description provided';
    const hasSubDetails  = data.subDetails  && data.subDetails  !== 'No additional details';

    return (
      <div ref={viewContainerRef} className="bg-white border-b border-gray-200">
        <div className="px-5 py-5">
          {/* Top row: back arrow + actions */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors group"
                  title="Back to Explore"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span className="text-sm font-medium">All Mind Maps</span>
                </button>
              )}
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPng}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 transition-all"
                title="Export as PNG"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export PNG</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    toast.success('Link copied to clipboard!');
                  }).catch(() => {
                    toast.error('Failed to copy link');
                  });
                }}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 transition-all"
                title="Share this mind map"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col gap-2">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
              {data.title || 'Untitled Mind Map'}
            </h1>

            {/* Description — full, no truncation */}
            {hasDescription && (
              <p className="text-gray-600 text-base leading-relaxed max-w-3xl">
                {data.description}
              </p>
            )}

            {/* Sub-details as a tag/badge row */}
            {hasSubDetails && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                {data.subDetails!.split(',').map((part, i) => (
                  <span
                    key={i}
                    className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-gray-200"
                  >
                    {part.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── EDITOR MODE ────────────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <Card className="mx-4 mt-2 border-l-4 border-l-blue-500">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">
                {editData.title || 'Untitled Mind Map'}
              </h3>
              {editData.description && (
                <p className="text-base text-gray-600 truncate">
                  {editData.description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="ml-2"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-4 mt-2 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-700">Mind Map Details</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isEditing && !readOnly ? (
              <Button
                variant="outline"
                size="sm"
                onClick={startEditing}
                className="gap-1"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            ) : !readOnly ? (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDone}
                  className="gap-1"
                >
                  <Save className="h-4 w-4" />
                  Done
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            ) : null}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Title Section */}
          <div className="space-y-2">
            {!readOnly && (
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-gray-500" />
                <label className="text-base font-medium text-gray-700">Title</label>
              </div>
            )}
            {isEditing ? (
              <Input
                value={editData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter mind map title"
                className="text-lg font-semibold"
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900">
                {editData.title || 'Untitled Mind Map'}
              </h1>
            )}
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <label className="text-base font-medium text-gray-700">Description</label>
            </div>
            {isEditing ? (
              <Textarea
                value={editData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter mind map description"
                rows={2}
                className="resize-none"
              />
            ) : (
              <p className="text-gray-700">
                {editData.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Sub Details Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              <label className="text-base font-medium text-gray-700">Sub Details</label>
            </div>
            {isEditing ? (
              <Textarea
                value={editData.subDetails}
                onChange={(e) => handleChange('subDetails', e.target.value)}
                placeholder="Enter additional details, tags, or metadata"
                rows={2}
                className="resize-none"
              />
            ) : (
              <p className="text-base text-gray-600">
                {editData.subDetails || 'No additional details'}
              </p>
            )}
          </div>
        </div>

        {/* Status/Metadata Bar */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-base text-gray-500">
            <span className="italic text-gray-400 text-sm">Mind map details</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};