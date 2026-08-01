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

  // 1. Dynamic Store / Merchant Name Extraction (Top 7 lines)
  let merchantName = 'BİLİNMEYEN MAĞAZA';
  const merchantSuffixes = [
    'LTD.ŞTİ', 'LTD. ŞTİ', 'LTD.ŞTI', 'A.Ş.', 'A.S.', 'TİC.', 'TIC.', 'SAN.', 'SANAYİ',
    'MARKET', 'MAĞAZA', 'MAGAZA', 'MAĞAZACILIK', 'MAGAZACILIK', 'GIDA', 'RESTORAN', 'CAFE', 'KAFE',
    'PETROL', 'ECZANE', 'BAKKAL', 'MANAV', 'A101', 'MİGROS', 'MIGROS', 'BİM', 'BIM', 'ŞOK', 'SOK',
    'CARREFOURSA', 'MACROCENTER', 'KÖFTECİ YUSUF', 'KOFTECI YUSUF', 'BURGER', 'MC DONALDS', 'STARBUCKS'
  ];

  // Search top 7 lines for known store keywords or company suffixes
  for (const line of lines.slice(0, 7)) {
    const upper = line.toUpperCase();
    // Exclude system lines like HOŞGELDİNİZ, TARİH, MERSİS, FİŞ
    if (upper.includes('HOŞGELDİNİZ') || upper.includes('TARİH') || upper.includes('MERSİS') || upper.includes('FİŞ NO')) {
      continue;
    }
    if (merchantSuffixes.some((suffix) => upper.includes(suffix))) {
      merchantName = line.replace(/^[^\p{L}]+/u, '').trim();
      break;
    }
  }

  // Fallback: If no suffix matched, pick the first line in top 4 that has letters and is not a date/number
  if (merchantName === 'BİLİNMEYEN MAĞAZA') {
    for (const line of lines.slice(0, 5)) {
      const upper = line.toUpperCase();
      const hasLetter = /[\p{L}]/u.test(line);
      const isSystemLine = upper.includes('HOŞGELDİNİZ') || upper.includes('TARİH') || upper.includes('MERSİS') || upper.includes('FIŞ') || upper.includes('FİŞ') || upper.includes('VKN') || upper.includes('TEL');
      
      if (hasLetter && !isSystemLine && line.length >= 3) {
        merchantName = line.replace(/^[^\p{L}]+/u, '').trim().substring(0, 40);
        break;
      }
    }
  }

  // 2. VKN / TCKN / MERSİS NO Extraction (10, 11, or 16 digits)
  let vkn: string | null = null;
  // Match MERSIS (16 digits) or VKN (10 digits) or TCKN (11 digits)
  const mersisMatch = rawText.match(/(?:MERS[İI]S\s*NO|MERS[İI]S)?\s*[:\.]?\s*\b(\d{16})\b/i);
  const vknMatch = rawText.match(/(?:VKN|TCKN|VERG[İI]\s*NO)?\s*[:\.]?\s*\b(\d{10,11})\b/i);

  if (mersisMatch) {
    vkn = `MERSİS: ${mersisMatch[1]}`;
  } else if (vknMatch) {
    vkn = vknMatch[1];
  } else {
    // Look for standalone 10 or 16 digits in text
    const digitMatch = rawText.match(/\b(\d{10}|\d{16})\b/);
    if (digitMatch) {
      vkn = digitMatch[1];
    }
  }

  // 3. Exact Receipt Date & Time Parsing (Combine separate date and time matches if needed)
  let dateObj = new Date();
  let dateStr: string | null = null;

  // Extract Date string: DD.MM.YYYY, DD/MM/YYYY, or DD-MM-YYYY
  const dateMatch = rawText.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/);
  // Extract Time string: HH:MM or HH:MM:SS
  const timeMatch = rawText.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);

  if (dateMatch) {
    let day = dateMatch[1].padStart(2, '0');
    let month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[3];
    if (year.length === 2) year = `20${year}`;

    let hour = '12';
    let minute = '00';
    let second = '00';

    if (timeMatch) {
      hour = timeMatch[1].padStart(2, '0');
      minute = timeMatch[2].padStart(2, '0');
      if (timeMatch[3]) second = timeMatch[3].padStart(2, '0');
    }

    dateStr = `${day}.${month}.${year} ${hour}:${minute}:${second}`;
    const parsedDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    if (!isNaN(parsedDate.getTime())) {
      dateObj = parsedDate;
    }
  }

  // 4. Receipt / Z Number Extraction (FIŞ NO, FIS NO, Z NO, SIRA NO, BELGE NO, ETTN)
  let receiptNo: string | null = null;
  const receiptNoMatch = rawText.match(/(?:FI[ŞS]\s*NO|Z\s*NO|F[Iİ]S\s*NO|SIRA\s*NO|BELGE\s*NO|ETTN)\s*[:\.]?\s*([A-Za-z0-9-]+)/i);
  if (receiptNoMatch) {
    receiptNo = receiptNoMatch[1];
  } else {
    const noLine = lines.find((l) => /NO\s*[:\.]?/i.test(l));
    if (noLine) {
      const numMatch = noLine.match(/\d+/);
      if (numMatch) receiptNo = numMatch[0];
    }
  }

  // 5. Total Amount Extraction (TOPLAM or TUTAR line)
  let totalAmount = 0;
  const totalKeywords = ['TOPLAM', 'TUTAR', 'ÖDENEN', 'ODENEN', 'KART', 'TOP', 'GENEL TOPLAM', 'KDV DAHİL TOPLAM'];
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

  // Fallback: search for largest price float in raw text if keyword line failed
  if (totalAmount === 0) {
    const allPrices = Array.from(rawText.matchAll(/(\d+[,\.]\d{2})/g))
      .map((m) => parseFloat(m[1].replace(',', '.')))
      .filter((p) => !isNaN(p) && p > 0);
    if (allPrices.length > 0) {
      totalAmount = Math.max(...allPrices);
    }
  }

  const isValid = totalAmount > 0;

  // 6. Compute SHA-256 Composite Hash for Duplicate Prevention
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
