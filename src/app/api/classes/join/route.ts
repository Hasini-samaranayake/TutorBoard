import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can join classes' }, { status: 403 });
    }

    const body = await request.json();
    const { joinCode } = body;

    if (!joinCode || typeof joinCode !== 'string' || joinCode.trim().length === 0) {
      return NextResponse.json({ error: 'Join code is required' }, { status: 400 });
    }

    const normalizedCode = joinCode.trim().toUpperCase();

    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('join_code', normalizedCode)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'Invalid class code. Please check and try again.' }, { status: 404 });
    }

    const { data: existingEnrollment } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', classData.id)
      .eq('student_id', user.id)
      .single();

    if (existingEnrollment) {
      return NextResponse.json({ 
        message: 'Already enrolled',
        classId: classData.id,
        className: classData.name,
      });
    }

    const { error: enrollError } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: classData.id,
        student_id: user.id,
      });

    if (enrollError) throw enrollError;

    return NextResponse.json({ 
      message: 'Successfully joined class',
      classId: classData.id,
      className: classData.name,
    }, { status: 201 });
  } catch (error) {
    console.error('Error joining class:', error);
    return NextResponse.json({ error: 'Failed to join class' }, { status: 500 });
  }
}
