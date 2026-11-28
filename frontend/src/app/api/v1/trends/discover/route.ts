import { NextResponse } from 'next/server';

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
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return res.ok && data.access_token ? data.access_token : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const region = url.searchParams.get('region') || 'IN';
    const categoryId = url.searchParams.get('category') || '20'; // 20 = Gaming
    const token = await getAccessToken();

    if (token) {
      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${encodeURIComponent(
          region
        )}&videoCategoryId=${encodeURIComponent(categoryId)}&maxResults=8`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(6000),
        }
      );

      if (ytRes.ok) {
        const ytData = await ytRes.json();
        const videos = (ytData?.items || []).map((item: any) => ({
          youtube_id: item.id,
          url: `https://www.youtube.com/watch?v=${item.id}`,
          title: item.snippet?.title || 'Trending Video',
          channel: item.snippet?.channelTitle || 'Creator',
          thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
          views: Number(item.statistics?.viewCount || 0),
          likes: Number(item.statistics?.likeCount || 0),
          published_at: item.snippet?.publishedAt,
        }));

        if (videos.length > 0) {
          return NextResponse.json({
            success: true,
            source: 'youtube_trending_api',
            region,
            count: videos.length,
            videos,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      source: 'curated_viral_radar',
      region,
      count: 3,
      videos: [
        {
          youtube_id: 'irNhWMG560k',
          url: 'https://www.youtube.com/live/irNhWMG560k',
          title: 'CARRYMINATI PLAYS GTA VI | NO PROMOTIONS',
          channel: 'CarryisLive',
          views: 2400000,
        },
        {
          youtube_id: 'RdeN9Faocwc',
          url: 'https://www.youtube.com/watch?v=RdeN9Faocwc',
          title: 'IShowSpeed: Brutal GTA Car Crash & Rage',
          channel: 'IShowSpeed',
          views: 3100000,
        },
        {
          youtube_id: '0e3GPea1Tyg',
          url: 'https://www.youtube.com/watch?v=0e3GPea1Tyg',
          title: 'MrBeast - $456,000 Squid Game In Real Life!',
          channel: 'MrBeast',
          views: 650000000,
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Viral discovery failed' },
      { status: 500 }
    );
  }
}
