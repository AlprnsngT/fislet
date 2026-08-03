"""
ocr_server.py — Kalıcı PaddleOCR HTTP Servisi

Next.js API route'undan `execSync` yerine HTTP fetch ile çağrılır.
Model yalnızca bir kez yüklenir; sonraki tüm istekler <2 saniyede yanıt alır.

Çalıştırma:
    PYTHONPATH=. python3 worker/ocr_server.py

Endpoint:
    POST http://localhost:8100/scan
    Body: { "imagePath": "/abs/path/to/file.jpg" }
    veya: { "imageBase64": "data:image/jpeg;base64,..." }

Response:
    { "success": true, "rawText": "...", "totalAmount": 45.50, ... }
    { "success": false, "error": "..." }
"""

import os
import sys
import json
import base64
import tempfile
import logging

# Proje kökünü Python path'ine ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, request, jsonify
from worker.preprocessing.cv_cleaner import ImagePreprocessor
from worker.ocr.paddle_engine import PaddleOCREngine

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [OCR-SERVER] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024  # 30 MB max request body

# PaddleOCR motoru — modeli yalnızca bir kez yükle
logger.info("🔄 PaddleOCR motoru başlatılıyor (bu ~10-20 saniye sürebilir)...")
engine = PaddleOCREngine()
logger.info("✅ PaddleOCR motoru hazır. Sunucu istekleri kabul ediyor.")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "engine": "paddleocr"}), 200


@app.route('/scan', methods=['POST'])
def scan():
    try:
        data = request.get_json(force=True)
        image_bytes: bytes = b''

        if 'imagePath' in data:
            path = data['imagePath']
            if not os.path.isfile(path):
                return jsonify({"success": False, "error": f"Dosya bulunamadı: {path}"}), 400
            with open(path, 'rb') as f:
                image_bytes = f.read()

        elif 'imageBase64' in data:
            raw = data['imageBase64']
            if ',' in raw:
                raw = raw.split(',', 1)[1]
            image_bytes = base64.b64decode(raw)
            logger.info(f"📦 base64 payload başarıyla decode edildi: {len(image_bytes)} byte ({round(len(image_bytes)/1024, 1)} KB)")

        else:
            return jsonify({"success": False, "error": "imagePath veya imageBase64 zorunludur"}), 400

        if not image_bytes or len(image_bytes) < 100:
            return jsonify({"success": False, "error": f"Geçersiz veya yetersiz görüntü verisi ({len(image_bytes)} byte)"}), 400

        # Ön işleme + OCR
        clean_bytes = ImagePreprocessor.preprocess_receipt(image_bytes)
        result = engine.process_image(clean_bytes)

        logger.info(
            f"📄 OCR tamamlandı: {len(result.raw_text)} karakter | "
            f"Tutar: {result.extracted_data.get('total_amount', 0)}"
        )

        return jsonify({
            "success": bool(result.raw_text),
            "rawText": result.raw_text,
            "engineName": result.engine_name,
            "extractedData": result.extracted_data,
        }), 200

    except Exception as e:
        logger.exception(f"❌ OCR işleminde hata: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('OCR_SERVER_PORT', 8100))
    logger.info(f"🚀 OCR HTTP Servisi port {port} üzerinde başlatılıyor...")
    # threaded=False: PaddleOCR thread-safe değil, tek iş parçacığı yeterli
    app.run(host='127.0.0.1', port=port, debug=False, threaded=False)
