import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: resource, error } = await supabase
      .from('homework_resources')
      .select('id, storage_path, mime_type, name')
      .eq('id', id)
      .single();
    if (error || !resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });

    // RLS on homework_resources already validates access for this user.
    const { data: signed, error: signedError } = await supabase.storage
      .from('homework-resources')
      .createSignedUrl(resource.storage_path, 3600);
    if (signedError || !signed?.signedUrl) throw signedError || new Error('Failed to sign URL');

    return NextResponse.json({
      signedUrl: signed.signedUrl,
      mimeType: resource.mime_type,
      name: resource.name,
    });
  } catch (error) {
    console.error('Resource view signed URL error:', error);
    return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
  }
}
