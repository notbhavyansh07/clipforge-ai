/**
 * Shared YouTube channel deduplication helpers.
 * Queries the authenticated channel's uploads playlist to prevent duplicate uploads
 * even across server restarts or multiple browser sessions.
 */

export interface ChannelVideoItem {
  videoId: string;
  title: string;
  publishedAt: string;
}

export function normalizeVideoTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/#shorts?/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getRecentChannelVideos(accessToken: string): Promise<ChannelVideoItem[]> {
  try {
    const chanRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!chanRes.ok) return [];
    const chanData = await chanRes.json();
    const uploadsPlaylistId = chanData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return [];

    const listRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(
        uploadsPlaylistId
      )}&maxResults=25`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const items = Array.isArray(listData?.items) ? listData.items : [];

    return items
      .map((item: any) => ({
        videoId: item?.snippet?.resourceId?.videoId || '',
        title: item?.snippet?.title || '',
        publishedAt: item?.snippet?.publishedAt || '',
      }))
      .filter((v: ChannelVideoItem) => Boolean(v.videoId && v.title));
  } catch {
    return [];
  }
}

export function findMatchingChannelVideo(
  channelVideos: ChannelVideoItem[],
  candidateTitle: string
): ChannelVideoItem | null {
  const target = normalizeVideoTitle(candidateTitle);
  if (!target) return null;
  return (
    channelVideos.find((v) => {
      const existing = normalizeVideoTitle(v.title);
      return existing === target || (target.length > 12 && existing.includes(target));
    }) || null
  );
}
