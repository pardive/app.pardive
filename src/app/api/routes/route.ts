import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();

  const route = {
    id: `route_${Date.now()}`,
    name: body.name || 'Untitled Route',
    description: body.description || '',
    repeat: body.repeat ?? false,
    status: 'draft',
  };

  return NextResponse.json(route);
}
