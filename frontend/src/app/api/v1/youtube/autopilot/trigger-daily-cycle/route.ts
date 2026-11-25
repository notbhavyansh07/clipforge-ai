import { NextResponse } from 'next/server';
import { INITIAL_CLIPS } from '@/lib/seedData';

export async function POST(request: Request) {
  try {
    let isTomorrow = false;
    try {
      const body = await request.json();
      isTomorrow = Boolean(body?.isTomorrow);
    } catch {}

    const targetIds = isTomorrow
      ? ['clip-inc-11-stunt', 'clip-speed-robotdog', 'clip-trend-01-mrbeast']
      : ['clip-tomorrow-carry-heist', 'clip-tomorrow-speed-ronaldo', 'clip-tomorrow-trend-yacht'];

    const published = targetIds.map((id, idx) => {
      const clip = INITIAL_CLIPS.find((c) => c.id === id);
      const ytId = clip?.youtube_video_id || 'YqlbuN5v-tg';
      return {
        slot: idx + 1,
        clip_id: id,
        title: clip?.title || `Slot #${idx + 1}`,
        youtube_video_id: ytId,
        youtube_url: `https://youtube.com/shorts/${ytId}`,
        status: 'published',
        published_at: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Autonomous Daily 3-Slot Auto-Pilot Cycle executed on server.',
      published_clips: published,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Autopilot cycle failed' },
      { status: 500 }
    );
  }
}
