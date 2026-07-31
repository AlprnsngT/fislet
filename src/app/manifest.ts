import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FISOKUT-KAZAN',
    short_name: 'FisOkut',
    description: 'Fişlerini Tara, Anında Nakit Cashback Kazan!',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
