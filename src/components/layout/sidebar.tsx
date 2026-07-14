'use client';

import { BookOpen, Braces, ChevronLeft, ExternalLink, Search, Webhook, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { MethodBadge } from '@/components/api/method-badge';
import { documentationConfig } from '@/config/documentation';
import type { ReferenceSpec, WebhookCatalog } from '@/features/openapi/openapi-types';
import type { GuideNavigationGroup } from '@/lib/navigation';

type NavigationSurface = 'guides' | 'api';

export function Sidebar({
  spec,
  webhooks,
  guideNavigation,
  activeId,
  mobileOpen,
  collapsed,
  onCloseMobile,
  onCollapse,
}: {
  spec: ReferenceSpec;
  webhooks: WebhookCatalog;
  guideNavigation: GuideNavigationGroup[];
  activeId?: string;
  mobileOpen: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
  onCollapse: () => void;
}) {
  const pathname = usePathname();
  const defaultSurface: NavigationSurface = pathname.startsWith('/api-reference') ? 'api' : 'guides';
  const [surfaceState, setSurfaceState] = useState<{ pathname: string; value: NavigationSurface }>({
    pathname,
    value: defaultSurface,
  });
  const [queryState, setQueryState] = useState({ pathname, value: '' });
  const surface = surfaceState.pathname === pathname ? surfaceState.value : defaultSurface;
  const query = queryState.pathname === pathname ? queryState.value : '';
  const normalized = query.toLowerCase().trim();

  const visibleGuides = useMemo(
    () =>
      guideNavigation
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) => !normalized || `${item.title} ${item.description || ''}`.toLowerCase().includes(normalized),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [guideNavigation, normalized],
  );
  const visibleTags = useMemo(
    () =>
      spec.tags
        .map((tag) => ({
          ...tag,
          operations: tag.operations.filter(
            (operation) =>
              !normalized ||
              `${operation.method} ${operation.path} ${operation.summary} ${operation.id}`
                .toLowerCase()
                .includes(normalized),
          ),
        }))
        .filter((tag) => tag.operations.length),
    [normalized, spec.tags],
  );
  const visibleEvents = webhooks.events.filter(
    (event) => !normalized || `${event.name} ${event.description} ${event.flag}`.toLowerCase().includes(normalized),
  );

  function chooseSurface(next: NavigationSurface) {
    setSurfaceState({ pathname, value: next });
    setQueryState({ pathname, value: '' });
  }

  return (
    <>
      {mobileOpen && (
        <button type="button" className="sidebar-backdrop" onClick={onCloseMobile} aria-label="Fechar navegação" />
      )}
      <aside
        className={`reference-sidebar${mobileOpen ? ' mobile-open' : ''}${collapsed ? ' collapsed' : ''}`}
        aria-label="Navegação da documentação"
      >
        <div className="sidebar-heading">
          <div>
            <strong>CodeChat API</strong>
            <span>v{spec.version}</span>
          </div>
          <button type="button" className="mobile-close" onClick={onCloseMobile} aria-label="Fechar navegação">
            <X size={18} />
          </button>
          <button type="button" className="desktop-collapse" onClick={onCollapse} aria-label="Recolher barra lateral">
            <ChevronLeft size={17} />
          </button>
        </div>

        <div className="sidebar-switcher" role="tablist" aria-label="Área da documentação">
          <button
            type="button"
            role="tab"
            aria-selected={surface === 'guides'}
            className={surface === 'guides' ? 'active' : ''}
            onClick={() => chooseSurface('guides')}
          >
            <BookOpen size={14} /> Guias
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={surface === 'api'}
            className={surface === 'api' ? 'active' : ''}
            onClick={() => chooseSurface('api')}
          >
            <Braces size={14} /> API
          </button>
        </div>

        <label className="sidebar-search">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Filtrar navegação</span>
          <input
            value={query}
            onChange={(event) => setQueryState({ pathname, value: event.target.value })}
            placeholder={surface === 'guides' ? 'Filtrar guias…' : 'Filtrar endpoints…'}
          />
        </label>

        <div className="sidebar-scroll">
          {surface === 'guides' &&
            visibleGuides.map((group) => (
              <details className="sidebar-group" key={group.title} open>
                <summary>
                  {group.title}
                  <span>{group.items.length}</span>
                </summary>
                <div>
                  {group.items.map((item) => {
                    const current = activeId === item.href.split('#')[0];
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={current ? 'active' : ''}
                        aria-current={current ? 'page' : undefined}
                        onClick={onCloseMobile}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </details>
            ))}

          {surface === 'api' && !normalized && (
            <details className="sidebar-group" open>
              <summary>
                <BookOpen size={15} /> Comece aqui
              </summary>
              <div>
                {documentationConfig.introductionPages.map((page) => {
                  const current = activeId === page.href.split('#')[0];
                  return (
                    <Link
                      key={page.href}
                      href={page.href}
                      className={current ? 'active' : ''}
                      aria-current={current ? 'page' : undefined}
                      onClick={onCloseMobile}
                    >
                      {page.title}
                    </Link>
                  );
                })}
              </div>
            </details>
          )}

          {surface === 'api' &&
            visibleTags.map((tag) => (
              <details className="sidebar-group" key={tag.name} open={!tag.name.startsWith('Legacy')}>
                <summary>
                  {tag.name}
                  <span>{tag.operations.length}</span>
                </summary>
                <div>
                  {tag.operations.map((operation) => (
                    <Link
                      key={operation.id}
                      href={`/api-reference/${operation.id}`}
                      className={activeId === operation.id ? 'active endpoint-link' : 'endpoint-link'}
                      aria-current={activeId === operation.id ? 'page' : undefined}
                      onClick={onCloseMobile}
                    >
                      <MethodBadge method={operation.method} compact />
                      <span>{operation.summary}</span>
                      {operation.plan === 'pro' && <i className="sidebar-plan">PRO</i>}
                    </Link>
                  ))}
                </div>
              </details>
            ))}

          {surface === 'api' && visibleEvents.length > 0 && (
            <details className="sidebar-group" open={!normalized}>
              <summary>
                <Webhook size={15} /> Eventos de webhook <span>{visibleEvents.length}</span>
              </summary>
              <div>
                <Link
                  href="/api-reference/webhooks"
                  className={activeId === '/api-reference/webhooks' ? 'active' : ''}
                  aria-current={activeId === '/api-reference/webhooks' ? 'page' : undefined}
                  onClick={onCloseMobile}
                >
                  Visão geral
                </Link>
                {visibleEvents.map((event) => (
                  <Link
                    key={event.name}
                    href={`/api-reference/webhooks/${encodeURIComponent(event.name)}`}
                    className={activeId === `webhook:${event.name}` ? 'active webhook-link' : 'webhook-link'}
                    aria-current={activeId === `webhook:${event.name}` ? 'page' : undefined}
                    onClick={onCloseMobile}
                  >
                    <span className="event-dot" />
                    <span>{event.name}</span>
                    {event.kind === 'batch' && <i className="sidebar-plan">PRO</i>}
                  </Link>
                ))}
              </div>
            </details>
          )}

          {surface === 'guides' && normalized && !visibleGuides.length && (
            <p className="sidebar-empty">Nenhum guia encontrado.</p>
          )}
          {surface === 'api' && normalized && !visibleTags.length && !visibleEvents.length && (
            <p className="sidebar-empty">Nenhum item encontrado.</p>
          )}
        </div>

        <div className="sidebar-resources">
          <a href={documentationConfig.externalLinks.postman} target="_blank" rel="noreferrer">
            <span>
              <strong>Postman</strong>
              <small>Coleção oficial · Go v1.0.0</small>
            </span>
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
      </aside>
    </>
  );
}
