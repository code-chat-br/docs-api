'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

const maxGtagWaitAttempts = 50;

type GoogleTagPageViewTrackerProps = {
  id: string;
};

export function GoogleTagPageViewTracker({ id }: GoogleTagPageViewTrackerProps) {
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

      if (typeof window.gtag === 'function') {
        window.gtag('config', id, {
          page_path: currentPath,
          page_title: document.title,
          page_location: window.location.href,
        });
        lastTrackedPath.current = currentPath;
        return;
      }

      attempts += 1;

      if (attempts < maxGtagWaitAttempts) {
        retryTimer = window.setTimeout(trackPageView, 100);
      }
    }

    trackPageView();

    return () => {
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [currentPath, id, pathname]);

  return null;
}
