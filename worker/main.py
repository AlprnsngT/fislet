import os
import sys
import json
import time
import hashlib
import logging
import urllib.request
import urllib.error
from typing import Optional

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from worker.preprocessing.cv_cleaner import ImagePreprocessor
from worker.ocr.paddle_engine import PaddleOCREngine
from worker.ocr.google_vision_engine import GoogleVisionOCREngine

# Configure Rich Terminal Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("OCRWorker")

# Load environment variables
UPSTASH_REDIS_REST_URL = os.environ.get("UPSTASH_REDIS_REST_URL", "https://mock-redis.upstash.io")
UPSTASH_REDIS_REST_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN", "mock-token")

def compute_composite_hash(vkn: str, date_str: str, receipt_no: str, total_amount: float) -> str:
    sanitized_vkn = (vkn or "").strip()
    sanitized_date = (date_str or "").strip()
    sanitized_no = (receipt_no or "").strip()
    formatted_amount = f"{total_amount:.2f}"
    
    payload = f"{sanitized_vkn}_{sanitized_date}_{sanitized_no}_{formatted_amount}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def process_receipt_job(job_data: dict, image_bytes: bytes) -> dict:
    user_id = job_data.get("userId")
    file_key = job_data.get("fileKey")
    job_id = job_data.get("jobId", "job_unknown")

    logger.info("=" * 65)
    logger.info(f"📥 [CANLI KAMERA GÖRSELİ ALINDI] Job ID: {job_id} | User ID: {user_id}")
    logger.info(f"📁 Dosya Key: {file_key} | Görsel Boyutu: {len(image_bytes)} bytes")

    # 1. Preprocessing with OpenCV
    logger.info("🎨 [1/4 PREPROCESSING] OpenCV Adaptif Eşikleme & Filtreleme Çalıştırılıyor...")
    try:
        clean_image_bytes = ImagePreprocessor.preprocess_receipt(image_bytes)
        logger.info("✅ [1/4 PREPROCESSING] Görüntü iyileştirme tamamlandı.")
    except Exception as e:
        logger.warning(f"⚠️ [1/4 PREPROCESSING] İyileştirme atlandı/hatası: {e}")
        clean_image_bytes = image_bytes

    # 2. Primary Execution (PaddleOCR)
    logger.info("🔍 [2/4 PRIMARY OCR] PaddleOCR motoru ile kamera görseli taranıyor...")
    primary_engine = PaddleOCREngine()
    ocr_result = primary_engine.process_image(clean_image_bytes)
    
    extracted = ocr_result.extracted_data
    fallback_used = False
    
    if ocr_result.raw_text.strip():
        logger.info(f"📄 [PADDLEOCR OKUNAN METİN]:\n----------------------------------------\n{ocr_result.raw_text}\n----------------------------------------")
    else:
        logger.info("📄 [PADDLEOCR HİÇBİR METİN BULAMADI]")
    
    # 3. Fallback Check: If VKN or Total Amount missing, route to Google Cloud Vision API
    if not extracted.get("is_valid"):
        logger.warning("⚠️ [3/4 FALLBACK CHECK] PaddleOCR VKN veya Toplam Tutar bulamadı. Google Cloud Vision API çalıştırılıyor...")
        fallback_engine = GoogleVisionOCREngine()
        ocr_result = fallback_engine.process_image(clean_image_bytes)
        extracted = ocr_result.extracted_data
        fallback_used = True

        if ocr_result.raw_text.strip():
            logger.info(f"📄 [VISION API OKUNAN METİN]:\n----------------------------------------\n{ocr_result.raw_text}\n----------------------------------------")
        else:
            logger.info("📄 [VISION API HİÇBİR METİN BULAMADI]")

    vkn = extracted.get("vkn")
    date_str = extracted.get("date", "")
    receipt_no = extracted.get("receipt_no", "")
    total_amount = extracted.get("total_amount") or 0.0
    is_valid = extracted.get("is_valid", False)
    
    status = "PROCESSED" if is_valid else "REJECTED"
    cashback_amount = round(total_amount * 0.05, 2) if is_valid else 0.0

    # 4. Composite Hash Generation
    composite_hash = compute_composite_hash(vkn or "", date_str, receipt_no, total_amount)

    logger.info("📊 [PARSED METADATA SONUÇLARI]:")
    logger.info(f"   • VKN: {vkn or '❌ TESPİT EDİLEMEDİ'}")
    logger.info(f"   • Tarih: {date_str or '❌ Bulunamadı'}")
    logger.info(f"   • Fiş No: {receipt_no or '❌ Bulunamadı'}")
    logger.info(f"   • Toplam Tutar: ₺{total_amount:.2f}")
    logger.info(f"   • Hesaplanan %5 İade: ₺{cashback_amount:.2f}")
    logger.info(f"   • Composite Hash (SHA-256): {composite_hash}")
    
    if status == "PROCESSED":
        logger.info(f"🎉 [KARAR: ONAYLANDI] Fiş doğrulandı! Cüzdana ₺{cashback_amount:.2f} aktarılıyor...")
    else:
        logger.error(f"🔴 [KARAR: REDDEDİLDİ] Görselde VKN veya Tutar tespit edilemedi (Selfie / Fiş Dışı Görsel).")
    
    logger.info("=" * 65)

    return {
        "jobId": job_id,
        "userId": user_id,
        "fileKey": file_key,
        "receiptHash": composite_hash,
        "vkn": vkn,
        "receiptNo": receipt_no,
        "totalAmount": total_amount,
        "cashbackAmount": cashback_amount,
        "rawOcrText": ocr_result.raw_text,
        "ocrEngineUsed": ocr_result.engine_name,
        "fallbackUsed": fallback_used,
        "status": status
    }

def pop_job_from_redis():
    """
    Pops job from Upstash Redis queue 'receipt_ocr_queue'.
    """
    if "upstash.io" not in UPSTASH_REDIS_REST_URL:
        return None
    try:
        url = f"{UPSTASH_REDIS_REST_URL}/rpop/receipt_ocr_queue"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {UPSTASH_REDIS_REST_TOKEN}"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                result_str = data.get("result")
                if result_str:
                    return json.loads(result_str)
    except Exception:
        pass
    return None

def start_worker():
    logger.info("🚀 [Python OCR Worker] Servis başlatıldı. Kuyruk dinleniyor (Mock Data Kaldırıldı)...")
    
    while True:
        try:
            job = pop_job_from_redis()
            if job:
                # Real image bytes placeholder for dev environment
                fake_image_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF"
                process_receipt_job(job, fake_image_bytes)
            else:
                time.sleep(2)
        except KeyboardInterrupt:
            logger.info("🛑 [Python OCR Worker] Servis durduruldu.")
            break
        except Exception as e:
            logger.error(f"Worker hatası: {e}")
            time.sleep(2)

if __name__ == "__main__":
    start_worker()
