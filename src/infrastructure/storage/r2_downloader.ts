import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from './r2_storage';

/**
 * Downloads a file directly from R2 using authenticated S3 credentials
 * and converts it to a base64 encoded data string.
 */
export async function downloadReceiptAsBase64(fileKey: string): Promise<string | null> {
  try {
    const bucketName = process.env.R2_BUCKET_NAME || 'fislet-receipts';
    const client = getR2Client();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    const response = await client.send(command);
    if (!response.Body) {
      console.error(`❌ [R2 DOWNLOADER]: Response body empty for key: ${fileKey}`);
      return null;
    }

    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);
    const base64Data = buffer.toString('base64');
    
    return `data:image/jpeg;base64,${base64Data}`;
  } catch (error: any) {
    console.error(`❌ [R2 DOWNLOADER ERROR]: Failed to download ${fileKey}:`, error?.message || error);
    return null;
  }
}
