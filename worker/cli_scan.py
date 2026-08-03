import os
import sys
import json
import ssl
import urllib.request

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from worker.preprocessing.cv_cleaner import ImagePreprocessor
from worker.ocr.paddle_engine import PaddleOCREngine

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image URL or path provided"}))
        sys.exit(1)

    image_source = sys.argv[1]
    
    try:
        if image_source.startswith("http://") or image_source.startswith("https://"):
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            req = urllib.request.Request(image_source, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                image_bytes = resp.read()
        else:
            with open(image_source, "rb") as f:
                image_bytes = f.read()

        clean_bytes = ImagePreprocessor.preprocess_receipt(image_bytes)
        engine = PaddleOCREngine()
        result = engine.process_image(clean_bytes)

        output = {
            "success": True,
            "rawText": result.raw_text,
            "engineName": result.engine_name,
            "extractedData": result.extracted_data
        }
        print(json.dumps(output, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
