// src/app/api/register/phone/provision/route.ts
import { NextResponse } from 'next/server';
import { supaAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  verification_token: string;
  company: string;
  subdomain: string;
  password: string;
  email?: string | null;
  phone?: string | null;
};

const OWNER_ROLE = 'owner';

export async function POST(req: Request) {
  try {
    const { verification_token, company, subdomain, password } = (await req.json()) as Body;
    if (!verification_token || !company || !subdomain || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = supaAdmin();

    // 1) validate token
    const { data: otpRow, error: otpErr } = await db
      .from('otp_codes')
      .select('id, phone, verified, verification_expires_at')
      .eq('verification_token', verification_token)
      .single();

    if (otpErr || !otpRow) return NextResponse.json({ error: 'Invalid or used verification token' }, { status: 400 });
    if (!otpRow.verified) return NextResponse.json({ error: 'Token not verified yet' }, { status: 400 });
    if (new Date(otpRow.verification_expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Verification token expired' }, { status: 400 });
    }
    const phone = otpRow.phone as string;

    // 2) ensure user
    const password_hash = await bcrypt.hash(password, 10);
    let userId: string;

    const { data: existingUser, error: findErr } = await db
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });

    if (existingUser) {
      userId = existingUser.id;
      // Optionally update password_hash if you want
    } else {
      const newId = crypto.randomUUID();
      const { data: created, error: createErr } = await db
        .from('users')
        .insert({
          id: newId,
          phone,
          password_hash,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (createErr) return NextResponse.json({ error: `Create user failed: ${createErr.message}` }, { status: 400 });
      userId = created!.id;
    }

    // 3) workspace
    const { data: ws, error: wsErr } = await db
      .from('workspaces')
      .insert({
        name: company,
        subdomain,
        created_by: userId,
        created_at: new Date().toISOString(),
      })
      .select('id, subdomain')
      .single();
    if (wsErr) return NextResponse.json({ error: `Create workspace failed: ${wsErr.message}` }, { status: 400 });

    // 4) membership
    const { error: memErr } = await db
      .from('workspace_members')
      .insert({
        workspace_id: ws.id,
        user_id: userId,
        role: OWNER_ROLE,
        created_at: new Date().toISOString(),
      });
    if (memErr) return NextResponse.json({ error: `Create membership failed: ${memErr.message}` }, { status: 400 });

    // 5) consume token
    await db.from('otp_codes').update({ verification_token: null }).eq('id', otpRow.id);

    const workspace_url = `https://${ws.subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN || 'saltifysaas.com'}`;
    return NextResponse.json({ ok: true, workspace_url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Provision failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
