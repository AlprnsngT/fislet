"""
test_receipt_parser_tier1.py

Tier 1 fuzzy keyword matching + multi-line lookahead parser için birim testler.
Kapsanan senaryolar:
  1. Normal termal fiş (TOPLAM satırda tutar mevcut)
  2. E-Arşiv / ÖDENECEK TUTAR (tutar aynı satırda)
  3. Multi-line layout (etiket bir satır, tutar alt satır)
  4. OCR bozukluğu: TOPT AM, T0PLAM, ODENECEK (yazım hatası)
  5. Türkçe binlik ayracı: 1.450,50 TL
  6. Sadece tutar var, etiket yok (bottom-half heuristic)
  7. Boş metin → is_valid=False
"""

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from worker.parsers.receipt_parser import ReceiptDataParser, RAPIDFUZZ_AVAILABLE

# ── Renk kodları ─────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

passed = 0
failed = 0

def check(test_name: str, result: dict, expected_total: float, expect_valid: bool = True, tolerance: float = 0.01):
    global passed, failed
    total   = result.get("total_amount", 0.0)
    is_val  = result.get("is_valid", False)

    ok_total = abs(total - expected_total) <= tolerance
    ok_valid = (is_val == expect_valid)

    if ok_total and ok_valid:
        print(f"{GREEN}✅ PASS{RESET}  {test_name}  → total={total:.2f}  valid={is_val}")
        passed += 1
    else:
        print(f"{RED}❌ FAIL{RESET}  {test_name}")
        if not ok_total:
            print(f"       total beklenen: {expected_total:.2f}  elde edilen: {total:.2f}")
        if not ok_valid:
            print(f"       is_valid beklenen: {expect_valid}  elde edilen: {is_val}")
        failed += 1


print(f"\n{BOLD}{'='*60}{RESET}")
print(f"{BOLD}  Receipt Parser Tier 1 — Birim Testleri{RESET}")
print(f"  rapidfuzz mevcut: {'EVET ✓' if RAPIDFUZZ_AVAILABLE else 'HAYIR ✗ (fallback substring)'}")
print(f"{BOLD}{'='*60}{RESET}\n")


# ── Test 1: Normal termal fiş ────────────────────────────────────────────────
t1 = """
HOŞGELDİNİZ
MIGROS MARKET
VKN: 1234567890
TARİH: 01.08.2026 14:30
1  SÜZME YOĞURT     32,90 TL
2  EKMEK             5,00 TL
TOPLAM            37,90 TL
KDV %18            6,82 TL
"""
check("Test 1: Termal fiş (TOPLAM satırda)", ReceiptDataParser.parse(t1), 37.90)


# ── Test 2: E-Arşiv / ÖDENECEK TUTAR ─────────────────────────────────────────
t2 = """
E-ARŞİV FATURA
SATIŞ FATURASI
VKN: 9876543210
Tarih: 15.07.2026
Hizmet Bedeli: 1.200,00 TL
KDV (%18): 216,00 TL
ÖDENECEK TUTAR: 1.416,00 TL
"""
check("Test 2: E-Arşiv ÖDENECEK TUTAR", ReceiptDataParser.parse(t2), 1416.00)


# ── Test 3: Multi-line layout (etiket + alt satırda tutar) ───────────────────
t3 = """
CAFE ISTANBUL
VKN: 1122334455
02.08.2026 11:15
CAY x2         10,00
SANDVIC         25,00
------------
TOPLAM
35,00 TL
"""
check("Test 3: Multi-line (etiket + alt satır tutar)", ReceiptDataParser.parse(t3), 35.00)


# ── Test 4a: OCR bozukluğu TOPT AM ───────────────────────────────────────────
t4a = """
BIM MARKET
VKN: 5544332211
03.08.2026
DETERJAN       18,50
SIVI YAG       42,00
TOPT AM        60,50 TL
"""
check("Test 4a: OCR bozuk 'TOPT AM'", ReceiptDataParser.parse(t4a), 60.50)


# ── Test 4b: OCR bozukluğu T0PLAM (sıfır) ────────────────────────────────────
t4b = """
A101 MARKET
VKN: 6677889900
T0PLAM TUTAR: 125,75 TL
"""
check("Test 4b: OCR bozuk 'T0PLAM'", ReceiptDataParser.parse(t4b), 125.75)


# ── Test 4c: OCR bozukluğu ODENECEK (ş harfsiz) ──────────────────────────────
t4c = """
E-FATURA
VKN: 1029384756
ODENECEK TUTAR: 2.345,00 TL
"""
check("Test 4c: OCR bozuk 'ODENECEK' (ş/ö harfsiz)", ReceiptDataParser.parse(t4c), 2345.00)


# ── Test 5: Türkçe binlik ayracı 1.450,50 ─────────────────────────────────────
t5 = """
TEKNOSA
VKN: 1357924680
Ürün: Telefon
GENEL TOPLAM: 1.450,50 TL
"""
check("Test 5: Türkçe binlik 1.450,50", ReceiptDataParser.parse(t5), 1450.50)


# ── Test 6: Etiket yok, sadece tutarlar (bottom-half heuristic) ───────────────
t6 = """
MARKETİM
15,00
32,50
12,75
60,25
"""
# Bottom-half heuristicte en büyük değer bulunmalı
check("Test 6: Etiket yok, bottom-half heuristic (max)", ReceiptDataParser.parse(t6), 60.25)


# ── Test 7: Boş metin ─────────────────────────────────────────────────────────
t7 = ""
check("Test 7: Boş metin → is_valid=False", ReceiptDataParser.parse(t7), 0.0, expect_valid=False)


# ── Test 8: NAKİT satırıyla ödeme ─────────────────────────────────────────────
t8 = """
ŞOK MARKET
VKN: 2468013579
04.08.2026 09:45
EKMEK          4,50
SÜT           14,00
TOPLAM        18,50
NAKİT         20,00
PARA ÜSTÜ      1,50
"""
# TOPLAM (18,50) en altta NAKIT'ten önce → TOPLAM yakalanmalı
check("Test 8: NAKİT vs TOPLAM (TOPLAM önce yakalanmalı)", ReceiptDataParser.parse(t8), 18.50)


# ── Test 9: Türkçe karakter kombinasyonu ÖDENECEK (ö ve ş) ───────────────────
t9 = """
SANAL POS FATURASI
VKN: 9182736450
Ürün Tutarı: 850,00 TL
KDV: 153,00 TL
ÖDENECEK: 1.003,00 TL
"""
check("Test 9: ÖDENECEK tek kelime", ReceiptDataParser.parse(t9), 1003.00)


# ── Test 10: NET TUTAR ────────────────────────────────────────────────────────
t10 = """
HEPSİBURADA
Sipariş No: TRK123456
Kargo Ücreti: 0,00 TL
Ürün Fiyatı: 599,00 TL
NET TUTAR: 599,00 TL
"""
check("Test 10: NET TUTAR", ReceiptDataParser.parse(t10), 599.00)


# ── Özet ─────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}{'='*60}{RESET}")
total_tests = passed + failed
print(f"  Toplam: {total_tests}  |  {GREEN}Geçti: {passed}{RESET}  |  {RED}Kaldı: {failed}{RESET}")
if failed == 0:
    print(f"\n{GREEN}{BOLD}🎉 TÜM TESTLER BAŞARILI!{RESET}")
else:
    print(f"\n{YELLOW}{BOLD}⚠️  {failed} test başarısız oldu. Parser güncellenmeli.{RESET}")
print(f"{BOLD}{'='*60}{RESET}\n")
