'use client';

import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export const PwaInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isReadyToInstall, setIsReadyToInstall] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if app is running as an installed standalone PWA
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // 2. Listen to Chrome / Edge / Android PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReadyToInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsReadyToInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setIsReadyToInstall(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install prompt execution error:', err);
      }
    } else {
      // Fallback: If prompt event hasn't fired or user is on Safari
      alert('PWA Yükleme: Tarayıcınızın adres çubuğundaki (⊕) simgesinden veya sağ üst menüden (⋮) "FisOkut Yükle" seçeneğine tıklayabilirsiniz.');
    }
  };

  // IF ALREADY INSTALLED -> HIDE BUTTON COMPLETELY
  if (isInstalled) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="glass-button px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg flex items-center space-x-2 active:scale-95 transition-transform"
      title="FisOkut PWA Uygulamasını Cihaza İndir / Yükle"
    >
      <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
      <span>Uygulamayı İndir</span>
    </button>
  );
};
