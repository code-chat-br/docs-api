import { cleanup, render, waitFor } from '@testing-library/react';
import type { ScriptHTMLAttributes } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Analytics, AnalyticsNoscript, getAnalyticsConfig } from '@/components/analytics/analytics';
import { GoogleTagPageViewTracker } from '@/components/analytics/google-tag-page-view-tracker';
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
    window.gtag = undefined;
    window.dataLayer = undefined;
  });

  it('mantem analytics desabilitado quando a configuracao explicita estiver falsa', () => {
    const config = getAnalyticsConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'false',
      NEXT_PUBLIC_GOOGLE_TAG_ID: 'G-TEST',
      NEXT_PUBLIC_META_PIXEL_ID: 'PIXEL-TEST',
    });

    expect(config).toEqual({
      enabled: false,
      googleTagId: '',
      metaPixelId: '',
    });
  });

  it('nao renderiza scripts nem fallbacks quando analytics estiver desabilitado', () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', 'G-TEST');
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', 'PIXEL-TEST');

    const { container } = render(
      <>
        <AnalyticsNoscript />
        <Analytics />
      </>,
    );

    expect(container.querySelector('#google-tag')).not.toBeInTheDocument();
    expect(container.querySelector('#google-tag-loader')).not.toBeInTheDocument();
    expect(container.querySelector('#meta-pixel')).not.toBeInTheDocument();
    expect(container.querySelector('iframe[src*="googletagmanager"]')).not.toBeInTheDocument();
    expect(container.querySelector('img[src*="facebook.com/tr"]')).not.toBeInTheDocument();
  });

  it('renderiza Google tag, Meta Pixel e fallbacks quando analytics estiver habilitado', () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', 'G-TEST');
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', 'PIXEL-TEST');

    const { container } = render(
      <>
        <AnalyticsNoscript />
        <Analytics />
      </>,
    );

    expect(document.querySelector('#google-tag-loader')).toHaveAttribute(
      'src',
      'https://www.googletagmanager.com/gtag/js?id=G-TEST',
    );
    expect(document.querySelector('#google-tag-loader')).toHaveAttribute('async');
    expect(container.querySelector('#google-tag')?.textContent).toContain('window.dataLayer = window.dataLayer || []');
    expect(container.querySelector('#google-tag')?.textContent).toContain(`gtag('js', new Date())`);
    expect(container.querySelector('#google-tag')?.textContent).not.toContain(`gtag('config', "G-TEST")`);
    expect(container.querySelector('#meta-pixel')?.textContent).toContain('connect.facebook.net/en_US/fbevents.js');
    expect(container.querySelector('#meta-pixel')?.textContent).toContain('PIXEL-TEST');
    expect(container.querySelector('#meta-pixel')?.textContent).toContain(`fbq('init', "PIXEL-TEST")`);
    expect(container.querySelector('#meta-pixel')?.textContent).not.toContain(`fbq('track', 'PageView')`);

    const noscriptMarkup = renderToStaticMarkup(<AnalyticsNoscript />);
    expect(noscriptMarkup).not.toContain('googletagmanager');
    expect(noscriptMarkup).toContain('https://www.facebook.com/tr?id=PIXEL-TEST');
  });

  it('envia PageView inicial e mudancas de rota do Meta Pixel sem duplicar', async () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    const { rerender } = render(<MetaPixelPageViewTracker />);

    await waitFor(() => expect(fbq).toHaveBeenCalledTimes(1));
    expect(fbq).toHaveBeenLastCalledWith('track', 'PageView');

    rerender(<MetaPixelPageViewTracker />);
    expect(fbq).toHaveBeenCalledTimes(1);

    navigationState.pathname = '/docs/authentication';
    rerender(<MetaPixelPageViewTracker />);

    await waitFor(() => expect(fbq).toHaveBeenCalledTimes(2));
    expect(fbq).toHaveBeenLastCalledWith('track', 'PageView');

    rerender(<MetaPixelPageViewTracker />);
    expect(fbq).toHaveBeenCalledTimes(2);

    navigationState.search = 'tab=headers';
    rerender(<MetaPixelPageViewTracker />);

    await waitFor(() => expect(fbq).toHaveBeenCalledTimes(3));
  });

  it('aguarda o fbq estar disponivel antes de enviar o PageView inicial', async () => {
    const { unmount } = render(<MetaPixelPageViewTracker />);
    const fbq = vi.fn();

    window.fbq = fbq;

    await waitFor(() => expect(fbq).toHaveBeenCalledTimes(1));
    expect(fbq).toHaveBeenLastCalledWith('track', 'PageView');

    unmount();
  });

  it('envia config inicial e mudancas de rota para o gtag sem duplicar', async () => {
    document.title = 'CodeChat Docs';
    window.history.replaceState(null, '', '/docs');
    const gtag = vi.fn();
    window.gtag = gtag;

    const { rerender } = render(<GoogleTagPageViewTracker id="G-TEST" />);

    await waitFor(() => expect(gtag).toHaveBeenCalledTimes(1));
    expect(gtag).toHaveBeenLastCalledWith('config', 'G-TEST', {
      page_path: '/docs',
      page_title: 'CodeChat Docs',
      page_location: 'http://localhost:3000/docs',
    });

    rerender(<GoogleTagPageViewTracker id="G-TEST" />);
    expect(gtag).toHaveBeenCalledTimes(1);

    navigationState.pathname = '/docs/messages';
    navigationState.search = 'filter=api';
    window.history.replaceState(null, '', '/docs/messages?filter=api');
    rerender(<GoogleTagPageViewTracker id="G-TEST" />);

    await waitFor(() => expect(gtag).toHaveBeenCalledTimes(2));
    expect(gtag).toHaveBeenLastCalledWith('config', 'G-TEST', {
      page_path: '/docs/messages?filter=api',
      page_title: 'CodeChat Docs',
      page_location: 'http://localhost:3000/docs/messages?filter=api',
    });

    rerender(<GoogleTagPageViewTracker id="G-TEST" />);
    expect(gtag).toHaveBeenCalledTimes(2);
  });

  it('aguarda o gtag estar disponivel antes de enviar o config inicial', async () => {
    document.title = 'CodeChat Docs';
    window.history.replaceState(null, '', '/docs');

    const { unmount } = render(<GoogleTagPageViewTracker id="G-TEST" />);
    const gtag = vi.fn();

    window.gtag = gtag;

    await waitFor(() => expect(gtag).toHaveBeenCalledTimes(1));
    expect(gtag).toHaveBeenLastCalledWith('config', 'G-TEST', {
      page_path: '/docs',
      page_title: 'CodeChat Docs',
      page_location: 'http://localhost:3000/docs',
    });

    unmount();
  });
});
