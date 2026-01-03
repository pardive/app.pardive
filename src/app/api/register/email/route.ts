import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN!;

export async function POST(req: Request) {
  try {
    const { email, password, company, subdomain } = await req.json();

    if (!email || !password || !company || !subdomain) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const slug = String(subdomain).toLowerCase();

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    /* -----------------------------------------------------
       1. Create Auth User
    ----------------------------------------------------- */
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // set true if you want auto-verify
      });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
      throw authError;
    }

    const userId = authData.user.id;

    /* -----------------------------------------------------
       2. Create Org
    ----------------------------------------------------- */
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .insert({
        name: company,
        slug,
      })
      .select()
      .single();

    if (orgError) {
      // rollback auth user if org creation fails
      await supabase.auth.admin.deleteUser(userId);

      if (orgError.code === '23505') {
        return NextResponse.json(
          { error: 'Subdomain already taken' },
          { status: 409 }
        );
      }
      throw orgError;
    }

    /* -----------------------------------------------------
       3. Create org_users (ADMIN)
    ----------------------------------------------------- */
    const { error: linkError } = await supabase
      .from('org_users')
      .insert({
        org_id: org.id,
        user_id: userId,
        role: 'admin',
      });

    if (linkError) {
      throw linkError;
    }

    /* -----------------------------------------------------
       4. Success
    ----------------------------------------------------- */
    return NextResponse.json({
      status: 'ok',
      workspace_url: `https://${slug}.${APP_DOMAIN}`,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: 'Use POST' }, { status: 405 });
}
