import { NextResponse } from 'next/server';
import { INITIAL_CLIPS } from '@/lib/seedData';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clip = INITIAL_CLIPS.find((c) => c.id === params.id);
  if (!clip) {
    return NextResponse.json({ detail: 'Clip not found' }, { status: 404 });
  }
  return NextResponse.json(clip, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
