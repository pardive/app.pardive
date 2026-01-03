import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { supaAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveUserId(): Promise<string | null> {
  const h = await headers();
  const c = await cookies();

  const direct =
    h.get('x-user-id') ??
    c.get('uid')?.value;

  if (direct) return direct;

  const db = supaAdmin();
  const latest = await db
    .from('users')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return latest.data?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'No user' }, { status: 404 });
    }

    const fd = await req.formData();
    const file = fd.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `covers/${userId}-${Date.now()}.${ext}`;

    const db = supaAdmin();

    const upload = await db.storage
      .from('profiles')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 500 });
    }

    const { data } = db.storage
      .from('profiles')
      .getPublicUrl(path);

    const url = data.publicUrl;

    await db
      .from('users')
      .update({ cover_url: url })
      .eq('id', userId);

    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
