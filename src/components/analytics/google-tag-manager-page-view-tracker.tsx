'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

export function GoogleTagManagerPageViewTracker() {
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

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      page_path: currentPath,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [currentPath, pathname]);

  return null;
}
