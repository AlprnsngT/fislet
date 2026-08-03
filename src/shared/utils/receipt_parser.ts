import { createHash } from 'crypto';

export interface ExtractedReceiptItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  categorySlug: string;
}

export interface ParsedReceiptData {
  vkn: string | null;
  merchantName: string;
  receiptNo: string | null;
  dateObj: Date;
  dateStr: string | null;
  totalAmount: number;
  isValid: boolean;
  compositeHash: string;
  items: ExtractedReceiptItem[];
  rejectionReason?: 'DUPLICATE' | 'NO_TOTAL_AMOUNT' | 'UNREADABLE_IMAGE' | 'SYSTEM_ERROR';
}

// Helper to parse Turkish and standard monetary price formats (e.g. "1.450,50", "1450.50", "45,00 TL")
// STRICT: Must contain explicit decimal comma or dot followed by 1 or 2 digits (e.g. 62,00 or 150.50)
// Rejects plain integer numbers like "62-", "2026", "12345" unless there is a decimal separator.
function parseTurkishPrice(rawStr: string): number | null {
  if (!rawStr) return null;
  const match = rawStr.match(/\b(?:\d{1,3}(?:[\.\,]\d{3})+|\d+)[\.\,](\d{1,2})\b/);
  if (!match) return null;

  let str = match[0];
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  const val = parseFloat(str);
  return !isNaN(val) && val > 0 ? val : null;
}

/**
 * Classifies merchant or product item into category slug
 */
export function classifyCategory(itemName: string, merchantName: string): string {
  const text = `${merchantName} ${itemName}`.toUpperCase();

  if (/(PETROL|OPET|BP|SHELL|TOTAL|HYPO|BENZ[İI]N|D[İI]ZEL|MOTOR[İI]N|LPG|MAZOT|OTO\s*YIKAMA)/i.test(text)) {
    return 'akaryakit';
  }
  if (/(RESTORAN|CAFE|KAFE|LOKANTA|STARBUCKS|KÖFTE|KOFTE|BURGER|PIZZA|PİZZA|DÖNER|DONER|KEBAP|KAHVE|ÇAY|CAY|MENÜ|MENU|AYRAN|TATLI|PASTA|LAHMACUN|PİDE)/i.test(text)) {
    return 'restoran-kafe';
  }
  if (/(ZARA|MANGO|LCW|KOTON|MAVİ|MAVI|FLO|NIKE|ADIDAS|T-SHIRT|PANTOLON|GÖMLEK|AYAKKABI|ÇORAP|CEKET|MONT|ELBİSE)/i.test(text)) {
    return 'giyim';
  }
  if (/(TEKNOSA|TEKNO SA|MEDIA\s*MARKT|VATAN|APPLE|SAMSUNG|TELEFON|KABLO|KILIF|ŞARJ|SARJ|KULAKLIK|USB|BİLGİSAYAR)/i.test(text)) {
    return 'elektronik';
  }
  if (/(ECZANE|GRATIS|WATSONS|ROSSMANN|KREM|[İI]LAÇ|VİTAMİN|PARFÜM|MAKYAJ|ŞAMPUAN|SAMPUAN)/i.test(text)) {
    return 'saglik-kozmetik';
  }
  if (/(MARKET|MİGROS|MIGROS|BİM|BIM|A101|ŞOK|SOK|CARREFOUR|MACRO|PEYNİR|SÜT|SUT|YOĞURT|YOGURT|EKMEK|CİPS|CIPS|SU|BİSKÜVİ|ÇİKOLATA|ET|TAVUK|DETERJAN|PİRİNÇ|PIRINC|UN|ŞEKER|ZEYTİN|YAĞ|MANAV)/i.test(text)) {
    return 'market';
  }

  return 'diger';
}

/**
 * Extracts line items from receipt raw OCR text
 */
function extractReceiptItems(rawText: string, merchantName: string): ExtractedReceiptItem[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: ExtractedReceiptItem[] = [];

  const excludeKeywords = [
    'TOPLAM', 'ODENECEK', 'ÖDENECEK', 'KDV', 'VERGI', 'VERGİ', 'TARİH', 'TARIH',
    'FİŞ', 'FIS', 'SIRA', 'BELGE', 'TEL', 'MERSİS', 'MERSIS', 'TEŞEKKÜRLER', 'TESEKKURLER',
    'KREDİ', 'KREDI', 'NAKİT', 'NAKIT', 'PARA', 'ÜSTÜ', 'USTU', 'Z NO', 'STOK', 'FATURA',
    'ÖDENEN', 'ODENEN', 'KART', 'BANKA', 'TUTAR', 'TOPKDV'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();

    // Skip system/footer lines
    if (excludeKeywords.some((kw) => upper.includes(kw))) {
      continue;
    }

    // Pattern 1: "2 AD x 15,00 TL PEYNİR" or "PEYNİR 2 x 15.00"
    const qtyPriceMatch = line.match(/(?:(\d+)\s*(?:AD|ADET|KG|GR|LITRE)?\s*[*xX]\s*)?([^\d%]+?)\s*(?:[*xX]\s*(\d+))?\s+(?:%?\d+\s+)?(\d+[\.\,]\d{2})\b/);

    if (qtyPriceMatch) {
      let rawName = (qtyPriceMatch[2] || '').trim();
      // Remove leading digits or codes
      rawName = rawName.replace(/^[0-9%\*\s\.\-]+/, '').trim();

      const price = parseTurkishPrice(qtyPriceMatch[4]);
      const qty = parseInt(qtyPriceMatch[1] || qtyPriceMatch[3] || '1', 10) || 1;

      if (rawName.length >= 2 && price !== null && price > 0 && price < 100000) {
        const categorySlug = classifyCategory(rawName, merchantName);
        items.push({
          itemName: rawName.substring(0, 80),
          quantity: qty,
          unitPrice: Math.round((price / qty) * 100) / 100,
          totalPrice: price,
          categorySlug,
        });
      }
    }
  }

  // If no specific item lines parsed, fallback to single item representing receipt basket
  return items;
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
      rejectionReason: 'UNREADABLE_IMAGE',
      compositeHash: `rejected_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      items: [],
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
    'CARREFOURSA', 'MACROCENTER', 'KÖFTECİ YUSUF', 'KOFTECI YUSUF', 'BURGER', 'MC DONALDS', 'STARBUCKS',
    'TRENDYOL', 'HEPSİBURADA', 'GETİR', 'YEMEKSEPETİ', 'E-ARŞİV', 'E-FATURA'
  ];

  for (const line of lines.slice(0, 7)) {
    const upper = line.toUpperCase();
    if (upper.includes('HOŞGELDİNİZ') || upper.includes('TARİH') || upper.includes('MERSİS') || upper.includes('FİŞ NO')) {
      continue;
    }
    if (merchantSuffixes.some((suffix) => upper.includes(suffix))) {
      merchantName = line.replace(/^[^\p{L}]+/u, '').trim();
      break;
    }
  }

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

  // 2. VKN / TCKN / MERSİS NO Extraction
  let vkn: string | null = null;
  const mersisMatch = rawText.match(/(?:MERS[İI]S\s*NO|MERS[İI]S)?\s*[:\.]?\s*\b(\d{16})\b/i);
  const vknMatch = rawText.match(/(?:VKN|TCKN|VERG[İI]\s*NO)?\s*[:\.]?\s*\b(\d{10,11})\b/i);

  if (mersisMatch) {
    vkn = `MERSİS: ${mersisMatch[1]}`;
  } else if (vknMatch) {
    vkn = vknMatch[1];
  } else {
    const digitMatch = rawText.match(/\b(\d{10}|\d{16})\b/);
    if (digitMatch) {
      vkn = digitMatch[1];
    }
  }

  // 3. Exact Receipt Date & Time Parsing
  let dateObj = new Date();
  let dateStr: string | null = null;

  const dateMatch = rawText.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/);
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

  // 4. Receipt / Z Number Extraction (Strictly require explicit receipt label)
  let receiptNo: string | null = null;
  const receiptNoMatch = rawText.match(/(?:FI[ŞS]\s*NO|Z\s*NO|F[Iİ]S\s*NO|SIRA\s*NO|BELGE\s*NO|ETTN)\s*[:\.]?\s*([A-Za-z0-9-]+)/i);
  if (receiptNoMatch) {
    receiptNo = receiptNoMatch[1].trim();
  }

  // 5. Total Amount Extraction
  let totalAmount = 0;
  const totalKeywords = [
    'ÖDENECEK TUTAR', 'ODENECEK TUTAR', 'ÖDENECEK', 'ODENECEK',
    'GENEL TOPLAM', 'TOPLAM TUTAR', 'FATURA TUTARI', 'NET TUTAR',
    'ÖDENEN TUTAR', 'ODENEN TUTAR', 'ÖDENEN', 'ODENEN',
    'TOPLAM', 'TUTAR', 'KDV DAHİL TOPLAM', 'KDV DAHIL TOPLAM',
    'KART', 'NAKİT', 'NAKIT', 'CREDIT CARD'
  ];

  for (const line of [...lines].reverse()) {
    const upper = line.toUpperCase();
    if (totalKeywords.some((kw) => upper.includes(kw))) {
      const price = parseTurkishPrice(line);
      if (price !== null && price > 0) {
        totalAmount = price;
        break;
      }
    }
  }

  // Fallback: strictly search for numbers with explicit decimal comma/dot followed by 1 or 2 digits
  if (totalAmount === 0) {
    const allMatches = Array.from(rawText.matchAll(/\b(?:\d{1,3}(?:[\.\,]\d{3})+|\d+)[\.\,](\d{1,2})\b/g));
    const parsedPrices = allMatches
      .map((m) => parseTurkishPrice(m[0]))
      .filter((p): p is number => p !== null && p > 0);

    if (parsedPrices.length > 0) {
      totalAmount = Math.max(...parsedPrices);
    }
  }

  const isValid = totalAmount > 0;

  // 6. Extract Individual Line Items
  let items = extractReceiptItems(rawText, merchantName);

  // Fallback: If no item lines extracted, add 1 item for the whole receipt
  if (items.length === 0 && isValid) {
    const categorySlug = classifyCategory(merchantName, merchantName);
    items.push({
      itemName: `${merchantName} Alışverişi`,
      quantity: 1,
      unitPrice: totalAmount,
      totalPrice: totalAmount,
      categorySlug,
    });
  }

  // 7. Compute SHA-256 Composite Hash for Duplicate Prevention
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
    rejectionReason: isValid ? undefined : 'NO_TOTAL_AMOUNT',
    compositeHash,
    items,
  };
}
