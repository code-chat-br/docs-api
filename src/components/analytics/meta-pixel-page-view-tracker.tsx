'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

const maxFbqWaitAttempts = 50;

export function MetaPixelPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  const currentPath = useMemo(() => {
    const queryString = searchParams.toString();
    return `${pathname ?? ''}${queryString ? `?${queryString}` : ''}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!pathname) return;

    let attempts = 0;
    let retryTimer: number | undefined;

    function trackPageView() {
      if (lastTrackedPath.current === currentPath) return;

      if (typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
        lastTrackedPath.current = currentPath;
        return;
      }

      attempts += 1;

      if (attempts < maxFbqWaitAttempts) {
        retryTimer = window.setTimeout(trackPageView, 100);
      }
    }

    trackPageView();

    return () => {
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [currentPath, pathname]);

  return null;
}
