import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: submission, error } = await supabase
      .from('homework_submissions')
      .select('id, storage_path, file_url, submission_type, annotation_data, source_resource_id')
      .eq('id', id)
      .single();
    if (error || !submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    if (!submission.storage_path) {
      return NextResponse.json({
        signedUrl: null,
        submissionType: submission.submission_type,
        annotationData: submission.annotation_data,
        sourceResourceId: submission.source_resource_id,
      });
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from('homework-submissions')
      .createSignedUrl(submission.storage_path, 60);
    if (signedError || !signed?.signedUrl) throw signedError || new Error('Failed to sign URL');

    return NextResponse.json({
      signedUrl: signed.signedUrl,
      submissionType: submission.submission_type,
      annotationData: submission.annotation_data,
      sourceResourceId: submission.source_resource_id,
    });
  } catch (error) {
    console.error('Submission view signed URL error:', error);
    return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
  }
}
