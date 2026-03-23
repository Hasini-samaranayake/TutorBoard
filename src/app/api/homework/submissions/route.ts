import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      homeworkId,
      submissionType,
      fileStoragePath,
      fileUrl,
      annotationData,
      sourceResourceId,
    } = body as {
      homeworkId?: string;
      submissionType?: 'file_upload' | 'annotated_resource';
      fileStoragePath?: string | null;
      fileUrl?: string | null;
      annotationData?: string | null;
      sourceResourceId?: string | null;
    };

    if (!homeworkId || !submissionType) {
      return NextResponse.json({ error: 'homeworkId and submissionType are required' }, { status: 400 });
    }

    const payload = {
      homework_id: homeworkId,
      student_id: user.id,
      submission_type: submissionType,
      storage_path: fileStoragePath || null,
      file_url: fileUrl || null,
      annotation_data: annotationData || null,
      source_resource_id: sourceResourceId || null,
      submitted_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('homework_submissions')
      .upsert(payload, { onConflict: 'homework_id,student_id' })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Homework submission upsert error:', error);
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
  }
}
