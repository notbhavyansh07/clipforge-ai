import { NextResponse } from 'next/server';
import http from 'http';
import fs from 'fs';
import path from 'path';

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/v1/youtube/oauth/callback';

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

let oauthBridgeStarted = false;

function ensurePort8000OAuthBridge(frontendOrigin: string) {
  if (oauthBridgeStarted) return;
  try {
    const server = http.createServer(async (req, res) => {
      const reqUrl = new URL(req.url || '/', 'http://localhost:8000');
      if (reqUrl.pathname === '/api/v1/youtube/oauth/callback') {
        const code = reqUrl.searchParams.get('code');
        const error = reqUrl.searchParams.get('error');

        if (error) {
          res.writeHead(302, {
            Location: `${frontendOrigin}/autopilot?oauth=error&reason=${encodeURIComponent(error)}`,
          });
          res.end();
          return;
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing authorization code');
          return;
        }

        const clientId = process.env.GOOGLE_CLIENT_ID || '';
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

        try {
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: REDIRECT_URI,
              grant_type: 'authorization_code',
            }),
          });

          const tokenData = await tokenRes.json();
          if (!tokenRes.ok || !tokenData.access_token) {
            const msg = tokenData.error_description || tokenData.error || 'Token exchange failed';
            res.writeHead(302, {
              Location: `${frontendOrigin}/autopilot?oauth=error&reason=${encodeURIComponent(msg)}`,
            });
            res.end();
            return;
          }

          const refreshToken = tokenData.refresh_token;
          if (refreshToken) {
            process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
            const frontendEnvPath = path.join(process.cwd(), '.env.local');
            const rootEnvPath = path.join(process.cwd(), '..', '.env');
            upsertEnvVar(frontendEnvPath, 'GOOGLE_REFRESH_TOKEN', refreshToken);
            if (fs.existsSync(rootEnvPath)) {
              upsertEnvVar(rootEnvPath, 'GOOGLE_REFRESH_TOKEN', refreshToken);
            }
          }

          let channelTitle = '@salviashu02';
          try {
            const chanRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
              headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const chanData = await chanRes.json();
            const item = chanData?.items?.[0];
            if (item?.snippet?.customUrl) channelTitle = item.snippet.customUrl;
            else if (item?.snippet?.title) channelTitle = item.snippet.title;
          } catch {}

          res.writeHead(302, {
            Location: `${frontendOrigin}/autopilot?oauth=success&channel=${encodeURIComponent(channelTitle)}`,
          });
          res.end();
        } catch (err: any) {
          res.writeHead(302, {
            Location: `${frontendOrigin}/autopilot?oauth=error&reason=${encodeURIComponent(err.message || 'Callback failed')}`,
          });
          res.end();
        }
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.on('error', (err: any) => {
      // Port 8000 may already be bound by FastAPI or an earlier listener
      console.warn('[OAuth Bridge] Port 8000 notice:', err.message);
    });

    server.listen(8000, '127.0.0.1', () => {
      oauthBridgeStarted = true;
      console.log('[OAuth Bridge] Listening on http://localhost:8000/api/v1/youtube/oauth/callback');
    });
  } catch (e) {
    console.warn('[OAuth Bridge] Setup notice:', e);
  }
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const reqUrl = new URL(request.url);
  const isLocal = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1';

  if (!clientId) {
    return NextResponse.json({
      configured: false,
      fallback_direct: true,
      authorization_url: null,
      message: 'Google OAuth credentials are not configured on this server. Direct Channel Sync (@salviashu02) is active.',
    });
  }

  const effectiveRedirectUri = isLocal
    ? REDIRECT_URI
    : `${reqUrl.origin}/api/v1/youtube/oauth/callback`;

  if (isLocal) {
    ensurePort8000OAuthBridge(reqUrl.origin);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: effectiveRedirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.json({
    configured: true,
    authorization_url: authUrl,
    redirect_uri: effectiveRedirectUri,
  });
}
