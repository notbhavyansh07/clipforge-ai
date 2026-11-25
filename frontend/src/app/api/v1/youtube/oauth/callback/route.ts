import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function upsertEnvVar(filePath: string, key: string, value: string) {
  try {
    let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
    const lineRegex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}="${value}"`;
    if (lineRegex.test(content)) {
      content = content.replace(lineRegex, newLine);
    } else {
      if (content.length > 0 && !content.endsWith('\n')) content += '\n';
      content += `${newLine}\n`;
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (err) {
    console.error(`[OAuth] Failed to update ${filePath}:`, err);
  }
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || reqUrl.host;
  const forwardedProto = request.headers.get('x-forwarded-proto') || (forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1') ? 'http' : 'https');
  const publicOrigin = `${forwardedProto}://${forwardedHost}`;

  const code = reqUrl.searchParams.get('code');
  const error = reqUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${publicOrigin}/autopilot?oauth=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${publicOrigin}/api/v1/youtube/oauth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth client credentials missing' }, { status: 500 });
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(
        `${publicOrigin}/autopilot?oauth=error&reason=${encodeURIComponent(tokenData.error_description || tokenData.error || 'Token exchange failed')}`
      );
    }

    const refreshToken = tokenData.refresh_token;
    if (refreshToken) {
      process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
      // Persist in frontend/.env.local and root .env
      const frontendEnvPath = path.join(process.cwd(), '.env.local');
      const rootEnvPath = path.join(process.cwd(), '..', '.env');
      upsertEnvVar(frontendEnvPath, 'GOOGLE_REFRESH_TOKEN', refreshToken);
      if (fs.existsSync(rootEnvPath)) {
        upsertEnvVar(rootEnvPath, 'GOOGLE_REFRESH_TOKEN', refreshToken);
      }
    }

    // Fetch authorized YouTube channel name
    let channelTitle = '@salviashu02';
    try {
      const chanRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const chanData = await chanRes.json();
      const item = chanData?.items?.[0];
      if (item?.snippet?.customUrl) {
        channelTitle = item.snippet.customUrl;
      } else if (item?.snippet?.title) {
        channelTitle = item.snippet.title;
      }
    } catch {}

    const response = NextResponse.redirect(
      `${publicOrigin}/autopilot?oauth=success&channel=${encodeURIComponent(channelTitle)}`
    );
    if (refreshToken) {
      response.cookies.set('clipforge_yt_rt', refreshToken, {
        httpOnly: true,
        secure: forwardedProto === 'https',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  } catch (err: any) {
    return NextResponse.redirect(
      `${publicOrigin}/autopilot?oauth=error&reason=${encodeURIComponent(err.message || 'OAuth callback failed')}`
    );
  }
}
