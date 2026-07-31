'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, UploadCloud, CheckCircle2, AlertCircle, FileUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface CameraViewProps {
  userId: string;
  onScanComplete: (result: any) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ userId, onScanComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, [stream]);

  // Bind media stream to video element whenever video element is mounted in DOM
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .then(() => setIsStreaming(true))
        .catch((err) => {
          console.error('Video play error:', err);
          setErrorMessage('Video akışı başlatılamadı. Dosya yükleme seçeneğini deneyin.');
        });
    }
  }, [stream]);

  const startCamera = async () => {
    setErrorMessage(null);
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      // 1. Try environment camera (mobile back camera)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsStreaming(true);
      setStatusMessage(null);
    } catch (err: any) {
      console.warn('Environment camera failed, trying fallback webcam constraints:', err);
      try {
        // 2. Fallback for laptop webcams or devices with single camera
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        setStream(fallbackStream);
        setIsStreaming(true);
        setStatusMessage(null);
      } catch (fallbackErr: any) {
        console.error('All camera attempts failed:', fallbackErr);
        setIsStreaming(false);
        setErrorMessage(
          'Kamera akışı başlatılamadı (Kamera yok veya tarayıcı engelledi). Lütfen "Dosya Yükle" butonunu kullanın.'
        );
      }
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
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    setStatusMessage('Cloudflare R2 Yükleme URL\'si alınıyor...');

    try {
      const presignedRes = await fetch('/api/v1/receipts/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, filename: `receipt_${Date.now()}.jpg` }),
      });

      const presignedData = await presignedRes.json();
      if (!presignedRes.ok) throw new Error(presignedData.error || 'Upload URL hatası');

      setStatusMessage('Fiş görseli R2 depolama alanına aktarılıyor...');

      const processRes = await fetch('/api/v1/receipts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fileKey: presignedData.fileKey }),
      });

      const processData = await processRes.json();
      if (!processRes.ok) throw new Error(processData.error || 'İşleme hatası');

      setStatusMessage('Fiş başarıyla kuyruğa alındı! OCR işleniyor...');
      onScanComplete(processData);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`İşlem Hatası: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden glass-card flex flex-col items-center justify-center border border-emerald-500/20 shadow-xl">
        {!isStreaming && !capturedImage && (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-10 h-10 text-emerald-400" />
            </div>

            <h3 className="text-xl font-bold text-white">Fişinizi Tara & İade Al</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Kameranızla fişinizi anında tarayın veya galerinizden fiş görselini seçin.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
              <button
                onClick={startCamera}
                className="flex-1 glass-button py-3 rounded-xl font-semibold text-xs text-white flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Kamerayı Aç</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 rounded-xl font-semibold text-xs text-gray-200 bg-gray-800/80 border border-gray-700 hover:bg-gray-700/80 flex items-center justify-center space-x-2 transition-colors"
              >
                <FileUp className="w-4 h-4 text-emerald-400" />
                <span>Dosya Yükle</span>
              </button>
            </div>
          </div>
        )}

        {isStreaming && (
          <div className="relative w-full h-full bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-6 rounded-xl scanner-overlay pointer-events-none flex flex-col justify-between p-4">
              <div className="w-full h-1 bg-gradient-to-r from-emerald-500 to-green-400 animate-scan-line rounded-full" />
              <p className="text-xs text-center text-emerald-300 bg-black/70 py-1 px-2 rounded-md">
                Fişi çerçevenin ortasına hizalayın
              </p>
            </div>

            <div className="absolute bottom-6 inset-x-0 flex justify-center space-x-4">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-xl flex items-center justify-center active:scale-95 transition-transform"
              >
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
                className="flex-1 py-3 px-4 rounded-xl bg-gray-900/90 text-white font-medium text-xs border border-gray-700 flex items-center justify-center space-x-2"
                disabled={isUploading}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tekrar Çek</span>
              </button>

              <button
                onClick={handleUploadAndProcess}
                className="flex-1 glass-button py-3 px-4 rounded-xl text-white font-medium text-xs flex items-center justify-center space-x-2"
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

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 w-full p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 w-full p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </motion.div>
      )}
    </div>
  );
};
