import { NextRequest, NextResponse } from 'next/server';
import { enqueueReceiptJob } from '@/infrastructure/queue/upstash_queue';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, fileKey } = body;

    if (!userId || !fileKey) {
      return NextResponse.json({ error: 'userId and fileKey are required' }, { status: 400 });
    }

    const job = await enqueueReceiptJob(userId, fileKey);

    return NextResponse.json({
      success: true,
      message: 'Receipt enqueued for processing',
      jobId: job.jobId,
      status: 'QUEUED',
    });
  } catch (error: any) {
    console.error('Error enqueueing receipt job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
