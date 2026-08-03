import re
from typing import Dict, Any, Optional

def parse_turkish_price(raw_str: str) -> Optional[float]:
    if not raw_str:
        return None
    match = re.search(r'(?:\d{1,3}(?:[\.\,]\d{3})+|\d+)(?:[\.\,]\d{1,2})?', raw_str)
    if not match:
        return None
    
    val_str = match.group(0)
    if '.' in val_str and ',' in val_str:
        if val_str.rfind(',') > val_str.rfind('.'):
            val_str = val_str.replace('.', '').replace(',', '.')
        else:
            val_str = val_str.replace(',', '')
    elif ',' in val_str:
        val_str = val_str.replace(',', '.')

    try:
        val = float(val_str)
        return val if val > 0 else None
    except ValueError:
        return None

class ReceiptDataParser:
    """
    Regex parser for Turkish thermal and E-Arşiv shopping receipts.
    Extracts VKN/TCKN (10, 11, 16 digits), Date/Time, Receipt No, and Total Amount.
    """

    VKN_PATTERN = re.compile(r'\b\d{10,16}\b')
    DATE_PATTERN = re.compile(r'\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b')
    RECEIPT_NO_PATTERN = re.compile(r'(?:FI[ŞS]\s*NO|Z\s*NO|F[Iİ]S\s*NO|SIRA\s*NO|BELGE\s*NO|ETTN)\s*[:\.]?\s*([A-Za-z0-9-]+)', re.IGNORECASE)

    TOTAL_KEYWORDS = [
        'ÖDENECEK TUTAR', 'ODENECEK TUTAR', 'ÖDENECEK', 'ODENECEK',
        'GENEL TOPLAM', 'TOPLAM TUTAR', 'FATURA TUTARI', 'NET TUTAR',
        'ÖDENEN TUTAR', 'ODENEN TUTAR', 'ÖDENEN', 'ODENEN',
        'TOPLAM', 'TUTAR', 'KDV DAHİL TOPLAM', 'KDV DAHIL TOPLAM',
        'KART', 'NAKİT', 'NAKIT', 'CREDIT CARD'
    ]

    @classmethod
    def parse(cls, raw_text: str) -> Dict[str, Any]:
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

        vkn: Optional[str] = None
        date: Optional[str] = None
        receipt_no: Optional[str] = None
        total_amount: Optional[float] = None

        # 1. Extract VKN
        vkn_match = cls.VKN_PATTERN.search(raw_text)
        if vkn_match:
            vkn = vkn_match.group(0)

        # 2. Extract Date
        date_match = cls.DATE_PATTERN.search(raw_text)
        if date_match:
            date = date_match.group(1)

        # 3. Extract Receipt No
        receipt_no_match = cls.RECEIPT_NO_PATTERN.search(raw_text)
        if receipt_no_match:
            receipt_no = receipt_no_match.group(1)

        # 4. Extract Total Amount via Keyword matching
        for line in reversed(lines):
            upper_line = line.upper()
            if any(keyword in upper_line for keyword in cls.TOTAL_KEYWORDS):
                price = parse_turkish_price(line)
                if price is not None and price > 0:
                    total_amount = price
                    break

        # Fallback: search for largest price if keyword match failed
        if not total_amount:
            all_matches = re.findall(r'(?:\d{1,3}(?:[\.\,]\d{3})+|\d+)(?:[\.\,]\d{1,2})', raw_text)
            parsed_prices = [parse_turkish_price(m) for m in all_matches]
            valid_prices = [p for p in parsed_prices if p is not None and p > 0]
            if valid_prices:
                total_amount = max(valid_prices)

        is_valid = bool(total_amount and total_amount > 0)

        return {
            "vkn": vkn,
            "date": date,
            "receipt_no": receipt_no or "000000",
            "total_amount": total_amount or 0.0,
            "is_valid": is_valid
        }
