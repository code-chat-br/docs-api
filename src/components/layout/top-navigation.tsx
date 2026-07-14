'use client';

import { ExternalLink, GitFork, Languages, Menu, Moon, PanelRightClose, PanelRightOpen, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { GlobalSearch } from '@/components/global-search';
import { documentationConfig } from '@/config/documentation';

export function TopNavigation({
  onOpenMenu,
  rightCollapsed,
  onToggleRight,
}: {
  onOpenMenu: () => void;
  rightCollapsed: boolean;
  onToggleRight: () => void;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  return (
    <header className="reference-topbar">
      <div className="topbar-inner">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onOpenMenu}
          aria-label="Abrir navegação da documentação"
        >
          <Menu size={19} />
        </button>
        <Link className="topbar-brand" href="/" aria-label="CodeChat API — início">
          <BrandMark />
        </Link>
        <nav aria-label="Navegação principal">
          <Link
            className={pathname === '/' ? 'active' : ''}
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            Início
          </Link>
          <Link
            className={pathname.startsWith('/docs') ? 'active' : ''}
            href="/docs"
            aria-current={pathname.startsWith('/docs') ? 'page' : undefined}
          >
            Guias
          </Link>
          <Link
            className={pathname.startsWith('/api-reference') ? 'active' : ''}
            href="/api-reference"
            aria-current={pathname.startsWith('/api-reference') ? 'page' : undefined}
          >
            Referência da API
          </Link>
        </nav>
        <span className="version-badge">v{documentationConfig.version}</span>
        <div className="topbar-actions">
          <GlobalSearch />
          <Link className="topbar-link" href={documentationConfig.externalLinks.changelog}>
            Changelog
          </Link>
          <a
            className="topbar-link postman-link"
            href={documentationConfig.externalLinks.postman}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir a coleção oficial da CodeChat no Postman"
          >
            <ExternalLink size={14} />
            <span>Postman</span>
          </a>
          <a
            className="icon-button"
            href={documentationConfig.externalLinks.github}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir repositório da CodeChat no GitHub"
          >
            <GitFork size={17} />
          </a>
          <button
            className="language-button"
            type="button"
            aria-label="Idioma atual: Português do Brasil"
            title="Outros idiomas serão adicionados futuramente"
          >
            <Languages size={16} />
            <span>PT-BR</span>
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Alternar tema"
          >
            {mounted && resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="right-panel-toggle"
            type="button"
            onClick={onToggleRight}
            aria-label={rightCollapsed ? 'Exibir painel contextual' : 'Recolher painel contextual'}
          >
            {rightCollapsed ? <PanelRightOpen size={17} /> : <PanelRightClose size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}
