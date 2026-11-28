import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || reqUrl.host;
    const forwardedProto =
      request.headers.get('x-forwarded-proto') ||
      (forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1') ? 'http' : 'https');
    const origin = `${forwardedProto}://${forwardedHost}`;

    let slotParam = '';
    try {
      const body = await request.json();
      if (body?.slot) slotParam = `?slot=${encodeURIComponent(String(body.slot))}`;
    } catch {}

    const cronRes = await fetch(`${origin}/api/v1/youtube/autopilot/cron${slotParam}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await cronRes.json();

    return NextResponse.json(data, { status: cronRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Autopilot cycle failed' },
      { status: 500 }
    );
  }
}
