/**
 * DaVinci Resolve Timeline Exporter
 * Powered by patterns from samuelgursky/davinci-resolve-mcp (Editorial & Interchange)
 * Exports CMX 3600 EDL and FCPXML for seamless 1-click import into DaVinci Resolve 18.5+
 */

import { Clip, Video } from './types';

/**
 * Format seconds into SMPTE Timecode (HH:MM:SS:FF) at 60 FPS (or target FPS)
 */
export function secondsToSMPTE(sec: number, fps: number = 60): string {
  const totalFrames = Math.floor(sec * fps);
  const f = totalFrames % fps;
  const totalSeconds = Math.floor(sec);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);

  const pad = (n: number, z: number = 2) => String(n).padStart(z, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

/**
 * Generate CMX 3600 EDL for DaVinci Resolve Studio / Free
 */
export function generateDaVinciEDL(clip: Clip, video?: Video): string {
  const fps = video?.fps || 60;
  const srcIn = secondsToSMPTE(clip.start_time, fps);
  const srcOut = secondsToSMPTE(clip.end_time, fps);
  const recIn = '01:00:00:00';
  const recOut = secondsToSMPTE(clip.duration + 3600, fps);

  const reelName = (clip.id.substring(0, 8) || 'REEL01').toUpperCase();
  const title = (clip.title || 'ClipForge Short').replace(/[^\w\s-]/g, '').trim().substring(0, 32);

  return [
    `TITLE: ${title}`,
    `FCM: NON-DROP FRAME`,
    ``,
    `001  ${reelName} V     C        ${srcIn} ${srcOut} ${recIn} ${recOut}`,
    `* FROM CLIP NAME: ${clip.output_path || clip.id}`,
    `* VIRALITY SCORE: ${clip.virality_score}%`,
    `* LOCATION: ${clip.location || 'Gaming Stream'}`,
    `* HOOK: ${clip.hook_text || ''}`,
    ``,
    `001  ${reelName} A     C        ${srcIn} ${srcOut} ${recIn} ${recOut}`,
    `001  ${reelName} A2    C        ${srcIn} ${srcOut} ${recIn} ${recOut}`,
    ``,
  ].join('\r\n');
}

/**
 * Generate FCPXML 1.9 timeline for DaVinci Resolve (Vertical 1080x1920 60FPS)
 */
export function generateDaVinciFCPXML(clip: Clip, video?: Video): string {
  const fps = video?.fps || 60;
  const durFrames = Math.floor(clip.duration * fps);
  const startFrames = Math.floor(clip.start_time * fps);
  const title = (clip.title || 'ClipForge Short').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080x1920p60" frameDuration="100/6000s" width="1080" height="1920"/>
    <asset id="r2" name="${title}" src="file://${clip.output_path || 'clip.mp4'}" start="${startFrames}/60s" duration="${durFrames}/60s" hasVideo="1" hasAudio="1"/>
  </resources>
  <library>
    <event name="ClipForge Viral Shorts">
      <project name="${title}">
        <sequence format="r1" duration="${durFrames}/60s" tcStart="3600/1s">
          <spine>
            <clip name="${title}" offset="3600/1s" duration="${durFrames}/60s" start="${startFrames}/60s">
              <video ref="r2" offset="${startFrames}/60s" duration="${durFrames}/60s"/>
              <marker start="${startFrames}/60s" duration="100/6000s" value="ClipForge Hook: ${clip.hook_text || 'Viral Peak'}" completed="1"/>
            </clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}

/**
 * Trigger client-side file download
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
