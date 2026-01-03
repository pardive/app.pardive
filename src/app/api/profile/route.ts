import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { supaAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveUserId(req: Request): Promise<string | null> {
  const url = new URL(req.url);

  // 1️⃣ query param (highest priority)
  const q = url.searchParams.get('userId');
  if (q) return q;

  // 2️⃣ headers / cookies (Next 16 = async)
  const h = await headers();
  const c = await cookies();

  const hdr = h.get('x-user-id');
  if (hdr) return hdr;

  const ck = c.get('uid')?.value;
  if (ck) return ck;

  // 3️⃣ fallback (dev only)
  const db = supaAdmin();
  const latest = await db
    .from('users')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return latest.data?.id ?? null;
}

export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'No user' }, { status: 404 });
    }

    const db = supaAdmin();
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
