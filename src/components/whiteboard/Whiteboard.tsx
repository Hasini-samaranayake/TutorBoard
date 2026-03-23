'use client';

import { useState, useCallback, useRef } from 'react';
import * as fabric from 'fabric';
import { WhiteboardTool, WhiteboardTemplate, WhiteboardPage } from '@/types';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import EquationEditor from './EquationEditor';
import { clearCanvas, serializeCanvas, deserializeCanvas } from '@/lib/canvas-utils';

interface WhiteboardProps {
  initialData?: string;
  initialTemplate?: WhiteboardTemplate;
  onSave?: (data: string) => void;
  readOnly?: boolean;
}

function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function parseInitialData(data: string | undefined): { pages: WhiteboardPage[], currentPageIndex: number } {
  if (!data) {
    return { pages: [{ id: generatePageId(), canvasData: '' }], currentPageIndex: 0 };
  }
  
  try {
    const parsed = JSON.parse(data);
    if (parsed.pages && Array.isArray(parsed.pages)) {
      return { pages: parsed.pages, currentPageIndex: parsed.currentPageIndex || 0 };
    }
    return { pages: [{ id: generatePageId(), canvasData: data }], currentPageIndex: 0 };
  } catch {
    return { pages: [{ id: generatePageId(), canvasData: data }], currentPageIndex: 0 };
  }
}

const DEFAULT_STROKE_WIDTH = 4;

export default function Whiteboard({ initialData, initialTemplate = 'blank', onSave, readOnly = false }: WhiteboardProps) {
  const [activeTool, setActiveTool] = useState<WhiteboardTool>('pen');
  const [activeColor, setActiveColor] = useState('#000000');
  const [template, setTemplate] = useState<WhiteboardTemplate>(initialTemplate);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isEquationEditorOpen, setIsEquationEditorOpen] = useState(false);
  
  const initialParsed = parseInitialData(initialData);
  const [pages, setPages] = useState<WhiteboardPage[]>(initialParsed.pages);
  const [currentPageIndex, setCurrentPageIndex] = useState(initialParsed.currentPageIndex);
  
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
    
    const currentPage = pages[currentPageIndex];
    if (currentPage && currentPage.canvasData) {
      deserializeCanvas(canvas, currentPage.canvasData).catch(console.error);
    }

    if (readOnly) {
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    }
  }, [pages, currentPageIndex, readOnly]);

  const handleHistoryChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    
    historyIndexRef.current--;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    });
  }, []);

  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    
    historyIndexRef.current++;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (confirm('Are you sure you want to clear the canvas?')) {
      clearCanvas(canvas);
    }
  }, []);

  const saveCurrentPage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasData = serializeCanvas(canvas);
    setPages(prev => {
      const newPages = [...prev];
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], canvasData };
      return newPages;
    });
    return canvasData;
  }, [currentPageIndex]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;
    
    const currentCanvasData = serializeCanvas(canvas);
    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = { ...updatedPages[currentPageIndex], canvasData: currentCanvasData };
    
    const data = JSON.stringify({ pages: updatedPages, currentPageIndex });
    onSave(data);
  }, [onSave, pages, currentPageIndex]);

  const handleAddPage = useCallback(() => {
    saveCurrentPage();
    const newPage: WhiteboardPage = { id: generatePageId(), canvasData: '' };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
    
    const canvas = canvasRef.current;
    if (canvas) {
      clearCanvas(canvas);
    }
  }, [saveCurrentPage, pages.length]);

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex <= 0) return;
    
    saveCurrentPage();
    const newIndex = currentPageIndex - 1;
    setCurrentPageIndex(newIndex);
    
    const canvas = canvasRef.current;
    if (canvas && pages[newIndex]) {
      clearCanvas(canvas);
      if (pages[newIndex].canvasData) {
        deserializeCanvas(canvas, pages[newIndex].canvasData).catch(console.error);
      }
    }
  }, [currentPageIndex, saveCurrentPage, pages]);

  const handleNextPage = useCallback(() => {
    if (currentPageIndex >= pages.length - 1) return;
    
    saveCurrentPage();
    const newIndex = currentPageIndex + 1;
    setCurrentPageIndex(newIndex);
    
    const canvas = canvasRef.current;
    if (canvas && pages[newIndex]) {
      clearCanvas(canvas);
      if (pages[newIndex].canvasData) {
        deserializeCanvas(canvas, pages[newIndex].canvasData).catch(console.error);
      }
    }
  }, [currentPageIndex, pages, saveCurrentPage]);

  const handleDeletePage = useCallback(() => {
    if (pages.length <= 1) return;
    
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    const newPages = pages.filter((_, i) => i !== currentPageIndex);
    const newIndex = Math.min(currentPageIndex, newPages.length - 1);
    
    setPages(newPages);
    setCurrentPageIndex(newIndex);
    
    const canvas = canvasRef.current;
    if (canvas && newPages[newIndex]) {
      clearCanvas(canvas);
      if (newPages[newIndex].canvasData) {
        deserializeCanvas(canvas, newPages[newIndex].canvasData).catch(console.error);
      }
    }
  }, [pages, currentPageIndex]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement('a');
    link.download = `whiteboard-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const handleInsertEquation = useCallback((latex: string, html: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.fontSize = '24px';
    document.body.appendChild(tempDiv);

    const svgElement = tempDiv.querySelector('svg');
    if (svgElement) {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      fabric.FabricImage.fromURL(url).then((img) => {
        img.set({
          left: canvas.width! / 2 - (img.width || 0) / 2,
          top: canvas.height! / 2 - (img.height || 0) / 2,
          selectable: true,
          evented: true,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        URL.revokeObjectURL(url);
      });
    } else {
      const text = new fabric.Textbox(latex, {
        left: canvas.width! / 2 - 100,
        top: canvas.height! / 2 - 20,
        fontSize: 24,
        fontFamily: 'serif',
        fill: activeColor,
        selectable: true,
        evented: true,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    }

    document.body.removeChild(tempDiv);
    setActiveTool('select');
  }, [activeColor]);

  if (readOnly) {
    return (
      <div className="flex flex-col h-full">
        <Canvas
          activeTool="select"
          activeColor={activeColor}
          strokeWidth={DEFAULT_STROKE_WIDTH}
          template={template}
          onCanvasReady={handleCanvasReady}
          onHistoryChange={handleHistoryChange}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        template={template}
        setTemplate={setTemplate}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onSave={handleSave}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenEquationEditor={() => setIsEquationEditorOpen(true)}
        currentPage={currentPageIndex + 1}
        totalPages={pages.length}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
      />
      <Canvas
        activeTool={activeTool}
        activeColor={activeColor}
        strokeWidth={DEFAULT_STROKE_WIDTH}
        template={template}
        onCanvasReady={handleCanvasReady}
        onHistoryChange={handleHistoryChange}
        onToolChange={setActiveTool}
      />
      <EquationEditor
        isOpen={isEquationEditorOpen}
        onClose={() => setIsEquationEditorOpen(false)}
        onInsert={handleInsertEquation}
      />
    </div>
  );
}
