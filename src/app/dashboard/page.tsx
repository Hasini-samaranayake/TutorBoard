'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Lesson, User, HomeworkSubmission } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useClass } from '@/contexts/ClassContext';
import { 
  Plus, 
  BookOpen, 
  Users, 
  FileText, 
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  totalStudents: number;
  totalLessons: number;
  pendingHomework: number;
  completionRate: number;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('class');
  const { currentClass } = useClass();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalLessons: 0,
    pendingHomework: 0,
    completionRate: 0,
  });
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<(HomeworkSubmission & { student: User })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!classId) return;
      
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { count: studentCount },
        { count: lessonCount },
        { data: lessons },
        { data: homework },
        { data: submissions },
      ] = await Promise.all([
        supabase.from('class_enrollments').select('*', { count: 'exact', head: true }).eq('class_id', classId),
        supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id).eq('class_id', classId),
        supabase.from('lessons').select('*').eq('teacher_id', user.id).eq('class_id', classId).order('created_at', { ascending: false }).limit(5),
        supabase.from('homework').select('*, lesson:lessons!inner(teacher_id, class_id)').eq('lesson.teacher_id', user.id).eq('lesson.class_id', classId),
        supabase.from('homework_submissions').select('*, student:profiles(*), homework:homework(*, lesson:lessons!inner(class_id))').eq('homework.lesson.class_id', classId).order('submitted_at', { ascending: false }).limit(5),
      ]);

      const totalHomework = (homework?.length || 0) * (studentCount || 0);
      const completedSubmissions = submissions?.length || 0;
      const completionRate = totalHomework > 0 ? Math.round((completedSubmissions / totalHomework) * 100) : 0;

      setStats({
        totalStudents: studentCount || 0,
        totalLessons: lessonCount || 0,
        pendingHomework: homework?.filter(h => new Date(h.due_date) >= new Date()).length || 0,
        completionRate,
      });

      setRecentLessons(lessons || []);
      setRecentSubmissions(submissions as (HomeworkSubmission & { student: User })[] || []);
      setIsLoading(false);
    }

    loadDashboard();
  }, [classId]);

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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {currentClass ? `${currentClass.name} - Overview` : 'Welcome back! Here\'s an overview of your tutoring activity.'}
          </p>
        </div>
        <Link href={`/whiteboard/new?class=${classId}`}>
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            New Lesson
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label="Total Students"
          value={stats.totalStudents}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6 text-green-600" />}
          label="Total Lessons"
          value={stats.totalLessons}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<FileText className="w-6 h-6 text-orange-600" />}
          label="Active Homework"
          value={stats.pendingHomework}
          bgColor="bg-orange-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Lessons</h2>
            <Link href={`/dashboard/lessons?class=${classId}`} className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentLessons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No lessons yet. Create your first lesson!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/whiteboard/${lesson.id}?class=${classId}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{lesson.title}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(lesson.lesson_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
            <Link href={`/dashboard/homework?class=${classId}`} className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No submissions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{submission.student?.name}</p>
                      <p className="text-sm text-gray-500">
                        Submitted {format(new Date(submission.submitted_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode; label: string; value: string | number; bgColor: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
