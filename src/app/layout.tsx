import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FISOKUT-KAZAN | Fiş Tara & Cashback Kazan',
  description: 'Yüksek başarım sunan PWA fiş tarama ve anında nakit iade (cashback) platformu.',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
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
