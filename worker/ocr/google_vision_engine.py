import os
from worker.ocr.base_engine import BaseOCREngine, OCRResult
from worker.parsers.receipt_parser import ReceiptDataParser

class GoogleVisionOCREngine(BaseOCREngine):
    """
    Fallback OCR Engine using Google Cloud Vision API.
    Triggered when Primary OCR (PaddleOCR) fails to reliably extract VKN or Total Amount.
    """

    def process_image(self, image_buffer: bytes) -> OCRResult:
        if not image_buffer or len(image_buffer) < 100:
            return OCRResult(
                raw_text="",
                engine_name="google_cloud_vision",
                confidence=0.0,
                extracted_data={"vkn": None, "total_amount": None, "is_valid": False}
            )

        try:
            from google.cloud import vision
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=image_buffer)

            response = client.text_detection(image=image)
            texts = response.text_annotations

            if texts:
                full_text = texts[0].description
            else:
                full_text = ""

            extracted = ReceiptDataParser.parse(full_text)

            return OCRResult(
                raw_text=full_text,
                engine_name="google_cloud_vision",
                confidence=0.98,
                extracted_data=extracted
            )
        except Exception as e:
            return OCRResult(
                raw_text="",
                engine_name="google_cloud_vision",
                confidence=0.0,
                extracted_data={"vkn": None, "total_amount": None, "is_valid": False}
            )
