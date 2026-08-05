import { Suspense } from 'react';
import { GoogleTag } from './google-tag';
import { GoogleTagPageViewTracker } from './google-tag-page-view-tracker';
import { MetaPixel, MetaPixelNoscript } from './meta-pixel';
import { MetaPixelPageViewTracker } from './meta-pixel-page-view-tracker';

type AnalyticsEnv = {
  NEXT_PUBLIC_ANALYTICS_ENABLED?: string;
  NEXT_PUBLIC_GOOGLE_TAG_ID?: string;
  NEXT_PUBLIC_META_PIXEL_ID?: string;
  NODE_ENV?: string;
};

export type AnalyticsConfig = {
  enabled: boolean;
  googleTagId: string;
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
    googleTagId: enabled ? (env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim() ?? '') : '',
    metaPixelId: enabled ? (env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? '') : '',
  };
}

export function Analytics() {
  const config = getAnalyticsConfig();

  return (
    <>
      <GoogleTag id={config.googleTagId} />
      <MetaPixel id={config.metaPixelId} />
      {config.googleTagId ? (
        <Suspense fallback={null}>
          <GoogleTagPageViewTracker id={config.googleTagId} />
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
      <MetaPixelNoscript id={config.metaPixelId} />
    </>
  );
}
