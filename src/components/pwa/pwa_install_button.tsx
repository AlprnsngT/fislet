'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share, PlusSquare, X, CheckCircle2, Laptop, Smartphone, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PwaInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    // 1. Detect if user is on iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // 2. Detect if app is running in standalone mode (installed)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isInStandaloneMode) {
      setIsInstalled(true);
    }

    // 3. Listen to Chrome / Edge / Android PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // 1. If deferredPrompt exists (Chrome/Edge/Brave/Android), launch native prompt directly!
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn('Native PWA prompt error:', err);
      }
    }

    // 2. Open dimmed backdrop modal (portal at body top z-[99999])
    setShowModal(true);
  };

  const modalContent = (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="relative w-full max-w-md rounded-3xl border border-emerald-500/40 bg-[#0c101d] text-gray-100 p-6 shadow-2xl space-y-5"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon & Title */}
            <div className="flex items-center space-x-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {isInstalled ? <CheckCircle2 className="w-7 h-7" /> : <Download className="w-7 h-7" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {isInstalled ? 'Uygulama Zaten Yüklü' : 'FisOkut Cihaza Yükle'}
                </h3>
                <p className="text-xs text-gray-400">
                  {isInstalled ? 'Uygulama cihazınızda çalışıyor' : 'Masaüstü ve Mobil PWA İndirme Rehberi'}
                </p>
              </div>
            </div>

            {/* Content Body */}
            {isInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
                <div className="flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>FISOKUT-KAZAN bilgisayarınızda / telefonunuzda hazır!</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Uygulamanız cihazınızın masaüstüne veya uygulama listesine eklendi. Doğrudan ikonuna basarak başlatabilirsiniz.
                </p>
              </div>
            ) : isIos ? (
              <div className="space-y-3 text-xs bg-gray-900/90 p-4 rounded-2xl border border-gray-800/80">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
                  <Smartphone className="w-4 h-4" />
                  <span>iPhone / iPad (iOS Safari) İçin Yükleme:</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <span className="font-bold text-emerald-400">1. Adım:</span>
                  <Share className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Safari alt çubuğundaki <b>Paylaş</b> ikonuna dokunun.</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <span className="font-bold text-emerald-400">2. Adım:</span>
                  <PlusSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Listeyi aşağı kaydırıp <b>Ana Ekrana Ekle</b>'ye basın.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs bg-gray-900/90 p-4 rounded-2xl border border-gray-800/80">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
                  <Laptop className="w-4 h-4" />
                  <span>Masaüstü (Mac / Windows) & Android İçin Yükleme:</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Tarayıcınızın adres çubuğunun sağ tarafındaki <b>"Uygulamayı Yükle" (⊕ / 📥)</b> simgesine veya sağ üst menüden (⋮) <b>"FisOkut Yükle"</b> seçeneğine tıklayabilirsiniz.
                </p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-lg active:scale-95 transition-transform"
            >
              Tamam
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="glass-button px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow-lg flex items-center space-x-2 active:scale-95 transition-transform"
        title="FisOkut PWA Uygulamasını Cihaza İndir / Yükle"
      >
        {isInstalled ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Uygulama Yüklü</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>Uygulamayı İndir</span>
          </>
        )}
      </button>

      {/* Render Modal into React Portal at top of Document Body */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
};
