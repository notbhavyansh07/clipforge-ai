import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        configured: false,
        authorization_url: null,
        message: 'GOOGLE_CLIENT_ID is not configured.',
      },
      { status: 400 }
    );
  }

  const reqUrl = new URL(request.url);
  const redirectUri = `${reqUrl.origin}/api/v1/youtube/oauth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.json({
    configured: true,
    authorization_url: authUrl,
    redirect_uri: redirectUri,
  });
}
