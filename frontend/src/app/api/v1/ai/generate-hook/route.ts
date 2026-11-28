import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body?.title || 'Viral Stream Highlight').trim();
    const location = String(body?.location || 'STREAM').trim();
    const providerId = String(body?.provider_id || 'gemini-free');

    return NextResponse.json({
      success: true,
      provider_used: providerId,
      opening_hook: `WAIT FOR WHAT HAPPENS AT ${location.toUpperCase()}! 😱🔥`,
      suggested_title: title.includes('#Shorts') ? title : `${title} #Shorts`,
      caption_style_recommended: 'karaoke_bold',
      target_emojis: ['😱', '🔥', '💀', '⚡'],
      pacing_target_wpm: 165,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Hook generation failed' }, { status: 500 });
  }
}
