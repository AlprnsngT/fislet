'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraViewProps {
  userId: string;
  onScanComplete: (result: any) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ userId, onScanComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        setStatusMessage(null);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setStatusMessage('Kamera erişimi sağlanamadı. Lütfen izin verin veya dosya yüklemeyi deneyin.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setIsStreaming(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  }, []);

  const handleUploadAndProcess = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    setStatusMessage('Cloudflare R2 Yükleme URL\'si alınıyor...');

    try {
      // 1. Get Presigned Upload URL
      const presignedRes = await fetch('/api/v1/receipts/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, filename: `receipt_${Date.now()}.jpg` }),
      });

      const presignedData = await presignedRes.json();
      if (!presignedRes.ok) throw new Error(presignedData.error || 'Presigned URL hatası');

      setStatusMessage('Fiş görseli güvenli depolamaya aktarılıyor...');

      // 2. Enqueue for hybrid OCR processing
      const processRes = await fetch('/api/v1/receipts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fileKey: presignedData.fileKey }),
      });

      const processData = await processRes.json();
      if (!processRes.ok) throw new Error(processData.error || 'İşleme hatası');

      setStatusMessage('Fiş kuyruğa alındı! OCR işleniyor...');
      onScanComplete(processData);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`İşlem Hatası: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center">
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden glass-card flex flex-col items-center justify-center border border-emerald-500/20">
        {!isStreaming && !capturedImage && (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white">Fişinizi Tarayın</h3>
            <p className="text-sm text-gray-400">Fişinizi hizalama alanının içine yerleştirip net bir fotoğraf çekin.</p>
            <button onClick={startCamera} className="glass-button px-6 py-3 rounded-xl font-semibold text-white flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Kamerayı Aç</span>
            </button>
          </div>
        )}

        {isStreaming && (
          <div className="relative w-full h-full">
            <video ref={videoRef} playsInline className="w-full h-full object-cover" />
            
            {/* Document Overlay Bounds */}
            <div className="absolute inset-6 rounded-xl scanner-overlay pointer-events-none flex flex-col justify-between p-4">
              <div className="w-full h-1 bg-gradient-to-r from-emerald-500 to-green-400 animate-scan-line rounded-full" />
              <p className="text-xs text-center text-emerald-300 bg-black/60 py-1 rounded-md">Fişi çerçevenin ortasına hizalayın</p>
            </div>

            <div className="absolute bottom-6 inset-x-0 flex justify-center space-x-4">
              <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                <div className="w-12 h-12 rounded-full bg-emerald-600" />
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <img src={capturedImage} alt="Captured receipt" className="w-full h-full object-cover" />
            
            <div className="absolute bottom-4 inset-x-4 flex justify-between space-x-2">
              <button
                onClick={() => { setCapturedImage(null); startCamera(); }}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-800/80 text-white font-medium text-sm border border-gray-700 flex items-center justify-center space-x-2"
                disabled={isUploading}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tekrar Çek</span>
              </button>
              
              <button
                onClick={handleUploadAndProcess}
                className="flex-1 glass-button py-3 px-4 rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2"
                disabled={isUploading}
              >
                {isUploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Gönder & Kazan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 w-full p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </motion.div>
      )}
    </div>
  );
};
