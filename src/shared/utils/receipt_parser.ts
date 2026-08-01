import { createHash } from 'crypto';

export interface ParsedReceiptData {
  vkn: string | null;
  merchantName: string;
  receiptNo: string | null;
  dateObj: Date;
  dateStr: string | null;
  totalAmount: number;
  isValid: boolean;
  compositeHash: string;
}

export function parseReceiptText(rawText: string): ParsedReceiptData {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      vkn: null,
      merchantName: 'Bilinmeyen Mağaza',
      receiptNo: null,
      dateObj: new Date(),
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

  // 1. Dynamic Merchant / Store Name Extraction
  let merchantName = 'BİLİNMEYEN MAĞAZA';
  const merchantKeywords = [
    'A101', 'MİGROS', 'MIGROS', 'BİM', 'BIM', 'ŞOK', 'SOK', 'CARREFOURSA', 'MACROCENTER',
    'KÖFTECİ YUSUF', 'KOFTECI YUSUF', 'SHELL', 'BP', 'OPET', 'TOTAL', 'BETA', 'TEKZEN', 'BAUHAUS',
    'MARKET', 'MAĞAZACILIK', 'MAGAZACILIK', 'GIDA', 'RESTORAN', 'CAFE', 'PETROL', 'ECZANE',
    'LTD.ŞTİ.', 'LTD. ŞTİ.', 'A.Ş.', 'TİC.', 'SAN.'
  ];

  for (const line of lines.slice(0, 5)) {
    const upper = line.toUpperCase();
    if (merchantKeywords.some((kw) => upper.includes(kw))) {
      // Clean numbers and extra noise from merchant name line
      merchantName = line.replace(/^\d+[\s\.-]*/, '').trim();
      break;
    }
  }

  // Fallback: If no keyword found, use top line of receipt
  if (merchantName === 'BİLİNMEYEN MAĞAZA' && lines.length > 0) {
    merchantName = lines[0].substring(0, 30);
  }

  // 2. Exact VKN / TCKN Extraction (10 or 11 digits)
  let vkn: string | null = null;
  const vknMatch = rawText.match(/(?:VKN|TCKN|VERGİ NO|VERGI NO)?\s*[:\.]?\s*\b(\d{10,11})\b/i);
  if (vknMatch) {
    vkn = vknMatch[1];
  }

  // 3. Exact Receipt Date & Time Parsing
  let dateObj = new Date();
  let dateStr: string | null = null;
  const dateMatch = rawText.match(/\b(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?\b/);

  if (dateMatch) {
    const [, day, month, year, hour = '12', minute = '00', second = '00'] = dateMatch;
    dateStr = `${day}.${month}.${year} ${hour}:${minute}:${second}`;
    const parsedDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    if (!isNaN(parsedDate.getTime())) {
      dateObj = parsedDate;
    }
  }

  // 4. Receipt / Z Number Extraction
  let receiptNo: string | null = null;
  const receiptNoMatch = rawText.match(/(?:FI[ŞS]\s*NO|Z\s*NO|F[Iİ]S\s*NO|SIRA\s*NO|BELGE\s*NO|ETTN)\s*[:\.]?\s*([A-Za-z0-9-]+)/i);
  if (receiptNoMatch) {
    receiptNo = receiptNoMatch[1];
  } else {
    // Check standalone number patterns in lines containing 'NO'
    const noLine = lines.find((l) => /NO\s*[:\.]?/i.test(l));
    if (noLine) {
      const numMatch = noLine.match(/\d+/);
      if (numMatch) receiptNo = numMatch[0];
    }
  }

  // 5. Total Amount Extraction (TOPLAM, ÖDENEN, KART, TUTAR, TOP)
  let totalAmount = 0;
  const totalKeywords = ['TOPLAM', 'ÖDENEN', 'ODENEN', 'KART', 'TUTAR', 'TOP', 'GENEL TOPLAM', 'KDV DAHİL TOPLAM'];
  const priceRegex = /(\d+[,\.]\d{2})/;

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

  // Fallback: search for largest price float in raw text
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
  const dateKey = (dateStr || dateObj.toISOString()).replace(/\s+/g, '');
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
    dateObj,
    dateStr,
    totalAmount,
    isValid,
    compositeHash,
  };
}
