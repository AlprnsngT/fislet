import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'fislet-receipts';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('⚠️ [R2 CONFIG WARNING]: Missing R2 environment variables!');
  }

  return {
    accountId: accountId || 'mock-account-id',
    accessKeyId: accessKeyId || 'mock-access-key',
    secretAccessKey: secretAccessKey || 'mock-secret-key',
    bucketName,
  };
}

let _r2ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!_r2ClientInstance) {
    const config = getR2Config();
    _r2ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return _r2ClientInstance;
}

export async function generatePresignedUploadUrl(
  userId: string,
  filename: string
): Promise<{ uploadUrl: string; fileKey: string }> {
  const config = getR2Config();
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileKey = `uploads/${userId}/${timestamp}_${sanitizedFilename}`;

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: fileKey,
    ContentType: 'image/jpeg',
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
  console.log(`🔑 [R2 PRESIGNED URL]: Generated key: ${fileKey}`);

  return { uploadUrl, fileKey };
}
