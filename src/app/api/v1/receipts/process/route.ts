import { NextRequest, NextResponse } from 'next/server';
import { enqueueReceiptJob } from '@/infrastructure/queue/upstash_queue';
import { prisma } from '@/infrastructure/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  console.log('\n===============================================================');
  console.log(`📸 [${timestamp}] [API INCOMING RECEIPT PROCESS REQUEST]`);

  try {
    const body = await req.json();
    const { userId, fileKey } = body;

    console.log(`👤 User ID: ${userId}`);
    console.log(`📁 File Key: ${fileKey}`);

    if (!userId || !fileKey) {
      console.log('❌ [VALIDATION ERROR]: userId veya fileKey eksik!');
      return NextResponse.json({ error: 'userId ve fileKey zorunludur' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log(`❌ [AUTH ERROR]: User ID (${userId}) veritabanında bulunamadı!`);
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Initial status for uploaded image: PENDING (Waiting for Python OCR Worker)
    const receiptHash = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    console.log(`⏳ [INITIAL RECEIPT QUEUED]: Receipt record created as PENDING...`);

    const receipt = await prisma.receipt.create({
      data: {
        userId,
        receiptHash,
        imageUrl: `https://storage.r2.cloudflarestorage.com/fisokut-receipts/${fileKey}`,
        vkn: null,
        receiptNo: null,
        receiptDate: new Date(),
        totalAmount: 0.00,
        cashbackAmount: 0.00,
        status: 'PENDING',
        rawOcrText: 'Fiş OCR kuyruğunda işleniyor...',
        ocrEngineUsed: 'none',
        fallbackUsed: false,
      },
    });

    // Enqueue job to Upstash Redis for Python OCR Worker
    await enqueueReceiptJob(userId, fileKey);

    console.log(`💾 [NEON POSTGRESQL SAVED]: Receipt ID=${receipt.id} | Status=PENDING`);
    console.log('===============================================================\n');

    return NextResponse.json({
      success: true,
      message: 'Fiş yüklendi ve işlenmek üzere kuyruğa alındı.',
      receiptId: receipt.id,
      status: 'PENDING',
    });
  } catch (error: any) {
    console.error('❌ Error processing receipt:', error);
    return NextResponse.json({ error: 'Fiş işlenirken bir hata oluştu' }, { status: 500 });
  }
}
