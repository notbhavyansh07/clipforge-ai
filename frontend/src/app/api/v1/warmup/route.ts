import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Render warmup endpoint: called by GitHub Actions every 10 min to prevent cold starts
export async function GET() {
  return NextResponse.json({
    status: 'warm',
    timestamp: new Date().toISOString(),
    message: 'ClipForge server is alive and warm 🔥',
    uptime_seconds: Math.floor(process.uptime()),
    memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
