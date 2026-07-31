import re
from typing import Dict, Any, Optional

class ReceiptDataParser:
    """
    Regex parser for Turkish thermal shopping receipts.
    Extracts VKN (10-digit), Date/Time, Receipt No, and Total Amount.
    """

    # VKN Regex: Exact 10 digits
    VKN_PATTERN = re.compile(r'\b\d{10}\b')
    
    # Date Regex: DD/MM/YYYY or DD.MM.YYYY
    DATE_PATTERN = re.compile(r'\b(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})\b')
    
    # Receipt Number Regex: Fiş No / Z No
    RECEIPT_NO_PATTERN = re.compile(r'(?:FI[ŞS]\s*NO|Z\s*NO|F[Iİ]S\s*NO)\s*[:\.]?\s*(\d+)', re.IGNORECASE)

    # Total Amount Keyword matching (TOPLAM, ÖDENEN, KART) + currency float regex
    TOTAL_KEYWORDS = ['TOPLAM', 'ÖDENEN', 'ODENEN', 'KART', 'TUTAR', 'TOP']
    AMOUNT_PATTERN = re.compile(r'(\d+[,\.]\d{2})')

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
                amount_match = cls.AMOUNT_PATTERN.search(line)
                if amount_match:
                    amount_str = amount_match.group(1).replace(',', '.')
                    try:
                        total_amount = float(amount_str)
                        break
                    except ValueError:
                        continue

        is_valid = bool(vkn and total_amount)

        return {
            "vkn": vkn,
            "date": date,
            "receipt_no": receipt_no or "000000",
            "total_amount": total_amount,
            "is_valid": is_valid
        }
