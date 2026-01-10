import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    // 1. Check the Project URL
    supabaseUrl: {
      value: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING",
      isValidFormat: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://'),
      isIncorrectPostgresFormat: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('postgresql://')
    },
    
    // 2. Check the Service Role Key
    serviceRoleKey: {
      found: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      preview: process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...` 
        : "MISSING",
      // This checks if the "NEXT_PUBLIC_APP_DOMAIN" string accidentally got pasted into the key
      hasConcatenationError: process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('NEXT_PUBLIC_APP_DOMAIN')
    },

    // 3. Check the App Domain
    appDomain: {
      value: process.env.NEXT_PUBLIC_APP_DOMAIN || "MISSING"
    }
  });
}