import { RootProvider } from 'fumadocs-ui/provider/next';
import '../styles/tokens.css';
import './global.css';
import './api-reference/reference.css';
import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { Analytics, AnalyticsNoscript } from '@/components/analytics/analytics';
import { JsonLd } from '@/components/seo/json-ld';
import { uiTranslations } from '@/config/ui-translations';
import { createRootJsonLd, createRootMetadata } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = createRootMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#05070b' },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col font-sans">
        <AnalyticsNoscript />
        <JsonLd data={createRootJsonLd()} />
        <Analytics />
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
