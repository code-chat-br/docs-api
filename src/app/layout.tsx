import { RootProvider } from 'fumadocs-ui/provider/next';
import '../styles/tokens.css';
import './global.css';
import './api-reference/reference.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { uiTranslations } from '@/config/ui-translations';

const siteUrl = 'https://docs.codechat.dev';
const title = 'CodeChat API — Documentação Oficial';
const description =
  'API moderna para integrar WhatsApp a produtos, operações e automações. Guias completos, referência OpenAPI 3.1 e exemplos prontos.';
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CodeChat API',
  url: siteUrl,
  description: 'API moderna para integração com WhatsApp.',
  inLanguage: 'pt-BR',
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s | CodeChat API' },
  description,
  keywords: [
    'CodeChat',
    'WhatsApp API',
    'OpenAPI',
    'Go',
    'REST API',
    'Webhook',
    'Mensagens',
    'WhatsApp Business',
    'Documentação',
  ],
  authors: [{ name: 'CodeChat' }],
  creator: 'CodeChat',
  publisher: 'CodeChat',
  applicationName: 'CodeChat API',
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'CodeChat API',
    title,
    description,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: 'API moderna para integrar WhatsApp a produtos, operações e automações.',
    images: [`${siteUrl}/og-image.png`],
  },
  other: {
    language: 'pt-BR',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <RootProvider
          search={{ enabled: false }}
          theme={{ defaultTheme: 'dark', enableSystem: true, storageKey: 'codechat-docs-theme' }}
          i18n={{ locale: 'pt-BR', translations: uiTranslations }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
