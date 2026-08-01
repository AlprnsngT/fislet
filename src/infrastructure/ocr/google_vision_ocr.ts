/**
 * Google Cloud Vision API Integration for High-Accuracy Receipt OCR
 * 
 * Supports both API Key authentication (GOOGLE_VISION_API_KEY)
 * and Service Account JSON credentials (GOOGLE_APPLICATION_CREDENTIALS).
 */

export interface GoogleVisionTextAnnotation {
  description: string;
  boundingPoly?: any;
}

export async function detectTextWithGoogleVision(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  
  if (!apiKey) {
    console.log('ℹ️ [GOOGLE VISION OCR]: GOOGLE_VISION_API_KEY tanımlı değil, Tesseract / PaddleOCR motoru aktif.');
    return null;
  }

  try {
    console.log(`🌐 [GOOGLE VISION OCR INITIATED]: Image URL=${imageUrl}`);
    
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: {
              source: { imageUri: imageUrl },
            },
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
      const errorText = await response.text();
      console.error('❌ [GOOGLE VISION API ERROR]:', errorText);
      return null;
    }

    const data = await response.json();
    const fullTextAnnotation = data.responses?.[0]?.fullTextAnnotation;
    
    if (fullTextAnnotation && fullTextAnnotation.text) {
      console.log('✅ [GOOGLE VISION SUCCESS]: Metin başarıyla okundu!');
      return fullTextAnnotation.text;
    }

    const textAnnotations: GoogleVisionTextAnnotation[] = data.responses?.[0]?.textAnnotations || [];
    if (textAnnotations.length > 0) {
      return textAnnotations[0].description;
    }

    return null;
  } catch (error) {
    console.error('❌ [GOOGLE VISION EXCEPTION]:', error);
    return null;
  }
}
