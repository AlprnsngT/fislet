import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'FISOKUT-KAZAN | Fiş Tara & Cashback Kazan',
  description: 'Yüksek başarım sunan PWA fiş tarama ve anında nakit iade (cashback) platformu.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/Logo.png', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/Logo.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FisOkut',
  },
};

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FisOkut" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="FisOkut" />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
      </head>
      <body className="bg-[#090d16] text-gray-100 antialiased min-h-screen">
        {children}

        {/* Service Worker Registration for macOS Desktop, Windows, iOS, Android PWA Installation */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(reg) {
                    console.log('PWA ServiceWorker registered successfully:', reg.scope);
                  },
                  function(err) {
                    console.warn('PWA ServiceWorker registration failed:', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
