import { NextResponse } from 'next/server';
import { INITIAL_VIDEOS } from '@/lib/seedData';

export async function GET() {
  return NextResponse.json(INITIAL_VIDEOS, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
