'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import * as fabric from 'fabric';
import { createClient } from '@/lib/supabase';
import { Lesson, Annotation, WhiteboardPage } from '@/types';
import Button from '@/components/ui/Button';
import { ArrowLeft, Pencil, Highlighter, Eraser, Save, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { deserializeCanvas, createPenBrush, createHighlighterBrush, COLORS } from '@/lib/canvas-utils';

type AnnotationTool = 'view' | 'pen' | 'highlighter' | 'eraser';

function parseCanvasData(data: string | null): { pages: WhiteboardPage[]; currentPageIndex: number } {
  if (!data) {
    return { pages: [{ id: 'page-1', canvasData: '' }], currentPageIndex: 0 };
  }

  try {
    const parsed = JSON.parse(data);
    if (parsed.pages && Array.isArray(parsed.pages)) {
      return {
        pages: parsed.pages.length > 0 ? parsed.pages : [{ id: 'page-1', canvasData: '' }],
        currentPageIndex: parsed.currentPageIndex || 0,
      };
    }

    return { pages: [{ id: 'page-1', canvasData: data }], currentPageIndex: 0 };
  } catch {
    return { pages: [{ id: 'page-1', canvasData: data }], currentPageIndex: 0 };
  }
}

function parseAnnotationData(data: string | null, defaultPageId: string): Record<string, unknown[]> {
  if (!data) return {};

  try {
    const parsed = JSON.parse(data);

    if (parsed.byPage && typeof parsed.byPage === 'object') {
      return parsed.byPage as Record<string, unknown[]>;
    }

    if (Array.isArray(parsed)) {
      return { [defaultPageId]: parsed };
    }
  } catch {
    return {};
  }

  return {};
}

export default function StudentLessonViewPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [annotation, setAnnotation] = useState<Annotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('view');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [pages, setPages] = useState<WhiteboardPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const annotationLayerRef = useRef<fabric.FabricObject[]>([]);
  const annotationByPageRef = useRef<Record<string, unknown[]>>({});

  useEffect(() => {
    async function loadLesson() {
      if (!params.id) return;

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const [
        { data: lessonData, error: lessonError },
        { data: annotationData },
      ] = await Promise.all([
        supabase.from('lessons').select('*').eq('id', params.id).single(),
        supabase.from('annotations').select('*').eq('lesson_id', params.id).eq('student_id', user.id).single(),
      ]);

      if (lessonError) {
        console.error('Error loading lesson:', lessonError);
        router.push('/student/lessons');
        return;
      }

      const parsedCanvasData = parseCanvasData(lessonData?.canvas_data || null);
      const normalizedCurrentPageIndex = Math.min(
        parsedCanvasData.currentPageIndex,
        Math.max(parsedCanvasData.pages.length - 1, 0)
      );

      setLesson(lessonData);
      setPages(parsedCanvasData.pages);
      setCurrentPageIndex(normalizedCurrentPageIndex);
      annotationByPageRef.current = parseAnnotationData(
        annotationData?.annotation_data || null,
        parsedCanvasData.pages[0]?.id || 'page-1'
      );
      setAnnotation(annotationData);
      setIsLoading(false);
    }

    loadLesson();
  }, [params.id, router]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !lesson) return;

    const container = containerRef.current;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#ffffff',
      selection: false,
    });

    fabricRef.current = canvas;

    const handleResize = () => {
      canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, [lesson]);

  useEffect(() => {
    const canvas = fabricRef.current;
    const currentPage = pages[currentPageIndex];
    if (!canvas || !currentPage) return;

    annotationLayerRef.current = [];
    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    const loadPage = async () => {
      if (currentPage.canvasData) {
        await deserializeCanvas(canvas, currentPage.canvasData);
      } else {
        canvas.renderAll();
      }

      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });

      const pageAnnotations = annotationByPageRef.current[currentPage.id] || [];
      if (pageAnnotations.length > 0) {
        const objects = await fabric.util.enlivenObjects(pageAnnotations);
        objects.forEach((obj) => {
          if (obj && 'set' in obj && typeof obj.set === 'function') {
            const fabricObj = obj as fabric.FabricObject;
            fabricObj.set({ selectable: false, evented: false, visible: showAnnotations });
            canvas.add(fabricObj);
            annotationLayerRef.current.push(fabricObj);
          }
        });
      }

      canvas.renderAll();
    };

    loadPage().catch((error) => {
      console.error('Error loading whiteboard page:', error);
    });
  }, [pages, currentPageIndex, showAnnotations]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;

    switch (activeTool) {
      case 'view':
        canvas.defaultCursor = 'default';
        break;
      case 'pen':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = createPenBrush(canvas, activeColor, 3);
        break;
      case 'highlighter':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = createHighlighterBrush(canvas, activeColor, 4);
        break;
      case 'eraser':
        canvas.defaultCursor = 'crosshair';
        break;
    }

    canvas.renderAll();
  }, [activeTool, activeColor]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handlePathCreated = (e: { path: fabric.Path }) => {
      if (e.path) {
        annotationLayerRef.current.push(e.path);
      }
    };

    const handleMouseDown = (opt: fabric.TPointerEventInfo) => {
      if (activeTool === 'eraser') {
        const pointer = canvas.getViewportPoint(opt.e);
        const objects = canvas.getObjects();
        
        for (let i = objects.length - 1; i >= 0; i--) {
          const obj = objects[i];
          if (annotationLayerRef.current.includes(obj) && obj.containsPoint(pointer)) {
            canvas.remove(obj);
            annotationLayerRef.current = annotationLayerRef.current.filter(o => o !== obj);
            canvas.renderAll();
            break;
          }
        }
      }
    };

    canvas.on('path:created', handlePathCreated);
    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('path:created', handlePathCreated);
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [activeTool]);

  const handleSaveAnnotations = useCallback(async () => {
    if (!fabricRef.current || !lesson || !pages[currentPageIndex]) return;

    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentPageId = pages[currentPageIndex].id;
    annotationByPageRef.current = {
      ...annotationByPageRef.current,
      [currentPageId]: annotationLayerRef.current.map((obj) => obj.toObject()),
    };

    const annotationData = JSON.stringify({
      byPage: annotationByPageRef.current,
    });

    try {
      if (annotation) {
        await supabase
          .from('annotations')
          .update({ annotation_data: annotationData })
          .eq('id', annotation.id);
      } else {
        const { data } = await supabase
          .from('annotations')
          .insert({
            lesson_id: lesson.id,
            student_id: user.id,
            annotation_data: annotationData,
          })
          .select()
          .single();
        
        if (data) setAnnotation(data);
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
      alert('Failed to save annotations');
    } finally {
      setIsSaving(false);
    }
  }, [lesson, annotation, pages, currentPageIndex]);

  const toggleAnnotationsVisibility = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const newVisibility = !showAnnotations;
    setShowAnnotations(newVisibility);

    annotationLayerRef.current.forEach((obj) => {
      obj.visible = newVisibility;
    });
    canvas.renderAll();
  };

  const goToPreviousPage = () => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNextPage = () => {
    setCurrentPageIndex((prev) => Math.min(prev + 1, pages.length - 1));
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center">
        <p>Lesson not found</p>
        <Link href="/student/lessons">
          <Button className="mt-4">Back to Lessons</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/student/lessons"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Lessons</span>
          </Link>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="font-semibold text-gray-900">{lesson.title}</h1>
            <p className="text-sm text-gray-500">
              {format(new Date(lesson.lesson_date), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">Your Notes:</span>
          <button
            onClick={() => setActiveTool('view')}
            className={`p-2 rounded-lg transition-colors ${activeTool === 'view' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="View Mode"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTool('pen')}
            className={`p-2 rounded-lg transition-colors ${activeTool === 'pen' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Pen"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-2 rounded-lg transition-colors ${activeTool === 'highlighter' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Highlighter"
          >
            <Highlighter className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${activeTool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Eraser"
          >
            <Eraser className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-gray-200 mx-2" />
          
          <div className="flex items-center gap-1">
            {COLORS.slice(0, 5).map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  activeColor === color ? 'border-gray-800 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 min-w-[90px] text-center">
              Page {currentPageIndex + 1} of {Math.max(pages.length, 1)}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPageIndex >= pages.length - 1}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <button
            onClick={toggleAnnotationsVisibility}
            className={`p-2 rounded-lg transition-colors ${!showAnnotations ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title={showAnnotations ? 'Hide Notes' : 'Show Notes'}
          >
            {showAnnotations ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>

          <Button onClick={handleSaveAnnotations} isLoading={isSaving} size="sm">
            <Save className="w-4 h-4 mr-1" />
            Save Notes
          </Button>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-hidden bg-gray-100">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
