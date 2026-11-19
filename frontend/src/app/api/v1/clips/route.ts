import { NextResponse } from 'next/server';
import { INITIAL_CLIPS } from '@/lib/seedData';

export async function GET() {
  return NextResponse.json(INITIAL_CLIPS, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(body, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
