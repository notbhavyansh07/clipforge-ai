import { NextResponse } from 'next/server';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      url = '',
      has_permission = true,
      creator_name,
      creator_url,
      is_live = false,
    } = body;

    const ytId = extractYouTubeId(url);
    let title = url.toLowerCase().includes('gta')
      ? 'GTA VI Livestream Ingest'
      : 'Imported Viral Stream';
    let resolvedCreator = creator_name || 'Creator';

    if (ytId) {
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`,
          { signal: AbortSignal.timeout(3500) }
        );
        if (oembedRes.ok) {
          const info = await oembedRes.json();
          if (info.title) title = info.title;
          if (!creator_name && info.author_name) resolvedCreator = info.author_name;
        }
      } catch {}
    }

    const newVideo = {
      id: `vid-${Date.now()}`,
      title,
      source_type: ytId ? 'youtube' : 'url',
      source_url: url,
      duration: 180,
      fps: 60,
      width: 1920,
      height: 1080,
      has_permission: Boolean(has_permission),
      creator_name: resolvedCreator,
      creator_url: creator_url || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : url),
      status: 'ready',
      is_live: Boolean(is_live),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(newVideo);
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Failed to ingest URL' },
      { status: 500 }
    );
  }
}
