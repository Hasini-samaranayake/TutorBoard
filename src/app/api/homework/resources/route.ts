import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

async function isTeacherForHomework(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string, homeworkId: string) {
  const { data: homework } = await supabase
    .from('homework')
    .select('lesson_id')
    .eq('id', homeworkId)
    .single();
  if (!homework) return false;

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('id', homework.lesson_id)
    .eq('teacher_id', userId)
    .single();

  return !!lesson;
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const homeworkId = searchParams.get('homeworkId');
    if (!homeworkId) return NextResponse.json({ error: 'homeworkId is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('homework_resources')
      .select('*')
      .eq('homework_id', homeworkId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('GET homework resources error:', error);
    return NextResponse.json({ error: 'Failed to fetch homework resources' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const homeworkId = formData.get('homeworkId')?.toString();
    const pageCount = Number(formData.get('pageCount')?.toString() || '1');
    const file = formData.get('file');

    if (!homeworkId || !file || !(file instanceof File)) {
      return NextResponse.json({ error: 'homeworkId and file are required' }, { status: 400 });
    }

    const allowed = await isTeacherForHomework(supabase, user.id, homeworkId);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const safeName = file.name.replace(/\s+/g, '-');
    const storagePath = `${user.id}/${homeworkId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('homework-resources')
      .upload(storagePath, file, { upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('homework_resources')
      .insert({
        homework_id: homeworkId,
        teacher_id: user.id,
        name: file.name,
        mime_type: file.type || 'application/octet-stream',
        storage_path: storagePath,
        page_count: Number.isFinite(pageCount) && pageCount > 0 ? pageCount : 1,
      })
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST homework resource error:', error);
    return NextResponse.json({ error: 'Failed to upload homework resource' }, { status: 500 });
  }
}
