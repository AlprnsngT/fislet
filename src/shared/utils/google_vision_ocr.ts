import vision from '@google-cloud/vision';
import path from 'path';
import fs from 'fs';
import { parseReceiptText, ParsedReceiptData } from './receipt_parser';

export async function runGoogleVisionOCR(imageBase64OrUrl: string): Promise<ParsedReceiptData | null> {
  const credentialsPathEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  console.log('⚡ [GOOGLE VISION API]: Görüntü Google Vision OCR ile taranıyor...');

  try {
    let extractedText = '';

    // 1. OFFICIAL GOOGLE CLOUD VISION SDK (Service Account JSON)
    let keyFilename = credentialsPathEnv;
    if (credentialsPathEnv) {
      if (credentialsPathEnv.startsWith('./') || credentialsPathEnv.startsWith('../')) {
        keyFilename = path.resolve(process.cwd(), credentialsPathEnv);
      }
    } else {
      // Check default fallback json in project root
      const defaultJsonPath = path.resolve(process.cwd(), 'august-splicer-504114-b4-7d15f95661aa.json');
      if (fs.existsSync(defaultJsonPath)) {
        keyFilename = defaultJsonPath;
      }
    }

    if (keyFilename && fs.existsSync(keyFilename)) {
      console.log(`🔑 [GOOGLE VISION SDK]: Service Account JSON kullanılıyor -> ${keyFilename}`);
      const client = new vision.ImageAnnotatorClient({ keyFilename });

      // Execute document text detection
      const [result] = await client.documentTextDetection(imageBase64OrUrl);
      extractedText = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || '';
    } else if (apiKey) {
      // 2. REST API KEY FALLBACK
      console.log('🔑 [GOOGLE VISION REST]: API Key ile REST isteği atılıyor...');
      let imageContentPayload: any = {};
      if (imageBase64OrUrl.startsWith('data:image')) {
        imageContentPayload = { content: imageBase64OrUrl.split(',')[1] };
      } else if (imageBase64OrUrl.startsWith('http')) {
        imageContentPayload = { source: { imageUri: imageBase64OrUrl } };
      } else {
        imageContentPayload = { content: imageBase64OrUrl };
      }

      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: imageContentPayload,
              features: [
                { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
                { type: 'TEXT_DETECTION', maxResults: 1 },
              ],
              imageContext: { languageHints: ['tr', 'en'] },
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        extractedText = data?.responses?.[0]?.fullTextAnnotation?.text || data?.responses?.[0]?.textAnnotations?.[0]?.description || '';
      }
    } else {
      console.warn('⚠️ [GOOGLE VISION API]: Ne GOOGLE_APPLICATION_CREDENTIALS ne de GOOGLE_VISION_API_KEY bulunamadı!');
      return null;
    }

    if (!extractedText || !extractedText.trim()) {
      console.warn('⚠️ [GOOGLE VISION API]: Görselde metin okunamadı.');
      return null;
    }

    console.log('✅ [GOOGLE VISION OCR KUSURSUZ OKUMA SONUCU]:\n----------------------------------------\n' + extractedText + '\n----------------------------------------');
    return parseReceiptText(extractedText);
  } catch (error: any) {
    console.error('❌ [GOOGLE VISION OCR EXCEPTION]:', error);
    return null;
  }
}
