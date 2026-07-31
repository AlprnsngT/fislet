from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class OCRResult:
    def __init__(self, raw_text: str, engine_name: str, confidence: float, extracted_data: Optional[Dict[str, Any]] = None):
        self.raw_text = raw_text
        self.engine_name = engine_name
        self.confidence = confidence
        self.extracted_data = extracted_data or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw_text": self.raw_text,
            "engine_name": self.engine_name,
            "confidence": self.confidence,
            "extracted_data": self.extracted_data
        }

class BaseOCREngine(ABC):
    """
    Abstract Base Class for OCR engines following Open/Closed Principle (OCP).
    New OCR providers (Tesseract, AWS Textract, etc.) can be added by extending this class.
    """
    
    @abstractmethod
    def process_image(self, image_buffer: bytes) -> OCRResult:
        """
        Process image bytes and return structured OCRResult.
        """
        pass
