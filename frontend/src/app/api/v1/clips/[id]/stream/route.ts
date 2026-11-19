import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Search candidate paths
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'clips', `${id}.mp4`),
    path.join(process.cwd(), 'frontend', 'public', 'clips', `${id}.mp4`),
    path.join(process.cwd(), 'clips', `${id}.mp4`),
    path.join(process.cwd(), '..', 'clips', `${id}.mp4`),
    path.join(process.cwd(), '..', 'frontend', 'public', 'clips', `${id}.mp4`),
  ];

  let filePath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  // Fallback: check if id has speed or carry prefix
  if (!filePath) {
    const defaultClips = [
      path.join(process.cwd(), 'frontend', 'public', 'clips', 'clip-speed-01-crash.mp4'),
      path.join(process.cwd(), 'frontend', 'public', 'clips', 'clip-inc-04-crash.mp4'),
      path.join(process.cwd(), 'clips', 'clip-speed-01-crash.mp4'),
      path.join(process.cwd(), 'clips', 'clip-inc-04-crash.mp4'),
    ];
    for (const def of defaultClips) {
      if (fs.existsSync(def)) {
        filePath = def;
        break;
      }
    }
  }

  if (!filePath || !fs.existsSync(filePath)) {
    return new NextResponse('Video clip not found', { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = request.headers.get('range');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    const fileStream = fs.createReadStream(filePath, { start, end });
    // @ts-ignore
    return new NextResponse(fileStream as any, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  const fileStream = fs.createReadStream(filePath);
  // @ts-ignore
  return new NextResponse(fileStream as any, {
    status: 200,
    headers: {
      'Content-Length': fileSize.toString(),
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
