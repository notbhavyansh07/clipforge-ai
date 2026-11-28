import { NextResponse } from 'next/server';
import { INITIAL_CLIPS } from '@/lib/seedData';
import { getRecentChannelVideos, findMatchingChannelVideo } from '@/lib/youtubeDedup';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Track uploaded slots per IST date in server memory to prevent duplicate uploads
const uploadedToday = new Set<string>();

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN must be set in Render Environment Variables for unattended cloud uploads.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`OAuth token refresh failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

function resolveMp4Path(outputPath?: string | null, clipId?: string): string | null {
  const names = [
    ...(outputPath ? [path.basename(outputPath)] : []),
    ...(clipId ? [`${clipId}.mp4`] : []),
  ];
  const dirs = [
    path.join(process.cwd(), 'public', 'clips'),
    path.join(process.cwd(), 'frontend', 'public', 'clips'),
    path.join(process.cwd(), 'clips'),
  ];
  for (const dir of dirs) {
    for (const name of names) {
      const full = path.join(dir, name);
      if (fs.existsSync(full)) return full;
    }
  }
  return null;
}

async function uploadShortDirect(filePath: string, title: string, description: string, tags: string[]): Promise<string> {
  const token = await getAccessToken();
  const fileSize = fs.statSync(filePath).size;

  // Strictly enforce YouTube Shorts classification
  const shortsTitle = (title.includes('#Shorts') ? title : `${title} #Shorts`).slice(0, 100);
  const shortsTags = Array.from(new Set([...tags.map(t => t.replace(/^#/, '')), 'Shorts', 'shorts', 'Short', 'Viral', 'Gaming', 'FYP'])).slice(0, 15);
  const shortsDescription = `${description}\n\n#Shorts #shorts #Viral #FYP #Gaming\n\nSubscribe for daily viral Shorts! 🚀`.slice(0, 5000);

  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(fileSize),
      },
      body: JSON.stringify({
        snippet: {
          title: shortsTitle,
          description: shortsDescription,
          tags: shortsTags,
          categoryId: '20',
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          madeForKids: false,
        },
      }),
    }
  );

  if (!initRes.ok) {
    throw new Error(`YouTube upload init failed: ${initRes.status} ${await initRes.text()}`);
  }

  const locationUrl = initRes.headers.get('location');
  if (!locationUrl) throw new Error('Missing resumable upload location header');

  const buffer = fs.readFileSync(filePath);
  const uploadRes = await fetch(locationUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(fileSize),
    },
    body: buffer,
  });

  const data = await uploadRes.json();
  if (!uploadRes.ok || !data.id) {
    throw new Error(`YouTube upload failed: ${JSON.stringify(data)}`);
  }
  return data.id;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const forcedSlot = url.searchParams.get('slot');

    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utcMs + 5.5 * 3600000);
    const todayKey = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
    const dayIndex = Math.floor(ist.getTime() / 86400000);
    const hhmm = ist.getHours() * 100 + ist.getMinutes();

    // Determine which slot is due right now (or use ?slot=1|2|3)
    let slotNum = forcedSlot ? Number(forcedSlot) : 0;
    if (!slotNum) {
      if (hhmm >= 2130) slotNum = 3;
      else if (hhmm >= 1800) slotNum = 2;
      else if (hhmm >= 1330) slotNum = 1;
      else {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'No daily peak window due yet (slots run at 13:30, 18:00, 21:30 IST).',
          ist_time: ist.toLocaleTimeString('en-US', { hour12: true }),
        });
      }
    }

    const dedupeKey = `${todayKey}-slot-${slotNum}`;
    if (uploadedToday.has(dedupeKey) && !forcedSlot) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Slot #${slotNum} already uploaded today (${todayKey}).`,
      });
    }

    // Daily rotating viral pools per creator/category
    const slotPools: Record<number, string[]> = {
      1: ['clip-tomorrow-carry-heist', 'clip-inc-11-stunt', 'clip-inc-12-airport', 'clip-inc-06-freakout'],
      2: ['clip-tomorrow-speed-ronaldo', 'clip-speed-robotdog', 'clip-speed-01-crash', 'clip-speed-08-deskslam'],
      3: ['clip-tomorrow-trend-yacht', 'clip-trend-01-mrbeast', 'clip-trend-mrbeast-squid'],
    };

    const pool = slotPools[slotNum] || slotPools[1];

    // Query real YouTube channel uploads to skip any clip already uploaded to @salviashu02
    const accessToken = await getAccessToken();
    const recentOnChannel = await getRecentChannelVideos(accessToken);

    // Fetch live trending gaming/viral video context from YouTube Data API
    let liveTrendTitle: string | null = null;
    try {
      const trendRes = await fetch(
        'https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=IN&videoCategoryId=20&maxResults=5',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (trendRes.ok) {
        const trendData = await trendRes.json();
        const firstTrend = trendData?.items?.[dayIndex % Math.max(1, (trendData?.items || []).length)];
        if (firstTrend?.snippet?.title) {
          liveTrendTitle = firstTrend.snippet.title;
        }
      }
    } catch {}

    // Pick first clip in rotated pool that has NOT already been uploaded to the channel
    const rotatedPool = [...pool.slice(dayIndex % pool.length), ...pool.slice(0, dayIndex % pool.length)];
    let clip = INITIAL_CLIPS.find((c) => c.id === rotatedPool[0]) || INITIAL_CLIPS[0];
    let skippedDuplicates = true;

    for (const candidateId of rotatedPool) {
      const candidate = INITIAL_CLIPS.find((c) => c.id === candidateId);
      if (!candidate) continue;
      const alreadyOnChannel = findMatchingChannelVideo(recentOnChannel, candidate.title);
      if (!alreadyOnChannel) {
        clip = candidate;
        skippedDuplicates = false;
        break;
      }
    }

    if (skippedDuplicates && !forcedSlot) {
      uploadedToday.add(dedupeKey);
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `All clips in Slot #${slotNum} pool are already uploaded on @salviashu02.`,
      });
    }

    const mp4Path = resolveMp4Path(clip.output_path, clip.id);

    if (!mp4Path) {
      return NextResponse.json({ success: false, error: `Media file not found for ${clip.id}` }, { status: 404 });
    }

    const viralHashtags = Array.from(
      new Set([
        ...(clip.tags || []),
        '#Shorts',
        '#Viral',
        '#Trending',
        '#Gaming',
        '#FYP',
      ])
    ).slice(0, 10);

    const seoDescription = [
      clip.hook_text ? `🔥 ${clip.hook_text}` : '',
      clip.description || clip.title,
      liveTrendTitle ? `📈 Trending Radar: ${liveTrendTitle}` : '',
      '',
      'Subscribe for daily viral Shorts! 🚀',
      viralHashtags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' '),
    ]
      .filter(Boolean)
      .join('\n');

    const videoId = await uploadShortDirect(
      mp4Path,
      clip.title,
      seoDescription,
      viralHashtags.map((t) => t.replace(/^#/, ''))
    );

    uploadedToday.add(dedupeKey);

    return NextResponse.json({
      success: true,
      slot: slotNum,
      date_ist: todayKey,
      clip_id: clip.id,
      title: clip.title,
      youtube_video_id: videoId,
      youtube_url: `https://youtube.com/shorts/${videoId}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Cron execution failed' },
      { status: 500 }
    );
  }
}
