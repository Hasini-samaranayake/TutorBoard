'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Plus, 
  Users, 
  BookOpen, 
  Copy, 
  Check,
  LogIn,
  GraduationCap
} from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  teacher_id: string;
  teacher?: {
    name: string;
  };
  _count?: {
    students: number;
    lessons: number;
  };
}

interface Profile {
  id: string;
  role: 'teacher' | 'student';
  name: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      router.push('/auth/login');
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    if (!profileData) {
      console.error('No profile found for user:', user.id);
      setIsLoading(false);
      return;
    }

    setProfile(profileData as Profile);

    if (profileData.role === 'teacher') {
      const { data: teacherClasses } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (teacherClasses) {
        const classesWithCounts = await Promise.all(
          teacherClasses.map(async (cls) => {
            const [{ count: studentCount }, { count: lessonCount }] = await Promise.all([
              supabase
                .from('class_enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', cls.id),
              supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', cls.id),
            ]);
            return {
              ...cls,
              _count: {
                students: studentCount || 0,
                lessons: lessonCount || 0,
              },
            };
          })
        );
        setClasses(classesWithCounts);
      }
    } else {
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('student_id', user.id);

      if (enrollments && enrollments.length > 0) {
        const classIds = enrollments.map(e => e.class_id);
        const { data: studentClasses } = await supabase
          .from('classes')
          .select('*, teacher:profiles!teacher_id(name)')
          .in('id', classIds)
          .order('created_at', { ascending: false });

        if (studentClasses) {
          setClasses(studentClasses as ClassData[]);
        }
      }
    }

    setIsLoading(false);
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setIsCreating(true);
    
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create class');
      }

      const newClass = await response.json();
      router.push(`/dashboard?class=${newClass.id}`);
    } catch (error) {
      console.error('Error creating class:', error);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinClass(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setJoinError('');

    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join class');
      }

      router.push(`/student?class=${data.classId}`);
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Failed to join class');
    } finally {
      setIsJoining(false);
    }
  }

  function copyJoinCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function openClass(classId: string) {
    if (profile?.role === 'teacher') {
      router.push(`/dashboard?class=${classId}`);
    } else {
      router.push(`/student?class=${classId}`);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            Your profile could not be loaded. This might happen if your account was just created.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile?.role === 'teacher' ? 'Your Classes' : 'My Classes'}
          </h1>
          <p className="text-gray-600 mt-2">
            {profile?.role === 'teacher' 
              ? 'Create and manage your tutoring classes'
              : 'Join a class or open an existing one'}
          </p>
        </div>

        {profile?.role === 'teacher' ? (
          <TeacherView
            classes={classes}
            showCreateModal={showCreateModal}
            setShowCreateModal={setShowCreateModal}
            newClassName={newClassName}
            setNewClassName={setNewClassName}
            isCreating={isCreating}
            handleCreateClass={handleCreateClass}
            copyJoinCode={copyJoinCode}
            copiedCode={copiedCode}
            openClass={openClass}
          />
        ) : (
          <StudentView
            classes={classes}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            isJoining={isJoining}
            joinError={joinError}
            handleJoinClass={handleJoinClass}
            openClass={openClass}
          />
        )}
      </div>
    </div>
  );
}

function TeacherView({
  classes,
  showCreateModal,
  setShowCreateModal,
  newClassName,
  setNewClassName,
  isCreating,
  handleCreateClass,
  copyJoinCode,
  copiedCode,
  openClass,
}: {
  classes: ClassData[];
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  newClassName: string;
  setNewClassName: (name: string) => void;
  isCreating: boolean;
  handleCreateClass: (e: React.FormEvent) => void;
  copyJoinCode: (code: string) => void;
  copiedCode: string | null;
  openClass: (id: string) => void;
}) {
  return (
    <>
      <div className="flex justify-center mb-8">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Create New Class
        </Button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Class</h2>
            <form onSubmit={handleCreateClass}>
              <Input
                id="className"
                label="Class Name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g., Math Grade 10, Physics A-Level"
                required
              />
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewClassName('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" isLoading={isCreating}>
                  Create Class
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {classes.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first class to start organizing your students and lessons.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Class
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openClass(cls.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {cls._count?.students || 0} students
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {cls._count?.lessons || 0} lessons
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Join Code</p>
                  <p className="font-mono text-lg font-bold text-blue-600">{cls.join_code}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyJoinCode(cls.join_code);
                  }}
                >
                  {copiedCode === cls.join_code ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function StudentView({
  classes,
  joinCode,
  setJoinCode,
  isJoining,
  joinError,
  handleJoinClass,
  openClass,
}: {
  classes: ClassData[];
  joinCode: string;
  setJoinCode: (code: string) => void;
  isJoining: boolean;
  joinError: string;
  handleJoinClass: (e: React.FormEvent) => void;
  openClass: (id: string) => void;
}) {
  return (
    <>
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Join a Class</h2>
        <form onSubmit={handleJoinClass} className="flex gap-3">
          <div className="flex-1">
            <Input
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter class code (e.g., ABC123)"
              maxLength={6}
              className="font-mono text-lg tracking-wider uppercase"
              error={joinError}
            />
          </div>
          <Button type="submit" isLoading={isJoining}>
            <LogIn className="w-5 h-5 mr-2" />
            Join
          </Button>
        </form>
        <p className="text-sm text-gray-500 mt-3">
          Ask your tutor for the class code to join their class.
        </p>
      </Card>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">My Classes</h2>
      
      {classes.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes joined yet</h3>
          <p className="text-gray-500">
            Enter a class code above to join your tutor&apos;s class.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openClass(cls.id)}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{cls.name}</h3>
              <p className="text-sm text-gray-500">
                Tutor: {cls.teacher?.name || 'Unknown'}
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
