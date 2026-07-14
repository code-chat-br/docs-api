'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { OpenApiProvider } from '@/features/openapi/openapi-context';
import type { ReferenceSpec, WebhookCatalog } from '@/features/openapi/openapi-types';
import type { GuideNavigationGroup } from '@/lib/navigation';
import { RightPanel } from './right-panel';
import { Sidebar } from './sidebar';
import { TopNavigation } from './top-navigation';

export type DocumentationTocItem = {
  title: string;
  url: string;
  depth: number;
};

export type DocumentationContext = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function DocumentationShell({
  spec,
  webhooks,
  guideNavigation,
  toc = [],
  context,
  children,
}: {
  spec: ReferenceSpec;
  webhooks: WebhookCatalog;
  guideNavigation: GuideNavigationGroup[];
  toc?: DocumentationTocItem[];
  context?: DocumentationContext;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const active = useMemo(() => {
    if (pathname === '/api-reference') return { id: '/api-reference' };
    if (pathname === '/api-reference/webhooks') return { id: '/api-reference/webhooks' };
    if (pathname.startsWith('/api-reference/webhooks/')) {
      const name = decodeURIComponent(pathname.slice('/api-reference/webhooks/'.length));
      return { id: `webhook:${name}`, event: webhooks.events.find((entry) => entry.name === name) };
    }
    if (pathname.startsWith('/api-reference/')) {
      const id = decodeURIComponent(pathname.slice('/api-reference/'.length));
      return { id, operation: spec.operations.find((operation) => operation.id === id) };
    }
    return { id: pathname };
  }, [pathname, spec.operations, webhooks.events]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <OpenApiProvider spec={spec} webhooks={webhooks}>
      <div
        className={`documentation-app${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}${rightCollapsed ? ' right-is-collapsed' : ''}`}
        data-surface={pathname.startsWith('/api-reference') ? 'api' : pathname === '/' ? 'home' : 'guides'}
      >
        <TopNavigation
          onOpenMenu={() => setMobileOpen(true)}
          rightCollapsed={rightCollapsed}
          onToggleRight={() => setRightCollapsed((value) => !value)}
        />
        <div className="documentation-frame">
          <div className="reference-grid">
            <Sidebar
              spec={spec}
              webhooks={webhooks}
              guideNavigation={guideNavigation}
              activeId={active.id}
              mobileOpen={mobileOpen}
              collapsed={sidebarCollapsed}
              onCloseMobile={() => setMobileOpen(false)}
              onCollapse={() => setSidebarCollapsed(true)}
            />
            {sidebarCollapsed && (
              <button type="button" className="sidebar-expand" onClick={() => setSidebarCollapsed(false)}>
                Mostrar menu
              </button>
            )}
            <main className="reference-content" id="reference-content">
              {children}
            </main>
            <RightPanel
              spec={spec}
              operation={active.operation}
              event={active.event}
              eventCount={webhooks.total}
              toc={toc}
              context={context}
              collapsed={rightCollapsed}
              onExpand={() => setRightCollapsed(false)}
            />
          </div>
        </div>
      </div>
    </OpenApiProvider>
  );
}
