'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Lesson } from '@/types';
import Whiteboard from '@/components/whiteboard/Whiteboard';
import LessonTimer from '@/components/whiteboard/LessonTimer';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default function WhiteboardPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    async function loadLesson() {
      if (!params.id) return;

      const supabase = createClient();
      
      if (params.id === 'new') {
        setLesson(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error loading lesson:', error);
        router.push('/dashboard');
        return;
      }

      setLesson(data);
      setIsLoading(false);
    }

    loadLesson();
  }, [params.id, router]);

  const handleSave = useCallback(async (canvasData: string) => {
    setIsSaving(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (params.id === 'new') {
        const { data, error } = await supabase
          .from('lessons')
          .insert({
            teacher_id: user.id,
            title: `Lesson - ${new Date().toLocaleDateString()}`,
            lesson_date: new Date().toISOString().split('T')[0],
            canvas_data: canvasData,
            template: 'blank',
          })
          .select()
          .single();

        if (error) throw error;
        
        router.replace(`/whiteboard/${data.id}`);
        setLesson(data);
      } else {
        const { error } = await supabase
          .from('lessons')
          .update({ canvas_data: canvasData })
          .eq('id', params.id);

        if (error) throw error;
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-gray-200" />
          <h1 className="font-semibold text-gray-900">
            {lesson?.title || 'New Lesson'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isSaving && (
            <span className="text-sm text-blue-500">Saving...</span>
          )}
          <button
            onClick={() => setShowTimer(!showTimer)}
            className={`p-2 rounded-lg transition-colors ${showTimer ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Lesson Timer"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1">
          <Whiteboard
            initialData={lesson?.canvas_data || undefined}
            initialTemplate={(lesson?.template as 'blank' | 'graph' | 'lined' | 'coordinate') || 'blank'}
            onSave={handleSave}
          />
        </div>
        {showTimer && (
          <div className="w-80 border-l border-gray-200 bg-white">
            <LessonTimer />
          </div>
        )}
      </div>
    </div>
  );
}
