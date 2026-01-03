// src/app/api/register/phone/send-otp/route.ts
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supaAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OTP_LEN = Number(process.env.OTP_LENGTH || 6);
const OTP_TTL_SEC = Number(process.env.OTP_TTL || 5 * 60); // 5 min
const RESEND_COOLDOWN_SEC = Number(process.env.OTP_RESEND_COOLDOWN || 45);
const PURPOSE = 'register';

const PEPPER = process.env.OTP_PEPPER || '';
const DEBUG_STORE = process.env.DEBUG_STORE_OTP === '1';
const DEBUG_RETURN = process.env.DEBUG_RETURN_OTP === '1';
const DEBUG_SHOW = process.env.DEBUG_SHOW_OTP === '1';

function isE164(phone: string) {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

function randomOtp(len = OTP_LEN) {
  const buf = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += (buf[i] % 10).toString();
  return out;
}

function hashCode(code: string) {
  return crypto.createHash('sha256').update(`${code}${PEPPER}`).digest('hex');
}

export async function POST(req: Request) {
  try {
    const { phone } = (await req.json()) as { phone?: string };

    if (!phone || !isE164(phone)) {
      return NextResponse.json({ error: 'Invalid phone (must be E.164, e.g. +9198...)' }, { status: 400 });
    }

    const db = supaAdmin();

    // 1) cooldown check
    const existing = await db
      .from('otp_codes')
      .select('id,last_sent_at')
      .eq('phone', phone)
      .eq('purpose', PURPOSE)
      .maybeSingle();

    if (existing.error && existing.error.code !== 'PGRST116') {
      throw existing.error;
    }

    if (existing.data?.last_sent_at) {
      const last = new Date(existing.data.last_sent_at).getTime();
      const now = Date.now();
      const diff = Math.floor((now - last) / 1000);
      if (diff < RESEND_COOLDOWN_SEC) {
        return NextResponse.json(
          { error: 'Cooldown', retry_after: RESEND_COOLDOWN_SEC - diff },
          { status: 429 }
        );
      }
    }

    // 2) generate
    const code = randomOtp();
    const code_hash = hashCode(code);
    const expires_at = new Date(Date.now() + OTP_TTL_SEC * 1000).toISOString();

    // 3) upsert
    const upsert = await db
      .from('otp_codes')
      .upsert(
        {
          phone,
          purpose: PURPOSE,
          code_hash,
          expires_at,
          attempts: 0,
          last_sent_at: new Date().toISOString(),
          verified: false,
          verification_token: null,
          verification_expires_at: null,
          debug_code: DEBUG_STORE ? code : null,
        },
        { onConflict: 'phone,purpose', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (upsert.error) throw upsert.error;

    if (DEBUG_SHOW) {
      // eslint-disable-next-line no-console
      console.log(`[OTP] ${phone} → ${code}`);
    }

    return NextResponse.json({ ok: true, ...(DEBUG_RETURN ? { dev_code: code } : {}) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send OTP';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
