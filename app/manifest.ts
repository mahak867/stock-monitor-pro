import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StockPro Terminal',
    short_name: 'StockPro',
    description: 'Real-time stocks, portfolio analytics, and AI trading assistant for US, India & Crypto markets.',
    start_url: '/',
    display: 'standalone',
    background_color: '#03030a',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    icons: [
      { src: '/next.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    categories: ['finance', 'productivity'],
  };
}
