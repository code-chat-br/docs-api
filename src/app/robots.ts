import type { MetadataRoute } from 'next';
import { branding } from '@/config/branding';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/search'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/search'],
      },
    ],
    sitemap: `${branding.siteUrl}/sitemap.xml`,
    host: branding.siteUrl,
  };
}
