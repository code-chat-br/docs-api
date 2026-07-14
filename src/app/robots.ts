import type { MetadataRoute } from 'next';
import { branding } from '@/config/branding';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${branding.siteUrl}/sitemap.xml`,
  };
}
