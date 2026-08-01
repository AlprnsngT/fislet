import { parseReceiptText, ParsedReceiptData } from './receipt_parser';

export async function runGoogleVisionOCR(imageBase64OrUrl: string): Promise<ParsedReceiptData | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ [GOOGLE VISION API]: GOOGLE_VISION_API_KEY env değişkeni bulunamadı. Fallback OCR kullanılacak.');
    return null;
  }

  try {
    console.log('⚡ [GOOGLE VISION API]: Görüntü Google Vision REST API ile taranıyor...');
    
    // Prepare image payload (either base64 or public image URI)
    let imageContentPayload: any = {};
    if (imageBase64OrUrl.startsWith('data:image') || imageBase64OrUrl.startsWith('http')) {
      if (imageBase64OrUrl.startsWith('data:image')) {
        const base64Data = imageBase64OrUrl.split(',')[1];
        imageContentPayload = { content: base64Data };
      } else {
        imageContentPayload = { source: { imageUri: imageBase64OrUrl } };
      }
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
            imageContext: {
              languageHints: ['tr', 'en'],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ [GOOGLE VISION API ERROR]:', errText);
      return null;
    }

    const data = await response.json();
    const fullTextAnnotation = data?.responses?.[0]?.fullTextAnnotation?.text;
    const textAnnotations = data?.responses?.[0]?.textAnnotations?.[0]?.description;

    const extractedText = fullTextAnnotation || textAnnotations || '';
    if (!extractedText) {
      console.warn('⚠️ [GOOGLE VISION API]: Görselde metin okunamadı.');
      return null;
    }

    console.log('✅ [GOOGLE VISION OCR SUCCESSFUL]:\n', extractedText);
    return parseReceiptText(extractedText);
  } catch (error: any) {
    console.error('❌ [GOOGLE VISION OCR EXCEPTION]:', error);
    return null;
  }
}
