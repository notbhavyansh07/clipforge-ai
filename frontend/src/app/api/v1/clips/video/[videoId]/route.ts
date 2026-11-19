import { NextResponse } from 'next/server';
import { INITIAL_CLIPS } from '@/lib/seedData';

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  const clips = INITIAL_CLIPS.filter((c) => c.video_id === params.videoId);
  return NextResponse.json(clips, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
