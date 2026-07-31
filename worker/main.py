import os
import sys
import json
import time
import hashlib
from typing import Optional

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from worker.preprocessing.cv_cleaner import ImagePreprocessor
from worker.ocr.paddle_engine import PaddleOCREngine
from worker.ocr.google_vision_engine import GoogleVisionOCREngine

def compute_composite_hash(vkn: str, date_str: str, receipt_no: str, total_amount: float) -> str:
    """
    Computes SHA-256(VKN + Date + ReceiptNo + TotalAmount) per Project.md specification.
    """
    sanitized_vkn = (vkn or "").strip()
    sanitized_date = (date_str or "").strip()
    sanitized_no = (receipt_no or "").strip()
    formatted_amount = f"{total_amount:.2f}"
    
    payload = f"{sanitized_vkn}_{sanitized_date}_{sanitized_no}_{formatted_amount}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def process_receipt_job(job_data: dict) -> dict:
    """
    Processes a single OCR job following the hybrid OCR strategy:
    1. Preprocessing (OpenCV thresholding)
    2. Primary Execution (PaddleOCR)
    3. Fallback Check (Google Cloud Vision if VKN or Total Amount is missing)
    4. Composite Hash Generation
    """
    user_id = job_data.get("userId")
    file_key = job_data.get("fileKey")
    
    # Mock download image buffer (In production, fetched from Cloudflare R2 via R2 SDK)
    raw_image_bytes = b"MOCK_IMAGE_BYTES_PLACEHOLDER"
    
    # 1. Preprocessing with OpenCV
    try:
        clean_image_bytes = ImagePreprocessor.preprocess_receipt(raw_image_bytes)
    except Exception:
        clean_image_bytes = raw_image_bytes

    # 2. Primary Execution (PaddleOCR)
    primary_engine = PaddleOCREngine()
    ocr_result = primary_engine.process_image(clean_image_bytes)
    
    extracted = ocr_result.extracted_data
    fallback_used = False
    
    # 3. Fallback Check: If VKN or Total Amount missing, route to Google Cloud Vision API
    if not extracted.get("is_valid"):
        fallback_engine = GoogleVisionOCREngine()
        ocr_result = fallback_engine.process_image(clean_image_bytes)
        extracted = ocr_result.extracted_data
        fallback_used = True

    vkn = extracted.get("vkn", "0000000000")
    date_str = extracted.get("date", "31.07.2026")
    receipt_no = extracted.get("receipt_no", "000000")
    total_amount = extracted.get("total_amount", 0.0)
    
    # 4. Composite Hash Generation
    composite_hash = compute_composite_hash(vkn, date_str, receipt_no, total_amount)
    cashback_amount = round(total_amount * 0.05, 2) # 5% reward

    return {
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
        "status": "PROCESSED"
    }

if __name__ == "__main__":
    print("[Python OCR Worker] Service started. Waiting for jobs...")
    # Example dry-run execution test
    sample_job = {"jobId": "test_1", "userId": "usr_test123", "fileKey": "uploads/usr_test123/receipt.jpg"}
    res = process_receipt_job(sample_job)
    print("[Python OCR Worker] Processed result sample:", json.dumps(res, indent=2, ensure_ascii=False))
