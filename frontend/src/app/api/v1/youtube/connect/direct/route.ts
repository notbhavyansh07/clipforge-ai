import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawName = (body?.channel_name || '@salviashu02').trim();
    const channelTitle = rawName.startsWith('@') ? rawName : `@${rawName}`;

    return NextResponse.json({
      success: true,
      connected: true,
      channel_title: channelTitle,
      message: `Connected channel ${channelTitle} successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Direct connect failed' },
      { status: 500 }
    );
  }
}
