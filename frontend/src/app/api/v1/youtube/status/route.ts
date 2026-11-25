import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasClient = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasRefreshToken = Boolean(process.env.GOOGLE_REFRESH_TOKEN);

  return NextResponse.json({
    connected: true,
    oauth_configured: hasClient,
    oauth_ready: hasClient && hasRefreshToken,
    channel_title: '@salviashu02',
  });
}
