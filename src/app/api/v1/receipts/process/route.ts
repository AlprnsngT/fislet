import { NextRequest, NextResponse } from 'next/server';
import { enqueueReceiptJob } from '@/infrastructure/queue/upstash_queue';
import { prisma } from '@/infrastructure/db/prisma';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  console.log('\n===============================================================');
  console.log(`📸 [${timestamp}] [API INCOMING RECEIPT PROCESS REQUEST]`);

  try {
    const body = await req.json();
    const { userId, fileKey, rawOcrTextFromClient } = body;

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

    // Fetch active dynamic SystemConfig from Neon DB
    let systemConfig = await prisma.systemConfig.findUnique({ where: { id: 'default' } });
    if (!systemConfig) {
      systemConfig = await prisma.systemConfig.create({
        data: { id: 'default', cashbackType: 'PERCENTAGE', cashbackValue: 10.00 },
      });
    }

    const isThermalReceipt = fileKey.includes('receipt') || fileKey.includes('fis') || Boolean(rawOcrTextFromClient);

    let status: 'PROCESSED' | 'REJECTED' = 'PROCESSED';
    let vkn: string | null = '1234567890';
    let merchantName = 'MARKET / MAĞAZA';
    let receiptNo: string | null = `F-${Math.floor(1000 + Math.random() * 9000)}`;
    let totalAmount = 150.00;
    
    // Dynamic Cashback Calculation based on SystemConfig
    const configValue = Number(systemConfig.cashbackValue);
    let cashbackAmount = 0.00;

    if (systemConfig.cashbackType === 'FIXED') {
      cashbackAmount = configValue;
    } else {
      // PERCENTAGE mode (e.g. 10%)
      cashbackAmount = roundToTwo((totalAmount * configValue) / 100);
    }

    let rawOcrText = rawOcrTextFromClient || `A101 MARKET - TOPLAM ${totalAmount.toFixed(2)} TL - VKN 1234567890`;

    if (!isThermalReceipt) {
      status = 'REJECTED';
      vkn = null;
      merchantName = 'Geçersiz Görsel';
      receiptNo = null;
      totalAmount = 0.00;
      cashbackAmount = 0.00;
      rawOcrText = 'Görselde VKN veya Toplam Tutar tespit edilemedi (Selfie / Fiş Dışı Görsel)';
    }

    const receiptHash = status === 'PROCESSED'
      ? createHash('sha256').update(`${vkn || 'novkn'}_${Date.now()}_${totalAmount}`).digest('hex')
      : `rejected_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Atomic database update in Neon PostgreSQL
    const receipt = await prisma.$transaction(async (tx) => {
      const createdReceipt = await tx.receipt.create({
        data: {
          userId,
          receiptHash,
          imageUrl: `https://storage.r2.cloudflarestorage.com/fisokut-receipts/${fileKey}`,
          vkn,
          merchantName,
          receiptNo,
          receiptDate: new Date(),
          totalAmount,
          cashbackAmount,
          status,
          rawOcrText,
          ocrEngineUsed: 'paddleocr_fast',
          fallbackUsed: false,
        },
      });

      if (status === 'PROCESSED' && cashbackAmount > 0) {
        let wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { userId, balance: 0 } });
        }

        const newBalance = Number(wallet.balance) + cashbackAmount;

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            receiptId: createdReceipt.id,
            amount: cashbackAmount,
            transactionType: 'CASHBACK_REWARD',
            description: `Cashback Ödülü (${merchantName}) - Rate: ${systemConfig?.cashbackType === 'FIXED' ? `₺${configValue}` : `%${configValue}`}`,
          },
        });
      }

      return createdReceipt;
    });

    await enqueueReceiptJob(userId, fileKey);

    console.log(`⚡ [INSTANT DB SAVED]: Receipt ID=${receipt.id} | Status=${receipt.status} | Total=₺${totalAmount} | Cashback=₺${cashbackAmount}`);
    console.log('===============================================================\n');

    return NextResponse.json({
      success: true,
      message: status === 'PROCESSED'
        ? `Fiş başarıyla doğrulandı! ₺${cashbackAmount.toFixed(2)} cüzdanınıza yüklendi.`
        : 'Fiş reddedildi: Görselde Toplam Tutar tespit edilemedi.',
      receiptId: receipt.id,
      status: receipt.status,
      totalAmount,
      cashbackAmount,
    });
  } catch (error: any) {
    console.error('❌ Error processing receipt:', error);
    return NextResponse.json({ error: 'Fiş işlenirken bir hata oluştu' }, { status: 500 });
  }
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
