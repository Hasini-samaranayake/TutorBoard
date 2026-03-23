'use client';

import { 
  MousePointer2, 
  Pencil, 
  Highlighter, 
  Eraser, 
  Type, 
  Minus, 
  Square, 
  Circle, 
  ArrowRight,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Save,
  Grid3X3,
  FileText,
  Axis3D,
  ChevronLeft,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';
import { WhiteboardTool, WhiteboardTemplate } from '@/types';
import { COLORS } from '@/lib/canvas-utils';

interface ToolbarProps {
  activeTool: WhiteboardTool;
  setActiveTool: (tool: WhiteboardTool) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  template: WhiteboardTemplate;
  setTemplate: (template: WhiteboardTemplate) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenEquationEditor: () => void;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddPage: () => void;
  onDeletePage: () => void;
}

export default function Toolbar({
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  template,
  setTemplate,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onExport,
  canUndo,
  canRedo,
  onOpenEquationEditor,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onAddPage,
  onDeletePage,
}: ToolbarProps) {
  const tools: { id: WhiteboardTool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 className="w-5 h-5" />, label: 'Select' },
    { id: 'pen', icon: <Pencil className="w-5 h-5" />, label: 'Pen' },
    { id: 'highlighter', icon: <Highlighter className="w-5 h-5" />, label: 'Highlighter' },
    { id: 'eraser', icon: <Eraser className="w-5 h-5" />, label: 'Eraser' },
    { id: 'text', icon: <Type className="w-5 h-5" />, label: 'Text' },
    { id: 'line', icon: <Minus className="w-5 h-5" />, label: 'Line' },
    { id: 'rectangle', icon: <Square className="w-5 h-5" />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle className="w-5 h-5" />, label: 'Circle' },
    { id: 'arrow', icon: <ArrowRight className="w-5 h-5" />, label: 'Arrow' },
  ];

  const templates: { id: WhiteboardTemplate; icon: React.ReactNode; label: string }[] = [
    { id: 'blank', icon: <FileText className="w-4 h-4" />, label: 'Blank' },
    { id: 'graph', icon: <Grid3X3 className="w-4 h-4" />, label: 'Graph' },
    { id: 'lined', icon: <Minus className="w-4 h-4" />, label: 'Lined' },
    { id: 'coordinate', icon: <Axis3D className="w-4 h-4" />, label: 'Coordinate' },
  ];

  return (
    <div className="whiteboard-toolbar bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
          <button
            onClick={onOpenEquationEditor}
            className={`tool-button ${activeTool === 'equation' ? 'active' : ''}`}
            title="Math Equation"
          >
            <span className="text-lg font-serif">∑</span>
          </button>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Color:</span>
          <div className="flex items-center gap-1">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`color-swatch ${activeColor === color ? 'selected' : ''}`}
                style={{ 
                  backgroundColor: color,
                  border: color === '#ffffff' ? '1px solid #e5e7eb' : undefined
                }}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Template:</span>
          <div className="flex items-center gap-1">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`tool-button text-xs flex items-center gap-1 ${template === t.id ? 'active' : ''}`}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="tool-button disabled:opacity-30"
            title="Undo"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="tool-button disabled:opacity-30"
            title="Redo"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="tool-button disabled:opacity-30"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-700 min-w-[60px] text-center">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="tool-button disabled:opacity-30"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onAddPage}
            className="tool-button text-green-600 hover:bg-green-50"
            title="Add New Page"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={onDeletePage}
            disabled={totalPages <= 1}
            className="tool-button text-red-500 hover:bg-red-50 disabled:opacity-30"
            title="Delete Current Page"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="tool-button text-red-500 hover:bg-red-50"
            title="Clear Canvas"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={onExport} className="tool-button" title="Export as Image">
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onSave}
            className="tool-button bg-blue-500 text-white hover:bg-blue-600"
            title="Save"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
