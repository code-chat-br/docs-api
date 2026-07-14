import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { branding } from '@/config/branding';

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();
  return [
    { url: branding.siteUrl, lastModified: updated, changeFrequency: 'weekly', priority: 1 },
    { url: `${branding.siteUrl}/api-reference`, lastModified: updated, changeFrequency: 'weekly', priority: 0.9 },
    ...source.getPages().map((page) => ({
      url: `${branding.siteUrl}${page.url}`,
      lastModified: updated,
      changeFrequency: 'weekly' as const,
      priority: page.url === '/docs' ? 0.9 : 0.7,
    })),
  ];
}
