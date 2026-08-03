import { NextRequest, NextResponse } from 'next/server';
import { enqueueReceiptJob } from '@/infrastructure/queue/upstash_queue';
import { prisma } from '@/infrastructure/db/prisma';
import { parseReceiptText } from '@/shared/utils/receipt_parser';
import { runGoogleVisionOCR } from '@/shared/utils/google_vision_ocr';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  console.log('\n===============================================================');
  console.log(`📸 [${timestamp}] [API INCOMING HYBRID RECEIPT PROCESS REQUEST]`);

  try {
    const body = await req.json();
    const { userId, fileKey, rawOcrTextFromClient, imageBase64 } = body;

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

    // Public Image URL in R2 Storage
    const imageUrl = `https://storage.r2.cloudflarestorage.com/fisokut-receipts/${fileKey}`;

    let ocrTextToParse = rawOcrTextFromClient || '';
    let ocrEngineUsed = 'paddleocr';
    let fallbackUsed = false;

    // 2. KADEME 1: Synchronous Python PaddleOCR Engine Pass
    if (imageBase64 && typeof imageBase64 === 'string') {
      try {
        console.log('⚡ [PADDLEOCR LOCAL ENGINE]: Python PaddleOCR CLI motoru çalıştırılıyor...');
        const tempDir = path.join(process.cwd(), '.next', 'cache');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        
        const tempFilePath = path.join(tempDir, `temp_receipt_${Date.now()}.jpg`);
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));

        const cliCmd = `PYTHONPATH=. python3 worker/cli_scan.py "${tempFilePath}"`;
        const cliOutput = execSync(cliCmd, { cwd: process.cwd(), timeout: 25000 }).toString();

        // Clean up temp file
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

        const cliJson = JSON.parse(cliOutput);
        if (cliJson.success && cliJson.rawText) {
          ocrTextToParse = cliJson.rawText;
          console.log(`✅ [PADDLEOCR SUCCESS]: PaddleOCR ${ocrTextToParse.length} karakter metin çıkardı!`);
        }
      } catch (paddleErr: any) {
        console.warn('⚠️ [PADDLEOCR CLI WARNING]: Local PaddleOCR execution failed:', paddleErr.message);
      }
    }

    let parsed = parseReceiptText(ocrTextToParse);

    // 3. KADEME 2: Google Cloud Vision API Fallback (If PaddleOCR failed or total amount missing)
    if (!parsed.isValid || parsed.totalAmount <= 0) {
      console.log('⚠️ [CASCADE HYBRID OCR]: Kademe 1 toplam tutar bulamadı. Google Cloud Vision API çalıştırılıyor...');
      const visionParsed = await runGoogleVisionOCR(imageUrl);
      
      if (visionParsed && visionParsed.isValid && visionParsed.totalAmount > 0) {
        console.log('🎯 [GOOGLE VISION SUCCESS]: Fiş verileri Google Vision API ile başarıyla doğrulandı!');
        parsed = visionParsed;
        ocrEngineUsed = 'google_vision';
        fallbackUsed = true;
      }
    }

    // 4. DUPLICATE PREVENTION CHECK (Mükerrer Fiş Kontrolü)
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
            rawOcrText: ocrTextToParse || 'Mükerrer Fiş (Zaten Kullanılmış)',
            ocrEngineUsed,
            fallbackUsed,
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

    // 5. Determine status and cashback reward
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

    // 6. Atomic database transaction in Neon PostgreSQL
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
          rawOcrText: ocrTextToParse || (status === 'PROCESSED' ? `${parsed.merchantName} - TOPLAM ${parsed.totalAmount} TL` : 'Görselde Toplam Tutar tespit edilemedi'),
          ocrEngineUsed,
          fallbackUsed,
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

    console.log(`⚡ [INSTANT DB SAVED]: Receipt ID=${receipt.id} | Engine=${ocrEngineUsed} | Status=${receipt.status} | Total=₺${parsed.totalAmount} | Cashback=₺${cashbackAmount}`);
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
    });
  } catch (error: any) {
    console.error('❌ Error processing receipt:', error);
    return NextResponse.json({ error: 'Fiş işlenirken bir hata oluştu' }, { status: 500 });
  }
}
