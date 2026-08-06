import type { Metadata } from 'next';
import { branding } from '@/config/branding';
import type { NormalizedOperation, WebhookEvent } from '@/features/openapi/openapi-types';

const siteUrl = branding.siteUrl.replace(/\/$/, '');
const ogImagePath = '/og-image.png';
const twitterDescription =
  'API moderna para integrar WhatsApp a produtos, operacoes e automacoes com guias, OpenAPI e exemplos prontos.';

const baseKeywords = [
  'CodeChat',
  'CodeChat API',
  'WhatsApp API',
  'WhatsApp Business API',
  'API WhatsApp',
  'documentacao API',
  'OpenAPI 3.1',
  'REST API',
  'webhooks WhatsApp',
  'integracao WhatsApp',
  'automacao WhatsApp',
  'mensagens WhatsApp',
  'API Go',
];

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: Array<string | undefined | null | false>;
  type?: 'website' | 'article';
  noIndex?: boolean;
};

type JsonLdRecord = Record<string, unknown>;

function uniq(values: Array<string | undefined | null | false>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

function createOpenGraph(input: PageMetadataInput, url: string) {
  const common = {
    locale: 'pt_BR',
    url,
    siteName: branding.name,
    title: input.title,
    description: input.description,
    images: [
      {
        url: absoluteUrl(ogImagePath),
        width: 1200,
        height: 630,
        alt: input.title,
      },
    ],
  };

  if (input.type === 'article') {
    return {
      ...common,
      type: 'article' as const,
      authors: [branding.name],
    };
  }

  return {
    ...common,
    type: 'website' as const,
  };
}

export function createPageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path);
  const shouldIndex = !input.noIndex;

  return {
    title: input.title,
    description: input.description,
    applicationName: branding.name,
    authors: [{ name: branding.name, url: siteUrl }],
    creator: branding.name,
    publisher: branding.name,
    generator: 'Next.js',
    keywords: uniq([...baseKeywords, ...(input.keywords ?? [])]),
    referrer: 'origin-when-cross-origin',
    category: 'technology',
    classification: 'API documentation',
    alternates: {
      canonical: url,
      languages: {
        'pt-BR': url,
      },
    },
    robots: {
      index: shouldIndex,
      follow: true,
      nocache: false,
      googleBot: {
        index: shouldIndex,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: createOpenGraph(input, url),
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description || twitterDescription,
      images: [absoluteUrl(ogImagePath)],
    },
    other: {
      language: 'pt-BR',
      'content-language': 'pt-BR',
      rating: 'general',
      distribution: 'global',
    },
  };
}

export function createRootMetadata(): Metadata {
  return {
    ...createPageMetadata({
      title: `${branding.name} - Documentacao Oficial`,
      description: branding.description,
      path: '/',
      keywords: ['documentacao CodeChat', 'referencia CodeChat', 'API para WhatsApp'],
    }),
    metadataBase: new URL(siteUrl),
    title: {
      default: `${branding.name} - Documentacao Oficial`,
      template: `%s | ${branding.name}`,
    },
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      title: branding.shortName,
      statusBarStyle: 'black-translucent',
    },
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },
    icons: {
      icon: [{ url: '/favicon.ico' }, { url: '/icon.png', type: 'image/png' }],
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  };
}

export function createRootJsonLd(): JsonLdRecord {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: branding.shortName,
        url: siteUrl,
        logo: absoluteUrl('/logo.png'),
        sameAs: [branding.githubUrl],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: branding.name,
        url: siteUrl,
        description: branding.description,
        inLanguage: 'pt-BR',
        publisher: { '@id': `${siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/api/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebAPI',
        '@id': `${siteUrl}/#webapi`,
        name: branding.name,
        url: siteUrl,
        documentation: siteUrl,
        description: branding.description,
        provider: { '@id': `${siteUrl}/#organization` },
      },
    ],
  };
}

export function createTechArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  section?: string;
}): JsonLdRecord {
  const url = absoluteUrl(input.path);

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'pt-BR',
    articleSection: input.section ?? 'Documentacao da API',
    image: absoluteUrl(ogImagePath),
    publisher: {
      '@type': 'Organization',
      name: branding.shortName,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
  };
}

export function createApiReferenceJsonLd(input: {
  title: string;
  description: string;
  path: string;
  operationCount?: number;
  webhookCount?: number;
}): JsonLdRecord {
  const url = absoluteUrl(input.path);

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.title,
    description: input.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'pt-BR',
    about: {
      '@type': 'WebAPI',
      name: branding.name,
      documentation: siteUrl,
      endpointUrl: branding.apiUrl,
    },
    additionalProperty: [
      input.operationCount
        ? { '@type': 'PropertyValue', name: 'Operacoes HTTP', value: input.operationCount }
        : undefined,
      input.webhookCount
        ? { '@type': 'PropertyValue', name: 'Eventos de webhook', value: input.webhookCount }
        : undefined,
    ].filter(Boolean),
  };
}

export function createOperationJsonLd(operation: NormalizedOperation): JsonLdRecord {
  const path = `/api-reference/${encodeURIComponent(operation.id)}`;
  const url = absoluteUrl(path);

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: operation.summary || operation.id,
    description: operation.description || `${operation.method.toUpperCase()} ${operation.path}`,
    url,
    mainEntityOfPage: url,
    inLanguage: 'pt-BR',
    articleSection: operation.tag,
    about: {
      '@type': 'WebAPI',
      name: branding.name,
      endpointUrl: `${branding.apiUrl}${operation.path}`,
      httpMethod: operation.method.toUpperCase(),
    },
  };
}

export function createWebhookJsonLd(event: WebhookEvent): JsonLdRecord {
  const path = `/api-reference/webhooks/${encodeURIComponent(event.name)}`;
  const url = absoluteUrl(path);

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `Webhook ${event.name}`,
    description: event.description || `Payload e entrega do evento ${event.name}.`,
    url,
    mainEntityOfPage: url,
    inLanguage: 'pt-BR',
    articleSection: 'Webhooks',
    about: {
      '@type': 'WebAPI',
      name: branding.name,
      endpointUrl: branding.apiUrl,
    },
  };
}
