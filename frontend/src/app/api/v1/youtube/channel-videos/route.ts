import { NextResponse } from 'next/server';
import { getRecentChannelVideos, normalizeVideoTitle } from '@/lib/youtubeDedup';

export const dynamic = 'force-dynamic';

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    return res.ok && data.access_token ? data.access_token : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ success: false, videos: [], normalized_titles: [] });
    }
    const videos = await getRecentChannelVideos(token);
    const normalized_titles = videos.map((v) => normalizeVideoTitle(v.title));
    return NextResponse.json({
      success: true,
      count: videos.length,
      videos,
      normalized_titles,
    });
  } catch {
    return NextResponse.json({ success: false, videos: [], normalized_titles: [] });
  }
}
