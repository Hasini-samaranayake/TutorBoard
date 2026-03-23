-- Supabase Database Schema for Tutoring Whiteboard App
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table (for multi-tutor support)
CREATE TABLE public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class enrollments table (students joining classes)
CREATE TABLE public.class_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_date DATE NOT NULL,
  canvas_data JSONB,
  template TEXT DEFAULT 'blank',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homework table
CREATE TABLE public.homework (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homework submissions table
CREATE TABLE public.homework_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(homework_id, student_id)
);

-- Annotations table (student notes on lessons)
CREATE TABLE public.annotations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  annotation_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id, student_id)
);

-- Resources table (teacher uploads)
CREATE TABLE public.resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'pdf')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Teachers can view students in their classes" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.class_enrollments ce ON ce.class_id = c.id
      WHERE c.teacher_id = auth.uid() AND ce.student_id = profiles.id
    )
  );

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Classes policies
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

-- Class enrollments policies
CREATE POLICY "Students can manage their enrollments" ON public.class_enrollments
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments for their classes" ON public.class_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE id = class_id AND teacher_id = auth.uid()
    )
  );

-- Lessons policies
CREATE POLICY "Teachers can manage their lessons" ON public.lessons
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view lessons from enrolled classes" ON public.lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments 
      WHERE class_id = lessons.class_id AND student_id = auth.uid()
    )
  );

-- Homework policies
CREATE POLICY "Teachers can manage homework" ON public.homework
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.lessons WHERE id = lesson_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Students can view homework from enrolled classes" ON public.homework
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.class_enrollments ce ON ce.class_id = l.class_id
      WHERE l.id = lesson_id AND ce.student_id = auth.uid()
    )
  );

-- Homework submissions policies
CREATE POLICY "Students can manage their submissions" ON public.homework_submissions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their classes" ON public.homework_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.homework h
      JOIN public.lessons l ON l.id = h.lesson_id
      WHERE h.id = homework_id AND l.teacher_id = auth.uid()
    )
  );

-- Annotations policies
CREATE POLICY "Students can manage their annotations" ON public.annotations
  FOR ALL USING (student_id = auth.uid());

-- Resources policies
CREATE POLICY "Teachers can manage their resources" ON public.resources
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view resources from enrolled teachers" ON public.resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.class_enrollments ce ON ce.class_id = c.id
      WHERE c.teacher_id = resources.teacher_id AND ce.student_id = auth.uid()
    )
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('homework-submissions', 'homework-submissions', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

-- Storage policies
CREATE POLICY "Students can upload homework" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'homework-submissions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view homework submissions" ON storage.objects
  FOR SELECT USING (bucket_id = 'homework-submissions');

CREATE POLICY "Teachers can upload resources" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resources' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Anyone can view resources" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique join codes
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
