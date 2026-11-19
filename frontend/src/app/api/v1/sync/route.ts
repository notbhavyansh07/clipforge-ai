import { NextResponse } from 'next/server';
import { INITIAL_VIDEOS, INITIAL_CLIPS } from '@/lib/seedData';

export async function GET() {
  return NextResponse.json({
    status: 'synced',
    videos: INITIAL_VIDEOS.length,
    clips: INITIAL_CLIPS.length,
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'synced',
    videos: INITIAL_VIDEOS.length,
    clips: INITIAL_CLIPS.length,
  });
}
