'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { User, Lesson, Homework, HomeworkSubmission } from '@/types';
import Card from '@/components/ui/Card';
import { BookOpen, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

interface DashboardData {
  profile: User | null;
  recentLessons: Lesson[];
  upcomingHomework: (Homework & { lesson: Lesson })[];
  submissions: HomeworkSubmission[];
  stats: {
    lessonsViewed: number;
    homeworkCompleted: number;
    totalHomework: number;
  };
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData>({
    profile: null,
    recentLessons: [],
    upcomingHomework: [],
    submissions: [],
    stats: { lessonsViewed: 0, homeworkCompleted: 0, totalHomework: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: profile },
        { data: lessons },
        { data: homework },
        { data: submissions },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('lessons').select('*').order('lesson_date', { ascending: false }).limit(5),
        supabase.from('homework').select('*, lesson:lessons(*)').order('due_date', { ascending: true }),
        supabase.from('homework_submissions').select('*').eq('student_id', user.id),
      ]);

      const submittedHomeworkIds = new Set(submissions?.map(s => s.homework_id) || []);
      const pendingHomework = (homework || []).filter(h => 
        !submittedHomeworkIds.has(h.id) && !isPast(new Date(h.due_date))
      );

      setData({
        profile,
        recentLessons: lessons || [],
        upcomingHomework: pendingHomework as (Homework & { lesson: Lesson })[],
        submissions: submissions || [],
        stats: {
          lessonsViewed: lessons?.length || 0,
          homeworkCompleted: submissions?.length || 0,
          totalHomework: homework?.length || 0,
        },
      });
      setIsLoading(false);
    }

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const completionRate = data.stats.totalHomework > 0 
    ? Math.round((data.stats.homeworkCompleted / data.stats.totalHomework) * 100) 
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {data.profile?.name}!
        </h1>
        <p className="text-gray-600">Here&apos;s your learning overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available Lessons</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.lessonsViewed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Homework Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.stats.homeworkCompleted}/{data.stats.totalHomework}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-purple-600">{completionRate}%</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Homework</h2>
            <Link href="/student/homework" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {data.upcomingHomework.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>All caught up! No pending homework.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingHomework.slice(0, 5).map((hw) => {
                const daysUntilDue = differenceInDays(new Date(hw.due_date), new Date());
                const isUrgent = daysUntilDue <= 2;
                
                return (
                  <Link
                    key={hw.id}
                    href="/student/homework"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isUrgent ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        {isUrgent ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{hw.description}</p>
                        <p className="text-sm text-gray-500">{hw.lesson?.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                        {isToday(new Date(hw.due_date)) 
                          ? 'Due Today' 
                          : `${daysUntilDue} days left`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(hw.due_date), 'MMM d')}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Lessons</h2>
            <Link href="/student/lessons" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {data.recentLessons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No lessons available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/student/lessons/${lesson.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{lesson.title}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(lesson.lesson_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Clock className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
