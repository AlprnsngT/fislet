try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

class ImagePreprocessor:
    """
    OpenCV Preprocessing pipeline for thermal receipt enhancement.
    Applies grayscale, adaptive thresholding, and noise reduction.
    """

    @staticmethod
    def preprocess_receipt(image_bytes: bytes) -> bytes:
        if not HAS_OPENCV:
            # Fallback for dev environments without OpenCV installed
            return image_bytes

        # Decode image from byte buffer
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Invalid image bytes provided to OpenCV preprocessor")

        # 1. Grayscale conversion
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 2. Noise reduction with Bilateral Filter (preserves edges)
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)

        # 3. Adaptive Thresholding for thermal paper contrast enhancement
        thresh = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            15
        )

        # Encode back to JPEG byte buffer
        success, encoded_img = cv2.imencode('.jpg', thresh)
        if not success:
            return image_bytes

        return encoded_img.tobytes()
