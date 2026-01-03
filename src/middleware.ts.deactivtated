import { NextRequest, NextResponse } from 'next/server';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'saltifysaas.com';

function getSubdomain(host: string) {
  // dev hosts like use-ram.localhost:3000 and nip.io are supported
  const [hostname] = host.split(':');
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.');
    return parts.length > 2 ? parts[0] : null; // use-ram.localhost
  }
  if (hostname.endsWith('.nip.io')) {
    const parts = hostname.split('.');
    return parts.length > 4 ? parts[0] : null; // use-ram.127.0.0.1.nip.io
  }
  if (hostname.endsWith(`.${APP_DOMAIN}`)) {
    return hostname.replace(`.${APP_DOMAIN}`, '').split('.').at(0) || null;
  }
  return null;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const sub = getSubdomain(host);
  const res = NextResponse.next();
  if (sub && sub !== 'www') res.headers.set('x-workspace-sub', sub);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
