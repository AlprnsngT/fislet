import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock-redis.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token',
});

export interface ReceiptJobData {
  jobId: string;
  userId: string;
  fileKey: string;
  createdAt: string;
}

export async function enqueueReceiptJob(userId: string, fileKey: string): Promise<ReceiptJobData> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const jobData: ReceiptJobData = {
    jobId,
    userId,
    fileKey,
    createdAt: new Date().toISOString(),
  };

  await redis.lpush('receipt_ocr_queue', JSON.stringify(jobData));
  return jobData;
}
