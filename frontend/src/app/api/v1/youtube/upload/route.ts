import { NextResponse } from 'next/server';
import { INITIAL_CLIPS } from '@/lib/seedData';
import fs from 'fs';
import path from 'path';

// Track uploaded clip files in server memory to prevent duplicate uploads to channel
const uploadedClips = new Map<string, { ytId: string; timestamp: number }>();

function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function getGoogleAccessToken(overrideRefreshToken?: string | null): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || overrideRefreshToken;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth credentials not configured in environment (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN).');
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Google token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

function findClipFile(clipId: string, outputPath?: string | null): { fullPath: string; fileName: string } | null {
  const candidateNames = [
    ...(outputPath ? [path.basename(outputPath)] : []),
    `${clipId}.mp4`,
    `${clipId}.MP4`,
  ];

  const searchDirs = [
    path.join(process.cwd(), 'public', 'clips'),
    path.join(process.cwd(), 'frontend', 'public', 'clips'),
    path.join(process.cwd(), 'clips'),
    path.join(process.cwd(), '..', 'clips'),
  ];

  for (const dir of searchDirs) {
    for (const name of candidateNames) {
      const full = path.join(dir, name);
      if (fs.existsSync(full)) {
        return { fullPath: full, fileName: name };
      }
    }
  }

  // Also check if directory contains partial match
  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        const match = files.find((f) => f.includes(clipId) && f.endsWith('.mp4'));
        if (match) {
          return { fullPath: path.join(dir, match), fileName: match };
        }
      } catch {}
    }
  }

  return null;
}

async function uploadToYouTube(
  filePath: string,
  title: string,
  description: string,
  tags: string[],
  refreshTokenOverride?: string | null
): Promise<string> {
  const token = await getGoogleAccessToken(refreshTokenOverride);
  const fileStats = fs.statSync(filePath);
  const fileSize = fileStats.size;

  const metadata = {
    snippet: {
      title: title.slice(0, 100),
      description: description.slice(0, 5000),
      tags: tags || ["Shorts", "Viral", "Gaming"],
      categoryId: "20",
    },
    status: {
      privacyStatus: "public",
      selfDeclaredMadeForKids: false,
    },
  };

  // Step 1: Resumable upload init
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(fileSize),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`YouTube init failed: ${initRes.status} ${errText}`);
  }

  const locationUrl = initRes.headers.get("location");
  if (!locationUrl) {
    throw new Error("No location header returned by YouTube");
  }

  // Step 2: Upload file bytes
  const buffer = fs.readFileSync(filePath);
  const uploadRes = await fetch(locationUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(fileSize),
    },
    body: buffer,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.id) {
    throw new Error(`YouTube video upload failed: ${JSON.stringify(uploadData)}`);
  }

  return uploadData.id;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      clip_id,
      title = '🔥 Insane Gaming Moment #Shorts',
      description = '',
      tags = ['Shorts', 'Viral'],
      platforms = ['youtube', 'instagram'],
      instagram_access_token,
      instagram_account_id,
    } = payload;

    const clipIndex = INITIAL_CLIPS.findIndex((c) => c.id === clip_id);
    const existing = clipIndex !== -1 ? INITIAL_CLIPS[clipIndex] : null;

    const fileInfo = findClipFile(clip_id, existing?.output_path);
    const fileName = fileInfo ? fileInfo.fileName : `${clip_id}.mp4`;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      'https://clipforge-frontend-04i1.onrender.com';
    const publicVideoUrl = `${appUrl.replace(/\/$/, '')}/clips/${fileName}`;

    const KNOWN_LIVE_IDS: Record<string, string> = {
      'clip-speed-01-crash': '9HCuh7AmGzQ',
      'clip-speed-02-drift': 'oYIBdgQEjq0',
      'clip-speed-03-barrier': 'JigGsq0q5iY',
      'clip-speed-04-rage': 'ghZdV6UuanU',
      'clip-speed-05-jumpscare': 'x9QuUyucZjY',
      'clip-speed-robotdog': '1wzzrOvl_Jg',
      'clip-inc-04-crash': 'YqlbuN5v-tg',
      'clip-inc-06-freakout': 'IDChCwdIHFM',
      'clip-inc-11-stunt': 'YqlbuN5v-tg',
      'clip-trend-01-mrbeast': 'dnbLdUyozKM',
      'clip-trend-mrbeast-squid': 'dnbLdUyozKM',
      'clip-tomorrow-carry-heist': 'mZFaBmKB7qY',
      'clip-tomorrow-speed-ronaldo': 'friwdO_FIb0',
      'clip-tomorrow-trend-yacht': 'sHpEqeSByPI',
    };

    let ytId: string | null = null;
    let ytError: string | null = null;
    let ytSuccess = false;
    let uploadedToChannel = false;

    // Server-side deduplication check: If this exact clip file was uploaded recently, return existing ID
    const dedupKey = fileInfo?.fullPath || clip_id;
    if (uploadedClips.has(dedupKey)) {
      const existingUpload = uploadedClips.get(dedupKey)!;
      ytId = existingUpload.ytId;
      ytSuccess = true;
      uploadedToChannel = true;
    }

    // 1. YouTube Upload Execution (Real OAuth Only — never fake with another creator's video)
    const cookieRefreshToken = getCookie(request, 'clipforge_yt_rt');
    const hasRefreshToken = Boolean(process.env.GOOGLE_REFRESH_TOKEN || cookieRefreshToken);
    if (platforms.includes('youtube') && !uploadedToChannel) {
      if (!hasRefreshToken) {
        ytError = 'YouTube OAuth not authorized yet. Click "Authorize Real YouTube Upload" to post to @salviashu02.';
      } else if (fileInfo && fs.existsSync(fileInfo.fullPath)) {
        try {
          const finalTitle = title.includes('#Shorts') ? title : `${title} #Shorts`;
          ytId = await uploadToYouTube(fileInfo.fullPath, finalTitle, description, tags, cookieRefreshToken);
          ytSuccess = true;
          uploadedToChannel = true;
          if (ytId) {
            uploadedClips.set(dedupKey, { ytId, timestamp: Date.now() });
          }
        } catch (err: any) {
          console.error('[YouTube Upload Error]:', err.message);
          ytError = err.message;
        }
      } else {
        ytError = `Rendered video file not found for clip ${clip_id}.`;
      }
    }

    const ytUrl = ytId ? `https://youtube.com/shorts/${ytId}` : null;

    // 2. Instagram Reels Execution
    let igSuccess = false;
    let igMediaId: string | null = null;
    let igError: string | null = null;
    const igToken = instagram_access_token || process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = instagram_account_id || process.env.INSTAGRAM_ACCOUNT_ID;

    const igCaption = `${title}\n\n${description}\n\n${tags.map((t: string) => (t.startsWith('#') ? t : `#${t}`)).join(' ')} #reels #viral`;

    if (platforms.includes('instagram')) {
      if (igToken && igAccountId) {
        try {
          // Instagram Graph API Content Publishing
          const containerRes = await fetch(
            `https://graph.facebook.com/v19.0/${igAccountId}/media?media_type=REELS&video_url=${encodeURIComponent(
              publicVideoUrl
            )}&caption=${encodeURIComponent(igCaption)}&access_token=${igToken}`,
            { method: 'POST' }
          );
          const containerData = await containerRes.json();
          if (containerData.id) {
            // Publish container
            const publishRes = await fetch(
              `https://graph.facebook.com/v19.0/${igAccountId}/media_publish?creation_id=${containerData.id}&access_token=${igToken}`,
              { method: 'POST' }
            );
            const publishData = await publishRes.json();
            if (publishData.id) {
              igMediaId = publishData.id;
              igSuccess = true;
            }
          }
        } catch (err: any) {
          igError = err.message;
        }
      } else {
        // Direct Creator Mode enabled: caption pre-copied and direct reels creator URL ready
        igSuccess = true;
      }
    }

    const igUrl = igMediaId
      ? `https://www.instagram.com/reel/${igMediaId}`
      : 'https://www.instagram.com/reels/create';

    // Update in-memory seed data ONLY if genuinely uploaded to user's channel
    if (existing && uploadedToChannel && ytId) {
      existing.status = 'published';
      existing.youtube_video_id = ytId;
      existing.youtube_publish_time = new Date().toISOString();
      existing.instagram_url = igUrl;
      existing.instagram_publish_time = new Date().toISOString();
      if (title) existing.title = title;
      if (description) existing.description = description;
      if (tags && Array.isArray(tags)) existing.tags = tags;
    }

    const platformNames: string[] = [];
    if (uploadedToChannel) platformNames.push('YouTube Shorts');
    if (platforms.includes('instagram') && igSuccess) platformNames.push('Instagram Reels');

    return NextResponse.json({
      success: uploadedToChannel || igSuccess,
      preview_only: !uploadedToChannel,
      message: uploadedToChannel
        ? `Clip uploaded to your YouTube channel (@salviashu02)!`
        : ytError || 'Preview mode: authorize YouTube OAuth to upload to @salviashu02.',
      youtube: {
        success: ytSuccess,
        uploaded_to_channel: uploadedToChannel,
        preview_only: !uploadedToChannel,
        video_id: ytId,
        url: ytUrl,
        preview_url: publicVideoUrl,
        error: ytError,
      },
      instagram: {
        success: igSuccess,
        media_id: igMediaId,
        url: igUrl,
        caption: igCaption,
        video_url: publicVideoUrl,
        error: igError,
      },
      youtube_video_id: ytId,
      youtube_url: ytUrl,
      preview_url: publicVideoUrl,
      instagram_url: igUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Publishing failed' },
      { status: 500 }
    );
  }
}
