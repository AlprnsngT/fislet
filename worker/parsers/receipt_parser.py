"""
receipt_parser.py — Tier 1: Fuzzy Keyword Matching + Multi-line Lookahead

Stratejiler:
  1. Fuzzy eşleşme (rapidfuzz partial_ratio >= 80) ile anahtar kelime tespiti.
     OCR motorunun ürettiği bozuk yazımları (TOPT AM, T0PLAM, ODENECEK vb.) tolere eder.
  2. Etiket satırında tutar bulunamazsa hemen alt 1-2 satıra bakma (multi-line lookahead).
  3. Her iki yöntem de başarısız olursa: satır indeksinin alt yarısında en büyük sayısal değer.
"""

import re
from typing import Dict, Any, Optional, List, Tuple

try:
    from rapidfuzz import fuzz
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False


# ---------------------------------------------------------------------------
# Niyet Anchor'ları — Öncelik Gruplarına Ayrılmış
# ---------------------------------------------------------------------------

# Birincil: Doğrudan fatura/fiş toplamını işaret eden yüksek güvenilirlik anchor'ları
TOTAL_ANCHORS_PRIMARY: List[str] = [
    "ÖDENECEK TUTAR",
    "ODENECEK TUTAR",
    "GENEL TOPLAM",
    "NET TUTAR",
    "FATURA TUTARI",
    "TOPLAM TUTAR",
    "ÖDENECEK",
    "ODENECEK",
    "TOPLAM",
    "TUTAR",
]

# İkincil: Ödeme yöntemi satırları — yalnızca birincil başarısız olursa kullanılır.
# (NAKİT ve KREDİ, ödenen miktarı gösterir; fiş toplamından farklı olabilir)
TOTAL_ANCHORS_SECONDARY: List[str] = [
    "ÖDENEN",
    "ODENEN",
    "KREDİ",
    "KREDi",
    "KREDI",
    "NAKİT",
    "NAKIT",
]

VKN_ANCHORS: List[str] = ["VKN", "VERGI", "VERGİ", "TCKN", "SICIL", "SİCİL"]

# Fuzzy eşleşme eşiği
FUZZY_THRESHOLD = 80


# ---------------------------------------------------------------------------
# Yardımcı: Türkçe fiyat ayrıştırıcı
# ---------------------------------------------------------------------------
def parse_turkish_price(raw_str: str) -> Optional[float]:
    """
    Türkçe ve standart formatlardaki fiyatları float'a çevirir.
    ZORUNLU: Ondalık virgül veya nokta sonrası 1-2 basamak gerektirir (ör. 62,00 veya 150.50).
    '62-' veya '2026' gibi düz tamsayıları fiyat olarak kabul etmez.
    """
    if not raw_str:
        return None

    # Sadece açıkça ondalık ayırıcı (virgül veya nokta) içeren fiyatları bul
    candidates = re.findall(
        r'\b(?:\d{1,3}(?:[.,]\d{3})+|\d+)[.,](\d{1,2})\b',
        raw_str
    )

    if not candidates:
        return None

    # Eşleşen ham metni çıkar
    match = re.search(r'\b(?:\d{1,3}(?:[.,]\d{3})+|\d+)[.,]\d{1,2}\b', raw_str)
    if not match:
        return None

    val_str = match.group(0)
    dot_pos = val_str.rfind('.')
    comma_pos = val_str.rfind(',')

    if dot_pos != -1 and comma_pos != -1:
        if comma_pos > dot_pos:
            val_str = val_str.replace('.', '').replace(',', '.')
        else:
            val_str = val_str.replace(',', '')
    elif comma_pos != -1:
        val_str = val_str.replace(',', '.')

    try:
        val = float(val_str)
        return val if val > 0 else None
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Yardımcı: Fuzzy satır eşleşmesi
# ---------------------------------------------------------------------------
def _fuzzy_match_line(line: str, anchors: List[str], threshold: int = FUZZY_THRESHOLD) -> bool:
    """
    Satırın büyük harfli hali ile anchor listesi arasında
    rapidfuzz partial_ratio >= threshold ise True döner.
    rapidfuzz yoksa basit substring kontrolü yapar.
    """
    upper = line.upper()

    if RAPIDFUZZ_AVAILABLE:
        for anchor in anchors:
            score = fuzz.partial_ratio(anchor, upper)
            if score >= threshold:
                return True
        return False
    else:
        # Fallback: basit substring
        return any(anchor in upper for anchor in anchors)


# ---------------------------------------------------------------------------
# Ana Parser Sınıfı
# ---------------------------------------------------------------------------
class ReceiptDataParser:
    """
    Tier 1 Fuzzy Keyword Matching + Multi-line Lookahead parser.
    Türkçe termal ve e-Arşiv fişlerini destekler.
    """

    VKN_PATTERN      = re.compile(r'\b\d{10,16}\b')
    DATE_PATTERN     = re.compile(r'\b(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})\b')
    RECEIPT_NO_PAT   = re.compile(
        r'(?:FI[ŞS]\s*NO|Z\s*NO|F[İI]S\s*NO|SIRA\s*NO|BELGE\s*NO|ETTN)\s*[:\.]?\s*([A-Za-z0-9\-]+)',
        re.IGNORECASE
    )

    @classmethod
    def parse(cls, raw_text: str) -> Dict[str, Any]:
        lines: List[str] = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]

        vkn:          Optional[str]   = None
        date:         Optional[str]   = None
        receipt_no:   Optional[str]   = None
        total_amount: Optional[float] = None

        # ── 1. VKN ─────────────────────────────────────────────────────────
        vkn_match = cls.VKN_PATTERN.search(raw_text)
        if vkn_match:
            vkn = vkn_match.group(0)

        # ── 2. Tarih ────────────────────────────────────────────────────────
        date_match = cls.DATE_PATTERN.search(raw_text)
        if date_match:
            date = date_match.group(1)

        # ── 3. Fiş / Belge No ───────────────────────────────────────────────
        rno_match = cls.RECEIPT_NO_PAT.search(raw_text)
        if rno_match:
            receipt_no = rno_match.group(1)

        # ── 4. Toplam Tutar: Tier 1 Fuzzy + Multi-line Lookahead ────────────
        total_amount = cls._extract_total_amount(lines)

        # ── 5. Geçerlilik ────────────────────────────────────────────────────
        is_valid = bool(total_amount and total_amount > 0)

        return {
            "vkn":          vkn,
            "date":         date,
            "receipt_no":   receipt_no,
            "total_amount": total_amount or 0.0,
            "is_valid":     is_valid,
        }

    @classmethod
    def _extract_total_amount(cls, lines: List[str]) -> Optional[float]:
        """
        Tier 1: Fuzzy keyword eşleşmesi + multi-line lookahead.

        Algoritma:
          1. Birincil anchor'larla (TOPLAM, ÖDENECEK vb.) sondan başa tara.
          2. Eşleşen satırda tutar varsa al; yoksa 1-2 satır lookahead yap.
          3. Birincil başarısız olursa ikincil anchor'larla (NAKİT, KREDİ) dene.
          4. Hâlâ bulunamazsa: alt yarıdaki en büyük sayısal değer (heuristic).
        """
        n = len(lines)

        # Geçiş 1: Birincil anchor'lar (yüksek güvenilirlik)
        result = cls._scan_lines_for_total(lines, TOTAL_ANCHORS_PRIMARY)
        if result:
            return result

        # Geçiş 2: İkincil anchor'lar (NAKİT, KREDİ — ödeme yöntemi satırları)
        result = cls._scan_lines_for_total(lines, TOTAL_ANCHORS_SECONDARY)
        if result:
            return result

        # Heuristic: alt yarıdaki en büyük sayısal değer
        bottom_half = lines[n // 2:] if n > 2 else lines
        all_prices: List[float] = []
        for line in bottom_half:
            p = parse_turkish_price(line)
            if p and p > 0:
                all_prices.append(p)

        if all_prices:
            return max(all_prices)

        # Son çare: tüm metindeki en büyük sayı
        global_prices: List[float] = []
        for line in lines:
            p = parse_turkish_price(line)
            if p and p > 0:
                global_prices.append(p)

        return max(global_prices) if global_prices else None

    @classmethod
    def _scan_lines_for_total(cls, lines: List[str], anchors: List[str]) -> Optional[float]:
        """Satırları sondan başa tarar; fuzzy anchor eşleşmesinde tutarı alır veya lookahead yapar."""
        n = len(lines)
        for i in range(n - 1, -1, -1):
            line = lines[i]
            if not _fuzzy_match_line(line, anchors):
                continue

            # Etiket satırında aynı anda tutar var mı?
            price = parse_turkish_price(line)
            if price and price > 0:
                return price

            # Multi-line lookahead: sonraki 1-2 satır
            for j in range(i + 1, min(i + 3, n)):
                next_line = lines[j]
                price = parse_turkish_price(next_line)
                if price and price > 0:
                    return price

        return None
