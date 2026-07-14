import { RootProvider } from 'fumadocs-ui/provider/next';
import '../styles/tokens.css';
import './global.css';
import './api-reference/reference.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { branding } from '@/config/branding';
import { uiTranslations } from '@/config/ui-translations';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(branding.siteUrl),
  title: { default: 'CodeChat API — Documentação', template: '%s | CodeChat API' },
  description: branding.description,
  applicationName: branding.name,
  icons: {
    icon: branding.logoPath,
    shortcut: branding.logoPath,
    apple: branding.logoPath,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: branding.name,
    title: 'CodeChat API — Documentação',
    description: branding.description,
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeChat API — Documentação',
    description: branding.description,
    images: ['/opengraph-image'],
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col font-sans">
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
