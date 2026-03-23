'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Homework, Lesson, HomeworkSubmission } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FileText, Calendar, CheckCircle, Clock, Upload, AlertCircle, ExternalLink } from 'lucide-react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

interface HomeworkWithStatus extends Homework {
  lesson: Lesson;
  submission?: HomeworkSubmission;
}

export default function StudentHomeworkPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('class');
  
  const [homework, setHomework] = useState<HomeworkWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkWithStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHomework();
  }, [classId]);

  async function loadHomework() {
    if (!classId) return;
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { data: homeworkData },
      { data: submissions },
    ] = await Promise.all([
      supabase.from('homework').select('*, lesson:lessons!inner(*)').eq('lesson.class_id', classId).order('due_date', { ascending: true }),
      supabase.from('homework_submissions').select('*').eq('student_id', user.id),
    ]);

    const submissionMap = new Map(submissions?.map(s => [s.homework_id, s]) || []);

    const homeworkWithStatus: HomeworkWithStatus[] = (homeworkData || []).map(hw => ({
      ...hw,
      submission: submissionMap.get(hw.id),
    }));

    setHomework(homeworkWithStatus);
    setIsLoading(false);
  }

  const handleOpenSubmit = (hw: HomeworkWithStatus) => {
    setSelectedHomework(hw);
    setIsSubmitModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedHomework) return;

    setIsUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${selectedHomework.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('homework-submissions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('homework-submissions')
        .getPublicUrl(fileName);

      const { data: submission, error: insertError } = await supabase
        .from('homework_submissions')
        .insert({
          homework_id: selectedHomework.id,
          student_id: user.id,
          file_url: publicUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setHomework(homework.map(hw => 
        hw.id === selectedHomework.id 
          ? { ...hw, submission } 
          : hw
      ));

      setIsSubmitModalOpen(false);
      setSelectedHomework(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload submission. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredHomework = homework.filter(hw => {
    if (filter === 'pending') return !hw.submission;
    if (filter === 'completed') return !!hw.submission;
    return true;
  });

  const getStatusInfo = (hw: HomeworkWithStatus) => {
    if (hw.submission) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        badge: <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Completed</span>,
        bgColor: 'bg-green-100',
      };
    }

    const dueDate = new Date(hw.due_date);
    if (isPast(dueDate) && !isToday(dueDate)) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        badge: <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Overdue</span>,
        bgColor: 'bg-red-100',
      };
    }

    const daysLeft = differenceInDays(dueDate, new Date());
    if (daysLeft <= 2) {
      return {
        icon: <Clock className="w-5 h-5 text-orange-600" />,
        badge: <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">Due Soon</span>,
        bgColor: 'bg-orange-100',
      };
    }

    return {
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      badge: <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Pending</span>,
      bgColor: 'bg-blue-100',
    };
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
        <p className="text-gray-600">View and submit your homework assignments</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({homework.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Pending ({homework.filter(h => !h.submission).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Completed ({homework.filter(h => h.submission).length})
        </button>
      </div>

      {filteredHomework.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No homework found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No homework has been assigned yet' 
              : filter === 'pending' 
                ? 'All homework is completed!' 
                : 'No completed homework yet'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHomework.map((hw) => {
            const status = getStatusInfo(hw);
            
            return (
              <Card key={hw.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${status.bgColor} rounded-lg flex items-center justify-center`}>
                      {status.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{hw.description}</h3>
                        {status.badge}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Lesson: {hw.lesson?.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {format(new Date(hw.due_date), 'MMM d, yyyy')}
                        </span>
                        {hw.submission && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Submitted {format(new Date(hw.submission.submitted_at), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hw.submission ? (
                      <a
                        href={hw.submission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Submission
                      </a>
                    ) : (
                      <Button onClick={() => handleOpenSubmit(hw)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Homework"
      >
        {selectedHomework && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">{selectedHomework.description}</h3>
              <p className="text-sm text-gray-500">
                Due: {format(new Date(selectedHomework.due_date), 'MMMM d, yyyy')}
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">
                Upload your homework solution
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supported formats: Images (JPG, PNG) and PDF
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
