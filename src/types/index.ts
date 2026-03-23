export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Lesson {
  id: string;
  teacher_id: string;
  class_id: string | null;
  title: string;
  lesson_date: string;
  canvas_data: string | null;
  template: string;
  created_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
}

export interface Homework {
  id: string;
  lesson_id: string;
  description: string;
  due_date: string;
  created_at: string;
  lesson?: Lesson;
  resources?: HomeworkResource[];
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  file_url: string | null;
  storage_path?: string | null;
  submission_type?: 'file_upload' | 'annotated_resource';
  annotation_data?: string | null;
  source_resource_id?: string | null;
  submitted_at: string;
  student?: User;
  homework?: Homework;
}

export interface HomeworkResource {
  id: string;
  homework_id: string;
  teacher_id: string;
  name: string;
  mime_type: string;
  storage_path: string;
  page_count: number;
  created_at: string;
}

export interface Annotation {
  id: string;
  lesson_id: string;
  student_id: string;
  annotation_data: string;
}

export interface Resource {
  id: string;
  teacher_id: string;
  name: string;
  file_url: string;
  type: 'image' | 'pdf';
  created_at: string;
}

export interface CanvasObject {
  type: string;
  version: string;
  objects: fabric.Object[];
  background?: string;
}

export type WhiteboardTool = 
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'text'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'equation';

export type WhiteboardTemplate = 
  | 'blank'
  | 'graph'
  | 'lined'
  | 'coordinate';

export interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  totalTime: number;
  breakInterval: number;
  breakDuration: number;
}

export interface WhiteboardPage {
  id: string;
  canvasData: string;
}

export interface WhiteboardData {
  pages: WhiteboardPage[];
  currentPageIndex: number;
}
