'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

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

    if (lastTrackedPath.current === null) {
      lastTrackedPath.current = currentPath;
      return;
    }

    if (lastTrackedPath.current === currentPath) return;

    lastTrackedPath.current = currentPath;

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [currentPath, pathname]);

  return null;
}
