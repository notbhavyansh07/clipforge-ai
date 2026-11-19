import { NextResponse } from 'next/server';
import { INITIAL_VIDEOS } from '@/lib/seedData';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const video = INITIAL_VIDEOS.find((v) => v.id === params.id);
  if (!video) {
    return NextResponse.json({ detail: 'Video not found' }, { status: 404 });
  }
  return NextResponse.json(video, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
