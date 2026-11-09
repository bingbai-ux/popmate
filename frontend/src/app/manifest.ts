import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'POPMATE',
    short_name: 'POPMATE',
    description: 'プライスポップ作成サービス',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFFFFF',
    theme_color: '#FFFFFF',
    scope: '/',
    lang: 'ja',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
