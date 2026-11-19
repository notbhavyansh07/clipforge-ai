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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const clipIndex = INITIAL_CLIPS.findIndex((c) => c.id === params.id);
    if (clipIndex === -1) {
      return NextResponse.json({ detail: 'Clip not found' }, { status: 404 });
    }
    const updated = {
      ...INITIAL_CLIPS[clipIndex],
      ...body,
    };
    INITIAL_CLIPS[clipIndex] = updated;
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ detail: 'Invalid request' }, { status: 400 });
  }
}
