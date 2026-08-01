import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'FISOKUT-KAZAN | Fiş Tara & Cashback Kazan',
  description: 'Yüksek başarım sunan PWA fiş tarama ve anında nakit iade (cashback) platformu.',
  manifest: '/manifest.webmanifest',
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
      <body className="bg-[#090d16] text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
