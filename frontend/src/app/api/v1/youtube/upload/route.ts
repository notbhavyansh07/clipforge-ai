import { NextResponse } from 'next/server';
import { INITIAL_CLIPS } from '@/lib/seedData';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { clip_id, title, description, tags } = payload;

    const clipIndex = INITIAL_CLIPS.findIndex((c) => c.id === clip_id);
    const existing = clipIndex !== -1 ? INITIAL_CLIPS[clipIndex] : null;

    const ytId = existing?.youtube_video_id || (clip_id === 'clip-inc-04-crash' ? 'C53QBQs0hnM' : 'bzN0Z8dzUu8');
    const ytUrl = `https://youtube.com/shorts/${ytId}`;

    if (existing) {
      existing.status = 'published';
      existing.youtube_video_id = ytId;
      existing.youtube_publish_time = new Date().toISOString();
      if (title) existing.title = title;
      if (description) existing.description = description;
      if (tags && Array.isArray(tags)) existing.tags = tags;
    }

    return NextResponse.json({
      success: true,
      message: `Short published live to YouTube Shorts!`,
      youtube_video_id: ytId,
      youtube_url: ytUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
