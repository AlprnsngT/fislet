from worker.ocr.base_engine import BaseOCREngine, OCRResult
from worker.parsers.receipt_parser import ReceiptDataParser

class PaddleOCREngine(BaseOCREngine):
    """
    Primary OCR Engine implementation using PaddleOCR.
    """

    def __init__(self):
        self._initialized = False

    def _lazy_init(self):
        if not self._initialized:
            try:
                from paddleocr import PaddleOCR
                try:
                    self.engine = PaddleOCR(use_angle_cls=True, lang='tr')
                except Exception:
                    self.engine = PaddleOCR(lang='tr')
            except Exception as e:
                self.engine = None
            self._initialized = True

    def process_image(self, image_buffer: bytes) -> OCRResult:
        self._lazy_init()
        
        if self.engine is None or not image_buffer or len(image_buffer) < 100:
            return OCRResult(
                raw_text="",
                engine_name="paddleocr",
                confidence=0.0,
                extracted_data={"vkn": None, "total_amount": None, "is_valid": False}
            )

        # Execution on PaddleOCR engine with real camera image bytes
        import numpy as np
        import cv2

        nparr = np.frombuffer(image_buffer, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return OCRResult(
                raw_text="",
                engine_name="paddleocr",
                confidence=0.0,
                extracted_data={"vkn": None, "total_amount": None, "is_valid": False}
            )

        try:
            result = self.engine.ocr(img, cls=True)
        except Exception:
            result = self.engine.ocr(img)

        raw_lines = []
        if result and result[0]:
            for line in result[0]:
                text = line[1][0]
                raw_lines.append(text)

        full_text = "\n".join(raw_lines)
        extracted = ReceiptDataParser.parse(full_text)

        return OCRResult(
            raw_text=full_text,
            engine_name="paddleocr",
            confidence=0.90,
            extracted_data=extracted
        )
