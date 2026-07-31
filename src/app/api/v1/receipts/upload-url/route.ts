import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/infrastructure/storage/r2_storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, filename } = body;

    if (!userId || !filename) {
      return NextResponse.json({ error: 'userId and filename are required' }, { status: 400 });
    }

    const result = await generatePresignedUploadUrl(userId, filename);

    return NextResponse.json({
      success: true,
      uploadUrl: result.uploadUrl,
      fileKey: result.fileKey,
      expiresInSeconds: 60,
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
