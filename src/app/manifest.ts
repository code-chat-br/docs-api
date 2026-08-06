import type { MetadataRoute } from 'next';
import { branding } from '@/config/branding';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${branding.name} - Documentacao Oficial`,
    short_name: branding.shortName,
    description: branding.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#05070b',
    theme_color: '#05070b',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
