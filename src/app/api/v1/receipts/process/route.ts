import { NextRequest, NextResponse } from 'next/server';
import { enqueueReceiptJob } from '@/infrastructure/queue/upstash_queue';
import { prisma } from '@/infrastructure/db/prisma';
import { parseReceiptText } from '@/shared/utils/receipt_parser';
import { runGoogleVisionOCR } from '@/shared/utils/google_vision_ocr';
import { downloadReceiptAsBase64 } from '@/infrastructure/storage/r2_downloader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // Vercel function max duration

const OCR_SERVER_URL = process.env.OCR_SERVER_URL || 'http://127.0.0.1:8100';

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

    // 2. KADEME 1: Kalıcı PaddleOCR HTTP Servisine async fetch
    // Servis: PYTHONPATH=. python3 worker/ocr_server.py ile ayrı terminalde başlatılmalı
    try {
      console.log(`⚡ [PADDLEOCR HTTP]: Kalıcı OCR servisi çağrılıyor → ${OCR_SERVER_URL}/scan`);

      let targetBase64 = imageBase64;

      // Eğer client base64 göndermediyse veya çok kısaysa R2'den authenticated S3 SDK ile indir
      if (!targetBase64 || typeof targetBase64 !== 'string' || targetBase64.length < 500) {
        console.log(`📥 [R2 DOWNLOAD]: Client'tan base64 gelmedi/küçük. R2'den (${fileKey}) authenticated indiriliyor...`);
        const downloadedBase64 = await downloadReceiptAsBase64(fileKey);
        if (downloadedBase64) {
          targetBase64 = downloadedBase64;
          console.log(`✅ [R2 DOWNLOAD SUCCESS]: ${Math.round(targetBase64.length / 1024)} KB base64 indirildi.`);
        } else {
          console.warn(`⚠️ [R2 DOWNLOAD FAILED]: R2'den dosya indirilemedi.`);
        }
      } else {
        console.log(`📦 [PADDLEOCR HTTP]: Client'tan gelen base64 payload (${Math.round(targetBase64.length / 1024)} KB) kullanılıyor`);
      }

      if (targetBase64 && targetBase64.length > 500) {
        const ocrRes = await fetch(`${OCR_SERVER_URL}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: targetBase64 }),
          signal: AbortSignal.timeout(30000), // 30 sn timeout
        });

        if (ocrRes.ok) {
          const ocrJson = await ocrRes.json();
          if (ocrJson.success && ocrJson.rawText) {
            ocrTextToParse = ocrJson.rawText;
            console.log(`✅ [PADDLEOCR SUCCESS]: ${ocrTextToParse.length} karakter metin çıkardı!`);
          } else {
            console.warn(`⚠️ [PADDLEOCR HTTP]: OCR başarısız - rawText boş. Detay:`, JSON.stringify(ocrJson));
          }
        } else {
          const errBody = await ocrRes.text();
          console.warn(`⚠️ [PADDLEOCR HTTP]: Servis ${ocrRes.status} döndü. Yanıt: ${errBody}`);
        }
      } else {
        console.warn(`⚠️ [PADDLEOCR HTTP]: Geçerli bir görsel verisi bulunamadığından OCR atlandı.`);
      }
    } catch (paddleErr: any) {
      console.warn('⚠️ [PADDLEOCR HTTP WARNING]: OCR servisi erişilemez:', paddleErr.message);
      console.warn('💡 OCR servisi başlatmak için: PYTHONPATH=. python3 worker/ocr_server.py');
    }

    // Fetch all categories to map category slugs to IDs
    const categories = await prisma.category.findMany();
    const categorySlugMap = new Map(categories.map((c) => [c.slug, c.id]));

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
          errorReason: 'DUPLICATE',
          message: '❌ Bu fiş daha önce sisteme okutulmuş! Mükerrer fiş kabul edilemez.',
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
          rawOcrText: ocrTextToParse || (status === 'PROCESSED' ? `${parsed.merchantName} - TOPLAM ${parsed.totalAmount} TL` : 'Görselde Toplam Tutar okunamadı'),
          ocrEngineUsed,
          fallbackUsed,
        },
      });

      // Save extracted line items if available
      if (parsed.items && parsed.items.length > 0) {
        for (const item of parsed.items) {
          const categoryId = categorySlugMap.get(item.categorySlug) || categorySlugMap.get('diger') || null;
          await tx.receiptItem.create({
            data: {
              receiptId: createdReceipt.id,
              categoryId,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            },
          });
        }
      }

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

    const friendlyMessage = status === 'PROCESSED'
      ? `Fiş başarıyla doğrulandı! ₺${cashbackAmount.toFixed(2)} cüzdanınıza yüklendi.`
      : '⚠️ Fiş reddedildi: Görselde Toplam Tutar okunamadı. Lütfen fişin alt kısmındaki toplam tutarın net göründüğünden emin olarak tekrar deneyin.';

    console.log(`⚡ [INSTANT DB SAVED]: Receipt ID=${receipt.id} | Engine=${ocrEngineUsed} | Status=${receipt.status} | Total=₺${parsed.totalAmount} | Cashback=₺${cashbackAmount}`);
    console.log('===============================================================\n');

    return NextResponse.json({
      success: status === 'PROCESSED',
      message: friendlyMessage,
      receiptId: receipt.id,
      status: receipt.status,
      totalAmount: parsed.totalAmount,
      cashbackAmount,
      itemsCount: parsed.items ? parsed.items.length : 0,
    });
  } catch (error: any) {
    console.error('❌ Error processing receipt:', error);
    return NextResponse.json({ error: 'Fiş işlenirken bir hata oluştu' }, { status: 500 });
  }
}
