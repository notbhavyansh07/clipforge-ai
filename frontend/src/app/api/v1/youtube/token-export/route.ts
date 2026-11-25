import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function GET(request: Request) {
  const cookieToken = getCookie(request, 'clipforge_yt_rt');
  if (!cookieToken) {
    return NextResponse.json(
      { error: 'No authorized browser session found. Click "Authorize Real YouTube Upload" first.' },
      { status: 401 }
    );
  }
  return NextResponse.json({ refresh_token: cookieToken });
}
