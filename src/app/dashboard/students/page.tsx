'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User, HomeworkSubmission, Homework } from '@/types';
import Card from '@/components/ui/Card';
import { Users, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface StudentWithStats extends User {
  submissionCount: number;
  totalHomework: number;
  completionRate: number;
  lastSubmission?: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<(HomeworkSubmission & { homework: Homework })[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  async function loadStudents() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { data: studentProfiles },
      { data: homework },
      { data: submissions },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student'),
      supabase.from('homework').select('*, lesson:lessons!inner(teacher_id)').eq('lesson.teacher_id', user.id),
      supabase.from('homework_submissions').select('*'),
    ]);

    const totalHomework = homework?.length || 0;

    const studentsWithStats: StudentWithStats[] = (studentProfiles || []).map(student => {
      const studentSubs = submissions?.filter(s => s.student_id === student.id) || [];
      const lastSub = studentSubs.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      )[0];

      return {
        ...student,
        submissionCount: studentSubs.length,
        totalHomework,
        completionRate: totalHomework > 0 ? Math.round((studentSubs.length / totalHomework) * 100) : 0,
        lastSubmission: lastSub?.submitted_at,
      };
    });

    setStudents(studentsWithStats);
    setFilteredStudents(studentsWithStats);
    setIsLoading(false);
  }

  const loadStudentSubmissions = async (student: StudentWithStats) => {
    setSelectedStudent(student);
    
    const supabase = createClient();
    const { data } = await supabase
      .from('homework_submissions')
      .select('*, homework:homework(*)')
      .eq('student_id', student.id)
      .order('submitted_at', { ascending: false });

    setStudentSubmissions(data as (HomeworkSubmission & { homework: Homework })[] || []);
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
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600">View and track your students&apos; progress</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {filteredStudents.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try a different search term' : 'Students will appear here once they register'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <Card
                  key={student.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedStudent?.id === student.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => loadStudentSubmissions(student)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-600">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{student.completionRate}%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {student.submissionCount}/{student.totalHomework}
                        </p>
                        <p className="text-xs text-gray-500">Submitted</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        student.completionRate >= 80 ? 'bg-green-500' :
                        student.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <Card className="p-6 sticky top-8">
            {selectedStudent ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-semibold text-blue-600">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h2>
                  <p className="text-gray-500">{selectedStudent.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedStudent.completionRate}%</p>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedStudent.submissionCount}</p>
                    <p className="text-sm text-gray-500">Submissions</p>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-4">Recent Submissions</h3>
                {studentSubmissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No submissions yet</p>
                ) : (
                  <div className="space-y-3">
                    {studentSubmissions.slice(0, 5).map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {sub.homework?.description || 'Homework'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(sub.submitted_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <a
                          href={sub.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a student to view details</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
