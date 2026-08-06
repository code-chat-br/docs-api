import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { loadApiReference } from '@/features/openapi/openapi-loader';
import { absoluteUrl } from '@/lib/seo';

const sitemapImage = absoluteUrl('/og-image.png');

function entry(
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
    images: [sitemapImage],
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const updated = new Date();
  const { spec, webhooks } = await loadApiReference();

  return [
    entry('/', updated, 'weekly', 1),
    entry('/api-reference', updated, 'weekly', 0.9),
    entry('/api-reference/webhooks', updated, 'weekly', 0.85),
    ...source.getPages().map((page) => ({
      url: absoluteUrl(page.url),
      lastModified: updated,
      changeFrequency: 'weekly' as const,
      priority: page.url === '/docs' ? 0.9 : 0.7,
      images: [sitemapImage],
    })),
    ...spec.operations.map((operation) =>
      entry(
        `/api-reference/${encodeURIComponent(operation.id)}`,
        updated,
        'weekly',
        operation.deprecated ? 0.55 : 0.75,
      ),
    ),
    ...webhooks.events.map((event) =>
      entry(`/api-reference/webhooks/${encodeURIComponent(event.name)}`, updated, 'weekly', 0.65),
    ),
  ];
}
