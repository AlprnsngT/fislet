import { createHash } from 'crypto';

export interface ParsedReceiptData {
  vkn: string | null;
  merchantName: string;
  receiptNo: string | null;
  dateStr: string | null;
  totalAmount: number;
  isValid: boolean;
  compositeHash: string;
}

export function parseReceiptText(rawText: string): ParsedReceiptData {
  if (!rawText || typeof rawText !== 'string') {
    return {
      vkn: null,
      merchantName: 'Bilinmeyen Mağaza',
      receiptNo: null,
      dateStr: null,
      totalAmount: 0,
      isValid: false,
      compositeHash: `rejected_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };
  }

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Merchant Name Detection (First non-empty line or keyword match)
  let merchantName = lines[0] || 'MARKET / MAĞAZA';
  const knownMerchants = ['A101', 'MİGROS', 'BİM', 'BIM', 'ŞOK', 'SOK', 'CARREFOURSA', 'MACROCENTER', 'KÖFTECİ YUSUF'];
  for (const line of lines.slice(0, 5)) {
    const upper = line.toUpperCase();
    for (const merchant of knownMerchants) {
      if (upper.includes(merchant)) {
        merchantName = merchant;
        break;
      }
    }
  }

  // 2. VKN / TCKN Extraction (10 or 11 digits)
  let vkn: string | null = null;
  const vknMatch = rawText.match(/\b\d{10,11}\b/);
  if (vknMatch) {
    vkn = vknMatch[0];
  }

  // 3. Date & Time Extraction (DD.MM.YYYY or DD/MM/YYYY)
  let dateStr: string | null = null;
  const dateMatch = rawText.match(/\b(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?\b/);
  if (dateMatch) {
    dateStr = dateMatch[0];
  }

  // 4. Receipt / Z Number Extraction
  let receiptNo: string | null = null;
  const receiptNoMatch = rawText.match(/(?:FI[ŞS]\s*NO|Z\s*NO|F[Iİ]S\s*NO|ETTN)\s*[:\.]?\s*([A-Za-z0-9-]+)/i);
  if (receiptNoMatch) {
    receiptNo = receiptNoMatch[1];
  }

  // 5. Total Amount Extraction (TOPLAM, ÖDENEN, KART, TUTAR, TOP)
  let totalAmount = 0;
  const totalKeywords = ['TOPLAM', 'ÖDENEN', 'ODENEN', 'KART', 'TUTAR', 'TOP', 'GENEL TOPLAM'];
  const priceRegex = /(\d+[,\.]\d{2})/;

  // Check lines from bottom up for total keywords
  for (const line of [...lines].reverse()) {
    const upper = line.toUpperCase();
    if (totalKeywords.some((kw) => upper.includes(kw))) {
      const match = line.match(priceRegex);
      if (match) {
        const parsedFloat = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(parsedFloat) && parsedFloat > 0) {
          totalAmount = parsedFloat;
          break;
        }
      }
    }
  }

  // Fallback: If no keyword matched line found, look for largest price in text
  if (totalAmount === 0) {
    const allPrices = Array.from(rawText.matchAll(/(\d+[,\.]\d{2})/g))
      .map((m) => parseFloat(m[1].replace(',', '.')))
      .filter((p) => !isNaN(p) && p > 0);
    if (allPrices.length > 0) {
      totalAmount = Math.max(...allPrices);
    }
  }

  const isValid = totalAmount > 0;

  // 6. Compute Deterministic SHA-256 Composite Hash for Duplicate Detection
  const merchantKey = (vkn || merchantName).toLowerCase().replace(/\s+/g, '');
  const dateKey = (dateStr || '').replace(/\s+/g, '');
  const receiptNoKey = (receiptNo || '').replace(/\s+/g, '');
  const amountKey = totalAmount.toFixed(2);

  const rawPayload = `${merchantKey}_${dateKey}_${receiptNoKey}_${amountKey}`;
  const compositeHash = isValid
    ? createHash('sha256').update(rawPayload).digest('hex')
    : `rejected_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    vkn,
    merchantName,
    receiptNo,
    dateStr,
    totalAmount,
    isValid,
    compositeHash,
  };
}
