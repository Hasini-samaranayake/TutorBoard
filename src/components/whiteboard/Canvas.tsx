'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { WhiteboardTool, WhiteboardTemplate } from '@/types';
import {
  createPenBrush,
  createHighlighterBrush,
  createLine,
  createRectangle,
  createCircle,
  createArrow,
  createTextbox,
  generateTemplateBackground,
  clearCanvas,
  deleteSelectedObjects,
} from '@/lib/canvas-utils';

interface CanvasProps {
  activeTool: WhiteboardTool;
  activeColor: string;
  strokeWidth: number;
  template: WhiteboardTemplate;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onToolChange?: (tool: WhiteboardTool) => void;
}

export default function Canvas({
  activeTool,
  activeColor,
  strokeWidth,
  template,
  onCanvasReady,
  onHistoryChange,
  onToolChange,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempShapeRef = useRef<fabric.Object | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const saveToHistory = useCallback(() => {
    if (!fabricRef.current) return;
    // Check if canvas context is still valid
    try {
      if (!fabricRef.current.getContext()) return;
    } catch {
      return;
    }
    
    const json = JSON.stringify(fabricRef.current.toJSON());
    
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
    
    onHistoryChange(historyIndexRef.current > 0, historyIndexRef.current < historyRef.current.length - 1);
  }, [onHistoryChange]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Prevent re-initialization if canvas already exists
    if (fabricRef.current) return;

    const container = containerRef.current;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#ffffff',
      selection: true,
    });

    fabricRef.current = canvas;
    onCanvasReady(canvas);

    canvas.on('object:added', () => {
      if (!isDrawingRef.current) saveToHistory();
    });
    canvas.on('object:modified', saveToHistory);
    canvas.on('object:removed', saveToHistory);

    const handleResize = () => {
      if (!fabricRef.current) return;
      fabricRef.current.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      fabricRef.current.renderAll();
    };

    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (fabricRef.current) {
          deleteSelectedObjects(fabricRef.current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    saveToHistory();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onToolChange) {
        const canvas = fabricRef.current;
        if (canvas) {
          const activeObject = canvas.getActiveObject();
          if (activeObject && activeObject.type === 'textbox' && (activeObject as fabric.Textbox).isEditing) {
            (activeObject as fabric.Textbox).exitEditing();
          }
          canvas.discardActiveObject();
          canvas.renderAll();
        }
        onToolChange('select');
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [onToolChange]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // Check if canvas context is still valid
    try {
      if (!canvas.getContext()) return;
    } catch {
      return;
    }

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'default';

    switch (activeTool) {
      case 'select':
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.forEachObject((obj) => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;

      case 'pen':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = createPenBrush(canvas, activeColor, strokeWidth);
        break;

      case 'highlighter':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = createHighlighterBrush(canvas, activeColor, strokeWidth);
        break;

      case 'eraser':
        canvas.defaultCursor = 'crosshair';
        canvas.forEachObject((obj) => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;

      case 'text':
      case 'line':
      case 'rectangle':
      case 'circle':
      case 'arrow':
        canvas.defaultCursor = 'crosshair';
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        break;
    }

    canvas.renderAll();
  }, [activeTool, activeColor, strokeWidth]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !containerRef.current) return;
    // Check if canvas context is still valid
    try {
      if (!canvas.getContext()) return;
    } catch {
      return;
    }

    const bgImage = generateTemplateBackground(template, containerRef.current.clientWidth, containerRef.current.clientHeight);
    
    if (template === 'blank') {
      canvas.backgroundColor = '#ffffff';
      canvas.backgroundImage = undefined;
      canvas.renderAll();
    } else {
      fabric.FabricImage.fromURL(bgImage).then((img) => {
        // Re-check canvas validity after async operation
        if (!fabricRef.current) return;
        try {
          if (!fabricRef.current.getContext()) return;
        } catch {
          return;
        }
        fabricRef.current.backgroundImage = img;
        fabricRef.current.renderAll();
      });
    }
  }, [template]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: fabric.TPointerEventInfo) => {
      if (activeTool === 'select' || activeTool === 'pen' || activeTool === 'highlighter') return;

      const pointer = canvas.getViewportPoint(opt.e);
      startPointRef.current = { x: pointer.x, y: pointer.y };
      isDrawingRef.current = true;

      if (activeTool === 'eraser') {
        const objects = canvas.getObjects();
        for (let i = objects.length - 1; i >= 0; i--) {
          const obj = objects[i];
          if (obj.containsPoint(pointer)) {
            canvas.remove(obj);
            canvas.renderAll();
            break;
          }
        }
        isDrawingRef.current = false;
      } else if (activeTool === 'text') {
        const textbox = createTextbox(pointer.x, pointer.y, 'Type here...', 20, activeColor);
        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        textbox.enterEditing();
        textbox.selectAll();
        isDrawingRef.current = false;
      }
    };

    const handleMouseMove = (opt: fabric.TPointerEventInfo) => {
      if (!isDrawingRef.current || !startPointRef.current) return;
      if (activeTool === 'select' || activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'text' || activeTool === 'eraser') return;

      const pointer = canvas.getViewportPoint(opt.e);
      const { x: startX, y: startY } = startPointRef.current;

      if (tempShapeRef.current) {
        canvas.remove(tempShapeRef.current);
      }

      let shape: fabric.Object | null = null;

      switch (activeTool) {
        case 'line':
          shape = createLine(startX, startY, pointer.x, pointer.y, activeColor, strokeWidth);
          break;
        case 'rectangle':
          const width = pointer.x - startX;
          const height = pointer.y - startY;
          shape = createRectangle(
            width < 0 ? pointer.x : startX,
            height < 0 ? pointer.y : startY,
            Math.abs(width),
            Math.abs(height),
            activeColor,
            strokeWidth
          );
          break;
        case 'circle':
          const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)) / 2;
          const centerX = (startX + pointer.x) / 2;
          const centerY = (startY + pointer.y) / 2;
          shape = createCircle(centerX - radius, centerY - radius, radius, activeColor, strokeWidth);
          break;
        case 'arrow':
          shape = createArrow(startX, startY, pointer.x, pointer.y, activeColor, strokeWidth);
          break;
      }

      if (shape) {
        shape.selectable = false;
        shape.evented = false;
        canvas.add(shape);
        tempShapeRef.current = shape;
        canvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (tempShapeRef.current) {
        tempShapeRef.current.selectable = true;
        tempShapeRef.current.evented = true;
        saveToHistory();
      }
      
      isDrawingRef.current = false;
      startPointRef.current = null;
      tempShapeRef.current = null;
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [activeTool, activeColor, strokeWidth, saveToHistory]);

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden bg-gray-100">
      <canvas ref={canvasRef} className="canvas-container" />
    </div>
  );
}

export function useCanvasHistory(canvas: fabric.Canvas | null) {
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const undo = useCallback(() => {
    if (!canvas || historyIndexRef.current <= 0) return;
    
    historyIndexRef.current--;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
    });
  }, [canvas]);

  const redo = useCallback(() => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    
    historyIndexRef.current++;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
    });
  }, [canvas]);

  return { undo, redo, historyRef, historyIndexRef };
}
