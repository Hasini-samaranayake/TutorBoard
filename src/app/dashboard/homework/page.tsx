'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Homework, Lesson, HomeworkSubmission, User, HomeworkResource } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Plus, FileText, Calendar, Users, CheckCircle, Trash2, Eye, Upload, Image as ImageIcon, FileBadge2, Link as LinkIcon } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface HomeworkWithLesson extends Homework {
  lesson: Lesson;
  resources?: HomeworkResource[];
  submissions?: (HomeworkSubmission & { student: User })[];
}

export default function HomeworkPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('class');
  
  const [homework, setHomework] = useState<HomeworkWithLesson[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkWithLesson | null>(null);
  const [submissionLinks, setSubmissionLinks] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [resourceFiles, setResourceFiles] = useState<File[]>([]);
  const [resourcePageCounts, setResourcePageCounts] = useState<Record<string, number>>({});
  const [resourceUploadError, setResourceUploadError] = useState<string | null>(null);
  const resourceInputRef = useRef<HTMLInputElement>(null);
  const [newHomework, setNewHomework] = useState({
    lesson_id: '',
    description: '',
    due_date: '',
  });

  useEffect(() => {
    loadData();
  }, [classId]);

  async function loadData() {
    if (!classId) return;
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { data: lessonsData },
      { data: homeworkData },
      { data: resourcesData },
    ] = await Promise.all([
      supabase.from('lessons').select('*').eq('teacher_id', user.id).eq('class_id', classId).order('lesson_date', { ascending: false }),
      supabase.from('homework').select('*, lesson:lessons!inner(*)').eq('lesson.teacher_id', user.id).eq('lesson.class_id', classId).order('due_date', { ascending: false }),
      supabase.from('homework_resources').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false }),
    ]);

    setLessons(lessonsData || []);
    const resourceMap = new Map<string, HomeworkResource[]>();
    (resourcesData || []).forEach((r) => {
      const key = r.homework_id;
      resourceMap.set(key, [...(resourceMap.get(key) || []), r]);
    });
    const merged = (homeworkData as HomeworkWithLesson[] || []).map((h) => ({
      ...h,
      resources: resourceMap.get(h.id) || [],
    }));
    setHomework(merged);
    setIsLoading(false);
  }

  const handleCreateHomework = async () => {
    if (!newHomework.lesson_id || !newHomework.description || !newHomework.due_date) return;

    setIsCreating(true);
    setResourceUploadError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('homework')
      .insert(newHomework)
      .select('*, lesson:lessons(*)')
      .single();

    if (!error && data) {
      const created = data as HomeworkWithLesson;
      const uploadedResources: HomeworkResource[] = [];
      let failedUploads = 0;
      for (const file of resourceFiles) {
        const formData = new FormData();
        formData.append('homeworkId', created.id);
        formData.append('file', file);
        formData.append('pageCount', String(resourcePageCounts[file.name] || 1));
        const response = await fetch('/api/homework/resources', {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const resource = await response.json() as HomeworkResource;
          uploadedResources.push(resource);
        } else {
          failedUploads++;
        }
      }

      setHomework([{ ...created, resources: uploadedResources }, ...homework]);
      setIsCreateModalOpen(false);
      setNewHomework({ lesson_id: '', description: '', due_date: '' });
      setResourceFiles([]);
      setResourcePageCounts({});
      if (failedUploads > 0) {
        setResourceUploadError(`${failedUploads} resource upload(s) failed. You can still edit this homework and re-upload.`);
      }
    } else if (error) {
      setResourceUploadError('Failed to create homework. Please try again.');
    }
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this homework?')) return;

    const supabase = createClient();
    const { error } = await supabase.from('homework').delete().eq('id', id);

    if (!error) {
      setHomework(homework.filter(h => h.id !== id));
    }
  };

  const handleViewSubmissions = async (hw: HomeworkWithLesson) => {
    const supabase = createClient();
    const [{ data }, resourcesResponse] = await Promise.all([
      supabase
      .from('homework_submissions')
      .select('*, student:profiles(*)')
      .eq('homework_id', hw.id),
      fetch(`/api/homework/resources?homeworkId=${hw.id}`),
    ]);

    const resources = resourcesResponse.ok ? await resourcesResponse.json() as HomeworkResource[] : [];

    setSelectedHomework({
      ...hw,
      resources,
      submissions: data as (HomeworkSubmission & { student: User })[] || [],
    });
    setIsViewModalOpen(true);
  };

  const handleViewSubmission = async (submissionId: string) => {
    const response = await fetch(`/api/homework/submissions/${submissionId}/view`);
    if (!response.ok) return;
    const data = await response.json() as { signedUrl?: string | null };
    if (data.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      setSubmissionLinks((prev) => ({ ...prev, [submissionId]: data.signedUrl || '' }));
    }
  };

  const getStatusBadge = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Overdue</span>;
    }
    if (isToday(date)) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Due Today</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>;
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
          <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
          <p className="text-gray-600">Create and manage homework assignments</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Assign Homework
        </Button>
      </div>

      {homework.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No homework assigned</h3>
          <p className="text-gray-500 mb-4">Create your first homework assignment</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>Assign Homework</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {homework.map((hw) => (
            <Card key={hw.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{hw.description}</h3>
                      {getStatusBadge(hw.due_date)}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Lesson: {hw.lesson?.title}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {format(new Date(hw.due_date), 'MMM d, yyyy')}
                      </span>
                      {(hw.resources?.length || 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <LinkIcon className="w-4 h-4" />
                          {hw.resources?.length} resource{hw.resources?.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewSubmissions(hw)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Submissions
                  </Button>
                  <button
                    onClick={() => handleDelete(hw.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Assign Homework"
        size="xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Lesson
              </label>
              <select
                value={newHomework.lesson_id}
                onChange={(e) => setNewHomework({ ...newHomework, lesson_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a lesson...</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title} - {format(new Date(lesson.lesson_date), 'MMM d, yyyy')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newHomework.description}
                onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                placeholder="Describe the homework assignment..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-36"
              />
            </div>

            <Input
              label="Due Date"
              type="date"
              value={newHomework.due_date}
              onChange={(e) => setNewHomework({ ...newHomework, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-2">Attach Homework Resources</h4>
              <p className="text-sm text-gray-500 mb-3">
                Students can annotate these resources in whiteboard mode or submit a separate file.
              </p>
              <input
                ref={resourceInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setResourceFiles(files);
                  const defaultPageCounts: Record<string, number> = {};
                  files.forEach((f) => {
                    defaultPageCounts[f.name] = f.type === 'application/pdf' ? 1 : 1;
                  });
                  setResourcePageCounts(defaultPageCounts);
                }}
                className="hidden"
              />
              <Button variant="secondary" onClick={() => resourceInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Resources
              </Button>
              {resourceFiles.length > 0 && (
                <div className="mt-4 space-y-2 max-h-64 overflow-auto">
                  {resourceFiles.map((file) => {
                    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                    return (
                      <div key={file.name} className="border rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isPdf ? <FileBadge2 className="w-4 h-4 text-red-500" /> : <ImageIcon className="w-4 h-4 text-blue-500" />}
                            <span className="text-sm font-medium text-gray-800">{file.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</span>
                        </div>
                        {isPdf && (
                          <div className="mt-2">
                            <label className="text-xs text-gray-600">PDF pages (for annotation navigation)</label>
                            <input
                              type="number"
                              min={1}
                              value={resourcePageCounts[file.name] || 1}
                              onChange={(e) => setResourcePageCounts((prev) => ({
                                ...prev,
                                [file.name]: Math.max(1, Number(e.target.value) || 1),
                              }))}
                              className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {resourceUploadError && (
                <p className="mt-3 text-sm text-red-600">{resourceUploadError}</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateHomework} isLoading={isCreating}>
              Assign Homework
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Homework Submissions"
        size="lg"
      >
        {selectedHomework && (
          <div>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">{selectedHomework.description}</h3>
              <p className="text-sm text-gray-500">
                Due: {format(new Date(selectedHomework.due_date), 'MMMM d, yyyy')}
              </p>
              {(selectedHomework.resources?.length || 0) > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Attached Resources</p>
                  <div className="space-y-1">
                    {selectedHomework.resources?.map((r) => (
                      <p key={r.id} className="text-sm text-gray-600">{r.name} ({r.mime_type}, {r.page_count} page{r.page_count === 1 ? '' : 's'})</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedHomework.submissions?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedHomework.submissions?.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{sub.student?.name}</p>
                        <p className="text-sm text-gray-500">
                          Submitted {format(new Date(sub.submitted_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleViewSubmission(sub.id)}>
                      View Submission
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
