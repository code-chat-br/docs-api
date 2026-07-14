'use client';

import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { rankSearchEntries } from '@/features/search/search-index';

type SearchEntry = {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  method?: string;
  path?: string;
  search: string;
};

export function GlobalSearch() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    fetch('/search-index.json')
      .then((response) => response.json())
      .then((data: SearchEntry[]) => setEntries(data))
      .catch(() => setEntries([]));
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 20);
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return entries.filter((entry) => entry.type === 'ATUAL').slice(0, 8);
    return rankSearchEntries(entries, query).slice(0, 12);
  }, [entries, query]);
  const activeIndex = Math.min(selected, Math.max(results.length - 1, 0));

  function visit(href: string) {
    setOpen(false);
    setQuery('');
    setSelected(0);
    router.push(href);
  }

  function handleSearchKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((value) => Math.min(value + 1, results.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((value) => Math.max(value - 1, 0));
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      visit(results[activeIndex].href);
    }
  }

  return (
    <>
      <button
        className="search-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Pesquisar na documentação"
      >
        <Search size={15} aria-hidden="true" />
        <span>Pesquisar</span>
        <kbd>Ctrl K</kbd>
      </button>
      {open &&
        createPortal(
          <div className="search-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
            <section
              className="search-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Pesquisa global"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="search-field">
                <Search size={18} aria-hidden="true" />
                <input
                  ref={input}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelected(0);
                  }}
                  onKeyDown={handleSearchKey}
                  placeholder="Endpoint, evento, schema ou guia…"
                  aria-label="Termo de pesquisa"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="global-search-results"
                  aria-activedescendant={results[activeIndex] ? `search-option-${activeIndex}` : undefined}
                />
                <button type="button" onClick={() => setOpen(false)} aria-label="Fechar pesquisa">
                  <X size={18} />
                </button>
              </div>
              <div
                className="search-results"
                id="global-search-results"
                role="listbox"
                aria-label="Resultados da pesquisa"
                aria-live="polite"
              >
                {results.map((entry, index) => (
                  <button
                    key={entry.id}
                    id={`search-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    type="button"
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => visit(entry.href)}
                  >
                    <span className={`search-kind kind-${entry.type.toLowerCase()}`}>{entry.method || entry.type}</span>
                    <span className="min-w-0 flex-1 text-left">
                      <strong>{entry.title}</strong>
                      <small>{entry.path || entry.description}</small>
                    </span>
                  </button>
                ))}
                {!results.length && <p>Nenhum resultado para “{query}”.</p>}
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
