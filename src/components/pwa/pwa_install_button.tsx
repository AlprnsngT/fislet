'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PwaInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detect if user is on iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // 2. Detect if app is already running in standalone mode (installed)
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
    if (isInstalled) return;

    if (deferredPrompt) {
      // Trigger native browser install prompt for Chrome, Edge, Brave, Android
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // Show iOS instruction modal for Safari iPhone/iPad users
      setShowIosModal(true);
    } else {
      // Fallback: Trigger native prompt or show guide
      setShowIosModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Uygulama Yüklendi</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="glass-button px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow-lg flex items-center space-x-2 active:scale-95 transition-transform"
        title="FisOkut PWA Uygulamasını Cihaza İndir / Yükle"
      >
        <Download className="w-4 h-4 text-emerald-400" />
        <span>Uygulamayı İndir</span>
      </button>

      {/* iOS & Manual Installation Instruction Modal */}
      <AnimatePresence>
        {showIosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm glass-card rounded-3xl border border-emerald-500/30 bg-[#0c101d] text-gray-100 p-6 space-y-5"
            >
              <button
                onClick={() => setShowIosModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Uygulamayı Cihaza Yükle</h3>
                  <p className="text-xs text-gray-400">Tek tıkla ana ekranınıza ekleyin</p>
                </div>
              </div>

              {isIos ? (
                <div className="space-y-3 text-xs bg-gray-900/90 p-4 rounded-2xl border border-gray-800">
                  <div className="flex items-center space-x-3 text-gray-300">
                    <span className="font-bold text-emerald-400">1. Adım:</span>
                    <Share className="w-4 h-4 text-blue-400" />
                    <span>Safari alt menüsündeki <b>Paylaş</b> butonuna dokunun.</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300">
                    <span className="font-bold text-emerald-400">2. Adım:</span>
                    <PlusSquare className="w-4 h-4 text-emerald-400" />
                    <span>Açılan listede <b>Ana Ekrana Ekle</b> seçeneğini seçin.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-gray-300 bg-gray-900/90 p-4 rounded-2xl border border-gray-800">
                  <p>Tarayıcınızın sağ üst menüsünden (⋮) <b>"Uygulamayı Yükle"</b> veya <b>"Masaüstüne Ekle"</b> butonuna basarak FisOkut uygulamasını hemen yükleyebilirsiniz.</p>
                </div>
              )}

              <button
                onClick={() => setShowIosModal(false)}
                className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-lg"
              >
                Anladım
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
