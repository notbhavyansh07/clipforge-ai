import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function GET(request: Request) {
  const hasClient = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasRefreshToken = Boolean(process.env.GOOGLE_REFRESH_TOKEN || getCookie(request, 'clipforge_yt_rt'));

  return NextResponse.json({
    connected: true,
    oauth_configured: hasClient,
    oauth_ready: hasClient && hasRefreshToken,
    channel_title: '@salviashu02',
  });
}
