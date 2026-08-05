import { cleanup, render, waitFor } from '@testing-library/react';
import type { ScriptHTMLAttributes } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Analytics, AnalyticsNoscript, getAnalyticsConfig } from '@/components/analytics/analytics';
import { GoogleTagManagerPageViewTracker } from '@/components/analytics/google-tag-manager-page-view-tracker';
import { MetaPixelPageViewTracker } from '@/components/analytics/meta-pixel-page-view-tracker';

type MockScriptProps = ScriptHTMLAttributes<HTMLScriptElement> & {
  strategy?: string;
};

const navigationState = vi.hoisted(() => ({
  pathname: '/docs',
  search: '',
}));

vi.mock('next/script', () => ({
  default: ({ strategy: _strategy, ...props }: MockScriptProps) => <script {...props} />,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationState.pathname,
  useSearchParams: () => new URLSearchParams(navigationState.search),
}));

describe('analytics configuration', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    navigationState.pathname = '/docs';
    navigationState.search = '';
    window.fbq = undefined;
    window.dataLayer = undefined;
  });

  it('mantem analytics desabilitado quando a configuracao explicita estiver falsa', () => {
    const config = getAnalyticsConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'false',
      NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: 'GTM-TEST',
      NEXT_PUBLIC_META_PIXEL_ID: 'PIXEL-TEST',
    });

    expect(config).toEqual({
      enabled: false,
      googleTagManagerId: '',
      metaPixelId: '',
    });
  });

  it('nao renderiza scripts nem fallbacks quando analytics estiver desabilitado', () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID', 'GTM-TEST');
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', 'PIXEL-TEST');

    const { container } = render(
      <>
        <AnalyticsNoscript />
        <Analytics />
      </>,
    );

    expect(container.querySelector('#google-tag-manager')).not.toBeInTheDocument();
    expect(container.querySelector('#meta-pixel')).not.toBeInTheDocument();
    expect(container.querySelector('iframe[src*="googletagmanager"]')).not.toBeInTheDocument();
    expect(container.querySelector('img[src*="facebook.com/tr"]')).not.toBeInTheDocument();
  });

  it('renderiza GTM, Meta Pixel e fallbacks quando analytics estiver habilitado', () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID', 'GTM-TEST');
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', 'PIXEL-TEST');

    const { container } = render(
      <>
        <AnalyticsNoscript />
        <Analytics />
      </>,
    );

    expect(container.querySelector('#google-tag-manager')?.textContent).toContain('googletagmanager.com/gtm.js');
    expect(container.querySelector('#google-tag-manager')?.textContent).toContain('GTM-TEST');
    expect(container.querySelector('#meta-pixel')?.textContent).toContain('connect.facebook.net/en_US/fbevents.js');
    expect(container.querySelector('#meta-pixel')?.textContent).toContain('PIXEL-TEST');

    const noscriptMarkup = renderToStaticMarkup(<AnalyticsNoscript />);
    expect(noscriptMarkup).toContain('https://www.googletagmanager.com/ns.html?id=GTM-TEST');
    expect(noscriptMarkup).toContain('https://www.facebook.com/tr?id=PIXEL-TEST');
  });

  it('envia PageView do Meta Pixel em mudancas de rota sem duplicar o carregamento inicial', async () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    const { rerender } = render(<MetaPixelPageViewTracker />);

    expect(fbq).not.toHaveBeenCalled();

    navigationState.pathname = '/docs/authentication';
    rerender(<MetaPixelPageViewTracker />);

    await waitFor(() => expect(fbq).toHaveBeenCalledTimes(1));
    expect(fbq).toHaveBeenLastCalledWith('track', 'PageView');

    rerender(<MetaPixelPageViewTracker />);
    expect(fbq).toHaveBeenCalledTimes(1);

    navigationState.search = 'tab=headers';
    rerender(<MetaPixelPageViewTracker />);

    await waitFor(() => expect(fbq).toHaveBeenCalledTimes(2));
  });

  it('envia page_view para o dataLayer em mudancas de rota sem duplicar o carregamento inicial', async () => {
    document.title = 'CodeChat Docs';
    window.history.replaceState(null, '', '/docs');
    window.dataLayer = [];

    const { rerender } = render(<GoogleTagManagerPageViewTracker />);

    expect(window.dataLayer).toHaveLength(0);

    navigationState.pathname = '/docs/messages';
    navigationState.search = 'filter=api';
    window.history.replaceState(null, '', '/docs/messages?filter=api');
    rerender(<GoogleTagManagerPageViewTracker />);

    await waitFor(() => expect(window.dataLayer).toHaveLength(1));
    expect(window.dataLayer?.[0]).toMatchObject({
      event: 'page_view',
      page_path: '/docs/messages?filter=api',
      page_title: 'CodeChat Docs',
      page_location: 'http://localhost:3000/docs/messages?filter=api',
    });

    rerender(<GoogleTagManagerPageViewTracker />);
    expect(window.dataLayer).toHaveLength(1);
  });
});
