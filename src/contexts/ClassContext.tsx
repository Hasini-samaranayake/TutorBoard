'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface ClassData {
  id: string;
  name: string;
  join_code: string;
  teacher_id: string;
}

interface ClassContextType {
  currentClass: ClassData | null;
  classId: string | null;
  isLoading: boolean;
}

const ClassContext = createContext<ClassContextType>({
  currentClass: null,
  classId: null,
  isLoading: true,
});

export function ClassProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentClass, setCurrentClass] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const classId = searchParams.get('class');

  useEffect(() => {
    async function loadClass() {
      if (!classId) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (error || !data) {
        router.push('/classes');
        return;
      }

      setCurrentClass(data);
      setIsLoading(false);
    }

    loadClass();
  }, [classId, router]);

  return (
    <ClassContext.Provider value={{ currentClass, classId, isLoading }}>
      {children}
    </ClassContext.Provider>
  );
}

export function useClass() {
  return useContext(ClassContext);
}
