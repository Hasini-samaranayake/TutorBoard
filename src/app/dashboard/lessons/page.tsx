'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Lesson } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Plus, BookOpen, Calendar, Trash2, Edit2, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function LessonsPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('class');
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    loadLessons();
  }, [classId]);

  useEffect(() => {
    const filtered = lessons.filter(lesson =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLessons(filtered);
  }, [searchQuery, lessons]);

  async function loadLessons() {
    if (!classId) return;
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('class_id', classId)
      .order('lesson_date', { ascending: false });

    if (!error && data) {
      setLessons(data);
      setFilteredLessons(data);
    }
    setIsLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    const supabase = createClient();
    const { error } = await supabase.from('lessons').delete().eq('id', id);

    if (!error) {
      setLessons(lessons.filter(l => l.id !== id));
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title);
    setEditDate(lesson.lesson_date);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLesson) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('lessons')
      .update({ title: editTitle, lesson_date: editDate })
      .eq('id', editingLesson.id);

    if (!error) {
      setLessons(lessons.map(l => 
        l.id === editingLesson.id 
          ? { ...l, title: editTitle, lesson_date: editDate }
          : l
      ));
      setIsEditModalOpen(false);
      setEditingLesson(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
          <p className="text-gray-600">Manage your lesson whiteboards</p>
        </div>
        <Link href={`/whiteboard/new?class=${classId}`}>
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            New Lesson
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first lesson to get started'}
          </p>
          {!searchQuery && (
            <Link href={`/whiteboard/new?class=${classId}`}>
              <Button>Create Lesson</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(lesson)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(lesson.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{lesson.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(lesson.lesson_date), 'MMMM d, yyyy')}</span>
              </div>
              <Link href={`/whiteboard/${lesson.id}`}>
                <Button variant="secondary" className="w-full">
                  Open Whiteboard
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Lesson"
      >
        <div className="space-y-4">
          <Input
            label="Lesson Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <Input
            label="Lesson Date"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
