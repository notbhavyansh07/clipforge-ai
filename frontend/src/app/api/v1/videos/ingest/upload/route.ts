import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const creatorName = (formData.get('creator_name') as string) || 'Local Upload';
    const creatorUrl = (formData.get('creator_url') as string) || undefined;
    const hasPermission = formData.get('has_permission') !== 'false';

    const newVideo = {
      id: `vid-upload-${Date.now()}`,
      title: file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'Uploaded Video Project',
      source_type: 'upload',
      duration: 120,
      fps: 60,
      width: 1920,
      height: 1080,
      has_permission: hasPermission,
      creator_name: creatorName,
      creator_url: creatorUrl,
      status: 'ready',
      is_live: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(newVideo);
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Upload ingest failed' },
      { status: 500 }
    );
  }
}
