// src/app/api/register/phone/verify-otp/route.ts
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supaAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PURPOSE = 'register';
const PEPPER = process.env.OTP_PEPPER || '';
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const VERIFY_TOKEN_TTL_MIN = Number(process.env.VERIFY_TOKEN_TTL_MIN || 15);

type OtpRow = {
  id: string;
  code_hash: string;
  expires_at: string | null;
  attempts: number | null;
  verified: boolean | null;
};

const isE164 = (p: string) => /^\+[1-9]\d{6,14}$/.test(p);
const hash = (c: string) => crypto.createHash('sha256').update(c + PEPPER).digest('hex');
const newToken = () => crypto.randomBytes(32).toString('base64url');

export async function POST(req: Request) {
  try {
    const { phone, code } = (await req.json()) as { phone?: string; code?: string };
    if (!phone || !isE164(phone)) return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
    if (!code || !/^\d{4,8}$/.test(code)) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

    const db = supaAdmin();

    const q = await db
      .from('otp_codes')
      .select('id, code_hash, expires_at, attempts, verified')
      .eq('phone', phone)
      .eq('purpose', PURPOSE)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!q.data) return NextResponse.json({ error: 'No OTP issued' }, { status: 400 });
    const r = q.data as OtpRow;

    if (r.verified) return NextResponse.json({ error: 'Already verified' }, { status: 400 });
    if ((r.attempts ?? 0) >= MAX_ATTEMPTS) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });

    const now = Date.now();
    const exp = r.expires_at ? new Date(r.expires_at).getTime() : 0;
    if (!exp || now > exp) {
      await db.from('otp_codes').update({ attempts: (r.attempts ?? 0) + 1 }).eq('id', r.id);
      return NextResponse.json({ error: 'Code expired' }, { status: 400 });
    }

    if (hash(code) !== r.code_hash) {
      await db.from('otp_codes').update({ attempts: (r.attempts ?? 0) + 1 }).eq('id', r.id);
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const verification_token = newToken();
    const verification_expires_at = new Date(now + VERIFY_TOKEN_TTL_MIN * 60_000).toISOString();

    const upd = await db
      .from('otp_codes')
      .update({ verified: true, attempts: 0, debug_code: null, verification_token, verification_expires_at })
      .eq('id', r.id)
      .select('id')
      .single();

    if (upd.error) throw upd.error;

    return NextResponse.json({ ok: true, verification_token, expires_at: verification_expires_at });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Verification failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
