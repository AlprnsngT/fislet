from worker.ocr.base_engine import BaseOCREngine, OCRResult
from worker.parsers.receipt_parser import ReceiptDataParser

class PaddleOCREngine(BaseOCREngine):
    """
    Primary OCR Engine implementation using PaddleOCR / PaddleX.
    Uses PP-OCRv6 clean detection and recognition pipeline without document unwarping artifacts.
    """

    def __init__(self):
        self._initialized = False
        self.engine = None

    def _lazy_init(self):
        if not self._initialized:
            try:
                from paddleocr import PaddleOCR
                try:
                    # Clean initialization disabling doc unwarping / orientation distortion
                    self.engine = PaddleOCR(
                        use_doc_orientation_classify=False,
                        use_doc_unwarping=False,
                        use_textline_orientation=False,
                        lang='tr'
                    )
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

        raw_lines = []
        try:
            # Predict using PaddleOCR engine
            res = self.engine.predict(img)
            for r in res:
                if isinstance(r, dict) and 'rec_texts' in r:
                    raw_lines.extend(r['rec_texts'])
                elif isinstance(r, list):
                    for item in r:
                        if isinstance(item, list) and len(item) > 1 and isinstance(item[1], (list, tuple)):
                            raw_lines.append(item[1][0])
                        elif isinstance(item, str):
                            raw_lines.append(item)
        except Exception:
            try:
                res = self.engine.ocr(img)
                if res and isinstance(res, list):
                    for sub in res:
                        if isinstance(sub, list):
                            for item in sub:
                                if isinstance(item, (list, tuple)) and len(item) > 1 and isinstance(item[1], (list, tuple)):
                                    raw_lines.append(item[1][0])
            except Exception:
                pass

        full_text = "\n".join(raw_lines)
        extracted = ReceiptDataParser.parse(full_text)

        return OCRResult(
            raw_text=full_text,
            engine_name="paddleocr",
            confidence=0.95 if full_text else 0.0,
            extracted_data=extracted
        )
