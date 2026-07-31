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
                self.engine = PaddleOCR(use_angle_cls=True, lang='tr', show_log=False)
            except ImportError:
                self.engine = None
            self._initialized = True

    def process_image(self, image_buffer: bytes) -> OCRResult:
        self._lazy_init()
        
        if self.engine is None:
            # Fallback mock for local dev environment when paddleocr package isn't installed
            mock_text = "Firma: A101 MARKET\nVKN: 1234567890\nTARIH: 31.07.2026\nFIS NO: 0042\nTOPLAM: 154.50 TL"
            extracted = ReceiptDataParser.parse(mock_text)
            return OCRResult(
                raw_text=mock_text,
                engine_name="paddle_mock",
                confidence=0.95,
                extracted_data=extracted
            )

        # Execution on PaddleOCR engine
        import numpy as np
        import cv2

        nparr = np.frombuffer(image_buffer, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        result = self.engine.ocr(img, cls=True)
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
