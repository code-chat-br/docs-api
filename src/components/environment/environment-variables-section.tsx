'use client';

import { useEffect, useMemo, useState } from 'react';
import { environmentVariables as defaultEnvironmentVariables } from './environment-variables-data';
import { getEnvironmentTypeLabel } from './environment-variable-badges';
import { EnvironmentVariableGroup } from './environment-variable-group';
import { EnvironmentVariablesToolbar, type EnvironmentRequiredFilter } from './environment-variables-toolbar';
import {
  environmentDescriptionToText,
  environmentValueToString,
  type EnvironmentVariable,
} from './environment-variables-types';

const categoryOrder = [
  'Aplicação',
  'Banco de dados',
  'WhatsApp e sessão',
  'Autenticação',
  'Webhooks',
  'WebSocket',
  'Message Batch',
  'Mídias',
  'Logs e observabilidade',
];

function normalizeSearch(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

function getSearchText(variable: EnvironmentVariable) {
  return normalizeSearch(
    [
      variable.name,
      variable.category,
      getEnvironmentTypeLabel(variable.type),
      variable.defaultValue !== undefined ? environmentValueToString(variable.defaultValue) : '',
      variable.example !== undefined ? environmentValueToString(variable.example) : '',
      environmentDescriptionToText(variable.description),
    ].join(' '),
  );
}

function groupVariables(variables: readonly EnvironmentVariable[]) {
  const categories = Array.from(new Set(variables.map((variable) => variable.category))).sort((left, right) => {
    const leftIndex = categoryOrder.indexOf(left);
    const rightIndex = categoryOrder.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right, 'pt-BR');
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });

  return categories.map((category) => ({
    category,
    variables: variables.filter((variable) => variable.category === category),
  }));
}

export function EnvironmentVariablesSection({
  variables = defaultEnvironmentVariables,
}: {
  variables?: readonly EnvironmentVariable[];
}) {
  const [query, setQuery] = useState('');
  const [requiredFilter, setRequiredFilter] = useState<EnvironmentRequiredFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [closedCategories, setClosedCategories] = useState<Set<string>>(() => new Set());
  const [highlightedSlug, setHighlightedSlug] = useState<string>();

  const categories = useMemo(() => groupVariables(variables).map((group) => group.category), [variables]);
  const searchIndex = useMemo(() => new Map(variables.map((variable) => [variable.slug, getSearchText(variable)])), [variables]);
  const normalizedQuery = normalizeSearch(query);
  const filteredVariables = useMemo(
    () =>
      variables.filter((variable) => {
        if (requiredFilter === 'required' && !variable.required) return false;
        if (requiredFilter === 'optional' && variable.required) return false;
        if (categoryFilter !== 'all' && variable.category !== categoryFilter) return false;
        if (normalizedQuery && !searchIndex.get(variable.slug)?.includes(normalizedQuery)) return false;
        return true;
      }),
    [categoryFilter, normalizedQuery, requiredFilter, searchIndex, variables],
  );
  const groups = useMemo(() => groupVariables(filteredVariables), [filteredVariables]);

  useEffect(() => {
    function openHashTarget() {
      const slug = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      if (!slug) return;

      const variable = variables.find((entry) => entry.slug === slug);
      if (!variable) return;

      setClosedCategories((current) => {
        const next = new Set(current);
        next.delete(variable.category);
        return next;
      });
      setCategoryFilter((current) => (current !== 'all' && current !== variable.category ? 'all' : current));
      setRequiredFilter((current) => {
        if (current === 'required' && !variable.required) return 'all';
        if (current === 'optional' && variable.required) return 'all';
        return current;
      });
      setQuery('');
      setHighlightedSlug(slug);
      window.setTimeout(() => {
        document.getElementById(slug)?.scrollIntoView({ block: 'start' });
      }, 0);
      window.setTimeout(() => setHighlightedSlug(undefined), 2200);
    }

    openHashTarget();
    window.addEventListener('hashchange', openHashTarget);
    return () => window.removeEventListener('hashchange', openHashTarget);
  }, [variables]);

  function toggleCategory(category: string) {
    setClosedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <section className="environment-variables-section" aria-labelledby="environment-variables-title">
      <h2 id="environment-variables-title">Variáveis de ambiente</h2>
      <EnvironmentVariablesToolbar
        query={query}
        requiredFilter={requiredFilter}
        categoryFilter={categoryFilter}
        categories={categories}
        resultCount={filteredVariables.length}
        totalCount={variables.length}
        onQueryChange={setQuery}
        onRequiredFilterChange={setRequiredFilter}
        onCategoryFilterChange={setCategoryFilter}
        onClearQuery={() => setQuery('')}
      />

      {groups.length ? (
        <div className="environment-variables-list">
          {groups.map((group) => (
            <EnvironmentVariableGroup
              key={group.category}
              category={group.category}
              variables={group.variables}
              open={!closedCategories.has(group.category)}
              highlightedSlug={highlightedSlug}
              onToggle={() => toggleCategory(group.category)}
            />
          ))}
        </div>
      ) : (
        <p className="environment-variables-empty">Nenhuma variável encontrada para os filtros selecionados.</p>
      )}
    </section>
  );
}
