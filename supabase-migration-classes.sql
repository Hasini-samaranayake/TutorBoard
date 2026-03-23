-- Migration: Add Classes System
-- Run this in your Supabase SQL Editor if you already have the existing schema

-- 1. Create new tables
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- 2. Add class_id to lessons table
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

-- 3. Enable RLS on new tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies that need updating
DROP POLICY IF EXISTS "Teachers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Students can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Students can view homework" ON public.homework;
DROP POLICY IF EXISTS "Teachers can view all submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "Students can view resources" ON public.resources;

-- 5. Create new policies for classes
CREATE POLICY "Teachers can manage their classes" ON public.classes
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view classes they are enrolled in" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments 
      WHERE class_id = id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view class by join code" ON public.classes
  FOR SELECT USING (true);

-- 6. Create policies for class enrollments
CREATE POLICY "Students can manage their enrollments" ON public.class_enrollments
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments for their classes" ON public.class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE id = class_id AND teacher_id = auth.uid()
    )
  );

-- 7. Create updated policies for existing tables
CREATE POLICY "Teachers can view students in their classes" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.class_enrollments ce ON ce.class_id = c.id
      WHERE c.teacher_id = auth.uid() AND ce.student_id = profiles.id
    )
  );

CREATE POLICY "Students can view lessons from enrolled classes" ON public.lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments 
      WHERE class_id = lessons.class_id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Students can view homework from enrolled classes" ON public.homework
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.class_enrollments ce ON ce.class_id = l.class_id
      WHERE l.id = lesson_id AND ce.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view submissions for their classes" ON public.homework_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.homework h
      JOIN public.lessons l ON l.id = h.lesson_id
      WHERE h.id = homework_id AND l.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view resources from enrolled teachers" ON public.resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.class_enrollments ce ON ce.class_id = c.id
      WHERE c.teacher_id = resources.teacher_id AND ce.student_id = auth.uid()
    )
  );

-- 8. Function to generate unique join codes
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
