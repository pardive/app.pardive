import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json(null, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.json(null, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      user_id,
      first_name,
      last_name,
      job_title,
      phone,
      timezone,
      address_line,
      country,
      zip,
      avatar_url,
      cover_url
    `)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return NextResponse.json(null, { status: 500 });
  }

  return NextResponse.json({
    id: user.id,        // auth uid
    email: user.email,  // from auth
    ...data,            // from profiles table
  });
}
