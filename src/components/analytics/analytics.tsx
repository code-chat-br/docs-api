import { Suspense } from 'react';
import { GoogleTagManager, GoogleTagManagerNoscript } from './google-tag-manager';
import { GoogleTagManagerPageViewTracker } from './google-tag-manager-page-view-tracker';
import { MetaPixel, MetaPixelNoscript } from './meta-pixel';
import { MetaPixelPageViewTracker } from './meta-pixel-page-view-tracker';

type AnalyticsEnv = {
  NEXT_PUBLIC_ANALYTICS_ENABLED?: string;
  NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?: string;
  NEXT_PUBLIC_META_PIXEL_ID?: string;
  NODE_ENV?: string;
};

export type AnalyticsConfig = {
  enabled: boolean;
  googleTagManagerId: string;
  metaPixelId: string;
};

function isAnalyticsEnabled(env: AnalyticsEnv): boolean {
  const explicitValue = env.NEXT_PUBLIC_ANALYTICS_ENABLED?.trim().toLowerCase();

  if (explicitValue) {
    return explicitValue === 'true';
  }

  return env.NODE_ENV === 'production';
}

export function getAnalyticsConfig(env: AnalyticsEnv = process.env): AnalyticsConfig {
  const enabled = isAnalyticsEnabled(env);

  return {
    enabled,
    googleTagManagerId: enabled ? (env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?.trim() ?? '') : '',
    metaPixelId: enabled ? (env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? '') : '',
  };
}

export function Analytics() {
  const config = getAnalyticsConfig();

  return (
    <>
      <GoogleTagManager id={config.googleTagManagerId} />
      <MetaPixel id={config.metaPixelId} />
      {config.googleTagManagerId ? (
        <Suspense fallback={null}>
          <GoogleTagManagerPageViewTracker />
        </Suspense>
      ) : null}
      {config.metaPixelId ? (
        <Suspense fallback={null}>
          <MetaPixelPageViewTracker />
        </Suspense>
      ) : null}
    </>
  );
}

export function AnalyticsNoscript() {
  const config = getAnalyticsConfig();

  return (
    <>
      <GoogleTagManagerNoscript id={config.googleTagManagerId} />
      <MetaPixelNoscript id={config.metaPixelId} />
    </>
  );
}
