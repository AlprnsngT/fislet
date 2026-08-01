import { NextRequest, NextResponse } from 'next/server';
import { enqueueReceiptJob } from '@/infrastructure/queue/upstash_queue';
import { prisma } from '@/infrastructure/db/prisma';
import { parseReceiptText } from '@/shared/utils/receipt_parser';
import { detectTextWithGoogleVision } from '@/infrastructure/ocr/google_vision_ocr';

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

    // 1. Fetch active dynamic SystemConfig from Neon DB
    let systemConfig = await prisma.systemConfig.findUnique({ where: { id: 'default' } });
    if (!systemConfig) {
      systemConfig = await prisma.systemConfig.create({
        data: { id: 'default', cashbackType: 'PERCENTAGE', cashbackValue: 10.00 },
      });
    }

    const imageUrl = `https://storage.r2.cloudflarestorage.com/fisokut-receipts/${fileKey}`;

    // 2. Multi-Engine OCR Fallback Pipeline:
    // Tier 1: Client Tesseract.js -> Tier 2: Google Cloud Vision API -> Tier 3: Raw Text
    let finalOcrText = rawOcrTextFromClient || '';
    let ocrEngineUsed = 'tesseract.js';

    // If client OCR did not yield valid text, try Google Cloud Vision API
    if (!finalOcrText || finalOcrText.trim().length < 10) {
      const googleVisionText = await detectTextWithGoogleVision(imageUrl);
      if (googleVisionText) {
        finalOcrText = googleVisionText;
        ocrEngineUsed = 'google_cloud_vision';
      }
    }

    const parsed = parseReceiptText(finalOcrText);

    // If explicit non-receipt fileKey pattern (like selfie or photo) and no valid text provided
    const isExplicitNonReceipt = fileKey.includes('selfie') || fileKey.includes('photo') || !parsed.isValid;
    if (isExplicitNonReceipt) {
      parsed.isValid = false;
      parsed.totalAmount = 0;
    }

    // 3. DUPLICATE PREVENTION CHECK (Mükerrer Fiş Kontrolü)
    if (parsed.isValid) {
      const existingReceipt = await prisma.receipt.findFirst({
        where: { receiptHash: parsed.compositeHash },
      });

      if (existingReceipt) {
        console.log(`⚠️ [DUPLICATE DETECTED]: Fiş daha önce okutulmuş! Hash=${parsed.compositeHash}`);
        
        const duplicateRecord = await prisma.receipt.create({
          data: {
            userId,
            receiptHash: `dup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            imageUrl,
            vkn: parsed.vkn,
            merchantName: parsed.merchantName,
            receiptNo: parsed.receiptNo,
            receiptDate: parsed.dateObj,
            totalAmount: parsed.totalAmount,
            cashbackAmount: 0.00,
            status: 'DUPLICATE',
            rawOcrText: finalOcrText || 'Mükerrer Fiş (Zaten Kullanılmış)',
            ocrEngineUsed,
            fallbackUsed: false,
          },
        });

        return NextResponse.json({
          success: false,
          isDuplicate: true,
          message: '❌ Bu fiş daha önce sisteme taranmış! Mükerrer fiş kabul edilmez.',
          receiptId: duplicateRecord.id,
          status: 'DUPLICATE',
        }, { status: 400 });
      }
    }

    // 4. Determine status and cashback reward
    let status: 'PROCESSED' | 'REJECTED' = parsed.isValid ? 'PROCESSED' : 'REJECTED';
    let cashbackAmount = 0.00;

    if (status === 'PROCESSED') {
      const configValue = Number(systemConfig.cashbackValue);
      if (systemConfig.cashbackType === 'FIXED') {
        cashbackAmount = configValue;
      } else {
        // PERCENTAGE mode (Default %10)
        cashbackAmount = Math.round(((parsed.totalAmount * configValue) / 100 + Number.EPSILON) * 100) / 100;
      }
    }

    // 5. Atomic database transaction in Neon PostgreSQL
    const receipt = await prisma.$transaction(async (tx) => {
      const createdReceipt = await tx.receipt.create({
        data: {
          userId,
          receiptHash: parsed.compositeHash,
          imageUrl,
          vkn: parsed.vkn,
          merchantName: parsed.merchantName,
          receiptNo: parsed.receiptNo,
          receiptDate: parsed.dateObj,
          totalAmount: parsed.totalAmount,
          cashbackAmount,
          status,
          rawOcrText: finalOcrText || (status === 'PROCESSED' ? `${parsed.merchantName} - TOPLAM ${parsed.totalAmount} TL` : 'Görselde Toplam Tutar tespit edilemedi (Selfie / Fiş Dışı Görsel)'),
          ocrEngineUsed,
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
            description: `Cashback Ödülü (${parsed.merchantName})`,
          },
        });
      }

      return createdReceipt;
    });

    await enqueueReceiptJob(userId, fileKey);

    console.log(`⚡ [INSTANT DB SAVED]: Receipt ID=${receipt.id} | Status=${receipt.status} | Total=₺${parsed.totalAmount} | Cashback=₺${cashbackAmount} | Engine=${ocrEngineUsed}`);
    console.log('===============================================================\n');

    return NextResponse.json({
      success: true,
      message: status === 'PROCESSED'
        ? `Fiş başarıyla doğrulandı! ₺${cashbackAmount.toFixed(2)} cüzdanınıza yüklendi.`
        : 'Fiş reddedildi: Görselde Toplam Tutar tespit edilemedi.',
      receiptId: receipt.id,
      status: receipt.status,
      totalAmount: parsed.totalAmount,
      cashbackAmount,
      ocrEngineUsed,
    });
  } catch (error: any) {
    console.error('❌ Error processing receipt:', error);
    return NextResponse.json({ error: 'Fiş işlenirken bir hata oluştu' }, { status: 500 });
  }
}
